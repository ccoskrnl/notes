# Static Single Assignment Form

In optimizing compilers, data structure choices directly influence the power and efficiency of practical program optimization. A poor choice of data structure can inhibit optimization or slow compilation to the point where advanced optimization features become undesirable.  Static single-assignment form is a relatively new intermediate representation that effectively separates the values operated on in a program from the locations they are stored in, making possible more effective versions of several optimizations.

The translation process into SSA form first figures out at what join points to insert $\phi$-functions, then inserts trivial $\phi$-functions (i.e., $\phi$-functions of the form $\phi (x, x , \ldots , x )$) with the number of argument positions equal to the number of control-flow predecessors of the join point that some definition of the variable reaches, and then renames definitions and uses of variables (conventionally by subscripting them) to establish the static single-assignment property. Once we have finished doing whatever we translated to SSA form for, we need to eliminate the $\phi$-functions, since they are only a conceptual tool, and are not computationally effective—i.e., when we come to a join point with a $\phi$-function while executing a procedure, we have no way to determine which branch we came to it by and hence which value to use.

**Where to Place $\phi$-Functions**

At first glance, careful placement might seem to require the enumeration of pairs of assignment statements for each variable. Checking whether there are two assignments to V that reach a common point might seem to be intrinsically nonlinear. In fact, however, it is enough to look at the dominance frontier of each node in the control flow graph. Leaving the technicalities to later sections, we sketch the method here.

Suppose that a variable $V$ has just one assignment in the original program, so that any use of $V$ will be either a use of $V_0$ at entry to the program or a use of $V_1$ from the most recent execution of the assignment to $V$. Let $X$ be the basic block of code that assigns to $V$, so $X$ will determine the value of $V$ when control flows along any edge $X \rarr Y$ to a basic block $Y$. When entered along $X \rarr Y$, the code in $Y$ will see $V_1$ and be unaffected by $V_0$. If $Y \neq X$, but all paths to $Y$ must still go through $X$ (in which case $X$ is said to $strictly \; dominate \; Y$), then the code in $Y$ will always see $V_1$. Indeed, any node strictly dominated by $X$ will always see $V_1$, no matter how far from $X$ it may be. **Eventually, however, control may be able to reach a node $Z$ not strictly dominated by $X$. Suppose $Z$ is the first such node on a path, so that $Z$ sees $V_1$ along one in-edge but may see $V_0$ along another in-edge. Then $Z$ is said to be $in \; the \; dominance \; frontier$ of $X$ and is clearly in need of a $\phi$-function for $V$.** In general, no matter how many assignments to $V$ may appear in the original and no matter how complex the control flow may be, we can place $\phi$-functions for $V$ by finding the dominance frontier of every node that assigns to $V$, then the dominance frontier of every node where a $\phi$-function has already been placed, and so on.

**Dominance Frontier**

For a flowgraph node $x$, the dominance frontier of $x$, written $DF(x)$, is the set of all nodes $y$ in the flowgraph such that $x$ dominates an immediate predecessor of $y$ but does not strictly dominate $y$, i.e.,
$$
DF(x) = \left\{ y \; | (\exist z \in Pred(y) \; \text{such that}\; x \; dom \; z ) \; \text{and} \; x \; !sdom \; y\right\}
$$

Computing $DF(x)$ directly for all $x$ would be quadratic in the number of nodes in the flowgraph. An algorithm that is linear results from breaking it into the computation of two intermediate components, $DF_{local}(x)$ and $DF_{up}(x, z)$, as follows:
$$
DF_{local}(x) = \{ y \in Succ(x) \; | \; idom(y) \neq x \} \\
DF_{up}(x, z) = \{ y \in DF(z) \; | \; idom(z) = x \; \& \; idom(y) \neq x \}
$$
and computing $DF(x)$ as 
$$
DF(x) = DF_{local}(x) \bigcup\limits_{z \in N(idom(z) = x)} DF_{up} (x, z)
$$
To compute the dominance frontier for a given flowgraph, we turn the above equations into the code shown in bellow snippet. 

**Iterated Dominance Frontier($DF^+$)**

Now, we define for a set of flowgraph nodes $S$, the dominance frontier of $S$ as
$$
DF(S) = \bigcup\limits_{x \in S} DF(x)
$$
and the *iterated dominance frontier* $DF^+()$ as 
$$
DF^+(S) = \lim\limits_{i \rarr \infty} DF^i(S)
$$
where $DF^1(S) = DF(S)$ and $DF^{i+1}(S) = DF(S \cup DF^i(S))$. **If $S$ is the set of nodes that assign to variable $x$, plus the entry node, then $DF^+(S)$ is exactly the set of nodes that need $\phi$-functions for $x$.**

**Key Properties**

1.   SSA Construction:

     Used to determine where $\phi$-functions are needed. If a variable is defined in $S$, $\phi-$functions are placed at $DF^+(S)$.

2.   Convergence Points:

     Nodes in $DF(B)$ are points where control flow paths merge, ending $B's$ dominance.

     









## References

1. RON CYTRON, JEANNE FERRANTE, BARRY K. ROSEN, and MARK N. WEGMAN  IBM Research Division  and  F. KENNETH ZADECK  Brown University. Efficiently computing static single assignment form and the control dependence graph. ACM Trans. Program. Lang. Syst. p451-490. 10/1991. https://dl.acm.org/doi/10.1145/115372.115320
2. Muchnick and Steven S. Advanced compiler design and implementation.