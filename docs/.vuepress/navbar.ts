// 顶部导航栏
import { navbar } from "vuepress-theme-hope";

let Compiler = {
  text: "编译器",
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
          link: "/compiler/basics/lattice/constlat.md",
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
          link: "/compiler/data-flow-analysis/intro/intro.md",
        },
        {
          text: "单调数据流分析框架",
          link: "/compiler/data-flow-analysis/monotone/monotone_data_flow_analysis_frameworks.md",
        },
        {
          text: "到达定值",
          link: "/compiler/data-flow-analysis/reaching-definitions/reaching_definitions.md",
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
};

let Architecture = {
  text: "体系结构",
  children: [
    {
      text: "PCIe 内存获取技术",
      link: "/architecture/pcie-memory-acquisition/pcie_memory_acquistion.md",
    },
    {
      text: "UEFI",
      children: [
        {
          text: "构建EDK2开发环境",
          link: "/architecture/uefi/edk2/main.md",
        },
      ]
    },
  ]
}

let Operating_Systems = {
  text: "操作系统",
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
          link: "/operating-system/ntoskrnl/driver/intro.md",
        }
      ]

    },
  ],
};

let Computer_Security = {
  text: "计算机安全",
  children: [
    {
      text: "安全机制",
      children: [
        {
          text: "Reflective DLL Injection",
          link: "/computer-security/mechanism/reflective-dll/rfdll.md",
        },
      ]
    },
    {
      text: "工具链",
      children: [
        {
          text: "IDA 脚本开发环境搭建",
          link: "/computer-security/tooling/ida-scripts/dev_env.md",
        },
        {
          text: "Intel Pin 工具",
          link: "/computer-security/tooling/intel-pin/pin.md",
        },
        {
          text: "Windows 内核调试",
          link: "/computer-security/tooling/windows-kernel-debugging/main.md",
        },
      ]
    },
    {
      text: "分析方法",
      children: [
        {
          text: "病毒分析思路",
          link: "/computer-security/methodology/malware-analysis/malware_analysis.md",
        },
        {
          text: "逆向分析方法",
          link: "/computer-security/methodology/reverse-analysis/intro.md",
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
    {
      text: "分析报告",
      children: [
        {
          text: "勒索病毒[48877a3a4c72]",
          link: "/computer-security/reports/ransomware-48877a3a4c72/report.md",
        },
        {
          text: "窃密木马[597c5e69c854]",
          link: "/computer-security/reports/rat-597c5e69c854/report.md",
        },
        {
          text: "高级加载器[af7fcb94e1]",
          link: "/computer-security/reports/loader-af7fcb94e1/report.md",
        },
        {
          text: "寄生蠕虫[4354970ccc]",
          link: "/computer-security/reports/worm-4354970ccc/report.md",
        }
      ]
    },
  ]
}

let Computer_Networks = {
  text: "计算机网络",
  children: [
    {
      text: "SDN",
      children: [
        {
          text: "SDN",
          link: "/computer-network/SDN/main.md",
        },
      ]
    },
  ]
}

let Resources = {
  text: "资源",
  children: [
    {
      text: "待读清单",
      link: "/resources/reading_list/reading_list.md",
    },
  ]
}

export const Navbar = navbar([
  Compiler,
  Architecture,
  Operating_Systems,
  Computer_Security,
  Computer_Networks,
  Resources,
]);
