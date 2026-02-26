async function generateIdea() {
    if (isLoading) return;

    // Добавьте эту проверку для отладки
    console.log('API_KEY length:', API_KEY ? API_KEY.length : 0);
    console.log('API_KEY starts with:', API_KEY ? API_KEY.substring(0, 10) : 'empty');
    
    if (!API_KEY || API_KEY === '') {
        showError('API ключ не настроен');
        setLoadingState(false);
        return;
    }

    setLoadingState(true);
// ==============================================
        // ⚡ НАСТРОЙКИ OPENROUTER
        // ==============================================
        const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
        
        // Создайте бесплатный аккаунт и получите ключ: https://openrouter.ai/keys
        const API_KEY = '';
        
        // Модель (бесплатная)
        const MODEL = 'arcee-ai/trinity-large-preview:free';
        // ==============================================

        // Элементы DOM
        const outputDiv = document.getElementById('aiOutput');
        const generateBtn = document.getElementById('generateBtn');
        const clearBtn = document.getElementById('clearBtn');
        const statusBadge = document.getElementById('statusBadge');

        let isLoading = false;

        function setLoadingState(loading) {
            isLoading = loading;
            generateBtn.disabled = loading;
            
            if (loading) {
                outputDiv.classList.add('loading');
                outputDiv.classList.remove('error');
                statusBadge.innerHTML = '⏳ Генерирую...';
                statusBadge.className = 'status-badge active';
            } else {
                outputDiv.classList.remove('loading');
                statusBadge.innerHTML = 'Готов к работе';
                statusBadge.className = 'status-badge';
            }
        }

        function showError(message) {
            outputDiv.classList.add('error');
            outputDiv.classList.remove('loading');
            outputDiv.textContent = `❌ Ошибка: ${message}`;
            statusBadge.innerHTML = '⚠️ Ошибка';
            statusBadge.className = 'status-badge error';
        }

        function clearOutput() {
            outputDiv.classList.remove('error', 'loading');
            outputDiv.textContent = '✨ Нажмите кнопку «Сгенерировать идею» — нейросеть придумает уникальную концепцию';
            statusBadge.innerHTML = 'Ожидание';
            statusBadge.className = 'status-badge';
        }

        async function generateIdea() {
            if (isLoading) return;

            setLoadingState(true);

            const promptText = `Сгенерируй 3 оригинальные шутки в 2026 году
Форматируй ответ красиво, с эмодзи.`;

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'AI Generator'
                    },
                    body: JSON.stringify({
                        model: MODEL,
                        messages: [
                            {
                                role: 'user',
                                content: promptText
                            }
                        ],
                        temperature: 0.8,
                        max_tokens: 500
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                // Извлекаем текст ответа
                const aiText = data.choices?.[0]?.message?.content || 'Ответ не получен';
                
                outputDiv.classList.remove('error');
                outputDiv.textContent = aiText;
                

            } catch (error) {
                console.error('Детали ошибки:', error);
                showError(error.message);
            } finally {
                setLoadingState(false);
            }
        }

        generateBtn.addEventListener('click', generateIdea);
        clearBtn.addEventListener('click', clearOutput);
        

        console.log('✅ AI Генератор готов. Используется OpenRouter API');

