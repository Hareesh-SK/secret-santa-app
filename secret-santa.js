const fs = require('fs');
const csv = require('csv-parser');

// File paths for employee list and last year's results
const employeeFile = './Employee-List.csv';
const lastYearFile = './Secret-Santa-Game-Result-2023.csv';

// Read employee data from CSV
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Secret Santa assignment logic
async function assignSecretSantas() {
  try {
    // Read employee list and previous year's assignments
    const employees = await readCSV(employeeFile);
    const lastYearAssignments = await readCSV(lastYearFile);

    // Map to track last year's Secret Santa pairs for comparison
    const lastYearMap = new Map();
    lastYearAssignments.forEach((entry) => {
      lastYearMap.set(entry.Employee_EmailID, entry.Secret_Child_EmailID);
    });

    // Shuffle array to randomize assignments
    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    // Helper function to check if assignment is valid
    function isValidAssignment(employee, candidate, lastYearMap) {
      return (
        employee.Employee_EmailID !== candidate.Employee_EmailID && // Can't assign themselves
        lastYearMap.get(employee.Employee_EmailID) !== candidate.Employee_EmailID // Not the same as last year
      );
    }

    // Assign Secret Santas
    let secretSantaAssignments = [];
    let unassigned = shuffle([...employees]); // Shuffle the employees

    for (const employee of employees) {
      let assigned = false;
      for (let i = 0; i < unassigned.length; i++) {
        const candidate = unassigned[i];
        if (isValidAssignment(employee, candidate, lastYearMap)) {
          // Valid assignment found
          secretSantaAssignments.push({
            Employee_Name: employee.Employee_Name,
            Employee_EmailID: employee.Employee_EmailID,
            Secret_Child_Name: candidate.Employee_Name,
            Secret_Child_EmailID: candidate.Employee_EmailID,
          });
          unassigned.splice(i, 1); // Remove the assigned employee from the unassigned list
          assigned = true;
          break;
        }
      }

      // Error handling in case no valid assignment is possible
      if (!assigned) {
        throw new Error(`No valid Secret Santa assignment possible for ${employee.Employee_Name}`);
      }
    }

    // Output the results to a new CSV file
    const output = secretSantaAssignments.map((row) => ({
      Employee_Name: row.Employee_Name,
      Employee_EmailID: row.Employee_EmailID,
      Secret_Child_Name: row.Secret_Child_Name,
      Secret_Child_EmailID: row.Secret_Child_EmailID,
    }));

    const csvHeader = 'Employee_Name,Employee_EmailID,Secret_Child_Name,Secret_Child_EmailID\n';
    const csvContent = csvHeader + output.map(row => `${row.Employee_Name},${row.Employee_EmailID},${row.Secret_Child_Name},${row.Secret_Child_EmailID}`).join('\n');

    fs.writeFileSync('./Secret-Santa-Game-Result-2024.csv', csvContent);

    console.log('Secret Santa assignments have been generated successfully!');

  } catch (error) {
    console.error('Error occurred:', error.message);
  }
}

// Start the Secret Santa assignment
assignSecretSantas();
