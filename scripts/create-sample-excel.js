const XLSX = require('xlsx');
const path = require('path');

// Sample data
const sampleData = [
  {
    Name: "John Doe",
    Phone: "+1234567890",
    Email: "john@example.com",
    Position: "Software Developer"
  },
  {
    Name: "Jane Smith", 
    Phone: "9876543210",
    Email: "jane@example.com",
    Position: "Marketing Manager"
  },
  {
    Name: "Bob Johnson",
    Phone: "+1-555-123-4567",
    Email: "bob@company.com", 
    Position: "Sales Representative"
  },
  {
    Name: "Alice Brown",
    Phone: "555-987-6543",
    Email: "alice@example.com",
    Position: "HR Manager"
  },
  {
    Name: "Charlie Wilson",
    Phone: "+1 (555) 456-7890",
    Email: "charlie@company.com",
    Position: "Data Analyst"
  },
  {
    Name: "Diana Prince",
    Phone: "123.456.7890",
    Email: "diana@example.com",
    Position: "Product Manager"
  },
  {
    Name: "Bruce Wayne",
    Phone: "(555) 123-4567",
    Email: "bruce@company.com",
    Position: "Business Analyst"
  },
  {
    Name: "Clark Kent",
    Phone: "5551234567",
    Email: "clark@example.com",
    Position: "UX Designer"
  }
];

// Create workbook
const workbook = XLSX.utils.book_new();

// Create worksheet
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");

// Write file
const outputPath = path.join(__dirname, '..', 'public', 'sample-candidates.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('Sample Excel file created at:', outputPath);
console.log('File contains', sampleData.length, 'sample candidates');
