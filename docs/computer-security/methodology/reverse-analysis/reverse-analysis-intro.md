---
tags:
  - 逆向工程
  - 符号执行
  - 污点分析
  - 抽象解释
  - 程序切片
date: 2026-04-29
star: true
---
# 逆向分析常用技术介绍

## 理论工具

在程序分析和编译优化领域，**控制依赖图（CDG）**、**数据依赖图（DDG）** 和**支配图（Dominator Graph）** 是构建程序依赖关系的基础数据结构。它们均以 **控制流图（CFG）** 为输入，但刻画了不同维度的依赖信息。

在程序分析和现代编译器后端优化中，理解程序的不同依赖关系是进行指令调度、死代码消除、循环优化和并行化等高级优化的前提。控制流图（CFG）虽然描绘了程序的执行路径，但无法直接反映“谁决定了谁的执行”以及“谁生产了谁需要的数据”。

我们假设输入为一个标准的控制流图 $CFG = (N, E, s, t)$，其中 $N$ 是节点（基本块或指令）集合，$E$ 是有向边集合，$s$ 是唯一入口节点，$t$ 是唯一出口节点。

---

### 支配图 / 支配树 (Dominator Graph / Tree)



支配关系刻画了程序执行路径的“必经之路”。支配树不仅是分析控制流的基础，更是构建静态单赋值形式（SSA）的核心。

#### 详细定义

* **支配 (Dominance):** 如果从入口节点 $s$ 到达节点 $n$ 的**所有路径**都必须经过节点 $d$，则称 $d$ 支配 $n$，记作 $d \text{ dom } n$。每个节点都支配其自身。
* **严格支配 (Strict Dominance):** 如果 $d \text{ dom } n$ 且 $d \neq n$，则称 $d$ 严格支配 $n$。
* **直接支配 (Immediate Dominator):** 在所有严格支配 $n$ 的节点中，距离 $n$ “最近”的节点称为直接支配节点，记作 $idom(n)$。除了入口节点 $s$ 外，每个节点都有且仅有一个直接支配节点。
* **支配树 (Dominator Tree):** 由所有 $idom(n) \rightarrow n$ 的有向边构成的树状结构。

#### 构造算法实现 (迭代数据流分析法)

虽然 Lengauer-Tarjan 算法具有接近线性的复杂度 $O(E \log N)$，但迭代算法 $O(N^2)$ 更易于理解且在多数实际 CFG 中表现优异。

**数据流方程：**
$$Dom(n) = \{n\} \cup \left( \bigcap_{p \in preds(n)} Dom(p) \right)$$

**伪代码：**
```text
// 1. 计算每个节点的支配集 (Dominator Sets)
function ComputeDominators(CFG):
    Dom(s) = {s}
    for each node n in (N - {s}):
        Dom(n) = N // 初始化为所有节点的集合

    changed = true
    while changed:
        changed = false
        for each node n in (N - {s}) in reverse post-order: // 逆后序遍历加速收敛
            temp = Intersect(Dom(p) for all p in predecessors(n))
            new_Dom = {n} U temp
            if new_Dom != Dom(n):
                Dom(n) = new_Dom
                changed = true
    return Dom

// 2. 构建支配树 (寻找 Immediate Dominators)
function BuildDominatorTree(Dom, N):
    idom = empty map
    for each node n in (N - {s}):
        // 候选者是严格支配 n 的节点
        strict_dominators = Dom(n) - {n}
        for each d in strict_dominators:
            is_idom = true
            // 如果存在另一个严格支配节点 d'，且 d' 被 d 严格支配，则 d 不是最接近的
            for each d_prime in (strict_dominators - {d}):
                if d in Dom(d_prime): 
                    is_idom = false
                    break
            if is_idom:
                idom(n) = d
                break // 找到了唯一的 idom
    return idom // idom 映射即为支配树的边
```

---

### 控制依赖图 (Control Dependence Graph, CDG)



控制依赖图去除了 CFG 中人为引入的顺序约束（如分支结构的汇合），仅仅保留“一个节点的执行与否取决于另一个节点的分支结果”这一核心逻辑。

#### 详细定义

