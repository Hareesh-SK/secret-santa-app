const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            return reject(new Error(`File not found: ${filePath}`));
        }

        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", () => resolve(results))
            .on("error", (error) => reject(error));
    });
}


function writeCSV(filePath, data) {
    const headers = Object.keys(data[0]);
    const csvContent = [headers.join(","), ...data.map((row) => headers.map((h) => row[h]).join(","))].join("\n");
    fs.writeFileSync(filePath, csvContent);
}

function assignSecretSanta(santas, lastYearAssignments) {
    let receivers = [...santas];

    // Utility function to shuffle an array
    const shuffle = (array) => array.sort(() => Math.random() - 0.5);

    shuffle(receivers);

    let assignments = santas.map((santa, i) => ({
        Employee_Name: santa.Employee_Name,
        Employee_EmailID: santa.Employee_EmailID,
        Secret_Child_Name: receivers[i].Employee_Name,
        Secret_Child_EmailID: receivers[i].Employee_EmailID
    }));

    // Check conflicts
    const hasConflict = assignments.some(pair =>
        pair.Employee_Name === pair.Secret_Child_Name ||
        lastYearAssignments.some(last => 
            last.Employee_Name === pair.Employee_Name && last.Secret_Child_Name === pair.Secret_Child_Name
        )
    );

    return hasConflict ? assignSecretSanta(santas, lastYearAssignments) : assignments; // Recursion instead of loop
}


async function main() {
    try {
        const employeesFilePath = path.join(__dirname, "Employee-List.csv");
        const lastYearFilePath = path.join(__dirname, "Secret-Santa-Game-Result-2024.csv");
        const outputFilePath = path.join(__dirname, "Secret-Santa-Game-Result-2025.csv");

        const employees = await readCSV(employeesFilePath);
        const lastYearAssignments = await readCSV(lastYearFilePath);

        const assignments = assignSecretSanta(employees, lastYearAssignments);
        writeCSV(outputFilePath, assignments);

        console.log(`Secret Santa assignments saved to ${outputFilePath}`);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

// Run the program
main();
