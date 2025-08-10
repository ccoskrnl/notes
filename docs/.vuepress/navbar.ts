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
          link: "/Compiler/basics/lattice/lattice_theory.md",
        },
        {
          text: "常量传播中的常量格",
          link: "/Compiler/basics/lattice/constlat.md",
        },
        {
          text: "单静态赋值 (SSA) 形式",
          link: "/Compiler/basics/ssa/ssa.md",
        }
      ]

    },
    {
      text: "数据流分析",
      children: [
        {
          text: "数据流分析基础",
          link: "/Compiler/data_flow_analysis/intro/intro.md",
        },
        {
          text: "单调数据流分析框架",
          link: "/Compiler/data_flow_analysis/monotone/monotone_data_flow_analysis_frameworks.md",
        },
        {
          text: "到达定值",
          link: "/Compiler/data_flow_analysis/reaching_definitions/reaching_definitions.md",
        }
      ]
    },
    {
      text: "符号执行",
      children: [
        {
          text: "稀疏条件常量传播(SCCP)",
          link: "/Compiler/symbolic_execution/sccp/sccp.md",
        },
      ]
    },
  ],
};


let Computer_Systems = {
  text: "计算机系统",
  children: [
    {
      text: "计算机存储结构",
      children: [
        {
          text: "PCIe 内存获取技术",
          link: "/Computer_Systems/storage/pcie_memory_acquisition/pcie_memory_acquistion.md",
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
          link: "/Operating_Systems/ntoskrnl/apc/apc.md",
        },
        {
          text: "对象管理",
          link: "/Operating_Systems/ntoskrnl/object/object.md",
        },
        {
          text: "句柄",
          link: "/Operating_Systems/ntoskrnl/handle/handle.md",
        },
        {
          text: "驱动开发",
          link: "/Operating_Systems/ntoskrnl/driver/intro.md",
        }
      ]

    },
  ],
};


export const Navbar = navbar([
  Compiler, // 编译器相关
  Computer_Systems, // 计算机系统相关
  Operating_Systems, // 操作系统相关
]);
