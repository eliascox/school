const http = require('http');
const https = require('https');
const crypto = require('crypto');
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
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
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
const MAX_GLOBAL_REQ_PER_MIN = 600;
const MAX_API_REQ_PER_MIN = 120;

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, 3 * 60 * 1000).unref();

function isLoopbackClient(ip) {
  if (!ip) return false;
  const normalized = ip.replace(/^::ffff:/i, '').toLowerCase();
  return normalized === '127.0.0.1' || normalized === '::1' || normalized === 'localhost';
}

function isStaticFrontendAsset(rawUrl) {
  const pathname = (rawUrl || '').split('?')[0].toLowerCase();
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/downloads/')
  ) {
    return true;
  }
  return /\.(js|mjs|css|txt|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|webp|map)$/.test(pathname);
}

function checkRateLimit(ip, isApi, rawUrl = '') {
  // Never throttle static asset chunks, RSC prefetches, or local loopback UI navigation
  if (!isApi && (isLoopbackClient(ip) || isStaticFrontendAsset(rawUrl))) {
    return true;
  }

  const now = Date.now();
  let client = rateLimitMap.get(ip);
  if (!client || (now - client.windowStart > RATE_LIMIT_WINDOW_MS)) {
    client = { windowStart: now, count: 1, apiCount: isApi ? 1 : 0 };
    rateLimitMap.set(ip, client);
    return true;
  }

  if (isApi) {
    client.apiCount = (client.apiCount || 0) + 1;
    return client.apiCount <= MAX_API_REQ_PER_MIN;
  }

  client.count++;
  return client.count <= MAX_GLOBAL_REQ_PER_MIN;
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
    if (!checkRateLimit(clientIp, isApi, req.url)) {
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
      }, JSON.stringify({
        success: true,
        status: 'ACTIVE',
        isAllowed: true,
        isApproved: true,
        clientMode: 'standalone',
        timestamp: new Date().toISOString()
      }));
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

