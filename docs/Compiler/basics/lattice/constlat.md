# 常量传播的格

## 定义

常量格的元素包括：

- 常数 (具体值，如5， 11.32, true, "hello, world"等)
- TOP（$\top$, 表示未知，不可决定。可能是常量）
- BOTTOM（$\bot$，也称为NAC（Not a Constant），表示不是一个常量）

偏序关系：对于任意常数 $c$，有 $c \sube \top$ 且 $\bot \sube c$ 。从偏序关系上来看，$\bot$ 比任何常数都更精确。但在常量传播中，通常我们定义偏序为：$c \sube \top$，并且$\bot\text{(NAC)} \sube \top$，但是常数和NAC之间没有直接的偏序关系。

![constant_001](./assets/constant_propagation_001.svg)

在常量传播（尤其是 SCCP）中，**Top（⊤）** 和 **Bottom（NAC）** 是常量格（Constant Lattice）的两个关键状态，它们代表了信息的不同极端。

## Top（⊤）状态：未知但有潜力

- **信息量**：最不精确的状态（信息量最小）
- **偏序关系**：所有其他状态都比 ⊤ 精确（即 `c ⊑ ⊤` 和 `NAC ⊑ ⊤`）

- **乐观假设**：认为变量可能成为常量
  
- **可降级**：当获得更多信息时可转为常量或NAC
  
- **传播规则**：
  
  ```python
  ⊤ + c = ⊤    # 任何运算涉及⊤结果都是⊤
  ⊤ > 5 = ⊤    # 比较结果未知
  ```

- **使用场景**：

| 场景  | 示例  | 解释  |
| --- | --- | --- |
| **初始状态** | `int x;` | 变量声明后未赋值 |
| **未分析代码** | `x = mystery();` | 函数返回未知值 |
| **分支汇合** | `if(c) x=5; else x=?;` | 一条路径未定义 |
| **部分参数未知** | `y = foo(⊤, 10);` | 部分输入未知 |
| **内存位置未初始化** | `*ptr = ...` | 指针指向未知内存 |



## Const 状态：确定是常量

- **信息量**：最理想的状态，确定是一个常量。
- **偏序关系**：所有其他状态都比 ⊤ 精确（即 `c ⊑ ⊤` 和 `NAC ⊑ ⊤`）
- **可降级**：常量与NAC状态进行 meet 运算都会降级为 NAC 状态。
- **传播规则**:
    ```
    c_1 + c_2 = c_3         # 常量与常量运算得到的还是常量，与其他状态运算都不为常量
    ```

## Bottom（NAC）状态：确定不是常量

- **信息量**：精确的负面结论（信息量最大）
- **偏序关系**：比 ⊤ 精确（`NAC ⊑ ⊤`），但与具体常量不可比

- **悲观结论**：最终判定，不可逆转
  
- **吸收性**：与任何状态meet结果都是NAC
  
- **传播规则**：
  
  ```python
  NAC + c = NAC   # 任何运算涉及NAC结果都是NAC
  NAC > 5 = NAC   # 比较结果无意义
  ```

- **使用场景**

| 场景  | 示例  | 解释  |
| --- | --- | --- |
| **冲突赋值** | `if(c) x=5; else x=6;` | 不同路径赋值不同常量 |
| **非常量源** | `x = rand();` | 来自外部不可控输入 |
| **指针别名** | `*p = 10; *q=20;` | 当p和q可能指向同一内存 |
| **函数副作用** | `call_side_effect(&x);` | 函数可能修改x |
| **循环变化** | `while(...) x=x+1;` | 值在循环中变化 |


## 常量格的单调性

根据对常量格的定义，可知常量格一定为单调性，因为信息总是向下传播，最终会越来越精确。常量格的单调性保证在进行常量传播分析时（如SCCP分析）算法一定会收敛（到达终止状态）。

## 函数的返回值处理

