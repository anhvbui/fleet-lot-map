
document.addEventListener('DOMContentLoaded', (event) => {
  const employeeGrid = document.getElementById('employee-parking-grid');
  const fleetGrid = document.getElementById('fleet-parking-grid');
  
  const numEmployeeRows = 1;
  const numEmployeeCols = 28;

  const numFleetRows = 19;
  const numFleetCols = 13;

  for (let row = 1; row <= numEmployeeRows; row++) {
  
    const rowContainer = document.createElement('div');
    rowContainer.className = 'd-flex mb-1'; 


    for (let col = 1; col <= numEmployeeCols; col++) {
      const slot = document.createElement('div');
      slot.className = 'employee-slot bg-success text-white';
      slot.textContent = `${row},${col}`;
      
      rowContainer.appendChild(slot);
    }
    
    employeeGrid.appendChild(rowContainer);
  }

  for (let row = 1; row <= numFleetRows; row++) {
  
    const rowContainer = document.createElement('div');
    rowContainer.className = 'd-flex mb-1'; 


    for (let col = 1; col <= numFleetCols; col++) {
      const slot = document.createElement('div');
      slot.className = 'fleet-slot bg-success text-white';
      slot.textContent = `${row},${col}`;
      
      rowContainer.appendChild(slot);
    }
    
    fleetGrid.appendChild(rowContainer);
  }
});