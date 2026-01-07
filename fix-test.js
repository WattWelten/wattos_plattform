const fs = require('fs');
const path = require('path');
const testFile = path.join('packages', 'shared', 'src', '__tests__', 'utils.test.ts');
let content = fs.readFileSync(testFile, 'utf8');
content = content.replace(/test-ÃƒÂ¤ÃƒÂ¶ÃƒÂ¼-Ã¦â€“â€¡Ã¤Â»Â¶\.pdf/g, 'test-Ã¤Ã¶Ã¼-æ–‡ä»¶.pdf');
fs.writeFileSync(testFile, content, 'utf8');
console.log('âœ“ Test-Datei korrigiert');
