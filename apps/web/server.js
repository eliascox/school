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

// ─── OWASP ENTERPRISE HTTP SECURITY HEADERS ──────────────────────────────────
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; frame-ancestors 'self';"
};

function sendResponse(res, statusCode, headers = {}, body = '') {
  const mergedHeaders = { ...SECURITY_HEADERS, ...headers };
  res.writeHead(statusCode, mergedHeaders);
  res.end(body);
}

// ─── IP EXTRACTION & SLIDING-WINDOW RATE LIMITER (Anti-DoS / Anti-Brute-Force) ─
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_GLOBAL_REQ_PER_MIN = 300;
const MAX_API_REQ_PER_MIN = 60;

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, 3 * 60 * 1000).unref();

function checkRateLimit(ip, isApi) {
  const now = Date.now();
  let client = rateLimitMap.get(ip);
  if (!client || (now - client.windowStart > RATE_LIMIT_WINDOW_MS)) {
    client = { windowStart: now, count: 1, apiCount: isApi ? 1 : 0 };
    rateLimitMap.set(ip, client);
    return true;
  }

  client.count++;
  if (isApi) client.apiCount = (client.apiCount || 0) + 1;

  const maxAllowed = isApi ? MAX_API_REQ_PER_MIN : MAX_GLOBAL_REQ_PER_MIN;
  const currentCount = isApi ? client.apiCount : client.count;

  return currentCount <= maxAllowed;
}

// ─── WEB APPLICATION FIREWALL (WAF) MALICIOUS REQUEST DETECTOR ───────────────
const MALICIOUS_PATTERNS = [
  // Sensitive configuration and system files
  /\.(env|git|svn|htaccess|htpasswd|ds_store|bak|swp|ini|conf)(\b|\/|\?|$)/i,
  /\/web\.config/i,
  /\/package\.json/i,
  /\/tsconfig\.json/i,
  /\/etc\/(passwd|shadow|hosts)/i,
  /\/proc\/self/i,
  /cmd\.exe/i,
  /\/cgi-bin\//i,

  // Attack scanner & bot probes
  /\/(wp-admin|wp-login|xmlrpc\.php|wordpress)/i,
  /\/(phpmyadmin|pma|adminer|myadmin|mysql)/i,
  /\/(actuator|swagger|api-docs|solr|console)/i,
  /\/shell(\.php|\.sh|\.asp)?/i,

  // XSS attack vectors in query string / URL
  /(<|%3C)\s*script/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /onload\s*=/i,
  /onerror\s*=/i,
  /onclick\s*=/i,

  // SQL Injection patterns
  /union\s+(all\s+)?select/i,
  /benchmark\s*\(/i,
  /sleep\s*\(/i,
  /information_schema/i,
  /'\s*or\s+'1'='1/i,

  // Path Traversal
  /\.\.[\/\\]/,
  /(%2e%2e|\.\.)(%2f|\/|%5c|\\)/i,
  /%252e%252e/i
];

function isMaliciousRequest(rawUrl) {
  let decoded = '';
  try {
    decoded = decodeURIComponent(rawUrl);
  } catch (e) {
    return true;
  }

  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(rawUrl) || pattern.test(decoded)) {
      return true;
    }
  }
  return false;
}

// ─── SSRF PROTECTION ENGINE (Blocks internal network probes via proxy) ───────
function isPrivateOrLoopbackIP(ip) {
  if (!ip) return true;
  if (ip === '127.0.0.1' || ip === '0.0.0.0' || ip === 'localhost') return true;
  if (ip.startsWith('127.')) return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('169.254.')) return true; // AWS / GCP metadata
  if (ip.startsWith('100.64.')) return true;

  if (ip.startsWith('172.')) {
    const parts = ip.split('.');
    if (parts.length >= 2) {
      const second = parseInt(parts[1], 10);
      if (second >= 16 && second <= 31) return true;
    }
  }

  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::' || lower.startsWith('fe80:') || lower.startsWith('fc00:') || lower.startsWith('fd00:')) {
    return true;
  }

  return false;
}

