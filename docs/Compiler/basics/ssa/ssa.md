# 静态单赋值形式 (Static Single Assignment Form)

在优化编译器中，数据结构的选择直接影响到实际程序优化的能力和效率。一个糟糕的数据结构选择会阻碍优化，或者将编译速度拖慢到使得高级优化功能变得不可取的程度。静态单赋值形式（SSA）是一种相对较新的中间表示形式，它能有效地将程序中操作的值与存储它们的位置分离开来，从而使多种优化能够实现更有效的版本。

转换到 SSA 形式的过程首先确定在哪些**汇合点**插入 $\phi$ 函数，然后插入**平凡 $\phi$ 函数**（即形式为 $\phi(x, x, ..., x)$ 的 $\phi$ 函数），其参数位置的数量等于该汇合点的控制流前驱中能到达该点的某个变量定义的数量，最后对变量的定义和使用进行重命名（通常通过添加下标）以建立静态单赋值属性。一旦我们完成了需要转换到 SSA 形式才能完成的任务，就需要消除这些 $\phi$ 函数，因为它们只是一个概念性工具，在计算上并不高效 —— 也就是说，当我们在执行过程时到达一个带有 $\phi$ 函数的汇合点时，我们无法确定是通过哪个分支到达该点的，因此也就无法确定应该使用哪个值。

## 定义

### **支配者 (Dominator)**

我们说节点 $d$ **支配 (dominates)** 节点 $i$，记作 $d \text{ dom } i$，如果从程序入口到 $i$ 的每一条可能的执行路径都包含 $d$。显然，支配关系是自反的（每个节点支配自身）、传递的（如果 $a \text{ dom } b$ 且 $b \text{ dom } c$，则 $a \text{ dom } c$）和反对称的（如果 $a \text{ dom } b$ 且 $b \text{ dom } a$，则 $b = a$）。我们进一步定义一个称为**直接支配 (immediate dominance)** 的子关系（记作 idom），使得对于 $a \neq b$，当且仅当 $a \text{ dom } b$ 且不存在节点 $c$（$c \neq a$ 且 $c \neq b$）使得 $a \text{ dom } c$ 且 $c \text{ dom } b$ 时，$a \text{ idom } b$。我们记 $ \text{idom}(b)$ 表示 $b$ 的**直接支配者 (immediate dominator)**。显然，一个节点的直接支配者是唯一的。直接支配关系构成流图节点的一棵树，其根节点是入口节点，树的边代表直接支配关系，树的路径显示了所有的支配关系。此外，我们说 $d$ **严格支配 (strictly dominates)** $i$，记作 $d \text{ sdom } i$，如果 $d$ 支配 $i$ 且 $d \neq i$。

### **$\phi$ 函数的放置位置 (Where to Place $\phi$-Functions)**

乍一看，仔细放置 $\phi$ 函数似乎需要为每个变量枚举赋值语句对。检查是否存在两个对变量 $V$ 的赋值能够到达一个公共点似乎本质上是非线性的。然而，实际上，查看控制流图中每个节点的**支配边界 (dominance frontier)** 就足够了。我们将技术细节留到后面的部分，这里概述一下方法。

假设一个变量 $V$ 在原始程序中只有一个赋值语句，那么任何对 $V$ 的使用要么是程序入口处的 $V_0$，要么是最近一次执行对 $V$ 的赋值后产生的 $V_1$。设 $X$ 是给 $V$ 赋值的**基本块 (basic block)**，那么当控制流沿着边 $X \rightarrow Y$ 流向基本块 $Y$ 时，$X$ 将决定 $V$ 的值。当沿着 $X \rightarrow Y$ 进入 $Y$ 时，$Y$ 中的代码将看到 $V_1$ 且不受 $V_0$ 的影响。如果 $Y \neq X$，但所有到达 $Y$ 的路径仍然必须经过 $X$（在这种情况下，称 $X$ **严格支配 (strictly dominates)** $Y$），那么 $Y$ 中的代码将总是看到 $V_1$。事实上，任何被 $X$ 严格支配的节点，无论离 $X$ 有多远，都将总是看到 $V_1$。**然而，最终控制流可能会到达一个不被 $X$ 严格支配的节点 $Z$。假设 $Z$ 是某条路径上第一个这样的节点，那么 $Z$ 沿着一条入边看到 $V_1$，但沿着另一条入边可能看到 $V_0$。那么称 $Z$ 位于 $X$ 的支配边界中 (in the dominance frontier of X)，并且显然需要为 $V$ 放置一个 $\phi$ 函数。** 一般来说，无论原始程序中有多少个对 $V$ 的赋值，也无论控制流多么复杂，我们都可以通过找到每个给 $V$ 赋值的节点的支配边界，然后找到已经放置了 $\phi$ 函数的每个节点的支配边界，依此类推，来放置 $V$ 的 $\phi$ 函数。

