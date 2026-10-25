const promptInput = document.getElementById('promptInput');
const outputDiv = document.getElementById('aiOutput');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const statusBadge = document.getElementById('statusBadge');

function setStatus(message, state = '') {
    statusBadge.textContent = message;
    statusBadge.className = `status-badge${state ? ` ${state}` : ''}`;
}

async function sendPrompt() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        setStatus('Введите запрос', 'error');
        promptInput.focus();
        return;
    }

    generateBtn.disabled = true;
    outputDiv.classList.remove('error');
    outputDiv.classList.add('loading');
    outputDiv.textContent = 'Нейросеть думает…';
    setStatus('Генерирую…', 'active');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Ошибка сервера (${response.status})`);
        outputDiv.textContent = data.answer || 'Модель вернула пустой ответ.';
        setStatus('Готово');
    } catch (error) {
        outputDiv.textContent = error.message || 'Не удалось получить ответ. Проверьте подключение и настройки.';
        outputDiv.classList.add('error');
        setStatus('Ошибка', 'error');
    } finally {
        outputDiv.classList.remove('loading');
        generateBtn.disabled = false;
    }
}

function clearForm() {
    promptInput.value = '';
    outputDiv.textContent = 'Ответ появится здесь.';
    outputDiv.classList.remove('loading', 'error');
    setStatus('Ожидание');
    promptInput.focus();
}

generateBtn.addEventListener('click', sendPrompt);
clearBtn.addEventListener('click', clearForm);
promptInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) sendPrompt();
});
