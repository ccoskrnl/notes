---
home: True
layout: BlogHome
heroFullScreen: true
bgImage: skadi.jpg
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

#### 常量传播中的常量格

常量格是格论在编译优化中的应用之一，同时也是常量传播的基础，常量格的单调性使得常量传播分析的收敛性得到保证。

- [常量传播中的常量格](./Compiler/basics/lattice/constlat.md)

### 数据流分析

---

#### 单调数据流分析框架

这篇文章主要是对 `Kam, J.B. and Jeffrey D. Ullman. Monotone Data Flow Analysis Frameworks, Tech. Rept. No. 169, Dept, of Elec. Engg., Princeton Univ., Princeton, NJ, 1975. ` 的原论文进行了一些补充，在较难以理解的地方添加了注解。

- [单调数据流分析框架 HTML版本](https://github.com/ccoskrnl/notes/blob/main/docs/Compiler/data_flow_analysis/monotone/monotone_data_flow_analysis_frameworks.html)

- [单调数据流分析框架 PDF版本](https://github.com/ccoskrnl/notes/blob/main/docs/Compiler/data_flow_analysis/monotone/monotone_data_flow_analysis_frameworks.pdf)

- [单调数据流分析框架 Markdown版本](./Compiler/data_flow_analysis/monotone/monotone_data_flow_analysis_frameworks.md)

#### 数据流分析基础

数据流分析指的是一组用来获取有关数据如何沿着程序执行路径流动的相关信息的技术。

- [数据流分析基础](./Compiler/data_flow_analysis/intro/intro.md)

#### 到达定值

到达定值是最常见和有用的数据流模式之一。只要知道当控制到达程序中每个点的时候，每个变量 $x$ 可能在程序中的哪些地方被定值，我们就可以确定很多有关 $x$ 的性质。

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

- [PCIe内存获取技术](./Computer_Systems/storage/pcie_memory_acquisition/pcie_memory_acquistion.md)



## 操作系统内核

### ntoskrnl

---

#### Windows APC

基于WRK(Windows Research Kernel)源代码讲解，它们很可能(或者一定)与当前版本的Windows系统有所不同。仅作为参考。

- [Windows APC](./Operating_Systems/ntoskrnl/apc/apc.md)

#### 对象管理

基于WRK对ntoskrnl的对象管理机制的简单介绍

- [对象管理](./Operating_Systems/ntoskrnl/object/object.md)

#### 句柄

基于WRK对win32编程中的句柄机制的分析。windows的对象管理机制使句柄的机制在win32编程中显得极为重要。

- [句柄](./Operating_Systems/ntoskrnl/handle/handle.md)

#### 驱动

介绍Windows驱动开发

- [驱动开发](./Operating_Systems/ntoskrnl/driver/intro.md)


