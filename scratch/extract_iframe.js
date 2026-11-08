const fs = require('fs');
const content = fs.readFileSync('criar-cnh.html', 'utf8');
const start = content.indexOf('<iframe id="cnhEditorIframe" srcdoc="');
if (start !== -1) {
  const end = content.indexOf('</iframe>', start);
  const srcdocRaw = content.slice(start + '<iframe id="cnhEditorIframe" srcdoc="'.length, end);
  // remove trailing " ... title=...
  const quoteEnd = srcdocRaw.lastIndexOf('" title="Editor CNH"');
  const iframeHtml = srcdocRaw.slice(0, quoteEnd)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
  console.log('Iframe HTML length:', iframeHtml.length);
  fs.writeFileSync('scratch/iframe_template.html', iframeHtml);
  console.log('Saved scratch/iframe_template.html');
}