### **支配边界 (Dominance Frontier)**

对于一个流图节点 $x$，其支配边界记作 $DF(x)$，是流图中所有满足以下条件的节点 $y$ 的集合：$x$ 支配 $y$ 的一个**直接前驱 (immediate predecessor)**，但 $x$ 不严格支配 $y$。即：
$$
DF(x) = \left\{ y \; | (\exist z \in Pred(y) \; \text{使得}\; x \; dom \; z ) \; \text{且} \; x \; !sdom \; y\right\}
$$

为所有 $x$ 直接计算 $DF(x)$ 的复杂度将是流图节点数量的平方级。一个线性复杂度的算法通过将其分解为计算两个中间部分 $DF_{local}(x)$ 和 $DF_{up}(x, z)$ 来实现：
$$
DF_{local}(x) = \{ y \in Succ(x) \; | \; idom(y) \neq x \} \\
DF_{up}(x, z) = \{ y \in DF(z) \; | \; idom(z) = x \; \& \; idom(y) \neq x \}
$$
然后计算 $DF(x)$ 为：
$$
DF(x) = DF_{local}(x) \bigcup\limits_{z \in N(idom(z) = x)} DF_{up} (x, z)
$$

下面这段Python代码用来计算支配边界：

```python
def dom_front(
     n_bbs: int
     , post_order: List[BasicBlockId]
     , succ: Dict[BasicBlockId, List[BasicBlockId]]
     , idom: Dict[BasicBlockId, BasicBlockId]
     ) -> Dict[int, set]:
     """
     计算支配边界
     :param n_bbs: 基本块的数量
     :param post_order: 控制流图的后续遍历
     :param succ: 基本块的后续节点
     :param idom: 基本块的立即支配节点
     :return: 返回支配边界字典
     """
     df: Dict[int, set] = {i: set() for i in range(n_bbs)}

     for i in post_order:
          # Compute local component
          for y in succ[i]:
               if idom[y] != i:
               df[i] |= {y}
          # Add on up component
          z = idom[i]
          if z != -1:
               for y in df[z]:
               if y != idom[i]:
                    df[i] |= {y}
     return df
```

### **迭代支配边界 (Iterated Dominance Frontier) ($DF^+$)**

现在，我们为一个流图节点集合 $S$ 定义其支配边界为：
$$
DF(S) = \bigcup\limits_{x \in S} DF(x)
$$
并定义***迭代支配边界*** $DF^+()$ 为：
$$
DF^+(S) = \lim\limits_{i \rarr \infty} DF^i(S)
$$
其中 $DF^1(S) = DF(S)$ 且 $DF^{i+1}(S) = DF(S \cup DF^i(S))$。**如果 $S$ 是给变量 $x$ 赋值的节点集合加上入口节点，那么 $DF^+(S)$ 正是需要为 $x$ 放置 $\phi$ 函数的节点集合。**

下面这段Python代码用来计算迭代支配边界：
```python
def df_plus(sn: set[int], df: Dict[int, set]) -> set
     """
     iterated dominance frontier DF+()
     :param sn: 基本块Id集合
     :param df: 基本块的支配边界字典
     :return:
     """

     dfp: set = set()

     def df_set(s: set):
          dn = set()
          for x in s:
               dn |= df[x]
          return dn

     change = True
     dfp = df_set(sn)
     while change:
          change = False
          d = df_set(sn | dfp)
          if d != dfp:
               dfp = d
               change = True

     return dfp
```

### **关键属性 (Key Properties)**

1.   **SSA 构造 (SSA Construction):**
     用于确定哪里需要 $\phi$ 函数。如果一个变量在集合 $S$ 中被定义，则需要在 $DF^+(S)$ 放置 $\phi$ 函数。

2.   **汇合点 (Convergence Points):**
     $DF(B)$ 中的节点是控制流路径合并的点，这些点标志着 $B$ 的支配范围的结束。

## 最小化SSA算法实现

