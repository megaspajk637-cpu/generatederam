const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b';

// Загружает значения из .env, не перезаписывая уже заданные переменные окружения.
function loadEnvFile() {
    const envPath = path.join(ROOT, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (match && !match[1].startsWith('#') && process.env[match[1]] === undefined) {
            process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
        }
    }
}
loadEnvFile();

function sendJson(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
}

function readJson(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.setEncoding('utf8');
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 20000) {
                reject(new Error('Слишком большой запрос. Ограничение — 10 000 символов.'));
                req.destroy();
            }
        });
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch { reject(new Error('Не удалось прочитать запрос.')); }
        });
        req.on('error', reject);
    });
}

async function handleChat(req, res) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return sendJson(res, 503, { error: 'Не задан OPENROUTER_API_KEY. Добавьте ключ в файл .env и перезапустите сервер.' });

    try {
        const { prompt } = await readJson(req);
        if (typeof prompt !== 'string' || !prompt.trim()) return sendJson(res, 400, { error: 'Введите текст запроса.' });
        if (prompt.length > 10000) return sendJson(res, 400, { error: 'Запрос слишком длинный. Максимум — 10 000 символов.' });

        const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': `http://localhost:${PORT}`,
                'X-Title': 'AI Generator'
            },
            body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: prompt.trim() }], max_tokens: 1000 })
        });
        const data = await upstream.json().catch(() => ({}));
        if (!upstream.ok) {
            const message = data.error?.message || `OpenRouter вернул ошибку ${upstream.status}.`;
            return sendJson(res, 502, { error: message });
        }
        const answer = data.choices?.[0]?.message?.content;
        if (typeof answer !== 'string' || !answer.trim()) return sendJson(res, 502, { error: 'Модель не вернула текстовый ответ.' });
        return sendJson(res, 200, { answer });
    } catch (error) {
        if (!res.headersSent && !res.destroyed) sendJson(res, 400, { error: error.message || 'Не удалось обработать запрос.' });
    }
}

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/chat') return void handleChat(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'Метод не поддерживается.' });

    const pathname = new URL(req.url, `http://localhost:${PORT}`).pathname;
    const files = { '/': 'index.html', '/index.html': 'index.html', '/index.css': 'index.css', '/client.js': 'client.js' };
    const file = files[pathname];
    if (!file) return sendJson(res, 404, { error: 'Страница не найдена.' });
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
    res.writeHead(200, { 'Content-Type': types[path.extname(file)], 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(path.join(ROOT, file)).pipe(res);
});

server.listen(PORT, () => console.log(`Приложение запущено: http://localhost:${PORT}`));


