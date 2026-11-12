const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlFile = 'file:///' + path.resolve('scratch/measure_pitch.html').replace(/\\/g, '/');
const outFile = path.resolve('scratch/dump_dom.txt');

const cmd = `"${edgePath}" --headless --disable-gpu --dump-dom "${htmlFile}" > "${outFile}"`;
execSync(cmd, { shell: 'cmd.exe' });
console.log(fs.readFileSync(outFile, 'utf8'));
