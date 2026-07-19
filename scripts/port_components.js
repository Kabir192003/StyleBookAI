const fs = require('fs');
const path = require('path');

const srcDir = '/Users/kabirsharma/.gemini/antigravity-ide/scratch/stylebook-landing/src/components';
const destDir = '/Users/kabirsharma/Downloads/stylebookai wf/components/landing';

fs.mkdirSync(destDir, { recursive: true });

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  let content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  content = '"use client";\n\n' + content;
  content = content.replace(/from '\.\.\/utils\/constants'/g, "from '@/lib/landing/constants'");
  
  const destPath = path.join(destDir, file.replace('.jsx', '.tsx'));
  fs.writeFileSync(destPath, content);
});
console.log('Components ported!');
