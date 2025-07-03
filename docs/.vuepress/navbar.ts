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
      text: "Monotone Data Flow Analysis Frameworks",
      link: "/Compiler/data_flow_analysis/monotone_data_flow_analysis_frameworks.md",
    },
    {
      text: "Static Single Assignment (SSA) Form",
      link: "/Compiler/data_flow_analysis/ssa.md",
    },
  ],
};


export const Navbar = navbar([
  Compiler, // 编译器相关
  // NoteTools, // 笔记工具
]);
