---
home: True
layout: BlogHome
heroFullScreen: true
bgImage: M4.png
icon: home
title: 233'notes
author: 咸鱼型233
heroImage: logo.svg
heroText: 233's notes
tagline: 233的学习随笔
copyright: false
footer: 拾掇拾掇过往经验
---

# VuePressTemplate

- [VuePressTemplate](#vuepresstemplate)
  - [简易部署流程](#简易部署流程)
  - [简易编写说明](#简易编写说明)
  - [首页博客样式](#首页博客样式)

---

参阅 [VuePressTemplate / 简易部署流程](https://233official.github.io/VuePressTemplate/) 食用～

自动部署展示页面: [VuePressTemplate](https://233official.github.io/VuePressTemplate/)

> 原始手动从头构建仓库的说明在 [此处](https://233official.github.io/dailynotes/NoteTools/VuePress.html#pnpm-github-actions-github-gitlab-pages-%E8%87%AA%E5%8A%A8%E5%8C%96%E9%83%A8%E7%BD%B2%E6%96%87%E6%A1%A3)

---

## 简易部署流程

使用[此仓库](https://github.com/233Official/VuePressTemplate)创建 Repo

![image-20250103134807816](http://cdn.ayusummer233.top/DailyNotes/202501031348058.png)

![image-20250103134904605](http://cdn.ayusummer233.top/DailyNotes/202501031349667.png)

![image-20250103135024130](http://cdn.ayusummer233.top/DailyNotes/202501031350186.png)

可以看到一个 Actions 正在运行，运行完毕后会生成一个新的 branch

![image-20250103135120395](http://cdn.ayusummer233.top/DailyNotes/202501031351451.png)

![image-20250103135145888](http://cdn.ayusummer233.top/DailyNotes/202501031351940.png)

---

打开仓库设置页面 -> Pages：选择从 branch 部署 Pages并选择 `gh=pages` branch， 点击 `Save`

![image-20250103135307128](http://cdn.ayusummer233.top/DailyNotes/202501031353184.png)

---

然后就会看到一个新的 Actions 运行：

![image-20250103135449117](http://cdn.ayusummer233.top/DailyNotes/202501031354182.png)

![image-20250103135502638](http://cdn.ayusummer233.top/DailyNotes/202501031355682.png)

访问此 URL 可以看到站点部署完成

![image-20250103135640107](http://cdn.ayusummer233.top/DailyNotes/202501031356179.png)

---

接下来需要将仓库 Clone 到本地然后修改一些配置项：

clone 仓库到本地后，先 cd 到仓库根目录运行 `pnpm install` 安装依赖

![image-20250103140022168](http://cdn.ayusummer233.top/DailyNotes/202501031400229.png)

主要修改如下配置项：

> 两个配置项文件 `config.ts` 和 `theme.ts`， 除了下面特别说明的关键配置项外，其余配置项参阅注释和  [pnpm,Github Actions, Github/Gitlab Pages 自动化部署文档](https://233official.github.io/dailynotes/NoteTools/VuePress.html#pnpm-github-actions-github-gitlab-pages-%E8%87%AA%E5%8A%A8%E5%8C%96%E9%83%A8%E7%BD%B2%E6%96%87%E6%A1%A3) 修改即可

![image-20250103140402440](http://cdn.ayusummer233.top/DailyNotes/202501031404518.png)

![image-20250103141027570](http://cdn.ayusummer233.top/DailyNotes/202501031410641.png)

![image-20250103141112773](http://cdn.ayusummer233.top/DailyNotes/202501031411821.png)

---

修改完配置项后可以在本地运行看看效果：

```bash
pnpm docs:dev
```

![image-20250103141332481](http://cdn.ayusummer233.top/DailyNotes/202501031413586.png)

![image-20250103141407764](http://cdn.ayusummer233.top/DailyNotes/202501031414837.png)

---

推送到 github 后触发 Actions 自动部署

![image-20250103141219123](http://cdn.ayusummer233.top/DailyNotes/202501031412193.png)

![image-20250103141506796](http://cdn.ayusummer233.top/DailyNotes/202501031415868.png)

![image-20250103141538296](http://cdn.ayusummer233.top/DailyNotes/202501031415400.png)

![image-20250103141552942](http://cdn.ayusummer233.top/DailyNotes/202501031415989.png)

---

## 简易编写说明

部署完成后编写部署随笔只需要考虑两个部分：

- 写 markdown 随笔

  在 docs 目录下自行组织目录结构编写 markdown 文件随笔即可：

  ![image-20250103141956949](http://cdn.ayusummer233.top/DailyNotes/202501031419024.png)

- 写目录配置

  参阅下图编写随笔的顶部导航栏和侧边导航栏即可

  > 可以对照仓库中的示例文档的目录写法来编写

  ![image-20250103142146002](http://cdn.ayusummer233.top/DailyNotes/202501031421146.png)

---

## 首页博客样式

VuePress Theme Hope 主题有对博客的支持，详情可参阅 [VuePress Theme Hope/指南/博客/博客功能介绍](https://theme-hope.vuejs.press/zh/guide/blog/intro.html)

类似下面这种首页博客样式：

![image-20250327173241614](http://cdn.ayusummer233.top/DailyNotes/202503271732864.png)

![image-20250327173257328](http://cdn.ayusummer233.top/DailyNotes/202503271733221.png)

只需要配置 `docs/README.md` 中的如下红框部分的样式内容即可，具体可参阅 `https://github.com/233Official/dailynotes/blob/main/docs/README.md`

![image-20250327173357441](http://cdn.ayusummer233.top/DailyNotes/202503271733521.png)

额外的博客样式比如如下标签之类的需要在 `docs/.vuepress/theme.ts` 中进行配置，具体可参阅 `https://github.com/233Official/dailynotes/blob/main/docs/.vuepress/theme.ts`

![image-20250327173523303](http://cdn.ayusummer233.top/DailyNotes/202503271735384.png)



![image-20250327173933184](http://cdn.ayusummer233.top/DailyNotes/202503271739269.png)

---

