import type { LessonPayload } from '../types/presentation';

/**
 * High-fidelity OS Lesson: Process Management (15 slides).
 * Expert-level narration with Reveal.js fragment coordination,
 * HTML tables, code blocks, and color-synced highlights.
 */
export const mockOsLessonPayload: LessonPayload = {
  lessonId: 'os-core-001',
  topicTitle: 'Operating Systems: Process Management',
  status: 'ready',
  slides: [
    // ── Slide 0: Title ──────────────────────────────────────────────
    {
      id: 'os-slide-0',
      slideIndex: 0,
      audioUrl: '/audio/os-slide-0.mp3',
      audioDuration: 4.3,
      timepoints: [],
      transcript:
        "Welcome back. Today we are diving deep into one of the most fundamental pillars of modern operating systems: Process Management. By the end of this lesson, you will understand exactly how your OS juggles dozens, even thousands, of programs simultaneously. Let's begin.",
      rawMarkdown: `# Process Management

An in-depth look at process architecture, states, scheduling, and inter-process communication.`,
    },

    // ── Slide 1: What is a Process? ─────────────────────────────────
    {
      id: 'os-slide-1',
      slideIndex: 1,
      audioUrl: '/audio/os-slide-1.mp3',
      audioDuration: 9.9,
      timepoints: [
        { markName: 'frag-0', timeSeconds: 2.61, fragmentIndex: 0 },
        { markName: 'frag-1', timeSeconds: 9.67, fragmentIndex: 1 },
        { markName: 'frag-2', timeSeconds: 17.76, fragmentIndex: 2 },
        { markName: 'frag-3', timeSeconds: 30.44, fragmentIndex: 3 },
      ],
      transcript:
        "Let's start with the most important distinction. A program is just a passive file sitting on your disk — it is simply compiled code stored in an executable file. A process, on the other hand, is that program brought to life — it is an active entity loaded into memory with its own resources. Think of it like a recipe versus actually cooking. The recipe is the program. The act of cooking, with all the ingredients on the counter, the timer running, and the chef making decisions, that is the process. One program can spawn multiple processes. For example, opening two Chrome tabs creates two separate processes from the same program.",
      rawMarkdown: `## What is a Process?

**Program = passive entity (executable file on disk)** <!-- .element: class="fragment" data-fragment-index="0" -->

**Process = active entity (program loaded into memory + resources)** <!-- .element: class="fragment" data-fragment-index="1" -->

> ***Analogy:** A recipe is a *program*. Actually cooking — with ingredients, timer, decisions — is a process*. <!-- .element: class="fragment" data-fragment-index="2" -->

**One program → multiple processes (e.g. two Chrome tabs = two processes)** <!-- .element: class="fragment" data-fragment-index="3" -->`,
    },

    // ── Slide 2: Process Memory Layout ──────────────────────────────
    {
      id: 'os-slide-2',
      slideIndex: 2,
      audioUrl: '/audio/os-slide-2.mp3',
      audioDuration: 13.8,
      timepoints: [
        { markName: 'frag-0', timeSeconds: 8.86, fragmentIndex: 0 },
        { markName: 'frag-1', timeSeconds: 22.59, fragmentIndex: 1 },
        { markName: 'frag-2', timeSeconds: 30.0, fragmentIndex: 2 },
        { markName: 'frag-3', timeSeconds: 40.16, fragmentIndex: 3 },
      ],
      transcript:
        "When a process is created, the OS carves out a structured region of memory for it. This memory is divided into four distinct sections. First, the Text Section at the bottom — this holds your compiled machine code, the actual executable instructions. It is read-only, so that a bug in your program cannot accidentally overwrite its own instructions. Next, the Data Section, which stores all global and static variables — things initialized before main runs. Above that is the Heap — this is where dynamic memory allocation happens at runtime, like when you call malloc in C or new in Java. The heap grows upward. And finally, at the very top, the Stack — it grows downward and holds temporary data like function parameters, return addresses, and local variables. Every time you call a function, a new stack frame is pushed on top.",
      rawMarkdown: `## Process Memory Layout

A process is divided into **four** sections in memory:

| Section | Contents | Direction |
|---------|----------|-----------|
| **Text** | Compiled machine code (read-only) | — | <!-- .element: class="fragment highlight-red" data-fragment-index="0" -->
| **Data** | Global & static variables | — | <!-- .element: class="fragment highlight-red" data-fragment-index="1" -->
| **Heap** | Dynamic allocation (\`malloc\`, \`new\`) | ↑ Grows up | <!-- .element: class="fragment highlight-blue" data-fragment-index="2" -->
| **Stack** | Local vars, return addresses, params | ↓ Grows down | <!-- .element: class="fragment highlight-blue" data-fragment-index="3" -->`,
    },

    // ── Slide 3: PCB ────────────────────────────────────────────────
    {
      id: 'os-slide-3',
      slideIndex: 3,
      audioUrl: '/audio/os-slide-3.mp3',
      audioDuration: 12.6,
      timepoints: [
        { markName: 'frag-0', timeSeconds: 12.45, fragmentIndex: 0 },
        { markName: 'frag-1', timeSeconds: 17.48, fragmentIndex: 1 },
        { markName: 'frag-2', timeSeconds: 24.24, fragmentIndex: 2 },
        { markName: 'frag-3', timeSeconds: 36.33, fragmentIndex: 3 },
        { markName: 'frag-4', timeSeconds: 45.52, fragmentIndex: 4 },
      ],
      transcript:
        "To manage thousands of processes, the OS needs a data structure that stores everything about each one. This is the Process Control Block, or PCB. Think of it as the process's identity card. It contains the Process ID, a unique integer identifying the process. It stores the Process State — whether the process is new, ready, running, waiting, or terminated. Critically, it holds the Program Counter — this is the memory address of the very next instruction to execute. If the CPU gets interrupted, this is how the OS knows exactly where to resume. It also saves all CPU Registers — accumulators, stack pointers, index registers — the entire computational context. And finally, it records memory management info and scheduling priority.",
      rawMarkdown: `## Process Control Block (PCB)

The OS **identity card** for every process:

| PCB Field | Purpose |
|-----------|---------|
| Process ID (PID) | Unique integer identifier | <!-- .element: class="fragment" data-fragment-index="0" -->
| Process State | New, Ready, Running, Waiting, Terminated | <!-- .element: class="fragment" data-fragment-index="1" -->
| **Program Counter** | Address of **next instruction** to execute | <!-- .element: class="fragment highlight-red" data-fragment-index="2" -->
| **CPU Registers** | Accumulators, stack pointers, index registers | <!-- .element: class="fragment highlight-red" data-fragment-index="3" -->
| Memory & Scheduling Info | Page tables, priority, CPU burst times | <!-- .element: class="fragment" data-fragment-index="4" -->`,
    },

    // ── Slide 4: Process States ─────────────────────────────────────
    {
      id: 'os-slide-4',
      slideIndex: 4,
      audioUrl: '/audio/os-slide-4.mp3',
      audioDuration: 12.3,
      timepoints: [
        { markName: 'frag-0', timeSeconds: 3.49, fragmentIndex: 0 },
        { markName: 'frag-1', timeSeconds: 11.21, fragmentIndex: 1 },
        { markName: 'frag-2', timeSeconds: 20.73, fragmentIndex: 2 },
        { markName: 'frag-3', timeSeconds: 29.56, fragmentIndex: 3 },
        { markName: 'frag-4', timeSeconds: 40.38, fragmentIndex: 4 },
      ],
      transcript:
        "Every process cycles through five fundamental states. First, New — the process is being created, its PCB is allocated but it is not yet competing for CPU time. Second, Ready — the process is loaded in memory, all resources are available, and it is simply waiting in a queue for the CPU scheduler to pick it. Third, Running — the process is actively executing instructions on the CPU. Only one process per core can be in this state. Fourth, Waiting, also called Blocked — the process has requested something slow, like disk I/O or a network packet, and cannot continue until that operation completes. Finally, Terminated — the process has finished execution, and the OS is deallocating its resources and cleaning up its PCB.",
      rawMarkdown: `## The Five Process States

- **New — Process is being created** <!-- .element: class="fragment" data-fragment-index="0" -->
- **Ready — In memory, waiting for CPU** <!-- .element: class="fragment" data-fragment-index="1" -->
- **Running — Actively executing on CPU** <!-- .element: class="fragment" data-fragment-index="2" -->
- **Waiting — Blocked on I/O or event** <!-- .element: class="fragment" data-fragment-index="3" -->
- **Terminated — Finished, being cleaned up** <!-- .element: class="fragment" data-fragment-index="4" -->`,
    },

    // ── Slide 5: State Transitions ──────────────────────────────────
    {
      id: 'os-slide-5',
      slideIndex: 5,
      audioUrl: '/audio/os-slide-5.mp3',
      audioDuration: 10.3,
      timepoints: [
        { markName: 'frag-0', timeSeconds: 3.22, fragmentIndex: 0 },
        { markName: 'frag-1', timeSeconds: 8.17, fragmentIndex: 1 },
        { markName: 'frag-2', timeSeconds: 14.71, fragmentIndex: 2 },
        { markName: 'frag-3', timeSeconds: 25.64, fragmentIndex: 3 },
      ],
      transcript:
        "Now let us trace the transitions between these states. When a process is first admitted by the OS, it transitions from New to Ready. The CPU scheduler then picks it, transitioning it from Ready to Running — this is called dispatching. While running, if the process needs I/O, it moves from Running to Waiting. Once the I/O completes, a hardware interrupt fires and the process goes from Waiting back to Ready. But here is the crucial one: if a timer interrupt fires while a process is running, the OS preempts it, forcefully moving it from Running back to Ready. This is how the OS ensures fairness — no single process can hog the CPU forever.",
      rawMarkdown: `

<div style="display: flex; justify-content: center; margin: 20px 0;">
<svg viewBox="0 0 740 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-height: 360px; font-family: sans-serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
    </marker>
    <style>
      .state { fill: #a5c2e5; stroke: currentColor; stroke-width: 2px; }
      .text-state { font-size: 18px; fill: #000; text-anchor: middle; dominant-baseline: middle; font-weight: bold; }
      .edge { fill: none; stroke: currentColor; stroke-width: 2px; marker-end: url(#arrow); }
      .edge-label { font-size: 13px; fill: currentColor; text-anchor: middle; }
    </style>
  </defs>

  <g>
    <ellipse cx="120" cy="80" rx="60" ry="32" class="state" />
    <text x="120" y="82" class="text-state">new</text>
  </g>
  <g>
    <ellipse cx="280" cy="180" rx="65" ry="35" class="state" />
    <text x="280" y="182" class="text-state">ready</text>
  </g>
  <g>
    <ellipse cx="520" cy="180" rx="65" ry="35" class="state" />
    <text x="520" y="182" class="text-state">running</text>
  </g>
  <g>
    <ellipse cx="660" cy="80" rx="60" ry="32" class="state" />
    <text x="660" y="82" class="text-state">terminated</text>
  </g>
  <g>
    <ellipse cx="400" cy="310" rx="65" ry="35" class="state" />
    <text x="400" y="312" class="text-state">waiting</text>
  </g>

  <g class="fragment" data-fragment-index="0">
    <path d="M 166 100 Q 200 125 232 156" class="edge" />
    <text x="215" y="115" class="edge-label">admitted</text>
  </g>

  <g class="fragment" data-fragment-index="1">
    <path d="M 340 195 Q 400 220 460 195" class="edge" />
    <text x="400" y="225" class="edge-label">Scheduler Dispatch</text>
  </g>

  <g class="fragment" data-fragment-index="3">
    <path d="M 460 160 Q 400 135 340 160" class="edge" />
    <text x="400" y="135" class="edge-label">Interrupt</text>
  </g>

  <g class="fragment" data-fragment-index="2">
    <path d="M 495 210 Q 480 255 445 285" class="edge" />
    <text x="530" y="255" class="edge-label">I/O or event wait</text>
  </g>

  <g class="fragment" data-fragment-index="2">
    <path d="M 360 285 Q 320 250 300 212" class="edge" />
    <text x="250" y="255" class="edge-label">I/O or event completion</text>
  </g>

  <g>
    <path d="M 565 155 Q 595 130 620 105" class="edge" />
    <text x="575" y="120" class="edge-label">Exit</text>
  </g>
</svg>
</div>

| Transition | Trigger |
|-----------|---------|
| **New → Ready** | Admitted by OS | <!-- .element: class="fragment highlight-blue" data-fragment-index="0" -->
| **Ready → Running** | CPU scheduler dispatches | <!-- .element: class="fragment highlight-green" data-fragment-index="1" -->
| **Running → Waiting** | I/O request or event wait | <!-- .element: class="fragment highlight-red" data-fragment-index="2" -->
| **Running → Ready** | ⏱️ Timer interrupt (preemption!) | <!-- .element: class="fragment highlight-red" data-fragment-index="3" -->`,
    },

    // ── Slide 6: Context Switch ─────────────────────────────────────
    {
      id: 'os-slide-6',
      slideIndex: 6,
      audioUrl: '/audio/os-slide-6.mp3',
      audioDuration: 12.3,
      timepoints: [
        { markName: 'frag-0', timeSeconds: 2.87, fragmentIndex: 0 },
        { markName: 'frag-1', timeSeconds: 7.45, fragmentIndex: 1 },
        { markName: 'frag-2', timeSeconds: 11.19, fragmentIndex: 2 },
        { markName: 'frag-3', timeSeconds: 21.65, fragmentIndex: 3 },
        { markName: 'frag-4', timeSeconds: 28.92, fragmentIndex: 4 },
        { markName: 'frag-5', timeSeconds: 33.94, fragmentIndex: 5 },
      ],
      transcript:
        "Let us trace a context switch step by step. Step one: Process P zero is executing on the CPU. Step two: An interrupt or system call fires. Step three: The OS kernel immediately saves P zero's entire state — program counter, registers, everything — into PCB zero. Step four: The scheduler selects process P one and reloads its previously saved state from PCB one. Step five: P one resumes executing exactly where it left off. And here is the critical insight — during this entire save and restore operation, the CPU does absolutely zero useful user work. Context switch time is pure overhead. The system is essentially frozen from the user's perspective.",
      rawMarkdown: `## Anatomy of a Context Switch

1. **Process P₀** is executing <!-- .element: class="fragment" data-fragment-index="0" -->
2. **Interrupt** or system call occurs <!-- .element: class="fragment highlight-red" data-fragment-index="1" -->
3. OS **saves state** → PCB₀ <!-- .element: class="fragment highlight-blue" data-fragment-index="2" -->
4. OS **reloads state** ← PCB₁ <!-- .element: class="fragment highlight-blue" data-fragment-index="3" -->
5. **Process P₁** resumes execution <!-- .element: class="fragment highlight-green" data-fragment-index="4" -->

> ⚠️ Context switch = **pure overhead** — no useful work! <!-- .element: class="fragment highlight-red" data-fragment-index="5" -->`,
    },

    // ── Slide 7: Context Switch Cost ────────────────────────────────
    {
      id: 'os-slide-7',
      slideIndex: 7,
      audioUrl: '/audio/os-slide-7.mp3',
      audioDuration: 11.8,
      timepoints: [
        { markName: 'frag-0', timeSeconds: 2.61, fragmentIndex: 0 },
        { markName: 'frag-1', timeSeconds: 17.56, fragmentIndex: 1 },
        { markName: 'frag-2', timeSeconds: 28.69, fragmentIndex: 2 },
        { markName: 'frag-3', timeSeconds: 41.2, fragmentIndex: 3 },
      ],
      transcript:
        "So how expensive is a context switch? On modern hardware, a single switch takes roughly one to ten microseconds. That sounds fast, but consider this — if your OS is switching thousands of times per second, those microseconds add up. What makes it expensive? First, saving and restoring all CPU registers. Second, flushing the Translation Lookaside Buffer, or TLB, which kills memory access performance. Third, the CPU cache goes cold — data from the old process is useless for the new one. And finally, pipeline stalls — the CPU's instruction pipeline must be drained and refilled. This is why operating system designers obsess over minimizing unnecessary context switches.",
      rawMarkdown: `## Context Switch: The Hidden Cost

**Typical time:** ~1 – 10 μs per switch <!-- .element: class="fragment" data-fragment-index="0" -->

What makes it expensive:

- Saving/restoring **all CPU registers** <!-- .element: class="fragment highlight-red" data-fragment-index="1" -->
- **TLB flush** — kills memory performance <!-- .element: class="fragment highlight-red" data-fragment-index="1" -->
- **Cache goes cold** — old data is useless <!-- .element: class="fragment highlight-red" data-fragment-index="2" -->
- **Pipeline stalls** — instructions drained & refilled <!-- .element: class="fragment highlight-red" data-fragment-index="2" -->

> 💡 OS designers obsess over minimizing unnecessary switches! <!-- .element: class="fragment" data-fragment-index="3" -->`,
    },

    // ── Slide 8: fork() ─────────────────────────────────────────────
    {
      id: 'os-slide-8',
      slideIndex: 8,
      audioUrl: '/audio/os-slide-8.mp3',
      audioDuration: 13.7,
      timepoints: [
        { markName: 'frag-0', timeSeconds: 6.93, fragmentIndex: 0 },
        { markName: 'frag-1', timeSeconds: 22.34, fragmentIndex: 1 },
        { markName: 'frag-2', timeSeconds: 37.46, fragmentIndex: 2 },
        { markName: 'frag-3', timeSeconds: 44.24, fragmentIndex: 3 },
      ],
      transcript:
        "How does the OS actually create a new process? In Unix and Linux, the answer is the fork system call. When a process calls fork, the OS creates an almost exact duplicate of the calling process. The entire address space is copied — text, data, heap, and stack. But here is the clever part: fork returns twice. In the parent process, fork returns the child's PID, a positive number. In the newly created child process, fork returns zero. This is how each process knows whether it is the parent or the child, and can branch accordingly. The child gets a brand-new PID but inherits the parent's open files, environment variables, and more. Modern systems use copy-on-write optimization — the memory is not actually duplicated until one of the processes modifies it, saving enormous amounts of memory.",
      rawMarkdown: `## Process Creation: \`fork()\`

\`\`\`c
pid_t pid = fork();

if (pid < 0) {
    // Error: fork failed
} else if (pid == 0) {
    // Child process (fork returns 0)
    printf("I am the child! PID: %d\\n", getpid());
} else {
    // Parent process (fork returns child's PID)
    printf("I am the parent! Child PID: %d\\n", pid);
}
\`\`\`
<!-- .element: class="fragment" data-fragment-index="0" -->

**Returns:** \`0\` to child, **child PID** to parent <!-- .element: class="fragment highlight-green" data-fragment-index="1" -->

Child inherits: open files, env vars, address space <!-- .element: class="fragment" data-fragment-index="2" -->

> 🚀 **Copy-on-Write**: memory only duplicated on modification <!-- .element: class="fragment highlight-blue" data-fragment-index="3" -->`,
    },

    // ── Slide 9: exec() ─────────────────────────────────────────────
    {
      id: 'os-slide-9',
      slideIndex: 9,
      audioUrl: '/audio/os-slide-9.mp3',
      audioDuration: 10.4,
      timepoints: [
        { markName: 'frag-0', timeSeconds: 4.5, fragmentIndex: 0 },
        { markName: 'frag-1', timeSeconds: 8.94, fragmentIndex: 1 },
        { markName: 'frag-2', timeSeconds: 19.92, fragmentIndex: 2 },
        { markName: 'frag-3', timeSeconds: 26.91, fragmentIndex: 3 },
      ],
      transcript:
        "After forking, the child process is still an exact copy of the parent. To run a different program, we use the exec family of system calls. Exec completely replaces the current process's address space with a new program loaded from disk. The text, data, heap, and stack are all wiped and reloaded. Crucially, the PID does not change — it is still the same process, just running entirely different code. This fork-then-exec pattern is the standard Unix way of launching new programs. When you type a command in your terminal, the shell calls fork to create a child, then the child calls exec to replace itself with the program you requested.",
      rawMarkdown: `## Process Creation: \`exec()\`

After \`fork()\`, the child calls \`exec()\` to run a **different program**: <!-- .element: class="fragment" data-fragment-index="0" -->

\`\`\`c
// In child process after fork()
execlp("/bin/ls", "ls", "-la", NULL);
// If exec succeeds, this line NEVER runs
printf("This won't print!\\n");
\`\`\`
<!-- .element: class="fragment" data-fragment-index="1" -->

**Key facts:**
- Replaces **entire** address space (text, data, heap, stack) <!-- .element: class="fragment highlight-red" data-fragment-index="2" -->
- PID **stays the same** — same process, new code <!-- .element: class="fragment highlight-green" data-fragment-index="3" -->`,
    },

    // ── Slide 10: Process Termination ────────────────────────────────
    {
      id: 'os-slide-10',
      slideIndex: 10,
      audioUrl: '/audio/os-slide-10.mp3',
      audioDuration: 11.2,
      timepoints: [
        { markName: 'frag-0', timeSeconds: 0.01, fragmentIndex: 0 },
        { markName: 'frag-1', timeSeconds: 5.05, fragmentIndex: 1 },
        { markName: 'frag-2', timeSeconds: 11.6, fragmentIndex: 2 },
        { markName: 'frag-3', timeSeconds: 27.49, fragmentIndex: 3 },
      ],
      transcript:
        "A process terminates when it calls the exit system call or when it returns from main. The parent process can call wait to collect the child's exit status. But what happens when things go wrong? A Zombie Process occurs when a child terminates but its parent has not yet called wait. The child's PCB lingers in the process table — it is dead but not cleaned up. It consumes a PID and a slot in the table, which is a resource leak. An Orphan Process is the opposite — the parent terminates before the child. In this case, the init process, PID one, automatically adopts the orphan and eventually calls wait to clean it up. Understanding these edge cases is essential for writing robust systems software.",
      rawMarkdown: `## Process Termination

**Normal exit:** \`exit()\` or \`return\` from \`main()\` <!-- .element: class="fragment" data-fragment-index="0" -->

**Parent collects status:** \`wait(&status)\` <!-- .element: class="fragment" data-fragment-index="1" -->

| Edge Case | Description |
|-----------|-------------|
| 🧟 **Zombie** | Child exited, parent hasn't called \`wait()\` — PCB lingers! | <!-- .element: class="fragment highlight-red" data-fragment-index="2" -->
| 👻 **Orphan** | Parent exited first — \`init\` (PID 1) adopts the child | <!-- .element: class="fragment highlight-blue" data-fragment-index="3" -->`,
    },

    // ── Slide 11: IPC Overview ──────────────────────────────────────
    {
      id: 'os-slide-11',
      slideIndex: 11,
      audioUrl: '/audio/os-slide-11.mp3',
      audioDuration: 11.2,
      timepoints: [
        { markName: 'frag-0', timeSeconds: 8.82, fragmentIndex: 0 },
        { markName: 'frag-1', timeSeconds: 20.86, fragmentIndex: 1 },
        { markName: 'frag-2', timeSeconds: 34.57, fragmentIndex: 2 },
        { markName: 'frag-3', timeSeconds: 38.29, fragmentIndex: 3 },
      ],
      transcript:
        "Processes often need to talk to each other. This is called Inter-Process Communication, or IPC. There are two fundamental models. Shared Memory is faster because processes directly read and write a common region of memory — no kernel involvement after setup. But it requires careful synchronization to avoid data races. Message Passing is cleaner — processes send and receive explicit messages through the kernel. It is easier to program correctly, but slower because every message requires a system call, crossing the user-kernel boundary. In practice, high-performance systems prefer shared memory, while distributed systems and microservices favor message passing because it works across network boundaries.",
      rawMarkdown: `## Inter-Process Communication (IPC)

Processes need to **exchange data** — two fundamental models:

| Feature | Shared Memory | Message Passing |
|---------|--------------|-----------------|
| **Speed** | ⚡ Fast (no kernel after setup) | 🐢 Slower (system calls) | <!-- .element: class="fragment" data-fragment-index="0" -->
| **Sync** | ⚠️ Manual (mutexes/semaphores) | ✅ Built-in | <!-- .element: class="fragment" data-fragment-index="1" -->
| **Complexity** | Harder to program | Easier to reason about | <!-- .element: class="fragment" data-fragment-index="2" -->
| **Use case** | High-perf, same machine | Distributed / microservices | <!-- .element: class="fragment" data-fragment-index="3" -->`,
    },

    // ── Slide 12: Pipes ─────────────────────────────────────────────
    {
      id: 'os-slide-12',
      slideIndex: 12,
      audioUrl: '/audio/os-slide-12.mp3',
      audioDuration: 12.6,
      timepoints: [
        { markName: 'frag-0', timeSeconds: 8.61, fragmentIndex: 0 },
        { markName: 'frag-1', timeSeconds: 24.58, fragmentIndex: 1 },
        { markName: 'frag-2', timeSeconds: 37.6, fragmentIndex: 2 },
        { markName: 'frag-3', timeSeconds: 41.32, fragmentIndex: 3 },
      ],
      transcript:
        "The simplest IPC mechanism is the pipe. A pipe creates a unidirectional communication channel between a parent and child process. The pipe system call creates two file descriptors — fd zero for reading and fd one for writing. After forking, the parent closes its read end and writes data into the pipe. The child closes its write end and reads data from the pipe. This is exactly what happens when you use the pipe operator in your terminal — for example, ls pipe grep txt. The ls process writes its output into the pipe and the grep process reads from it. Named pipes, or FIFOs, extend this concept to allow communication between unrelated processes by giving the pipe a name in the file system.",
      rawMarkdown: `## IPC: Pipes

\`\`\`c
int fd[2];
pipe(fd);          // fd[0] = read, fd[1] = write

if (fork() == 0) {
    // Child: reads from pipe
    close(fd[1]);  // close write end
    read(fd[0], buffer, sizeof(buffer));
} else {
    // Parent: writes to pipe
    close(fd[0]);  // close read end
    write(fd[1], "Hello!", 6);
}
\`\`\`
<!-- .element: class="fragment" data-fragment-index="0" -->

**Unidirectional:** data flows one way only <!-- .element: class="fragment highlight-red" data-fragment-index="1" -->

🔧 Shell example: \`ls | grep .txt\` <!-- .element: class="fragment" data-fragment-index="2" -->

> **Named Pipes (FIFOs)** allow unrelated processes to communicate <!-- .element: class="fragment highlight-blue" data-fragment-index="3" -->`,
    },

    // ── Slide 13: Scheduling Overview ───────────────────────────────
    {
      id: 'os-slide-13',
      slideIndex: 13,
      audioUrl: '/audio/os-slide-13.mp3',
      audioDuration: 11.8,
      timepoints: [
        { markName: 'frag-0', timeSeconds: 10.24, fragmentIndex: 0 },
        { markName: 'frag-1', timeSeconds: 17.12, fragmentIndex: 1 },
        { markName: 'frag-2', timeSeconds: 21.93, fragmentIndex: 2 },
        { markName: 'frag-3', timeSeconds: 27.13, fragmentIndex: 3 },
        { markName: 'frag-4', timeSeconds: 38.46, fragmentIndex: 4 },
      ],
      transcript:
        "With many processes competing for the CPU, the OS needs a scheduler to decide who runs next. The scheduler optimizes for several competing criteria. CPU Utilization — keep the CPU as busy as possible, ideally above ninety percent. Throughput — maximize the number of processes completed per unit time. Turnaround Time — minimize the total time from process submission to completion. Waiting Time — minimize how long a process sits idle in the ready queue. And Response Time — in interactive systems, minimize the time from a request to the first response. No single algorithm perfectly optimizes all five simultaneously, which is what makes scheduling one of the hardest problems in OS design.",
      rawMarkdown: `## CPU Scheduling: Why It Matters

The scheduler decides **who runs next** on the CPU:

| Criterion | Goal |
|-----------|------|
| **CPU Utilization** | Keep CPU busy (>90%) | <!-- .element: class="fragment highlight-green" data-fragment-index="0" -->
| **Throughput** | Max processes / time unit | <!-- .element: class="fragment" data-fragment-index="1" -->
| **Turnaround Time** | Min submission → completion | <!-- .element: class="fragment" data-fragment-index="2" -->
| **Waiting Time** | Min time idle in ready queue | <!-- .element: class="fragment highlight-red" data-fragment-index="3" -->
| **Response Time** | Min request → first response | <!-- .element: class="fragment highlight-red" data-fragment-index="3" -->

> ⚖️ No single algorithm optimizes **all five** simultaneously! <!-- .element: class="fragment" data-fragment-index="4" -->`,
    },

    // ── Slide 14: Summary ───────────────────────────────────────────
    {
      id: 'os-slide-14',
      slideIndex: 14,
      audioUrl: '/audio/os-slide-14.mp3',
      audioDuration: 10.9,
      timepoints: [
        { markName: 'frag-0', timeSeconds: 2.38, fragmentIndex: 0 },
        { markName: 'frag-1', timeSeconds: 9.48, fragmentIndex: 1 },
        { markName: 'frag-2', timeSeconds: 17.06, fragmentIndex: 2 },
        { markName: 'frag-3', timeSeconds: 22.61, fragmentIndex: 3 },
        { markName: 'frag-4', timeSeconds: 28.72, fragmentIndex: 4 },
      ],
      transcript:
        "Let us recap what we have covered today. A process is a program in execution, structured in memory as text, data, heap, and stack. The PCB stores everything the OS needs to manage a process — especially the program counter and CPU registers. Context switches are the mechanism for multitasking, but they come at a real performance cost. Processes are created with fork and exec, and we must handle zombie and orphan processes correctly. And finally, IPC enables cooperation between processes, with shared memory and message passing as the two fundamental approaches. In our next session, we will dive deep into CPU scheduling algorithms. See you there.",
      rawMarkdown: `## 🎓 Key Takeaways

- **Process** = program in execution (text, data, heap, stack) <!-- .element: class="fragment" data-fragment-index="0" -->
- **PCB** = OS identity card (PC + registers are critical) <!-- .element: class="fragment" data-fragment-index="1" -->
- **Context switch** = save/restore state — pure overhead <!-- .element: class="fragment" data-fragment-index="2" -->
- **fork() + exec()** = Unix process creation pattern <!-- .element: class="fragment" data-fragment-index="3" -->
- **IPC**: shared memory (fast) vs message passing (clean) <!-- .element: class="fragment" data-fragment-index="4" -->

> 📚 **Next:** CPU Scheduling Algorithms — FCFS, SJF, Round Robin, and more!`,
    },
  ],

  // ── Course Plan ───────────────────────────────────────────────────
  coursePlan: {
    courseTitle: 'Operating Systems: Internal Architecture',
    chapters: [
      {
        id: 'ch-proc',
        title: 'Process Management',
        topics: [
          {
            id: 't-intro',
            title: 'Introduction',
            slideIndices: [0],
          },
          {
            id: 't-fundamentals',
            title: 'Process Fundamentals',
            slideIndices: [1, 2, 3],
            children: [
              { id: 't-what-is', title: 'What is a Process?', slideIndices: [1] },
              { id: 't-memory', title: 'Process Memory Layout', slideIndices: [2] },
              { id: 't-pcb', title: 'Process Control Block (PCB)', slideIndices: [3] },
            ],
          },
          {
            id: 't-states',
            title: 'Process Lifecycle',
            slideIndices: [4, 5],
            children: [
              { id: 't-five-states', title: 'The Five Process States', slideIndices: [4] },
              { id: 't-transitions', title: 'State Transitions', slideIndices: [5] },
            ],
          },
          {
            id: 't-context',
            title: 'Context Switching',
            slideIndices: [6, 7],
            children: [
              { id: 't-ctx-anatomy', title: 'Anatomy of a Context Switch', slideIndices: [6] },
              { id: 't-ctx-cost', title: 'The Hidden Cost', slideIndices: [7] },
            ],
          },
          {
            id: 't-creation',
            title: 'Process Creation & Termination',
            slideIndices: [8, 9, 10],
            children: [
              { id: 't-fork', title: 'fork() System Call', slideIndices: [8] },
              { id: 't-exec', title: 'exec() System Call', slideIndices: [9] },
              { id: 't-termination', title: 'Termination, Zombies & Orphans', slideIndices: [10] },
            ],
          },
          {
            id: 't-ipc',
            title: 'Inter-Process Communication',
            slideIndices: [11, 12],
            children: [
              { id: 't-ipc-models', title: 'Shared Memory vs Message Passing', slideIndices: [11] },
              { id: 't-pipes', title: 'Pipes & Named Pipes', slideIndices: [12] },
            ],
          },
          {
            id: 't-scheduling',
            title: 'CPU Scheduling Overview',
            slideIndices: [13],
          },
          {
            id: 't-summary',
            title: 'Summary & Next Steps',
            slideIndices: [14],
          },
        ],
      },
    ],
  },

  currentPosition: {
    chapterIndex: 0,
    topicPath: [0],
  },
};
