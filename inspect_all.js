const fs = require('fs');
const readline = require('readline');

async function run() {
  const fileStream = fs.createReadStream('C:/Users/MG/.gemini/antigravity/brain/1671ab8c-2ad2-4d0e-90ff-4146a1cc7618/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  let lineIdx = 0;
  for await (const line of rl) {
    lineIdx++;
    if (line.includes('data:image/')) {
      try {
        const obj = JSON.parse(line);
        if (obj.type === 'USER_INPUT') {
          console.log('\n--- USER_INPUT at line', lineIdx, '---');
          const text = obj.content || '';
          console.log('Text start:', text.slice(0, 100));
          const regex = /data:image\/([a-zA-Z]+);base64,([^"'\s>]+)/g;
          let m;
          let imgCount = 0;
          while ((m = regex.exec(text)) !== null) {
            imgCount++;
            const ext = m[1];
            const b64 = m[2].replace(/\\n/g, '').replace(/\\r/g, '').replace(/\\"/g, '').replace(/\\/g, '').trim();
            const buf = Buffer.from(b64, 'base64');
            console.log(`Image #${imgCount} (${ext}): len=${buf.length}`);
            if (ext === 'png' && buf.length >= 24) {
              console.log(`PNG dimensions: ${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`);
            }
            fs.writeFileSync(`extracted_user_img_${lineIdx}_${imgCount}.${ext}`, buf);
          }
        }
      } catch (e) {
        console.error('Error on line', lineIdx, e.message);
      }
    }
  }
}
run();
