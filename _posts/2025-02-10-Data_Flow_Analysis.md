---
title: Data Flow Analysis
date: 2025-02-10
---

# Data Flow Analysis

Performing compile time optimization requires solving a class of problems, called Global data flow analysis problems (abbreviated as gdfap's), involving determination of information which is distributed throughout the program.

## Lattice Theoretic

**Definition**: A flow graph is a triple $ G = (N, E, n_0) $, where: 

1. $N$ is a finite set of nodes.
2. $E$ is a subset of $ N \times N $ called the edges. The edge $(x, y)$ enters node y and leaves node $x$. We say that $x$ is a predecessor of $y$, and $y$ a successor of $x$.
3. $n_0$ in $N$ is the initial node. There is a path from $n_0$ to every node.

**Definition**:  A semilattice is a set $L$ with a binary meet operation $\wedge$ such that for all $ a, b, c \in L $:
$$
\begin{align*}
& a \wedge a = a & \text{idempotent} \\ 
& a \wedge b = b \wedge a & \text{commutative} \\
& a \wedge ( b \wedge c ) = (a \wedge b ) \wedge c & \text{accociative} 
\end{align*}
$$
**Definition**: Given a semilattice $L$ and elements, $a, b \in L$, we say that
$$
\begin{flalign}
& a \geq b \qquad \iff \; a \wedge b = b \\
& a \ge b \qquad \iff \; a \wedge b = b \; and \; a \neq b
\end{flalign}
$$
also $ a \leq b $ means $ b \geq a$ and $ a < b $ means $ b > a $. We extend the notation of the meet operation to arbitrary finite sets by saying
$$
\bigwedge\limits_{1 \leq i \leq n} x_i = x_1 \wedge x_2 \wedge ... \wedge x_n
$$
**Definition**: A semilattice $L$ is said to have a bottom element $\bot$, if for all $ x \in L, \bot \wedge x = \bot$. $L$ is said to have a top element $\top$, if $\top \wedge x = x$ for all $x \in L$. We assume from here on that every semilattice has a bottom element, but not necessarily a top element.

**Definition**: Given a semilattice $L$, a sequence of elements $x_1, x_2, ..., x_n $ in $L$ forms a chain if $ x_i > x_{i-1}$ for $ 1 \leq i < n $. $L$ is said to be bounded if for each $x \in L$ there is a constant $b_x$ such that each chain beginning with $x$ has length at most $b_x$.

If $L$ is bounded, then we can take meets over countably infinite sets if we define $ \bigwedge\limits_{x\in S}x$, where $ S = \{ x_1, x_2, ...\} $, to be $\lim_{n \to\infty} \bigwedge\limits_{1 \leq i \leq n} x_i $ . The fact that $L$ is bounded assures us there is an integer $m$ such that $\bigwedge\limits_{x\in S} x = \bigwedge\limits_{1 \leq i \leq m} x_i$.

**Partial Orders and Greatest Lower Bounds**

As we shall see, the meet operator of a semilattice define a partial order on the values of the domain. A relation $\leq$ is a $partial\;order$ on a set $V$ if $\forall x, y, z \in V$:

1. $x \leq x$ (the partial order is $reflexive$).
2. If $x \leq y$ and $y \leq x $, then $x = y$ (the partial order is $antisymmetice$).
3. If $x \leq y$ and $y \leq z$, then $x \leq z$ (the partial order is $transitive$).

The pair $(V, \leq)$ is called a $poset$, or $partially\;ordered\;set$. It is also convenient to have a $ < $ relation for a post, defined as
$$
x < y \quad \iff (x \leq y)\;\text{and}\;(x \neq y).
$$
Suppose $(V, \wedge)$ is a semilattice. A $greatest \; lower \; bound$ (or $glb$) of domain elements $x$ and $y$ is an element $g$ such that

1. $g \leq x$,
2. $g \leq y$, and 
3. If $z$ is any element such that $z \leq x \; \text{and} \; z \leq y, \; \text{then} \; z \leq g$.

It turns out that the meet of $x$ and $y$ is their only greatest lower bound. To see why, let $g = x \wedge y$. Observe that:

- $g \leq x$ because $(x \wedge y) \wedge x = x \wedge y$.
- $g \leq y$ by a similar argument.
- Suppose $z$ is any element such that $z \leq x$ and $z \leq y$. We claim $z \leq g$, and therefore, $z$ cannot be a glb of x and y unless it is also $g$. In proof: $(z \wedge g) = (z \wedge (x \wedge y)) = ((z \wedge x) \wedge y)$. Since $z \leq x$, we know $(z \wedge x) = z$, so $(z \wedge g) = ( z \wedge y)$. Since $z \leq y$, we know $z \wedge y = z $, and therefore $ z \wedge g = z $. We have proven $ z \leq g$ and conclude $ g = x \wedge y$ is the only glb of $x$ and $y$. 

## Monotone Data Flow Analysis Frameworks

**Definition**: Given a bounded semilattice $L$, a set of functions $F$ on $L$ is said to be a $monotone \; function \; space \; associated \; with \; L$ if the following conditions are satisfied:

- [M1] Each $f\in F$ satisfies the $monotoncity$ condition,
  $$
  (\forall x, y \in L)(\forall f \in F)\;[f(x \wedge y) \leq f(x) \wedge f(y)]
  $$

- [M2] There exists an identify function $i$ in $F$, such that
  $$
  (\forall x \in L)\; [i(x) = x].
  $$

- [M3] $F$ is closed under composition, i.e. $f, g \in F \Rightarrow f \circ g\in F$, where
  $$
  (\forall x, y \in L) \; [f \circ g (x) = f(g(x))]
  $$

- [M4] $L$ is equal to the closure of $\{ 0 \}$ under the meet operation and application of functions in $F$.

$Observation \; 1$. Given a semilattice $L$, let $f$ be a function on $L$, then
$$
(\forall x, y \in L) \; [f(x \wedge y) \leq f(x) \wedge f(y)] \iff (\forall x, y \in L) \; [x\leq y \; implies \; f(x) \leq f(y)]
$$
$proof$. We shall assume $(\forall x, y \in L) \; [x\leq y \; implies \; f(x) \leq f(y)]$ and show that $(\forall x, y \in L) \; [f(x \wedge y) \leq f(x) \wedge f(y)]$ holds. Since $x \wedge y$ is the greatest lower bound of $x$ and $y$, we know that
$$
x \wedge y \leq x \quad and \quad x \wedge y \leq y 
$$
Thus, by $(\forall x, y \in L) \; [x\leq y \; implies \; f(x) \leq f(y)]$,
$$
f(x \wedge y) \leq f(x) \quad and \quad f(x \wedge y) \leq f(y).
$$
Since $f(x) \wedge f(y)$ is the greatest lower bound of $f(x)$ and $f(y)$, we have $(\forall x, y \in L) \; [f(x \wedge y) \leq f(x) \wedge f(y)]$.

Conversely, let us assume $(\forall x, y \in L) \; [f(x \wedge y) \leq f(x) \wedge f(y)]$ to prove $(\forall x, y \in L) \; [x\leq y \; implies \; f(x) \leq f(y)]$. We suppose $x \leq y$ and use $(\forall x, y \in L) \; [f(x \wedge y) \leq f(x) \wedge f(y)]$ to conclude $f(x) \leq f(y)$. Since $x \leq y$ is assumed, $x \wedge y = x$ , by definition. We know that
$$
f(x) \leq f(x) \wedge f(y).
$$
Since $f(x) \wedge f(y)$ is the $glb$ of $f(x)$ and $f(y)$, we know $f(x) \wedge f(y) \leq f(y)$. Thus
$$
f(x) \leq f(x) \wedge f(y) \leq f(y)
$$
implies $(\forall x, y \in L) \; [x\leq y \; implies \; f(x) \leq f(y)]$.



$Observation\;2$. For any bounded semilattice $L$ and any countable set $S \subseteq L$, if for all $x \in S$ we have $ x \geq y$, then $\bigwedge\limits_{x\in S} x\geq y$.

**Definition**: A Monotone data flow analysis framework is a triple $D = (L, \wedge, F)$, where

1. $L$ is a bounded semilattice with meet $\wedge$.
2. $F$ is a monotone function space associated with $L$.

A particular instance of a monotone data flow analysis framework is a pair $I = (G, M)$, where

1. $G = (N, E, n_0)$ is a flow graph.
2. $M: N \rightarrow F$ is a function which maps each node in $N$ to a function in $F$.

Some monotone data flow analysis frameworks satisfy the condition:
$$
(\forall x, y \in L)(\forall f \in F)\;[f(x \wedge y) = f(x) \wedge f(y)]\qquad\text{(distributivity)}
$$
That is, each $f$ in $F$ is a homomorphism on $L$. There are many interesting  gdfap's which are monotone data flow analysis frameworks but which do not satisfy the distributivity property. The following are some examples.

Constant Propagation can be formalized as a monotone data flow analysis framework $CONST = (L, \wedge, F)$. Here $L \subset 2^{V \times R}$, where **$V = \{ A_1, A_2, ...\}$ is an infinite set of variables** and **$R$ is the set of all real numbers.**

- $L$ is the set of functions from finite subsets of $V$ to $R$.
- $\theta \in L$ is the function which is undefined for all $A_i \in V$.

- The meet operation on $L$ is set intersection.

Intuitively, $z\in L$ stands for the information about variables which we may assume at certain points  of the program flow graph. $(A, r) \in z$ implies the variable A has value $r$.

We define a notation for functions in $F$ based on the sequence of assignments whose effect they are to model.

1. There are functions denoted $\langle A := B \,\theta\, C \rangle$ and $\langle A := r \rangle$ in $F$, for each $A$, $B$ and $C$ in $V$, $r \in R$ and $\theta \in \{ +, -, *, / \}$.

Let $z \in L$. Then

- $\langle A := B \,\theta\, C \rangle(z) = z'$, where $z'(X) = z(X)$ for all $X \in V - \{A\}$;  $z'(A)$ is undefined unless $z(B) = b$ and $z(C) = c$ for some $b$ and $c$ in R, in which case $z'(A) = b\,\theta\,c$.

  > Assume that $z$ represents the semilattice before that the program execution flow enters function $\langle A := B \,\theta\, C \rangle$,  and $z'$ the semilattice of  the program execution flow after executing  $\langle A := B \,\theta\, C \rangle$.  Since $\langle A := B \,\theta\, C \rangle$ is an assignment statement, so no matter what the variable $A$ changes, we always know all other variables will not be affected because the only variable affected is $A$. Hence we can obtain $z'(X) = z(X)$ for all $X \in V - \{A\}$. However, we also can determine the value of $A$ if $z(B) = b$ and $z(C) = c$ for some $b$ and $c$ in R, in which case $z'(A) = b\,\theta\,c$.

- $\langle A := r \rangle(z)=z'$ where $z'(X) = z(X)$ for all $X \in V - \{A\}$ and $z'(A) = r$.

2. $i \in F$, where $i(z) = z$ for all $z\in L$.
3. if $f, g \in F$ then $f \circ g \in F$.

**Lemma 1**. Let $L$ be a semilattice and $f_1, f_2, ..., f_n$ be functions on $L$. If it is true that $(\forall x,  y \in L) (\forall 1 \leq i \leq n)\; [f_i(x \wedge y) \leq f_i(x) \wedge f_i(y)]$, then $f_1 \circ f_2 \circ ... \circ f_n (x \wedge y) \leq f_1 \circ f_2 \circ ... \circ f_n (x) \wedge f_1 \circ f_2 \circ ... \circ f_n(y)$.

$proof$. $f_n(x \wedge y) \leq f_n(x) \wedge f_n(y)$ (by assumption). Suppose $f_1 \circ f_2 \circ ... \circ f_n (x \wedge y) \leq f_1 \circ f_2 \circ ... \circ f_n (x) \wedge f_1 \circ f_2 \circ ... \circ f_n(y)$, then $f_{i-1}(f_i\circ...\circ f_n(x \wedge y)) \leq f_{i-1}(f_i\circ...\circ f_n(x)) \wedge f_{i-1}(f_i\circ...\circ f_n(y))$ (by Observation 1). $f_{i-1}(f_i\circ...\circ f_n(x)) \wedge f_{i-1}(f_i\circ...\circ f_n(y)) \leq f_{i-1}  \circ ... \circ f_n (x) \wedge f_{i-1} \circ ... \circ f_n(y)$ (by assumption). So by simple backward induction on $i$, the lemma follows.

**Theorem 1**. $CONST = (L, \wedge, F)$ is a monotone data flow analysis framework. Furthermore there exists $z, z' \in L$ and $f \in F$ such that $f(z \wedge z') \leq f(z) \wedge f(z')$ .

$proof$. The fact that $L$ is a bounded semilattice with a $\bot$ element is obvious. Furthermore, for any element $z \in L, z = f_1 \circ f_2 \circ ... \circ f_n(\bot)$ for some integer $n$, where $f_i$ is of the form $\langle A_i = r \rangle$. So to show that $F$ is a monotone function space associated with $L$, it suffices by Lemma 1, to show that for all $z, z' \in L$ and all functions in $F$ of the form $\langle A := B \;\theta \;C \rangle$ or $\langle A = r \rangle$,
$$
\langle A := B \,\theta\, C \rangle(z \wedge z') \leq \langle A := B \,\theta\, C \rangle(z) \wedge \langle A := B \,\theta\, C \rangle(z')
$$
and
$$
\langle A := r \rangle(z \wedge z' ) \leq \langle A := r \rangle(z) \wedge \langle A := r \rangle(z').
$$
Observe that since $\wedge$ is intersection on $L$, the $\leq$ relation is set inclusion.

1. Suppose we are given $z, z' \in L$ and $\langle A := B \; \theta \; C \rangle \in F$.

Let $y = \langle A := B \; \theta \; C \rangle(z \wedge z')$. Then for all $X \in V - \{ A \}$, if $(X, r) \in y$ then $(X, r) \in z$ and $(X, r) \in z'$. Hence $(X, r) \in \langle A := B \; \theta \; C \rangle(z)$ and $(X, r) \in \langle A := B \; \theta \; C \rangle(z')$.

If $A$ is undefined in $y$, then we are done. Suppose however, that $(A, r) \in y$. Then $\{ (B, r_1), (C, r_2)\}$ is a subset of $z$ and is also a subset of $z'$, for some $r_1$ and $r_2$ such that $r = r_1\;\theta\;r_2$. This implies that $(A, r) \in \langle A := B\;\theta\;C\rangle(z)$ and $(A, r) \in \langle A := B\;\theta\;C\rangle(z')$

2. Suppose we are given $z, z' \in L$ and $\langle A := r\rangle \in F$. It is straightforward to show that $\langle A := r \rangle (z \wedge z') = \langle A := r \rangle (z) \wedge \langle A := r \rangle (z')$. Hence the first part of the lemma follows.

We shall also mention that Theorem 1 can be generalized to any framework whose lattice elements associate "values" with variables, whose meet operation is intersection, and whose functions reflect the application of "operation" on those values and assignment of values to variable. The framework will be monotone in all cases, but will be distributive only if the interpretation of the operator is "free", that is, the effect of applying $k\text{-}ary$ operator $\theta$ to two different $k\text{-}tuples$ of values is never that same.

## Approaches to Solving Monotone Data Flow Analysis Problems

It appears generally true that what one searches for in a data flow problem is what we shall call the $meet\;over\;all\;paths (MOP)$ solution. That is, let $PATH(n)$ denote the set of paths from the initial node to node $n$ in some flow graph. The we really want $\bigwedge\limits_{p \in PATH(n)}f_p(\bot)$ for each $n$. It is this function, the $MOP$ solution that, in any practical data flow problem we can think of, expression the desired information.

**Algorithm 1** (Essentially Kildall's Algorithm applied to a monotone framework)

&emsp; $Input$. A particular instance $I = (G, M)$ of $D = (L, \wedge, F)$, where $G = (N,E, n_0)$ is a flow graph.

&emsp; $Initialization$.
$$
(\forall n \in N) \qquad \qquad 
A[n] \begin{cases}
		0 \qquad \text{if}\; n = n_0 \\
		1 \qquad \text{otherwise}
	\end{cases}
$$
&emsp; $Iteration \; Step$. Visit nodes other that $n_0$ in order $n_1, n_2, ... $ (with repetitions, and not fixed in advance). We $visit$ node n by setting
$$
A[n] = \bigwedge\limits_{p \in PRED(n)} f_p(A[p])
$$
where $PRED(n) = {p\,|\,(p, n) \in E}$. The sequence $n_1, n_2, ...$ has to satisfy the following condition:

&emsp; If there exists a node $n \in N - {n_0}$ such that $A[n] \neq \bigwedge\limits_{p \in PRED(n)} f_p(A[p])$ after we have visited node $n_s$ in the sequence, then there exists integer $t > s$ such that $n_t = n$. Also, if after visiting node $n_s$, $A[n] = \bigwedge\limits_{p \in PRED(n)} f_p(A[p])$ for all $n \neq n_0$, then the sequence will eventually end.

## A Variant of Kildall's Algorithm



