# QBE

## 基础数据结构

```c
/*
    这个结构体定义了目标机器（如 x86_64 或 ARM64）的硬件特性。它是 QBE 跨平台的抽象层。
*/
struct Target {
    char name[16];
    char apple;
    char windows;
    int gpr0;   /* first general purpose reg */
    int ngpr;   /* 通用寄存器数量 */
    int fpr0;   /* first floating point reg */
    int nfpr;   /* 浮点寄存器数量 */
    bits rglob; /* globally live regs (e.g., sp, fp) */
    int nrglob;
    int *rsave; /* caller-save */
    int nrsave[2];
    bits (*retregs)(Ref, int[2]);
    bits (*argregs)(Ref, int[2]);
    int (*memargs)(int);
    void (*abi0)(Fn *);
    void (*abi1)(Fn *);
    void (*isel)(Fn *);
    void (*emitfn)(Fn *, FILE *);
    void (*emitfin)(FILE *);
    char asloc[4];
    char assym[4];
    uint cansel:1;
};

/*
    代表了一个完整的 C 函数。它持有了进行代码转换所需的所有符号表和元数据。
*/
struct Fn {
    /* 控制流图入口 */
    Blk *start;
    /* 虚拟寄存器数组及其数量（QBE 的所有临时变量都在这里）*/
    Tmp *tmp;
    /* 常量池 */
    Con *con;
    /* 内存引用 */
    Mem *mem;
    int ntmp;
    int ncon;
    int nmem;
    uint nblk;
    int retty; /* index in typ[], -1 if no aggregate return */
    Ref retr;
    /* Reverse Postorder。这是一个经过拓扑排序的基本块数组。做数据流分析时，按 RPO 顺序遍历能最快达到收敛。 */
    Blk **rpo;
    bits reg;
    int slot;
    int salign;
    /* 是否变参 */
    char vararg;
    char dynalloc;
    /* 是否为叶子函数 */
    char leaf;
    char name[NString];
    Lnk lnk;
};



struct Ins {
    /* 操作码 */
    uint op:30;
    /* 返回值的类型类别（Word, Long, Single, Double） */
    uint cls:2;
    /* 目标寄存器 */
    Ref to;
    /* 源操作数 */
    Ref arg[2];
};

struct Blk {
    /* 指向该块起始处的 Phi 函数链表 */
    Phi *phi;
    /* 指向该块内普通指令数组的指针 */
    Ins *ins;
    uint nins;

    /* 块末尾的终结符（Jump, Ret, Jnz */
    struct {
        short type;
        Ref arg;
    } jmp;

    /* s1, s2: 后继节点（Successors） */
    Blk *s1;
    Blk *s2;
    Blk *link;

    uint id;
    uint visit;

    Blk *idom;
    Blk *dom, *dlink;
    Blk **fron;
    uint nfron;
    int depth;

    /* pred, npred: 前驱节点（Predecessors）。 */
    Blk **pred;
    uint npred;
    /* in, out, gen 集合用于存储活跃变量分析等 DFA 的结果 */
    BSet in[1], out[1], gen[1];
    int nlive[2];
    int loop;
    char name[NString];
};
```

## 相关阅读

- [Let's get hands-on with QBE](https://briancallahan.net/blog/20210829.html)

- [I wrote a 231-byte Brainfuck compiler by abusing everything](https://briancallahan.net/blog/20210710.html)

- [QBE - Backend Compiler](http://c9x.me/compile/)