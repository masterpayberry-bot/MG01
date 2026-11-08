const fs = require('fs');
const path = require('path');

// Test 1: server.js route logic
function routeServer(pathname) {
  let cleanPath = pathname.replace(/\/+$/, '');
  let filePath;
  if (cleanPath === '' || cleanPath === '/index' || cleanPath === '/client') {
    filePath = 'index.html';
  } else if (cleanPath === '/login') {
    filePath = 'login.html';
  } else if (cleanPath.startsWith('/admin_') || cleanPath === '/client/admin' || cleanPath === '/admin') {
    filePath = 'admin.html';
  } else {
    filePath = pathname;
  }
  return filePath;
}

console.log('--- Test 1: Node.js server.js routes ---');
console.log('/admin ->', routeServer('/admin'));
console.log('/admin_adm_171 ->', routeServer('/admin_adm_171'));
console.log('/admin_12345 ->', routeServer('/admin_12345'));
console.log('/admin/ ->', routeServer('/admin/'));
console.log('/admin_adm_171/ ->', routeServer('/admin_adm_171/'));

// Test 2: htaccess regex
console.log('\n--- Test 2: Apache .htaccess rewrite rule ---');
const regex = /^admin_([a-zA-Z0-9_\-]+)\/?$/;
console.log('admin_adm_171 match:', 'admin_adm_171'.match(regex));
console.log('admin_adm_171/ match:', 'admin_adm_171/'.match(regex));
console.log('admin match:', 'admin'.match(regex));

// Test 3: Cloaker validation script simulation
console.log('\n--- Test 3: Admin Cloaker logic simulation ---');
function simulateCloaker(url, cfg) {
  const parsed = new URL(url, 'https://paineldocsmg.com');
  const expected = String(cfg.adminKey).trim();
  const pathMatch = parsed.pathname.match(/\/admin_([a-zA-Z0-9_\-]+)/i);
  const pathSlug = pathMatch ? pathMatch[1] : '';
  const querySlug = parsed.searchParams.get('admin_slug') || '';
  const paramKey = cfg.adminParam || 'key';
  const queryParam = parsed.searchParams.get(paramKey) || parsed.searchParams.get('key') || '';

  const provided = (pathSlug || querySlug || queryParam || '').trim();

  if (cfg.adminEnabled === true && cfg.adminKey) {
    if (provided && provided === expected) {
      return { status: 'ALLOWED', provided };
    } else {
      return { status: 'BLOCKED', redirect: cfg.adminRedirect || 'login.html', provided };
    }
  }
  return { status: 'DISABLED_OPEN' };
}

const cfg = {
  adminEnabled: true,
  adminKey: 'adm_171',
  adminParam: 'key',
  adminRedirect: 'login.html'
};

console.log('Scenario 1: Accessing /admin directly when cloaker is active:');
console.log(simulateCloaker('/admin', cfg));

console.log('Scenario 2: Accessing /admin.html directly when cloaker is active:');
console.log(simulateCloaker('/admin.html', cfg));

console.log('Scenario 3: Accessing /admin_adm_171 (friendly URL):');
console.log(simulateCloaker('/admin_adm_171', cfg));

console.log('Scenario 4: Accessing /admin_wrong:');
console.log(simulateCloaker('/admin_wrong', cfg));

console.log('Scenario 5: Accessing admin.html?admin_slug=adm_171 (Apache rewrite):');
console.log(simulateCloaker('/admin.html?admin_slug=adm_171', cfg));

console.log('Scenario 6: Accessing admin.html?key=adm_171 (Query string):');
console.log(simulateCloaker('/admin.html?key=adm_171', cfg));
