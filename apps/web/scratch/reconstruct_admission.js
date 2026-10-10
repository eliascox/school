const fs = require('fs');
const path = require('path');

// Read all match files
const files = fs.readdirSync(__dirname).filter(f => f.startsWith('match_') && f.endsWith('.json'));
files.sort((a, b) => {
  const numA = parseInt(a.split('_')[1]);
  const numB = parseInt(b.split('_')[1]);
  return numA - numB;
});

let currentCode = '';

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
  console.log(`Processing match ${f} (step ${data.step}, tool: ${data.tc.name})`);
  
  if (data.step > 8506) {
    console.log(`Stopping before step ${data.step}`);
    break;
  }

  const tc = data.tc;
  if (tc.name === 'write_to_file') {
    if (tc.parameters && tc.parameters.TargetFile && tc.parameters.TargetFile.endsWith('admission\\page.tsx') || (tc.args && tc.args.TargetFile && tc.args.TargetFile.endsWith('admission\\page.tsx'))) {
      currentCode = (tc.parameters ? tc.parameters.CodeContent : tc.args.CodeContent) || currentCode;
      console.log(`Updated currentCode from write_to_file at step ${data.step}, length: ${currentCode.length}`);
    }
  } else if (tc.name === 'replace_file_content') {
    const args = tc.parameters || tc.args;
    if (args && args.TargetFile && args.TargetFile.includes('admission')) {
      const target = args.TargetContent;
      const repl = args.ReplacementContent;
      if (currentCode.includes(target)) {
        currentCode = currentCode.replace(target, repl);
        console.log(`Applied replace_file_content at step ${data.step}`);
      } else {
        console.log(`Warning: TargetContent not found in currentCode at step ${data.step}`);
      }
    }
  }
}

const outputPath = path.join(__dirname, 'reconstructed_admission_prev.tsx');
fs.writeFileSync(outputPath, currentCode, 'utf8');
console.log(`Saved reconstructed file to ${outputPath}, length: ${currentCode.length}`);
