// 顶部导航栏
import { navbar } from "vuepress-theme-hope";

// /** 笔记工具导航栏 */
// let NoteTools = {
//   text: "笔记工具",
//   children: [
//     {
//       text: "VuePress",
//       link: "/NoteTools/VuePress.md",
//     },
//     {
//       text: "Markdown",
//       link: "/NoteTools/Markdown.md",
//     },
//   ],
// };

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
          text: "单静态赋值 (SSA) 形式",
          link: "/Compiler/basics/ssa/ssa.md",
        }
      ]

    },
    {
      text: "数据流分析",
      children: [
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


export const Navbar = navbar([
  Compiler, // 编译器相关
  // NoteTools, // 笔记工具
]);
