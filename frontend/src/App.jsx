import React, { useState, useEffect, useCallback } from 'react';
import { 
  Briefcase, Plus, Search, Filter, Settings, 
  RefreshCw, CheckCircle2, AlertCircle, X, Sparkles
} from 'lucide-react';
import KanbanBoard from './components/KanbanBoard';
import BatchImportModal from './components/BatchImportModal';
import VacancyModal from './components/VacancyModal';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [vacancies, setVacancies] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Modals state
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState(null);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchVacancies = useCallback(async () => {
    try {
      let url = '/api/vacancies';
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedTag) params.append('tag', selectedTag);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVacancies(data);
      }
    } catch (err) {
      console.error('Failed to fetch vacancies', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedTag]);

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setAllTags(data);
      }
    } catch (err) {
      console.error('Failed to fetch tags', err);
    }
  };

  useEffect(() => {
    fetchVacancies();
    fetchTags();
  }, [fetchVacancies]);

  // Handle status change from drag & drop or quick move
  const handleStatusChange = async (vacancyId, newStatus) => {
    // Optimistic UI update
    setVacancies(prev => prev.map(v => v.id === vacancyId ? { ...v, status: newStatus } : v));
    if (selectedVacancy && selectedVacancy.id === vacancyId) {
      setSelectedVacancy(prev => ({ ...prev, status: newStatus }));
    }

    try {
      const res = await fetch(`/api/vacancies/${vacancyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        throw new Error('Update failed');
      }
      showToast(`Перемещено в «${newStatus}»`);
    } catch (err) {
      console.error('Failed to update status', err);
      // Revert if failed
      fetchVacancies();
      showToast('Не удалось обновить статус', 'error');
    }
  };

  const handleVacancyUpdate = (updatedVacancy) => {
    setVacancies(prev => prev.map(v => v.id === updatedVacancy.id ? updatedVacancy : v));
    setSelectedVacancy(updatedVacancy);
    fetchTags();
  };

  const handleVacancyDelete = (deletedId) => {
    setVacancies(prev => prev.filter(v => v.id !== deletedId));
    setSelectedVacancy(null);
    fetchTags();
    showToast('Вакансия удалена');
  };

  const handleImportComplete = () => {
    fetchVacancies();
    fetchTags();
    showToast('Пакетный импорт успешно завершен!');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Briefcase size={20} />
          </div>
          <div>
            <h1 className="brand-title">LinkedIn Jobs Tracker</h1>
            <p className="brand-subtitle">AI-саммари & Канбан воронка</p>
          </div>
        </div>

        <div className="header-center">
          <div className="search-bar">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Поиск по вакансиям, компаниям, стеку..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="header-actions">
          <button className="btn btn-secondary btn-icon" onClick={() => fetchVacancies()} title="Обновить">
            <RefreshCw size={16} />
          </button>
          
          <button className="btn btn-secondary btn-icon" onClick={() => setIsSettingsOpen(true)} title="Настройки AI">
            <Settings size={16} />
          </button>

          <button className="btn btn-primary" onClick={() => setIsBatchOpen(true)}>
            <Plus size={16} />
            <span>Добавить вакансии</span>
          </button>
        </div>
      </header>

      {/* Filter bar for Tags */}
      {allTags.length > 0 && (
        <div className="filter-bar">
          <div className="filter-label">
            <Filter size={12} />
            <span>Метки:</span>
          </div>
          <button
            className={`tag-filter-chip ${selectedTag === '' ? 'active' : ''}`}
            onClick={() => setSelectedTag('')}
          >
            Все ({vacancies.length})
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`tag-filter-chip ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <KanbanBoard
          vacancies={vacancies}
          onCardClick={(vacancy) => setSelectedVacancy(vacancy)}
          onStatusChange={handleStatusChange}
        />
      </main>

      {/* Modals */}
      <BatchImportModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onImportComplete={handleImportComplete}
      />

      <VacancyModal
        vacancy={selectedVacancy}
        isOpen={Boolean(selectedVacancy)}
        onClose={() => setSelectedVacancy(null)}
        onUpdate={handleVacancyUpdate}
        onDelete={handleVacancyDelete}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Toast Notifications */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} color="#10b981" />
            ) : (
              <AlertCircle size={16} color="#ef4444" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
