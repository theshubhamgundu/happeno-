const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('C:\\Users\\gkaru\\Downloads\\SummerSaaS 2026 _ Problem Statement Bank.html', 'utf-8');
const $ = cheerio.load(html);

const problemStatementsByTrack = {};
let count = 0;

$('tr').each((i, el) => {
  const tds = $(el).find('td');
  if (tds.length >= 4) {
    const trackBadge = $(tds[0]).find('span').last().text().trim(); 
    
    // Fallback if the badge wasn't found properly
    const trackCellText = $(tds[0]).text().trim(); 
    const trackName = trackBadge || trackCellText.replace('Track', '').trim();

    if (trackName && trackName !== 'Track' && trackName !== '') {
      const psTitleAndDesc = $(tds[1]).text().trim();
      const mvpScope = $(tds[2]).text().trim(); // Column 2 is MVP scope
      
      // Clean up track name to match constants
      let cleanTrack = trackName;
      if (cleanTrack.includes('SaaSsum') || cleanTrack.includes('Saasum')) cleanTrack = 'SaaSsum AI (IT & AI)';
      else if (cleanTrack.includes('Maceco')) cleanTrack = 'Maceco (Analytics)';
      else if (cleanTrack.includes('Tobofu')) cleanTrack = 'Tobofu (Marketing)';
      else if (cleanTrack.includes('Promtal')) cleanTrack = 'Promtal (HR Tech)';
      else if (cleanTrack.includes('Skill Tank')) cleanTrack = 'Skill Tank (EdTech)';
      else if (cleanTrack.includes('Vriddhi')) cleanTrack = 'Vriddhi (FinTech)';
      
      if (!problemStatementsByTrack[cleanTrack]) {
        problemStatementsByTrack[cleanTrack] = [];
      }
      
      if (!psTitleAndDesc.includes('${p.description}') && psTitleAndDesc.length > 5) {
        problemStatementsByTrack[cleanTrack].push({ statement: psTitleAndDesc, mvp: mvpScope });
        count++;
      }
    }
  }
});

let output = 'export const EXTENDED_PROBLEM_STATEMENTS: Record<string, {statement: string, mvp: string}[]> = {\n';

for (const track in problemStatementsByTrack) {
  output += `    "${track}": [\n`;
  for (const item of problemStatementsByTrack[track]) {
    const stmt = item.statement.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const mvp = item.mvp.replace(/"/g, '\\"').replace(/\n/g, ' ');
    output += `        { statement: "${stmt}", mvp: "${mvp}" },\n`;
  }
  output += `    ],\n`;
}

output += '};\n';

fs.writeFileSync('new_constants.ts', output);
console.log('Parsed successfully! Found ' + count + ' statements.');