在稀疏条件常量传播（SCCP）中处理函数调用赋值指令是复杂但关键的问题。SCCP 需要根据函数调用的具体情况确定返回值格值，同时处理可能的副作用。以下是系统化的处理策略：

### 一、函数调用处理的三大核心原则

1. **返回值格值确定**：基于函数行为推断返回值
2. **副作用建模**：处理函数对全局状态的影响
3. **上下文敏感性**：考虑调用上下文（参数值、全局状态）

---

### 二、函数调用分类处理策略

根据函数可知性（knownness）采用不同处理方式：

#### 1. 完全可知函数（纯函数/内联函数）

**特点**：函数体完全可见（如静态函数、内联函数）
**处理方式**：

- **符号执行函数体**：使用当前格值状态执行函数内部指令
- **返回值计算**：
  - 所有参数为常量 → 计算具体结果值（格值 `c`）
  - 部分参数非常量 → 保守估计（格值 `⊤` 或 `⊥`）
- **副作用**：无（纯函数）或精确建模（内联函数）

```c
// 示例：纯函数处理
int pure_add(int a, int b) { return a + b; }

int x = pure_add(3, 4); 
// SCCP: 识别参数为常量 → 返回值格值 7 (c=7)
```

#### 2. 部分可知函数（有摘要信息的库函数）

**特点**：函数体不可见但行为已知（如标准库函数）
**处理方式**：

- **函数摘要（Function Summary）**：
  
  ```python
  # 函数摘要伪代码
  def strlen_summary(ptr):
      if ptr in [null, invalid]: return ⊥  # 非常量
      if ptr points to constant string: 
          return len(string)  # 具体常量
      else:
          return ⊤  # 未知
  ```
  
- **副作用标记**：
  
  - 只读函数：`readonly`（不影响全局状态）
  - 写函数：标记可能修改的内存位置

#### 3. 完全未知函数（外部/动态函数）

**特点**：无任何行为信息（如动态库函数）
**处理方式**：

- **返回值**：设为 `⊤`（最保守估计）
- **副作用**：
  - 所有全局变量降级为 `⊤`
  - 所有指针指向对象降级为 `⊤`
- **指针参数**：假设可能修改指向内存

```c
// 示例：未知函数处理
extern int mystery_func(int param);

int y = 10;
int z = mystery_func(5); 
// SCCP处理：
//   z = ⊤ (未知)
//   y = ⊤ (可能被修改)
```

---

### 三、格值设置详细规则

#### 返回值格值计算：

| 函数类型 | 参数状态 | 返回值格值 | 说明  |
| --- | --- | --- | --- |
| 纯函数/内联 | 全部参数为常量 `c_i` | `c` | 可精确计算 |
|     | 部分参数`⊤`/`⊥` | `⊤` | 保守估计 |
| 有摘要函数 | 摘要可推导常量 | `c` | 如strlen("abc")→3 |
|     | 摘要推导失败 | `⊤`/`⊥` | 根据摘要决定 |
| 未知函数 | 任意  | `⊤` | 最保守估计 |

#### 副作用处理：

1. **全局变量更新**：
  
  ```python
  if func may_write_global(glob_var):
      lattice[glob_var] = meet(lattice[glob_var], ⊤)  # 降级
  ```
  
2. **指针参数处理**：
  
  ```python
  for each pointer_arg in call.args:
      if func may_write_to(pointer_arg):
          # 降级所有可能指向的对象
          for obj in may_alias(pointer_arg):
              lattice[obj] = meet(lattice[obj], ⊤)
  ```
  
3. **内存状态标记**：
  
  - 引入 `MemoryLattice` 跟踪内存位置状态
  - 函数调用后更新相关内存格值

---

### 四、高级处理技术

#### 1. 上下文敏感分析（Context Sensitivity）

- **调用栈识别**：区分不同调用点的相同函数
  
  ```c
  // 不同调用点不同处理
  int a = foo(5);  // 上下文1: 参数常量5
  int b = foo(x);  // 上下文2: 参数未知⊤
  ```
  
