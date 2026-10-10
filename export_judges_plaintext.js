const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('C:\\Users\\gkaru\\Downloads\\evaluators_list.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

let currentId = 101;
let csv = 'Name,Login ID,Password (Mobile Number)\n';

for (const row of rows) {
  const name = row['Name'];
  const contact = String(row['Contact']).trim();
  if (!name || !contact) continue;

  const generated_id = `TCJ-${currentId++}`;
  csv += `"${name}",${generated_id},${contact}\n`;
}

fs.writeFileSync('C:\\Users\\gkaru\\Downloads\\tricity--main\\tricity--main\\judges_login_details.csv', csv);
console.log('Created judges_login_details.csv');
