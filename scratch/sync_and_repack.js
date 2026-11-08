const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== SINCRONIZANDO ARQUIVOS MODIFICADOS NOS 3 PROJETOS ===');

const sourceDir = 'c:\\Users\\MG\\Desktop\\MGEditaveis (2)';
const targets = [
    'C:\\Users\\MG\\Desktop\\deploy_vps',
    'C:\\xampp\\htdocs\\mgeditaveis'
];

const filesToSync = [
    'index.html',
    '.htaccess',
    'server.js',
    'admin.html',
    'admin.php',
    'login.html',
    'criar-cnh.html',
    'cnh-editor.html',
    'app/index.html',
    'app/config.json',
    'app/manifest.json',
    'app/manifest.php',
    'habilitacao.html',
    'ver-cnh.html',
    'api/index.php',
    'api/config/index.php',
    'assets/cnh-template-base64.js',
    'app/assets/cnh-template-base64.js',
    'assets/Template 5-yA6ieAmU.png',
    'app/assets/Template 5-yA6ieAmU.png',
    'assets/template-cnh.png',
    'app/assets/template-cnh.png',
    'uploads/logos/.gitkeep',
    'uploads/fotos/.gitkeep',
    'uploads/cnhs/.gitkeep'
];

filesToSync.forEach(file => {
    const src = path.join(sourceDir, file);
    if (!fs.existsSync(src)) {
        console.warn(`[WARN] Arquivo ${file} não existe na origem!`);
        return;
    }
    const content = fs.readFileSync(src);
    targets.forEach(tgt => {
        const dest = path.join(tgt, file);
        const parentDir = path.dirname(dest);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(dest, content);
        console.log(`[SYNC] ${file} -> ${tgt}`);
    });
});

console.log('\n=== REEMBALANDO deploy_vps.zip ===');
process.chdir(sourceDir);
const buildZipScript = 'C:\\Users\\MG\\.gemini\\antigravity\\brain\\54a19af0-efae-4a93-84b0-e872759b2853\\scratch\\build_full_zip.js';
if (fs.existsSync(buildZipScript)) {
    require(buildZipScript);
} else {
    console.error('build_full_zip.js não encontrado!');
}