- **克隆函数摘要**：为不同上下文维护不同状态
  

#### 2. 函数指针处理

```python
# 函数指针解析流程
if call.target is function_ptr:
    possible_targets = resolve_targets(ptr)
    if all targets known:
        result = ⊥
        for each target:
            result = meet(result, evaluate_call(target, args))
    else:
        return ⊤  # 未知目标
```

#### 3. 递归函数处理

- **深度限制**：设置最大递归深度（如3层）
- **环检测**：相同上下文再次出现时返回 `⊤`
- **摘要缓存**：存储已计算上下文的结果

---

### 五、具体实现示例

```python
# SCCP函数调用处理伪代码
def handle_call(call_instr, lattice):
    func = call_instr.function

    # 1. 处理参数格值
    arg_vals = [lattice.get(arg) for arg in call_instr.args]

    # 2. 根据函数类型分派
    if is_pure_function(func):
        if all(is_constant(v) for v in arg_vals):
            # 执行符号计算
            result = symbolic_execute(func, arg_vals)
            return result
        else:
            return TOP

    elif has_summary(func):
        # 应用函数摘要
        result = apply_summary(func, arg_vals, lattice)

        # 处理摘要中声明的副作用
        for global_var in summary.modified_globals(func):
            lattice[global_var] = meet(lattice[global_var], TOP)

        return result

    else:  # 未知函数
        # 处理副作用
        for global_var in all_globals():
            lattice[global_var] = meet(lattice[global_var], TOP)

        for ptr_arg in pointer_arguments(call_instr):
            for obj in may_alias(ptr_arg):
                lattice[obj] = TOP

        return TOP  # 保守返回值
```

---

### 六、优化实践建议

1. **摘要数据库**：为常见库函数（memcpy, malloc等）预定义精确摘要
  
2. **逐步降级**：
  
  - 首次遇到函数：尝试优化分析
  - 分析失败时：降级为保守处理
3. **后向传播**：
  
  ```c
  if (mystery_func() == 5) { ... }
  // 当条件为真时，可推断返回值=5
  ```
  
4. **与内联协同**：对关键小函数优先内联再分析
  

> **性能统计**：在LLVM中，通过精确函数摘要处理可使SCCP的常量发现率提高15-40%（取决于代码库特征）

通过系统化处理函数调用，SCCP能在保证正确性的前提下，最大化常量传播的优化效果，尤其对于包含丰富库函数调用的现代代码至关重要。

## $\phi$ 函数处理

在常量传播中，Meet 操作（$\wedge$）是用于合并来自不同路径信息的核心运算。当对 $\phi$ 函数指令进行求值，分析器需要对所有参数进行Meet操作。 

### Meet 操作

Meet操作的实现思路如下：
```python
def meet(a: ConstLattice, b: ConstLattice) -> ConstLattice:
    # 处理相同值情况
    if a == b:
        return a
    
    # 处理 TOP 情况
    if a.is_top():
        return b
    if b.is_top():
        return a
    
    # 处理 NAC 情况
    if a.is_nac() or b.is_nac():
        return ConstLattice.NAC
    
    # 处理不同常量情况
    if a.is_constant() and b.is_constant():
        if a.value == b.value:
            return a
        else:
            return ConstLattice.NAC
    
    # 默认返回 NAC
    return ConstLattice.NAC

def multi_meet(values: List[ConstLattice]) -> ConstLattice:
    result = values[0]
    for v in values[1:]:
        result = meet(result, v)
        if result.is_nac():  # 提前终止优化
            break
    return result
```

### 参数处理

| 输入组合 | 结果 | 说明 |
|---------|------|------|
| 所有值相同常数 | CONST | 所有路径一致 |
| 混合相同常数+TOP | CONST | 一致路径+未知路径 |
| 不同常数 | NAC | 路径间冲突 |
| 包含 NAC | NAC | 存在非常量 |
| 全部 TOP | TOP | 完全未知 |

**案例分析**

