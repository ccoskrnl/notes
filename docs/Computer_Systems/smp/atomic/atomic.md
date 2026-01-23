# Cache

Look for a copy of the desired word $w$ in the cache. If there is a miss, fetch the block that contains $w$ from next lower level of the memory hierarchy, store the block in some cache line(possibly evicting a valid line), and then return $w$.

Cache writes is a little more complicated.

## Locked atomic operations

Atomic operations are the fundamental building blocks for reliable concurrency in modern computing. They allow multiple threads or processors to safely manipulate shared data without corruption, forming the bedrock of everything from operating system kernels to high-performance databases.

Bus locking and/or cache coherency manangement for performing atomic operations on system memory. The IA-32 processors support locked atomic operations on locations in system memory. These operations are typically used to manage shared data structures (such as semaphores, segment descriptors, system segments or page tables) in which two or more processors may try simultaneously to modify the same field or flag.
