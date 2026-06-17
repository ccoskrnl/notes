// 侧边栏
import { sidebar } from "vuepress-theme-hope";

let Compiler = [
{
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
},
]

export const Sidebar = sidebar({
  "编译器设计": Compiler,

});
