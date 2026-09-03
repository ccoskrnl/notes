// 侧边栏 - 完整参照导航栏结构
import { sidebar } from "vuepress-theme-hope";

let Compiler = [
  {
    text: "编译器",
    link: "/compiler/Compiler.md",
    children: [
      {
        text: "基础",
        children: [
          {
            text: "格论",
            link: "/compiler/basics/lattice/lattice_theory.md",
          },
          {
            text: "常量传播中的常量格",
            link: "/compiler/basics/lattice/constant-lattice.md",
          },
          {
            text: "单静态赋值 (SSA) 形式",
            link: "/compiler/basics/ssa/ssa.md",
          }
        ]
      },
      {
        text: "数据流分析",
        children: [
          {
            text: "数据流分析基础",
            link: "/compiler/data-flow-analysis/intro/data-flow-analysis-intro.md",
          },
          {
            text: "单调数据流分析框架",
            link: "/compiler/data-flow-analysis/monotone/monotone_data_flow_analysis_frameworks.md",
          },
          {
            text: "到达定值",
            link: "/compiler/data-flow-analysis/reaching-definitions/reaching-definitions.md",
          }
        ]
      },
      {
        text: "符号执行",
        children: [
          {
            text: "稀疏条件常量传播(SCCP)",
            link: "/compiler/symbolic-execution/sccp/sccp.md",
          },
        ]
      },
    ],
  },
]

let Architecture = [
  {
    text: "体系结构",
    link: "/architecture/Architecture.md",
    children: [
      {
        text: "PCIe 内存获取技术",
        link: "/architecture/pcie-memory-acquisition/pcie-memory-acquisition.md",
      },
      {
        text: "UEFI",
        children: [
          {
            text: "构建EDK2开发环境",
            link: "/architecture/uefi/edk2/edk2-setup.md",
          },
        ]
      },
    ]
  }
]

let OperatingSystems = [
  {
    text: "操作系统",
    link: "/operating-system/Operating%20System.md",
    children: [
      {
        text: "ntoskrnl",
        children: [
          {
            text: "APC",
            link: "/operating-system/ntoskrnl/apc/apc.md",
          },
          {
            text: "对象管理",
            link: "/operating-system/ntoskrnl/object/object.md",
          },
          {
            text: "句柄",
            link: "/operating-system/ntoskrnl/handle/handle.md",
          },
          {
            text: "驱动开发",
            link: "/operating-system/ntoskrnl/driver/driver-development-intro.md",
          }
        ]
      },
    ],
  },
]

let ComputerSecurity = [
  {
    text: "计算机安全",
    link: "/computer-security/Computer%20Security.md",
    children: [
      {
        text: "安全机制",
        children: [
          {
            text: "Reflective DLL Injection",
            link: "/computer-security/mechanism/reflective-dll/reflective-dll-injection.md",
          },
        ]
      },
      {
        text: "工具链",
        children: [
          {
            text: "IDA 脚本开发环境搭建",
            link: "/computer-security/tooling/ida-scripts/ida-dev-env-setup.md",
          },
          {
            text: "Intel Pin 工具",
            link: "/computer-security/tooling/intel-pin/intel-pin-intro.md",
          },
          {
            text: "Windows 内核调试",
            link: "/computer-security/tooling/windows-kernel-debugging/kernel-debug-setup.md",
          },
        ]
      },
      {
        text: "分析方法",
        children: [
          {
            text: "病毒分析思路",
            link: "/computer-security/methodology/malware-analysis/malware-analysis.md",
          },
          {
            text: "逆向分析方法",
            link: "/computer-security/methodology/reverse-analysis/reverse-analysis-intro.md",
          },
          {
            text: "angr",
            link: "/computer-security/methodology/angr/angr.md",
          },
        ],
      },
      {
        text: "密码学",
        children: [
          {
            text: "RSA算法讲解",
            link: "/computer-security/cryptography/rsa/rsa.md",
          },
        ]
      },
    ]
  }
]

let ComputerNetworks = [
  {
    text: "计算机网络",
    link: "/computer-network/Network.md",
    children: [
      {
        text: "SDN",
        children: [
          {
            text: "SDN",
            link: "/computer-network/SDN/sdn-overview.md",
          },
        ]
      },
    ]
  }
]

let Resources = [
  {
    text: "资源",
    link: "/resources/Resources.md",
    children: [
      {
        text: "待读清单",
        link: "/resources/reading_list/reading-list.md",
      },
    ]
  }
]

export const Sidebar = sidebar({
  "/compiler/": Compiler,
  "/architecture/": Architecture,
  "/operating-system/": OperatingSystems,
  "/computer-security/": ComputerSecurity,
  "/computer-network/": ComputerNetworks,
  "/resources/": Resources,
});
