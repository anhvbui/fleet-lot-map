document.addEventListener('DOMContentLoaded', () => {
    // This function will check repeatedly until Firebase is ready.
    const waitForFirebase = setInterval(() => {
        if (window.database && window.dbFunctions) {
            clearInterval(waitForFirebase); // Stop checking
            runApp(); // Run the main application logic
        }
    }, 100); // Check every 100ms
});

function runApp() {
    // --- Firebase & App Globals ---
    const { ref, set, get, onValue } = window.dbFunctions;
    const db = window.database;
    let parkingLotSlots = []; // This is the local "state" of the app.

    // --- Element Selectors ---
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
    const searchInput = document.querySelector('.form-control[placeholder="Enter VIN number..."]');
    const searchBtn = document.getElementById('search-btn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const updateStatusBtn = document.getElementById('updateStatusBtn');
    const hubReworkStatusEl = document.getElementById('hubReworkStatus');
    const gaReworkStatusEl = document.getElementById('GAReworkStatus');
    const chargingStatusEl = document.getElementById('chargingStatus');
    const exportCsvBtn = document.getElementById('exportCsvBtn');

    // --- Firebase Database References ---
    const inputsRef = ref(db, 'parkingMap/inputs');
    const slotsRef = ref(db, 'parkingMap/slots');

    // --- Utility Functions ---
    const letterToNumber = (letter) => letter.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    
    const parseSlotInput = (slotString) => {
        const letterMatch = slotString.match(/[a-zA-Z]+/);
        const numMatch = slotString.match(/\d+/);
        if (!letterMatch || !numMatch) return null;
        return {
            row: parseInt(numMatch[0], 10),
            col: letterToNumber(letterMatch[0]),
        };
    };

    const displayMessage = (message, type = 'success') => {
        actionMessageEl.className = `text-${type} text-center fw-bold mb-2`;
        actionMessageEl.textContent = message;
        setTimeout(() => (actionMessageEl.textContent = ''), 3000);
    };

    // --- Core Application Logic ---

    function createEmptyGrid() {
        parkingGridContainer.innerHTML = '';
        const rowContainer = document.createElement('div');
        rowContainer.className = 'd-flex flex-column align-items-center w-100';
        for (let row = 40; row >= 1; row--) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'd-flex mb-1 empty-grid-row';
            for (let col = 1; col <= 20; col++) {
                const colLetter = String.fromCharCode('A'.charCodeAt(0) + col - 1);
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

    function updateUI() {
        const assignments = Array.isArray(parkingLotSlots) ? parkingLotSlots : Object.values(parkingLotSlots);
        vinTableBody.innerHTML = '';
        let occupiedCount = 0;
        let totalSlots = 0;

        // First, reset all slots to a default empty state
        document.querySelectorAll('.parking-slot').forEach(slot => {
            slot.className = 'parking-slot empty-slot';
        });

        assignments.forEach(assignment => {
            if (assignment.zone !== 'Employee') {
                totalSlots++;
                if (assignment.vin) occupiedCount++;
            }
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${assignment.line}</td><td>${assignment.zone}</td><td>${assignment.slot}</td>
                <td>${assignment.vin || ''}</td><td>${assignment.hubRework || ''}</td>
                <td>${assignment.gaRework || ''}</td><td>${assignment.chargingStatus || ''}</td>
                <td>${assignment.timestamp || ''}</td>
            `;
            vinTableBody.appendChild(row);

            const slotElement = document.getElementById(`slot-${assignment.slot}`);
            if (slotElement) {
                // Determine the zone class based on the 'zone' property
                const zonePrefix = assignment.zone === 'Employee' ? 'employee' : `fleet${assignment.zone}`;
                
                // CORRECTED LINE: Removed .toLowerCase() to match CSS exactly
                const zoneClass = `${zonePrefix}-slot`;

                // Set ALL classes at once for a clean update
                slotElement.className = 'parking-slot'; // Start fresh
                slotElement.classList.add(zoneClass); // Add the zone border
                slotElement.classList.add(assignment.vin ? 'occupied' : 'available'); // Add the status background
            }
        });
        availSummary.textContent = `Occupied: ${occupiedCount} | Available: ${totalSlots - occupiedCount}`;
    }

    async function loadAndApplyInputs() {
        const snapshot = await get(inputsRef);
        if (snapshot.exists()) {
            const inputs = snapshot.val();
            Object.keys(inputs).forEach(key => {
                const element = document.getElementById(key);
                if(element) element.value = inputs[key] || '';
            });
            console.log("Zone inputs loaded from Firebase.");
        } else {
            console.log("No zone inputs found. Using default values.");
        }
    }

    async function updateGrids() {
        const inputs = {
            employeeStart: document.getElementById('employeeStart').value, employeeEnd: document.getElementById('employeeEnd').value,
            fleetAStart: document.getElementById('fleetAStart').value, fleetAEnd: document.getElementById('fleetAEnd').value,
            fleetBStart: document.getElementById('fleetBStart').value, fleetBEnd: document.getElementById('fleetBEnd').value,
            fleetCStart: document.getElementById('fleetCStart').value, fleetCEnd: document.getElementById('fleetCEnd').value,
            fleetDStart: document.getElementById('fleetDStart').value, fleetDEnd: document.getElementById('fleetDEnd').value,
            fleetEStart: document.getElementById('fleetEStart').value, fleetEEnd: document.getElementById('fleetEEnd').value,
            fleetFStart: document.getElementById('fleetFStart').value, fleetFEnd: document.getElementById('fleetFEnd').value,
        };
        await set(inputsRef, inputs);

        const zones = ['Employee', 'A', 'B', 'C', 'D', 'E', 'F'].map(z => {
            const prefix = z === 'Employee' ? 'employee' : `fleet${z}`;
            return {
                name: z,
                startSlot: document.getElementById(`${prefix}Start`).value,
                endSlot: document.getElementById(`${prefix}End`).value,
            };
        });

        let newParkingLotSlots = [];
        let lineNumber = 1;
        const slotsArray = Array.isArray(parkingLotSlots) ? parkingLotSlots : Object.values(parkingLotSlots);

        zones.forEach(zone => {
            const startCoords = parseSlotInput(zone.startSlot);
            const endCoords = parseSlotInput(zone.endSlot);
            if (!startCoords || !endCoords) return;

            const [startRow, endRow] = [Math.min(startCoords.row, endCoords.row), Math.max(startCoords.row, endCoords.row)];
            const [startCol, endCol] = [Math.min(startCoords.col, endCoords.col), Math.max(startCoords.col, endCoords.col)];

            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    const colLetter = String.fromCharCode('A'.charCodeAt(0) + col - 1);
                    const slotName = `${colLetter}${row}`;
                    const existingData = slotsArray.find(s => s.slot === slotName);
                    newParkingLotSlots.push({
                        line: lineNumber++,
                        slot: slotName,
                        zone: zone.name,
                        vin: existingData?.vin || '',
                        hubRework: existingData?.hubRework || '',
                        gaRework: existingData?.gaRework || '',
                        chargingStatus: existingData?.chargingStatus || '',
                        timestamp: existingData?.timestamp || '',
                    });
                }
            }
        });
        
        await set(slotsRef, newParkingLotSlots);
        displayMessage('Parking map generated and saved!', 'success');
    }
    
    // --- Event Handler Functions ---
    
    async function assignVin() {
        const slotInput = vinSlotInput.value.toUpperCase();
        const vinInput = vinNumberInput.value.toUpperCase();
        if (!slotInput || !vinInput) return;

        const updatedSlots = [...parkingLotSlots];
        const targetSlot = updatedSlots.find(s => s.slot === slotInput);

        if (targetSlot) {
            targetSlot.vin = vinInput;
            targetSlot.timestamp = new Date().toLocaleString();
            await set(slotsRef, updatedSlots);
            displayMessage(`VIN assigned to ${slotInput}.`, 'success');
            vinSlotInput.value = '';
            vinNumberInput.value = '';
        } else {
            alert(`Slot ${slotInput} is not a valid zone.`);
        }
    }

    async function clearVin() {
        const slotInput = vinSlotInput.value.toUpperCase();
        if (!slotInput) return;

        const updatedSlots = [...parkingLotSlots];
        const targetSlot = updatedSlots.find(s => s.slot === slotInput);

        if (targetSlot) {
            targetSlot.vin = '';
            targetSlot.timestamp = '';
            targetSlot.hubRework = '';
            targetSlot.gaRework = '';
            targetSlot.chargingStatus = '';
            await set(slotsRef, updatedSlots);
            displayMessage(`VIN cleared from ${slotInput}.`, 'success');
            vinSlotInput.value = '';
        } else {
            alert(`Slot ${slotInput} not found.`);
        }
    }

    async function saveStatus() {
        const vinToUpdate = vinStatusInput.value.toUpperCase();
        if (!vinToUpdate) return displayMessage('Enter a VIN to update.', 'error');

        const updatedSlots = [...parkingLotSlots];
        const targetSlot = updatedSlots.find(s => s.vin && s.vin.toUpperCase() === vinToUpdate);
        if (!targetSlot) return displayMessage(`VIN "${vinToUpdate}" not found.`, 'error');
        
        const hubStatus = hubReworkStatusEl.options[hubReworkStatusEl.selectedIndex].value;
        const gaStatus = gaReworkStatusEl.options[gaReworkStatusEl.selectedIndex].value;
        const chargingStatus = chargingStatusEl.options[chargingStatusEl.selectedIndex].value;
        let statusUpdated = false;

        if (hubStatus && hubReworkStatusEl.selectedIndex > 0) { targetSlot.hubRework = hubStatus; statusUpdated = true; }
        if (gaStatus && gaReworkStatusEl.selectedIndex > 0) { targetSlot.gaRework = gaStatus; statusUpdated = true; }
        if (chargingStatus && chargingStatusEl.selectedIndex > 0) { targetSlot.chargingStatus = chargingStatus; statusUpdated = true; }

        if (statusUpdated) {
            await set(slotsRef, updatedSlots);
            displayMessage(`Status updated for VIN ${vinToUpdate}.`, 'success');
            vinStatusInput.value = '';
            hubReworkStatusEl.selectedIndex = 0;
            gaReworkStatusEl.selectedIndex = 0;
            chargingStatusEl.selectedIndex = 0;
        } else {
            displayMessage('No new status selected.', 'error');
        }
    }
    
    async function clearAllData() {
        if (confirm("Are you sure you want to clear all VINs and statuses? This cannot be undone.")) {
            // Ensure we're working with an array before calling .map()
            const slotsArray = Array.isArray(parkingLotSlots) ? parkingLotSlots : Object.values(parkingLotSlots);

            const clearedSlots = slotsArray.map(slot => ({
                ...slot,
                vin: '', 
                hubRework: '', 
                gaRework: '', 
                chargingStatus: '', 
                timestamp: ''
            }));
            
            await set(slotsRef, clearedSlots);
            displayMessage('All VIN and status data cleared.', 'success');
        }
    }

    function search() {
        document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
        const searchTerm = searchInput.value.toUpperCase();
        if (!searchTerm) return;
        
        const foundSlot = parkingLotSlots.find(s => s.slot === searchTerm || (s.vin && s.vin.toUpperCase() === searchTerm));
        if (foundSlot) {
            const slotElement = document.getElementById(`slot-${foundSlot.slot}`);
            if (slotElement) {
                slotElement.classList.add('highlight');
                slotElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            alert(`No slot or VIN found for "${searchTerm}".`);
        }
    }

    function exportToCsv() {
        if (!parkingLotSlots || parkingLotSlots.length === 0) return alert('No data to export.');

        const headers = ["Line", "Zone", "Slot", "VIN", "Hub Rework Status", "GA Rework Status", "Charging Status", "Timestamp"];
        const rows = parkingLotSlots.map(slot =>
            [
                slot.line, slot.zone, slot.slot, `"${slot.vin || ''}"`, `"${slot.hubRework || ''}"`,
                `"${slot.gaRework || ''}"`, `"${slot.chargingStatus || ''}"`, `"${slot.timestamp || ''}"`
            ].join(',')
        );
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const date = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `parking_assignments_${date}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- REAL-TIME DATABASE LISTENER ---
    onValue(slotsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            // This line ensures parkingLotSlots is ALWAYS an array, fixing both buttons.
            parkingLotSlots = Array.isArray(data) ? data : Object.values(data);
        } else {
            parkingLotSlots = [];
        }
        console.log("Real-time data synced from Firebase.");
        updateUI();
    });

    // --- INITIAL PAGE LOAD & EVENT LISTENERS ---
    async function initialLoad() {
        createEmptyGrid();
        await loadAndApplyInputs();
        
        const slotSnapshot = await get(slotsRef);
        if (!slotSnapshot.exists()) {
            console.log("No existing slot data found. Generating initial map.");
            await updateGrids(); 
        }
    }

    initialLoad();

    generateBtn.addEventListener('click', updateGrids);
    assignVinBtn.addEventListener('click', assignVin);
    clearVinBtn.addEventListener('click', clearVin);
    updateStatusBtn.addEventListener('click', saveStatus);
    clearAllBtn.addEventListener('click', clearAllData);
    searchBtn.addEventListener('click', search);
    exportCsvBtn.addEventListener('click', exportToCsv);
}