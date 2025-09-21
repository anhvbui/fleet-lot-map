document.addEventListener('DOMContentLoaded', (event) => {
    const parkingGridContainer = document.getElementById('parking-grids-container');
    const generateBtn = document.getElementById('generateBtn');
    const vinTableBody = document.getElementById('vinTableBody');
    const availSummary = document.getElementById('availSummary');

    const vinSlotInput = document.getElementById('vinSlotInput');
    const vinNumberInput = document.getElementById('vinNumberInput');
    const vinZoneInput = document.getElementById('vinZoneInput'); // Not used, can be removed
    const assignVinBtn = document.getElementById('assignVinBtn');

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('search-btn');

    const numRows = 40;
    const numCols = 20;

    // Helper function to convert a column letter (A, B, C) to a number (1, 2, 3)
    function letterToNumber(letter) {
        return letter.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    }

    // Helper function to parse a slot string like "A20" into coordinates {row: 20, col: 1}
    function parseSlotInput(slotString) {
        const letterMatch = slotString.match(/[a-zA-Z]+/);
        const numMatch = slotString.match(/\d+/);

        if (!letterMatch || !numMatch) {
            console.error(`Invalid slot input: ${slotString}`);
            return null;
        }

        const colLetter = letterMatch[0];
        const rowNumber = parseInt(numMatch[0], 10);
        const colNumber = letterToNumber(colLetter);

        return { row: rowNumber, col: colNumber };
    }

    // Function to create the base empty grid with labels
    function createEmptyGrid() {
        parkingGridContainer.innerHTML = '';
        const rowContainer = document.createElement('div');
        rowContainer.className = 'd-flex flex-column align-items-center w-100';

        // Outer loop for rows (Y-axis) - Bottom to top
        for (let row = numRows; row >= 1; row--) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'd-flex mb-1 empty-grid-row';

            // Inner loop for columns (X-axis) - A to M
            for (let col = 1; col <= numCols; col++) {
                const colLetter = String.fromCharCode('A'.charCodeAt(0) + (col - 1));
                
                const slot = document.createElement('div');
                slot.id = `slot-${colLetter}-${row}`;
                // All slots start as 'empty-slot' with its default background color
                slot.className = 'parking-slot empty-slot'; 
                slot.textContent = `${colLetter}${row}`;
                
                rowDiv.appendChild(slot);
            }
            rowContainer.appendChild(rowDiv);
        }
        parkingGridContainer.appendChild(rowContainer);
    }

    // Save input values from localStorage
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
            // This is where you had an issue in the previous code,
            // using incorrect IDs. Ensure your HTML matches these IDs.
            document.getElementById('employeeStart').value = inputs.employeeStart;
            document.getElementById('employeeEnd').value = inputs.employeeEnd;
            document.getElementById('fleetAStart').value = inputs.fleetAStart;
            document.getElementById('fleetAEnd').value = inputs.fleetAEnd;
            document.getElementById('fleetBStart').value = inputs.fleetBStart;
            document.getElementById('fleetBEnd').value = inputs.fleetBEnd;
            document.getElementById('fleetCStart').value = inputs.fleetCStart;
            document.getElementById('fleetCEnd').value = inputs.fleetCEnd;
            document.getElementById('fleetDStart').value = inputs.fleetDStart;
            document.getElementById('fleetDEnd').value = inputs.fleetDEnd;
            document.getElementById('fleetEStart').value = inputs.fleetEStart;
            document.getElementById('fleetEEnd').value = inputs.fleetEEnd;
            document.getElementById('fleetFStart').value = inputs.fleetFStart;
            document.getElementById('fleetFEnd').value = inputs.fleetFEnd;
        }
    }

    function updateSummary(occupiedCount, total) {
        availSummary.textContent = `Occupied: ${occupiedCount} | Available: ${total - occupiedCount}`;
    }

    // Function to color the grids based on user input
    function updateGrids() {
        // Clear the existing grid before generating a new one
        createEmptyGrid();

        // Load any existing VIN assignments before generating the new list
        const existingAssignments = JSON.parse(localStorage.getItem('parkingLotSlots')) || [];

        const zones = [
            {
                name: 'Employee',
                startSlot: document.getElementById('employeeStart').value,
                endSlot: document.getElementById('employeeEnd').value,
                zoneClass: 'employee-slot'
            },
            {
                name: 'A',
                startSlot: document.getElementById('fleetAStart').value,
                endSlot: document.getElementById('fleetAEnd').value,
                zoneClass: 'fleet-A-slot'
            },
            {
                name: 'B',
                startSlot: document.getElementById('fleetBStart').value,
                endSlot: document.getElementById('fleetBEnd').value,
                zoneClass: 'fleet-B-slot'
            },
            {
                name: 'C',
                startSlot: document.getElementById('fleetCStart').value,
                endSlot: document.getElementById('fleetCEnd').value,
                zoneClass: 'fleet-C-slot'
            },
            {
                name: 'D',
                startSlot: document.getElementById('fleetDStart').value,
                endSlot: document.getElementById('fleetDEnd').value,
                zoneClass: 'fleet-D-slot'
            },
            {
                name: 'E',
                startSlot: document.getElementById('fleetEStart').value,
                endSlot: document.getElementById('fleetEEnd').value,
                zoneClass: 'fleet-E-slot'
            },
            {
                name: 'F',
                startSlot: document.getElementById('fleetFStart').value,
                endSlot: document.getElementById('fleetFEnd').value,
                zoneClass: 'fleet-F-slot'
            }
        ];

        let parkingLotSlots = [];
        let lineNumber = 1;

        zones.forEach(zone => {
            const startCoords = parseSlotInput(zone.startSlot);
            const endCoords = parseSlotInput(zone.endSlot);

            if (!startCoords || !endCoords) {
                console.error('Skipping zone due to invalid input:', zone.startSlot, zone.endSlot);
                return;
            }

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
                        slot.classList.add(zone.zoneClass); 
                        
                        const slotName = `${colLetter}${row}`;
                        const existingSlot = existingAssignments.find(s => s.slot === slotName);

                        parkingLotSlots.push({
                            line: lineNumber,
                            slot: slotName,
                            zone: zone.name,
                            vin: existingSlot ? existingSlot.vin : '',
                            timestamp: existingSlot ? existingSlot.timestamp : ''
                        });
                        
                        lineNumber++;
                    }
                }
            }
        });

        localStorage.setItem('parkingLotSlots', JSON.stringify(parkingLotSlots));
        saveInputs();
        updateVinTable();
    }

    function loadVinAssignments() {
        const storedVins = localStorage.getItem('vinAssignments');
        return storedVins ? JSON.parse(storedVins) : [];
    }

    function saveVinAssignments(assignments) {
        localStorage.setItem('vinAssignments', JSON.stringify(assignments));
    }

    function updateVinTable() {
        const assignments = JSON.parse(localStorage.getItem('parkingLotSlots')) || [];
        vinTableBody.innerHTML = ''; // Clear table
        let occupiedCount = 0;
        let totalSlots = 0;

        assignments.forEach(assignment => {
            totalSlots++;
            if (assignment.vin) {
                occupiedCount++;
            }
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${assignment.line}</td>
                <td>${assignment.zone}</td>
                <td>${assignment.slot}</td>
                <td>${assignment.vin || ''}</td>
                <td>${assignment.timestamp || ''}</td>
            `;
            vinTableBody.appendChild(row);

            const slotElement = document.getElementById(`slot-${assignment.slot}`);
            if (slotElement && assignment.vin) {
                slotElement.classList.add('occupied');
                slotElement.classList.remove('available', 'empty-slot');
            } else if (slotElement) {
                slotElement.classList.add('available');
                slotElement.classList.remove('occupied', 'empty-slot');
            }
        });
        updateSummary(occupiedCount, totalSlots);
    }

    assignVinBtn.addEventListener('click', () => {
        // Correct IDs must be used here
        const slotInput = document.getElementById('vinSlotInput').value.toUpperCase();
        const vinInput = document.getElementById('vinNumberInput').value.toUpperCase();
        
        if (slotInput && vinInput) {
            let slots = JSON.parse(localStorage.getItem('parkingLotSlots')) || [];
            // The `targetSlot` object already contains the zone name
            const targetSlot = slots.find(s => s.slot === slotInput);

            if (targetSlot) {
                // Update the VIN and timestamp for the existing slot
                targetSlot.vin = vinInput;
                targetSlot.timestamp = new Date().toLocaleString();
            } else {
                // Logic for a new, un-zoned slot (if applicable)
                alert(`Slot ${slotInput} is not a part of any defined zone. VIN will not be assigned.`);
                return;
            }

            // Save the updated array back to Local Storage
            localStorage.setItem('parkingLotSlots', JSON.stringify(slots));
            
            // Refresh the table and grid
            updateVinTable();
            
            // Clear input fields
            document.getElementById('vinSlotInput').value = '';
            document.getElementById('vinNumberInput').value = '';
        }
    });

    // Function to clear any existing search highlights
    function clearHighlights() {
        const highlightedSlots = document.querySelectorAll('.highlight');
        highlightedSlots.forEach(slot => {
            slot.classList.remove('highlight');
        });
    }

    // Event listener for the search button
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
            localStorage.removeItem('vinAssignments');
            createEmptyGrid();
            loadInputs();
            updateVinTable();
        }
    }


    // The initial calls to create/update the grid should be moved after the event listeners
    // to ensure the button can trigger the function.
    
    // Initial setup on page load
    createEmptyGrid();
    loadInputs();
    updateGrids(); 
    updateVinTable();

    // Attach event listeners
    generateBtn.addEventListener('click', updateGrids);
    clearAllBtn.addEventListener('click', clearAllData);
    
});