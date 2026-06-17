# Build EDK2 development environment

Clone edk2 repository:
```bash
git clone https://github.com/tianocore/edk2.git
```

After clone completed successfully, we need to build BaseTools. Before building, we must to update submodules. In edk2 directory, 

```bash
git submodule update --init
```

then build BaseTools.

```bash
make -C BaseTools
```

Set environment variables for building, it will generate some configuration files in `Conf` directory.

```bash
export EDK_TOOLS_PATH=$HOME/src/edk2/BaseTools
source edksetup.sh BaseTools
```

Modify `Conf/target.txt`, according to the following example:
```
ACTIVE_PLATFORM       = MdeModulePkg/MdeModulePkg.dsc
# Also you can use RELEASE
TARGET                = DEBUG
# For X64 Architecture.
TARGET_ARCH           = X64
# GCC tool chain
TOOL_CHAIN_TAG        = GCC5
```

After all done, use `build` command to execute build testing, all modules in `MdeModulePkg/MdeModulePkg.dsc` will be built.

```bash
build
```