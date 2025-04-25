// Global variables
let chart = null;
let comparisonChart = null;
let allResults = {};
let currentAlgorithm = '';

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize range slider sync with number input
    const frameCountInput = document.getElementById('frameCount');
    const frameRangeInput = document.getElementById('frameRange');
    
    frameCountInput.addEventListener('input', () => {
        frameRangeInput.value = frameCountInput.value;
    });
    
    frameRangeInput.addEventListener('input', () => {
        frameCountInput.value = frameRangeInput.value;
    });
    
    // Initialize random sequence button
    document.getElementById('randomSequence').addEventListener('click', generateRandomSequence);
    
    // Initialize clear sequence button
    document.getElementById('clearSequence').addEventListener('click', () => {
        document.getElementById('pageSequence').value = '';
    });
    
    // Initialize tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and content
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Handle tab-specific updates
            if (tabId === 'comparison' && Object.keys(allResults).length > 0) {
                updateComparisonChart();
            } else if (tabId === 'statistics' && currentAlgorithm && allResults[currentAlgorithm]) {
                // Initialize chart for statistics tab using the current algorithm's results
                initializeChart(allResults[currentAlgorithm].hitCount, allResults[currentAlgorithm].faultCount);
            }

            // Fix: Reset scroll position to prevent infinite scroll
            window.scrollTo(0, 0);
        });
    });

    // Fix: Prevent scroll events during chart rendering
    window.addEventListener('scroll', (e) => {
        if (document.querySelector('#statistics.active') || document.querySelector('#comparison.active')) {
            e.preventDefault();
        }
    }, { passive: false });
});

// Generate random page sequence
function generateRandomSequence() {
    const length = parseInt(document.getElementById('sequenceLength').value) || 10;
    const maxPage = Math.min(10, parseInt(document.getElementById('frameCount').value) + 3);
    const sequence = [];
    
    for (let i = 0; i < length; i++) {
        sequence.push(Math.floor(Math.random() * maxPage) + 1);
    }
    
    document.getElementById('pageSequence').value = sequence.join(', ');
}

// Algorithm implementations
function FCFS(frames, sequence) {
    const memory = new Array(frames).fill(-1);
    const result = {
        frames: [],
        faults: [],
        hitCount: 0,
        faultCount: 0,
        algorithm: 'FCFS',
        replacements: []
    };
    let currentIndex = 0;

    for (const page of sequence) {
        if (!memory.includes(page)) {
            // Page fault
            let replacedPage = -1;
            if (currentIndex < frames) {
                memory[currentIndex] = page;
                currentIndex++;
            } else {
                // FIFO replacement - shift elements left and add new page at end
                replacedPage = memory[0];
                for (let i = 0; i < frames - 1; i++) {
                    memory[i] = memory[i + 1];
                }
                memory[frames - 1] = page;
            }
            result.faultCount++;
            result.faults.push(true);
            result.replacements.push(replacedPage);
        } else {
            // Page hit
            result.hitCount++;
            result.faults.push(false);
            result.replacements.push(null);
        }
        result.frames.push([...memory]);
    }

    return result;
}

function OPR(frames, sequence) {
    const memory = new Array(frames).fill(-1);
    const result = {
        frames: [],
        faults: [],
        hitCount: 0,
        faultCount: 0,
        algorithm: 'OPR',
        replacements: []
    };
    let filled = 0;

    for (let i = 0; i < sequence.length; i++) {
        const page = sequence[i];
        
        if (!memory.includes(page)) {
            // Page fault
            let replacedPage = -1;
            if (filled < frames) {
                memory[filled] = page;
                filled++;
            } else {
                // Find the optimal page to replace
                let farthest = -1;
                let replaceIndex = -1;

                for (let j = 0; j < frames; j++) {
                    let nextUse = sequence.length;
                    
                    // Find the next use of current frame
                    for (let k = i + 1; k < sequence.length; k++) {
                        if (sequence[k] === memory[j]) {
                            nextUse = k;
                            break;
                        }
                    }
                    
                    if (nextUse > farthest) {
                        farthest = nextUse;
                        replaceIndex = j;
                    }
                }
                
                replacedPage = memory[replaceIndex];
                memory[replaceIndex] = page;
            }
            result.faultCount++;
            result.faults.push(true);
            result.replacements.push(replacedPage);
        } else {
            // Page hit
            result.hitCount++;
            result.faults.push(false);
            result.replacements.push(null);
        }
        result.frames.push([...memory]);
    }

    return result;
}

