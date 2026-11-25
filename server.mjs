// Zero-dependency local dev server that mirrors Vercel:
// - Reads .env automatically into process.env
// - Serves static files (index.html, app.js, styles.css, renders/)
// - Routes /api/analyze-plan and /api/render-plan to ./api/*.js

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import analyzePlanHandler from './api/analyze-plan.js';
import renderPlanHandler from './api/render-plan.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8766;

// Load .env from project root
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key) process.env[key] = val;
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 20 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Reload .env on API calls so editing .env works without restarting server!
  const urlPath = (req.url || '/').split('?')[0];

  if (urlPath === '/api/analyze-plan' || urlPath === '/api/render-plan') {
    loadEnv();
    try {
      req.body = await readJsonBody(req);
    } catch (e) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      return;
    }
    if (urlPath === '/api/analyze-plan') return analyzePlanHandler(req, res);
    if (urlPath === '/api/render-plan') return renderPlanHandler(req, res);
  }

  // Static files
  let relPath = urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath).replace(/^\/+/, '');
  const fullPath = path.resolve(__dirname, relPath);
  if (!fullPath.startsWith(__dirname) || relPath.startsWith('.env')) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(content);
  });
});

loadEnv();
server.listen(PORT, '127.0.0.1', () => {
  const hasKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'PASTE_YOUR_GEMINI_API_KEY_HERE';
  console.log(`3D Home server running at http://127.0.0.1:${PORT}`);
  console.log(`Gemini API key configured: ${hasKey ? 'YES' : 'NO (edit .env)'}`);
});
