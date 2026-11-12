const { execSync } = require('child_process');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlFile = 'file:///' + path.resolve('scratch/preview_sheet.html').replace(/\\/g, '/');
const outFile = path.resolve('scratch/sheet_rendered.png');

const cmd = `"${edgePath}" --headless --disable-gpu --hide-scrollbars --window-size=1024,1442 --screenshot="${outFile}" "${htmlFile}"`;
console.log('Running:', cmd);
execSync(cmd);
console.log('Saved to', outFile);
