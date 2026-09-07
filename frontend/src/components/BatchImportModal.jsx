import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function BatchImportModal({ isOpen, onClose, onImportComplete, queueRemaining = 0 }) {
  const [urlsText, setUrlsText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const urls = urlsText
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urls.length === 0) {
      setError('Пожалуйста, введите хотя бы одну ссылку на вакансию.');
      return;
    }

    const defaultTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/vacancies/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls,
          default_tags: defaultTags
        })
      });

      if (!res.ok) {
        throw new Error(`Ошибка сервера: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      setUrlsText('');
      setTagsInput('');
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setError(err.message || 'Произошла ошибка при отправке в очередь');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    setUrlsText('');
    setTagsInput('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <UploadCloud size={20} color="#6366f1" />
            <span>Пакетный импорт вакансий LinkedIn</span>
          </div>
          <button className="btn-icon" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="info-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="info-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7' }}>
                <CheckCircle size={18} />
                <div>
                  <strong>{result.status === 'queued' ? 'Задачи поставлены в очередь!' : 'Импорт завершен!'}</strong>{' '}
                  {result.status === 'queued' 
                    ? `Добавлено ссылок: ${result.queued}. Новые карточки будут появляться на доске в реальном времени через Mercure SSE.`
                    : `Успешно: ${result.imported} из ${result.total}.`}
                </div>
              </div>
            )}

            {queueRemaining > 0 && (
              <div className="info-banner" style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.4)', color: '#c7d2fe' }}>
                <Loader2 size={18} className="spin" style={{ animation: 'spin 1.2s linear infinite', flexShrink: 0 }} />
                <div>
                  Осталось обработать в очереди: <strong>{queueRemaining}</strong> {queueRemaining === 1 ? 'ссылку' : 'ссылок'}.
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#a5b4fc', marginTop: '2px' }}>
                    Вы можете закрыть это окно — парсинг продолжится в фоне, карточки появятся на Канбан-доске сами.
                  </span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Ссылки на вакансии LinkedIn (каждая с новой строки):
              </label>
              <textarea
                className="form-textarea"
                rows={7}
                placeholder="https://www.linkedin.com/jobs/view/4462938317/&#10;https://www.linkedin.com/jobs/view/senior-python-developer-1234567890/&#10;https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4192503234"
                value={urlsText}
                onChange={e => setUrlsText(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Общие метки для всей пачки (через запятую, необязательно):
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="например: python, remote, eu, high-priority"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="info-banner">
              <span>
                💡 <strong>Асинхронная обработка:</strong> Бэкенд сохраняет ссылки в очередь и поочередно скрейпит данные и запрашивает AI-саммари. Как только карточка готова, Mercure отправляет её в интерфейс без перезагрузки страницы.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
              Закрыть
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Ставим в очередь...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>Поставить в очередь</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
