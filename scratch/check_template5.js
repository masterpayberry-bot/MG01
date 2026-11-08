const fs = require('fs');
// Let's check if there is an image in assets/Template 5-yA6ieAmU.png
const stats = fs.statSync('assets/Template 5-yA6ieAmU.png');
console.log('Size of Template 5:', stats.size);
fs.copyFileSync('assets/Template 5-yA6ieAmU.png', 'C:/Users/MG/.gemini/antigravity/brain/54a19af0-efae-4a93-84b0-e872759b2853/art_template_5.png');
console.log('Copied to artifacts');