要定义控制依赖，首先需要定义**后支配 (Post-Dominance)**。
* **后支配:** 如果从节点 $n$ 到出口节点 $t$ 的**所有路径**都必须经过节点 $p$，则称 $p$ 后支配 $n$。
* **控制依赖条件:** 节点 $j$ 控制依赖于节点 $i$（通常 $i$ 是一个条件分支），当且仅当满足以下两个条件：
    1.  存在一条从 $i$ 到 $j$ 的路径，使得 $j$ 后支配该路径上除 $i$ 之外的所有节点。
    2.  $j$ **不**严格后支配 $i$。
    简单来说，就是 $i$ 的某个分支决定了程序必定会走到 $j$，而 $i$ 的另一个分支可以绕过 $j$。

#### 构造算法实现 (基于后支配边界算法)

构造 CDG 的标准方法是计算逆向 CFG（Reverse CFG）上的**后支配边界 (Post-Dominance Frontier)**。

**伪代码：**
```text
function BuildCDG(CFG):
    // 1. 构建逆向 CFG (Reverse CFG)
    // 所有的边反向，入口变出口，出口变入口
    RCFG = ReverseEdges(CFG) 
    
    // 2. 在 RCFG 上计算支配树 (即原图的后支配树 Post-Dominator Tree)
    PostDom = ComputeDominators(RCFG)
    PostIdom = BuildDominatorTree(PostDom, N)
    
    CDG_Edges = empty set
    
    // 3. 计算 RCFG 的支配边界 (Dominance Frontier)，即为原图的控制依赖
    // 遍历所有有多个前驱的节点 (在原图中就是有多个后继的分支节点)
    for each node X in N:
        if length(predecessors_in_RCFG(X)) >= 2:
            for each P in predecessors_in_RCFG(X):
                runner = P
                // 向上回溯后支配树，直到遇到 X 的直接后支配节点
                while runner != PostIdom(X):
                    // runner 在 RCFG 中的支配边界包含了 X
                    // 意味着在原图中，runner 控制依赖于 X
                    CDG_Edges.add(edge X -> runner) 
                    runner = PostIdom(runner)
                    
    return CDG_Edges
```

---

### 数据依赖图 (Data Dependence Graph, DDG)



数据依赖图用于表示指令/语句之间在数据读取和写入上的先后约束。在指令调度和寄存器分配中至关重要。

#### 详细定义

假设有节点（指令）$i$ 和 $j$，$i$ 在控制流上先于 $j$ 执行。数据依赖主要分为三种：
* **真依赖 (True/Flow Dependence - RAW):** $i$ 写入一个变量（或寄存器），$j$ 读取该变量。$j$ 必须等待 $i$ 计算出结果。
* **反依赖 (Anti Dependence - WAR):** $i$ 读取一个变量，$j$ 写入该变量。$j$ 不能覆盖 $i$ 还没读完的数据。
* **输出依赖 (Output Dependence - WAW):** $i$ 写入一个变量，$j$ 写入同一变量。必须保持写入的先后顺序以保证最终结果正确。

*注：现代编译器通常通过寄存器重命名（Register Renaming）或 SSA 形式消除 WAR 和 WAW 依赖，因此 DDG 中最核心的是**真依赖（RAW）**。*

#### 构造算法实现 (基于到达定值分析 Reaching Definitions)

以下伪代码重点演示如何通过“到达定值”数据流分析来构建**真数据依赖图 (RAW DDG)**。

**数据流方程：**
$$IN[n] = \bigcup_{p \in preds(n)} OUT[p]$$
$$OUT[n] = GEN[n] \cup (IN[n] - KILL[n])$$

**伪代码：**
```text
function BuildDDG_RAW(CFG):
    // 1. 初始化 GEN 和 KILL 集合
    for each instruction i in CFG:
        GEN[i] = {i} if i writes to a variable v else {}
        // KILL 包含程序中所有其他写入变量 v 的指令
        KILL[i] = {all other instructions j that write to v} 
        
    // 2. 数据流迭代求解到达定值 (Reaching Definitions)
    for each node n in N:
        IN[n] = {}
        OUT[n] = GEN[n]
        
    changed = true
    while changed:
        changed = false
        for each node n in N:
            IN[n] = Union(OUT[p] for all p in predecessors(n))
            new_OUT = GEN[n] U (IN[n] - KILL[n])
            if new_OUT != OUT[n]:
                OUT[n] = new_OUT
                changed = true
                
    // 3. 构建数据依赖边
    DDG_Edges = empty set
    for each instruction j in CFG:
        for each variable v read by j:
            // 找出所有到达 j 且定义了变量 v 的指令 i
            reaching_defs = {i in IN[j] | i writes to v}
            for each i in reaching_defs:
                // i 产生的值被 j 消费，产生 RAW 依赖
                DDG_Edges.add(edge i -> j with label v)
                
    return DDG_Edges
```





