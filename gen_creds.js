const fs = require('fs');
const lines = fs.readFileSync('public/judges_login_details.csv', 'utf8').trim().split('\n');
let md = '# Evaluators Login Credentials\n\n';
md += '| ' + lines[0].replace(/,/g, ' | ') + ' |\n';
md += '|---|---|---|\n';
for (let i = 1; i < lines.length; i++) {
  if (lines[i].trim()) {
    md += '| ' + lines[i].replace(/\"/g, '').replace(/,/g, ' | ') + ' |\n';
  }
}
fs.writeFileSync('C:\\Users\\gkaru\\.gemini\\antigravity-ide\\brain\\649f02b2-a501-4ec7-97d3-13ba0b6fc9b8\\evaluators_credentials.md', md);
console.log('Artifact created.');
