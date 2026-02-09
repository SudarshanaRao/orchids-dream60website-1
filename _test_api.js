// Test what admin routes exist
async function test() {
  const routes = [
    '/admin/login',
    '/admin/set-access-code',
    '/admin/verify-access-code', 
    '/admin/access-code-status',
    '/admin/send-access-code-otp',
    '/admin/reset-access-code',
  ];
  
  for (const route of routes) {
    try {
      const res = await fetch('https://dev-api.dream60.com' + route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      const ct = res.headers.get('content-type');
      const text = await res.text();
      console.log(`${route}: status=${res.status}, type=${ct}, body=${text.substring(0, 200)}`);
    } catch (e) { console.error(`${route}: error=${e.message}`); }
  }
}

test();
