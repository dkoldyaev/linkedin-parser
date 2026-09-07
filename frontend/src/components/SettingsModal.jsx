import React, { useState, useEffect } from 'react';
import { X, Settings, Key, Check, Bot, Cpu } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const [provider, setProvider] = useState('mistral');
  const [mistralKey, setMistralKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [mistralModel, setMistralModel] = useState('mistral-small-latest');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  
  const [mistralKeySet, setMistralKeySet] = useState(false);
  const [geminiKeySet, setGeminiKeySet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.llm_provider) setProvider(data.llm_provider);
          if (data.mistral_model) setMistralModel(data.mistral_model);
          if (data.gemini_model) setGeminiModel(data.gemini_model);
          setMistralKeySet(data.mistral_api_key_set);
          setGeminiKeySet(data.gemini_api_key_set);
        })
        .catch(err => console.error('Failed to load settings', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        llm_provider: provider,
        mistral_model: mistralModel,
        gemini_model: geminiModel,
      };
      if (mistralKey) payload.mistral_api_key = mistralKey;
      if (geminiKey) payload.gemini_api_key = geminiKey;

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setMistralKeySet(data.mistral_api_key_set);
        setGeminiKeySet(data.gemini_api_key_set);
        setMistralKey('');
        setGeminiKey('');
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={20} color="#6366f1" />
            <span>Настройки AI (Mistral / Gemini)</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            {/* Active Provider Selector */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bot size={15} />
                <span>Активная нейросеть для анализа вакансий:</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                <div
                  onClick={() => setProvider('mistral')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: provider === 'mistral' ? 'var(--primary)' : 'var(--border-subtle)',
                    background: provider === 'mistral' ? 'var(--primary-light)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ color: provider === 'mistral' ? '#a5b4fc' : 'var(--text-primary)' }}>Mistral AI</strong>
                    {provider === 'mistral' && <Check size={16} color="#6366f1" />}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Рекомендуется: mistral-small-latest
                  </span>
                </div>

                <div
                  onClick={() => setProvider('gemini')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: provider === 'gemini' ? 'var(--primary)' : 'var(--border-subtle)',
                    background: provider === 'gemini' ? 'var(--primary-light)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ color: provider === 'gemini' ? '#a5b4fc' : 'var(--text-primary)' }}>Google Gemini</strong>
                    {provider === 'gemini' && <Check size={16} color="#6366f1" />}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Рекомендуется: gemini-2.5-flash
                  </span>
                </div>
              </div>
            </div>

            {/* Mistral Settings */}
            <div style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              background: provider === 'mistral' ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '0.875rem' }}>Mistral AI конфигурация</strong>
                <span style={{ fontSize: '0.75rem', color: mistralKeySet ? '#10b981' : '#f59e0b' }}>
                  {mistralKeySet ? '● Ключ задан' : '○ Ключ не задан'}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Mistral API Key</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder={mistralKeySet ? "•••••••••••••••• (ключ сохранен, введите для замены)" : "Введите Mistral API ключ"}
                  value={mistralKey}
                  onChange={e => setMistralKey(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Модель Mistral</label>
                <input
                  type="text"
                  className="form-input"
                  value={mistralModel}
                  onChange={e => setMistralModel(e.target.value)}
                  placeholder="mistral-small-latest"
                />
              </div>
            </div>

            {/* Gemini Settings */}
            <div style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              background: provider === 'gemini' ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '0.875rem' }}>Google Gemini конфигурация</strong>
                <span style={{ fontSize: '0.75rem', color: geminiKeySet ? '#10b981' : '#f59e0b' }}>
                  {geminiKeySet ? '● Ключ задан' : '○ Ключ не задан'}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Gemini API Key</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder={geminiKeySet ? "•••••••••••••••• (ключ сохранен, введите для замены)" : "Введите Gemini API ключ"}
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Модель Gemini</label>
                <input
                  type="text"
                  className="form-input"
                  value={geminiModel}
                  onChange={e => setGeminiModel(e.target.value)}
                  placeholder="gemini-2.5-flash"
                />
              </div>
            </div>

            <div className="info-banner">
              <span>
                🔒 Ключи можно сохранить прямо здесь (они хранятся локально в SQLite базе) либо передать через <code>.env</code> переменные (<code>MISTRAL_API_KEY</code> / <code>GEMINI_API_KEY</code>).
              </span>
            </div>
          </div>

          <div className="modal-footer">
            {savedSuccess && (
              <span style={{ color: '#10b981', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={16} /> Настройки сохранены!
              </span>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Сохранить настройки
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
