const http = require('http');

function testReq(pathStr, expectedStatus) {
  return new Promise((resolve) => {
    http.get('http://127.0.0.1:3000' + pathStr, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const waf = res.headers['x-waf-protection'] || 'NONE';
        const ssrf = res.headers['x-ssrf-protection'] || 'NONE';
        console.log(`GET ${pathStr} -> Status: ${res.statusCode} (Expected: ${expectedStatus}) | WAF: ${waf} | SSRF: ${ssrf}`);
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', (err) => {
      console.error(`GET ${pathStr} error:`, err.message);
      resolve({ status: 500, error: err.message });
    });
  });
}

async function run() {
  console.log('=== 1. OWASP Security Headers Test ===');
  const normal = await testReq('/', 200);
  console.log('X-Frame-Options:', normal.headers['x-frame-options']);
  console.log('X-Content-Type-Options:', normal.headers['x-content-type-options']);
  console.log('Content-Security-Policy:', normal.headers['content-security-policy']);

  console.log('\n=== 2. WAF Malicious Probes Test ===');
  await testReq('/.env', 403);
  await testReq('/.git/config', 403);
  await testReq('/wp-admin', 403);
  await testReq('/phpmyadmin', 403);
  await testReq('/?search=%3Cscript%3Ealert(1)%3C/script%3E', 403);
  await testReq('/?id=1%20UNION%20SELECT%20*%20FROM%20users', 403);
  await testReq('/../../etc/passwd', 403);

  console.log('\n=== 3. SSRF Protection Test ===');
  await testReq('/api/sms-proxy?url=http://127.0.0.1:22', 400);
  await testReq('/api/sms-proxy?url=http://169.254.169.254/latest/meta-data', 400);
  await testReq('/api/sms-proxy?url=http://localhost:8080/admin', 400);
  await testReq('/api/sms-proxy?url=http://192.168.1.1/router-config', 400);
  await testReq('/api/sms-proxy?url=http://10.0.0.1/secret', 400);
}

run();
