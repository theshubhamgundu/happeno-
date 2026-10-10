const fs = require('fs');

const appendData = `
"Revanth",TRJ-104,"(Password you set in dashboard)"
"Mahesh",TRJ-105,"(Password you set in dashboard)"
"Vamshi",TRJ-106,"(Password you set in dashboard)"
"Krishna",TRJ-107,"(Password you set in dashboard)"
"Sai",TRJ-108,"(Password you set in dashboard)"
`.trim();

fs.appendFileSync('public/judges_login_details.csv', '\n' + appendData + '\n');
console.log('Appended to CSV.');
