"""
Flask Application for Visual Implementation of Banker's Algorithm
Serves REST API and single-page educational simulator.
"""

from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import copy
from banker import BankersAlgorithm
from threads_manager import ProcessThreadSimulation

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["JSON_SORT_KEYS"] = False

# Core system instances
banker = BankersAlgorithm()
thread_sim = ProcessThreadSimulation(banker)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/state", methods=["GET"])
def get_state():
    return jsonify(banker.get_state())


@app.route("/api/initialize", methods=["POST"])
def initialize():
    data = request.get_json() or {}
    try:
        num_processes = int(data.get("num_processes", 5))
        num_resources = int(data.get("num_resources", 3))
        total_resources = [int(x) for x in data.get("total_resources", [])]
        max_matrix = [[int(x) for x in row] for row in data.get("max_matrix", [])]
        allocation_matrix = data.get("allocation_matrix")
        if allocation_matrix is not None:
            allocation_matrix = [[int(x) for x in row] for row in allocation_matrix]

        result = banker.initialize_system(
            num_processes=num_processes,
            num_resources=num_resources,
            total_resources=total_resources,
            max_matrix=max_matrix,
            allocation_matrix=allocation_matrix
        )

        if result["success"]:
            thread_sim.log_event("SYSTEM", "INITIALIZE", f"System initialized with {num_processes} processes and {num_resources} resources.")
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({"success": False, "error": f"Invalid configuration payload: {str(e)}"}), 400


@app.route("/api/presets/<name>", methods=["POST"])
def load_preset(name):
    if name == "silberschatz":
        # Classic textbook example
        num_processes = 5
        num_resources = 3
        total_resources = [10, 5, 7]
        allocation_matrix = [
            [0, 1, 0],
            [2, 0, 0],
            [3, 0, 2],
            [2, 1, 1],
            [0, 0, 2]
        ]
        max_matrix = [
            [7, 5, 3],
            [3, 2, 2],
            [9, 0, 2],
            [2, 2, 2],
            [4, 3, 3]
        ]
        result = banker.initialize_system(num_processes, num_resources, total_resources, max_matrix, allocation_matrix)
        thread_sim.log_event("SYSTEM", "PRESET_LOAD", "Loaded classic Silberschatz textbook preset (Safe state).")
        return jsonify(result)

    elif name in ["unsafe", "deadlock"]:
        # Crafted unsafe/deadlock state
        # Total = [10, 5, 7]
        # Allocations hold almost all resources, leaving Available = [1, 0, 0]
        # While every process needs at least [2, 1, 1]
        num_processes = 4
        num_resources = 3
        total_resources = [10, 5, 7]
        allocation_matrix = [
            [3, 2, 2],
            [2, 1, 2],
            [2, 1, 1],
            [2, 1, 2]
        ]
        max_matrix = [
            [5, 4, 4],
            [4, 3, 4],
            [4, 3, 3],
            [4, 3, 4]
        ]
        result = banker.initialize_system(num_processes, num_resources, total_resources, max_matrix, allocation_matrix)
        thread_sim.log_event("SYSTEM", "PRESET_LOAD", "Loaded Unsafe/Deadlock scenario preset.")
        return jsonify(result)

    elif name == "simple":
        # 3 processes, 2 resources for fast classroom walkthrough
        num_processes = 3
        num_resources = 2
        total_resources = [9, 6]
        allocation_matrix = [
            [2, 1],
            [3, 2],
            [2, 1]
        ]
        max_matrix = [
            [5, 3],
            [6, 4],
            [4, 2]
        ]
        result = banker.initialize_system(num_processes, num_resources, total_resources, max_matrix, allocation_matrix)
        thread_sim.log_event("SYSTEM", "PRESET_LOAD", "Loaded 3-Process 2-Resource Simple preset.")
        return jsonify(result)

    return jsonify({"success": False, "error": f"Unknown preset '{name}'"}), 404


@app.route("/api/safety-trace", methods=["GET"])
def get_safety_trace():
    trace = banker.generate_safety_trace()
    return jsonify(trace)


@app.route("/api/request", methods=["POST"])
def request_resources():
    data = request.get_json() or {}
    try:
        process_id = int(data.get("process_id"))
        request_vector = [int(x) for x in data.get("request", [])]
        result = banker.request_resources(process_id, request_vector)
        
        status = result.get("status")
        msg = result.get("message", "")
        p_name = banker.process_names[process_id] if 0 <= process_id < banker.num_processes else f"P{process_id}"
        thread_sim.log_event(p_name, f"REQUEST_{status}", msg)

        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "ERROR", "message": f"Request failed: {str(e)}"}), 400


@app.route("/api/release", methods=["POST"])
def release_resources():
    data = request.get_json() or {}
    try:
        process_id = int(data.get("process_id"))
        release_vector = [int(x) for x in data.get("release", [])]
        result = banker.release_resources(process_id, release_vector)

        status = result.get("status")
        msg = result.get("message", "")
        p_name = banker.process_names[process_id] if 0 <= process_id < banker.num_processes else f"P{process_id}"
        thread_sim.log_event(p_name, f"RELEASE_{status}", msg)

        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "ERROR", "message": f"Release failed: {str(e)}"}), 400


@app.route("/api/threads/run", methods=["POST"])
def run_threads():
    res = thread_sim.run_multithreaded_workload()
    return jsonify(res)


@app.route("/api/race-condition/simulate", methods=["POST"])
def race_condition_simulate():
    data = request.get_json() or {}
    use_mutex = bool(data.get("use_mutex", True))
    res = thread_sim.simulate_race_condition_scenario(use_mutex=use_mutex)
    return jsonify(res)


@app.route("/api/logs", methods=["GET"])
def get_logs():
    return jsonify({"logs": thread_sim.execution_logs})


@app.route("/api/logs/clear", methods=["POST"])
def clear_logs():
    thread_sim.execution_logs.clear()
    return jsonify({"success": True})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
