/**
 * VISUAL IMPLEMENTATION OF BANKER'S ALGORITHM
 * Interactive Operating Systems Educational Simulator
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const AppState = {
    system: null,          // Latest state from /api/state
    safetyTrace: null,     // Array of safety algorithm steps
    safetyStepIndex: 0,
    safetyTimer: null,
    
    // Multithreading state
    threadsTimeline: null,
    threadsStepIndex: 0,
    threadsTimer: null,
    
    // Race condition state
    raceTimeline: null,
    raceStepIndex: 0,
    raceTimer: null,
    raceMode: 'with_mutex', // 'with_mutex' or 'without_mutex'
    
    currentSection: 'config'
  };

  // DOM Elements Cache
  const DOM = {
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    navItems: document.querySelectorAll('.nav-item'),
    sections: document.querySelectorAll('.view-section'),
    stepDots: document.querySelectorAll('.step-dot'),
    currentSectionTitle: document.getElementById('currentSectionTitle'),
    sidebarStatusDot: document.getElementById('sidebarStatusDot'),
    sidebarStatusText: document.getElementById('sidebarStatusText'),
    sidebarMetaText: document.getElementById('sidebarMetaText'),
    quickResetBtn: document.getElementById('quickResetBtn'),
    
    // Section 1: Config
    numProcessesInput: document.getElementById('numProcessesInput'),
    numResourcesInput: document.getElementById('numResourcesInput'),
    generateFieldsBtn: document.getElementById('generateFieldsBtn'),
    totalResourcesContainer: document.getElementById('totalResourcesContainer'),
    configMaxTable: document.getElementById('configMaxTable'),
    configAllocTable: document.getElementById('configAllocTable'),
    initSystemBtn: document.getElementById('initSystemBtn'),
    goToDashboardBtn: document.getElementById('goToDashboardBtn'),
    configValidationAlert: document.getElementById('configValidationAlert'),
    presetSilberschatzBtn: document.getElementById('presetSilberschatzBtn'),
    presetDeadlockBtn: document.getElementById('presetDeadlockBtn'),
    presetSimpleBtn: document.getElementById('presetSimpleBtn'),
    
    // Section 2: Dashboard
    dashTotalSummary: document.getElementById('dashTotalSummary'),
    dashAllocSummary: document.getElementById('dashAllocSummary'),
    dashAvailSummary: document.getElementById('dashAvailSummary'),
    tableDashAvailable: document.getElementById('tableDashAvailable'),
    tableDashNeed: document.getElementById('tableDashNeed'),
    tableDashAllocation: document.getElementById('tableDashAllocation'),
    tableDashMax: document.getElementById('tableDashMax'),
    dashToSafetyBtn: document.getElementById('dashToSafetyBtn'),
    
    // Section 3: Banker's Safety
    safetyWorkChips: document.getElementById('safetyWorkChips'),
    safetyFinishChips: document.getElementById('safetyFinishChips'),
    safetySequenceChips: document.getElementById('safetySequenceChips'),
    safetyPrevBtn: document.getElementById('safetyPrevBtn'),
    safetyNextBtn: document.getElementById('safetyNextBtn'),
    safetyPlayBtn: document.getElementById('safetyPlayBtn'),
    safetyRestartBtn: document.getElementById('safetyRestartBtn'),
    safetyStepCounter: document.getElementById('safetyStepCounter'),
    safetySpeedSelect: document.getElementById('safetySpeedSelect'),
    inspectorHeader: document.getElementById('inspectorHeader'),
    inspectorContent: document.getElementById('inspectorContent'),
    safetyNarrativeText: document.getElementById('safetyNarrativeText'),
    safetyFinalBanner: document.getElementById('safetyFinalBanner'),
    safetyToThreadsBtn: document.getElementById('safetyToThreadsBtn'),
    safetyDeadlockResolveBtn: document.getElementById('safetyDeadlockResolveBtn'),
    
    // Section 4: Multithreading
    threadsDeadlockAlert: document.getElementById('threadsDeadlockAlert'),
    runThreadsBtn: document.getElementById('runThreadsBtn'),
    threadsResetBtn: document.getElementById('threadsResetBtn'),
    threadsStepperCard: document.getElementById('threadsStepperCard'),
    threadsPrevBtn: document.getElementById('threadsPrevBtn'),
    threadsNextBtn: document.getElementById('threadsNextBtn'),
    threadsPlayBtn: document.getElementById('threadsPlayBtn'),
    threadsTimelineRestartBtn: document.getElementById('threadsTimelineRestartBtn'),
    threadsStepCounter: document.getElementById('threadsStepCounter'),
    threadsSpeedSelect: document.getElementById('threadsSpeedSelect'),
    threadsActiveEventTid: document.getElementById('threadsActiveEventTid'),
    threadsMappingContainer: document.getElementById('threadsMappingContainer'),
    threadCurrentEventBox: document.getElementById('threadCurrentEventBox'),
    threadsLiveStatusCard: document.getElementById('threadsLiveStatusCard'),
    threadsLiveAvailableChips: document.getElementById('threadsLiveAvailableChips'),
    threadsMutexBadge: document.getElementById('threadsMutexBadge'),
    threadsSafeSequenceDisplay: document.getElementById('threadsSafeSequenceDisplay'),
    threadsRunTimestampBadge: document.getElementById('threadsRunTimestampBadge'),
    threadsToRaceBtn: document.getElementById('threadsToRaceBtn'),
    
    // Section 5: Race Condition
    tabWithMutex: document.getElementById('tabWithMutex'),
    tabWithoutMutex: document.getElementById('tabWithoutMutex'),
    racePrevBtn: document.getElementById('racePrevBtn'),
    raceNextBtn: document.getElementById('raceNextBtn'),
    racePlayBtn: document.getElementById('racePlayBtn'),
    raceRestartBtn: document.getElementById('raceRestartBtn'),
    raceRerunBtn: document.getElementById('raceRerunBtn'),
    raceStepCounter: document.getElementById('raceStepCounter'),
    raceRunTimestampBadge: document.getElementById('raceRunTimestampBadge'),
    raceSpeedSelect: document.getElementById('raceSpeedSelect'),
    raceModeBadge: document.getElementById('raceModeBadge'),
    agentT0State: document.getElementById('agentT0State'),
    agentT1State: document.getElementById('agentT1State'),
    agentT0: document.getElementById('agentT0'),
    agentT1: document.getElementById('agentT1'),
    raceQueueBox: document.getElementById('raceQueueBox'),
    raceLockGate: document.getElementById('raceLockGate'),
    raceLockLabel: document.getElementById('raceLockLabel'),
    raceLockHolder: document.getElementById('raceLockHolder'),
    raceCriticalSection: document.getElementById('raceCriticalSection'),
    raceCsOccupant: document.getElementById('raceCsOccupant'),
    raceSharedVal: document.getElementById('raceSharedVal'),
    raceExplanationText: document.getElementById('raceExplanationText'),
    raceToRequestBtn: document.getElementById('raceToRequestBtn'),
    
    // Section 6: Request & Release
    requestProcessSelect: document.getElementById('requestProcessSelect'),
    requestInputsContainer: document.getElementById('requestInputsContainer'),
    submitRequestBtn: document.getElementById('submitRequestBtn'),
    chipSafeReq: document.getElementById('chipSafeReq'),
    chipUnsafeReq: document.getElementById('chipUnsafeReq'),
    chipWaitReq: document.getElementById('chipWaitReq'),
    chipExceedNeed: document.getElementById('chipExceedNeed'),
    chipResetBaseline: document.getElementById('chipResetBaseline'),
    pipeStep1: document.getElementById('pipeStep1'),
    pipeStep2: document.getElementById('pipeStep2'),
    pipeStep3: document.getElementById('pipeStep3'),
    pipeStep4: document.getElementById('pipeStep4'),
    releaseProcessSelect: document.getElementById('releaseProcessSelect'),
    releaseInputsContainer: document.getElementById('releaseInputsContainer'),
    submitReleaseBtn: document.getElementById('submitReleaseBtn'),
    selectedProcStatusRow: document.getElementById('selectedProcStatusRow'),
    transactionResultCard: document.getElementById('transactionResultCard'),
    transactionResultTitle: document.getElementById('transactionResultTitle'),
    transactionBadge: document.getElementById('transactionBadge'),
    transactionResultDesc: document.getElementById('transactionResultDesc'),
    
    // Logs Drawer
    logsDrawer: document.getElementById('logsDrawer'),
    toggleLogsDrawerBtn: document.getElementById('toggleLogsDrawerBtn'),
    closeLogsDrawerBtn: document.getElementById('closeLogsDrawerBtn'),
    clearLogsBtn: document.getElementById('clearLogsBtn'),
    logsTableBody: document.getElementById('logsTableBody')
  };

  // Section titles mapping
  const SECTION_TITLES = {
    'config': 'System Configuration',
    'dashboard': 'Resource Allocation Dashboard',
    'safety': "Banker's Algorithm Visualization",
    'multithreading': 'Multithreading Architecture',
    'race-condition': 'Race Condition Prevention',
    'request-release': 'Resource Request & Release'
  };

  /* ==========================================================================
     UTILITY FUNCTIONS
     ========================================================================== */

  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     API CLIENT FUNCTIONS
     ========================================================================== */

  async function fetchState() {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('Failed to fetch system state');
      const data = await res.json();
      AppState.system = data;
      updateSidebarMeta();
      renderDashboardMatrices();
      renderRequestReleaseControls();
      renderThreadsArchitecture();
      return data;
    } catch (err) {
      console.error('Error in fetchState:', err);
    }
  }

  async function fetchSafetyTrace() {
    try {
      const res = await fetch('/api/safety-trace');
      if (!res.ok) throw new Error('Failed to fetch safety trace');
      const data = await res.json();
      AppState.safetyTrace = data.steps;
      AppState.safetyStepIndex = 0;
      updateSafetyStepperControls();
      renderCurrentSafetyStep();
      return data;
    } catch (err) {
      console.error('Error in fetchSafetyTrace:', err);
    }
  }

  async function fetchLogs() {
    try {
      const res = await fetch('/api/logs');
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      renderLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  }

  /* ==========================================================================
     NAVIGATION & UI HELPERS
     ========================================================================== */

  function navigateTo(sectionKey) {
    if (!SECTION_TITLES[sectionKey]) return;
    AppState.currentSection = sectionKey;

    // Update nav items
    DOM.navItems.forEach(item => {
      if (item.dataset.section === sectionKey) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update view sections
    DOM.sections.forEach(sec => {
      if (sec.id === `section-${sectionKey}`) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    // Update stepper dots
    const sectionKeys = Object.keys(SECTION_TITLES);
    const activeIdx = sectionKeys.indexOf(sectionKey);
    DOM.stepDots.forEach((dot, idx) => {
      dot.classList.remove('active', 'completed');
      if (idx === activeIdx) {
        dot.classList.add('active');
      } else if (idx < activeIdx) {
        dot.classList.add('completed');
      }
    });

    // Update topbar title
    DOM.currentSectionTitle.textContent = SECTION_TITLES[sectionKey];

    // Scroll to top of viewport
    document.querySelector('.viewport').scrollTop = 0;

    // Trigger section-specific refreshes
    if (sectionKey === 'dashboard') {
      renderDashboardMatrices();
    } else if (sectionKey === 'safety') {
      if (!AppState.safetyTrace) {
        fetchSafetyTrace();
      }
    } else if (sectionKey === 'multithreading') {
      renderThreadsArchitecture();
    } else if (sectionKey === 'race-condition') {
      loadRaceSimulation(AppState.raceMode === 'with_mutex');
    } else if (sectionKey === 'request-release') {
      renderRequestReleaseControls();
    }
  }

  function setSidebarStatus(statusType, metaText) {
    if (statusType === 'safe') {
      DOM.sidebarStatusDot.className = 'status-dot safe';
      DOM.sidebarStatusText.textContent = 'State: Safe';
    } else if (statusType === 'unsafe' || statusType === 'deadlock') {
      DOM.sidebarStatusDot.className = 'status-dot unsafe';
      DOM.sidebarStatusText.textContent = 'State: Unsafe (Deadlock)';
    } else if (statusType === 'pending' || statusType === 'uncommitted') {
      DOM.sidebarStatusDot.className = 'status-dot warning';
      DOM.sidebarStatusText.textContent = 'State: Pending Init';
    }
    if (metaText !== undefined) {
      DOM.sidebarMetaText.textContent = metaText;
    }
  }

  function markConfigUncommitted() {
    const n = parseInt(DOM.numProcessesInput.value, 10) || 5;
    const m = parseInt(DOM.numResourcesInput.value, 10) || 3;
    setSidebarStatus('uncommitted', `${n} Processes | ${m} Resources (Click Initialize)`);
  }

  function updateSidebarMeta() {
    if (!AppState.system) return;
    const { num_processes, num_resources } = AppState.system;
    DOM.sidebarMetaText.textContent = `${num_processes} Processes | ${num_resources} Resources`;
  }

  /* ==========================================================================
     SECTION 1: SYSTEM CONFIGURATION
     ========================================================================== */

  function renderConfigurationFields() {
    const n = parseInt(DOM.numProcessesInput.value, 10);
    const m = parseInt(DOM.numResourcesInput.value, 10);

    if (isNaN(n) || n < 1 || n > 8 || isNaN(m) || m < 1 || m > 5) {
      alert('Please enter valid dimensions (Processes: 1-8, Resources: 1-5)');
      return;
    }

    // 1. Total resources row
    DOM.totalResourcesContainer.innerHTML = '';
    for (let r = 0; r < m; r++) {
      const cell = document.createElement('div');
      cell.className = 'vector-input-cell';
      cell.innerHTML = `
        <span class="vector-cell-label">R${r}</span>
        <input type="number" id="inputTotal_R${r}" min="0" max="99" value="10" class="form-control">
      `;
      DOM.totalResourcesContainer.appendChild(cell);
    }

    // 2. Max Matrix Table
    let maxHtml = '<thead><tr><th class="proc-col">Process</th>';
    for (let r = 0; r < m; r++) {
      maxHtml += `<th>R${r}</th>`;
    }
    maxHtml += '</tr></thead><tbody>';

    for (let p = 0; p < n; p++) {
      maxHtml += `<tr><td class="proc-name">P${p}</td>`;
      for (let r = 0; r < m; r++) {
        maxHtml += `<td><input type="number" id="inputMax_P${p}_R${r}" min="0" max="99" value="3" class="form-control"></td>`;
      }
      maxHtml += '</tr>';
    }
    maxHtml += '</tbody>';
    DOM.configMaxTable.innerHTML = maxHtml;

    // 3. Allocation Matrix Table
    let allocHtml = '<thead><tr><th class="proc-col">Process</th>';
    for (let r = 0; r < m; r++) {
      allocHtml += `<th>R${r}</th>`;
    }
    allocHtml += '</tr></thead><tbody>';

    for (let p = 0; p < n; p++) {
      allocHtml += `<tr><td class="proc-name">P${p}</td>`;
      for (let r = 0; r < m; r++) {
        allocHtml += `<td><input type="number" id="inputAlloc_P${p}_R${r}" min="0" max="99" value="0" class="form-control"></td>`;
      }
      allocHtml += '</tr>';
    }
    allocHtml += '</tbody>';
    DOM.configAllocTable.innerHTML = allocHtml;

    DOM.configValidationAlert.style.display = 'none';
  }

  function populateConfigurationForm(state) {
    DOM.numProcessesInput.value = state.num_processes;
    DOM.numResourcesInput.value = state.num_resources;
    renderConfigurationFields();

    // Populate Totals
    state.total_resources.forEach((val, r) => {
      const input = document.getElementById(`inputTotal_R${r}`);
      if (input) input.value = val;
    });

    // Populate Max
    for (let p = 0; p < state.num_processes; p++) {
      for (let r = 0; r < state.num_resources; r++) {
        const input = document.getElementById(`inputMax_P${p}_R${r}`);
        if (input) input.value = state.max_matrix[p][r];
      }
    }

    // Populate Alloc
    for (let p = 0; p < state.num_processes; p++) {
      for (let r = 0; r < state.num_resources; r++) {
        const input = document.getElementById(`inputAlloc_P${p}_R${r}`);
        if (input) input.value = state.allocation_matrix[p][r];
      }
    }
  }

  async function handleInitializeSubmit() {
    const n = parseInt(DOM.numProcessesInput.value, 10);
    const m = parseInt(DOM.numResourcesInput.value, 10);

    const total_resources = [];
    for (let r = 0; r < m; r++) {
      const val = parseInt(document.getElementById(`inputTotal_R${r}`).value, 10) || 0;
      total_resources.push(val);
    }

    const max_matrix = [];
    for (let p = 0; p < n; p++) {
      const row = [];
      for (let r = 0; r < m; r++) {
        const val = parseInt(document.getElementById(`inputMax_P${p}_R${r}`).value, 10) || 0;
        row.push(val);
      }
      max_matrix.push(row);
    }

    const allocation_matrix = [];
    for (let p = 0; p < n; p++) {
      const row = [];
      for (let r = 0; r < m; r++) {
        const val = parseInt(document.getElementById(`inputAlloc_P${p}_R${r}`).value, 10) || 0;
        row.push(val);
      }
      allocation_matrix.push(row);
    }

    try {
      const res = await fetch('/api/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          num_processes: n,
          num_resources: m,
          total_resources,
          max_matrix,
          allocation_matrix
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showConfigAlert(data.error || 'Initialization validation failed', 'error');
        return;
      }

      showConfigAlert('System initialized successfully with validated matrices!', 'success');
      AppState.system = data.state;
      AppState.safetyTrace = null;
      renderDashboardMatrices();
      renderRequestReleaseControls();
      DOM.goToDashboardBtn.style.display = 'inline-flex';

      // Evaluate safety trace immediately to reflect accurate Safe vs Deadlock status
      const traceData = await fetchSafetyTrace();
      const isDeadlock = traceData && traceData.steps && traceData.steps.length > 0 &&
        traceData.steps[traceData.steps.length - 1].type === 'TERMINATION_UNSAFE';

      if (isDeadlock) {
        setSidebarStatus('unsafe', `${n} Processes | ${m} Resources`);
      } else {
        setSidebarStatus('safe', `${n} Processes | ${m} Resources`);
      }
    } catch (err) {
      showConfigAlert(`Network error: ${err.message}`, 'error');
    }
  }

  function showConfigAlert(msg, type) {
    DOM.configValidationAlert.textContent = msg;
    DOM.configValidationAlert.className = `alert-box ${type}`;
    DOM.configValidationAlert.style.display = 'flex';
  }

  async function loadPreset(presetName) {
    try {
      const res = await fetch(`/api/presets/${presetName}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        AppState.system = data.state;
        AppState.safetyTrace = null;
        populateConfigurationForm(data.state);
        showConfigAlert(`Preset "${presetName}" loaded into form! Click "INITIALIZE SYSTEM" to commit or edit parameters.`, 'info');
        DOM.goToDashboardBtn.style.display = 'inline-flex';
        renderDashboardMatrices();
        renderRequestReleaseControls();
        setSidebarStatus('pending', `${data.state.num_processes} Processes | ${data.state.num_resources} Resources (Click Initialize)`);
      }
    } catch (err) {
      console.error('Error loading preset:', err);
    }
  }

  /* ==========================================================================
     SECTION 2: RESOURCE ALLOCATION DASHBOARD
     ========================================================================== */

  function renderDashboardMatrices() {
    if (!AppState.system) return;
    const {
      num_processes,
      num_resources,
      resource_names,
      process_names,
      total_resources,
      available_vector,
      max_matrix,
      allocation_matrix,
      need_matrix,
      allocated_sums
    } = AppState.system;

    // Summaries
    DOM.dashTotalSummary.textContent = total_resources.map((val, i) => `${resource_names[i]}: ${val}`).join(' | ');
    DOM.dashAllocSummary.textContent = allocated_sums.map((val, i) => `${resource_names[i]}: ${val}`).join(' | ');
    DOM.dashAvailSummary.textContent = available_vector.map((val, i) => `${resource_names[i]}: ${val}`).join(' | ');

    // 1. Available Vector Table
    let availHtml = '<thead><tr>';
    resource_names.forEach(r => { availHtml += `<th>${r}</th>`; });
    availHtml += '</tr></thead><tbody><tr>';
    available_vector.forEach(v => { availHtml += `<td class="value-cell">${v}</td>`; });
    availHtml += '</tr></tbody>';
    DOM.tableDashAvailable.innerHTML = availHtml;

    // Helper to build standard matrix tables
    function buildMatrixTable(matrix, isEditable = false, onChangeFn = null) {
      let html = '<thead><tr><th class="proc-col">Process</th>';
      resource_names.forEach(r => { html += `<th>${r}</th>`; });
      html += '</tr></thead><tbody>';

      for (let p = 0; p < num_processes; p++) {
        html += `<tr><td class="proc-name">${process_names[p]}</td>`;
        for (let r = 0; r < num_resources; r++) {
          const val = matrix[p][r];
          html += `<td class="value-cell">${val}</td>`;
        }
        html += '</tr>';
      }
      html += '</tbody>';
      return html;
    }

    DOM.tableDashNeed.innerHTML = buildMatrixTable(need_matrix);
    DOM.tableDashAllocation.innerHTML = buildMatrixTable(allocation_matrix);
    DOM.tableDashMax.innerHTML = buildMatrixTable(max_matrix);
  }

  /* ==========================================================================
     SECTION 3: BANKER'S ALGORITHM VISUALIZATION
     ========================================================================== */

  function updateSafetyStepperControls() {
    const total = AppState.safetyTrace ? AppState.safetyTrace.length : 0;
    const current = AppState.safetyStepIndex;
    DOM.safetyStepCounter.textContent = `Step ${total === 0 ? 0 : current + 1} of ${total}`;
    DOM.safetyPrevBtn.disabled = current <= 0;
    DOM.safetyNextBtn.disabled = current >= total - 1;
  }

  function renderCurrentSafetyStep() {
    if (!AppState.safetyTrace || AppState.safetyTrace.length === 0) return;
    const step = AppState.safetyTrace[AppState.safetyStepIndex];
    if (!step) return;

    // 1. Render Work Vector Chips
    DOM.safetyWorkChips.innerHTML = '';
    const resNames = AppState.system ? AppState.system.resource_names : ['R0', 'R1', 'R2'];
    step.work.forEach((val, idx) => {
      const chip = document.createElement('div');
      chip.className = 'vector-chip';
      chip.innerHTML = `<span class="v-key">${resNames[idx] || 'R' + idx}:</span><span>${val}</span>`;
      DOM.safetyWorkChips.appendChild(chip);
    });

    // 2. Render Finish Array Chips
    DOM.safetyFinishChips.innerHTML = '';
    const procNames = AppState.system ? AppState.system.process_names : ['P0', 'P1', 'P2', 'P3', 'P4'];
    step.finish.forEach((done, idx) => {
      const isChecking = (step.process_id === idx && !done);
      const chip = document.createElement('div');
      chip.className = `finish-chip ${done ? 'done' : ''} ${isChecking ? 'checking' : ''}`;
      chip.innerHTML = `
        <span>${procNames[idx]}</span>
        <span>:</span>
        <span>${done ? 'True' : 'False'}</span>
      `;
      DOM.safetyFinishChips.appendChild(chip);
    });

    // 3. Render Safe Sequence Chips
    DOM.safetySequenceChips.innerHTML = '';
    if (step.safe_sequence.length === 0) {
      DOM.safetySequenceChips.innerHTML = '<span class="empty-seq-placeholder">No processes completed yet</span>';
    } else {
      step.safe_sequence.forEach((pName, idx) => {
        const node = document.createElement('div');
        node.className = 'seq-node';
        node.textContent = pName;
        DOM.safetySequenceChips.appendChild(node);
        if (idx < step.safe_sequence.length - 1) {
          const arrow = document.createElement('span');
          arrow.className = 'seq-arrow';
          arrow.innerHTML = '&rarr;';
          DOM.safetySequenceChips.appendChild(arrow);
        }
      });
    }

    // 4. Render Inspector Box
    if (step.process_name) {
      DOM.inspectorHeader.textContent = `Evaluation for ${step.process_name}`;
      let compHtml = `
        <div class="comparison-box">
          <div class="comparison-target">Checking Condition: Need[${step.process_name}] &le; Work</div>
      `;
      if (step.comparisons) {
        step.comparisons.forEach(c => {
          const cls = c.satisfied ? 'satisfied' : 'failed';
          const icon = c.satisfied ? '&#10003; (OK)' : '&#10007; (FAIL)';
          compHtml += `
            <div class="comp-row ${cls}">
              <span>${c.resource}: Need ${c.need} &le; Work ${c.work}</span>
              <span>${icon}</span>
            </div>
          `;
        });
      }
      compHtml += '</div>';
      DOM.inspectorContent.innerHTML = compHtml;
    } else {
      DOM.inspectorHeader.textContent = 'Current Evaluation';
      DOM.inspectorContent.innerHTML = `<div class="placeholder-box">${escapeHTML(step.description)}</div>`;
    }

    // 5. Narrative Explanation
    DOM.safetyNarrativeText.textContent = step.description;

    // 6. Outcome Banner if Terminal Step
    if (step.type === 'TERMINATION_SAFE') {
      DOM.safetyFinalBanner.className = 'outcome-banner safe';
      DOM.safetyFinalBanner.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>SAFE STATE: Safe execution sequence exists &lt;${step.safe_sequence.join(' &rarr; ')}&gt;. Deadlock avoided!</span>
      `;
      DOM.safetyFinalBanner.style.display = 'flex';
      DOM.sidebarStatusDot.className = 'status-dot safe';
      DOM.sidebarStatusText.textContent = 'State: Safe';

      DOM.safetyToThreadsBtn.disabled = false;
      DOM.safetyToThreadsBtn.className = 'btn btn-primary';
      DOM.safetyToThreadsBtn.innerHTML = 'NEXT STEP: Multithreading Architecture &rarr;';
      if (DOM.safetyDeadlockResolveBtn) DOM.safetyDeadlockResolveBtn.style.display = 'none';

      DOM.safetyNextBtn.disabled = true;
      DOM.safetyNextBtn.innerHTML = 'Safe Sequence Complete';
    } else if (step.type === 'TERMINATION_UNSAFE') {
      DOM.safetyFinalBanner.className = 'outcome-banner unsafe';
      DOM.safetyFinalBanner.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <div>
          <div><strong>UNSAFE STATE: Deadlock risk detected!</strong> Remaining processes cannot finish.</div>
          <div style="font-size: 12px; font-weight: normal; margin-top: 4px;">Operating Systems rule: Thread execution is blocked because no safe allocation sequence exists.</div>
        </div>
      `;
      DOM.safetyFinalBanner.style.display = 'flex';
      DOM.sidebarStatusDot.className = 'status-dot unsafe';
      DOM.sidebarStatusText.textContent = 'State: Unsafe (Deadlock)';

      // BLOCK proceeding to Multithreading because deadlock was reached!
      DOM.safetyToThreadsBtn.disabled = true;
      DOM.safetyToThreadsBtn.className = 'btn btn-outline';
      DOM.safetyToThreadsBtn.innerHTML = '⛔ Execution Blocked: Deadlock Detected';
      if (DOM.safetyDeadlockResolveBtn) DOM.safetyDeadlockResolveBtn.style.display = 'inline-flex';

      DOM.safetyNextBtn.disabled = true;
      DOM.safetyNextBtn.innerHTML = 'Deadlock Reached (End)';
    } else {
      DOM.safetyFinalBanner.style.display = 'none';
      DOM.safetyToThreadsBtn.disabled = false;
      DOM.safetyToThreadsBtn.className = 'btn btn-primary';
      DOM.safetyToThreadsBtn.innerHTML = 'NEXT STEP: Multithreading Architecture &rarr;';
      if (DOM.safetyDeadlockResolveBtn) DOM.safetyDeadlockResolveBtn.style.display = 'none';
      DOM.safetyNextBtn.innerHTML = `Next Step <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    }

    updateSafetyStepperControls();
  }

  function handleSafetyNext() {
    if (!AppState.safetyTrace) return;
    if (AppState.safetyStepIndex < AppState.safetyTrace.length - 1) {
      AppState.safetyStepIndex++;
      renderCurrentSafetyStep();
    } else {
      stopSafetyAutoPlay();
    }
  }

  function handleSafetyPrev() {
    if (!AppState.safetyTrace) return;
    if (AppState.safetyStepIndex > 0) {
      AppState.safetyStepIndex--;
      renderCurrentSafetyStep();
    }
  }

  function handleSafetyRestart() {
    stopSafetyAutoPlay();
    AppState.safetyStepIndex = 0;
    renderCurrentSafetyStep();
  }

  function toggleSafetyAutoPlay() {
    if (AppState.safetyTimer) {
      stopSafetyAutoPlay();
    } else {
      startSafetyAutoPlay();
    }
  }

  function startSafetyAutoPlay() {
    if (!AppState.safetyTrace) return;
    DOM.safetyPlayBtn.textContent = 'Pause';
    DOM.safetyPlayBtn.classList.replace('btn-secondary', 'btn-primary');
    const speed = parseInt(DOM.safetySpeedSelect ? DOM.safetySpeedSelect.value : 400, 10) || 400;
    if (AppState.safetyTimer) clearInterval(AppState.safetyTimer);
    AppState.safetyTimer = setInterval(() => {
      if (AppState.safetyStepIndex < AppState.safetyTrace.length - 1) {
        handleSafetyNext();
      } else {
        stopSafetyAutoPlay();
      }
    }, speed);
  }

  function stopSafetyAutoPlay() {
    if (AppState.safetyTimer) {
      clearInterval(AppState.safetyTimer);
      AppState.safetyTimer = null;
    }
    DOM.safetyPlayBtn.textContent = 'Auto Play';
    DOM.safetyPlayBtn.classList.replace('btn-primary', 'btn-secondary');
  }

  /* ==========================================================================
     SECTION 4: MULTITHREADING
     ========================================================================== */

  function renderThreadsArchitecture(statuses = {}) {
    if (!AppState.system) return;
    const { num_processes, process_names } = AppState.system;
    DOM.threadsMappingContainer.innerHTML = '';

    const isDeadlock = AppState.safetyTrace && 
      AppState.safetyTrace.length > 0 && 
      AppState.safetyTrace[AppState.safetyTrace.length - 1].type === 'TERMINATION_UNSAFE';

    if (DOM.threadsDeadlockAlert) {
      if (isDeadlock) {
        DOM.threadsDeadlockAlert.style.display = 'flex';
        DOM.runThreadsBtn.disabled = true;
        DOM.runThreadsBtn.textContent = 'Execution Disabled (Deadlock Active)';
      } else {
        DOM.threadsDeadlockAlert.style.display = 'none';
        DOM.runThreadsBtn.disabled = false;
        DOM.runThreadsBtn.textContent = 'Run Real Multi-Threaded Execution';
      }
    }

    for (let i = 0; i < num_processes; i++) {
      const pName = process_names[i];
      const tName = `T${i}`;
      const status = statuses[tName] || 'CREATED';
      const statusClass = `status-${status.toLowerCase()}`;

      const needStr = (AppState.system && AppState.system.need_matrix && AppState.system.need_matrix[i]) 
        ? AppState.system.need_matrix[i].join(', ') 
        : '';
      const allocStr = (AppState.system && AppState.system.allocation_matrix && AppState.system.allocation_matrix[i]) 
        ? AppState.system.allocation_matrix[i].join(', ') 
        : '';

      const row = document.createElement('div');
      row.className = `thread-map-row ${status === 'RUNNING' ? 'active' : ''}`;
      row.id = `threadRow_${tName}`;
      row.innerHTML = `
        <div class="thread-node">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          ${tName}
        </div>
        <div class="connector-arrow">&rarr;</div>
        <div class="process-node">${pName}</div>
        <div class="thread-need-label font-mono" style="font-size: 11.5px; color: var(--text-muted); background: #f8fafc; border: 1px solid var(--border-subtle); padding: 3px 8px; border-radius: 4px;">
          Need: [${needStr}] | Alloc: [${allocStr}]
        </div>
        <span class="thread-status-badge ${statusClass}" id="threadStatusBadge_${tName}">${status}</span>
        <span class="thread-tid-label" id="threadTidLabel_${tName}">Thread Worker</span>
      `;
      DOM.threadsMappingContainer.appendChild(row);
    }
  }

  async function runRealThreadsSimulation() {
    const isDeadlock = AppState.safetyTrace && 
      AppState.safetyTrace.length > 0 && 
      AppState.safetyTrace[AppState.safetyTrace.length - 1].type === 'TERMINATION_UNSAFE';

    if (isDeadlock) {
      alert('Cannot run multithreading: Deadlock detected in Banker state! Please resolve deadlock by loading a safe preset first.');
      return;
    }

    DOM.runThreadsBtn.disabled = true;
    DOM.runThreadsBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
      </svg>
      Spawning Fresh OS Threads...
    `;

    try {
      const res = await fetch('/api/threads/run', { method: 'POST' });
      const data = await res.json();
      DOM.runThreadsBtn.disabled = false;
      DOM.runThreadsBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        ⚡ Spawn Fresh Threads (New TIDs)
      `;

      if (data.success && data.timeline) {
        AppState.threadsTimeline = data.timeline;
        AppState.threadsStepIndex = 0;
        if (DOM.threadsStepperCard) DOM.threadsStepperCard.style.display = 'flex';
        if (DOM.threadsLiveStatusCard) DOM.threadsLiveStatusCard.style.display = 'block';
        renderCurrentThreadStep();
        fetchLogs();
      }
    } catch (err) {
      console.error('Error running threads:', err);
      DOM.runThreadsBtn.disabled = false;
      DOM.runThreadsBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        ⚡ Spawn Fresh Threads (New TIDs)
      `;
    }
  }

  function renderCurrentThreadStep() {
    if (!AppState.threadsTimeline || AppState.threadsTimeline.length === 0) return;
    const evt = AppState.threadsTimeline[AppState.threadsStepIndex];
    if (!evt) return;

    const total = AppState.threadsTimeline.length;
    DOM.threadsStepCounter.textContent = `Step ${AppState.threadsStepIndex + 1} of ${total}`;
    DOM.threadsPrevBtn.disabled = AppState.threadsStepIndex <= 0;
    DOM.threadsNextBtn.disabled = AppState.threadsStepIndex >= total - 1;

    if (DOM.threadsRunTimestampBadge && AppState.threadsTimeline.length > 0) {
      const firstTimestamp = AppState.threadsTimeline[0].timestamp;
      DOM.threadsRunTimestampBadge.textContent = `Recorded at ${firstTimestamp} | Step ${AppState.threadsStepIndex + 1}/${total} | Rewind to replay`;
    }

    DOM.threadsActiveEventTid.textContent = evt.thread_id ? `TID: ${evt.thread_id}` : 'TID: System';
    DOM.threadCurrentEventBox.innerHTML = `
      <strong>[${escapeHTML(evt.timestamp)}] ${escapeHTML(evt.thread_name)} (${escapeHTML(evt.process_name)}):</strong> ${escapeHTML(evt.description)}
    `;

    // 1. Live Available Vector HUD
    if (DOM.threadsLiveAvailableChips && evt.available_vector && AppState.system && AppState.system.resource_names) {
      DOM.threadsLiveAvailableChips.innerHTML = evt.available_vector.map((val, idx) => `
        <div class="vector-chip">
          <span class="chip-label">${AppState.system.resource_names[idx] || 'R' + idx}</span>
          <span class="chip-val font-mono">${val}</span>
        </div>
      `).join('');
    }

    // 2. Shared Mutex Lock State
    if (DOM.threadsMutexBadge) {
      if (evt.mutex_owner) {
        DOM.threadsMutexBadge.innerHTML = `🔒 LOCKED by ${evt.mutex_owner}`;
        DOM.threadsMutexBadge.style.background = '#fef2f2';
        DOM.threadsMutexBadge.style.color = '#b91c1c';
        DOM.threadsMutexBadge.style.borderColor = '#fecaca';
      } else {
        DOM.threadsMutexBadge.innerHTML = `🔓 Mutex Unlocked`;
        DOM.threadsMutexBadge.style.background = '#e0f2fe';
        DOM.threadsMutexBadge.style.color = '#0369a1';
        DOM.threadsMutexBadge.style.borderColor = '#bae6fd';
      }
    }

    // 3. Safe Completion Sequence
    if (DOM.threadsSafeSequenceDisplay) {
      if (evt.completed_order && evt.completed_order.length > 0) {
        DOM.threadsSafeSequenceDisplay.innerHTML = evt.completed_order.map(t => `<span class="seq-tag">${t}</span>`).join(' &rarr; ');
      } else {
        DOM.threadsSafeSequenceDisplay.textContent = 'None completed yet';
      }
    }

    // 4. Update statuses and highlighting on diagram in lock-step
    if (evt.state_snapshot && evt.state_snapshot.thread_statuses) {
      const statuses = evt.state_snapshot.thread_statuses;
      Object.keys(statuses).forEach(tName => {
        const badge = document.getElementById(`threadStatusBadge_${tName}`);
        const row = document.getElementById(`threadRow_${tName}`);
        const st = statuses[tName];
        if (badge) {
          badge.textContent = st;
          badge.className = `thread-status-badge status-${st.toLowerCase()}`;
        }
        if (row) {
          row.classList.remove('active', 'status-row-waiting', 'status-row-completed');
          if (st === 'WAITING') {
            row.classList.add('status-row-waiting');
          } else if (st === 'COMPLETED') {
            row.classList.add('status-row-completed');
          }
          if (tName === evt.thread_name) {
            row.classList.add('active');
          }
        }
      });
    }

    // 5. Update thread IDs on labels
    if (evt.thread_id && evt.thread_name) {
      const tidLabel = document.getElementById(`threadTidLabel_${evt.thread_name}`);
      if (tidLabel) tidLabel.textContent = `TID: ${evt.thread_id}`;
    }
  }

  function handleThreadsNext() {
    if (!AppState.threadsTimeline) return;
    if (AppState.threadsStepIndex < AppState.threadsTimeline.length - 1) {
      AppState.threadsStepIndex++;
      renderCurrentThreadStep();
    } else {
      stopThreadsAutoPlay();
    }
  }

  function handleThreadsPrev() {
    if (!AppState.threadsTimeline) return;
    if (AppState.threadsStepIndex > 0) {
      AppState.threadsStepIndex--;
      renderCurrentThreadStep();
    }
  }

  function handleThreadsRestart() {
    stopThreadsAutoPlay();
    AppState.threadsStepIndex = 0;
    renderCurrentThreadStep();
  }

  function toggleThreadsAutoPlay() {
    if (AppState.threadsTimer) {
      stopThreadsAutoPlay();
    } else {
      startThreadsAutoPlay();
    }
  }

  function startThreadsAutoPlay() {
    DOM.threadsPlayBtn.textContent = 'Pause';
    DOM.threadsPlayBtn.classList.replace('btn-secondary', 'btn-primary');
    const speed = parseInt(DOM.threadsSpeedSelect ? DOM.threadsSpeedSelect.value : 350, 10) || 350;
    if (AppState.threadsTimer) clearInterval(AppState.threadsTimer);
    AppState.threadsTimer = setInterval(() => {
      if (AppState.threadsStepIndex < AppState.threadsTimeline.length - 1) {
        handleThreadsNext();
      } else {
        stopThreadsAutoPlay();
      }
    }, speed);
  }

  function stopThreadsAutoPlay() {
    if (AppState.threadsTimer) {
      clearInterval(AppState.threadsTimer);
      AppState.threadsTimer = null;
    }
    DOM.threadsPlayBtn.textContent = 'Auto Play';
    DOM.threadsPlayBtn.classList.replace('btn-primary', 'btn-secondary');
  }

  /* ==========================================================================
     SECTION 5: RACE CONDITION PREVENTION
     ========================================================================== */

  async function loadRaceSimulation(useMutex) {
    stopRaceAutoPlay();
    try {
      const res = await fetch('/api/race-condition/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ use_mutex: useMutex })
      });
      const data = await res.json();
      AppState.raceTimeline = data.steps;
      AppState.raceStepIndex = 0;
      DOM.raceModeBadge.textContent = useMutex ? 'Mode: With Mutex' : 'Mode: Without Mutex';
      DOM.raceModeBadge.className = `badge ${useMutex ? 'badge-green' : 'badge-red'}`;
      renderCurrentRaceStep();
      fetchLogs(); // Sync to global System Execution History table immediately
    } catch (err) {
      console.error('Error loading race simulation:', err);
    }
  }

  function renderCurrentRaceStep() {
    if (!AppState.raceTimeline || AppState.raceTimeline.length === 0) return;
    const step = AppState.raceTimeline[AppState.raceStepIndex];
    if (!step) return;

    const total = AppState.raceTimeline.length;
    DOM.raceStepCounter.textContent = `Step ${AppState.raceStepIndex + 1} of ${total}`;
    DOM.racePrevBtn.disabled = AppState.raceStepIndex <= 0;
    DOM.raceNextBtn.disabled = AppState.raceStepIndex >= total - 1;

    if (DOM.raceRunTimestampBadge && AppState.raceTimeline.length > 0) {
      const firstTs = AppState.raceTimeline[0].timestamp;
      DOM.raceRunTimestampBadge.textContent = `Run recorded at ${firstTs} | Step ${AppState.raceStepIndex + 1}/${total} | Rewind to replay`;
    }

    // Narrative
    DOM.raceExplanationText.innerHTML = `<strong>[${escapeHTML(step.timestamp)}] ${escapeHTML(step.action)}:</strong> ${escapeHTML(step.description)}`;

    // Shared Value
    DOM.raceSharedVal.textContent = step.shared_available;
    if (step.shared_available < 0) {
      document.querySelector('.shared-resource-box').classList.add('negative');
    } else {
      document.querySelector('.shared-resource-box').classList.remove('negative');
    }

    // Mutex Lock Gate - uses startsWith to avoid 'UNLOCKED' substring match false positive!
    if (step.mutex_status && step.mutex_status.startsWith('LOCKED')) {
      DOM.raceLockGate.className = 'lock-gate-box locked';
      DOM.raceLockLabel.textContent = 'LOCKED';
      DOM.raceLockHolder.textContent = step.mutex_status;
    } else if (step.mutex_status === 'NONE' || step.mutex_status === 'CORRUPTED') {
      DOM.raceLockGate.className = 'lock-gate-box';
      DOM.raceLockLabel.textContent = 'NO MUTEX (DISABLED)';
      DOM.raceLockHolder.textContent = step.mutex_status === 'CORRUPTED' ? 'Hazard: Data Corrupted' : 'Unprotected Shared Memory';
    } else {
      DOM.raceLockGate.className = 'lock-gate-box';
      DOM.raceLockLabel.textContent = 'UNLOCKED';
      DOM.raceLockHolder.textContent = 'Available for Acquisition';
    }

    // Waiting Queue
    DOM.raceQueueBox.innerHTML = '';
    if (step.waiting_queue && step.waiting_queue.length > 0) {
      step.waiting_queue.forEach(item => {
        const qEl = document.createElement('div');
        qEl.className = 'queue-item';
        qEl.textContent = `${item} (Waiting for lock)`;
        DOM.raceQueueBox.appendChild(qEl);
      });
    } else {
      DOM.raceQueueBox.innerHTML = '<span class="empty-queue-text">Queue Empty</span>';
    }

    // Critical Section
    if (step.action.includes('CRITICAL_SECTION') || step.action.includes('UNPROTECTED_WRITE') || step.action.includes('READ_SHARED')) {
      DOM.raceCriticalSection.className = `cs-chamber ${step.action.includes('UNPROTECTED') ? 'hazard' : 'occupied'}`;
      DOM.raceCsOccupant.textContent = `Active Thread: ${step.thread_name}`;
    } else {
      DOM.raceCriticalSection.className = 'cs-chamber';
      DOM.raceCsOccupant.textContent = 'Chamber Empty';
    }

    // Active Agent Cards - state snapshot per step prevents stale badges
    DOM.agentT0.classList.remove('active');
    DOM.agentT1.classList.remove('active');
    if (step.agent_states) {
      if (step.agent_states.T0) DOM.agentT0State.textContent = step.agent_states.T0;
      if (step.agent_states.T1) DOM.agentT1State.textContent = step.agent_states.T1;
    } else {
      if (step.thread_name === 'T0') DOM.agentT0State.textContent = step.action;
      if (step.thread_name === 'T1') DOM.agentT1State.textContent = step.action;
    }
    if (step.thread_name === 'T0') {
      DOM.agentT0.classList.add('active');
    } else if (step.thread_name === 'T1') {
      DOM.agentT1.classList.add('active');
    }
  }

  function handleRaceNext() {
    if (!AppState.raceTimeline) return;
    if (AppState.raceStepIndex < AppState.raceTimeline.length - 1) {
      AppState.raceStepIndex++;
      renderCurrentRaceStep();
    } else {
      stopRaceAutoPlay();
    }
  }

  function handleRacePrev() {
    if (!AppState.raceTimeline) return;
    if (AppState.raceStepIndex > 0) {
      AppState.raceStepIndex--;
      renderCurrentRaceStep();
    }
  }

  function handleRaceRestart() {
    stopRaceAutoPlay();
    AppState.raceStepIndex = 0;
    renderCurrentRaceStep();
  }

  function toggleRaceAutoPlay() {
    if (AppState.raceTimer) {
      stopRaceAutoPlay();
    } else {
      startRaceAutoPlay();
    }
  }

  function startRaceAutoPlay() {
    DOM.racePlayBtn.textContent = 'Pause';
    DOM.racePlayBtn.classList.replace('btn-secondary', 'btn-primary');
    const speed = parseInt(DOM.raceSpeedSelect ? DOM.raceSpeedSelect.value : 400, 10) || 400;
    if (AppState.raceTimer) clearInterval(AppState.raceTimer);
    AppState.raceTimer = setInterval(() => {
      if (AppState.raceStepIndex < AppState.raceTimeline.length - 1) {
        handleRaceNext();
      } else {
        stopRaceAutoPlay();
      }
    }, speed);
  }

  function stopRaceAutoPlay() {
    if (AppState.raceTimer) {
      clearInterval(AppState.raceTimer);
      AppState.raceTimer = null;
    }
    DOM.racePlayBtn.textContent = 'Auto Play';
    DOM.racePlayBtn.classList.replace('btn-primary', 'btn-secondary');
  }

  /* ==========================================================================
     SECTION 6: RESOURCE REQUEST & RELEASE
     ========================================================================== */

  function renderRequestReleaseControls() {
    if (!AppState.system) return;
    const { num_processes, num_resources, process_names, resource_names } = AppState.system;

    const savedReqVal = DOM.requestProcessSelect ? DOM.requestProcessSelect.value : '0';
    const savedRelVal = DOM.releaseProcessSelect ? DOM.releaseProcessSelect.value : '0';

    // Process select options - strictly ordered 0 to num_processes - 1
    DOM.requestProcessSelect.innerHTML = '';
    DOM.releaseProcessSelect.innerHTML = '';

    for (let p = 0; p < num_processes; p++) {
      const optReq = document.createElement('option');
      optReq.value = p;
      optReq.textContent = `Process ${process_names[p]}`;
      DOM.requestProcessSelect.appendChild(optReq);

      const optRel = document.createElement('option');
      optRel.value = p;
      optRel.textContent = `Process ${process_names[p]}`;
      DOM.releaseProcessSelect.appendChild(optRel);
    }

    // Default to P0 or restore valid selection
    DOM.requestProcessSelect.value = (savedReqVal !== '' && parseInt(savedReqVal, 10) < num_processes) ? savedReqVal : 0;
    DOM.releaseProcessSelect.value = (savedRelVal !== '' && parseInt(savedRelVal, 10) < num_processes) ? savedRelVal : 0;

    // Request input fields
    DOM.requestInputsContainer.innerHTML = '';
    for (let r = 0; r < num_resources; r++) {
      const cell = document.createElement('div');
      cell.className = 'vector-input-cell';
      cell.innerHTML = `
        <span class="vector-cell-label">${resource_names[r]}</span>
        <input type="number" id="reqInput_R${r}" min="0" max="99" value="0" class="form-control">
      `;
      DOM.requestInputsContainer.appendChild(cell);
    }

    // Release input fields with real-time validation
    DOM.releaseInputsContainer.innerHTML = '';
    for (let r = 0; r < num_resources; r++) {
      const cell = document.createElement('div');
      cell.className = 'vector-input-cell';
      cell.innerHTML = `
        <span class="vector-cell-label">${resource_names[r]}</span>
        <input type="number" id="relInput_R${r}" min="0" max="99" value="0" class="form-control">
      `;
      DOM.releaseInputsContainer.appendChild(cell);
      const inputEl = cell.querySelector('input');
      if (inputEl) {
        inputEl.addEventListener('input', validateReleaseInputs);
      }
    }

    updateSelectedProcessHoldingStatus();
    validateReleaseInputs();
    updateDynamicQuickTestChips();
  }

  function validateReleaseInputs() {
    if (!AppState.system) return;
    const p = parseInt(DOM.releaseProcessSelect.value, 10) || 0;
    const m = AppState.system.num_resources;
    const alloc = AppState.system.allocation_matrix[p] || [];
    let sum = 0;
    let exceeds = false;

    for (let r = 0; r < m; r++) {
      const input = document.getElementById(`relInput_R${r}`);
      const val = parseInt(input ? input.value : 0, 10) || 0;
      sum += val;
      if (val > (alloc[r] || 0)) {
        exceeds = true;
      }
    }

    if (sum === 0) {
      DOM.submitReleaseBtn.disabled = true;
      DOM.submitReleaseBtn.title = 'Enter at least one resource quantity > 0 to release';
    } else if (exceeds) {
      DOM.submitReleaseBtn.disabled = true;
      DOM.submitReleaseBtn.title = 'Cannot release more than currently allocated';
    } else {
      DOM.submitReleaseBtn.disabled = false;
      DOM.submitReleaseBtn.title = '';
    }
  }

  function updateDynamicQuickTestChips() {
    if (!AppState.system || !AppState.system.dynamic_scenarios) return;
    const scen = AppState.system.dynamic_scenarios;

    // 1. Safe Scenario Chip
    if (scen.safe) {
      DOM.chipSafeReq.textContent = scen.safe.label;
      DOM.chipSafeReq.disabled = false;
      DOM.chipSafeReq.dataset.p = scen.safe.process_id;
      DOM.chipSafeReq.dataset.req = JSON.stringify(scen.safe.request);
    } else {
      DOM.chipSafeReq.textContent = "Safe Request: None Available (Resources Saturated)";
      DOM.chipSafeReq.disabled = true;
      delete DOM.chipSafeReq.dataset.p;
      delete DOM.chipSafeReq.dataset.req;
    }

    // 2. Unsafe Scenario Chip
    if (scen.unsafe) {
      DOM.chipUnsafeReq.textContent = scen.unsafe.label;
      DOM.chipUnsafeReq.disabled = false;
      DOM.chipUnsafeReq.dataset.p = scen.unsafe.process_id;
      DOM.chipUnsafeReq.dataset.req = JSON.stringify(scen.unsafe.request);
    } else {
      DOM.chipUnsafeReq.textContent = "Unsafe Request: None Possible in Current State";
      DOM.chipUnsafeReq.disabled = true;
      delete DOM.chipUnsafeReq.dataset.p;
      delete DOM.chipUnsafeReq.dataset.req;
    }

    // 3. Wait Scenario Chip
    if (scen.wait) {
      DOM.chipWaitReq.textContent = scen.wait.label;
      DOM.chipWaitReq.disabled = false;
      DOM.chipWaitReq.dataset.p = scen.wait.process_id;
      DOM.chipWaitReq.dataset.req = JSON.stringify(scen.wait.request);
    } else {
      DOM.chipWaitReq.textContent = "Wait Request: All Needs Satisfiable by Available";
      DOM.chipWaitReq.disabled = true;
      delete DOM.chipWaitReq.dataset.p;
      delete DOM.chipWaitReq.dataset.req;
    }

    // 4. Exceed Claim Chip
    if (scen.exceed) {
      DOM.chipExceedNeed.textContent = scen.exceed.label;
      DOM.chipExceedNeed.disabled = false;
      DOM.chipExceedNeed.dataset.p = scen.exceed.process_id;
      DOM.chipExceedNeed.dataset.req = JSON.stringify(scen.exceed.request);
    } else {
      DOM.chipExceedNeed.textContent = "Exceeds Claim: None Available";
      DOM.chipExceedNeed.disabled = true;
    }
  }

  function applyScenarioToInputs(chipEl) {
    if (chipEl.disabled || !chipEl.dataset.p) return;
    const p = parseInt(chipEl.dataset.p, 10);
    const req = JSON.parse(chipEl.dataset.req || '[]');
    DOM.requestProcessSelect.value = p;
    req.forEach((val, r) => {
      const input = document.getElementById(`reqInput_R${r}`);
      if (input) input.value = val;
    });
  }

  function updateSelectedProcessHoldingStatus() {
    if (!AppState.system) return;
    const p = parseInt(DOM.releaseProcessSelect.value, 10) || 0;
    const { allocation_matrix, need_matrix, resource_names, process_names } = AppState.system;

    if (!allocation_matrix[p]) return;
    const alloc = allocation_matrix[p];
    const need = need_matrix[p];

    DOM.selectedProcStatusRow.innerHTML = `
      <div><strong>Holding:</strong> [${alloc.map((v, i) => `${resource_names[i]}: ${v}`).join(', ')}]</div>
      <div><strong>Need:</strong> [${need.map((v, i) => `${resource_names[i]}: ${v}`).join(', ')}]</div>
    `;
  }

  async function handleResourceRequest() {
    const p = parseInt(DOM.requestProcessSelect.value, 10);
    const m = AppState.system.num_resources;
    const request = [];

    for (let r = 0; r < m; r++) {
      const val = parseInt(document.getElementById(`reqInput_R${r}`).value, 10) || 0;
      request.push(val);
    }

    // Reset pipeline step styles
    [DOM.pipeStep1, DOM.pipeStep2, DOM.pipeStep3, DOM.pipeStep4].forEach(s => {
      s.className = 'p-step';
    });

    try {
      const res = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ process_id: p, request })
      });

      const data = await res.json();
      DOM.transactionResultCard.style.display = 'block';

      if (data.status === 'APPROVED') {
        DOM.transactionBadge.className = 'badge badge-green';
        DOM.transactionBadge.textContent = 'APPROVED (SAFE)';
        DOM.transactionResultTitle.textContent = 'Request Approved';
        DOM.transactionResultDesc.textContent = data.message;
        
        DOM.pipeStep1.className = 'p-step pass';
        DOM.pipeStep2.className = 'p-step pass';
        DOM.pipeStep3.className = 'p-step pass';
        DOM.pipeStep4.className = 'p-step pass';

        AppState.system = data.state;
        renderDashboardMatrices();
        updateSelectedProcessHoldingStatus();
        validateReleaseInputs();
        updateDynamicQuickTestChips();
        fetchLogs();
      } else if (data.status === 'DENIED_UNSAFE') {
        DOM.transactionBadge.className = 'badge badge-red';
        DOM.transactionBadge.textContent = 'DENIED (UNSAFE)';
        DOM.transactionResultTitle.textContent = 'Request Denied & Rolled Back';
        DOM.transactionResultDesc.textContent = data.message;

        DOM.pipeStep1.className = 'p-step pass';
        DOM.pipeStep2.className = 'p-step pass';
        DOM.pipeStep3.className = 'p-step pass';
        DOM.pipeStep4.className = 'p-step fail';

        AppState.system = data.state;
        renderDashboardMatrices();
        updateSelectedProcessHoldingStatus();
        validateReleaseInputs();
        updateDynamicQuickTestChips();
        fetchLogs();
      } else if (data.status === 'WAIT') {
        DOM.transactionBadge.className = 'badge badge-amber';
        DOM.transactionBadge.textContent = 'WAIT (UNAVAILABLE)';
        DOM.transactionResultTitle.textContent = 'Process Must Wait';
        DOM.transactionResultDesc.textContent = data.message;

        DOM.pipeStep1.className = 'p-step pass';
        DOM.pipeStep2.className = 'p-step fail';
        fetchLogs();
      } else {
        DOM.transactionBadge.className = 'badge badge-red';
        DOM.transactionBadge.textContent = 'ERROR';
        DOM.transactionResultTitle.textContent = 'Invalid Request';
        DOM.transactionResultDesc.textContent = data.message || 'Error occurred';

        DOM.pipeStep1.className = 'p-step fail';
        fetchLogs();
      }
      DOM.transactionResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      console.error('Request error:', err);
    }
  }

  async function handleResourceRelease() {
    const p = parseInt(DOM.releaseProcessSelect.value, 10);
    const m = AppState.system.num_resources;
    const release = [];

    for (let r = 0; r < m; r++) {
      const val = parseInt(document.getElementById(`relInput_R${r}`).value, 10) || 0;
      release.push(val);
    }

    if (release.every(x => x === 0)) {
      DOM.transactionBadge.className = 'badge badge-red';
      DOM.transactionBadge.textContent = 'VALIDATION ERROR';
      DOM.transactionResultTitle.textContent = 'Invalid Release Quantity';
      DOM.transactionResultDesc.textContent = 'Specify at least one resource quantity greater than 0 to release.';
      DOM.transactionResultCard.style.display = 'block';
      DOM.transactionResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    try {
      const res = await fetch('/api/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ process_id: p, release })
      });

      const data = await res.json();
      DOM.transactionResultCard.style.display = 'block';

      if (data.status === 'SUCCESS') {
        DOM.transactionBadge.className = 'badge badge-green';
        DOM.transactionBadge.textContent = 'RELEASE SUCCESSFUL';
        DOM.transactionResultTitle.textContent = 'Resources Released';
        DOM.transactionResultDesc.textContent = data.message;

        AppState.system = data.state;
        renderDashboardMatrices();
        updateSelectedProcessHoldingStatus();
        validateReleaseInputs();
        updateDynamicQuickTestChips();
        fetchLogs();
      } else {
        DOM.transactionBadge.className = 'badge badge-red';
        DOM.transactionBadge.textContent = 'RELEASE FAILED';
        DOM.transactionResultTitle.textContent = 'Release Error';
        DOM.transactionResultDesc.textContent = data.message;
        fetchLogs();
      }
      DOM.transactionResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      console.error('Release error:', err);
    }
  }

  /* ==========================================================================
     EXECUTION LOGS DRAWER
     ========================================================================== */

  function renderLogs(logs) {
    DOM.logsTableBody.innerHTML = '';
    if (logs.length === 0) {
      DOM.logsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No logs recorded yet.</td></tr>';
      return;
    }

    // Render in reverse chronological order
    logs.slice().reverse().forEach(log => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHTML(log.timestamp)}</td>
        <td>${escapeHTML(log.source)}</td>
        <td>${escapeHTML(log.type)}</td>
        <td style="font-family: var(--font-sans);">${escapeHTML(log.message)}</td>
      `;
      DOM.logsTableBody.appendChild(row);
    });
  }

  /* ==========================================================================
     EVENT LISTENERS ATTACHMENT
     ========================================================================== */

  // Sidebar navigation
  DOM.sidebarToggle.addEventListener('click', () => {
    DOM.sidebar.classList.toggle('collapsed');
  });

  DOM.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.section);
    });
  });

  DOM.stepDots.forEach(dot => {
    dot.addEventListener('click', () => {
      navigateTo(dot.dataset.target);
    });
  });

  DOM.quickResetBtn.addEventListener('click', async () => {
    await loadPreset('silberschatz');
    await handleInitializeSubmit();
    navigateTo('config');
  });

  // Section 1 actions
  DOM.generateFieldsBtn.addEventListener('click', () => {
    renderConfigurationFields();
    markConfigUncommitted();
  });
  DOM.initSystemBtn.addEventListener('click', handleInitializeSubmit);
  DOM.goToDashboardBtn.addEventListener('click', () => navigateTo('dashboard'));

  DOM.presetSilberschatzBtn.addEventListener('click', () => loadPreset('silberschatz'));
  DOM.presetDeadlockBtn.addEventListener('click', () => loadPreset('deadlock'));
  DOM.presetSimpleBtn.addEventListener('click', () => loadPreset('simple'));

  // Section 1 input change listeners to track uncommitted edits
  DOM.numProcessesInput.addEventListener('input', markConfigUncommitted);
  DOM.numResourcesInput.addEventListener('input', markConfigUncommitted);
  DOM.totalResourcesContainer.addEventListener('input', markConfigUncommitted);
  DOM.configMaxTable.addEventListener('input', markConfigUncommitted);
  DOM.configAllocTable.addEventListener('input', markConfigUncommitted);

  // Section 2 actions
  DOM.dashToSafetyBtn.addEventListener('click', () => navigateTo('safety'));

  // Section 3 actions
  DOM.safetyNextBtn.addEventListener('click', handleSafetyNext);
  DOM.safetyPrevBtn.addEventListener('click', handleSafetyPrev);
  DOM.safetyRestartBtn.addEventListener('click', handleSafetyRestart);
  DOM.safetyPlayBtn.addEventListener('click', toggleSafetyAutoPlay);
  if (DOM.safetySpeedSelect) {
    DOM.safetySpeedSelect.addEventListener('change', () => {
      if (AppState.safetyTimer) startSafetyAutoPlay();
    });
  }
  DOM.safetyToThreadsBtn.addEventListener('click', () => {
    if (AppState.safetyTrace && AppState.safetyTrace.length > 0) {
      const lastStep = AppState.safetyTrace[AppState.safetyTrace.length - 1];
      if (lastStep && lastStep.type === 'TERMINATION_UNSAFE') {
        alert('Cannot proceed to Multithreading: The system is in an UNSAFE / DEADLOCK state. Execution is halted. Please click "Resolve Deadlock" to load a safe state.');
        return;
      }
    }
    navigateTo('multithreading');
  });

  if (DOM.safetyDeadlockResolveBtn) {
    DOM.safetyDeadlockResolveBtn.addEventListener('click', async () => {
      await loadPreset('silberschatz');
      await handleInitializeSubmit();
      navigateTo('safety');
    });
  }

  // Section 4 actions
  DOM.runThreadsBtn.addEventListener('click', runRealThreadsSimulation);
  DOM.threadsResetBtn.addEventListener('click', () => {
    stopThreadsAutoPlay();
    renderThreadsArchitecture();
    DOM.threadCurrentEventBox.textContent = 'Thread statuses reset to idle. Click "⚡ Spawn Fresh Threads" to start a new execution run.';
    if (DOM.threadsStepperCard) DOM.threadsStepperCard.style.display = 'none';
    if (DOM.threadsLiveStatusCard) DOM.threadsLiveStatusCard.style.display = 'none';
  });
  DOM.threadsNextBtn.addEventListener('click', handleThreadsNext);
  DOM.threadsPrevBtn.addEventListener('click', handleThreadsPrev);
  DOM.threadsTimelineRestartBtn.addEventListener('click', handleThreadsRestart);
  DOM.threadsPlayBtn.addEventListener('click', toggleThreadsAutoPlay);
  if (DOM.threadsSpeedSelect) {
    DOM.threadsSpeedSelect.addEventListener('change', () => {
      if (AppState.threadsTimer) startThreadsAutoPlay();
    });
  }
  DOM.threadsToRaceBtn.addEventListener('click', () => navigateTo('race-condition'));

  // Section 5 actions
  DOM.tabWithMutex.addEventListener('click', () => {
    DOM.tabWithMutex.classList.add('active');
    DOM.tabWithoutMutex.classList.remove('active');
    AppState.raceMode = 'with_mutex';
    loadRaceSimulation(true);
  });
  DOM.tabWithoutMutex.addEventListener('click', () => {
    DOM.tabWithoutMutex.classList.add('active');
    DOM.tabWithMutex.classList.remove('active');
    AppState.raceMode = 'without_mutex';
    loadRaceSimulation(false);
  });
  DOM.raceNextBtn.addEventListener('click', handleRaceNext);
  DOM.racePrevBtn.addEventListener('click', handleRacePrev);
  DOM.raceRestartBtn.addEventListener('click', handleRaceRestart);
  if (DOM.raceRerunBtn) {
    DOM.raceRerunBtn.addEventListener('click', () => {
      loadRaceSimulation(AppState.raceMode === 'with_mutex');
    });
  }
  DOM.racePlayBtn.addEventListener('click', toggleRaceAutoPlay);
  if (DOM.raceSpeedSelect) {
    DOM.raceSpeedSelect.addEventListener('change', () => {
      if (AppState.raceTimer) startRaceAutoPlay();
    });
  }
  DOM.raceToRequestBtn.addEventListener('click', () => navigateTo('request-release'));

  // Section 6 actions
  DOM.submitRequestBtn.addEventListener('click', handleResourceRequest);
  DOM.submitReleaseBtn.addEventListener('click', handleResourceRelease);
  DOM.releaseProcessSelect.addEventListener('change', () => {
    updateSelectedProcessHoldingStatus();
    validateReleaseInputs();
  });

  // Dynamic quick test scenario chips
  DOM.chipSafeReq.addEventListener('click', () => applyScenarioToInputs(DOM.chipSafeReq));
  DOM.chipUnsafeReq.addEventListener('click', () => applyScenarioToInputs(DOM.chipUnsafeReq));
  DOM.chipWaitReq.addEventListener('click', () => applyScenarioToInputs(DOM.chipWaitReq));
  DOM.chipExceedNeed.addEventListener('click', () => applyScenarioToInputs(DOM.chipExceedNeed));

  if (DOM.chipResetBaseline) {
    DOM.chipResetBaseline.addEventListener('click', async () => {
      await loadPreset('silberschatz');
      await handleInitializeSubmit();
      [DOM.pipeStep1, DOM.pipeStep2, DOM.pipeStep3, DOM.pipeStep4].forEach(s => {
        if (s) s.className = 'p-step';
      });
      DOM.transactionBadge.className = 'badge badge-blue';
      DOM.transactionBadge.textContent = 'SYSTEM RESET';
      DOM.transactionResultTitle.textContent = 'Reset to Classic Baseline State';
      DOM.transactionResultDesc.textContent = 'System restored to textbook baseline (P0-P4 with Total [10, 5, 7], Available [3, 3, 2]). Quick test scenarios updated.';
      DOM.transactionResultCard.style.display = 'block';
      fetchLogs();
    });
  }

  // Logs drawer actions
  DOM.toggleLogsDrawerBtn.addEventListener('click', () => {
    DOM.logsDrawer.classList.toggle('open');
    if (DOM.logsDrawer.classList.contains('open')) {
      fetchLogs();
    }
  });

  DOM.closeLogsDrawerBtn.addEventListener('click', () => {
    DOM.logsDrawer.classList.remove('open');
  });

  DOM.clearLogsBtn.addEventListener('click', async () => {
    await fetch('/api/logs/clear', { method: 'POST' });
    DOM.logsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Logs cleared.</td></tr>';
  });

  // Initial load
  fetchState().then(state => {
    if (state) {
      populateConfigurationForm(state);
      setSidebarStatus('pending', `${state.num_processes} Processes | ${state.num_resources} Resources (Click Initialize)`);
    }
  });
});
