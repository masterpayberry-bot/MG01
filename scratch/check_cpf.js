const SUP_URL = 'https://cbxcvvtelhpdcssgpnii.supabase.co';
const SUP_KEY = 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK';

async function checkAll() {
  const tables = ['cnhs', 'usuarios', 'clientes', 'configuracoes', 'atestados', 'receitas', 'pedidos'];
  for (const t of tables) {
    try {
      const res = await fetch(SUP_URL + '/rest/v1/' + t + '?select=*', {
        headers: { 'apikey': SUP_KEY, 'Authorization': 'Bearer ' + SUP_KEY }
      });
      if (res.ok) {
        const rows = await res.json();
        const found = rows.filter(r => JSON.stringify(r).includes('04970226644') || JSON.stringify(r).includes('049.702.266-44'));
        console.log(`Table ${t}: total ${rows.length}, found: ${found.length}`);
        if (found.length > 0) console.log(JSON.stringify(found, null, 2));
      } else {
        console.log(`Table ${t}: HTTP ${res.status}`);
      }
    } catch(e) {
      console.log(`Table ${t} error:`, e.message);
    }
  }
}
checkAll();
