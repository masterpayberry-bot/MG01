const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// We can launch Edge headless with --screenshot
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlFile = 'file:///' + path.resolve('criar-crlv.html').replace(/\\/g, '/');
const outFile = path.resolve('scratch/rendered_page.png');

const cmd = `"${edgePath}" --headless --disable-gpu --window-size=1600,1800 --screenshot="${outFile}" "${htmlFile}"`;
console.log('Running:', cmd);
try {
    execSync(cmd);
    console.log('Saved to', outFile);
} catch (e) {
    console.error(e);
}
