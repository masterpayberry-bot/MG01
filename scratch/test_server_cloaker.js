const fs = require('fs');
const path = require('path');

function simulateServerRoute(pathname, query, config) {
  const cleanPath = pathname.replace(/\/+$/, '');
  const cloakerVal = config.cloakerAdminEnabled;
  const cloakerEnabled = (cloakerVal === true || cloakerVal === 'true' || cloakerVal === 1 || cloakerVal === '1');

  if (cleanPath.startsWith('/admin_') || cleanPath === '/client/admin' || cleanPath === '/admin' || cleanPath === '/admin.html') {
    if (cloakerEnabled) {
      const expectedKey = String(config.cloakerAdminKey || 'adm_171').trim();
      const paramName   = String(config.cloakerAdminParam || 'key').trim();
      const redirectUrl = String(config.cloakerAdminRedirect || 'login.html').trim() || 'login.html';

      const pathMatch = cleanPath.match(/^\/admin_([a-zA-Z0-9_\-]+)/i);
      const pathSlug = pathMatch ? pathMatch[1] : '';
      const queryParam = query[paramName] || query['key'] || query['admin_slug'] || '';
      const providedKey = (pathSlug || queryParam).trim();

      if (providedKey !== expectedKey) {
        return { status: 302, location: redirectUrl, action: 'REDIRECT' };
      }
    }
    return { status: 200, file: 'admin.html', action: 'SERVE' };
  }
  return { status: 404 };
}

console.log('=== TEST WITH CLOAKER ACTIVE ===');
const activeConfig = {
  cloakerAdminEnabled: true,
  cloakerAdminKey: 'adm_171',
  cloakerAdminParam: 'key',
  cloakerAdminRedirect: 'login.html'
};

console.log('GET /admin:', simulateServerRoute('/admin', {}, activeConfig));
console.log('GET /admin.html:', simulateServerRoute('/admin.html', {}, activeConfig));
console.log('GET /admin_wrong:', simulateServerRoute('/admin_wrong', {}, activeConfig));
console.log('GET /admin_adm_171:', simulateServerRoute('/admin_adm_171', {}, activeConfig));
console.log('GET /admin?key=adm_171:', simulateServerRoute('/admin', { key: 'adm_171' }, activeConfig));

console.log('\n=== TEST WITH CLOAKER INACTIVE ===');
const inactiveConfig = {
  cloakerAdminEnabled: false,
  cloakerAdminKey: 'adm_171'
};

console.log('GET /admin:', simulateServerRoute('/admin', {}, inactiveConfig));
console.log('GET /admin.html:', simulateServerRoute('/admin.html', {}, inactiveConfig));
