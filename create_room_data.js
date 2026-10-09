const fs = require('fs');
const mapping = {};
const lines = fs.readFileSync('C:\\\\Users\\\\gkaru\\\\Downloads\\\\participant_room_allocation.csv', 'utf8').split('\n').filter(l => l.trim());
lines.shift();
for (const line of lines) {
  const firstComma = line.indexOf(',');
  if (firstComma > -1) {
    const team = line.substring(0, firstComma).trim().toUpperCase();
    const room = line.substring(firstComma + 1).trim().replace(/^"|"$/g, '');
    if (team && room) mapping[team] = room;
  }
}
let code = 'export const ROOM_ALLOCATIONS: Record<string, string> = {\n';
for (const [team, room] of Object.entries(mapping)) {
  code += `  '${team}': '${room}',\n`;
}
code += '};\n';
fs.mkdirSync('C:\\Users\\gkaru\\Downloads\\tricity--main\\tricity--main\\lib', { recursive: true });
fs.writeFileSync('C:\\Users\\gkaru\\Downloads\\tricity--main\\tricity--main\\lib\\roomData.ts', code);
console.log('Created lib/roomData.ts');