function LRU(frames, sequence) {
    const memory = new Array(frames).fill(-1);
    const result = {
        frames: [],
        faults: [],
        hitCount: 0,
        faultCount: 0,
        algorithm: 'LRU',
        replacements: []
    };
    const lastUsed = new Array(frames).fill(-1);
    let filled = 0;

    for (let i = 0; i < sequence.length; i++) {
        const page = sequence[i];
        
        if (!memory.includes(page)) {
            // Page fault
            let replacedPage = -1;
            if (filled < frames) {
                memory[filled] = page;
                lastUsed[filled] = i;
                filled++;
            } else {
                // Find least recently used page
                let lruIndex = 0;
                for (let j = 1; j < frames; j++) {
                    if (lastUsed[j] < lastUsed[lruIndex]) {
                        lruIndex = j;
                    }
                }
                replacedPage = memory[lruIndex];
                memory[lruIndex] = page;
                lastUsed[lruIndex] = i;
            }
            result.faultCount++;
            result.faults.push(true);
            result.replacements.push(replacedPage);
        } else {
            // Page hit
            const hitIndex = memory.indexOf(page);
            lastUsed[hitIndex] = i;
            result.hitCount++;
            result.faults.push(false);
            result.replacements.push(null);
        }
        result.frames.push([...memory]);
    }

    return result;
}

function MRU(frames, sequence) {
    const memory = new Array(frames).fill(-1);
    const result = {
        frames: [],
        faults: [],
        hitCount: 0,
        faultCount: 0,
        algorithm: 'MRU',
        replacements: []
    };
    const lastUsed = new Array(frames).fill(-1);
    let filled = 0;

    for (let i = 0; i < sequence.length; i++) {
        const page = sequence[i];
        
        if (!memory.includes(page)) {
            // Page fault
            let replacedPage = -1;
            if (filled < frames) {
                memory[filled] = page;
                lastUsed[filled] = i;
                filled++;
            } else {
                // Find most recently used page
                let mruIndex = 0;
                for (let j = 1; j < frames; j++) {
                    if (lastUsed[j] > lastUsed[mruIndex]) {
                        mruIndex = j;
                    }
                }
                replacedPage = memory[mruIndex];
                memory[mruIndex] = page;
                lastUsed[mruIndex] = i;
            }
            result.faultCount++;
            result.faults.push(true);
            result.replacements.push(replacedPage);
        } else {
            // Page hit
            const hitIndex = memory.indexOf(page);
            lastUsed[hitIndex] = i;
            result.hitCount++;
            result.faults.push(false);
            result.replacements.push(null);
        }
        result.frames.push([...memory]);
    }

    return result;
}

// Update summary section
function updateSummary(frames, sequence, result) {
    const summary = document.getElementById('summary');
    const hitRatio = (result.hitCount / sequence.length * 100).toFixed(2);
    const faultRatio = (result.faultCount / sequence.length * 100).toFixed(2);
    
    summary.innerHTML = `
        <p><span>Algorithm:</span> <span>${result.algorithm}</span></p>
        <p><span>Total Frames:</span> <span>${frames}</span></p>
        <p><span>Total Pages:</span> <span>${sequence.length}</span></p>
        <p><span>Page Sequence:</span> <span>${sequence.join(', ')}</span></p>
        <p><span>Page Hits:</span> <span>${result.hitCount} (${hitRatio}%)</span></p>
        <p><span>Page Faults:</span> <span>${result.faultCount} (${faultRatio}%)</span></p>
        <p><span>Hit Ratio:</span> <span>${hitRatio}%</span></p>
        <p><span>Fault Ratio:</span> <span>${faultRatio}%</span></p>
    `;
}