## 动态污点分析 (Dynamic Taint Analysis, DTA)

动态污点分析是一种在**程序运行时**追踪信息流的程序分析技术。它将来自不可信来源（如用户输入、网络套接字）的数据标记为“污点”（Taint），然后在线监控这些污点数据在系统中的传播过程，并检测它们是否被用于可能危及安全的关键操作（即**污点汇点**，如SQL查询、系统命令等）。如果在没有经过适当清洗（Sanitization）的情况下，污点数据到达敏感汇点，DTA将报告潜在的安全违规行为。

与静态污点分析不同，动态污点分析不需要访问程序源代码（通常运行在二进制或字节码级别），并且能够处理动态语言特性、间接跳转和加密混淆等情况，误报率较低，但存在路径覆盖不全导致的漏报问题。

### 核心概念

#### 污点源 (Taint Sources)

程序从外部接收数据的入口点，通常被视为不可信数据的来源。依据分析目标，常见的污点源包括：

-   系统调用返回值：`read()`、`recv()` 等。
-   网络输入：`recvfrom()` 返回的缓冲区。
-   文件输入：`fread()`、`mmap()` 映射的文件内容。
-   环境变量：`getenv()` 返回的字符串。
-   命令行参数：`argv[]` 数组。
-   特定寄存器/内存位置：根据调用约定，某些寄存器保存函数返回值。

DTA框架会在数据从这些源进入程序时，将其对应的内存区域或寄存器标记为污点。

#### 污点传播 (Taint Propagation)

当被标记为污点的数据通过数据移动、算术运算、指针解引用等操作参与其他数据的生成时，新生成的数据也应当继承污点标记。传播规则决定了DTA的精确度：

-   **显式流传播**：直接的数据传递，例如：

    -   赋值操作：`a = tainted_var;` ⇒ `a` 被标记。
    -   算术/逻辑运算：`c = a + b;` 若 `a` 或 `b` 被污点标记，则 `c` 也被标记。
    -   位运算、移位等同理，只要污点数据影响了结果，结果即被标记。
    -   内存加载/存储：`store addr, tainted_value` 导致内存地址 `addr` 处的内容被标记；`load tainted_addr` 导致寄存器被标记（地址为污点时，加载的数据可能被污点，这是典型的 *地址依赖*）。

-   **隐式流传播**（可选，开销极大）：通过控制流传播的污点。例如：

    c

    ```
    if (tainted_var == 0) x = 1; else x = 2;
    ```

    

    即使 `x` 的值不会直接包含污点数据，由于 `x` 的值依赖于 `tainted_var` 的条件判断，如果开启隐式流追踪，`x` 也会被标记。这种依赖可导致严重的污点爆炸和性能下降，实践中多数DTA系统默认关闭或高度近似处理。

#### 污点汇点 (Taint Sinks)

污点数据的不当使用会被视为违反安全策略。汇点通常是安全敏感的操作，包括：

-   代码注入类：`execve()`、`system()`、`popen()` 的参数。
-   SQL注入：`mysql_query()`、数据库接口的查询字符串。
-   跨站脚本 (XSS)：输出到HTTP响应的函数，如 `printf` 写入网络socket。
-   路径遍历：`open()`、`fopen()` 的文件名参数。
-   格式化字符串漏洞：`printf(format_str)` 当 `format_str` 为污点时。
-   越权或信息泄露：将污点数据用于系统配置、权限判断等。

#### 污点清洗 (Sanitization)

清洗是指程序对污点数据进行验证、过滤或转义，使其变为“安全”数据的过程。DTA系统需要识别清洗函数，并在其正确执行后移除污点标记。例如：

-   输入验证：检查是否符合预期格式（如正则匹配整数）。
-   HTML转义：`htmlspecialchars()` 处理 `<>"&` 后数据不再危险。
-   SQL参数化查询：将污点数据绑定到占位符，避免直接拼入查询字符串。

清洗函数通常由分析师手动指定，或通过启发式学习自动发现。

### Triton (Dynamic Binary Analysis Framework)

**Triton** 是一个**动态二进制分析框架**，其核心目标是提供**符号执行**、**动态污点分析**和**表达式的约束求解**能力。它不是另一个 DBI 平台，而是在 DBI 平台之上运行的分析库。Triton 内部维护一套符号表达式树（AST）和污点传播引擎，并通过标准的 SMT-LIB 接口与 Z3 等求解器交互。

