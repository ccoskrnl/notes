# Cache


**von Neumann bottleneck**
Von Neumann architecture is a foundational computer design processed in 1945, featuring a CPU(with an ALU and control unit), a single memory unit for storing both data and instructions, input/output mechanisms, and linear, sequential instruction execution. It uses shared buses for communication, leading to the "Von Neumann bottleneck", where CPU speed is limited by memory access times.

![Von Neumann Architecture](./assets/Von_Neumann_Architecture.svg.png)

The core problem is the huge gap of the access speed between CPU executing and memory accessing. In traditional Von Neumann architecture, as we have seen that CPU is sequential executing and data and instructions are stored in memory. No matter how fast CPU' speed is, each time it needs to access memory to fetch the next instruction in memory for sequentially executing.

Cache is essentially a high-speed, small capacity storage level between Register Layer and Main Memory Layer.

![The Memory Hierarchy](./assets/MemoryHierarchy.png)

**CPU Cache**


## Futher Reading

[Cache Architecture and Design] - https://www.cs.swarthmore.edu/~kwebb/cs31/f18/memhierarchy/caching.html
