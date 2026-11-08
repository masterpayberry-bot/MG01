/**
 * server.js — Servidor MG Editáveis
 * Banco de dados JSON persistente completo
 *
 * ROTAS:
 *  GET/POST   /api/config                 → lê/salva app/config.json
 *  GET/POST   /api/db/:colecao            → API REST direta (users, cnhs, recargas, tickets, activities, roadmap)
 *  DELETE     /api/db/:colecao/:id        → remove registro
 *  POST       /api/db/:colecao/clear      → limpa coleção
 *  ALL        /api/index.php              → Emulador completo compatível das rotas PHP/MySQL para HostGator/Local
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT        = 8080;
const ROOT        = __dirname;
const CONFIG_FILE = path.join(__dirname, 'app', 'config.json');
const DB_FILE     = path.join(__dirname, 'app', 'db.json');
const COLECOES    = ['users','cnhs','exames','recargas','tickets','activities','roadmap'];

// ─── Helpers de Banco de Dados ────────────────────────────────────────────────

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return initDB();
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    COLECOES.forEach(c => { if (!Array.isArray(data[c])) data[c] = []; });
    return data;
  } catch(e) {
    return initDB();
  }
}

function initDB() {
  const db = {};
  COLECOES.forEach(c => { db[c] = []; });
  writeDB(db);
  return db;
}

function writeDB(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch(e) {
    console.error('Erro ao salvar DB:', e.message);
  }
}

function readConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return {};
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch(e) { return {}; }
}

function writeConfig(cfg) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
  } catch(e) {
    console.error('Erro ao salvar config:', e.message);
  }
}

// ─── MIME Types ──────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.apk':  'application/vnd.android.package-archive',
  '.pdf':  'application/pdf',
  '.php':  'application/json; charset=utf-8',
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, code, data) {
  cors(res);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      req.rawBody = buffer;
      const str = buffer.toString('utf8');
      try {
        resolve(str ? JSON.parse(str) : {});
      } catch(e) {
        const parsed = {};
        const cpfMatch = str.match(/name="cpf"[\r\n\s]+([^\r\n-]+)/i);
        if (cpfMatch) parsed.cpf = cpfMatch[1].trim();
        const idMatch = str.match(/name="id"[\r\n\s]+([^\r\n-]+)/i);
        if (idMatch) parsed.id = idMatch[1].trim();
        resolve(parsed);
      }
    });
    req.on('error', () => resolve({}));
  });
}

// ─── Emulador da API PHP (api/index.php) ──────────────────────────────────────
async function handlePhpApi(req, res, query) {
  const method = req.method;
  const action = query.action || '';
  const body = await readBody(req);
  const input = { ...query, ...body };
  const db = readDB();

  // 1. Obter dados para o Painel Admin
  if (action === 'get_admin_data') {
    const config = readConfig();
    return json(res, 200, {
      status: 'success',
      data: {
        users: db.users || [],
        recargas: db.recargas || [],
        cnhs: db.cnhs || [],
        configs: config
      }
    });
  }

function saveNodeBase64Image(b64OrUrl, filenameBase, subDir = 'logos') {
  if (!b64OrUrl || typeof b64OrUrl !== 'string') return b64OrUrl;
  if (!b64OrUrl.startsWith('data:image/')) return b64OrUrl;
  try {
    const targetDir = path.join(ROOT, 'uploads', subDir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    let ext = 'png';
    if (b64OrUrl.startsWith('data:image/jpeg') || b64OrUrl.startsWith('data:image/jpg')) ext = 'jpg';
    else if (b64OrUrl.startsWith('data:image/webp')) ext = 'webp';
    const filename = `${filenameBase}.${ext}`;
    const dest = path.join(targetDir, filename);
    const parts = b64OrUrl.split(',');
    if (parts.length >= 2) {
      const buf = Buffer.from(parts[1], 'base64');
      fs.writeFileSync(dest, buf);
      return `uploads/${subDir}/${filename}?v=${Date.now()}`;
    }
  } catch (err) {
    console.error('Erro ao gravar imagem base64:', err.message);
  }
  return b64OrUrl;
}

  // 2. Personalizações do WebApp
  if (action === 'get_webapp_customization') {
    const config = readConfig();
    return json(res, 200, { status: 'success', data: config });
  }

  if (action === 'save_webapp_customization') {
    const newCfg = input.config || input;
    if (newCfg.logoImage) newCfg.logoImage = saveNodeBase64Image(newCfg.logoImage, 'logo_webapp');
    if (newCfg.govHeaderLogo) newCfg.govHeaderLogo = saveNodeBase64Image(newCfg.govHeaderLogo, 'logo_gov');
    if (newCfg.heroBanner) newCfg.heroBanner = saveNodeBase64Image(newCfg.heroBanner, 'hero_banner');
    if (newCfg.footerSerproImg) newCfg.footerSerproImg = saveNodeBase64Image(newCfg.footerSerproImg, 'footer_serpro');
    if (newCfg.footerCnhImg) newCfg.footerCnhImg = saveNodeBase64Image(newCfg.footerCnhImg, 'footer_cnh');
    if (newCfg.footerMinisterioImg) newCfg.footerMinisterioImg = saveNodeBase64Image(newCfg.footerMinisterioImg, 'footer_ministerio');
    const cur = readConfig();
    const merged = { ...cur, ...newCfg };
    writeConfig(merged);
    return json(res, 200, { status: 'success', data: merged, message: 'Configurações salvas no banco com sucesso!' });
  }

  // 2b. Atualizar Status do Usuário
  if (action === 'update_user_status') {
    const userId = input.userId;
    const newStatus = input.status;
    const user = (db.users || []).find(u => String(u.id) === String(userId));
    if (user) {
      user.status = newStatus;
      user.updated_at = new Date().toISOString();
      writeDB(db);
    }
    return json(res, 200, { status: 'success', message: 'Status do usuário atualizado!' });
  }

  // 2c. Excluir Usuário
  if (action === 'delete_user') {
    const userId = input.id || input.userId;
    const userEmail = (input.email || '').toLowerCase().trim();
    db.users = (db.users || []).filter(u => {
      if (userId && String(u.id) === String(userId)) return false;
      if (userEmail && (u.email || '').toLowerCase().trim() === userEmail) return false;
      return true;
    });
    writeDB(db);
    return json(res, 200, { status: 'success', message: 'Cliente excluído com sucesso!' });
  }

  // 2d. Salvar / Editar Usuário
  if (action === 'save_user') {
    const userId = input.id || input.userId;
    const nome = (input.nome || '').trim();
    const email = (input.email || '').toLowerCase().trim();
    const phone = (input.phone || '').trim();
    const saldo = parseFloat(input.saldo) || 0;
    const status = input.status || 'approved';

    let found = (db.users || []).find(u => (userId && String(u.id) === String(userId)) || (email && (u.email || '').toLowerCase().trim() === email));
    if (found) {
      found.nome = nome || found.nome;
      found.email = email || found.email;
      found.phone = phone || found.phone;
      found.saldo = saldo;
      found.status = status;
      found.updated_at = new Date().toISOString();
    } else {
      found = {
        id: userId || Date.now(),
        nome: nome,
        email: email,
        phone: phone,
        saldo: saldo,
        status: status,
        created_at: new Date().toISOString()
      };
      if (!Array.isArray(db.users)) db.users = [];
      db.users.push(found);
    }
    writeDB(db);
    return json(res, 200, { status: 'success', data: { user: found } });
  }

  // 3. Adicionar Saldo ao Usuário
  if (action === 'add_user_balance') {
    const userId = input.userId;
    const amount = parseFloat(input.amount) || 0;
    if (!userId || amount <= 0) {
      return json(res, 400, { status: 'error', message: 'Valor inválido.' });
    }

    let found = db.users.find(u => String(u.id) === String(userId));
    if (found) {
      found.saldo = (parseFloat(found.saldo) || 0) + amount;
      found.updated_at = new Date().toISOString();
    } else {
      found = { id: userId, saldo: amount, updated_at: new Date().toISOString() };
      db.users.push(found);
    }
    writeDB(db);
    return json(res, 200, { status: 'success', data: { newBalance: found.saldo } });
  }

  // 4b. Excluir Recarga
  if (action === 'delete_recarga') {
    const recId = input.id || input.recId;
    db.recargas = (db.recargas || []).filter(r => String(r.id) !== String(recId));
    writeDB(db);
    return json(res, 200, { status: 'success', message: 'Recarga excluída com sucesso!' });
  }

  // 4. Atualizar Status de Recarga (Aprovar / Recusar)
  if (action === 'update_recarga_status') {
    const recId = input.recId;
    const status = input.status; // approved / rejected
    const rec = db.recargas.find(r => String(r.id) === String(recId));
    if (rec) {
      rec.status = status;
      rec.updated_at = new Date().toISOString();
      if (status === 'approved') {
        const user = db.users.find(u => (rec.user_id && String(u.id) === String(rec.user_id)) || (rec.user && u.nome && u.nome.toLowerCase() === rec.user.toLowerCase()));
        if (user) {
          user.saldo = (parseFloat(user.saldo) || 0) + (parseFloat(rec.valor) || 0);
          user.updated_at = new Date().toISOString();
        }
      }
      writeDB(db);
    }
    return json(res, 200, { status: 'success', message: 'Status de recarga atualizado!' });
  }

  // 5. Gerar CNH
  if (action === 'gerar_cnh') {
    const userId = input.userId;
    const nomeCnh = input.nomeCnh || 'CONDUTOR';
    const cpf = input.cpf || '';
    const rg = input.rg || '';
    const categoria = input.categoria || 'AB';
    const cnhId = input.id || ('CNH-' + Math.floor(1000 + Math.random() * 9000));
    const custo = 26.00;

    let dados = input.dados || {};
    if (typeof dados !== 'object') dados = {};
    const cleanCpf = (cpf || '').replace(/\D/g, '') || cnhId;

    if (dados.foto) dados.foto = saveNodeBase64Image(dados.foto, 'foto_' + cleanCpf, 'fotos');
    if (dados.assinatura) dados.assinatura = saveNodeBase64Image(dados.assinatura, 'ass_' + cleanCpf, 'fotos');
    if (dados.slide1) dados.slide1 = saveNodeBase64Image(dados.slide1, 'slide1_' + cleanCpf, 'cnhs');
    if (dados.slide2) dados.slide2 = saveNodeBase64Image(dados.slide2, 'slide2_' + cleanCpf, 'cnhs');
    if (dados.slide3) dados.slide3 = saveNodeBase64Image(dados.slide3, 'slide3_' + cleanCpf, 'cnhs');
    if (dados.slide4) dados.slide4 = saveNodeBase64Image(dados.slide4, 'slide4_' + cleanCpf, 'cnhs');

    let user = db.users.find(u => String(u.id) === String(userId));
    if (user) {
      user.saldo = Math.max(0, (parseFloat(user.saldo) || 0) - custo);
      user.cnhsCount = (user.cnhsCount || 0) + 1;
      user.updated_at = new Date().toISOString();
    }

    const valorPendencia = input.valor_pendencia || (dados && dados.valor_pendencia) || '500,00';
    if (dados) {
      dados.valor_pendencia = valorPendencia;
      dados.senha = dados.senha || '840169';
    }

    const novaCnh = {
      id: cnhId,
      user_id: userId,
      user_nome: (user && user.nome) ? user.nome : 'Cliente',
      nome_cnh: nomeCnh,
      cpf: cpf,
      rg: rg,
      categoria: categoria,
      senha: '840169',
      valor_pendencia: valorPendencia,
      valor_cobrado: custo,
      dados_json: dados,
      created_at: new Date().toISOString()
    };
    db.cnhs.unshift(novaCnh);
    writeDB(db);

    // Desbloqueia e libera o CPF caso estivesse na lista de cancelados anteriormente
    const cleanCpfGerar = (cpf || '').replace(/\D/g, '');
    const configGerar = readConfig();
    if (cleanCpfGerar && Array.isArray(configGerar.canceled_cpfs) && configGerar.canceled_cpfs.includes(cleanCpfGerar)) {
      configGerar.canceled_cpfs = configGerar.canceled_cpfs.filter(c => c !== cleanCpfGerar);
      writeConfig(configGerar);
    }

    return json(res, 200, {
      status: 'success',
      data: {
        cnhId: cnhId,
        novoSaldo: user ? user.saldo : 0
      },
      message: 'CNH cadastrada no banco com sucesso!'
    });
  }

  // 5b. Verificar CPF CNH
  if (action === 'verificar_cpf_cnh' || action === 'get_latest_cnh') {
    const rawCpf = (input.cpf || '').replace(/\D/g, '');
    let found = null;
    if (action === 'verificar_cpf_cnh' && rawCpf) {
      found = db.cnhs.find(c => (c.cpf || '').replace(/\D/g, '') === rawCpf);
    }
    if (!found && db.cnhs.length > 0 && !rawCpf) {
      found = db.cnhs[0];
    }
    if (!found) {
      const config = readConfig();
      if (rawCpf && Array.isArray(config.canceled_cpfs) && config.canceled_cpfs.includes(rawCpf)) {
        return json(res, 400, { status: 'error', data: { status: 'canceled' }, message: 'Prontuário vencido ou documentação cancelada.' });
      }
      return json(res, 404, { status: 'error', message: 'CNH não encontrada' });
    }

    // CNH ativa encontrada: garante que o CPF não está em canceled_cpfs
    const cleanCpf = (found.cpf || '').replace(/\D/g, '') || found.id;
    const config = readConfig();
    if (cleanCpf && Array.isArray(config.canceled_cpfs) && config.canceled_cpfs.includes(cleanCpf)) {
      config.canceled_cpfs = config.canceled_cpfs.filter(c => c !== cleanCpf);
      writeConfig(config);
    }
    const dados = (found && found.dados_json) ? (typeof found.dados_json === 'string' ? JSON.parse(found.dados_json) : found.dados_json) : {};
    const s1 = dados.slide1 || (fs.existsSync(path.join(ROOT, 'uploads/cnhs/slide1_' + cleanCpf + '.jpg')) ? ('uploads/cnhs/slide1_' + cleanCpf + '.jpg') : null);
    const s2 = dados.slide2 || (fs.existsSync(path.join(ROOT, 'uploads/cnhs/slide2_' + cleanCpf + '.jpg')) ? ('uploads/cnhs/slide2_' + cleanCpf + '.jpg') : null);
    const s3 = dados.slide3 || (fs.existsSync(path.join(ROOT, 'uploads/cnhs/slide3_' + cleanCpf + '.jpg')) ? ('uploads/cnhs/slide3_' + cleanCpf + '.jpg') : null);
    const s4 = dados.slide4 || (fs.existsSync(path.join(ROOT, 'uploads/cnhs/slide4_' + cleanCpf + '.jpg')) ? ('uploads/cnhs/slide4_' + cleanCpf + '.jpg') : null);

    return json(res, 200, {
      status: 'success',
      data: {
        id: found.id,
        nome: found.nome_cnh || dados.nome || 'CONDUTOR',
        cpf: found.cpf || dados.cpf || '',
        categoria: found.categoria || dados.categoria || 'B',
        rg: found.rg || dados.rg || '',
        valor_pendencia: dados.valor_pendencia || '500,00',
        dados: dados,
        foto: dados.foto || null,
        slide1: s1,
        slide2: s2,
        slide3: s3,
        slide4: s4
      }
    });
  }

  // 6. Consultar CNHs de um usuário
  if (action === 'get_user_cnhs') {
    const userId = input.userId;
    const email = (input.email || '').toLowerCase().trim();
    const userCnhs = db.cnhs.filter(c => (userId && String(c.user_id) === String(userId)) || (email && c.user_email && c.user_email.toLowerCase() === email));
    return json(res, 200, {
      status: 'success',
      data: {
        cnhs: userCnhs,
        stats: {
          today: userCnhs.length,
          month: userCnhs.length,
          total: userCnhs.length,
          revalidacao: 0
        }
      }
    });
  }

  // 6b. Excluir CNH e cancelar prontuário
  if (action === 'delete_cnh') {
    const cnhId = input.id || input.cnhId;
    const cleanCpf = (input.cpf || '').replace(/\D/g, '');
    if (cnhId) {
      db.cnhs = (db.cnhs || []).filter(c => String(c.id) !== String(cnhId));
      writeDB(db);
    }
    if (cleanCpf) {
      const config = readConfig();
      if (!Array.isArray(config.canceled_cpfs)) config.canceled_cpfs = [];
      if (!config.canceled_cpfs.includes(cleanCpf)) {
        config.canceled_cpfs.push(cleanCpf);
        writeConfig(config);
      }
    }
    return json(res, 200, { status: 'success', message: 'CNH excluída e prontuário cancelado.' });
  }

  // 6c. Verificar status da CNH / CPF
  if (action === 'check_cnh_status') {
    const cleanCpf = (input.cpf || '').replace(/\D/g, '');
    const config = readConfig();
    const canceledList = Array.isArray(config.canceled_cpfs) ? config.canceled_cpfs : [];
    
    // Procura primeiro se existe CNH ativa no banco
    const activeCnh = db.cnhs.find(c => (c.cpf || '').replace(/\D/g, '') === cleanCpf);
    if (activeCnh) {
      if (canceledList.includes(cleanCpf)) {
        config.canceled_cpfs = canceledList.filter(c => c !== cleanCpf);
        writeConfig(config);
      }
      return json(res, 200, {
        status: 'success',
        data: { status: 'active', cpf: cleanCpf }
      });
    }

    if (cleanCpf && canceledList.includes(cleanCpf)) {
      return json(res, 200, {
        status: 'error',
        data: { status: 'canceled', cpf: cleanCpf },
        message: 'Prontuário vencido ou documentação cancelada pelo órgão de trânsito.'
      });
    }
    return json(res, 200, {
      status: 'success',
      data: { status: 'active', cpf: cleanCpf }
    });
  }

  // 6d. Upload CNH PDF
  if (action === 'upload_cnh_pdf' || action === 'salvar_cnh_pdf') {
    const rawCpf = (input.cpf || '').replace(/\D/g, '');
    const cnhId = (input.id || '').trim();
    const fileBase = rawCpf || cnhId;
    if (!fileBase) {
      return json(res, 200, { status: 'error', message: 'CPF ou ID obrigatório.' });
    }
    const uploadsDir = path.join(ROOT, 'uploads', 'cnhs');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const destPath = path.join(uploadsDir, `cnh_${fileBase}.pdf`);

    if (input.pdf_base64) {
      let b64 = input.pdf_base64;
      if (b64.includes('base64,')) b64 = b64.split('base64,')[1];
      fs.writeFileSync(destPath, Buffer.from(b64, 'base64'));
      return json(res, 200, { status: 'success', message: 'PDF salvo com sucesso.' });
    }
    if (req.rawBody && req.rawBody.length > 0) {
      const pdfIdx = req.rawBody.indexOf('%PDF');
      if (pdfIdx !== -1) {
        let pdfEnd = req.rawBody.lastIndexOf('%%EOF');
        if (pdfEnd !== -1) pdfEnd += 5;
        else pdfEnd = req.rawBody.length;
        const pdfBuf = req.rawBody.slice(pdfIdx, pdfEnd);
        fs.writeFileSync(destPath, pdfBuf);
        return json(res, 200, { status: 'success', message: 'PDF salvo com sucesso.' });
      }
    }
    return json(res, 200, { status: 'success', message: 'Requisição processada.' });
  }

  // 6e. Check CNH PDF
  if (action === 'check_cnh_pdf') {
    const cleanCpf = (input.cpf || '').replace(/\D/g, '');
    const cnhId = (input.id || '').trim();
    const uploadsDir = path.join(ROOT, 'uploads', 'cnhs');
    let exists = false;
    let url = '';
    if (cleanCpf && fs.existsSync(path.join(uploadsDir, `cnh_${cleanCpf}.pdf`))) {
      exists = true;
      url = `uploads/cnhs/cnh_${cleanCpf}.pdf`;
    } else if (cnhId && fs.existsSync(path.join(uploadsDir, `cnh_${cnhId}.pdf`))) {
      exists = true;
      url = `uploads/cnhs/cnh_${cnhId}.pdf`;
    }
    return json(res, 200, { status: 'success', data: { exists, url } });
  }

  // 6f. Download CNH PDF
  if (action === 'download_cnh_pdf') {
    const cleanCpf = (input.cpf || '').replace(/\D/g, '');
    const cnhId = (input.id || '').trim();
    const uploadsDir = path.join(ROOT, 'uploads', 'cnhs');
    let targetFile = '';
    if (cleanCpf && fs.existsSync(path.join(uploadsDir, `cnh_${cleanCpf}.pdf`))) {
      targetFile = path.join(uploadsDir, `cnh_${cleanCpf}.pdf`);
    } else if (cnhId && fs.existsSync(path.join(uploadsDir, `cnh_${cnhId}.pdf`))) {
      targetFile = path.join(uploadsDir, `cnh_${cnhId}.pdf`);
    }
    if (targetFile && fs.existsSync(targetFile)) {
      const stat = fs.statSync(targetFile);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="cnh-digital.pdf"',
        'Content-Length': stat.size,
        'Cache-Control': 'private, max-age=0, must-revalidate',
        'Pragma': 'public'
      });
      fs.createReadStream(targetFile).pipe(res);
      return;
    }
    return json(res, 404, { status: 'error', message: 'PDF não encontrado.' });
  }

  // 7. Login / Registro
  if (action === 'login') {
    const email = (input.email || '').toLowerCase().trim();
    const user = db.users.find(u => u.email && u.email.toLowerCase().trim() === email);
    if (user) {
      return json(res, 200, { status: 'success', data: user });
    }
    return json(res, 200, { status: 'success', data: { id: 1, email: email, nome: 'Cliente', saldo: 0 } });
  }

  // Fallback padrão
  return json(res, 200, { status: 'success', data: null, message: 'Operação concluída.' });
}

// ─── Servidor HTTP Principal ──────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const parsed   = url.parse(req.url, true);
  let pathname = parsed.pathname;
  try { pathname = decodeURIComponent(parsed.pathname); } catch(e) {}
  const method   = req.method;

  // ════════════════════════════════════════════════════════════════
  //  Rotas de Compatibilidade PHP (/api/index.php ou api/index.php)
  // ════════════════════════════════════════════════════════════════
  if (pathname === '/api/index.php' || pathname === '/index.php' || pathname.endsWith('index.php')) {
    await handlePhpApi(req, res, parsed.query);
    return;
  }

  // Salvar imagem de compartilhamento OG
  if (pathname === '/api/save-og-image.php') {
    const body = await readBody(req);
    if (body.image && body.image.startsWith('data:image')) {
      const base64Data = body.image.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(path.join(ROOT, 'og-image.png'), Buffer.from(base64Data, 'base64'));
    }
    json(res, 200, { status: 'success', message: 'OG Image salva.' });
    return;
  }

  // ════════════════════════════════════════════════════════════════
  //  /api/config (GET e POST)
  // ════════════════════════════════════════════════════════════════
  if (pathname === '/api/config') {
    if (method === 'GET') {
      json(res, 200, { status: 'ok', data: readConfig() });
      return;
    }
    if (method === 'POST') {
      try {
        const payload = await readBody(req);
        writeConfig(payload);
        json(res, 200, { status: 'ok', message: 'Config salva!' });
      } catch(e) {
        json(res, 400, { status: 'error', message: e.message });
      }
      return;
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  /api/db/:colecao (API REST Moderna)
  // ════════════════════════════════════════════════════════════════
  const dbMatch = pathname.match(/^\/api\/db\/([a-z]+)(\/(.+))?$/i);
  if (dbMatch) {
    const colecao = dbMatch[1].toLowerCase();
    const extra   = dbMatch[3] || '';

    if (!COLECOES.includes(colecao)) {
      json(res, 400, { status: 'error', message: `Coleção inválida: ${colecao}` });
      return;
    }

    // GET /api/db/:colecao
    if (method === 'GET' && !extra) {
      const db = readDB();
      json(res, 200, { status: 'ok', data: db[colecao] || [] });
      return;
    }

    // POST /api/db/:colecao/clear
    if (method === 'POST' && extra === 'clear') {
      const db = readDB();
      db[colecao] = [];
      writeDB(db);
      json(res, 200, { status: 'ok', message: `${colecao} limpa.` });
      return;
    }

    // POST /api/db/:colecao/set ou replace (substituição total da coleção)
    if (method === 'POST' && (extra === 'set' || extra === 'replace')) {
      try {
        const payload = await readBody(req);
        const db = readDB();
        let items = Array.isArray(payload) ? payload : (payload.items || payload.data || payload.roadmap || []);
        if (!Array.isArray(items)) items = [];
        db[colecao] = items;
        writeDB(db);
        json(res, 200, { status: 'ok', message: `${colecao} atualizado com ${items.length} itens.`, data: db[colecao] });
      } catch(e) {
        json(res, 400, { status: 'error', message: e.message });
      }
      return;
    }

    // POST /api/db/:colecao (upsert)
    if (method === 'POST' && !extra) {
      try {
        const payload = await readBody(req);
        const db = readDB();
        if (!Array.isArray(db[colecao])) db[colecao] = [];

        const items = Array.isArray(payload) ? payload : [payload];
        let saved = 0;

        items.forEach(item => {
          if (!item) return;
          if (!item.id) item.id = Date.now() + '_' + Math.random().toString(36).substr(2,6);
          item.updated_at = new Date().toISOString();

          const idx = db[colecao].findIndex(r =>
            String(r.id) === String(item.id) || (colecao === 'users' && r.email && item.email && r.email.toLowerCase() === item.email.toLowerCase())
          );
          if (idx !== -1) {
            db[colecao][idx] = { ...db[colecao][idx], ...item };
          } else {
            if (!item.created_at) item.created_at = new Date().toISOString();
            db[colecao].unshift(item);
          }
          saved++;
        });

        writeDB(db);
        json(res, 200, { status: 'ok', message: `${saved} registro(s) salvos.`, data: db[colecao] });
      } catch(e) {
        json(res, 400, { status: 'error', message: e.message });
      }
      return;
    }

    // DELETE /api/db/:colecao/:id
    if (method === 'DELETE' && extra) {
      const db = readDB();
      const before = (db[colecao] || []).length;
      db[colecao] = (db[colecao] || []).filter(r => String(r.id) !== String(extra));
      const removed = before - db[colecao].length;
      writeDB(db);
      json(res, 200, { status: 'ok', message: `${removed} registro(s) removido(s).` });
      return;
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  Rotas Amigáveis & Arquivos Estáticos
  // ════════════════════════════════════════════════════════════════
  let cleanPath = pathname.replace(/\/+$/, '');
  let filePath;

  if (cleanPath === '' || cleanPath === '/index' || cleanPath === '/client') {
    filePath = path.join(ROOT, 'index.html');
  } else if (cleanPath === '/client/cnh' || cleanPath === '/cnh') {
    filePath = path.join(ROOT, 'cnh.html');
  } else if (['/client/cnh/criar','/cnh/criar','/criar','/criar-cnh'].includes(cleanPath)) {
    filePath = path.join(ROOT, 'criar-cnh.html');
  } else if (
    ['/client/cnh/ver','/cnh/ver','/ver','/ver-cnh'].includes(cleanPath) ||
    /^\/client\/cnh\/[^/]+\/acesso$/i.test(cleanPath) ||
    /^\/cnh\/[^/]+\/acesso$/i.test(cleanPath)
  ) {
    filePath = path.join(ROOT, 'ver-cnh.html');
  } else if (cleanPath === '/client/perfil' || cleanPath === '/perfil') {
    filePath = path.join(ROOT, 'perfil.html');
  } else if (cleanPath === '/client/indicacoes' || cleanPath === '/indicacoes') {
    filePath = path.join(ROOT, 'indicacoes.html');
  } else if (cleanPath === '/client/recargas' || cleanPath === '/recargas') {
    filePath = path.join(ROOT, 'recargas.html');
  } else if (cleanPath === '/client/suporte' || cleanPath === '/suporte') {
    filePath = path.join(ROOT, 'suporte.html');
  } else if (cleanPath === '/login') {
    filePath = path.join(ROOT, 'login.html');
  } else if (cleanPath.startsWith('/admin_') || cleanPath === '/client/admin' || cleanPath === '/admin' || cleanPath === '/admin.html') {
    const cfg = readConfig();
    const cloakerVal = cfg.cloakerAdminEnabled;
    const cloakerEnabled = (cloakerVal === true || cloakerVal === 'true' || cloakerVal === 1 || cloakerVal === '1');

    if (cloakerEnabled) {
      const expectedKey = String(cfg.cloakerAdminKey || 'adm_171').trim();
      const paramName   = String(cfg.cloakerAdminParam || 'key').trim();
      const redirectUrl = String(cfg.cloakerAdminRedirect || 'login.html').trim() || 'login.html';

      const pathMatch = cleanPath.match(/^\/admin_([a-zA-Z0-9_\-]+)/i);
      const pathSlug = pathMatch ? pathMatch[1] : '';
      const queryParam = parsed.query[paramName] || parsed.query['key'] || parsed.query['admin_slug'] || '';
      const providedKey = (pathSlug || queryParam).trim();

      if (providedKey !== expectedKey) {
        res.writeHead(302, { 'Location': redirectUrl, 'Cache-Control': 'no-store, no-cache' });
        res.end();
        return;
      }
    }
    filePath = path.join(ROOT, 'admin.html');
  } else if (cleanPath === '/habilitacao' || cleanPath === '/cnh-digital') {
    filePath = path.join(ROOT, 'habilitacao.html');
  } else {
    filePath = path.join(ROOT, pathname === '/' ? '/index.html' : pathname);
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404); res.end('404 - Não encontrado: ' + pathname); return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  const cacheHeader = ext === '.html'
    ? 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    : 'no-cache';

  res.writeHead(200, {
    'Content-Type': mime,
    'Cache-Control': cacheHeader,
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n✅ MG Editáveis Server Online em http://localhost:${PORT}`);
  console.log(`   🔐 Admin : http://localhost:${PORT}/admin.html`);
  console.log(`   📱 App   : http://localhost:${PORT}/index.html`);
  console.log(`   🗄️  Banco de Dados : Ativo e persistido em app/db.json\n`);
});
