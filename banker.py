"""
Banker's Algorithm Core Module
Implements:
1. Safety Algorithm with step-by-step trace generation (round-sweep deterministic sequence)
2. Resource Request Algorithm with tentative allocation and rollback
3. Resource Release Algorithm
4. Thread-safe state management with threading.Lock()
"""

import threading
import copy
from typing import List, Dict, Any, Tuple, Optional


class BankersAlgorithm:
    def __init__(self):
        self.lock = threading.Lock()
        
        # Standard Silberschatz textbook example (5 processes, 3 resource types)
        self.num_processes = 5
        self.num_resources = 3
        self.resource_names = ["R0", "R1", "R2"]
        self.process_names = ["P0", "P1", "P2", "P3", "P4"]
        
        self.total_resources = [10, 5, 7]
        self.allocation_matrix = [
            [0, 1, 0],
            [2, 0, 0],
            [3, 0, 2],
            [2, 1, 1],
            [0, 0, 2]
        ]
        self.max_matrix = [
            [7, 5, 3],
            [3, 2, 2],
            [9, 0, 2],
            [2, 2, 2],
            [4, 3, 3]
        ]
        
        self.recalculate_derived_matrices()

    def recalculate_derived_matrices(self):
        """Recalculates Available Vector and Need Matrix from Total, Alloc, and Max."""
        allocated_sums = [0] * self.num_resources
        for p in range(self.num_processes):
            for r in range(self.num_resources):
                allocated_sums[r] += self.allocation_matrix[p][r]
                
        self.available_vector = [
            self.total_resources[r] - allocated_sums[r]
            for r in range(self.num_resources)
        ]
        
        self.need_matrix = []
        for p in range(self.num_processes):
            p_need = [
                self.max_matrix[p][r] - self.allocation_matrix[p][r]
                for r in range(self.num_resources)
            ]
            self.need_matrix.append(p_need)

    def initialize_system(self, num_processes: int, num_resources: int,
                          total_resources: List[int], max_matrix: List[List[int]],
                          allocation_matrix: Optional[List[List[int]]] = None) -> Dict[str, Any]:
        """Initializes the Banker's system with validated parameters."""
        with self.lock:
            if not (1 <= num_processes <= 10):
                return {"success": False, "error": "Number of processes must be between 1 and 10"}
            if not (1 <= num_resources <= 6):
                return {"success": False, "error": "Number of resource types must be between 1 and 6"}
            if len(total_resources) != num_resources:
                return {"success": False, "error": f"Total resources must have {num_resources} entries"}
            if len(max_matrix) != num_processes or any(len(row) != num_resources for row in max_matrix):
                return {"success": False, "error": f"Max matrix must be of size {num_processes}x{num_resources}"}

            if any(t < 0 for t in total_resources):
                return {"success": False, "error": "Total resource counts cannot be negative"}
            for p, row in enumerate(max_matrix):
                for r, val in enumerate(row):
                    if val < 0:
                        return {"success": False, "error": f"Max requirement for P{p}, R{r} cannot be negative"}
                    if val > total_resources[r]:
                        return {"success": False, "error": f"Max claim for P{p}, R{r} ({val}) cannot exceed total available system capacity ({total_resources[r]})"}

            if allocation_matrix is None:
                allocation_matrix = [[0] * num_resources for _ in range(num_processes)]
            else:
                if len(allocation_matrix) != num_processes or any(len(row) != num_resources for row in allocation_matrix):
                    return {"success": False, "error": f"Allocation matrix must be of size {num_processes}x{num_resources}"}
                for p, row in enumerate(allocation_matrix):
                    for r, val in enumerate(row):
                        if val < 0:
                            return {"success": False, "error": f"Allocation for P{p}, R{r} cannot be negative"}
                        if val > max_matrix[p][r]:
                            return {"success": False, "error": f"Allocation for P{p}, R{r} ({val}) cannot exceed Max claim ({max_matrix[p][r]})"}

            allocated_sums = [0] * num_resources
            for p in range(num_processes):
                for r in range(num_resources):
                    allocated_sums[r] += allocation_matrix[p][r]

            for r in range(num_resources):
                if allocated_sums[r] > total_resources[r]:
                    return {"success": False, "error": f"Total allocated R{r} ({allocated_sums[r]}) exceeds total system capacity ({total_resources[r]})"}

            self.num_processes = num_processes
            self.num_resources = num_resources
            self.resource_names = [f"R{i}" for i in range(num_resources)]
            self.process_names = [f"P{i}" for i in range(num_processes)]
            self.total_resources = copy.deepcopy(total_resources)
            self.max_matrix = copy.deepcopy(max_matrix)
            self.allocation_matrix = copy.deepcopy(allocation_matrix)
            self.recalculate_derived_matrices()

            return {"success": True, "state": self.get_state_unlocked()}

    def get_state(self) -> Dict[str, Any]:
        """Returns snapshot of current state."""
        with self.lock:
            return self.get_state_unlocked()

    def get_state_unlocked(self) -> Dict[str, Any]:
        """Helper to get state when lock is already held."""
        allocated_sums = [0] * self.num_resources
        for p in range(self.num_processes):
            for r in range(self.num_resources):
                allocated_sums[r] += self.allocation_matrix[p][r]

        return {
            "num_processes": self.num_processes,
            "num_resources": self.num_resources,
            "resource_names": self.resource_names,
            "process_names": self.process_names,
            "total_resources": copy.deepcopy(self.total_resources),
            "available_vector": copy.deepcopy(self.available_vector),
            "max_matrix": copy.deepcopy(self.max_matrix),
            "allocation_matrix": copy.deepcopy(self.allocation_matrix),
            "need_matrix": copy.deepcopy(self.need_matrix),
            "allocated_sums": allocated_sums,
            "dynamic_scenarios": self.get_dynamic_scenarios_unlocked()
        }

    def get_dynamic_scenarios_unlocked(self) -> Dict[str, Any]:
        """Calculates dynamic quick-test scenarios based on the live current state."""
        n = self.num_processes
        m = self.num_resources
        avail = self.available_vector
        need = self.need_matrix
        alloc = self.allocation_matrix
        p_names = self.process_names

        # 1. Safe Scenario: prefer classic P1 [1,0,2] if valid, otherwise find any non-zero safe request
        safe_scen = None
        if n >= 2 and m >= 3 and p_names[1] == "P1":
            classic_req = [1, 0, 2]
            if all(classic_req[r] <= need[1][r] for r in range(3)) and all(classic_req[r] <= avail[r] for r in range(3)):
                t_avail = list(avail)
                t_alloc = [list(row) for row in alloc]
                t_need = [list(row) for row in need]
                for r in range(3):
                    t_avail[r] -= classic_req[r]
                    t_alloc[1][r] += classic_req[r]
                    t_need[1][r] -= classic_req[r]
                if self._check_safety_internal(t_avail, t_alloc, t_need)["is_safe"]:
                    safe_scen = {"process_id": 1, "process_name": "P1", "request": classic_req, "label": f"P1: {classic_req} (Safe Request)"}

        if not safe_scen:
            for p in range(n):
                for r in range(m):
                    if need[p][r] > 0 and avail[r] > 0:
                        req = [0] * m
                        req[r] = min(need[p][r], avail[r], 1)
                        t_avail = list(avail)
                        t_alloc = [list(row) for row in alloc]
                        t_need = [list(row) for row in need]
                        t_avail[r] -= req[r]
                        t_alloc[p][r] += req[r]
                        t_need[p][r] -= req[r]
                        if self._check_safety_internal(t_avail, t_alloc, t_need)["is_safe"]:
                            safe_scen = {"process_id": p, "process_name": p_names[p], "request": req, "label": f"{p_names[p]}: {req} (Safe Request)"}
                            break
                if safe_scen:
                    break

        # 2. Unsafe Scenario: prefer classic P0 [0,0,2] if valid and unsafe, otherwise search for an unsafe request
        unsafe_scen = None
        if n >= 1 and m >= 3 and p_names[0] == "P0":
            classic_unsafe = [0, 0, 2]
            if all(classic_unsafe[r] <= need[0][r] for r in range(3)) and all(classic_unsafe[r] <= avail[r] for r in range(3)):
                t_avail = list(avail)
                t_alloc = [list(row) for row in alloc]
                t_need = [list(row) for row in need]
                for r in range(3):
                    t_avail[r] -= classic_unsafe[r]
                    t_alloc[0][r] += classic_unsafe[r]
                    t_need[0][r] -= classic_unsafe[r]
                if not self._check_safety_internal(t_avail, t_alloc, t_need)["is_safe"]:
                    unsafe_scen = {"process_id": 0, "process_name": "P0", "request": classic_unsafe, "label": f"P0: {classic_unsafe} (Unsafe → Rollback)"}

        if not unsafe_scen:
            for p in range(n):
                for r in range(m):
                    max_try = min(need[p][r], avail[r])
                    for amt in range(max_try, 0, -1):
                        req = [0] * m
                        req[r] = amt
                        t_avail = list(avail)
                        t_alloc = [list(row) for row in alloc]
                        t_need = [list(row) for row in need]
                        t_avail[r] -= req[r]
                        t_alloc[p][r] += req[r]
                        t_need[p][r] -= req[r]
                        if not self._check_safety_internal(t_avail, t_alloc, t_need)["is_safe"]:
                            unsafe_scen = {"process_id": p, "process_name": p_names[p], "request": req, "label": f"{p_names[p]}: {req} (Unsafe → Rollback)"}
                            break
                    if unsafe_scen:
                        break
                if unsafe_scen:
                    break

        # 3. Wait Scenario: Request <= Need, but Request[r] > Available[r]
        wait_scen = None
        for p in range(n):
            req = [0] * m
            causes_wait = False
            for r in range(m):
                if need[p][r] > avail[r]:
                    req[r] = need[p][r]
                    causes_wait = True
                elif need[p][r] > 0:
                    req[r] = min(need[p][r], avail[r])
            if causes_wait:
                wait_scen = {"process_id": p, "process_name": p_names[p], "request": req, "label": f"{p_names[p]}: {req} (Exceeds Available → Wait)"}
                break

        # 4. Exceed Claim Scenario: Request > Need
        exceed_scen = None
        for p in range(n):
            req = list(need[p])
            req[0] += 1
            exceed_scen = {"process_id": p, "process_name": p_names[p], "request": req, "label": f"{p_names[p]}: {req} (Exceeds Claim → Error)"}
            break

        return {
            "safe": safe_scen,
            "unsafe": unsafe_scen,
            "wait": wait_scen,
            "exceed": exceed_scen
        }

    def generate_safety_trace(self, custom_available=None, custom_allocation=None, custom_need=None) -> Dict[str, Any]:
        """
        Executes the Banker's Safety Algorithm step-by-step and returns a deterministic,
        comprehensive trace of all steps, comparisons, Work updates, and the final state.
        Uses standard round-sweep to match classic textbook sequencing (e.g. <P1, P3, P4, P0, P2>).
        """
        with self.lock:
            available = copy.deepcopy(custom_available if custom_available is not None else self.available_vector)
            allocation = copy.deepcopy(custom_allocation if custom_allocation is not None else self.allocation_matrix)
            need = copy.deepcopy(custom_need if custom_need is not None else self.need_matrix)
            n = self.num_processes
            m = self.num_resources
            process_names = list(self.process_names)
            resource_names = list(self.resource_names)

        work = copy.deepcopy(available)
        finish = [False] * n
        safe_sequence = []
        steps = []
        step_counter = 0

        # Step 0: Initialization
        step_counter += 1
        steps.append({
            "step_id": step_counter,
            "type": "INITIALIZATION",
            "process_id": None,
            "process_name": None,
            "work": copy.deepcopy(work),
            "finish": copy.deepcopy(finish),
            "safe_sequence": list(safe_sequence),
            "description": f"Safety Algorithm initialized. Set Work = Available {work}, Finish = {[False] * n}."
        })

        # Round-sweep safety algorithm
        round_num = 1
        while True:
            allocated_in_this_round = False

            for i in range(n):
                if not finish[i]:
                    step_counter += 1
                    comparisons = []
                    can_finish = True
                    for j in range(m):
                        comp = {
                            "resource": resource_names[j],
                            "need": need[i][j],
                            "work": work[j],
                            "satisfied": need[i][j] <= work[j]
                        }
                        comparisons.append(comp)
                        if need[i][j] > work[j]:
                            can_finish = False

                    if can_finish:
                        work_before = copy.deepcopy(work)
                        allocated_to_process = copy.deepcopy(allocation[i])
                        for j in range(m):
                            work[j] += allocation[i][j]
                        finish[i] = True
                        safe_sequence.append(process_names[i])
                        allocated_in_this_round = True

                        steps.append({
                            "step_id": step_counter,
                            "type": "PROCESS_ELIGIBLE_AND_COMPLETED",
                            "process_id": i,
                            "process_name": process_names[i],
                            "work_before": work_before,
                            "work": copy.deepcopy(work),
                            "finish": copy.deepcopy(finish),
                            "safe_sequence": list(safe_sequence),
                            "need": copy.deepcopy(need[i]),
                            "comparisons": comparisons,
                            "can_finish": True,
                            "released_allocation": allocated_to_process,
                            "description": (
                                f"{process_names[i]} can complete! Its Need {need[i]} ≤ Work {work_before} "
                                f"({', '.join(f'{c['resource']}: {c['need']} ≤ {c['work']}' for c in comparisons)}). "
                                f"{process_names[i]} executes and safely releases allocation {allocated_to_process}. "
                                f"Updated Work = {work}. Safe Sequence: <{', '.join(safe_sequence)}>."
                            )
                        })
                    else:
                        steps.append({
                            "step_id": step_counter,
                            "type": "PROCESS_INELIGIBLE",
                            "process_id": i,
                            "process_name": process_names[i],
                            "work": copy.deepcopy(work),
                            "finish": copy.deepcopy(finish),
                            "safe_sequence": list(safe_sequence),
                            "need": copy.deepcopy(need[i]),
                            "comparisons": comparisons,
                            "can_finish": False,
                            "released_allocation": None,
                            "description": (
                                f"{process_names[i]} CANNOT complete yet: Need {need[i]} exceeds Work {work}. "
                                f"Insufficient: {[c['resource'] for c in comparisons if not c['satisfied']]}. "
                                f"{process_names[i]} must wait for other processes to finish."
                            )
                        })

            if not allocated_in_this_round or all(finish):
                break
            round_num += 1

        is_safe = all(finish)
        step_counter += 1
        if is_safe:
            steps.append({
                "step_id": step_counter,
                "type": "TERMINATION_SAFE",
                "process_id": None,
                "process_name": None,
                "work": copy.deepcopy(work),
                "finish": copy.deepcopy(finish),
                "safe_sequence": list(safe_sequence),
                "is_safe": True,
                "description": f"SAFE STATE REACHED: All {n} processes can complete without deadlock. Complete Safe Sequence: <{' -> '.join(safe_sequence)}>."
            })
        else:
            unfinished = [process_names[i] for i in range(n) if not finish[i]]
            steps.append({
                "step_id": step_counter,
                "type": "TERMINATION_UNSAFE",
                "process_id": None,
                "process_name": None,
                "work": copy.deepcopy(work),
                "finish": copy.deepcopy(finish),
                "safe_sequence": list(safe_sequence),
                "is_safe": False,
                "unfinished": unfinished,
                "description": (
                    f"UNSAFE STATE DETECTED: Deadlock cannot be avoided! With current Work {work}, "
                    f"no remaining unfinished process ({', '.join(unfinished)}) has Need ≤ Work. "
                    f"System cannot guarantee safe completion for all processes."
                )
            })

        return {
            "is_safe": is_safe,
            "safe_sequence": safe_sequence,
            "steps": steps,
            "total_steps": len(steps)
        }

    def request_resources(self, process_id: int, request: List[int]) -> Dict[str, Any]:
        """
        Implements Banker's Resource-Request Algorithm protected by threading.Lock()
        """
        with self.lock:
            p = process_id
            if not (0 <= p < self.num_processes):
                return {"status": "ERROR", "message": f"Invalid process index {p}"}
            if len(request) != self.num_resources:
                return {"status": "ERROR", "message": f"Request vector must contain {self.num_resources} values"}

            # Step 1: Validate Request <= Need
            for r in range(self.num_resources):
                if request[r] < 0:
                    return {"status": "ERROR", "message": "Request values cannot be negative"}
                if request[r] > self.need_matrix[p][r]:
                    return {
                        "status": "ERROR",
                        "message": (
                            f"Error: {self.process_names[p]} requested {request[r]} units of {self.resource_names[r]}, "
                            f"which exceeds its maximum declared need ({self.need_matrix[p][r]}). Process exceeded maximum claim!"
                        )
                    }

            # Step 2: Validate Request <= Available
            for r in range(self.num_resources):
                if request[r] > self.available_vector[r]:
                    return {
                        "status": "WAIT",
                        "message": (
                            f"{self.process_names[p]} must WAIT: Requested {request[r]} units of {self.resource_names[r]}, "
                            f"but only {self.available_vector[r]} units are currently Available. Request cannot be granted at this time."
                        ),
                        "state": self.get_state_unlocked()
                    }

            # Step 3: Pretend to allocate
            for r in range(self.num_resources):
                self.available_vector[r] -= request[r]
                self.allocation_matrix[p][r] += request[r]
                self.need_matrix[p][r] -= request[r]

            # Step 4: Run safety test on tentative state
            safety_res = self._check_safety_internal(self.available_vector, self.allocation_matrix, self.need_matrix)

            if safety_res["is_safe"]:
                state_snapshot = self.get_state_unlocked()
                return {
                    "status": "APPROVED",
                    "message": (
                        f"Request APPROVED: Resources allocated to {self.process_names[p]}. "
                        f"System remains in a SAFE state. Valid safe sequence: [{' -> '.join(safety_res['safe_sequence'])}]."
                    ),
                    "is_safe": True,
                    "safe_sequence": safety_res["safe_sequence"],
                    "safety_steps": safety_res["steps"],
                    "state": state_snapshot
                }
            else:
                # State is unsafe! Roll back tentative allocation
                for r in range(self.num_resources):
                    self.available_vector[r] += request[r]
                    self.allocation_matrix[p][r] -= request[r]
                    self.need_matrix[p][r] += request[r]

                state_snapshot = self.get_state_unlocked()
                return {
                    "status": "DENIED_UNSAFE",
                    "message": (
                        f"Request DENIED: Allocating requested resources to {self.process_names[p]} would leave the system in an "
                        f"UNSAFE STATE (Deadlock risk). Banker's Algorithm has safely rolled back the allocation to protect the system."
                    ),
                    "is_safe": False,
                    "safety_steps": safety_res["steps"],
                    "state": state_snapshot
                }

    def release_resources(self, process_id: int, release: List[int]) -> Dict[str, Any]:
        """
        Implements Resource Release Algorithm protected by threading.Lock()
        """
        with self.lock:
            p = process_id
            if not (0 <= p < self.num_processes):
                return {"status": "ERROR", "message": f"Invalid process index {p}"}
            if len(release) != self.num_resources:
                return {"status": "ERROR", "message": f"Release vector must have {self.num_resources} values"}

            if all(r == 0 for r in release):
                return {"status": "ERROR", "message": "Cannot release zero resources. Please specify at least one quantity greater than 0."}

            for r in range(self.num_resources):
                if release[r] < 0:
                    return {"status": "ERROR", "message": "Release values cannot be negative"}
                if release[r] > self.allocation_matrix[p][r]:
                    return {
                        "status": "ERROR",
                        "message": (
                            f"Error: {self.process_names[p]} cannot release {release[r]} units of {self.resource_names[r]} "
                            f"because it currently holds only {self.allocation_matrix[p][r]} units."
                        )
                    }

            for r in range(self.num_resources):
                self.allocation_matrix[p][r] -= release[r]
                self.available_vector[r] += release[r]
                self.need_matrix[p][r] += release[r]

            return {
                "status": "SUCCESS",
                "message": f"Resources successfully released by {self.process_names[p]}. Updated Available: {self.available_vector}.",
                "state": self.get_state_unlocked()
            }

    def _check_safety_internal(self, available, allocation, need) -> Dict[str, Any]:
        """Internal helper for running safety check when lock is already held."""
        n = self.num_processes
        m = self.num_resources
        work = copy.deepcopy(available)
        finish = [False] * n
        safe_sequence = []
        steps = []
        step_counter = 0

        while True:
            allocated = False
            for i in range(n):
                if not finish[i]:
                    can_finish = True
                    comparisons = []
                    for j in range(m):
                        comp = {
                            "resource": self.resource_names[j],
                            "need": need[i][j],
                            "work": work[j],
                            "satisfied": need[i][j] <= work[j]
                        }
                        comparisons.append(comp)
                        if need[i][j] > work[j]:
                            can_finish = False

                    if can_finish:
                        for j in range(m):
                            work[j] += allocation[i][j]
                        finish[i] = True
                        safe_sequence.append(self.process_names[i])
                        allocated = True
                        step_counter += 1
                        steps.append({
                            "step_id": step_counter,
                            "process_name": self.process_names[i],
                            "can_finish": True,
                            "comparisons": comparisons,
                            "work": copy.deepcopy(work)
                        })

            if not allocated or all(finish):
                break

        return {
            "is_safe": all(finish),
            "safe_sequence": safe_sequence,
            "steps": steps
        }
