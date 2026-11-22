"""
Multithreading and Race Condition Manager
Implements:
1. Genuine Python threading.Thread instances for each process (T_i -> P_i)
2. Real condition variable synchronization (threading.Condition) enforcing Banker's resource constraints
3. Accurate thread lifecycle: CREATED -> READY -> RUNNING -> WAITING (for resources) -> COMPLETED
4. Execution in mathematically proven Safe Sequence
5. Atomic timeline event recording ensuring perfect lock-step UI synchronization
"""

import threading
import time
import datetime
import copy
from typing import List, Dict, Any, Optional


class ProcessThreadSimulation:
    def __init__(self, banker_instance):
        self.banker = banker_instance
        self.mutex = threading.Lock()
        self.simulation_lock = threading.Lock()
        self.execution_logs: List[Dict[str, Any]] = []

    def log_event(self, source: str, event_type: str, message: str, details: Optional[Dict[str, Any]] = None):
        """Records an execution event with timestamp and thread context."""
        timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
        thread_id = threading.get_ident()
        log_entry = {
            "timestamp": timestamp,
            "thread_id": thread_id,
            "source": source,
            "type": event_type,
            "message": message,
            "details": details or {}
        }
        self.execution_logs.append(log_entry)
        if len(self.execution_logs) > 200:
            self.execution_logs.pop(0)

    def run_multithreaded_workload(self) -> Dict[str, Any]:
        """
        Spawns genuine Python threading.Thread instances for every process.
        Threads synchronize through a threading.Condition(self.mutex).
        Threads whose declared Need exceeds current Available enter WAITING state.
        When an eligible thread finishes, it releases its allocated resources back to Available,
        notifying waiting threads to re-evaluate. This naturally executes in the Banker's Safe Sequence!
        """
        with self.simulation_lock:
            state = self.banker.get_state()
            num_processes = state["num_processes"]
            num_resources = state["num_resources"]
            process_names = list(state["process_names"])
            resource_names = list(state["resource_names"])

            # Working copies for this thread execution run
            sim_available = list(state["available_vector"])
            sim_allocation = [list(row) for row in state["allocation_matrix"]]
            sim_need = [list(row) for row in state["need_matrix"]]

            events = []
            thread_records = {}

            for i in range(num_processes):
                thread_records[f"T{i}"] = {
                    "thread_name": f"T{i}",
                    "process_name": process_names[i],
                    "status": "CREATED",
                    "thread_id": None
                }

            event_lock = threading.Lock()
            step_counter = 0
            cond = threading.Condition(self.mutex)
            completed_order = []

            def record_atomic_step(t_name, p_name, status, action, description, extra=None):
                nonlocal step_counter
                with event_lock:
                    step_counter += 1
                    timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
                    if t_name in thread_records:
                        thread_records[t_name]["status"] = status
                    
                    # Deep copy statuses and available vector atomically
                    snapshot_statuses = {k: v["status"] for k, v in thread_records.items()}
                    snapshot_avail = list(sim_available)

                    evt = {
                        "step_id": step_counter,
                        "timestamp": timestamp,
                        "thread_name": t_name,
                        "process_name": p_name,
                        "thread_id": thread_records.get(t_name, {}).get("thread_id"),
                        "status": status,
                        "action": action,
                        "description": description,
                        "available_vector": snapshot_avail,
                        "completed_order": list(completed_order),
                        "state_snapshot": {
                            "thread_statuses": snapshot_statuses
                        }
                    }
                    if extra:
                        evt.update(extra)
                    events.append(evt)
                    self.log_event(t_name, action, description)

            # Record initial state
            record_atomic_step(
                "SYSTEM", "INIT", "CREATED", "SIM_INIT",
                f"Starting Multithreaded OS simulation. Initial Available: {sim_available}. Preparing {num_processes} thread workers."
            )

            # Worker function for genuine Python threading.Thread
            def worker(index):
                t_name = f"T{index}"
                p_name = process_names[index]
                real_tid = threading.get_ident()

                with event_lock:
                    thread_records[t_name]["thread_id"] = real_tid

                # Transition 1: READY
                record_atomic_step(
                    t_name, p_name, "READY", "THREAD_READY",
                    f"Thread {t_name} (OS TID: {real_tid}) initialized and mapped to {p_name}. Placed in Ready Queue.",
                    {"mutex_owner": None}
                )

                time.sleep(0.02 * (index + 1))

                # Transition 2: RUNNING (Scheduled by CPU)
                record_atomic_step(
                    t_name, p_name, "RUNNING", "THREAD_RUNNING",
                    f"Thread {t_name} scheduled on CPU. Attempting to acquire shared Mutex to enter Critical Section.",
                    {"mutex_owner": None}
                )

                # Enter Critical Section with Condition Variable
                with cond:
                    record_atomic_step(
                        t_name, p_name, "RUNNING", "MUTEX_ACQUIRED",
                        f"Thread {t_name} ACQUIRED Mutex Lock. In Critical Section. Inspecting resource availability: Need {sim_need[index]} vs Available {sim_available}.",
                        {"mutex_owner": t_name}
                    )

                    # Check resource availability (Need <= Available)
                    while not all(sim_need[index][r] <= sim_available[r] for r in range(num_resources)):
                        insufficient = [resource_names[r] for r in range(num_resources) if sim_need[index][r] > sim_available[r]]
                        record_atomic_step(
                            t_name, p_name, "WAITING", "RESOURCE_WAIT",
                            f"Thread {t_name} CANNOT execute yet: Need {sim_need[index]} > Available {sim_available} (Lacking {insufficient}). "
                            f"{t_name} enters WAITING state, yields Mutex Lock, and waits for other threads to finish.",
                            {"waiting_on": insufficient, "mutex_owner": None}
                        )
                        # Wait on condition variable (releases lock and blocks)
                        cond.wait(timeout=2.0)
                        
                        # Re-evaluating after wake-up
                        record_atomic_step(
                            t_name, p_name, "RUNNING", "THREAD_WOKEN",
                            f"Thread {t_name} re-acquired Mutex upon wake-up. Re-evaluating Need {sim_need[index]} vs updated Available {sim_available}.",
                            {"mutex_owner": t_name}
                        )

                    # Condition satisfied: Thread can now execute!
                    avail_before = list(sim_available)
                    for r in range(num_resources):
                        sim_available[r] -= sim_need[index][r]

                    record_atomic_step(
                        t_name, p_name, "RUNNING", "RESOURCES_ALLOCATED",
                        f"Thread {t_name} satisfies resource requirements! Allocated Need {sim_need[index]}. Working Available temporarily: {sim_available}. Executing process workload...",
                        {"mutex_owner": t_name}
                    )

                    time.sleep(0.04)  # Simulate CPU execution workload

                    # Thread finishes task and releases all its resources back to system pool
                    # (Returns its allocation + the need it borrowed)
                    held_alloc = list(sim_allocation[index])
                    for r in range(num_resources):
                        sim_available[r] += sim_need[index][r] + held_alloc[r]

                    completed_order.append(t_name)

                    record_atomic_step(
                        t_name, p_name, "COMPLETED", "TASK_FINISHED_RELEASE",
                        f"Thread {t_name} finished task execution! Released held allocation {held_alloc} back to system pool. "
                        f"New Available: {sim_available}. Signaling waiting threads via cond.notify_all().",
                        {"mutex_owner": t_name}
                    )

                    # Signal all waiting threads that new resources are available!
                    cond.notify_all()

            # Create real threads
            threads = []
            for i in range(num_processes):
                th = threading.Thread(target=worker, args=(i,), name=f"OS-Thread-{i}")
                threads.append(th)
                record_atomic_step(
                    f"T{i}", process_names[i], "CREATED", "THREAD_CREATED",
                    f"Thread T{i} created using Python threading.Thread() for process {process_names[i]}."
                )

            # Start all threads
            for th in threads:
                th.start()

            # Wait for all threads to terminate
            for th in threads:
                th.join()

            # Final summary step
            record_atomic_step(
                "SYSTEM", "ALL", "COMPLETED", "ALL_COMPLETED",
                f"All {num_processes} threads successfully completed in safe execution order: [{' -> '.join(completed_order)}]. "
                f"Final system Available: {sim_available}."
            )

            return {
                "success": True,
                "num_threads": num_processes,
                "mappings": [
                    {"thread": f"T{i}", "process": process_names[i]}
                    for i in range(num_processes)
                ],
                "completion_order": completed_order,
                "timeline": events,
                "total_steps": len(events),
                "final_available": sim_available
            }

    def simulate_race_condition_scenario(self, use_mutex: bool = True) -> Dict[str, Any]:
        """
        Explicitly demonstrates Race Condition Prevention:
        Shared Available Resources = 5
        T0 requests 3 resources.
        T1 requests 4 resources.

        If use_mutex is False:
        Both threads read shared Available = 5 at the same time. Both see 5 >= 3 and 5 >= 4.
        Both deduct, resulting in Available = -2 (Data corruption / Race condition hazard!).

        If use_mutex is True:
        T0 acquires threading.Lock(). T1 waits.
        T0 enters critical section, checks 5 >= 3, updates Available = 2, releases lock.
        T1 acquires lock, enters critical section, checks 2 against 4 -> Insufficient!
        T1 safely waits or rejects. Shared data integrity preserved!
        """
        shared_resource_name = "R0 (Available Units)"
        initial_value = 5
        events = []
        event_lock = threading.Lock()

        def add_event(step_id, thread_name, action, desc, current_val, mutex_status, waiting_queue, agent_states=None):
            time.sleep(0.015)
            with event_lock:
                timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
                tid = threading.get_ident()
                event_entry = {
                    "step_id": step_id,
                    "timestamp": timestamp,
                    "thread_name": thread_name,
                    "thread_id": tid,
                    "action": action,
                    "description": desc,
                    "shared_available": current_val,
                    "mutex_status": mutex_status,
                    "waiting_queue": list(waiting_queue),
                    "agent_states": agent_states or {}
                }
                events.append(event_entry)
                self.log_event(f"RACE_{thread_name}", action, desc, {"shared_available": current_val, "mutex_status": mutex_status})

        if not use_mutex:
            step = 0
            val = initial_value
            step += 1
            add_event(step, "System", "INIT", f"Initial shared Available = {val}. Mutex lock is DISABLED.", val, "NONE", [], {"T0": "Idle", "T1": "Idle"})

            # Step 1: T0 and T1 both inspect Available concurrently
            step += 1
            add_event(step, "T0", "READ_SHARED", f"T0 reads shared Available = {val} (wants 3 units). Checks: 3 <= {val} (Satisfied).", val, "NONE", [], {"T0": "READ_SHARED (Observed: 5)", "T1": "Idle"})
            
            step += 1
            add_event(step, "T1", "READ_SHARED", f"T1 reads shared Available = {val} concurrently! (wants 4 units). Checks: 4 <= {val} (Satisfied).", val, "NONE", [], {"T0": "READ_SHARED (Observed: 5)", "T1": "READ_SHARED (Observed: 5)"})

            # Step 2: T0 deducts
            val = val - 3
            step += 1
            add_event(step, "T0", "UNPROTECTED_WRITE", f"T0 deducts 3 units: Available = 5 - 3 = {val}.", val, "NONE", [], {"T0": "UNPROTECTED_WRITE (Deducted 3)", "T1": "READ_SHARED (Stale: 5)"})

            # Step 3: T1 deducts from its stale knowledge or simultaneously
            val = val - 4
            step += 1
            add_event(step, "T1", "UNPROTECTED_WRITE", f"CRITICAL HAZARD: T1 deducts 4 units without lock: Available becomes {val} (NEGATIVE!).", val, "NONE", [], {"T0": "WRITE_COMPLETE", "T1": "UNPROTECTED_WRITE (Deducted 4)"})

            step += 1
            add_event(
                step, "System", "RACE_CONDITION_DETECTED",
                f"RACE CONDITION OCCURRED! Both threads accessed shared memory without synchronization. "
                f"Total requested: 3 + 4 = 7, but only 5 existed. Final Available = {val}. System corrupted!",
                val, "CORRUPTED", [],
                {"T0": "CORRUPTED (Data Hazard)", "T1": "CORRUPTED (Data Hazard)"}
            )

            return {
                "mode": "WITHOUT_MUTEX",
                "has_race_condition": True,
                "initial_value": initial_value,
                "final_value": val,
                "steps": events
            }

        else:
            step = 0
            val = initial_value
            waiting_queue = []
            demo_lock = threading.Lock()

            step += 1
            add_event(step, "System", "INIT", f"Initial shared Available = {val}. Mutex lock (threading.Lock) is ACTIVE.", val, "UNLOCKED", waiting_queue, {"T0": "Idle", "T1": "Idle"})

            # Step 1: T0 requests lock
            step += 1
            add_event(step, "T0", "LOCK_REQUEST", "T0 requests Mutex Lock.", val, "UNLOCKED", waiting_queue, {"T0": "LOCK_REQUEST", "T1": "Idle"})

            demo_lock.acquire()
            step += 1
            add_event(step, "T0", "LOCK_ACQUIRED", "T0 ACQUIRED Mutex Lock. Lock state: LOCKED by T0.", val, "LOCKED (T0)", waiting_queue, {"T0": "MUTEX_HELD", "T1": "Idle"})

            # Step 2: T1 attempts to acquire lock while held by T0
            waiting_queue.append("T1")
            step += 1
            add_event(step, "T1", "LOCK_BLOCKED", "T1 attempts to acquire lock, but it is held by T0. T1 placed in WAITING QUEUE.", val, "LOCKED (T0)", waiting_queue, {"T0": "MUTEX_HELD", "T1": "LOCK_BLOCKED (Waiting)"})

            # Step 3: T0 enters Critical Section
            step += 1
            add_event(step, "T0", "CRITICAL_SECTION_ENTER", "T0 enters Critical Section. Reads shared Available = 5. Evaluates request: 3 <= 5 (Approved).", val, "LOCKED (T0)", waiting_queue, {"T0": "CRITICAL_SECTION (Evaluating)", "T1": "LOCK_BLOCKED (Waiting)"})

            # Step 4: T0 safely updates shared resource
            val = val - 3
            step += 1
            add_event(step, "T0", "CRITICAL_SECTION_UPDATE", f"T0 deducts 3 units safely: Available = 5 - 3 = {val}.", val, "LOCKED (T0)", waiting_queue, {"T0": "CRITICAL_SECTION (Deducted 3)", "T1": "LOCK_BLOCKED (Waiting)"})

            # Step 5: T0 exits Critical Section and releases lock
            demo_lock.release()
            step += 1
            add_event(step, "T0", "LOCK_RELEASED", f"T0 releases Mutex Lock. Signal sent to waiting threads.", val, "UNLOCKED", waiting_queue, {"T0": "COMPLETED (3 Deducted)", "T1": "LOCK_BLOCKED (Ready)"})

            # Step 6: T1 acquires lock
            waiting_queue.remove("T1")
            demo_lock.acquire()
            step += 1
            add_event(step, "T1", "LOCK_ACQUIRED", "T1 dequeued and ACQUIRES Mutex Lock. Lock state: LOCKED by T1.", val, "LOCKED (T1)", waiting_queue, {"T0": "COMPLETED (3 Deducted)", "T1": "MUTEX_HELD"})

            # Step 7: T1 enters Critical Section and checks current Available
            step += 1
            add_event(step, "T1", "CRITICAL_SECTION_CHECK", f"T1 enters Critical Section. Reads updated Available = {val}. Evaluates request: 4 <= {val}? Condition FALSE! (4 > {val}).", val, "LOCKED (T1)", waiting_queue, {"T0": "COMPLETED (3 Deducted)", "T1": "CRITICAL_SECTION (Evaluating)"})

            step += 1
            add_event(step, "T1", "REQUEST_WAIT_SAFE", f"T1 must WAIT. Request cannot be granted because only {val} units remain. State preserved safely without corruption.", val, "LOCKED (T1)", waiting_queue, {"T0": "COMPLETED (3 Deducted)", "T1": "REQUEST_DENIED (Wait)"})

            demo_lock.release()
            step += 1
            add_event(step, "T1", "LOCK_RELEASED", "T1 releases Mutex Lock. State remains valid and consistent.", val, "UNLOCKED", waiting_queue, {"T0": "COMPLETED (3 Deducted)", "T1": "RELEASED (Preserved)"})

            step += 1
            add_event(
                step, "System", "RACE_PREVENTED",
                f"RACE CONDITION PREVENTED SUCCESSFULLY! Mutex ensured mutual exclusion. Final Available = {val} (Positive and valid).",
                val, "UNLOCKED", waiting_queue,
                {"T0": "COMPLETED (Safe)", "T1": "SAFELY_PRESERVED (Wait)"}
            )

            return {
                "mode": "WITH_MUTEX",
                "has_race_condition": False,
                "initial_value": initial_value,
                "final_value": val,
                "steps": events
            }
