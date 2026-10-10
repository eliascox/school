const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function findPreviousAdmission() {
  const transcriptPath = 'C:/Users/QC/.gemini/antigravity/brain/1ab49219-98b9-4c8c-9a81-ec28a35da8d4/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let writeCalls = [];
  let viewCalls = [];

  for await (const line of rl) {
    if (line.includes('admission') && line.includes('page.tsx')) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          for (const tc of obj.tool_calls) {
            if (tc.name === 'write_to_file' && tc.parameters && tc.parameters.TargetFile && tc.parameters.TargetFile.endsWith('page.tsx') && tc.parameters.TargetFile.includes('admission')) {
              writeCalls.push({ step: obj.step_index, code: tc.parameters.CodeContent });
            }
          }
        }
        if (obj.content && typeof obj.content === 'string' && obj.content.includes('File Path: `file:///C:/Users/QC/.gemini/antigravity/scratch/school-management-system/apps/web/src/app/dashboard/admission/page.tsx`')) {
          viewCalls.push({ step: obj.step_index, output: obj.content });
        }
      } catch (e) {}
    }
  }

  console.log('writeCalls count:', writeCalls.length);
  console.log('viewCalls count:', viewCalls.length);

  writeCalls.forEach((wc, i) => {
    fs.writeFileSync(path.join(__dirname, `write_admission_${i}.tsx`), wc.code, 'utf8');
    console.log(`Saved write_admission_${i}.tsx from step ${wc.step}`);
  });

  viewCalls.forEach((vc, i) => {
    fs.writeFileSync(path.join(__dirname, `view_admission_${i}.txt`), vc.output, 'utf8');
    console.log(`Saved view_admission_${i}.txt from step ${vc.step}`);
  });
}

findPreviousAdmission();
