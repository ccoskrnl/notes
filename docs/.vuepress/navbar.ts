// 顶部导航栏
import { navbar } from "vuepress-theme-hope";

/** 笔记工具导航栏 */
let NoteTools = {
  text: "笔记工具",
  children: [
    {
      text: "VuePress",
      link: "/NoteTools/VuePress.md",
    },
    {
      text: "Markdown",
      link: "/NoteTools/Markdown.md",
    },
  ],
};

/** 通识 */
let general = {
  text: "通识",
  children: [
    {
      text: "通识",
      link: "/通识/通识.md",
    },
    {
      text: "Linux",
      link: "/通识/Linux/",
    },
  ],
};


export const Navbar = navbar([
  NoteTools, // 笔记工具
  general, // 通识
]);
