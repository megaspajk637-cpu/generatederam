module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Метод не поддерживается.' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ error: 'В Vercel не задана переменная OPENROUTER_API_KEY.' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') body = JSON.parse(body);
        const prompt = body?.prompt;
        if (typeof prompt !== 'string' || !prompt.trim()) {
            return res.status(400).json({ error: 'Введите текст запроса.' });
        }
        if (prompt.length > 10000) {
            return res.status(400).json({ error: 'Запрос слишком длинный. Максимум — 10 000 символов.' });
        }

        const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://vercel.app',
                'X-Title': 'AI Generator'
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b',
                messages: [{ role: 'user', content: prompt.trim() }],
                max_tokens: 1000
            })
        });

        const data = await upstream.json().catch(() => ({}));
        if (!upstream.ok) {
            return res.status(502).json({
                error: data.error?.message || `OpenRouter вернул ошибку ${upstream.status}.`
            });
        }

        const answer = data.choices?.[0]?.message?.content;
        if (typeof answer !== 'string' || !answer.trim()) {
            return res.status(502).json({ error: 'Модель не вернула текстовый ответ.' });
        }
        return res.status(200).json({ answer });
    } catch {
        return res.status(400).json({ error: 'Не удалось обработать запрос. Проверьте формат запроса.' });
    }
};
