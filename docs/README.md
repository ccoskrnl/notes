---
home: True
layout: BlogHome
heroFullScreen: true
bgImage: Hibiki.jpg
icon: home
title: 城城的笔记
author: 城城
heroImage: logo.png
heroText: 城城的笔记
tagline: 城城的笔记
copyright: false
footer: 短暂几年的衰败并不会影响你一生的成长 
---

# 城城的笔记

---

## Compiler

### 数据流分析

#### 单调数据流分析框架

这篇文章主要是对 `Kam, J.B. and Jeffrey D. Ullman. Monotone Data Flow Analysis Frameworks, Tech. Rept. No. 169, Dept, of Elec. Engg., Princeton Univ., Princeton, NJ, 1975. ` 的原论文进行了一些补充，在较难以理解的地方添加了注解。由于原论文年代久远，很多字符已经模糊影响阅读，故提供了一份HTML版本和PDF版本。

- [单调数据流分析框架 HTML版本](./Compiler/data_flow_analysis/monotone_data_flow_analysis_frameworks.html)

- [单调数据流分析框架 PDF版本](./Compiler/data_flow_analysis/monotone_data_flow_analysis_frameworks.pdf)

- [单调数据流分析框架 Markdown版本](./Compiler/data_flow_analysis/monotone_data_flow_analysis_frameworks.md) 由于KaTeX对LaTeX的支持并不是很完善，所以markdown渲染可能存在些许问题。

#### 静态单赋值形式

这篇文章介绍了静态单赋值(Static Single Assignment (SSA))的作用，以及它的计算方法。

- [Static Single Assignment (SSA)](./Compiler/data_flow_analysis/ssa.md)