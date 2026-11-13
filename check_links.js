const fs = require('fs');
['index.html', 'editaveis.html'].forEach(f => {
    const c = fs.readFileSync(f, 'utf8');
    const links = c.match(/href=["'][^"']+\.html["']/g) || [];
    console.log(`=== ${f} ===`);
    console.log([...new Set(links)].sort().join('\n'));
});
