import { hopeTheme } from "vuepress-theme-hope";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { sitemap } from "vuepress-theme-hope";

export default hopeTheme({
  hostname: "https://ccoskrnl.github.io/notes/",

  author: {
    name: "城城",
    url: "https://ccoskrnl.github.io/notes/",
  },

  favicon: "/fi.ico",

  // logo
  logo: "/logo.png",

  // 主题色选择器
  themeColor: true,

  // 导航栏
  navbar: Navbar,
  // 侧边栏
  sidebar: Sidebar,

  // 页脚
  displayFooter: true,

  blog: {
    description: "个人描述",
    intro: "/about/",
    medias: {
      GitHub: "https://github.com/ccoskrnl",
      BiliBili: "https://space.bilibili.com/329083099",
    },
  },

  // 仓库链接
  repo: "ccoskrnl/notes",
  // 文档仓库地址，默认同主题选项中的 repo
  docsRepo: "ccoskrnl/notes",
  // 文档在仓库中的目录，默认为根目录
  docsDir: "docs",
  // 文档存放的分值，默认为 "main"
  docsBranch: "main",

  // 全屏
  fullscreen: true,

  markdown: {
    mermaid: true,
    plantuml: true,
    // 语法高亮
    highlighter: "shiki",
    math: {
      type: "katex", // 或 'mathjax'
    },
    tabs: true,
    // 与选项卡功能相同，但它是专门为代码块构建的。
    // 代码选项卡只会渲染 @tab 标记后的代码块，其他 Markdown 内容将被忽略
    codetabs: true,
    // 文件支持任务列表
    tasklist: true,
    // 支持标记 使用 == == 进行标记。请注意两边需要有空格
    mark: true,
  },

  // 插件相关
  plugins: {
    blog: {
      excerptLength: 0,
    },
    seo: true,
    // slimsearch: true,
    sitemap: {
      devHostname: "https://ccoskrnl.github.io/",
      hostname: "https://ccoskrnl.github.io/",
    },
    feed: {
      rss: true,
      atom: true,
      json: true,
      hostname: "https://ccoskrnl.github.io/",
    },
  },
});