// Update the results table
function updateTable(frames, sequence, result) {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    
    // Clear existing content
    tableHeader.innerHTML = '<th>PAGES</th>';
    tableBody.innerHTML = '';
    
    // Add frame columns
    for (let i = 1; i <= frames; i++) {
        tableHeader.innerHTML += `<th>FRAME ${i}</th>`;
    }
    tableHeader.innerHTML += '<th>RESULT</th><th>REPLACED</th>';

    // Add rows for each step in the sequence
    result.frames.forEach((frameState, index) => {
        const row = document.createElement('tr');
        
        // Add page number
        row.innerHTML = `<td>P${sequence[index]}</td>`;
        
        // Add frame states
        frameState.forEach(value => {
            row.innerHTML += `
                <td class="${value !== -1 ? 'frame-occupied' : ''}">${value !== -1 ? value : ''}</td>
            `;
        });
        
        // Add result (hit/fault)
        const resultClass = result.faults[index] ? 'page-fault' : 'page-hit';
        const resultText = result.faults[index] ? 'FAULT' : 'HIT';
        row.innerHTML += `
            <td class="${resultClass}">${resultText}</td>
        `;
        
        // Add replaced page if applicable
        const replacedPage = result.replacements[index];
        row.innerHTML += `
            <td>${replacedPage !== null && replacedPage !== -1 ? replacedPage : ''}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Initialize or update the result chart
function initializeChart(hits, faults) {
    if (chart) {
        chart.destroy();
    }

    const ctx = document.getElementById('resultChart').getContext('2d');
    // Fix: Set explicit canvas size to prevent layout shifts
    ctx.canvas.width = 300;
    ctx.canvas.height = 300;

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Page Hits', 'Page Faults'],
            datasets: [{
                data: [hits, faults],
                backgroundColor: ['#10B981', '#EF4444'],
                borderColor: ['#0D9266', '#DC2626'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'white',
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%',
            // Fix: Disable animations to prevent scroll triggers
            animation: false
        }
    });
}

// Update the comparison chart
function updateComparisonChart() {
    const algorithms = Object.keys(allResults);
    if (algorithms.length === 0) return;

    const hitData = algorithms.map(algo => allResults[algo].hitCount);
    const faultData = algorithms.map(algo => allResults[algo].faultCount);
    const hitRatioData = algorithms.map(algo => 
        (allResults[algo].hitCount / allResults[algo].frames.length * 100).toFixed(2)
    );

    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    // Fix: Set explicit canvas size to prevent layout shifts
    ctx.canvas.width = 400;
    ctx.canvas.height = 300;

    if (comparisonChart) {
        comparisonChart.destroy();
    }

    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: algorithms,
            datasets: [
                {
                    label: 'Page Hits',
                    data: hitData,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Page Faults',
                    data: faultData,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count',
                        color: 'white'
                    },
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'white',
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const algo = context.datasetIndex === 0 ? 
                                allResults[context.label] : allResults[context.label];
                            const total = algo.frames.length;
                            const ratio = context.datasetIndex === 0 ? 
                                (algo.hitCount / total * 100).toFixed(2) : 
                                (algo.faultCount / total * 100).toFixed(2);
                            return `Ratio: ${ratio}%`;
                        }
                    }
                }
            },
            // Fix: Disable animations to prevent scroll triggers
            animation: false
        }
    });

    // Update comparison table
    const comparisonBody = document.getElementById('comparisonBody');
    comparisonBody.innerHTML = '';
    
    algorithms.forEach(algo => {
        const result = allResults[algo];
        const total = result.frames.length;
        const hitRatio = (result.hitCount / total * 100).toFixed(2);
        const faultRatio = (result.faultCount / total * 100).toFixed(2);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${algo}</td>
            <td>${result.hitCount}</td>
            <td>${result.faultCount}</td>
            <td>${hitRatio}%</td>
            <td>${faultRatio}%</td>
        `;
        comparisonBody.appendChild(row);
    });
}

