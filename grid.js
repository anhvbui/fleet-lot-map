// grid.js

document.addEventListener('DOMContentLoaded', (event) => {
    // ... (no changes to the top variable declarations) ...
    const parkingGridContainer = document.getElementById('parking-grids-container');
    const generateBtn = document.getElementById('generateBtn');
    const vinTableBody = document.getElementById('vinTableBody');
    const availSummary = document.getElementById('availSummary');
    const vinSlotInput = document.getElementById('vinSlotInput');
    const vinNumberInput = document.getElementById('vinNumberInput');
    const vinStatusInput = document.getElementById('vinStatusInput');
    const assignVinBtn = document.getElementById('assignVinBtn');
    const clearVinBtn = document.getElementById('clearVinBtn'); 
    
    const actionMessageEl = document.getElementById('action-message');

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('search-btn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const updateStatusBtn = document.getElementById('updateStatusBtn');
    
    const hubReworkStatusEl = document.getElementById('hubReworkStatus');
    const gaReworkStatusEl = document.getElementById('GAReworkStatus');
    const chargingStatusEl = document.getElementById('chargingStatus');

    const numRows = 40;
    const numCols = 20;

    function letterToNumber(letter) {
        return letter.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    }

    function parseSlotInput(slotString) {
        const letterMatch = slotString.match(/[a-zA-Z]+/);
        const numMatch = slotString.match(/\d+/);
        if (!letterMatch || !numMatch) return null;
        const colLetter = letterMatch[0];
        const rowNumber = parseInt(numMatch[0], 10);
        const colNumber = letterToNumber(colLetter);
        return { row: rowNumber, col: colNumber };
    }

    function createEmptyGrid() {
        parkingGridContainer.innerHTML = '';
        const rowContainer = document.createElement('div');
        rowContainer.className = 'd-flex flex-column align-items-center w-100';
        for (let row = numRows; row >= 1; row--) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'd-flex mb-1 empty-grid-row';
            for (let col = 1; col <= numCols; col++) {
                const colLetter = String.fromCharCode('A'.charCodeAt(0) + (col - 1));
                const slot = document.createElement('div');
                slot.id = `slot-${colLetter}-${row}`;
                slot.className = 'parking-slot empty-slot';
                slot.textContent = `${colLetter}${row}`;
                rowDiv.appendChild(slot);
            }
            rowContainer.appendChild(rowDiv);
        }
        parkingGridContainer.appendChild(rowContainer);
    }

    function saveInputs() {
        const inputs = {
            employeeStart: document.getElementById('employeeStart').value,
            employeeEnd: document.getElementById('employeeEnd').value,
            fleetAStart: document.getElementById('fleetAStart').value,
            fleetAEnd: document.getElementById('fleetAEnd').value,
            fleetBStart: document.getElementById('fleetBStart').value,
            fleetBEnd: document.getElementById('fleetBEnd').value,
            fleetCStart: document.getElementById('fleetCStart').value,
            fleetCEnd: document.getElementById('fleetCEnd').value,
            fleetDStart: document.getElementById('fleetDStart').value,
            fleetDEnd: document.getElementById('fleetDEnd').value,
            fleetEStart: document.getElementById('fleetEStart').value,
            fleetEEnd: document.getElementById('fleetEEnd').value,
            fleetFStart: document.getElementById('fleetFStart').value,
            fleetFEnd: document.getElementById('fleetFEnd').value
        };
        localStorage.setItem('parkingMapInputs', JSON.stringify(inputs));
    }

    function loadInputs() {
        const savedInputs = localStorage.getItem('parkingMapInputs');
        if (savedInputs) {
            const inputs = JSON.parse(savedInputs);
            document.getElementById('employeeStart').value = inputs.employeeStart || '';
            document.getElementById('employeeEnd').value = inputs.employeeEnd || '';
            document.getElementById('fleetAStart').value = inputs.fleetAStart || '';
            document.getElementById('fleetAEnd').value = inputs.fleetAEnd || '';
            document.getElementById('fleetBStart').value = inputs.fleetBStart || '';
            document.getElementById('fleetBEnd').value = inputs.fleetBEnd || '';
            document.getElementById('fleetCStart').value = inputs.fleetCStart || '';
            document.getElementById('fleetCEnd').value = inputs.fleetCEnd || '';
            document.getElementById('fleetDStart').value = inputs.fleetDStart || '';
            document.getElementById('fleetDEnd').value = inputs.fleetDEnd || '';
            document.getElementById('fleetEStart').value = inputs.fleetEStart || '';
            document.getElementById('fleetEEnd').value = inputs.fleetEEnd || '';
            document.getElementById('fleetFStart').value = inputs.fleetFStart || '';
            document.getElementById('fleetFEnd').value = inputs.fleetFEnd || '';
        }
    }

    function updateSummary(occupiedCount, total) {
        availSummary.textContent = `Occupied: ${occupiedCount} | Available: ${total - occupiedCount}`;
    }

    function updateGrids() {
        createEmptyGrid();
        const existingAssignments = JSON.parse(localStorage.getItem('parkingLotSlots')) || [];

        // *** FIX 1: Changed zoneClass names to match CSS (e.g., 'fleetA-slot') ***
        const zones = [{
            name: 'Employee',
            startSlot: document.getElementById('employeeStart').value,
            endSlot: document.getElementById('employeeEnd').value,
            zoneClass: 'employee-slot'
        }, {
            name: 'A',
            startSlot: document.getElementById('fleetAStart').value,
            endSlot: document.getElementById('fleetAEnd').value,
            zoneClass: 'fleetA-slot'
        }, {
            name: 'B',
            startSlot: document.getElementById('fleetBStart').value,
            endSlot: document.getElementById('fleetBEnd').value,
            zoneClass: 'fleetB-slot'
        }, {
            name: 'C',
            startSlot: document.getElementById('fleetCStart').value,
            endSlot: document.getElementById('fleetCEnd').value,
            zoneClass: 'fleetC-slot'
        }, {
            name: 'D',
            startSlot: document.getElementById('fleetDStart').value,
            endSlot: document.getElementById('fleetDEnd').value,
            zoneClass: 'fleetD-slot'
        }, {
            name: 'E',
            startSlot: document.getElementById('fleetEStart').value,
            endSlot: document.getElementById('fleetEEnd').value,
            zoneClass: 'fleetE-slot'
        }, {
            name: 'F',
            startSlot: document.getElementById('fleetFStart').value,
            endSlot: document.getElementById('fleetFEnd').value,
            zoneClass: 'fleetF-slot'
        }];

        let parkingLotSlots = [];
        let lineNumber = 1;

        zones.forEach(zone => {
            const startCoords = parseSlotInput(zone.startSlot);
            const endCoords = parseSlotInput(zone.endSlot);
            if (!startCoords || !endCoords) return;

            const startRow = Math.min(startCoords.row, endCoords.row);
            const endRow = Math.max(startCoords.row, endCoords.row);
            const startCol = Math.min(startCoords.col, endCoords.col);
            const endCol = Math.max(startCoords.col, endCoords.col);

            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    const colLetter = String.fromCharCode('A'.charCodeAt(0) + (col - 1));
                    const slotId = `slot-${colLetter}-${row}`;
                    const slot = document.getElementById(slotId);
                    if (slot) {
                        slot.classList.remove('empty-slot');
                        slot.classList.add(zone.zoneClass);

                        const slotName = `${colLetter}${row}`;
                        const existingSlot = existingAssignments.find(s => s.slot === slotName);

                        parkingLotSlots.push({
                            line: lineNumber,
                            slot: slotName,
                            zone: zone.name,
                            vin: existingSlot ? existingSlot.vin : '',
                            hubRework: existingSlot ? existingSlot.hubRework : '',
                            gaRework: existingSlot ? existingSlot.gaRework : '',
                            chargingStatus: existingSlot ? existingSlot.chargingStatus : '',
                            timestamp: existingSlot ? existingSlot.timestamp : ''
                        });
                        lineNumber++;
                    }
                }
            }
        });

        localStorage.setItem('parkingLotSlots', JSON.stringify(parkingLotSlots));
        saveInputs();
        updateVinTable(); // This will now correctly apply occupied/available status on top of the new zones
    }


    function updateVinTable() {
        const assignments = JSON.parse(localStorage.getItem('parkingLotSlots')) || [];
        vinTableBody.innerHTML = ''; // Clear table
        let occupiedCount = 0;
        let totalSlots = 0;

        assignments.forEach(assignment => {
            
            if (assignment.zone !== 'Employee') {
            totalSlots++;
            if (assignment.vin) {
                occupiedCount++;
            }
            }
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${assignment.line}</td>
                <td>${assignment.zone}</td>
                <td>${assignment.slot}</td>
                <td>${assignment.vin || ''}</td>
                <td>${assignment.hubRework || ''}</td>
                <td>${assignment.gaRework || ''}</td>
                <td>${assignment.chargingStatus || ''}</td>
                <td>${assignment.timestamp || ''}</td>
            `;
            vinTableBody.appendChild(row);

            const slotElement = document.getElementById(`slot-${assignment.slot}`);
            // *** FIX 2: Clear old status classes before adding the new one ***
            if (slotElement) {
                slotElement.classList.remove('available', 'occupied', 'reserved'); // Clear previous statuses
                if (assignment.vin) {
                    slotElement.classList.add('occupied');
                } else {
                    slotElement.classList.add('available');
                }
            }
        });
        updateSummary(occupiedCount, totalSlots);
    }
    
    // ... (rest of the file is unchanged: assignVinBtn, searchBtn, clearAllData, etc.) ...
    
    assignVinBtn.addEventListener('click', () => {
        const slotInput = document.getElementById('vinSlotInput').value.toUpperCase();
        const vinInput = document.getElementById('vinNumberInput').value.toUpperCase();
        if (slotInput && vinInput) {
            let slots = JSON.parse(localStorage.getItem('parkingLotSlots')) || [];
            const targetSlot = slots.find(s => s.slot === slotInput);
            if (targetSlot) {
                targetSlot.vin = vinInput;
                targetSlot.timestamp = new Date().toLocaleString();
            } else {
                alert(`Slot ${slotInput} is not a part of any defined zone. VIN will not be assigned.`);
                return;
            }
            localStorage.setItem('parkingLotSlots', JSON.stringify(slots));
            updateVinTable();
            document.getElementById('vinSlotInput').value = '';
            document.getElementById('vinNumberInput').value = '';
        }
    });

    function displayMessage(message, type = 'success') {
        actionMessageEl.className = type === 'success' 
            ? 'text-success text-center fw-bold mb-2' 
            : 'text-danger text-center fw-bold mb-2';
        actionMessageEl.textContent = message;

        setTimeout(() => {
            actionMessageEl.textContent = '';
        }, 3000);
    }

    function clearVin() {
        const slotInput = vinSlotInput.value.toUpperCase();
        const vinInput = vinNumberInput.value.toUpperCase();

        // 1. Check if inputs are provided
        if (!slotInput || !vinInput) {
            alert('Please provide both the Slot Number and the VIN to clear.');
            return;
        }

        let slots = JSON.parse(localStorage.getItem('parkingLotSlots')) || [];
        
        // 2. Find the slot the user entered
        const targetSlot = slots.find(s => s.slot === slotInput);

        // 3. Handle cases where the slot or VIN doesn't match
        if (!targetSlot) {
            alert(`Error: Slot "${slotInput}" was not found.`);
            return;
        }
        
        if (targetSlot.vin !== vinInput) {
            alert(`Error: The provided VIN does not match the one in slot "${slotInput}".`);
            return;
        }

        // 4. If everything matches, clear the VIN and timestamp
        targetSlot.vin = '';
        targetSlot.timestamp = '';

        // 5. Save the updated data and refresh the UI
        localStorage.setItem('parkingLotSlots', JSON.stringify(slots));
        updateVinTable();
        displayMessage(`VIN successfully cleared from slot ${slotInput}.`, 'success');

        // 6. Clear the input fields for the next operation
        vinSlotInput.value = '';
        vinNumberInput.value = '';
    }

    function saveStatus() {
        const vinSsInput = vinStatusInput.value.toUpperCase();
        if (!vinSsInput) {
            displayMessage('Enter an existing VIN number.', 'error');
            return;
        }

        let slots = JSON.parse(localStorage.getItem('parkingLotSlots')) || [];
        const targetSlot = slots.find(s => s.vin.toUpperCase() === vinSsInput);

        if (!targetSlot) {
            displayMessage(`VIN "${vinSsInput}" does not exist in the table.`, 'error');
            return;
        }

        // Get the selected values from the dropdowns
        const hubStatus = hubReworkStatusEl.value;
        const gaStatus = gaReworkStatusEl.value;
        const chargingStatus = chargingStatusEl.value;
        
        let statusUpdated = false;

        // Update the properties only if a new value was selected
        if (hubStatus) {
            targetSlot.hubRework = hubStatus;
            statusUpdated = true;
        }
        if (gaStatus) {
            targetSlot.gaRework = gaStatus;
            statusUpdated = true;
        }
        if (chargingStatus) {
            targetSlot.chargingStatus = chargingStatus;
            statusUpdated = true;
        }

        if (statusUpdated) {
            localStorage.setItem('parkingLotSlots', JSON.stringify(slots));
            updateVinTable();
            displayMessage(`Status updated for VIN ${vinSsInput}.`, 'success');
            // Reset dropdowns to the placeholder
            hubReworkStatusEl.value = "";
            gaReworkStatusEl.value = "";
            chargingStatusEl.value = "";
        } else {
            displayMessage('No new status was selected to save.', 'error');
        }
    }

    function clearHighlights() {
        const highlightedSlots = document.querySelectorAll('.highlight');
        highlightedSlots.forEach(slot => {
            slot.classList.remove('highlight');
        });
    }

    function exportToCsv() {
        const assignments = JSON.parse(localStorage.getItem('parkingLotSlots')) || [];
        if (assignments.length === 0) {
            alert('No data to export.');
            return;
        }

        // 1. Define CSV Headers
        const headers = [
            "Line", "Zone", "Slot", "VIN",
            "Hub Rework Status", "GA Rework Status", "Charging Status",
            "Timestamp"
        ];

        // 2. Convert each data object to a comma-separated string
        const rows = assignments.map(slot => [
            slot.line,
            slot.zone,
            slot.slot,
            `"${slot.vin || ''}"`, // Wrap VIN in quotes
            `"${slot.hubRework || ''}"`,
            `"${slot.gaRework || ''}"`,
            `"${slot.chargingStatus || ''}"`,
            `"${slot.timestamp || ''}"`
        ].join(','));

        // 3. Combine headers and rows into a single string
        let csvContent = headers.join(',') + '\n' + rows.join('\n');

        // 4. Create a Blob and trigger a download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const date = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
            link.setAttribute("href", url);
            link.setAttribute("download", `parking_assignments_${date}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }


    searchBtn.addEventListener('click', () => {
        clearHighlights();
        const searchTerm = searchInput.value.toUpperCase();
        if (!searchTerm) {
            alert('Enter a VIN or slot number to search.');
            return;
        }
        const slots = JSON.parse(localStorage.getItem('parkingLotSlots')) || [];
        const foundSlot = slots.find(s => s.slot === searchTerm || s.vin === searchTerm);
        if (foundSlot) {
            const slotElement = document.getElementById(`slot-${foundSlot.slot}`);
            if (slotElement) {
                slotElement.classList.add('highlight');
                slotElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            alert(`No slot or VIN found for "${searchTerm}".`);
        }
    });

    function clearAllData() {
        if (confirm("Are you sure you want to delete all data? This action cannot be undone.")) {
            localStorage.removeItem('parkingMapInputs');
            localStorage.removeItem('parkingLotSlots');
            createEmptyGrid();
            loadInputs();
            updateVinTable();
        }
    }
    
    // Initial setup on page load
    createEmptyGrid();
    loadInputs();
    updateGrids();

    // Attach event listeners
    generateBtn.addEventListener('click', updateGrids);
    updateStatusBtn.addEventListener('click', saveStatus);
    clearVinBtn.addEventListener('click', clearVin); 
    clearAllBtn.addEventListener('click', clearAllData);
    exportCsvBtn.addEventListener('click', exportToCsv);
});