const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORTS = [3000, 3001];
const PUBLIC_DIR = path.join(__dirname, 'out');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function createStaticServer(port) {
  const server = http.createServer((req, res) => {
    // ─── SMS API GATEWAY PROXY (Prevents Browser CORS Errors) ───
    if (req.url.startsWith('/api/sms-proxy')) {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const targetUrl = parsedUrl.searchParams.get('url');

      if (!targetUrl) {
        res.writeHead(400, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: false, error: 'Missing target url parameter' }));
        return;
      }

      try {
        const urlObj = new URL(targetUrl);
        const client = urlObj.protocol === 'http:' ? http : https;
        const proxyReq = client.get(targetUrl, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 200, {
            'Content-Type': proxyRes.headers['content-type'] || 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          });
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
          res.writeHead(502, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ success: false, error: 'Proxy request failed', message: err.message }));
        });
        return;
      } catch (err) {
        res.writeHead(400, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: false, error: 'Invalid URL', message: err.message }));
        return;
      }
    }

    let urlParts = req.url.split('?');
    let rawPath = decodeURI(urlParts[0]);
    let queryString = urlParts[1] ? '?' + urlParts[1] : '';

    // 1. Root route redirect to /dashboard/
    if (rawPath === '/' || rawPath === '') {
      res.writeHead(302, { 'Location': '/dashboard/' + queryString });
      res.end();
      return;
    }

    let filePath = path.join(PUBLIC_DIR, rawPath);

    // 2. Trailing slash redirect for directories (Crucial for Next.js trailingSlash: true)
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      if (!rawPath.endsWith('/')) {
        res.writeHead(301, { 'Location': rawPath + '/' + queryString });
        res.end();
        return;
      }
      filePath = path.join(filePath, 'index.html');
    }

    // 3. Direct HTML file fallback
    if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }

    // 4. Subdirectory index.html fallback
    if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
      if (!rawPath.endsWith('/')) {
        res.writeHead(301, { 'Location': rawPath + '/' + queryString });
        res.end();
        return;
      }
      filePath = path.join(filePath, 'index.html');
    }

    // 5. If still not found, return 404 or SPA fallback
    if (!fs.existsSync(filePath)) {
      const notFoundPath = path.join(PUBLIC_DIR, '404.html');
      if (fs.existsSync(notFoundPath)) {
        filePath = notFoundPath;
        res.statusCode = 404;
      } else {
        filePath = path.join(PUBLIC_DIR, 'dashboard', 'index.html');
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      res.writeHead(res.statusCode === 404 ? 404 : 200, { 'Content-Type': contentType });
      res.end(content);
    });
  });

  server.on('error', (err) => {
    console.log(`[PORT ${port}] Warning: ${err.message}`);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[SMS LIVE SERVER READY] Accessible at: http://localhost:${port}`);
  });

  return server;
}

PORTS.forEach(createStaticServer);

