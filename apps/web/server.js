const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'out');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/x-component; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function createDualStackServer(port, requestHandler, label) {
  // 1. IPv4 Listener (0.0.0.0)
  const server4 = http.createServer(requestHandler);
  server4.on('error', (err) => console.log(`[PORT ${port} IPv4] Warning: ${err.message}`));
  server4.listen(port, '0.0.0.0', () => {
    console.log(`[${label} IPv4 READY] http://127.0.0.1:${port}`);
  });

  // 2. IPv6 Listener (::) - Essential on Windows so localhost (::1) cannot be hijacked by other rogue dev servers!
  const server6 = http.createServer(requestHandler);
  server6.on('error', (err) => {
    if (err.code !== 'EADDRINUSE') {
      console.log(`[PORT ${port} IPv6] Notice: ${err.message}`);
    }
  });
  server6.listen(port, '::', () => {
    console.log(`[${label} IPv6 READY] http://[::1]:${port} (localhost locked to SchoolPro SMS)`);
  });

  return { server4, server6 };
}

function startServers() {
  // ─── PORT 3001: Canonical origin redirect -> Port 3000 (Single Origin Database Guard)
  const redirectHandler = (req, res) => {
    const host = (req.headers.host || 'localhost:3001').replace(':3001', ':3000');
    res.writeHead(301, { 'Location': `http://${host}${req.url}` });
    res.end();
  };
  createDualStackServer(3001, redirectHandler, 'SMS REDIRECT');

  // ─── PORT 3000: Full School Management System Server
  const mainHandler = (req, res) => {
    // ─── OFFLINE STANDALONE API HANDLERS (Eliminates Browser 404 Console Errors) ───
    if (req.url.startsWith('/api/v1/license/heartbeat')) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ success: true, status: 'active', clientMode: 'standalone', timestamp: new Date().toISOString() }));
      return;
    }

    if (req.url.startsWith('/api/v1/sync/pull')) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ success: true, changes: [], version: 1, timestamp: new Date().toISOString() }));
      return;
    }

    if (req.url.startsWith('/api/v1/sync/push')) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ success: true, synced: true, timestamp: new Date().toISOString() }));
      return;
    }

    if (req.url.startsWith('/api/v1/updates/check')) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ updateAvailable: false, currentVersion: '2.4.0', latestVersion: '2.4.0', status: 'up_to_date' }));
      return;
    }

    if (req.url.startsWith('/api/v1/')) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ success: true, offline: true }));
      return;
    }

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
          res.end(JSON.stringify({ success: false, error: 'Proxy request failed: ' + err.message }));
        });
      } catch (e) {
        res.writeHead(400, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: false, error: 'Invalid URL format' }));
      }
      return;
    }

    // Normal static file handling
    const [rawPath, queryString] = req.url.split('?');
    const safePath = path.normalize(decodeURIComponent(rawPath)).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(PUBLIC_DIR, safePath);

    // 1. Root route fallback
    if (safePath === '/' || safePath === '\\' || safePath === '') {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    // Check if filePath is an existing directory
    let isDir = false;
    try {
      if (fs.existsSync(filePath)) {
        isDir = fs.statSync(filePath).isDirectory();
      }
    } catch (e) {}

    // 2. Directory handling: redirect to trailing slash or serve index.html
    if (isDir) {
      if (!rawPath.endsWith('/')) {
        res.writeHead(301, { 'Location': rawPath + '/' + (queryString ? '?' + queryString : '') });
        res.end();
        return;
      }
      const dirIndex = path.join(filePath, 'index.html');
      if (fs.existsSync(dirIndex)) {
        filePath = dirIndex;
      }
    }

    // 3. Next.js RSC payload (.txt) fallback
    if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.txt')) {
      filePath = filePath + '.txt';
    }

    // 4. Direct HTML file fallback
    if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }

    // 5. Subdirectory index.html fallback (if rawPath didn't have trailing slash but dir exists)
    if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
      if (!rawPath.endsWith('/')) {
        res.writeHead(301, { 'Location': rawPath + '/' + (queryString ? '?' + queryString : '') });
        res.end();
        return;
      }
      filePath = path.join(filePath, 'index.html');
    }

    // 6. If still not found or it is a directory without index.html, return 404 or SPA fallback
    let isStillDir = false;
    try {
      if (fs.existsSync(filePath)) {
        isStillDir = fs.statSync(filePath).isDirectory();
      }
    } catch (e) {}

    if (!fs.existsSync(filePath) || isStillDir) {
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
      res.writeHead(res.statusCode === 404 ? 404 : 200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content);
    });
  };

  createDualStackServer(3000, mainHandler, 'SMS LIVE SERVER');
}

startServers();