- **情况 1**：两个常数相同
  ```python
  输入: [TOP, 5, 5]
  Meet: meet(TOP, 5) → 5; meet(5, 5) → 5
  结果: CONST(5)
  ```
  
- **情况 2**：两个常数不同
  ```python
  输入: [TOP, 5, 10]
  Meet: meet(TOP, 5) → 5; meet(5, 10) → NAC
  结果: NAC
  ```

### $\phi$ 函数示例分析

#### 案例1：一致路径 + 未知路径
```c
// 前驱1: x = 5 (CONST)
// 前驱2: x = ? (TOP) - 但该路径实际不可达
Phi(x) = meet(5, TOP) = 5
```
**优化**：可折叠为常量5

#### 案例2：冲突路径
```c
// 前驱1: x = 5 (CONST)
// 前驱2: x = 5 (CONST)
// 前驱3: x = 10 (CONST)
Phi(x) = meet(5, 5, 10) = NAC
```
**优化**：无法折叠，保留原始Phi

#### 案例3：部分已知 + NAC
```c
// 前驱1: x = 5 (CONST)
// 前驱2: x = ? (TOP)
// 前驱3: x = rand() (NAC)
Phi(x) = meet(5, TOP, NAC) = NAC
```
**优化**：标记为非常量

#### 案例4：循环中的Phi
```c
i = 0;          // i=0
while (i < 10) {
    // Phi(i) 输入:
    //   前次迭代: i_prev (初始0)
    //   循环体: i = i_prev + 1
    i = i + 1;  // i_prev=0 → i=1; i_prev=1 → i=2; ...
}
```
**处理**：
1. 初始：Phi(i) = meet(0, TOP) = 0
2. 迭代1：i = 0+1 = 1 → Phi(i) = meet(0,1) = NAC
3. 宽化：i = [0,∞] → 设置为NAC


## 实际案例分析


### 1. 设置为 NAC 的情况
```c
// 场景1: 不同路径赋值不同常量
if (cond) {
    x = 5;   // 路径1: CONST(5)
} else {
    x = 10;  // 路径2: CONST(10)
}
// Phi(x) = meet(5,10) = NAC

// 场景2: 存在非常量赋值
x = rand();  // x = NAC
y = x + 1;   // y = NAC

// 场景3: 指针别名冲突
*p = 5;
*q = 10;
// 若 p 可能指向 q，则 *p = NAC
```

### 2. 设置为 TOP 的情况
```c
// 场景1: 未初始化变量
int x;       // x = TOP
int y = x+1; // y = TOP

// 场景2: 部分路径未定义
if (cond) {
    x = 5;   // 路径1: CONST(5)
}
// 路径2: x 未定义 → TOP
// Phi(x) = meet(5, TOP) = 5? 错误！应为 TOP
// 正确：Phi(x) = meet(5, TOP) = 5 仅当路径2不可达时成立

// 场景3: 外部输入
x = input(); // x = TOP
```


### 其他案例


案例1：⊤ 的典型场景

```c
int func(int param) {
    int a = param;  // a=⊤ (参数值未知)
    int b = a * 10; // b=⊤
    if (b > 100) {  // 条件未知
        // 保留分支
    }
    return b;       // 返回⊤
}
```

**优化影响**：无法进行常量折叠，保留所有分支

案例2：NAC 的典型场景

```c
void process() {
    int counter = 0;        // counter=0
    while (read_sensor()) { // 返回值NAC（外部输入）
        counter++;          // counter=NAC
    }
    int result = counter*5; // result=NAC
    // 后续无法优化result的使用
}
```

**优化影响**：阻止循环展开和常量传播

案例3：⊤→NAC 的转换

```c
int x;              // x=⊤
if (rand() % 2) {   // 条件NAC
    x = 5;          // 路径1：x=5
} else {
    x = 10;         // 路径2：x=10
}
// 汇合点：meet(5,10)=NAC
```

**关键点**：控制流合并将⊤/常量转为NAC