// Run all algorithms
function runAllAlgorithms() {
    const frameCount = parseInt(document.getElementById('frameCount').value);
    const sequence = document.getElementById('pageSequence').value
        .split(',')
        .map(num => parseInt(num.trim()));

    if (!sequence.every(num => !isNaN(num))) {
        alert('Please enter valid numbers for the page sequence');
        return;
    }

    allResults = {
        FCFS: FCFS(frameCount, sequence),
        OPR: OPR(frameCount, sequence),
        LRU: LRU(frameCount, sequence),
        MRU: MRU(frameCount, sequence)
    };

    // Show the first algorithm's results by default
    currentAlgorithm = 'FCFS';
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('algorithmTitle').textContent = 'All Algorithms Results';
    updateTable(frameCount, sequence, allResults.FCFS);
    updateSummary(frameCount, sequence, allResults.FCFS);
    initializeChart(allResults.FCFS.hitCount, allResults.FCFS.faultCount);
    
    // Switch to comparison tab
    document.querySelector('.tab-btn[data-tab="visualization"]').classList.remove('active');
    document.querySelector('.tab-content#visualization').classList.remove('active');
    document.querySelector('.tab-btn[data-tab="comparison"]').classList.add('active');
    document.querySelector('.tab-content#comparison').classList.add('active');
    
    // Update comparison chart
    updateComparisonChart();
}

// Individual algorithm run functions
function runFCFS() {
    runAlgorithm('FCFS');
}

function runOPR() {
    runAlgorithm('OPR');
}

function runLRU() {
    runAlgorithm('LRU');
}

function runMRU() {
    runAlgorithm('MRU');
}

function runAlgorithm(algorithm) {
    const frameCount = parseInt(document.getElementById('frameCount').value);
    const sequence = document.getElementById('pageSequence').value
        .split(',')
        .map(num => parseInt(num.trim()));

    if (!sequence.every(num => !isNaN(num))) {
        alert('Please enter valid numbers for the page sequence');
        return;
    }

    let result;
    switch (algorithm) {
        case 'FCFS':
            result = FCFS(frameCount, sequence);
            break;
        case 'OPR':
            result = OPR(frameCount, sequence);
            break;
        case 'LRU':
            result = LRU(frameCount, sequence);
            break;
        case 'MRU':
            result = MRU(frameCount, sequence);
            break;
        default:
            console.error('Unknown algorithm');
            return;
    }

    // Store result for comparison
    allResults[algorithm] = result;
    currentAlgorithm = algorithm;

    // Update UI
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('algorithmTitle').textContent = `${algorithm} Results`;
    updateTable(frameCount, sequence, result);
    updateSummary(frameCount, sequence, result);
    initializeChart(result.hitCount, result.faultCount);

    // Switch to visualization tab
    document.querySelector('.tab-btn[data-tab="comparison"]').classList.remove('active');
    document.querySelector('.tab-content#comparison').classList.remove('active');
    document.querySelector('.tab-btn[data-tab="statistics"]').classList.remove('active');
    document.querySelector('.tab-content#statistics').classList.remove('active');
    document.querySelector('.tab-btn[data-tab="visualization"]').classList.add('active');
    document.querySelector('.tab-content#visualization').classList.add('active');
}

// Reset simulation
function resetSimulation() {
    allResults = {};
    currentAlgorithm = '';
    document.getElementById('pageSequence').value = '';
    document.getElementById('frameCount').value = '3';
    document.getElementById('frameRange').value = '3';
    document.getElementById('sequenceLength').value = '10';
    document.getElementById('results').classList.add('hidden');
    document.getElementById('tableBody').innerHTML = '';
    document.getElementById('summary').innerHTML = '';
    document.getElementById('comparisonBody').innerHTML = '';
    
    if (chart) {
        chart.destroy();
        chart = null;
    }
    if (comparisonChart) {
        comparisonChart.destroy();
        comparisonChart = null;
    }

    // Switch to visualization tab
    document.querySelector('.tab-btn[data-tab="comparison"]').classList.remove('active');
    document.querySelector('.tab-content#comparison').classList.remove('active');
    document.querySelector('.tab-btn[data-tab="statistics"]').classList.remove('active');
    document.querySelector('.tab-content#statistics').classList.remove('active');
    document.querySelector('.tab-btn[data-tab="visualization"]').classList.add('active');
    document.querySelector('.tab-content#visualization').classList.add('active');
}