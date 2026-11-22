"""
Automated Verification Suite for Visual Implementation of Banker's Algorithm
Tests all requirements, mathematical correctness, multithreading, and mutex synchronization.
"""

import os
os.environ['NO_PROXY'] = 'localhost,127.0.0.1'
os.environ['no_proxy'] = 'localhost,127.0.0.1'

from app import app
import json

client = app.test_client()

def test_static_and_index():
    print("\n--- TEST 1: Static Assets and Index Page ---")
    res = client.get('/')
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    html = res.data.decode('utf-8')
    assert "Visual Implementation of Banker's Algorithm" in html
    assert "System Configuration" in html
    assert "Resource Allocation Dashboard" in html
    assert "Banker's Algorithm Visualization" in html
    assert "MULTITHREADING" in html
    assert "RACE CONDITION PREVENTION" in html
    assert "Resource Request &amp; Release" in html or "Resource Request & Release" in html

    css_res = client.get('/static/css/style.css')
    assert css_res.status_code == 200, f"Expected CSS 200, got {css_res.status_code}"
    
    js_res = client.get('/static/js/app.js')
    assert js_res.status_code == 200, f"Expected JS 200, got {js_res.status_code}"
    print("PASS: Index HTML, CSS, and JS all load correctly.")

def test_initial_state_and_matrices():
    print("\n--- TEST 2: Initial State & Banker's Formulas ---")
    res = client.get('/api/state')
    assert res.status_code == 200
    state = res.get_json()
    assert state['num_processes'] == 5
    assert state['num_resources'] == 3
    assert state['total_resources'] == [10, 5, 7]
    assert state['available_vector'] == [3, 3, 2]
    
    # Verify Need = Max - Allocation for each cell
    for p in range(5):
        for r in range(3):
            expected_need = state['max_matrix'][p][r] - state['allocation_matrix'][p][r]
            assert state['need_matrix'][p][r] == expected_need, f"Need calculation mismatch at P{p}, R{r}"
    
    # Verify Available = Total - Sum(Allocations)
    for r in range(3):
        alloc_sum = sum(state['allocation_matrix'][p][r] for p in range(5))
        assert state['available_vector'][r] == state['total_resources'][r] - alloc_sum
    print("PASS: Formulas Need = Max - Alloc and Available = Total - Allocations validated mathematically.")

def test_safety_algorithm_trace():
    print("\n--- TEST 3: Banker's Safety Algorithm Trace ---")
    res = client.get('/api/safety-trace')
    assert res.status_code == 200
    trace = res.get_json()
    assert trace['is_safe'] is True
    # Classic textbook sequence: P1 -> P3 -> P4 -> P0 -> P2
    expected_sequence = ['P1', 'P3', 'P4', 'P0', 'P2']
    assert trace['safe_sequence'] == expected_sequence, f"Expected {expected_sequence}, got {trace['safe_sequence']}"
    assert len(trace['steps']) > 0
    print(f"PASS: Safety algorithm correctly generated textbook sequence: <{' -> '.join(trace['safe_sequence'])}>")
    print(f"PASS: Trace contains {len(trace['steps'])} step-by-step educational breakdown steps.")

