import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Briefcase, Plus, Search, Filter, 
  RefreshCw, CheckCircle2, AlertCircle, X, Loader2,
  Globe, MapPin, RotateCcw, ChevronDown, Laptop, Trash2, ExternalLink, Ban, XCircle
} from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import BatchImportModal from '../components/BatchImportModal';
import VacancyModal from '../components/VacancyModal';
import HeaderControls from '../components/HeaderControls';
import QueueModal from '../components/QueueModal';
import ExtensionPromptModal from '../components/ExtensionPromptModal';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import { shouldShowExtensionPrompt } from '../utils/extension';

export default function HomePage({ user, onLogout }) {
  const { t } = useTranslation();

  const [vacancies, setVacancies] = useState([]);
  const [columns, setColumns] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [allCountries, setAllCountries] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [allSources, setAllSources] = useState([]);
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const onChangeSearch = (event) => {
    const val = event.target.value;
    setSearch(val);
  };
  const resetSearch = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    trackEvent(EVENTS.SEARCH_APPLIED, { query_length: 0 });
    setSearch('');
    if (isSearchFocused) {
      searchInputRef.current?.focus();
    }
  };
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedWorkplaceType, setSelectedWorkplaceType] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedClosed, setSelectedClosed] = useState('');

  // Queue & Mercure state
  const [queueRemaining, setQueueRemaining] = useState(0);
  const [mercureStatus, setMercureStatus] = useState('connecting'); // 'connected' | 'connecting'

  // Modals state
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState(null);

  // Multiselect state
  const [selectedIds, setSelectedIds] = useState([]);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [extensionOnProceed, setExtensionOnProceed] = useState(null);
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [isMovingAllRejected, setIsMovingAllRejected] = useState(false);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleLogout = onLogout;

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
      if (selectedSource) params.append('source', selectedSource);
      if (selectedClosed !== '') params.append('is_closed', selectedClosed);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVacancies(data);
      }
    } catch (err) {
      console.error('Failed to fetch vacancies', err);
    }
  }, [user, search, selectedTag, selectedCountry, selectedCity, selectedWorkplaceType, selectedSource, selectedClosed]);

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

  const fetchSources = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data = await res.json();
        setAllSources(data);
      }
    } catch (err) {
      console.error('Failed to fetch sources', err);
    }
  }, [user]);

  const fetchColumns = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/columns');
      if (res.ok) {
        const data = await res.json();
        setColumns(data);
      }
    } catch (err) {
      console.error('Failed to fetch columns', err);
    }
  }, [user]);

  const resetAllFilters = () => {
    trackEvent(EVENTS.FILTERS_RESET);
    setSelectedTag('');
    setSelectedCountry('');
    setSelectedCity('');
    setSelectedWorkplaceType('');
    setSelectedSource('');
    setSelectedClosed('');
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
    fetchColumns();
    fetchTags();
    fetchCountries();
    fetchCities(selectedCountry);
    fetchSources();
    fetchQueueStatus();
  }, [user, fetchVacancies, fetchColumns, fetchTags, fetchCountries, fetchCities, fetchSources, fetchQueueStatus, selectedCountry]);

  const callbacksRef = useRef({});
  callbacksRef.current = {
    fetchTags,
    fetchVacancies,
    fetchColumns,
    fetchCountries,
    fetchCities,
    fetchSources,
    selectedCountry,
    selectedClosed,
    showToast,
    t
  };

  // Connect to Real-time Updates (WebSocket with Mercure SSE fallback)
  useEffect(() => {
    if (!user) return;
    let ws = null;
    let eventSource = null;
    let isSubscribed = true;
    let pingInterval = null;

    const handleRealtimeData = (data) => {
      if (!isSubscribed || !data) return;
      const { type, error_code, vacancy, vacancy_id, title, total_remaining, url } = data;
      const {
        fetchTags: currentFetchTags,
        fetchVacancies: currentFetchVacancies,
        fetchCountries: currentFetchCountries,
        fetchCities: currentFetchCities,
        fetchSources: currentFetchSources,
        selectedCountry: currentSelectedCountry,
        selectedClosed: currentSelectedClosed,
        showToast: currentShowToast,
        t: currentT
      } = callbacksRef.current;

      if (total_remaining !== undefined) {
        setQueueRemaining(total_remaining);
      }

      if (type === 'vacancy_created' && vacancy) {
        setVacancies(prev => {
          if (currentSelectedClosed === 'false' && vacancy.is_closed) return prev;
          if (currentSelectedClosed === 'true' && !vacancy.is_closed) return prev;
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
        currentFetchSources();
      } else if (type === 'vacancy_updated' && vacancy) {
        setVacancies(prev => {
          if (currentSelectedClosed === 'false' && vacancy.is_closed) return prev.filter(v => v.id !== vacancy.id);
          if (currentSelectedClosed === 'true' && !vacancy.is_closed) return prev.filter(v => v.id !== vacancy.id);
          const exists = prev.some(v => v.id === vacancy.id);
          if (exists) {
            return prev.map(v => v.id === vacancy.id ? vacancy : v);
          }
          return [vacancy, ...prev];
        });
        setSelectedVacancy(prev => (prev && prev.id === vacancy.id ? vacancy : prev));
        currentShowToast(currentT('mercure.vacancy_updated', { title: vacancy.title }));
        currentFetchTags();
        currentFetchCountries();
        currentFetchCities(currentSelectedCountry);
        currentFetchSources();
      } else if (type === 'vacancy_deleted') {
        const delId = vacancy_id || (vacancy && vacancy.id);
        if (delId) {
          setVacancies(prev => prev.filter(v => v.id !== delId));
          setSelectedVacancy(prev => (prev && prev.id === delId ? null : prev));
          setSelectedIds(prev => prev.filter(id => id !== delId));
          const delTitle = title || (vacancy && vacancy.title);
          if (delTitle) {
            currentShowToast(currentT('mercure.vacancy_deleted', { title: delTitle }));
          }
          currentFetchTags();
          currentFetchCountries();
          currentFetchCities(currentSelectedCountry);
          currentFetchSources();
        }
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
        currentFetchSources();
      }
    };

    const initMercureFallback = async () => {
      if (!isSubscribed) return;
      try {
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
          console.warn('Could not fetch /api/config for Mercure', e);
        }

        if (!isSubscribed) return;

        const sseUrl = new URL(hubUrl);
        sseUrl.searchParams.append('topic', topic);

        eventSource = new EventSource(sseUrl.toString());

        eventSource.onopen = () => {
          if (isSubscribed) setMercureStatus('connected');
        };

        eventSource.onerror = () => {
          if (isSubscribed) setMercureStatus('connecting');
        };

        eventSource.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);
            handleRealtimeData(data);
          } catch (err) {
            console.error('Failed to parse Mercure message', err);
          }
        };
      } catch (err) {
        console.warn('Mercure fallback failed to connect', err);
      }
    };

    const initWebSocket = () => {
      setMercureStatus('connecting');
      try {
        const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProto}//${window.location.host}/api/ws`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isSubscribed) return;
          setMercureStatus('connected');
          pingInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);
            handleRealtimeData(data);
          } catch (err) {
            console.error('Failed to parse WebSocket message', err);
          }
        };

        ws.onerror = (err) => {
          console.debug('WebSocket error, falling back to Mercure SSE', err);
        };

        ws.onclose = () => {
          if (pingInterval) clearInterval(pingInterval);
          if (isSubscribed) {
            setMercureStatus('connecting');
            // Attempt fallback to Mercure SSE
            if (!eventSource) {
              initMercureFallback();
            }
          }
        };
      } catch (e) {
        console.warn('WebSocket init error, fallback to Mercure', e);
        initMercureFallback();
      }
    };

    initWebSocket();

    return () => {
      isSubscribed = false;
      if (pingInterval) clearInterval(pingInterval);
      if (ws) {
        try { ws.close(); } catch (_) {}
      }
      if (eventSource) {
        try { eventSource.close(); } catch (_) {}
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

  // Handle manual reorder of cards inside a column (also covers moving into a column at a position)
  const handleReorder = async (status, ids, lane = 0) => {
    const positions = new Map(ids.map((id, i) => [id, i]));
    setVacancies(prev => prev.map(v => positions.has(v.id) ? { ...v, status, lane, sort_order: positions.get(v.id) } : v));

    try {
      const res = await fetch('/api/vacancies/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ids, lane })
      });
      if (!res.ok) throw new Error('Reorder failed');
      const updated = await res.json();
      const byId = new Map(updated.map(v => [v.id, v]));
      setVacancies(prev => prev.map(v => byId.get(v.id) || v));
      if (selectedVacancy && byId.has(selectedVacancy.id)) {
        setSelectedVacancy(byId.get(selectedVacancy.id));
      }
    } catch (err) {
      console.error('Failed to reorder vacancies', err);
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
    } catch (err) {
      console.error('Failed to update status', err);
      fetchVacancies();
      showToast(t('nav.update_status_failed'), 'error');
    }
  };

  const handleMoveAllClosedToRejected = async () => {
    const targets = vacancies.filter(v => v.status !== 'Отказ');
    if (targets.length === 0) return;
    const confirmMsg = t('nav.move_all_to_rejected_confirm', { count: targets.length });
    if (!window.confirm(confirmMsg)) return;

    setIsMovingAllRejected(true);
    trackEvent(EVENTS.MOVE_ALL_CLOSED_REJECTED, { count: targets.length });
    try {
      const ids = targets.map(v => v.id);
      setVacancies(prev => prev.map(v => ids.includes(v.id) ? { ...v, status: 'Отказ' } : v));
      await Promise.all(ids.map(vid => 
        fetch(`/api/vacancies/${vid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Отказ' })
        })
      ));
      fetchVacancies();
      showToast(t('nav.move_all_to_rejected_success', { count: targets.length }));
    } catch (err) {
      console.error('Failed to move all to rejected', err);
      fetchVacancies();
      showToast(t('nav.update_status_failed'), 'error');
    } finally {
      setIsMovingAllRejected(false);
    }
  };

  const handleVacancyUpdate = (updatedVacancy) => {
    setVacancies(prev => {
      if (selectedClosed === 'false' && updatedVacancy.is_closed) {
        return prev.filter(v => v.id !== updatedVacancy.id);
      }
      if (selectedClosed === 'true' && !updatedVacancy.is_closed) {
        return prev.filter(v => v.id !== updatedVacancy.id);
      }
      return prev.map(v => v.id === updatedVacancy.id ? updatedVacancy : v);
    });
    setSelectedVacancy(updatedVacancy);
    fetchTags();
    fetchCountries();
    fetchCities(selectedCountry);
    fetchSources();
  };

  const handleVacancyDelete = (deletedId) => {
    setVacancies(prev => prev.filter(v => v.id !== deletedId));
    setSelectedVacancy(null);
    fetchTags();
    fetchCountries();
    fetchCities(selectedCountry);
    fetchSources();
    showToast(t('nav.vacancy_deleted'));
  };

  const handleImportComplete = () => {
    fetchVacancies();
    fetchTags();
    fetchCountries();
    fetchCities(selectedCountry);
    fetchSources();
    showToast(t('nav.batch_import_completed'));
  };

  const queueUnit = queueRemaining === 1 ? t('nav.queue_unit_one') : t('nav.queue_unit_many');

  return (
    <div className="app-container">
      {/* Header */}
      <header className={`app-header ${isSearchFocused ? 'search-focused' : ''}`}>
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
              ref={searchInputRef}
              type="text"
              className={`search-input ${search ? 'has-value' : ''}`}
              placeholder={t('nav.search_placeholder')}
              value={search}
              onChange={onChangeSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.target.blur();
                }
              }}
            />
            {search && (
              <button
                type="button"
                onClick={resetSearch}
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                className="search-clear-btn"
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <HeaderControls
          user={user}
          onLogout={handleLogout}
          vacancies={vacancies}
          onColumnsUpdated={(newCols) => {
            setColumns(newCols);
            fetchVacancies();
          }}
        >
          {/* Real-time Queue status indicator */}
          {queueRemaining > 0 && (
            <div className="status-indicators">
              <div className="queue-pill" title={t('nav.queue_label', { count: queueRemaining, unit: queueUnit })} onClick={() => setIsQueueOpen(true)}>
                <Loader2 size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>{t('nav.queue_label', { count: queueRemaining, unit: queueUnit })}</span>
              </div>
            </div>
          )}

          <button
            className="btn btn-primary add-button plausible-event-name=Batch+Import+Open"
            onClick={() => {
              trackEvent(EVENTS.BATCH_IMPORT_OPEN);
              setIsBatchOpen(true);
            }}
          >
            <Plus size={16} />
            <span>{t('nav.batch_import_btn')}</span>
          </button>

          <button
            className="btn btn-secondary btn-icon plausible-event-name=Refresh+Vacancies"
            onClick={() => {
              trackEvent(EVENTS.REFRESH_CLICK);
              const doRefresh = async () => {
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
              };

              shouldShowExtensionPrompt().then((needsPrompt) => {
                if (needsPrompt) {
                  setExtensionOnProceed(() => doRefresh);
                  setIsExtensionModalOpen(true);
                } else {
                  doRefresh();
                }
              });
            }}
            title={selectedIds.length > 0 ? "Обновить выделенные" : t('nav.refresh_btn')}
          >
            <RefreshCw size={16} />
          </button>
        </HeaderControls>
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
            <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 4px' }} />
            <button className="btn btn-danger btn-icon" style={{ height: '32px' }} onClick={async () => {
              if (!window.confirm(`Вы уверены, что хотите удалить ${selectedIds.length} карточек?`)) return;
              try {
                await Promise.all(selectedIds.map(id => fetch(`/api/vacancies/${id}`, { method: 'DELETE' })));
                setSelectedIds([]);
                fetchVacancies();
                fetchTags();
                fetchSources();
                showToast("Карточки удалены");
              } catch (e) { console.error(e); }
            }} title="Удалить выделенные">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ) : (allCountries.length > 0 || allCities.length > 0 || allSources.length > 0 || allTags.length > 0 || selectedCountry || selectedCity || selectedWorkplaceType || selectedSource || selectedClosed !== '' || selectedTag) ? (
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

          {/* Source Filter */}
          {(allSources.length > 0 || selectedSource) && (
            <div className="filter-group">
              <div className="filter-select-wrapper">
                <ExternalLink size={13} className="filter-select-icon" />
                <select
                  className={`filter-select ${selectedSource ? 'active' : ''}`}
                  value={selectedSource}
                  onChange={(e) => {
                    const src = e.target.value;
                    trackEvent(EVENTS.FILTER_SOURCE, { source: src || 'all' });
                    setSelectedSource(src);
                  }}
                  title={t('nav.filter_all_sources')}
                >
                  <option value="">{t('nav.filter_all_sources')} ({allSources.length})</option>
                  {allSources.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
                <ChevronDown size={11} className="filter-select-chevron" />
              </div>
            </div>
          )}

          {/* Closed Status Filter */}
          <div className="filter-group">
            <div className="filter-select-wrapper">
              <Ban size={13} className="filter-select-icon" />
              <select
                className={`filter-select ${selectedClosed !== '' ? 'active' : ''}`}
                value={selectedClosed}
                onChange={(e) => {
                  const val = e.target.value;
                  trackEvent(EVENTS.FILTER_CLOSED, { is_closed: val || 'all' });
                  setSelectedClosed(val);
                }}
                title={t('nav.filter_all_closed')}
              >
                <option value="">{t('nav.filter_all_closed')}</option>
                <option value="false">{t('nav.filter_open')}</option>
                <option value="true">{t('nav.filter_closed')}</option>
              </select>
              <ChevronDown size={11} className="filter-select-chevron" />
            </div>
          </div>

          {/* Move all closed to Rejected button */}
          {selectedClosed === 'true' && (() => {
            const nonRejectedClosedCount = vacancies.filter(v => v.status !== 'Отказ').length;
            return (
              <button
                className="filter-reject-all-btn tag-filter-chip"
                onClick={handleMoveAllClosedToRejected}
                disabled={nonRejectedClosedCount === 0 || isMovingAllRejected}
                title={nonRejectedClosedCount === 0 ? t('nav.all_already_rejected') : t('nav.move_all_to_rejected_confirm', { count: nonRejectedClosedCount })}
              >
                {isMovingAllRejected ? (
                  <Loader2 size={12} className="spin" />
                ) : (
                  <XCircle size={12} />
                )}
                <span>
                  {t('nav.move_all_to_rejected')}{nonRejectedClosedCount > 0 ? ` (${nonRejectedClosedCount})` : ''}
                </span>
              </button>
            );
          })()}

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
          {(selectedCountry || selectedCity || selectedWorkplaceType || selectedSource || selectedClosed !== '' || selectedTag || search) && (
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
          columns={columns}
          onColumnsChange={(newCols) => {
            setColumns(newCols);
            fetchVacancies();
          }}
          onCardClick={(vacancy) => setSelectedVacancy(vacancy)}
          onStatusChange={handleStatusChange}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onStatusChangeMulti={handleStatusChangeMulti}
          onReorder={handleReorder}
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
        columns={columns}
        onClose={() => setSelectedVacancy(null)}
        onUpdate={handleVacancyUpdate}
        onDelete={handleVacancyDelete}
      />

      <QueueModal
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queueRemaining={queueRemaining}
        onRefreshQueue={fetchQueueStatus}
      />

      <ExtensionPromptModal
        isOpen={isExtensionModalOpen}
        onClose={() => {
          setIsExtensionModalOpen(false);
          setExtensionOnProceed(null);
        }}
        onProceed={() => {
          if (extensionOnProceed) extensionOnProceed();
          setIsExtensionModalOpen(false);
          setExtensionOnProceed(null);
        }}
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
