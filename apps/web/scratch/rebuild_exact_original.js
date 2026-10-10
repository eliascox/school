const fs = require('fs');
const path = require('path');

// Let's inspect each view_admission file to see which line ranges they contain
const viewFiles = ['view_admission_3.txt', 'view_admission_4.txt', 'view_admission_5.txt', 'view_admission_6.txt', 'view_admission_7.txt'];

let allLines = new Map();

for (const vf of viewFiles) {
  const content = fs.readFileSync(path.join(__dirname, vf), 'utf8');
  const lines = content.split('\n');
  let currentFileLines = 0;
  for (const line of lines) {
    // Matches like "750:                       onChange..."
    const match = line.match(/^(\d+):\s?(.*)$/);
    if (match) {
      const lineNum = parseInt(match[1]);
      const lineContent = match[2];
      allLines.set(lineNum, lineContent);
      currentFileLines++;
    }
  }
  console.log(`${vf} parsed ${currentFileLines} lines. Total collected so far: ${allLines.size}`);
}

const maxLine = Math.max(...Array.from(allLines.keys()));
const minLine = Math.min(...Array.from(allLines.keys()));
console.log(`Min line: ${minLine}, Max line: ${maxLine}`);

let reconstructed = [];
let missing = [];

for (let i = 1; i <= maxLine; i++) {
  if (allLines.has(i)) {
    reconstructed.push(allLines.get(i));
  } else {
    missing.push(i);
    reconstructed.push(`// MISSING ${i}`);
  }
}

console.log('Missing count:', missing.length, missing);

const finalCode = reconstructed.join('\n');
fs.writeFileSync('C:/Users/QC/.gemini/antigravity/scratch/school-management-system/apps/web/src/app/dashboard/admission/page.tsx', finalCode, 'utf8');
console.log('Successfully written exact original file to src/app/dashboard/admission/page.tsx, length:', finalCode.length);