def test_request_and_release():
    print("\n--- TEST 4: Resource Request & Release Algorithm ---")
    # 1. Valid safe request: P1 requests [1, 0, 2]
    req1 = client.post('/api/request', json={'process_id': 1, 'request': [1, 0, 2]}).get_json()
    assert req1['status'] == 'APPROVED', f"Expected APPROVED, got {req1['status']}"
    assert req1['state']['available_vector'] == [2, 3, 0]
    print("PASS: Safe request P1: [1, 0, 2] approved, Available updated to [2, 3, 0].")

    # 2. Release resources back: P1 releases [1, 0, 2]
    rel1 = client.post('/api/release', json={'process_id': 1, 'release': [1, 0, 2]}).get_json()
    assert rel1['status'] == 'SUCCESS', f"Expected SUCCESS, got {rel1['status']}"
    assert rel1['state']['available_vector'] == [3, 3, 2]
    print("PASS: Resource release P1: [1, 0, 2] succeeded, Available restored to [3, 3, 2].")

    # 3. Unsafe request: P0 requests [0, 0, 2] -> Would lead to deadlock, must rollback
    req_unsafe = client.post('/api/request', json={'process_id': 0, 'request': [0, 0, 2]}).get_json()
    assert req_unsafe['status'] == 'DENIED_UNSAFE', f"Expected DENIED_UNSAFE, got {req_unsafe['status']}"
    assert req_unsafe['state']['available_vector'] == [3, 3, 2]  # Confirms rollback
    print("PASS: Unsafe request P0: [0, 0, 2] safely denied and rolled back to maintain safe state.")

    # 4. Wait request: P4 requests [4, 3, 1] when available is [3, 3, 2] -> 4 > 3, must wait!
    req_wait = client.post('/api/request', json={'process_id': 4, 'request': [4, 3, 1]}).get_json()
    assert req_wait['status'] == 'WAIT', f"Expected WAIT, got {req_wait['status']}"
    print(f"PASS: Request exceeding current availability correctly flagged as WAIT: {req_wait['message']}")

    # 5. Exceeded claim: P0 requests [4, 4, 4] -> exceeds maximum claim
    req_err = client.post('/api/request', json={'process_id': 0, 'request': [4, 4, 4]}).get_json()
    assert req_err['status'] == 'ERROR'
    print("PASS: Request exceeding max claim correctly returned ERROR.")

def test_multithreading_execution():
    print("\n--- TEST 5: Real Python Multithreading (T_i -> P_i) ---")
    res = client.post('/api/threads/run')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['num_threads'] == 5
    assert len(data['mappings']) == 5
    assert len(data['timeline']) >= 20
    # Check that real thread IDs were captured
    tids = {evt['thread_id'] for evt in data['timeline'] if evt['thread_id'] is not None}
    assert len(tids) >= 1, "Expected real thread IDs from threading.get_ident()"
    print(f"PASS: Real Python threading.Thread workload ran with {len(data['timeline'])} timeline events across {len(tids)} thread workers.")

def test_race_condition_prevention():
    print("\n--- TEST 6: Race Condition Prevention with Mutex Lock ---")
    # Without mutex
    hazard = client.post('/api/race-condition/simulate', json={'use_mutex': False}).get_json()
    assert hazard['has_race_condition'] is True
    assert hazard['final_value'] == -2, f"Expected -2 corrupted value, got {hazard['final_value']}"
    print("PASS: Unsynchronized execution correctly exposed race condition hazard (Final Available: -2).")

    # With mutex
    safe_mutex = client.post('/api/race-condition/simulate', json={'use_mutex': True}).get_json()
    assert safe_mutex['has_race_condition'] is False
    assert safe_mutex['final_value'] == 2, f"Expected 2 preserved value, got {safe_mutex['final_value']}"
    print("PASS: Mutex-protected execution (threading.Lock) cleanly prevented race condition (Final Available: 2).")

def test_preset_deadlock():
    print("\n--- TEST 7: Deadlock / Unsafe Preset ---")
    res = client.post('/api/presets/deadlock')
    assert res.status_code == 200
    trace = client.get('/api/safety-trace').get_json()
    assert trace['is_safe'] is False
    print("PASS: Deadlock preset correctly detected UNSAFE STATE.")
    
    # Restore Silberschatz preset
    res_restore = client.post('/api/presets/silberschatz')
    assert res_restore.status_code == 200
    trace_restore = client.get('/api/safety-trace').get_json()
    assert trace_restore['is_safe'] is True
    print("PASS: Silberschatz preset cleanly restored to SAFE STATE.")

if __name__ == '__main__':
    test_static_and_index()
    test_initial_state_and_matrices()
    test_safety_algorithm_trace()
    test_request_and_release()
    test_multithreading_execution()
    test_race_condition_prevention()
    test_preset_deadlock()
    print("\n==========================================")
    print("ALL 7 VERIFICATION TEST SUITES PASSED 100%!")
    print("==========================================")