Triton 的官方实现通过 Pin 和 DynamoRIO 作为后端来获取指令流和修改程序行为，但对用户隐藏了后端的复杂性，提供统一的 Python/C++ API。这使得分析人员可以用几十行代码实现复杂的漏洞挖掘或协议逆向逻辑。

```
[程序执行] --> [DBI Backend (Pin/DynamoRIO)] --> [指令回调] 
                           |
                    [Triton 处理引擎]
                      /    |    \
            [符号表达式] [污点引擎] [SMT求解器]
```

每个组件职责明确：

-   **DBI 后端**：负责加载程序，在每条指令执行时触发 Triton 的分析回调，并提供寄存器、内存的值。
-   **指令处理**：Triton 接收指令，将指令的语义翻译为**内部中间表示（Triton IR）**，并自动构建**符号表达式树**。例如，指令 `add rax, rbx` 会生成表达式 `rax_new = rax_old + rbx`。
-   **污点引擎**：维护每个寄存器/内存字节的污点标签，并根据指令语义传播污点。如果 `rbx` 是污点，则 `rax_new` 也会被标记。
-   **SMT 求解器**：对符号表达式施加约束（如 `rax == 0`），调用求解器检查可满足性并生成具体输入。





## 抽象解释（Abstract Interpretation）



在编译器理论和静态分析中，**抽象解释（Abstract Interpretation）** 被誉为“有损压缩的艺术”。在逆向分析中，它不仅仅是理论，更是处理混淆代码、恢复高层语义的核心手段。

简单来说，抽象解释的核心逻辑是：**我们不关心程序的每一个精确状态，只关心能回答特定问题的“特征”。**

### 抽象域 (Abstract Domain)

抽象分析的第一步是定义一个**格（Lattice）**结构。这个结构描述了信息的精度。

一个抽象域通常由以下要素组成：

-   **抽象值 ($L$, $\leq$):** 这是一个半序集。底部 ($\bot$) 表示程序不可达或无信息；顶部 ($\top$) 表示“未知”或“所有可能的值”。
-   **抽象函数 ($\alpha$):** 将具体的程序状态（如：$x = 5$）映射到抽象域（如：$x \in [0, 10]$）。
-   **具体化函数 ($\gamma$):** 将抽象值映射回可能的具体状态集合。



### 在逆向工程中的典型应用场景

在逆向分析中，我们面对的是没有类型、没有结构的二进制流。构造抽象域能帮我们解决以下棘手问题：

#### A. 值域分析 (Value Range Analysis, VRA)

**目标：** 确定寄存器或内存地址在某一点可能的取值范围。

-   **抽象域构造：** 使用区间域 $D = \{[l, u] \mid l, u \in \mathbb{Z} \cup \{-\infty, \infty\}\}$。
-   **用途：** * 检测**缓冲区溢出**：如果一个索引寄存器的抽象值范围超出了数组边界，即可预警。
    -   **去混淆**：识别某些复杂的算术运算序列是否实际上等价于一个常数。

#### B. 符号执行中的不透明谓词 (Opaque Predicates) 消除

混淆器经常插入恒真或恒假的跳转（不透明谓词）来误导 CFG。

-   **抽象域构造：** 符号域（Symbolic Domain）。
-   **用途：** 通过抽象分析证明某个条件分支 $x^2 + 1 > 0$ 在整数域下永远为真，从而直接裁剪掉不会执行的死代码（Dead Code Slicing）。

#### C. 堆栈/结构体形状分析 (Shape Analysis)

**目标：** 在底层汇编中恢复 C/C++ 的 `struct` 或 `class`。

-   **抽象域构造：** 内存格（Memory Lattice）。将内存映射为 `{Offset: Type/Range}` 的集合。
-   **用途：** 追踪 `ESP/RSP` 的偏移。通过观察对 `[EBP + 0x08]`、`[EBP + 0x0C]` 的访问频率和指令类型，抽象出该内存块是一个包含 `int` 和 `float` 的结构体。



### 抽象分析的执行过程：不动点迭代

在处理带有循环的代码时，抽象分析通过**不动点迭代（Fixed-point Iteration）**来保证收敛：

