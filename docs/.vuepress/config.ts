import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import theme from "./theme";
import { sitemapPlugin } from "@vuepress/plugin-sitemap";
import { slimsearchPlugin } from '@vuepress/plugin-slimsearch'
import { cachePlugin } from "@vuepress/plugin-cache";
import { appendDatePlugin } from "@vuepress/plugin-append-date";

export default defineUserConfig({
  lang: "zh-CN",
  // 站点的标题
  title: "DailyNotes",
  // 站点的描述
  description: "233的日常学习记录",
  // 站点配置, 设置为 /[仓库名]/
  //  Github
  // base: "/DailyNotes/",  
  // Gitlab Backup（gitlab的仓库名强制全小写的，所以这里也要全小写， github的话仓库名是什么这里就填什么）
  // base: "/dailynotes/",

  base: "/VuePressTemplate/",

  plugins: [
    slimsearchPlugin({
      // 配置项
    }),
    appendDatePlugin(), 
    cachePlugin({ type: "filesystem" })
  ],

  // plugins: [
  //   searchProPlugin({
  //     // 配置选项
  //   }),
  //   sitemapPlugin({
  //     // 配置选项
  //     hostname: "ayusummer.github.io",
  //   }),
  // ],
  bundler: viteBundler(),
  // 主题配置
  theme,
});