const ALLOWED_SMS_PROXY_HOSTS = new Set([
  'bulksmsdhaka.net',
  'www.bulksmsdhaka.net',
  'bulksmsbd.net',
  'www.bulksmsbd.net',
  'portal.bulksmsbd.com',
  'api.greenweb.com.bd'
]);

    // ─── SMS API GATEWAY PROXY (SSRF Guarded & Prevents CORS / Query Key Exposure) ─
    if (req.url.startsWith('/api/sms-proxy')) {
      const handleSmsProxyTarget = (targetUrl) => {
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
          if (!ALLOWED_SMS_PROXY_HOSTS.has(urlObj.hostname.toLowerCase())) {
            sendResponse(res, 403, {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*'
            }, JSON.stringify({ success: false, error: 'Forbidden SMS gateway hostname' }));
            return;
          }
          // Optional server-managed API key injection
          if (urlObj.hostname.toLowerCase().endsWith('bulksmsbd.net') && (!urlObj.searchParams.get('api_key') || urlObj.searchParams.get('api_key') === 'SERVER_MANAGED') && process.env.BULKSMSBD_API_KEY) {
            urlObj.searchParams.set('api_key', process.env.BULKSMSBD_API_KEY);
          }
          if (urlObj.hostname.toLowerCase().endsWith('bulksmsdhaka.net') && (!urlObj.searchParams.get('apikey') || urlObj.searchParams.get('apikey') === 'SERVER_MANAGED') && process.env.BULKSMSDHAKA_API_KEY) {
            urlObj.searchParams.set('apikey', process.env.BULKSMSDHAKA_API_KEY);
          }
          const safeTargetUrl = urlObj.toString();
          const client = urlObj.protocol === 'http:' ? http : https;
          const proxyReq = client.get(safeTargetUrl, { timeout: 8000 }, (proxyRes) => {
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
      };

      if (req.method === 'POST') {
        let bodyData = '';
        req.on('data', (chunk) => {
          if (bodyData.length < 32768) bodyData += chunk;
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(bodyData || '{}');
            handleSmsProxyTarget(parsed.url || '');
          } catch {
            sendResponse(res, 400, {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*'
            }, JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
          }
        });
        return;
      }

      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      handleSmsProxyTarget(parsedUrl.searchParams.get('url'));
      return;
    }

    // ─── ONLINE PAYMENT GATEWAY SANDBOX / VERIFICATION HANDLER ────────────────
    if (req.url.startsWith('/api/payment-gateway') && req.method === 'POST') {
      let bodyData = '';
      req.on('data', (chunk) => {
        if (bodyData.length < 32768) bodyData += chunk;
      });
      req.on('end', () => {
        try {
          const body = JSON.parse(bodyData || '{}');
          const provider = body.provider;
          const amount = Number(body.amount || 0);
          const studentId = String(body.studentId || '').trim();
          const action = body.action === 'verify' ? 'verify' : 'initiate';
          const allowed = new Set(['bKash', 'Nagad', 'SSLCommerz']);
          if (!allowed.has(provider) || !Number.isFinite(amount) || amount <= 0 || !studentId) {
            sendResponse(res, 400, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify({ success: false, error: 'Invalid payment payload' }));
            return;
          }
          const cleanTrx = String(body.trxId || '').trim().toUpperCase();
          if (action === 'verify' && cleanTrx.length < 6) {
            sendResponse(res, 400, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify({ success: false, error: 'Invalid transaction ID' }));
            return;
          }
          const trxId = cleanTrx || `${provider.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
          const secret = process.env.PAYMENT_GATEWAY_SECRET || 'sms-local-gateway-verify-2026';
          const signature = crypto.createHmac('sha256', secret).update([provider, studentId, amount, trxId].join('|')).digest('hex').slice(0, 16).toUpperCase();
          sendResponse(res, 200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }, JSON.stringify({ success: true, mode: 'sandbox', verified: action === 'verify', provider, amount, studentId, trxId, signature }));
        } catch {
          sendResponse(res, 400, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify({ success: false, error: 'Malformed JSON payload' }));
        }
      });
      return;
    }

    // ─── ZKTECO / BIOMETRIC PUSH ATTENDANCE ADMS / JSON RECEIVER ───────────────
    if (req.url.startsWith('/api/biometric/zkteco-push')) {
      global.__smsBiometricPunchQueue = global.__smsBiometricPunchQueue || [];
      const queue = global.__smsBiometricPunchQueue;
      const expectedToken = process.env.ZKTECO_PUSH_TOKEN || '';
      const providedToken = req.headers['x-device-token'] || '';
      if (expectedToken && providedToken !== expectedToken) {
        sendResponse(res, 401, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify({ success: false, error: 'Unauthorized device token' }));
        return;
      }

      if (req.method === 'GET') {
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const shouldClear = parsedUrl.searchParams.get('clear') === '1';
        const punches = [...queue];
        if (shouldClear) {
          queue.length = 0;
        }
        sendResponse(res, 200, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify({ success: true, punches }));
        return;
      }

      if (req.method === 'POST') {
        let bodyData = '';
        req.on('data', (chunk) => {
          if (bodyData.length < 262144) bodyData += chunk;
        });
        req.on('end', () => {
          try {
            const trimmed = bodyData.trim();
            if (!trimmed) {
              sendResponse(res, 400, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify({ success: false, error: 'Empty punch payload' }));
              return;
            }
            const accepted = [];
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
              const parsed = JSON.parse(trimmed);
              const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed.punches) ? parsed.punches : [parsed];
              for (const item of items) {
                const userId = String(item.userId || item.roll || item.pin || '').trim();
                const timestamp = String(item.timestamp || item.time || new Date().toISOString()).trim();
                if (!userId) continue;
                accepted.push({
                  userId,
                  timestamp,
                  deviceId: String(item.deviceId || req.headers['x-device-sn'] || 'ZKTECO-PUSH').trim(),
                  state: String(item.state || item.status || '0').trim()
                });
              }
            } else {
              const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
              for (const line of lines) {
                const parts = line.split(/[\t,]+/).map((p) => p.trim());
                if (parts.length >= 2 && parts[0]) {
                  accepted.push({
                    userId: parts[0],
                    timestamp: parts[1],
                    deviceId: String(parts[3] || req.headers['x-device-sn'] || 'ZKTECO-ADMS').trim(),
                    state: String(parts[2] || '0').trim()
                  });
                }
              }
            }
            if (accepted.length === 0) {
              sendResponse(res, 400, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify({ success: false, error: 'No valid biometric punch records found' }));
              return;
            }
            queue.push(...accepted);
            if (queue.length > 500) {
              queue.splice(0, queue.length - 500);
            }
            sendResponse(res, 200, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify({ success: true, accepted: accepted.length, totalBuffered: queue.length }));
          } catch {
            sendResponse(res, 400, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify({ success: false, error: 'Malformed biometric payload' }));
          }
        });
        return;
      }

      sendResponse(res, 405, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify({ success: false, error: 'Method not allowed' }));
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

    // 2. Directory handling: serve index.html directly for both /route and /route/
    if (isDir) {
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

    // 5. Subdirectory index.html fallback
    if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
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
    const isImmutableNextAsset =
      responseStatus === 200 &&
      (decodedRawPath.startsWith('/_next/static/') ||
        /\.(woff|woff2|ttf|png|jpg|jpeg|svg|ico|webp)$/.test(ext));

    fs.readFile(filePath, (err, content) => {
      if (err) {
        sendResponse(res, 500, { 'Content-Type': 'text/plain' }, '500 Internal Server Error');
        return;
      }
      const cacheHeaders = isImmutableNextAsset
        ? { 'Cache-Control': 'public, max-age=31536000, immutable' }
        : {
            'Cache-Control': 'no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          };
      sendResponse(res, responseStatus, {
        'Content-Type': contentType,
        ...cacheHeaders
      }, content);
    });
  };

  createDualStackServer(3000, mainHandler, 'SMS LIVE SERVER');
}

startServers();
