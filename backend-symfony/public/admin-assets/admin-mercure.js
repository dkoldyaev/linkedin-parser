(function () {
    'use strict';

    if (window.__mercureAdminInitialized) {
        return;
    }
    window.__mercureAdminInitialized = true;

    function getOrCreateContainer() {
        let container = document.getElementById('mercure-admin-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'mercure-admin-toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function showToast(title, message, type) {
        const container = getOrCreateContainer();
        const toast = document.createElement('div');
        toast.className = 'mercure-admin-toast ' + type;

        const body = document.createElement('div');
        const strong = document.createElement('strong');
        strong.style.display = 'block';
        strong.style.marginBottom = '4px';
        strong.textContent = title;
        body.appendChild(strong);

        const span = document.createElement('span');
        span.textContent = message;
        body.appendChild(span);
        toast.appendChild(body);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.textContent = '×';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#94a3b8';
        closeBtn.style.fontSize = '18px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.marginLeft = '12px';
        closeBtn.onclick = function () {
            toast.remove();
        };
        toast.appendChild(closeBtn);

        container.appendChild(toast);
        setTimeout(function () {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 7000);
    }

    function initMercure() {
        try {
            const url = new URL('/.well-known/mercure', window.location.origin);
            url.searchParams.append('topic', 'vacancies');

            const eventSource = new EventSource(url.toString(), { withCredentials: true });

            eventSource.onmessage = function (event) {
                try {
                    const data = JSON.parse(event.data);
                    const type = data.type;
                    const payload = data.data;

                    if (type === 'vacancy_updated' || type === 'vacancy_created') {
                        const scoreInfo = payload && payload.match_score ? ' (Совместимость: ' + Math.round(payload.match_score) + '%)' : '';
                        const titleText = (payload && (payload.title || ('ID ' + payload.id))) + scoreInfo;
                        showToast('Mercure: Вакансия обновлена', titleText, 'success');
                    } else if (type === 'queue_updated') {
                        const taskInfo = (payload && payload.task_id) ? payload.task_id : 'Задача';
                        const statusInfo = (payload && payload.status) ? payload.status : 'обновлено';
                        showToast('Mercure: Очередь задач', taskInfo + ': ' + statusInfo, 'info');
                    } else if (type === 'task_failed') {
                        const errText = (payload && payload.error) ? payload.error : 'Неизвестная ошибка';
                        showToast('Mercure: Сбой задачи', errText, 'error');
                    }
                } catch (err) {
                    console.error('[Mercure Admin] JSON parse error', err);
                }
            };

            eventSource.onerror = function (err) {
                console.warn('[Mercure Admin] SSE connection state or reconnecting...', err);
            };
        } catch (e) {
            console.error('[Mercure Admin] Init failed', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMercure);
    } else {
        initMercure();
    }
})();
