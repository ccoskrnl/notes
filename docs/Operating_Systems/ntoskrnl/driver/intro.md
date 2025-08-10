
# Windows 驱动开发基础

驱动程序通过**主功能函数 (Major Functions)** 提供输入/输出 (I/O) 例程。Windows 驱动开发套件 (WDK) 定义了 28 种主功能函数，包括：
- 设备创建 (`IRP_MJ_CREATE`)
- 关闭 (`IRP_MJ_CLOSE`)
- 电源管理 (`IRP_MJ_POWER`)
- I/O 控制 (`IRP_MJ_DEVICE_CONTROL`)
- 读/写 (`IRP_MJ_READ`/`IRP_MJ_WRITE`)
- 信息查询/设置 (`IRP_MJ_QUERY_INFORMATION`/`IRP_MJ_SET_INFORMATION`)
- 系统关机 (`IRP_MJ_SHUTDOWN`)  
*(补充：其他主函数如清理`IRP_MJ_CLEANUP`、即插即用`IRP_MJ_PNP`等)*

当驱动程序初始化时，其 **_DRIVER_OBJECT** 结构体会注册这些主功能的处理例程。该结构包含驱动关键信息：
- 驱动名称
- 关联设备的链表
- 卸载回调函数（响应驱动卸载请求）
- 驱动的内存边界（起始地址与大小）

驱动程序可创建 **_DEVICE_OBJECT** 结构体表示其管理的设备。**设备不一定对应真实硬件**（补充：例如虚拟设备）。以 Sysinternals Process Explorer 为例：
1. 工具启动时加载微软签名的驱动
2. 通过用户态 API 与驱动通信
3. 驱动创建**用户态可访问的设备对象**
4. 内核 I/O 系统将用户请求派发到设备所属驱动的对应主功能处理例程

---

### 主功能处理机制
主功能代码是 WDK 头文件中定义的整型常量，符号名均以 **`IRP_MJ_`** 开头（如 `IRP_MJ_DEVICE_CONTROL=14`）。它们在 **_DRIVER_OBJECT** 的主功能数组中的偏移量从 **0x70** 开始。主功能处理例程（亦称驱动分发例程）原型如下：

```c
NTSTATUS DriverDispatch(
    _DEVICE_OBJECT *DeviceObject, // 目标设备对象
    _IRP *Irp                     // I/O请求包
)
{ ... }
```

---

### I/O 请求包 (IRP) 解析
IRP 描述对设备的 I/O 请求，关键字段包括：
1. **`AssociatedIrp.SystemBuffer`**  
   - 通常包含请求的输入/输出缓冲区
   - *(补充：适用于缓冲I/O模式，内核会复制用户态数据)*

2. **`Tail.Overlay.CurrentStackLocation`**  
   - 指向当前设备栈层的 **_IO_STACK_LOCATION** 结构
   - 包含**设备相关**的请求信息：
     - **`MajorFunction`**：当前主功能代码（如 `IRP_MJ_DEVICE_CONTROL`）
     - **`Parameters`**：根据主功能变化的联合体

---

### 设备控制请求 (IOCTL) 专项说明
当 `MajorFunction = IRP_MJ_DEVICE_CONTROL (14)` 时：
- **`Parameters.DeviceIoControl`** 子结构生效：
  ```c
  struct {
    ULONG IoControlCode;  // IOCTL控制码
    PVOID InputBuffer;    // 输入缓冲区地址
    ULONG InputBufferLength;
    PVOID OutputBuffer;   // 输出缓冲区地址
    ULONG OutputBufferLength;
  }
  ```
- **输入/输出缓冲区**通常通过 `Irp->AssociatedIrp.SystemBuffer` 传递  
  *(补充：直接I/O模式使用`Irp->MdlAddress`映射物理内存)*

---

### IOCTL 控制码深度解析
IOCTL 代码是 32 位位掩码，包含四部分信息（以 `0x222000` 为例）：
```c
CTL_CODE(DeviceType, Function, Method, Access)
```
| 字段          | 位域     | 示例值 | 说明                     |
|---------------|----------|--------|--------------------------|
| **设备类型**  | 31-16    | 0x22   | 自定义设备类型标识符      |
| **功能代码**  | 15-2     | 0x200  | 操作编号（0x800+为自定义）|
| **缓冲方式**  | 1-0      | 0x00   | `METHOD_BUFFERED`(0) 最常用 |
| **访问权限**  | 31-30    | 0x2    | `FILE_WRITE_ACCESS`(2)   |

*(补充：缓冲方式决定了内核如何传递用户态数据，METHOD_IN_DIRECT等模式需配合MDL使用)*

> 完整 IOCTL 规范参考：[Microsoft Docs - Defining I/O Control Codes](https://docs.microsoft.com/en-us/windows-hardware/drivers/kernel/defining-i-o-control-codes)
