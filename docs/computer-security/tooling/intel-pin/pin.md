# Intel-Pin Windows开发环境搭建

下载链接：https://www.intel.com/content/www/us/en/developer/articles/tool/pin-a-binary-instrumentation-tool-downloads.html

Windows* (LLVM clang-cl)
IA32 and intel64 (x86 32 bit and 64 bit)

下载Kit。

由于需要使用 clang-cl 来编译 Pintool，仅仅安装了“使用 C++ 的桌面开发”是不够的。还需要在 Visual Studio 2026 中补充 Clang 组件：

- 打开 Visual Studio Installer，点击 “修改”。

- 在右侧的“安装详细信息”列表中，展开 “使用 C++ 的桌面开发”。

- 勾选 “适用于 Windows 的 C++ Clang 工具” (C++ Clang tools for Windows) 和 “对 LLVM (clang-cl) 工具集的 MSBuild 支持”。

- 点击修改并安装。

安装完成后，Pin 的 GNU Make 脚本会在你调用 make 时，自动在 VS 的目录下找到并使用 clang-cl.exe 来编译你的 DLL，从而避免莫名其妙的底层链接错误。

进入`{Pin主目录}\source\tools\MyPinTool`目录下，使用 Visual Studio 2026 打开 `MyPinTool-clang.vcxproj`，之后正常修改代码编译即可。