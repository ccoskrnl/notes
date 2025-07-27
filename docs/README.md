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

## Compiler

### 分析基础
---

#### 静态单赋值形式(Static Single Assignment (SSA))

这篇文章简要介绍了静态单赋值(Static Single Assignment (SSA))的作用，以及它的计算方法。并给出了最小化SSA算法实现。

- [静态单赋值形式(Static Single Assignment (SSA))](./Compiler/basics/ssa/ssa.md)

#### 格论(Lattice Theory)

格论是信息流分析的基础。在编译优化领域，格论是数据流分析的基础，许多分析技术都建立在格论之上。这篇文章首先简单的回顾了偏序，哈斯图，拓扑排序等基础。然后开始介绍格的概念，并讨论格论在数据流分析中的作用。

- [格论(Lattice Theory)](./Compiler/basics/lattice/lattice_theory.md)



### 数据流分析
--- 

#### 单调数据流分析框架

这篇文章主要是对 `Kam, J.B. and Jeffrey D. Ullman. Monotone Data Flow Analysis Frameworks, Tech. Rept. No. 169, Dept, of Elec. Engg., Princeton Univ., Princeton, NJ, 1975. ` 的原论文进行了一些补充，在较难以理解的地方添加了注解。

- [单调数据流分析框架 HTML版本](https://github.com/ccoskrnl/notes/blob/main/docs/Compiler/data_flow_analysis/monotone/monotone_data_flow_analysis_frameworks.html)

- [单调数据流分析框架 PDF版本](https://github.com/ccoskrnl/notes/blob/main/docs/Compiler/data_flow_analysis/monotone/monotone_data_flow_analysis_frameworks.pdf)

- [单调数据流分析框架 Markdown版本](./Compiler/data_flow_analysis/monotone/monotone_data_flow_analysis_frameworks.md)

#### 到达定值

- [到达定值](./Compiler/data_flow_analysis/reaching_definitions/reaching_definitions.md)


### 符号执行(Symbolic Execution)
---

#### 稀疏条件常量传播(Sparse Conditional Constant Propagation)

- [稀疏条件常量传播(Sparse Conditional Constant Propagation)](./Compiler/symbolic_execution/sccp/sccp.md)


## 计算机系统

### 计算机存储结构
---

#### PCIe内存获取技术

这篇文章简要介绍了现代计算机的内存组织结构，并对PCIe的一些技术细节进行了讲解。

- [PCIe内存获取技术](./Computer_Systems/pcie_memory_acquisition/pcie_memory_acquistion.md)

## 操作系统内核

## 操作系统

### ntoskrnl
---

#### Windows APC

基于WRK(Windows Research Kernel)源代码讲解，它们很可能(或者一定)与当前版本的Windows系统有所不同。仅作为参考。

- [Windows APC](./Operating_Systems/ntoskrnl/apc/apc.md)


#### 对象管理

- [对象管理](./Operating_Systems/ntoskrnl/object/object.md)

#### 句柄

- [句柄](./Operating_Systems/ntoskrnl/handle/handle.md)