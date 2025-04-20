let chart = null;

function initializeChart(hits, faults) {
    if (chart) {
        chart.destroy();
    }

    const ctx = document.getElementById('resultChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Page Hits', 'Page Faults'],
            datasets: [{
                data: [hits, faults],
                backgroundColor: ['#10B981', '#FFB7C5'],
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

function FCFS(frames, sequence) {
    const memory = new Array(frames).fill(-1);
    const result = {
        frames: [],
        faults: [],
        hitCount: 0,
        faultCount: 0
    };
    let currentIndex = 0;

    for (const page of sequence) {
        if (!memory.includes(page)) {
            // Page fault
            if (currentIndex < frames) {
                memory[currentIndex] = page;
                currentIndex++;
            } else {
                // FIFO replacement - shift elements left and add new page at end
                for (let i = 0; i < frames - 1; i++) {
                    memory[i] = memory[i + 1];
                }
                memory[frames - 1] = page;
            }
            result.faultCount++;
            result.faults.push(true);
        } else {
            // Page hit
            result.hitCount++;
            result.faults.push(false);
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
        faultCount: 0
    };
    let filled = 0;

    for (let i = 0; i < sequence.length; i++) {
        const page = sequence[i];
        
        if (!memory.includes(page)) {
            // Page fault
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
                
                memory[replaceIndex] = page;
            }
            result.faultCount++;
            result.faults.push(true);
        } else {
            // Page hit
            result.hitCount++;
            result.faults.push(false);
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
        faultCount: 0
    };
    const lastUsed = new Array(frames).fill(-1);
    let filled = 0;

    for (let i = 0; i < sequence.length; i++) {
        const page = sequence[i];
        
        if (!memory.includes(page)) {
            // Page fault
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
                memory[lruIndex] = page;
                lastUsed[lruIndex] = i;
            }
            result.faultCount++;
            result.faults.push(true);
        } else {
            // Page hit
            const hitIndex = memory.indexOf(page);
            lastUsed[hitIndex] = i;
            result.hitCount++;
            result.faults.push(false);
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
        faultCount: 0
    };
    const lastUsed = new Array(frames).fill(-1);
    let filled = 0;

    for (let i = 0; i < sequence.length; i++) {
        const page = sequence[i];
        
        if (!memory.includes(page)) {
            // Page fault
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
                memory[mruIndex] = page;
                lastUsed[mruIndex] = i;
            }
            result.faultCount++;
            result.faults.push(true);
        } else {
            // Page hit
            const hitIndex = memory.indexOf(page);
            lastUsed[hitIndex] = i;
            result.hitCount++;
            result.faults.push(false);
        }
        result.frames.push([...memory]);
    }

    return result;
}

function updateSummary(frames, sequence, hitCount, faultCount) {
    const summary = document.getElementById('summary');
    summary.innerHTML = `
        <p>Total Frames: ${frames}</p>
        <p>Total Pages: ${sequence.length}</p>
        <p>Page Sequence: ${sequence.join(', ')}</p>
        <p>Page Hits: ${hitCount}</p>
        <p>Page Faults: ${faultCount}</p>
    `;
}

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
    tableHeader.innerHTML += '<th>RESULT</th>';

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
        row.innerHTML += `
            <td class="${result.faults[index] ? 'page-fault' : ''}">
                ${result.faults[index] ? 'FAULT' : 'HIT'}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function runFCFS() {
    const frameCount = parseInt(document.getElementById('frameCount').value);
    const sequence = document.getElementById('pageSequence').value
        .split(',')
        .map(num => parseInt(num.trim()));

    if (!sequence.every(num => !isNaN(num))) {
        alert('Please enter valid numbers for the page sequence');
        return;
    }

    const result = FCFS(frameCount, sequence);
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('algorithmTitle').textContent = 'FCFS Results';
    updateTable(frameCount, sequence, result);
    updateSummary(frameCount, sequence, result.hitCount, result.faultCount);
    initializeChart(result.hitCount, result.faultCount);
}

function runOPR() {
    const frameCount = parseInt(document.getElementById('frameCount').value);
    const sequence = document.getElementById('pageSequence').value
        .split(',')
        .map(num => parseInt(num.trim()));

    if (!sequence.every(num => !isNaN(num))) {
        alert('Please enter valid numbers for the page sequence');
        return;
    }

    const result = OPR(frameCount, sequence);
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('algorithmTitle').textContent = 'OPR Results';
    updateTable(frameCount, sequence, result);
    updateSummary(frameCount, sequence, result.hitCount, result.faultCount);
    initializeChart(result.hitCount, result.faultCount);
}

function runLRU() {
    const frameCount = parseInt(document.getElementById('frameCount').value);
    const sequence = document.getElementById('pageSequence').value
        .split(',')
        .map(num => parseInt(num.trim()));

    if (!sequence.every(num => !isNaN(num))) {
        alert('Please enter valid numbers for the page sequence');
        return;
    }

    const result = LRU(frameCount, sequence);
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('algorithmTitle').textContent = 'LRU Results';
    updateTable(frameCount, sequence, result);
    updateSummary(frameCount, sequence, result.hitCount, result.faultCount);
    initializeChart(result.hitCount, result.faultCount);
}

function runMRU() {
    const frameCount = parseInt(document.getElementById('frameCount').value);
    const sequence = document.getElementById('pageSequence').value
        .split(',')
        .map(num => parseInt(num.trim()));

    if (!sequence.every(num => !isNaN(num))) {
        alert('Please enter valid numbers for the page sequence');
        return;
    }

    const result = MRU(frameCount, sequence);
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('algorithmTitle').textContent = 'MRU Results';
    updateTable(frameCount, sequence, result);
    updateSummary(frameCount, sequence, result.hitCount, result.faultCount);
    initializeChart(result.hitCount, result.faultCount);
}

function resetSimulation() {
    document.getElementById('results').classList.add('hidden');
    document.getElementById('frameCount').value = '3';
    document.getElementById('pageSequence').value = '';
    if (chart) {
        chart.destroy();
        chart = null;
    }
}