# 到达定值

我们可能希望找出在某个程序点上一个变量可能有哪些值，以及这些值可能在哪里定值。考虑下面这段代码：

$$
\begin{aligned}
&d_1: \quad a \leftarrow 1 \\
&d_2: \quad \text{if read() <= 0 goto } d_6 \\
&d_3: \quad b \leftarrow a \\
&d_4: \quad a \leftarrow 6 \\
&d_5: \quad \text{goto } d_2 \\
&d_6: \quad \text{other instructions} \\
\end{aligned}
$$

我们可能对程序点( $d_6$ )上的所有程序状态进行总结：$a$ 的值总是 ${1, 6}$ 中的一个，而它由 ${d_1, d_4}$ 中的一个定值。*可能*沿着某条路径到达某个程序点的定值称为到达定值(*reaching definition*)。