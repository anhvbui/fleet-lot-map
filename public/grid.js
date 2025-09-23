import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, remove } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD7qC5px8dXI0mbMqpwDh6DzcWc17P64e0",
    authDomain: "yard-app-81e9c.firebaseapp.com",
    projectId: "yard-app-81e9c",
    storageBucket: "yard-app-81e9c.firebasestorage.app",
    messagingSenderId: "736027077936",
    appId: "1:736027077936:web:4a9c49829e6a3d6831acf5",
    measurementId: "G-3NV6NH0Z15"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// STEP 2: CALL runApp() DIRECTLY. REMOVE THE OLD WAITING LOGIC.
runApp();

function runApp() {
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

    // --- HELPER FUNCTION ---
    // Generates a fresh, empty array of slot objects based on the zone inputs.
    function generateFreshMapData() {
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
                    newParkingLotSlots.push({
                        line: lineNumber++,
                        slot: slotName,
                        zone: zone.name,
                        vin: '',
                        hubRework: '',
                        gaRework: '',
                        chargingStatus: '',
                        timestamp: '',
                    });
                }
            }
        });
        return newParkingLotSlots;
    }

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
        createEmptyGrid(); // ADD THIS LINE to completely reset the grid visually

        const assignments = parkingLotSlots; 
        vinTableBody.innerHTML = '';
        let occupiedCount = 0;
        let totalSlots = 0

        assignments.forEach(assignment => {
            if (assignment.zone !== 'Employee') {
                totalSlots++;
                if (assignment.vin) occupiedCount++;
            }
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${assignment.line}</td><td>${assignment.zone || 'N/A'}</td><td>${assignment.slot}</td>
                <td>${assignment.vin || ''}</td><td>${assignment.hubRework || ''}</td>
                <td>${assignment.gaRework || ''}</td><td>${assignment.chargingStatus || ''}</td>
                <td>${assignment.timestamp || ''}</td>
            `;
            vinTableBody.appendChild(row);

            const letter = assignment.slot.match(/[a-zA-Z]+/)[0];
            const number = assignment.slot.match(/\d+/)[0];
            const slotElement = document.getElementById(`slot-${letter}-${number}`);
            
            if (slotElement) {
                // FIX: Gracefully handle assignments that are missing a zone property.
                const hasZone = assignment.zone && typeof assignment.zone === 'string';
                const zonePrefix = hasZone ? (assignment.zone === 'Employee' ? 'employee' : `fleet${assignment.zone}`) : '';
                const zoneClass = hasZone ? `${zonePrefix}-slot` : '';

                slotElement.classList.remove('empty-slot'); // Remove the default gray background

                if (zoneClass) {
                    slotElement.classList.add(zoneClass); // Add the colored zone border
                }

    // Add 'occupied' class if there's a VIN, otherwise add 'available'
    slotElement.classList.add(assignment.vin ? 'occupied' : 'available');
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
                if (element) element.value = inputs[key] || '';
            });
        }
    }

    async function updateGrids() {
        try {
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

            const freshData = generateFreshMapData();
            // Try to preserve existing VINs if possible
            freshData.forEach(newSlot => {
                const oldSlot = parkingLotSlots.find(s => s.slot === newSlot.slot && s.vin);
                if (oldSlot) {
                    newSlot.vin = oldSlot.vin;
                    newSlot.hubRework = oldSlot.hubRework;
                    newSlot.gaRework = oldSlot.gaRework;
                    newSlot.chargingStatus = oldSlot.chargingStatus;
                    newSlot.timestamp = oldSlot.timestamp;
                }
            });

            await set(slotsRef, freshData);
            displayMessage('Parking map generated and saved!', 'success');
        } catch (error) {
            console.error("Error updating grids:", error);
            displayMessage('Failed to save map. Check console.', 'error');
        }
    }
    
    // --- Event Handler Functions ---
    // (assignVin, clearVin, saveStatus, search, exportToCsv functions remain the same as your last version)
    // For brevity, they are omitted here but should be included in your file.
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
        if (confirm("Are you sure you want to delete all zones and slot data? This action cannot be undone.")) {
            try {
                // 1. Delete all slot and VIN data from Firebase
                await remove(slotsRef);

                // 2. Delete all saved zone input data from Firebase
                await remove(inputsRef);

                // 3. Clear the input fields on the page for immediate feedback
                const inputIds = [
                    'employeeStart', 'employeeEnd',
                    'fleetAStart', 'fleetAEnd',
                    'fleetBStart', 'fleetBEnd',
                    'fleetCStart', 'fleetCEnd',
                    'fleetDStart', 'fleetDEnd',
                    'fleetEStart', 'fleetEEnd',
                    'fleetFStart', 'fleetFEnd'
                ];
                inputIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });

                displayMessage('All map and VIN data has been deleted.', 'success');
                
            } catch (error) {
                console.error("Error deleting all data:", error);
                displayMessage('Failed to delete data. See console for details.', 'error');
            }
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
        let freshData = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            let potentialArray = [];
            if (Array.isArray(data)) {
                potentialArray = data;
            } else if (typeof data === 'object' && data !== null) {
                potentialArray = Object.values(data);
            }
            freshData = potentialArray.filter(
                item => typeof item === 'object' && item !== null && item.slot
            );
        }
        parkingLotSlots = freshData;
        console.log("Real-time data synced and validated from Firebase.");
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