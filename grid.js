document.addEventListener('DOMContentLoaded', (event) => {
        const parkingGridContainer = document.getElementById('parking-grids-container');
        const generateBtn = document.getElementById('generateBtn');

        const numRows = 20;
        const numCols = 13;

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

        // Function to color the grids based on user input
        function updateGrids() {
            // Remove previous zone borders first (keep availability colors if any)
            const allSlots = document.querySelectorAll('.parking-slot');
            allSlots.forEach(slot => {
                slot.classList.remove('employee-slot', 'fleet-slot'); // Only remove zone classes
            });

            // Get all input values and parse them
            const zones = [
                {
                    startSlot: document.getElementById('employeeStart').value,
                    endSlot: document.getElementById('employeeEnd').value,
                    zoneClass: 'employee-slot' // Renamed from className to avoid conflict
                },
                {
                    startSlot: document.getElementById('fleetAStart').value,
                    endSlot: document.getElementById('fleetAEnd').value,
                    zoneClass: 'fleet-slot'
                },
                {
                    startSlot: document.getElementById('fleetBStart').value,
                    endSlot: document.getElementById('fleetBEnd').value,
                    zoneClass: 'fleet-slot'
                },
                {
                    startSlot: document.getElementById('fleetCStart').value,
                    endSlot: document.getElementById('fleetCEnd').value,
                    zoneClass: 'fleet-slot'
                }
            ];

            // Loop through each zone and apply its border style
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
                            // Add the zone class without removing existing classes like 'empty-slot'
                            slot.classList.add(zone.zoneClass); 
                            // Example: If you wanted to set initial availability, you could do:
                            // slot.classList.add('available'); 
                        }
                    }
                }
            });
        }

        // Initial page setup
        createEmptyGrid();
        generateBtn.addEventListener('click', updateGrids);
        
        // Call updateGrids initially to show zones with default inputs
        updateGrids(); 
    });