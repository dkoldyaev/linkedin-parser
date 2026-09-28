import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Briefcase, Plus, Search, Filter, Settings, 
  RefreshCw, CheckCircle2, AlertCircle, X, Loader2,
  Globe, MapPin, RotateCcw, ChevronDown, Laptop, LogOut
} from 'lucide-react';
import KanbanBoard from './components/KanbanBoard';
import BatchImportModal from './components/BatchImportModal';
import VacancyModal from './components/VacancyModal';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import { useTranslation } from './i18n/I18nContext';
import { setAnalyticsUser, trackEvent, EVENTS } from './utils/analytics';

export default function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [vacancies, setVacancies] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [allCountries, setAllCountries] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [search, setSearch] = useState('');
  const onChangeSearch = (event) => {
    const val = event.target.value;
    setSearch(val);
  };
  const resetSearch = () => {
    trackEvent(EVENTS.SEARCH_APPLIED, { query_length: 0 });
    setSearch('');
  };
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedWorkplaceType, setSelectedWorkplaceType] = useState('');

  // Queue & Mercure state
  const [queueRemaining, setQueueRemaining] = useState(0);
  const [mercureStatus, setMercureStatus] = useState('connecting'); // 'connected' | 'connecting'

  // Modals state
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState(null);

  // Multiselect state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkTagInput, setBulkTagInput] = useState('');

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setAuthLoading(true);
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setAnalyticsUser(userData);
      } else {
        setUser(null);
        setAnalyticsUser(null);
      }
    } catch (err) {
      console.debug('Auth check error', err);
      setUser(null);
      setAnalyticsUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    trackEvent(EVENTS.LOGOUT);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed', err);
    }
    setUser(null);
    setAnalyticsUser(null);
    setVacancies([]);
    setAllTags([]);
    setAllCountries([]);
    setAllCities([]);
  };

  const fetchVacancies = useCallback(async () => {
    if (!user) return;
    try {
      let url = '/api/vacancies';
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedTag) params.append('tag', selectedTag);
      if (selectedCountry) params.append('country', selectedCountry);
      if (selectedCity) params.append('city', selectedCity);
      if (selectedWorkplaceType) params.append('workplace_type', selectedWorkplaceType);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVacancies(data);
      }
    } catch (err) {
      console.error('Failed to fetch vacancies', err);
    }
  }, [user, search, selectedTag, selectedCountry, selectedCity, selectedWorkplaceType]);

  const fetchTags = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setAllTags(data);
      }
    } catch (err) {
      console.error('Failed to fetch tags', err);
    }
  }, [user]);

  const fetchCountries = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/countries');
      if (res.ok) {
        const data = await res.json();
        setAllCountries(data);
      }
    } catch (err) {
      console.error('Failed to fetch countries', err);
    }
  }, [user]);

  const fetchCities = useCallback(async (countryFilter = '') => {
    if (!user) return;
    try {
      const url = countryFilter ? `/api/cities?country=${encodeURIComponent(countryFilter)}` : '/api/cities';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAllCities(data);
      }
    } catch (err) {
      console.error('Failed to fetch cities', err);
    }
  }, [user]);

  const handleCountryChange = (country) => {
    trackEvent(EVENTS.FILTER_COUNTRY, { country: country || 'all' });
    setSelectedCountry(country);
    setSelectedCity('');
    fetchCities(country);
  };

  const resetAllFilters = () => {
    trackEvent(EVENTS.FILTERS_RESET);
    setSelectedTag('');
    setSelectedCountry('');
    setSelectedCity('');
    setSelectedWorkplaceType('');
    setSearch('');
    fetchCities('');
  };

  const fetchQueueStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/queue/status');
      if (res.ok) {
        const data = await res.json();
        if (data.total_remaining !== undefined) {
          setQueueRemaining(data.total_remaining);
        }
      }
    } catch (err) {
      console.debug('Failed to fetch queue status', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchVacancies();
    fetchTags();
    fetchCountries();
    fetchCities(selectedCountry);
    fetchQueueStatus();
  }, [user, fetchVacancies, fetchTags, fetchCountries, fetchCities, fetchQueueStatus, selectedCountry]);

  const callbacksRef = useRef({});
  callbacksRef.current = {
    fetchTags,
    fetchVacancies,
    fetchCountries,
    fetchCities,
    selectedCountry,
    showToast,
    t
  };

  // Connect to Mercure SSE Hub for real-time updates
  useEffect(() => {
    if (!user) return;
    let eventSource = null;
    let isSubscribed = true;

    const initMercure = async () => {
      try {
        setMercureStatus('connecting');
        let hubUrl = 'http://localhost:3000/.well-known/mercure';
        let topic = `vacancies:${user.id}`;

        try {
          const configRes = await fetch('/api/config');
          if (configRes.ok) {
            const cfg = await configRes.json();
            if (cfg.mercure_hub_url) hubUrl = cfg.mercure_hub_url;
            if (cfg.mercure_topic) topic = cfg.mercure_topic;
          }
        } catch (e) {
          console.warn('Could not fetch /api/config, fallback to default Mercure hub', e);
        }

        if (!isSubscribed) return;

        const sseUrl = new URL(hubUrl);
        sseUrl.searchParams.append('topic', topic);

        eventSource = new EventSource(sseUrl.toString());

        eventSource.onopen = () => {
          if (isSubscribed) {
            setMercureStatus('connected');
          }
        };

        eventSource.onerror = () => {
          if (isSubscribed) {
            setMercureStatus('connecting');
          }
        };

        eventSource.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);
            const { type, error_code, vacancy, total_remaining, url } = data;
            const {
              fetchTags: currentFetchTags,
              fetchVacancies: currentFetchVacancies,
              fetchCountries: currentFetchCountries,
              fetchCities: currentFetchCities,
              selectedCountry: currentSelectedCountry,
              showToast: currentShowToast,
              t: currentT
            } = callbacksRef.current;

            if (total_remaining !== undefined) {
              setQueueRemaining(total_remaining);
            }

            if (type === 'vacancy_created' && vacancy) {
              setVacancies(prev => {
                const exists = prev.some(v => v.id === vacancy.id);
                if (exists) {
                  return prev.map(v => v.id === vacancy.id ? vacancy : v);
                }
                return [vacancy, ...prev];
              });
              currentShowToast(currentT('mercure.vacancy_created', { title: vacancy.title, company: vacancy.company }));
              currentFetchTags();
              currentFetchCountries();
              currentFetchCities(currentSelectedCountry);
            } else if (type === 'vacancy_updated' && vacancy) {
              setVacancies(prev => prev.map(v => v.id === vacancy.id ? vacancy : v));
              setSelectedVacancy(prev => (prev && prev.id === vacancy.id ? vacancy : prev));
              currentShowToast(currentT('mercure.vacancy_updated', { title: vacancy.title }));
              currentFetchTags();
              currentFetchCountries();
              currentFetchCities(currentSelectedCountry);
            } else if (type === 'task_failed') {
              const errText = error_code ? currentT(`mercure.errors.${error_code}`) : (data.error || currentT('mercure.errors.ERR_UNKNOWN'));
              currentShowToast(currentT('mercure.task_failed', { error: errText, url: url || '' }), 'error');
            } else if (type === 'queue_updated') {
              if (total_remaining !== undefined) {
                setQueueRemaining(total_remaining);
              }
            } else if (type === 'queue_idle') {
              setQueueRemaining(0);
              currentShowToast(currentT('mercure.queue_idle'));
              currentFetchVacancies();
              currentFetchTags();
              currentFetchCountries();
              currentFetchCities(currentSelectedCountry);
            }
          } catch (err) {
            console.error('Failed to parse Mercure message', err);
          }
        };
      } catch (err) {
        console.error('Failed to initialize Mercure EventSource', err);
        if (isSubscribed) setMercureStatus('connecting');
      }
    };

    initMercure();

    return () => {
      isSubscribed = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user]);

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
      const updatedVacancy = await res.json();
      setVacancies(prev => prev.map(v => v.id === vacancyId ? updatedVacancy : v));
      if (selectedVacancy && selectedVacancy.id === vacancyId) {
        setSelectedVacancy(updatedVacancy);
      }
      const localizedStatus = t(`kanban.columns.${newStatus}`);
      showToast(t('nav.moved_to', { status: localizedStatus }));
    } catch (err) {
      console.error('Failed to update status', err);
      fetchVacancies();
      showToast(t('nav.update_status_failed'), 'error');
    }
  };

  const handleStatusChangeMulti = async (vacancyIds, newStatus) => {
    setVacancies(prev => prev.map(v => vacancyIds.includes(v.id) ? { ...v, status: newStatus } : v));
    try {
      await Promise.all(vacancyIds.map(vid => 
        fetch(`/api/vacancies/${vid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })
      ));
      fetchVacancies();
      const localizedStatus = t(`kanban.columns.${newStatus}`);
      showToast(t('nav.moved_to', { status: localizedStatus }));
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to update status', err);
      fetchVacancies();
      showToast(t('nav.update_status_failed'), 'error');
    }
  };

  const handleVacancyUpdate = (updatedVacancy) => {
    setVacancies(prev => prev.map(v => v.id === updatedVacancy.id ? updatedVacancy : v));
    setSelectedVacancy(updatedVacancy);
    fetchTags();
    fetchCountries();
    fetchCities(selectedCountry);
  };

  const handleVacancyDelete = (deletedId) => {
    setVacancies(prev => prev.filter(v => v.id !== deletedId));
    setSelectedVacancy(null);
    fetchTags();
    fetchCountries();
    fetchCities(selectedCountry);
    showToast(t('nav.vacancy_deleted'));
  };

  const handleImportComplete = () => {
    fetchVacancies();
    fetchTags();
    fetchCountries();
    fetchCities(selectedCountry);
    showToast(t('nav.batch_import_completed'));
  };

  const queueUnit = queueRemaining === 1 ? t('nav.queue_unit_one') : t('nav.queue_unit_many');

  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        <Loader2 size={40} className="spin" style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <LoginModal
        onLoginSuccess={(userData) => {
          setAnalyticsUser(userData);
          setUser(userData);
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Briefcase size={20} />
          </div>
          <div>
            <h1 className="brand-title">{t('nav.title')}</h1>
            <p className="brand-subtitle">{t('nav.subtitle')}</p>
          </div>
        </div>

        <div className="header-center">
          <div className="search-bar">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              placeholder={t('nav.search_placeholder')}
              value={search}
              onChange={onChangeSearch}
            />
            {search && (
              <button
                onClick={resetSearch}
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
          {/* Real-time Queue status indicator */}
          {queueRemaining > 0 && (
            <div className="status-indicators">
              <div className="queue-pill" title={t('nav.queue_label', { count: queueRemaining, unit: queueUnit })}>
                <Loader2 size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>{t('nav.queue_label', { count: queueRemaining, unit: queueUnit })}</span>
              </div>
            </div>
          )}

          <button
            className="btn btn-secondary btn-icon plausible-event-name=Refresh+Vacancies"
            onClick={async () => {
              trackEvent(EVENTS.REFRESH_CLICK);
              try {
                if (selectedIds.length > 0) {
                  await Promise.all(selectedIds.map(id => fetch(`/api/vacancies/${id}/reparse`, { method: 'POST' })));
                } else {
                  await fetch('/api/vacancies/reparse_all', { method: 'POST' });
                }
                fetchVacancies();
              } catch (e) {
                console.error(e);
              }
            }}
            title={selectedIds.length > 0 ? "Обновить выделенные" : t('nav.refresh_btn')}
          >
            <RefreshCw size={16} />
          </button>
          
          <button
            className="btn btn-secondary btn-icon plausible-event-name=Settings+Open"
            onClick={() => {
              trackEvent(EVENTS.SETTINGS_OPEN);
              setIsSettingsOpen(true);
            }}
            title={t('nav.settings_btn')}
          >
            <Settings size={16} />
          </button>

          <button
            className="btn btn-primary plausible-event-name=Batch+Import+Open"
            onClick={() => {
              trackEvent(EVENTS.BATCH_IMPORT_OPEN);
              setIsBatchOpen(true);
            }}
          >
            <Plus size={16} />
            <span>{t('nav.batch_import_btn')}</span>
          </button>

          {/* User Profile Badge & Logout */}
          <div className="user-profile-badge">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="user-avatar" />
            ) : (
              <div className="user-avatar-placeholder">
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <span className="user-profile-name" title={user.email}>{user.name || user.email}</span>
            <button className="btn-logout" onClick={handleLogout} title={t('auth.logout')}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Filter bar for Country, City, Workplace & Tags */}
      {selectedIds.length > 0 ? (
        <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Выделено карточек: {selectedIds.length}</span>
            <button className="btn btn-secondary btn-icon" style={{ height: '28px', width: '28px' }} onClick={() => setSelectedIds([])} title="Снять выделение">
              <X size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Тег..."
              className="search-input"
              style={{ width: '150px', height: '32px' }}
              value={bulkTagInput}
              onChange={e => setBulkTagInput(e.target.value)}
            />
            <button className="btn btn-secondary" style={{ height: '32px' }} onClick={async () => {
              if (!bulkTagInput.trim()) return;
              try {
                await Promise.all(selectedIds.map(async id => {
                  const v = vacancies.find(x => x.id === id);
                  if (!v) return;
                  const tags = new Set(v.tags || []);
                  tags.add(bulkTagInput.trim());
                  await fetch(`/api/vacancies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tags: Array.from(tags) }) });
                }));
                setBulkTagInput('');
                fetchVacancies();
                fetchTags();
                showToast("Теги добавлены");
              } catch (e) { console.error(e); }
            }}>Добавить тег</button>
            <button className="btn btn-danger" style={{ height: '32px' }} onClick={async () => {
              if (!bulkTagInput.trim()) return;
              try {
                await Promise.all(selectedIds.map(async id => {
                  const v = vacancies.find(x => x.id === id);
                  if (!v) return;
                  const tags = new Set(v.tags || []);
                  tags.delete(bulkTagInput.trim());
                  await fetch(`/api/vacancies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tags: Array.from(tags) }) });
                }));
                setBulkTagInput('');
                fetchVacancies();
                fetchTags();
                showToast("Теги удалены");
              } catch (e) { console.error(e); }
            }}>Удалить тег</button>
          </div>
        </div>
      ) : (allCountries.length > 0 || allCities.length > 0 || allTags.length > 0 || selectedCountry || selectedCity || selectedWorkplaceType || selectedTag) ? (
        <div className="filter-bar">
          {/* Location: Country Filter */}
          {(allCountries.length > 0 || selectedCountry) && (
            <div className="filter-group">
              <div className="filter-select-wrapper">
                <Globe size={13} className="filter-select-icon" />
                <select
                  className={`filter-select ${selectedCountry ? 'active' : ''}`}
                  value={selectedCountry}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  title={t('nav.filter_all_countries')}
                >
                  <option value="">{t('nav.filter_all_countries')} ({allCountries.length})</option>
                  {allCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown size={11} className="filter-select-chevron" />
              </div>
            </div>
          )}

          {/* Location: City Filter */}
          {(allCities.length > 0 || selectedCity) && (
            <div className="filter-group">
              <div className="filter-select-wrapper">
                <MapPin size={13} className="filter-select-icon" />
                <select
                  className={`filter-select ${selectedCity ? 'active' : ''}`}
                  value={selectedCity}
                  onChange={(e) => {
                    const city = e.target.value;
                    trackEvent(EVENTS.FILTER_CITY, { city: city || 'all' });
                    setSelectedCity(city);
                  }}
                  title={t('nav.filter_all_cities')}
                >
                  <option value="">{t('nav.filter_all_cities')} ({allCities.length})</option>
                  {allCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <ChevronDown size={11} className="filter-select-chevron" />
              </div>
            </div>
          )}

          {/* Workplace Type Filter */}
          <div className="filter-group">
            <div className="filter-select-wrapper">
              <Laptop size={13} className="filter-select-icon" />
              <select
                className={`filter-select ${selectedWorkplaceType ? 'active' : ''}`}
                value={selectedWorkplaceType}
                onChange={(e) => {
                  const wp = e.target.value;
                  trackEvent(EVENTS.FILTER_WORKPLACE, { workplace_type: wp || 'all' });
                  setSelectedWorkplaceType(wp);
                }}
                title={t('nav.filter_all_workplaces')}
              >
                <option value="">{t('nav.filter_all_workplaces')}</option>
                <option value="remote">{t('workplace.remote')}</option>
                <option value="hybrid">{t('workplace.hybrid')}</option>
                <option value="on-site">{t('workplace.on-site')}</option>
              </select>
              <ChevronDown size={11} className="filter-select-chevron" />
            </div>
          </div>

          {/* Divider if we have both dropdowns and tags */}
          {allTags.length > 0 && (
            <div className="filter-divider" />
          )}

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="filter-group" style={{ overflowX: 'auto' }}>
              <div className="filter-label">
                <Filter size={12} />
                <span>{t('nav.tags_label')}</span>
              </div>
              <button
                className={`tag-filter-chip ${selectedTag === '' ? 'active' : ''}`}
                onClick={() => {
                  trackEvent(EVENTS.FILTER_TAG, { tag: 'all' });
                  setSelectedTag('');
                }}
              >
                {t('nav.all_tags')} ({vacancies.length})
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`tag-filter-chip ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => {
                    const nextTag = selectedTag === tag ? '' : tag;
                    trackEvent(EVENTS.FILTER_TAG, { tag: nextTag || 'all' });
                    setSelectedTag(nextTag);
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Reset all filters */}
          {(selectedCountry || selectedCity || selectedWorkplaceType || selectedTag || search) && (
            <button
              className="filter-reset-btn tag-filter-chip "
              onClick={resetAllFilters}
              title={t('nav.reset_all_filters')}
            >
              <RotateCcw size={11} />
              <span>{t('nav.reset_filters')}</span>
            </button>
          )}
        </div>
      ) : null}

      {/* Kanban Board */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <KanbanBoard
          vacancies={vacancies}
          onCardClick={(vacancy) => setSelectedVacancy(vacancy)}
          onStatusChange={handleStatusChange}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onStatusChangeMulti={handleStatusChangeMulti}
        />
      </main>

      {/* Modals */}
      <BatchImportModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        queueRemaining={queueRemaining}
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
