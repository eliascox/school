const fs = require('fs');
const path = require('path');

const targetPath = 'C:/Users/QC/.gemini/antigravity/scratch/school-management-system/apps/web/src/app/dashboard/admission/page.tsx';
let code = fs.readFileSync(targetPath, 'utf8');

const match8506 = JSON.parse(fs.readFileSync(path.join(__dirname, 'match_16_step_8506.json'), 'utf8'));
const target8506 = match8506.tc.args.TargetContent;
const repl8506 = match8506.tc.args.ReplacementContent;

if (code.includes(target8506)) {
  code = code.replace(target8506, repl8506);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log('Applied step 8506 replacement successfully');
} else {
  console.log('Target 8506 not matched or already updated');
}
