const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => f.startsWith('view_admission_') && f.endsWith('.txt'));
console.log('view files count:', files.length);

files.forEach(f => {
  const content = fs.readFileSync(path.join(__dirname, f), 'utf8');
  console.log(f, 'size:', content.length, 'first line:', content.slice(0, 150).replace(/\n/g, ' '));
});
