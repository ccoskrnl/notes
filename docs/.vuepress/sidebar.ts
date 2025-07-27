// 侧边栏
import { sidebar } from "vuepress-theme-hope";

// /* 编译器 */
// let Compiler_basics = [
//   {
//     text: "格论",
//     link: "/Compiler/basics/lattice/lattice_theory.md",
//   },
//   {
//     text: "单静态赋值 (SSA) 形式",
//     link: "/Compiler/basics/ssa/ssa.md",
//   },
// ]

// let Compiler_data_flow_analysis = [
//   {
//     text: "单调数据流分析框架",
//     link: "/Compiler/data_flow_analysis/monotone/monotone_data_flow_analysis_frameworks.md",
//   },
//   { 
//     text: "到达定值",
//     link: "/Compiler/data_flow_analysis/reaching_definitions/reaching_definitions.md",
//   },
// ]

// let Compiler_symbolic_execution = [
//   {
//     text: "稀疏条件常量传播(SCCP)",
//     link: "/Compiler/symbolic_execution/sccp/sccp.md",
//   },
// ]

let Compiler = [
{
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
},
]



export const Sidebar = sidebar({
  "编译器设计": Compiler,

});