```python
def minimal_ssa(cfg: ControlFlowGraph):
     # 集合，元素为变量名
     variables: set[str] = set()
     # 字典，键为变量名，值为列表，记录所有定义过该变量名的基本块
     def_sites: Dict[str, List] = {v: [] for v in variables}

     # 收集所有定义的变量名
     for inst in cfg.insts.ret_insts():
          """遍历所有的指令，如果是赋值指令，收集定义变量名"""
          if inst.is_assignment():
               # 获取目的操作数的值，将变量转换为字符串，记录
               variables.add(str(inst.get_dest_var().value))

     # 收集所有定义变量的基本块
     for block in cfg.blocks.values():
          for inst in block.insts.ret_insts():
               if inst.is_assignment():
                    variable: Variable = inst.get_dest_var().value
                    def_sites[str(variable)].append(block.id)
     
     # 插入必要的 phi 函数
     for varname in variables:

          # 先进先出队列
          worklist = deque(def_sites[varname])
          even_on_worklist = set(def_sites[varname])

          # 如果当前变量只被定义过一次，根据 phi 函数的规则，我们就不需要
          # 为该变量插入 phi 函数。
          if len(even_on_worklist) == 1:
               continue

          # 迭代处理工作列表
          while worklist:
               # 获取定义当前变量的块id
               def_block_id = worklist.popleft()

               # 迭代当前块的支配边界
               for y in cfg.df[def_block_id]:

                    # 根据块id获取基本块对象
                    y_block = cfg.blocks[y]

                    # 检查当前基本块是否含有当前变量v的phi函数
                    if not has_phi_for_var(y_block, varname):

                         # 创建phi指令，参数为变量名和当前基本块的前驱数量(作为phi函数的参数个数)
                         new_phi = create_phi_function(varname, num_pred_s=len(cfg.pred[y]))

                         # 找到当前块中第一条常规指令在控制流指令列表中的位置
                         insert_index = cfg.insts.index_for_inst(y_block.first_ordinary_inst)
                         # 将phi指令插入到指定位置
                         cfg.add_new_inst(insert_index, new_phi, y_block)
                         # 将phi指令插入到基本块指令列表的首位置
                         y_block.insts.add_phi_inst(new_phi)

                         # 检查y是否是首次被插入到了工作列表，如果不是首次，加入到工作列表
                         if y not in even_on_worklist:
                            even_on_worklist.add(y)
                            worklist.append(y)
     
     rename_variables(cfg, def_sites, variables)


def rename_variables(cfg: ControlFlowGraph, def_sites: Dict[str, List], variables: set[str]) -> None:

     # 初始化版本计数器
     counters: Dict[str, int] = {v: 0 for v in def_sites.keys()}

     # 初始化当前版本栈
     stacks = defaultdict(list)

     # 收集在每个基本块退出时变量的版本 { block: { var: version } }
     block_versions: Dict[int, dict] = defaultdict(dict)

     # 临时存储phi的操作数 { block: { var: [operands] }
     phi_operands: Dict[int, dict] = defaultdict(lambda: defaultdict(list))

     # 为每个变量初始化为 0 版本，存放在栈中
     for var in variables:
          stacks[var].append(0)


     """
     确保我们在进行变量重命名之前首先计算好支配树。
     由于我们是按照访问支配树的顺序设置phi函数进行变量重命名，对于循环结构（带有回边）
     变量的版本并不严格递增
     """

     def rename_use_operand(operand: Operand):
          if operand:
               if operand.type == OperandType.VAR:
               if operand.value.varname in stacks:
                    operand.type = OperandType.SSA_VAR
                    operand.value = SSAVariable(operand.value, stacks[operand.value.varname][-1])

               elif operand.type == OperandType.ARGS:
               for arg in operand.value.args:
                    # if arg.type == OperandType.VAR:
                    if isinstance(arg.value, Variable):
                         if arg.value.varname in stacks:
                              arg.type = OperandType.SSA_VAR
                              arg.value = SSAVariable(arg.value, stacks[arg.value.varname][-1])


          else:
               pass

     # depth first search
     def dfs(block_para: BasicBlock):

          nonlocal counters, stacks, block_versions, phi_operands

          """
          1. 处理当前基本块中所有phi指令，并为phi函数的版本分配一个新的版本
          """
          phi_def_list: List[str] = []
          for phi_inst_in_cbb in block_para.insts.ret_phi_insts():
               assert isinstance(phi_inst_in_cbb.result.value, SSAVariable)
               v: SSAVariable = phi_inst_in_cbb.result.value

               v_n = v.base_name

               # 为phi函数的结果分配新的版本
               counters[v_n] += 1
               v.version = counters[v_n]

               # 添加到栈
               stacks[v_n].append(counters[v_n])
               phi_def_list.append(v_n)

          """
          2. 重命名传统指令中的变量名
          """
          for inst_in_cbb in block_para.insts.ret_ordinary_insts():
               """
               遍历当前基本块中所有的传统指令，分别重命名use和def指令
               """
               rename_use_operand(inst_in_cbb.operand1)
               rename_use_operand(inst_in_cbb.operand2)

               if inst_in_cbb.is_assignment():

                    # 获取结果变量，并分配新的版本
                    v: Variable = inst_in_cbb.get_dest_var().value
                    counters[v.varname] += 1

                    # 构造SSA变量
                    new_ver = counters[v.varname]
                    new_var = SSAVariable(v, new_ver)

                    # 设置指令的结果操作数
                    inst_in_cbb.result.type = OperandType.SSA_VAR
                    inst_in_cbb.result.value = new_var

                    # 添加到栈中
                    stacks[v.varname].append(new_ver)

          """
          3. 收集基本块结束时变量的版本
          """
          exit_versions = {}
          for v in variables:
               exit_versions[v] = stacks[v][-1]
          block_versions[block_para.id] = exit_versions

          """
          4. 收集所有后继块中phi函数的操作数
          """
          for succ in cfg.succ[block_para.id]:
               cbb_idx_in_pred = cfg.pred[succ].index(block_para.id)
               succ_bb = cfg.blocks[succ]

               if succ not in phi_operands:
                    phi_operands[succ] = {}

               for phi_inst_in_cbb in succ_bb.insts.ret_phi_insts():
                    result: SSAVariable = phi_inst_in_cbb.result.value
                    varname = result.base_name

               if varname not in phi_operands[succ]:
                    phi_operands[succ][varname] = [-1] * len(cfg.pred[succ])  # default version

               current_ver = stacks[varname][-1] if varname in stacks and stacks[varname] else 0
               # save operands
               phi_operands[succ][varname][cbb_idx_in_pred] = current_ver

          """
          5. 访问支配树
          """
          for child_id in block_para.dominator_tree_children_id:
               dfs(cfg.blocks[child_id])

          """
          6. 回溯时弹出当前作用域版本
          """
          for inst_in_cbb in reversed(block_para.insts.ret_ordinary_insts()):
               if inst_in_cbb.is_assignment():
               if isinstance(inst_in_cbb.result.value, Variable):
                    result: Variable = inst_in_cbb.result.value
                    varname = result.varname
                    stacks[varname].pop()
               elif isinstance(inst_in_cbb.result.value, SSAVariable):
                    result: SSAVariable = inst_in_cbb.result.value
                    stacks[result.base_name].pop()
               else:
                    raise TypeError("Only Variables or SSAVariables are allowed")

          for v in reversed(phi_def_list):
               stacks[v].pop()

     
     # 指令变量重命名
     dfs(cfg.root)

     # 应用phi的操作数并对原phi指令进行重命名
     for block_id, phi_data in phi_operands.items():

          # calculate pred block index
          pred_index_map: Dict[int, int] = {pred_id: idx for idx, pred_id in enumerate(cfg.pred[block_id])}

          block: BasicBlock = cfg.blocks[block_id]

          for phi in block.insts.ret_phi_insts():
               result_var: SSAVariable = phi.result.value
               base_varname: str = result_var.base_name

               if base_varname not in phi_data:
               continue

               phi_args: Args = phi.operand2.value
               for index, pred_id in enumerate(cfg.pred[block_id]):
               # get index from dict
               pred_index = pred_index_map[pred_id]
               # obtain the version number of the corresponding predecessor.
               version = phi_data[base_varname][pred_index]
               phi_arg_var: SSAVariable = phi_args.args[index].value
               phi_arg_var.version = version
```


## References

1. RON CYTRON, JEANNE FERRANTE, BARRY K. ROSEN, and MARK N. WEGMAN  IBM Research Division  and  F. KENNETH ZADECK  Brown University. Efficiently computing static single assignment form and the control dependence graph. ACM Trans. Program. Lang. Syst. p451-490. 10/1991. https://dl.acm.org/doi/10.1145/115372.115320
2. Muchnick and Steven S. Advanced compiler design and implementation.