const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function extractFromFullTranscript() {
  const transcriptPath = 'C:/Users/QC/.gemini/antigravity/brain/1ab49219-98b9-4c8c-9a81-ec28a35da8d4/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  // Let's find all steps where view_file on admission/page.tsx occurred before step 10681
  let views = {};

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.step_index < 10681 && obj.content && typeof obj.content === 'string' && obj.content.includes('File Path: `file:///C:/Users/QC/.gemini/antigravity/scratch/school-management-system/apps/web/src/app/dashboard/admission/page.tsx`')) {
        views[obj.step_index] = obj.content;
      }
    } catch (e) {}
  }

  console.log('Available view steps before 10681:', Object.keys(views));

  // Let's check the lines from steps 2341, 2343, 2347, 2349, 2351, 2355, 2359, 2372, 2382 or 4109-4117
  // Let's parse each slice
  let linesMap = new Map();

  // Parse slice helper
  function parseSlice(content) {
    const lines = content.split('\n');
    for (const l of lines) {
      const m = l.match(/^(\d+):\s(.*)$/);
      if (m) {
        linesMap.set(parseInt(m[1]), m[2]);
      }
    }
  }

  // Load from steps 2341 to 2382
  [2341, 2343, 2347, 2349, 2351, 2355, 2359, 2372, 2382].forEach(step => {
    if (views[step]) parseSlice(views[step]);
  });

  console.log('Reconstructed lines count from step 23xx:', linesMap.size);

  // Now apply replacements from 4104, 4106, 4118, 4120, 4385, 4389, 8506
  // Or let's see if 4109-4117 or 10674-10678 has lines
  [10674, 10676, 10678].forEach(step => {
    // Note: step 10674, 10676, 10678 was before step 10681!
    if (views[step]) parseSlice(views[step]);
  });

  console.log('Total reconstructed lines with 1067x:', linesMap.size);

  // Let's build full content
  const maxLine = Math.max(...Array.from(linesMap.keys()));
  console.log('Max line:', maxLine);

  let fullLines = [];
  let missing = [];
  for (let i = 1; i <= maxLine; i++) {
    if (linesMap.has(i)) {
      fullLines.push(linesMap.get(i));
    } else {
      missing.push(i);
      fullLines.push(`// MISSING LINE ${i}`);
    }
  }

  console.log('Missing lines:', missing.length, missing);
  fs.writeFileSync(path.join(__dirname, 'reconstructed_admission.tsx'), fullLines.join('\n'), 'utf8');
  console.log('Saved reconstructed_admission.tsx');
}

extractFromFullTranscript();
