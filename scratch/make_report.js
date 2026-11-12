const fs = require('fs');
const path = require('path');

// Let's check what images are in scratch/crops
const dir = path.resolve('scratch/crops');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
console.log('Crops found:', files.length);

// Let's create an HTML visual report that puts all crops in a webpage so we can view them all!
let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>CRLV Comparison Report</title>
<style>
body { background: #1a1a1a; color: #fff; font-family: sans-serif; padding: 20px; }
.card { background: #262626; border-radius: 8px; margin-bottom: 24px; padding: 16px; }
.card h3 { margin-top: 0; color: #00dc82; }
.img-container { display: flex; gap: 20px; align-items: flex-start; }
.img-box { text-align: center; }
.img-box img { border: 1px solid #444; background: #fff; }
.labels { display: flex; justify-content: space-around; font-size: 13px; font-weight: bold; margin-bottom: 8px; }
</style>
</head>
<body>
<h1>CRLV Visual Comparison: Target (Left) vs Rendered (Right)</h1>
`;

files.sort().forEach(f => {
    html += `
    <div class="card">
        <h3>${f.replace('.png', '')}</h3>
        <div class="labels">
            <span style="color:#4da6ff;">⬅ ORIGINAL (TARGET)</span>
            <span style="color:#ff6666;">RENDERED (CURRENT) ➡</span>
        </div>
        <div class="img-box">
            <img src="crops/${f}" />
        </div>
    </div>
    `;
});

html += `</body></html>`;
fs.writeFileSync(path.resolve('scratch/comparison_report.html'), html);
console.log('Report generated at scratch/comparison_report.html');
