// 侧边栏
import { sidebar } from "vuepress-theme-hope";

/** 通识-Linux */
let general_linux = [
  {
    text: "Linux",
    link: "/通识/Linux/",
  },
  {
    text: "SSH",
    link: "/通识/Linux/SSH.md",
  },
  {
    text: "Shell",
    link: "/通识/Linux/Shell.md",
  },
  {
    text: "网络配置",
    link: "/通识/Linux/网络配置.md",
  },
  {
    text: "会话管理工具",
    link: "/通识/Linux/会话管理工具.md"
  },
  {
    text: "Linux服务器",
    link: "/通识/Linux/Linux服务器.md",
  },
  {
    text: "Linux软件管理",
    link: "/通识/Linux/Linux软件管理.md",
  },
  {
    text: "WSL2",
    link: "/通识/Linux/WSL/WSL2.md",
  }
]

/** 日常 */
let dailylife = [
  {
    text: "食谱",
    link: "/DailyLife/食谱/",
  },
  {
    text: "日常",
    link: "/DailyLife/DailyLife.md",
  },
  {
    text: "代理",
    link: "/DailyLife/Proxy.md",
  },
  {
    text: "生活",
    link: "/DailyLife/生活.md",
  }
]

/** 前端-Vue */
let frontend_vue = [
  {
    text: "Vben",
    link: "/前端/VUE/Vben.md",
  },
  {
    text: "vue-admin-template",
    link: "/前端/VUE/vue-admin-template.md",
  },
  {
    text: "Vue",
    children: [
      {
        text: "简介",
        link: "/前端/VUE/Vue3/简介.md",
      },
      {
        text: "安装",
        link: "/前端/VUE/Vue3/安装.md",
      },
      {
        text: "MicrosoftLearn",
        link: "/前端/VUE/Vue3/MicrosoftLearn.md",
      },
      {
        text: "工具",
        link: "/前端/VUE/Vue3/工具.md",
      },
      {
        text: "Vite",
        link: "/前端/VUE/Vue3/Vite.md",
      },
    ],
  },
];


export const Sidebar = sidebar({
  "/通识/Linux/": general_linux,
  "/DailyLife/": dailylife,
  "/前端/VUE/": frontend_vue,

});