1.  从 $\bot$ 开始，沿着 CFG 传播抽象状态。
2.  在控制流汇合处（如 `if-else` 结束或循环入口），使用 **Join ($\sqcup$)** 操作合并状态。
3.  如果抽象域是无限的（如区间域），使用 **Widening ($\nabla$, 加宽)** 操作强制收敛，防止循环分析陷入死循环。

$$
State_{new} = State_{old} \nabla (State_{old} \sqcup Transfer(State_{old}))
$$



## 逆向分析的符号执行

编译器优化（如常量传播、死代码消除）中的符号执行通常是静态的、流不敏感的或路径不敏感的，旨在安全近似程序行为，不追求完整路径覆盖，但必须保证优化不改变程序语义。

[SCCP(Sparse Conditional Constant Propagation)](../../../compiler/symbolic-execution/sccp/sccp.md) 是经典代表，它在 SSA 形式 上结合了常量传播和死代码消除。SCCP 本质上是一种简化的、路径不敏感的静态符号执行。这种设计在编译器优化中足够用，因为优化必须快速且安全。

逆向工程、漏洞挖掘等场景中，符号执行的目标是深入理解程序行为、自动生成输入以触发特定路径或证明路径可达性。

典型流程：

1. 将程序输入、寄存器、内存初始化为符号变量。

2. 维护路径约束（Path Constraint）：每个分支条件的符号表达式。

3. 使用 SMT 求解器（如 Z3）判断路径可行性，并可生成满足约束的具体输入。

二进制符号执行引擎的核心算法，本质上是一个带约束求解的、状态分叉的模拟器。它通过将程序输入、寄存器和内存抽象为符号，通过模拟执行并收集路径约束，来探索程序在不同输入下的行为。它将静态的 def-use 关系升级为了动态的、路径敏感的符号计算，以精确解析那些静态分析难以处理的指针、内存等复杂依赖。



## 切片技术

程序切片（Program Slicing）是由 Mark Weiser 在 1984 年首次提出的一种程序分解技术。其核心思想是：**对于一个给定的程序行为（通常指定为某个语句中的某个变量），提取出可能影响该行为的“最小”程序片段**。这个片段被称为一个切片，它完整保留了原始程序中关于该行为的所有语义。

在软件工程与安全领域，**后向切片 (Backward slicing)** 是应用最广泛的切片形式，常用于调试（定位错误根源）、代码理解、漏洞分析与程序并行化。

### 基本定义

-   **切片准则（Slicing Criterion）**
    通常表示为一个对 `(n, V)`，其中 `n` 是程序中的一条语句（或基本块），`V` 是在 `n` 处被关注的变量集合。
    我们关心的问题是：**“哪些语句可能影响在 `n` 处变量 `V` 的值？”**
-   **后向切片（Backward Slice）**
    由切片准则 `(n, V)` 定义的后向切片，是程序中所有可能影响 `n` 处变量 `V` 的语句的集合。它的计算方向是从 `n` 向程序入口回溯影响流。
    相对地，**前向切片（Forward Slice）** 则计算受 `(n, V)` 影响的语句，方向从 `n` 向程序出口推进。

当人们不加限定地提及“程序切片”时，通常指**后向静态切片**。

### 理论基础

现代切片算法几乎都建立在**程序依赖图（Program Dependence Graph, PDG）**之上。PDG 将控制依赖与数据依赖统一为一张有向图，使得切片问题被归约为图的可达性问题。

**依赖边的语义是：“源节点直接影响目标节点”**。例如，数据依赖边 `A → B` 表明 `A` 所定义的变量会流向 `B` 并影响 `B` 的行为。

在切片视图中，我们反向使用这些边：想知道哪些语句影响准则 `C`，应该从 `C` 出发，沿着依赖边**逆着箭头方向**遍历。因为：

-   若 `A → B` 且我们关心 `B`，那么 `A` 一定影响 `B` → 将 `A` 纳入切片。
-   若 `C → S` 且我们关心 `S`，那么控制谓词 `C` 决定了 `S` 是否执行 → 将 `C` 纳入切片。

### 后向切片的核心算法

一旦构建好 PDG，后向切片的求解即退化为**从切片准则节点出发，沿依赖边逆向进行图遍历**，所有被访问到的节点构成切片。

#### 基于程序依赖图的可达性算法

**PDG-Based 后向切片算法**

伪代码如下：

