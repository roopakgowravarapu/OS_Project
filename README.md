# Visual Implementation of Banker's Algorithm
### Operating Systems Interactive Simulator

A clean, modern, educational web application for demonstrating core Operating Systems concepts:
1. **Multithreading** (Genuine Python `threading.Thread` instances per process)
2. **Race Condition Prevention** (Mutual exclusion with `threading.Lock()`)
3. **Deadlock Avoidance** (Classic Banker's Safety, Request, and Release Algorithms)

---

## 🚀 Quick Start

### 1. Requirements
- Python 3.8+ (Python 3.12 verified)
- Flask (`pip install Flask`)

### 2. Run the Application
From the project directory:
```bash
python app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

### 3. Run Automated Verification Tests
To run the automated test suite verifying mathematical correctness, multithreading, and mutex locking:
```bash
python test_suite.py
```

---

## 📁 Project Architecture

```
├── app.py                  # Flask web server & REST API endpoints
├── banker.py               # Core Banker's algorithm engine & thread-safe state
├── threads_manager.py      # Python threading.Thread & threading.Lock() simulations
├── test_suite.py           # Comprehensive 7-suite validation test script
├── templates/
│   └── index.html          # Semantic, responsive, single-page UI
└── static/
    ├── css/
    │   └── style.css       # Clean, light-themed CSS (no pill buttons, crisp borders)
    └── js/
        └── app.js          # Interactive controllers, steppers & dynamic DOM rendering
```

---

## 🖥️ Simulator Sections

### 1. System Configuration
- Configure number of processes ($n$) and resource types ($m$).
- Define Total physical system capacities ($Total$).
- Enter the Maximum claim matrix ($Max$) and optional initial Allocations ($Allocation$).
- Includes standard presets:
  - **Silberschatz Textbook Case (Safe)**: 5 processes, 3 resources ($Total=[10, 5, 7]$, $Available=[3, 3, 2]$, Safe sequence: $\langle P_1, P_3, P_4, P_0, P_2 \rangle$).
  - **Deadlock / Unsafe Case**: System starts in an unsafe state where no process can finish.
  - **Simple 3-Process Case**: Fast classroom walkthrough.

### 2. Resource Allocation Dashboard
- Dynamic real-time calculation of:
  - $\text{Need}[i][j] = \text{Maximum}[i][j] - \text{Allocation}[i][j]$
  - $\text{Available}[j] = \text{Total}[j] - \sum_{i} \text{Allocation}[i][j]$
- Summary cards for Total, Allocated, and Available units.
- Fully aligned tables with value-change animations.

### 3. Banker's Algorithm Visualization (Safety Algorithm)
- Step-by-step breakdown (not just final outcome):
  - Work vector: $Work = Available$.
  - Finish array: $Finish = [False, \dots]$.
  - Process inspector: checks $Need[i] \le Work$ for each resource type.
  - Resource release animation: $Work = Work + Allocation[i]$, $Finish[i] = True$.
  - Safe sequence accumulation.
- Stepper controls: **Next Step**, **Previous Step**, **Auto Play**, **Pause**, **Restart**, and **Speed Adjustment** (Slow default for presentations).
- Deterministic simulation history guarantees clicking Previous Step restores state without side effects.

### 4. Multithreading
- Creates genuine Python `threading.Thread()` instances for each process ($T_0 \to P_0$, $T_1 \to P_1$, etc.).
- Visual 1:1 mapping with connecting flow arrows and live thread IDs (`threading.get_ident()`).
- Real-time thread lifecycle states:
  - **Created** $\to$ **Ready** $\to$ **Running** $\to$ **Waiting** (for Mutex) $\to$ **Completed**.
- Step-by-step progress controls to explain thread scheduling and synchronization.

### 5. Race Condition Prevention
- **The Problem**: Two threads ($T_0$ requests 3, $T_1$ requests 4) access shared Available units ($5$) simultaneously without synchronization. Both observe $5 \ge \text{Request}$ and subtract, corrupting memory to $-2$.
- **The Solution**: Mutual exclusion using `threading.Lock()`.
  1. $T_0$ acquires lock; $T_1$ waits in the queue.
  2. $T_0$ enters Critical Section, evaluates $3 \le 5$, updates $Available = 2$.
  3. $T_0$ releases lock.
  4. $T_1$ acquires lock, enters Critical Section, evaluates $4 \le 2$ (False).
  5. $T_1$ must wait; shared memory integrity is protected.

### 6. Resource Request & Release
- Interactive Banker Console:
  - Request verification:
    1. $\text{Request} \le \text{Need}$ (checks maximum claim).
    2. $\text{Request} \le \text{Available}$ (insufficient resources trigger **WAIT**).
    3. Tentative allocation.
    4. Safety Algorithm check: **Approved** if safe; **Rolled back** if unsafe.
  - Quick Test buttons:
    - Safe Request: $P_1$ requests $[1, 0, 2]$.
    - Unsafe Request: $P_0$ requests $[0, 0, 2]$ (triggers automatic rollback).
    - Waiting Request: $P_4$ requests $[4, 3, 1]$ (triggers wait state).
    - Exceeded Claim: $P_0$ requests $[4, 4, 4]$ (triggers error).
  - Resource Release with allocation bounds validation.

### 7. Execution Logs Drawer
- Timestamped audit trail tracking every thread launch, lock acquisition, request approval, and safety decision.