function isSafeExternalUrl(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    const cleanHost = hostname.replace(/^\[|\]$/g, '');

    if (isPrivateOrLoopbackIP(cleanHost)) {
      return false;
    }

    if (hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.localhost') || !hostname.includes('.')) {
      return false;
    }

    const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
    const DANGEROUS_PORTS = [21, 22, 23, 25, 53, 69, 110, 111, 135, 139, 143, 445, 1433, 1521, 2049, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9200, 11211, 27017, 28017];
    if (DANGEROUS_PORTS.includes(port)) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

// ─── DUAL-STACK SERVER INITIALIZATION ─────────────────────────────────────────
function createDualStackServer(port, requestHandler, label) {
  // 1. IPv4 Listener (0.0.0.0)
  const server4 = http.createServer(requestHandler);
  server4.on('error', (err) => console.log(`[PORT ${port} IPv4] Warning: ${err.message}`));
  server4.listen(port, '0.0.0.0', () => {
    console.log(`[${label} IPv4 READY] http://127.0.0.1:${port}`);
  });

  // 2. IPv6 Listener (::) - Essential on Windows so localhost (::1) cannot be hijacked
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
    sendResponse(res, 301, { 'Location': `http://${host}${req.url}` });
  };
  createDualStackServer(3001, redirectHandler, 'SMS REDIRECT');

  // ─── PORT 3000: Full School Management System Server with Multi-Layer Security
  const mainHandler = (req, res) => {
    const clientIp = getClientIp(req);

    // 1. HTTP Method Whitelist Guard
    const ALLOWED_METHODS = ['GET', 'POST', 'HEAD', 'OPTIONS'];
    if (!ALLOWED_METHODS.includes(req.method)) {
      sendResponse(res, 405, {
        'Content-Type': 'application/json; charset=utf-8',
        'Allow': 'GET, POST, HEAD, OPTIONS'
      }, JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    // 2. CORS Preflight Handling
    if (req.method === 'OPTIONS') {
      sendResponse(res, 204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
      });
      return;
    }

    // 3. IP Sliding-Window Rate Limiting (Anti-DoS / Anti-Brute-Force)
    const isApi = req.url.startsWith('/api/');
    if (!checkRateLimit(clientIp, isApi)) {
      console.warn(`[RATE LIMIT EXCEEDED] IP: ${clientIp} URL: ${req.url}`);
      sendResponse(res, 429, {
        'Content-Type': 'application/json; charset=utf-8',
        'Retry-After': '60'
      }, JSON.stringify({ error: 'Too Many Requests', message: 'Rate limit exceeded. Please wait a minute.' }));
      return;
    }

    // 4. Web Application Firewall (WAF) Malicious URL Inspection
    if (isMaliciousRequest(req.url)) {
      console.warn(`[WAF BLOCKED] Attacker IP: ${clientIp} Target: ${req.url}`);
      sendResponse(res, 403, {
        'Content-Type': 'application/json; charset=utf-8',
        'X-WAF-Protection': 'BLOCKED-MALICIOUS-PROBE'
      }, JSON.stringify({ error: 'Forbidden', message: 'Access denied by Web Application Firewall (WAF).' }));
      return;
    }

    // ─── OFFLINE STANDALONE API HANDLERS (Eliminates Browser 404 Console Errors) ───
    if (req.url.startsWith('/api/v1/license/heartbeat')) {
      sendResponse(res, 200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }, JSON.stringify({ success: true, status: 'active', clientMode: 'standalone', timestamp: new Date().toISOString() }));
      return;
    }

    if (req.url.startsWith('/api/v1/sync/pull')) {
      sendResponse(res, 200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }, JSON.stringify({ success: true, changes: [], version: 1, timestamp: new Date().toISOString() }));
      return;
    }

    if (req.url.startsWith('/api/v1/sync/push')) {
      sendResponse(res, 200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }, JSON.stringify({ success: true, synced: true, timestamp: new Date().toISOString() }));
      return;
    }

    if (req.url.startsWith('/api/v1/updates/check')) {
      sendResponse(res, 200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }, JSON.stringify({ updateAvailable: false, currentVersion: '2.4.0', latestVersion: '2.4.0', status: 'up_to_date' }));
      return;
    }

    if (req.url.startsWith('/api/v1/')) {
      sendResponse(res, 200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }, JSON.stringify({ success: true, offline: true }));
      return;
    }

    // ─── SMS API GATEWAY PROXY (SSRF Guarded & Prevents CORS Errors) ─────────────
    if (req.url.startsWith('/api/sms-proxy')) {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const targetUrl = parsedUrl.searchParams.get('url');

      if (!targetUrl) {
        sendResponse(res, 400, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }, JSON.stringify({ success: false, error: 'Missing target url parameter' }));
        return;
      }

      // Enforce SSRF Security Boundary
      if (!isSafeExternalUrl(targetUrl)) {
        console.warn(`[SSRF BLOCKED] Attacker IP: ${clientIp} attempted target: ${targetUrl}`);
        sendResponse(res, 400, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-SSRF-Protection': 'BLOCKED'
        }, JSON.stringify({ success: false, error: 'Security Violation: Private or loopback SSRF targets are strictly disallowed.' }));
        return;
      }

      try {
        const urlObj = new URL(targetUrl);
        const client = urlObj.protocol === 'http:' ? http : https;
        const proxyReq = client.get(targetUrl, { timeout: 8000 }, (proxyRes) => {
          const proxyHeaders = {
            ...SECURITY_HEADERS,
            'Content-Type': proxyRes.headers['content-type'] || 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          };
          res.writeHead(proxyRes.statusCode || 200, proxyHeaders);
          proxyRes.pipe(res);
        });

        proxyReq.on('timeout', () => {
          proxyReq.destroy();
          sendResponse(res, 504, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }, JSON.stringify({ success: false, error: 'Proxy request timed out' }));
        });

        proxyReq.on('error', (err) => {
          sendResponse(res, 502, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }, JSON.stringify({ success: false, error: 'Proxy request failed: ' + err.message }));
        });
      } catch (e) {
        sendResponse(res, 400, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }, JSON.stringify({ success: false, error: 'Invalid URL format' }));
      }
      return;
    }

    // ─── STATIC FILE HANDLING WITH DIRECTORY TRAVERSAL JAIL CHECK ────────────────
    const [rawPath, queryString] = req.url.split('?');
    let decodedRawPath = '';
    try {
      decodedRawPath = decodeURIComponent(rawPath);
    } catch (e) {
      sendResponse(res, 400, { 'Content-Type': 'text/plain' }, '400 Bad Request: Malformed URI');
      return;
    }

    const safePath = path.normalize(decodedRawPath).replace(/^(\.\.[\/\\])+/, '');
    const resolvedPath = path.resolve(PUBLIC_DIR, '.' + path.sep + safePath);

    // Strict Jail Boundary: Must not escape out of PUBLIC_DIR
    if (!resolvedPath.startsWith(path.resolve(PUBLIC_DIR))) {
      console.warn(`[PATH TRAVERSAL BLOCKED] Attacker IP: ${clientIp} Target: ${rawPath}`);
      sendResponse(res, 403, {
        'Content-Type': 'text/plain',
        'X-WAF-Protection': 'PATH-TRAVERSAL-BLOCKED'
      }, '403 Forbidden: Directory traversal blocked.');
      return;
    }

    let filePath = resolvedPath;

    // 1. Root route fallback
    if (safePath === '/' || safePath === '\\' || safePath === '' || safePath === '.') {
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
        sendResponse(res, 301, { 'Location': rawPath + '/' + (queryString ? '?' + queryString : '') });
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
        sendResponse(res, 301, { 'Location': rawPath + '/' + (queryString ? '?' + queryString : '') });
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

    let responseStatus = 200;
    if (!fs.existsSync(filePath) || isStillDir) {
      const notFoundPath = path.join(PUBLIC_DIR, '404.html');
      if (fs.existsSync(notFoundPath)) {
        filePath = notFoundPath;
        responseStatus = 404;
      } else {
        filePath = path.join(PUBLIC_DIR, 'dashboard', 'index.html');
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        sendResponse(res, 500, { 'Content-Type': 'text/plain' }, '500 Internal Server Error');
        return;
      }
      sendResponse(res, responseStatus, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }, content);
    });
  };

  createDualStackServer(3000, mainHandler, 'SMS LIVE SERVER');
}

startServers();