```
// 输入：PDG = (N, E_data ∪ E_control), 切片准则 (n_crit, V)
// 输出：SliceSet（节点集）

function BackwardSlice_PDG(PDG, n_crit):
    // 所有依赖边（正向）为 u → v
    // 切片需逆序遍历：从 v 到 u
    // 构建逆向邻接表
    rev_adj = empty map from node to list of nodes
    for each edge (u, v) in PDG:
        rev_adj[v].append(u)

    visited = empty set
    queue = [n_crit]
    while queue not empty:
        cur = queue.pop()
        if cur in visited: continue
        visited.add(cur)
        for each pred in rev_adj[cur]:   // 所有指向cur的节点
            queue.push(pred)

    return visited
```



该算法的时间复杂度为线性于 PDG 的大小，简单高效。难点在于 PDG 的精确构建，而这正是之前关于 CDG 和 DDG 的内容。



#### Weiser 的经典数据流迭代算法

在 PDG 概念出现之前，Weiser 基于控制流图（CFG）直接通过数据流方程计算切片，其思想对于理解切片本质很有帮助。

该算法通过迭代计算每个程序点处“相关变量”的集合，并标识出语句是否属于切片。

**定义**：

-   对程序中的每条语句 `i`（或基本块），我们关心两组变量：
    -   `DEF(i)`：语句 `i` 定义的变量集合。
    -   `REF(i)`：语句 `i` 引用的变量集合。
-   控制依赖通过“控制范围”近似：对于语句 `i`，`INFL(i)` 表示受 `i` 控制的那些语句的集合（通常是 `i` 的直接后支配范围）。

**迭代规则**：
初始时，切片准则 `(n, V)` 使得我们标记 `n` 处的变量 `V` 是相关的。
对任一语句 `i`，若它定义了某个相关变量，那么它所引用的变量全部变成相关；同时，控制它执行的谓词语句也变为相关，并且谓词语句的条件变量也变为相关。

伪代码如下：

```
function BackwardSlice_Weiser(CFG, criterion (n, V)):
    // 初始化相关变量集 (relevant vars) 和切片语句集
    relevant_vars = { (n, v) for v in V }   // 程序点n处的变量v相关
    slice_set = empty set
    worklist = [ n ]

    // 控制依赖信息: ctrl_scope[i] 返回受 i 直接控制的语句集合（可由后支配树计算）
    
    while worklist not empty:
        cur = worklist.pop()
        if cur in slice_set: continue
        slice_set.add(cur)

        // 步骤1：对于 cur 中定义的所有变量，如果它们被标记为相关，则将 cur 用的所有变量标记为相关
        used_vars = REF(cur)
        for each def_var in DEF(cur):
            if (cur, def_var) in relevant_vars:
                // 当前语句定义了一个相关变量，说明它影响该变量，因此它的使用变量也相关
                for each use in used_vars:
                    mark_relevant(cur, use, relevant_vars)  // 即在cur的入口处use成为相关
                    
        // 步骤2：传播相关变量到前驱（逆流）
        for each pred in predecessors(cur):
            // 从 cur 的入口相关变量传播到 pred 的出口
            entry_relevant = get_relevant_at_entry(cur, relevant_vars)
            for each var in entry_relevant:
                if var not in DEF(pred):   // 未被 pred 杀死
                    mark_relevant(pred, var, relevant_vars)
                // 如果 pred 定义了 var，则不应简单传播，而应触发步骤1处理pred
            // 如果任何新变量被标记，将 pred 加入 worklist

        // 步骤3：控制依赖：如果 cur 被包含在切片中，那么控制 cur 执行的谓词也应被包含
        // 找到直接控制 cur 的谓词节点 ctrl_node
        ctrl_node = getImmediateController(cur, CFG)  // 基于后支配树的直接控制依赖
        if ctrl_node != None and ctrl_node not in slice_set:
            // 将 ctrl_node 使用的变量（即分支条件变量）标记为在 ctrl_node 入口相关
            for each var in REF(ctrl_node):
                mark_relevant(ctrl_node, var, relevant_vars)
            worklist.push(ctrl_node)

    return slice_set
```



该算法的本质是基于 CFG 的**迭代式信息流分析**，它混合了数据流（逆流）和控制流（控制依赖）的传播。它的优点是不需要显式构建 PDG，但理解和实现都更复杂，精度与 PDG 方法等价。


---

- [[computer-security/methodology/angr/angr|angr]]
- [[compiler/symbolic-execution/sccp/sccp|Sparse Conditional Constant Propagation]]
- [[data-flow-analysis-intro|Introduction to Data Flow Analysis]]
