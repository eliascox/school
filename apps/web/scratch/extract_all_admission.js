const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function extractAllAdmissionChanges() {
  const transcriptPath = 'C:/Users/QC/.gemini/antigravity/brain/1ab49219-98b9-4c8c-9a81-ec28a35da8d4/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let allMatches = [];

  for await (const line of rl) {
    if (line.includes('admission') && (line.includes('replace_file_content') || line.includes('write_to_file') || line.includes('generate'))) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          for (const tc of obj.tool_calls) {
            const str = JSON.stringify(tc);
            if (str.includes('admission/page.tsx') || str.includes('generate_admission')) {
              allMatches.push({ step: obj.step_index, tc });
            }
          }
        }
      } catch (e) {}
    }
  }

  console.log('Matches count:', allMatches.length);
  allMatches.forEach((m, idx) => {
    fs.writeFileSync(path.join(__dirname, `match_${idx}_step_${m.step}.json`), JSON.stringify(m, null, 2), 'utf8');
    console.log(`Saved match_${idx}_step_${m.step}.json (${m.tc.name})`);
  });
}

extractAllAdmissionChanges();
