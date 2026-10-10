const fs = require('fs');
const path = require('path');

let code = fs.readFileSync(path.join(__dirname, 'reconstructed_admission.tsx'), 'utf8');

// Check step 8506: fatherOccupation, motherOccupation, prevSchoolName, prevGpa
const match8506 = JSON.parse(fs.readFileSync(path.join(__dirname, 'match_16_step_8506.json'), 'utf8'));
const target8506 = match8506.tc.args.TargetContent;
const repl8506 = match8506.tc.args.ReplacementContent;

if (code.includes(target8506)) {
  code = code.replace(target8506, repl8506);
  console.log('Applied step 8506 update');
} else if (code.includes(repl8506)) {
  console.log('Step 8506 update is already present');
} else {
  console.log('Step 8506 target not found directly, checking studentData');
}

// Check other matches
for (let i = 10; i <= 15; i++) {
  try {
    const f = fs.readdirSync(__dirname).find(name => name.startsWith(`match_${i}_`));
    if (f) {
      const match = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
      const args = match.tc.args || match.tc.parameters;
      if (args && args.TargetContent && code.includes(args.TargetContent)) {
        code = code.replace(args.TargetContent, args.ReplacementContent);
        console.log(`Applied match ${i}`);
      }
    }
  } catch (e) {}
}

fs.writeFileSync('C:/Users/QC/.gemini/antigravity/scratch/school-management-system/apps/web/src/app/dashboard/admission/page.tsx', code, 'utf8');
console.log('Restored previous admission page to src/app/dashboard/admission/page.tsx, length:', code.length);
