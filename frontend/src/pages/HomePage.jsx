import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { 
  Plus, Search, Filter, 
  RefreshCw, CheckCircle2, AlertCircle, X, Loader2,
  Globe, MapPin, RotateCcw, ChevronDown, Laptop, Trash2, ExternalLink, Ban, XCircle
} from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import BatchImportModal from '../components/BatchImportModal';
import VacancyModal from '../components/VacancyModal';
import HeaderControls from '../components/HeaderControls';
import QueueModal from '../components/QueueModal';
import LoginModal from '../components/LoginModal';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';

function matchesFilters(vacancy, filters) {
  if (!vacancy) return false;
  const {
    search,
    selectedTag,
    selectedCountry,
    selectedCity,
    selectedWorkplaceType,
    selectedSource,
    selectedClosed,
  } = filters || {};

  if (selectedClosed === 'false' && vacancy.is_closed) return false;
  if (selectedClosed === 'true' && !vacancy.is_closed) return false;

  if (selectedTag) {
    const tags = Array.isArray(vacancy.tags) ? vacancy.tags : [];
    if (!tags.includes(selectedTag)) return false;
  }

  if (selectedCountry && (vacancy.country || '').trim().toLowerCase() !== selectedCountry.trim().toLowerCase()) {
    return false;
  }

  if (selectedCity && (vacancy.city || '').trim().toLowerCase() !== selectedCity.trim().toLowerCase()) {
    return false;
  }

  if (selectedWorkplaceType && (vacancy.workplace_type || '').trim().toLowerCase() !== selectedWorkplaceType.trim().toLowerCase()) {
    return false;
  }

  if (selectedSource && (vacancy.source || '').trim().toLowerCase() !== selectedSource.trim().toLowerCase()) {
    return false;
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    const title = (vacancy.title || '').toLowerCase();
    const company = (vacancy.company || '').toLowerCase();
    const loc = (vacancy.location || '').toLowerCase();
    const city = (vacancy.city || '').toLowerCase();
    const country = (vacancy.country || '').toLowerCase();
    const desc = (vacancy.description || '').toLowerCase();
    const summary = (vacancy.ai_summary || '').toLowerCase();
    const source = (vacancy.source || '').toLowerCase();
    if (
      !title.includes(q) &&
      !company.includes(q) &&
      !loc.includes(q) &&
      !city.includes(q) &&
      !country.includes(q) &&
      !desc.includes(q) &&
      !summary.includes(q) &&
      !source.includes(q)
    ) {
      return false;
    }
  }

  return true;
}

export default function HomePage({ user, onLogout, onUserUpdated }) {
  const { t } = useTranslation();

  const [vacancies, setVacancies] = useState([]);
  const [columns, setColumns] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const selectedTag = searchParams.get('tag') || '';
  const selectedCountry = searchParams.get('country') || '';
  const selectedCity = searchParams.get('city') || '';
  const selectedWorkplaceType = searchParams.get('workplace_type') || '';
  const selectedSource = searchParams.get('source') || '';
  const selectedClosed = searchParams.get('is_closed') || '';

  const updateFilterParams = useCallback((updates, replaceOption) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (val !== undefined && val !== null && String(val) !== '') {
          next.set(key, String(val));
        } else {
          next.delete(key);
        }
      });
      return next;
    }, { replace: Boolean(replaceOption) });
  }, [setSearchParams]);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const onChangeSearch = (event) => {
    const val = event.target.value;
    updateFilterParams({ search: val }, true);
  };
  const resetSearch = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    trackEvent(EVENTS.SEARCH_APPLIED, { query_length: 0 });
    updateFilterParams({ search: '' }, true);
    if (isSearchFocused) {
      searchInputRef.current?.focus();
    }
  };

  const allTags = useMemo(() => {
    const tagSet = new Set();
    for (const v of vacancies) {
      if (Array.isArray(v.tags)) {
        for (const tItem of v.tags) {
          if (tItem && typeof tItem === 'string') {
            tagSet.add(tItem);
          }
        }
      }
    }
    return Array.from(tagSet).sort();
  }, [vacancies]);

  const allCountries = useMemo(() => {
    const countrySet = new Set();
    for (const v of vacancies) {
      if (v.country && typeof v.country === 'string' && v.country.trim()) {
        countrySet.add(v.country.trim());
      }
    }
    return Array.from(countrySet).sort();
  }, [vacancies]);

  const allCities = useMemo(() => {
    const citySet = new Set();
    const countryLower = selectedCountry ? selectedCountry.trim().toLowerCase() : '';
    for (const v of vacancies) {
      if (countryLower && (v.country || '').trim().toLowerCase() !== countryLower) {
        continue;
      }
      if (v.city && typeof v.city === 'string' && v.city.trim()) {
        citySet.add(v.city.trim());
      }
    }
    return Array.from(citySet).sort();
  }, [vacancies, selectedCountry]);

  const allSources = useMemo(() => {
    const sourceSet = new Set();
    for (const v of vacancies) {
      if (v.source && typeof v.source === 'string' && v.source.trim()) {
        sourceSet.add(v.source.trim());
      }
    }
    return Array.from(sourceSet).sort();
  }, [vacancies]);

  const hiddenVacancyIds = useMemo(() => {
    if (
      !search.trim() &&
      !selectedTag &&
      !selectedCountry &&
      !selectedCity &&
      !selectedWorkplaceType &&
      !selectedSource &&
      selectedClosed === ''
    ) {
      return new Set();
    }
    const activeFilters = {
      search,
      selectedTag,
      selectedCountry,
      selectedCity,
      selectedWorkplaceType,
      selectedSource,
      selectedClosed,
    };
    const hidden = new Set();
    for (const v of vacancies) {
      if (!matchesFilters(v, activeFilters)) {
        hidden.add(v.id);
      }
    }
    return hidden;
  }, [vacancies, search, selectedTag, selectedCountry, selectedCity, selectedWorkplaceType, selectedSource, selectedClosed]);

  // Queue & Mercure state
  const [queueRemaining, setQueueRemaining] = useState(0);
  const [queueState, setQueueState] = useState({ links: [], total: 0, pending_count: 0, processing_count: 0, failed_count: 0 });
  const [mercureStatus, setMercureStatus] = useState('connecting'); // 'connected' | 'connecting'

  // Modals state
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState(null);

  // Attention highlight for "Add Vacancies" button when arriving from landing tour
  const location = useLocation();
  const [shouldHighlightAdd, setShouldHighlightAdd] = useState(() => {
    try {
      if (location.state?.highlightAddVacancy) return true;
      return sessionStorage.getItem('highlight_add_vacancy') === 'true';
    } catch {
      return false;
    }
  });

  const handleAddVacanciesClick = useCallback(() => {
    if (shouldHighlightAdd) {
      setShouldHighlightAdd(false);
      try {
        sessionStorage.removeItem('highlight_add_vacancy');
      } catch {}
      if (window.history?.replaceState) {
        window.history.replaceState({}, document.title);
      }
    }
    trackEvent(EVENTS.BATCH_IMPORT_OPEN);
    setIsBatchOpen(true);
  }, [shouldHighlightAdd]);

  // Multiselect state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [isMovingAllRejected, setIsMovingAllRejected] = useState(false);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  // Toast notifications
  const [toast, setToast] = useState(null);

  // Guest save prompt modal & banner dismissed state
  const [isGuestAuthModalOpen, setIsGuestAuthModalOpen] = useState(false);
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(() => {
    return sessionStorage.getItem('guest_banner_dismissed') === 'true';
  });

  // Track initial vacancy count to detect when guest uploads cards
  const prevVacancyCountRef = useRef(null);

  useEffect(() => {
    if (user?.is_anonymous && vacancies.length >= 2) {
      const alreadyPrompted = sessionStorage.getItem('guest_auth_prompt_shown');
      if (!alreadyPrompted) {
        // If cards were just added in this session or user already has >= 2 cards
        if (prevVacancyCountRef.current !== null && vacancies.length > prevVacancyCountRef.current) {
          setIsGuestAuthModalOpen(true);
          sessionStorage.setItem('guest_auth_prompt_shown', 'true');
        }
      }
    }
    prevVacancyCountRef.current = vacancies.length;
  }, [vacancies.length, user?.is_anonymous]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleLogout = onLogout;

  const vacancyRequest = useRef(0);
  const fetchVacancies = useCallback(async () => {
    const requestId = ++vacancyRequest.current;
    if (!user) return;
    try {
      const res = await fetch('/api/v2/vacancies');
      if (res.ok) {
        const data = await res.json();
        if (requestId === vacancyRequest.current) setVacancies(data);
      }
    } catch (err) {
      console.error('Failed to fetch vacancies', err);
    }
  }, [user]);

  const handleCountryChange = (country) => {
    trackEvent(EVENTS.FILTER_COUNTRY, { country: country || 'all' });
    updateFilterParams({ country, city: '' }, false);
  };

  const fetchColumns = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/v2/columns');
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
    updateFilterParams({
      search: '',
      tag: '',
      country: '',
      city: '',
      workplace_type: '',
      source: '',
      is_closed: '',
    }, false);
  };

  useEffect(() => {
    if (!user) return;
    fetchColumns();
    fetchVacancies();
    return () => { vacancyRequest.current += 1; };
  }, [user, fetchColumns, fetchVacancies]);

  const callbacksRef = useRef({});
  callbacksRef.current = {
    fetchColumns,
    showToast,
    t
  };

  // Connect to Mercure SSE Hub for real-time updates
  useEffect(() => {
    if (!user) return;
    let eventSource = null;
    let isSubscribed = true;
    let refreshTimer;

    const initMercure = async () => {
      try {
        setMercureStatus('connecting');
        const configRes = await fetch('/api/v2/config', { credentials: 'include' });
        if (!configRes.ok) throw new Error(`Mercure config HTTP ${configRes.status}`);
        const cfg = await configRes.json();
        if (!isSubscribed) return;
        const sseUrl = new URL(cfg.mercure_hub_url, window.location.origin);
        sseUrl.searchParams.append('topic', cfg.mercure_topic);
        if (eventSource) eventSource.close();
        eventSource = new EventSource(sseUrl.toString(), { withCredentials: true });
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(initMercure, 50 * 60 * 1000);

        eventSource.onopen = () => {
          if (isSubscribed) {
            setMercureStatus('connected');
            // Queue state is delivered only via Mercure: ask the backend to republish the snapshot
            fetch('/api/v2/queue/sync', { method: 'POST', credentials: 'include' }).catch((err) => {
              console.error('Failed to request queue snapshot', err);
            });
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
            const { type, error_code, vacancy, vacancy_id, title, total_remaining, url } = data;
            const {
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
            } else if (type === 'vacancy_updated' && vacancy) {
              setVacancies(prev => {
                const exists = prev.some(v => v.id === vacancy.id);
                if (exists) {
                  return prev.map(v => v.id === vacancy.id ? vacancy : v);
                }
                return [vacancy, ...prev];
              });
              setSelectedVacancy(prev => (prev && prev.id === vacancy.id ? vacancy : prev));
              currentShowToast(currentT('mercure.vacancy_updated', { title: vacancy.title }));
            } else if (type === 'compatibility_analyzed') {
              const matchedId = vacancy_id || data.vacancy_id;
              const newScore = data.match_score !== undefined ? data.match_score : data.overall_score;
              if (matchedId && newScore !== undefined) {
                setVacancies(prev => prev.map(v => (v.id === matchedId ? { ...v, match_score: newScore } : v)));
                setSelectedVacancy(prev => (prev && prev.id === matchedId ? { ...prev, match_score: newScore } : prev));
              }
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
              }
            } else if (type === 'task_failed') {
              const errText = error_code ? currentT(`mercure.errors.${error_code}`) : (data.error || currentT('mercure.errors.ERR_UNKNOWN'));
              currentShowToast(currentT('mercure.task_failed', { error: errText, url: url || '' }), 'error');
            } else if (type === 'queue_updated') {
              if (total_remaining !== undefined) {
                setQueueRemaining(total_remaining);
              }
            } else if (type === 'queue_state') {
              setQueueState({
                links: data.links,
                total: data.total,
                pending_count: data.pending_count,
                processing_count: data.processing_count,
                failed_count: data.failed_count,
              });
              setQueueRemaining(data.pending_count + data.processing_count);
            } else if (type === 'queue_idle') {
              setQueueRemaining(0);
              currentShowToast(currentT('mercure.queue_idle'));
            }
          } catch (err) {
            console.error('Failed to parse Mercure message', err);
          }
        };
      } catch (err) {
        console.error('Failed to initialize Mercure EventSource', err);
        if (isSubscribed) {
          setMercureStatus('connecting');
          refreshTimer = setTimeout(initMercure, 5000);
        }
      }
    };

    initMercure();

    return () => {
      isSubscribed = false;
      clearTimeout(refreshTimer);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user]);

  // Handle status change from drag & drop or quick move
  const handleStatusChange = async (vacancyId, newStatus, lane = 0) => {
    const targetCol = columns.find(c => c.id === newStatus);
    const targetLane = targetCol?.has_lanes ? lane : 0;
    // Optimistic UI update for smooth drag & drop
    setVacancies(prev => prev.map(v => v.id === vacancyId ? { ...v, status: newStatus, lane: targetLane } : v));
    if (selectedVacancy && selectedVacancy.id === vacancyId) {
      setSelectedVacancy(prev => ({ ...prev, status: newStatus, lane: targetLane }));
    }

    try {
      const res = await fetch(`/api/v2/vacancies/${vacancyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, lane: targetLane })
      });
      if (!res.ok) {
        throw new Error('Update failed');
      }
      const localizedStatus = t(`kanban.columns.${newStatus}`);
      showToast(t('nav.moved_to', { status: localizedStatus }));
    } catch (err) {
      console.error('Failed to update status', err);
      showToast(t('nav.update_status_failed'), 'error');
    }
  };

  // Handle manual reorder of cards inside a column (also covers moving into a column at a position)
  const handleReorder = async (status, ids, lane = 0, movedId = null) => {
    const positions = new Map(ids.map((id, i) => [id, i]));
    const targetCol = columns.find(c => c.id === status);
    const hasLanes = targetCol ? Boolean(targetCol.has_lanes) : false;

    setVacancies(prev => prev.map(v => {
      if (!positions.has(v.id)) return v;
      let newLane = v.lane || 0;
      if (!hasLanes) {
        newLane = 0;
      } else if (v.id === movedId || movedId == null) {
        newLane = lane;
      }
      return {
        ...v,
        status,
        lane: newLane,
        sort_order: positions.get(v.id)
      };
    }));

    try {
      const res = await fetch('/api/v2/vacancies/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ids,
          lane,
          moved_id: movedId
        })
      });
      if (!res.ok) throw new Error('Reorder failed');
    } catch (err) {
      console.error('Failed to reorder vacancies', err);
      showToast(t('nav.update_status_failed'), 'error');
    }
  };

  const handleStatusChangeMulti = async (vacancyIds, newStatus, lane = 0) => {
    const targetCol = columns.find(c => c.id === newStatus);
    const targetLane = targetCol?.has_lanes ? lane : 0;
    setVacancies(prev => prev.map(v => vacancyIds.includes(v.id) ? { ...v, status: newStatus, lane: targetLane } : v));
    try {
      await Promise.all(vacancyIds.map(vid => 
        fetch(`/api/v2/vacancies/${vid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, lane: targetLane })
        })
      ));
      const localizedStatus = t(`kanban.columns.${newStatus}`);
      showToast(t('nav.moved_to', { status: localizedStatus }));
    } catch (err) {
      console.error('Failed to update status', err);
      showToast(t('nav.update_status_failed'), 'error');
    }
  };

  const handleMoveAllClosedToRejected = async () => {
    const targets = vacancies.filter(v => v.is_closed && v.status !== 'Отказ');
    if (targets.length === 0) return;
    const confirmMsg = t('nav.move_all_to_rejected_confirm', { count: targets.length });
    if (!window.confirm(confirmMsg)) return;

    setIsMovingAllRejected(true);
    trackEvent(EVENTS.MOVE_ALL_CLOSED_REJECTED, { count: targets.length });
    try {
      const ids = targets.map(v => v.id);
      await Promise.all(ids.map(vid => 
        fetch(`/api/v2/vacancies/${vid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Отказ' })
        })
      ));
      showToast(t('nav.move_all_to_rejected_success', { count: targets.length }));
    } catch (err) {
      console.error('Failed to move all to rejected', err);
      showToast(t('nav.update_status_failed'), 'error');
    } finally {
      setIsMovingAllRejected(false);
    }
  };

  const handleImportComplete = () => {
    showToast(t('nav.batch_import_completed'));
  };

  const queueUnit = queueRemaining === 1 ? t('nav.queue_unit_one') : t('nav.queue_unit_many');

  return (
    <div className="app-container">
      {/* Header */}
      <header className={`app-header ${isSearchFocused ? 'search-focused' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <span className="blueprint-mark" aria-hidden="true" />
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
          }}
          onUserUpdated={onUserUpdated}
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
            className={`btn btn-primary add-button plausible-event-name=Batch+Import+Open ${
              shouldHighlightAdd ? 'is-tour-attention' : ''
            }`}
            aria-label={t('nav.batch_import_btn')}
            onClick={handleAddVacanciesClick}
          >
            <Plus size={16} />
            <span>{t('nav.batch_import_btn')}</span>
          </button>

          <button
            className="btn btn-secondary btn-icon plausible-event-name=Refresh+Vacancies"
            onClick={async () => {
              trackEvent(EVENTS.REFRESH_CLICK);
              try {
                if (selectedIds.length > 0) {
                  await Promise.all(selectedIds.map(id => fetch(`/api/v2/vacancies/${id}/reparse`, { method: 'POST' })));
                } else {
                  await fetch('/api/v2/vacancies/reparse_all', { method: 'POST' });
                }
              } catch (e) {
                console.error(e);
              }
            }}
            title={selectedIds.length > 0 ? "Обновить выделенные" : t('nav.refresh_btn')}
          >
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </HeaderControls>
      </header>

      {/* Guest Mode Banner: informs the user they can save their progress across devices */}
      {user?.is_anonymous && vacancies.length >= 2 && !guestBannerDismissed && (
        <div className="guest-banner">
          <div className="guest-banner-content">
            <span className="guest-banner-icon">💡</span>
            <span className="guest-banner-text">
              {t('auth.guest_banner_text') || 'Вы пользуетесь гостевым доступом. Авторизуйтесь, чтобы не потерять добавленные вакансии и продолжить работу на другом компьютере или телефоне.'}
            </span>
          </div>
          <div className="guest-banner-actions">
            <button
              className="btn btn-primary btn-sm guest-banner-btn"
              onClick={() => setIsGuestAuthModalOpen(true)}
            >
              {t('auth.guest_banner_btn') || 'Сохранить прогресс'}
            </button>
            <button
              className="btn btn-secondary btn-icon btn-sm guest-banner-close"
              onClick={() => {
                setGuestBannerDismissed(true);
                sessionStorage.setItem('guest_banner_dismissed', 'true');
              }}
              title={t('common.close') || 'Закрыть'}
              aria-label="Dismiss banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Filter bar for Country, City, Workplace & Tags */}
      {selectedIds.length > 0 ? (
        <div className="filter-bar filter-bar-bulk" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="bulk-selection-count">Выделено карточек: {selectedIds.length}</span>
            <button className="btn btn-secondary btn-icon" onClick={() => setSelectedIds([])} title="Снять выделение">
              <X size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Тег..."
              className="search-input"
              
              value={bulkTagInput}
              onChange={e => setBulkTagInput(e.target.value)}
            />
            <button className="btn btn-secondary" onClick={async () => {
              if (!bulkTagInput.trim()) return;
              try {
                await Promise.all(selectedIds.map(async id => {
                  const v = vacancies.find(x => x.id === id);
                  if (!v) return;
                  const tags = new Set(v.tags || []);
                  tags.add(bulkTagInput.trim());
                  await fetch(`/api/v2/vacancies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tags: Array.from(tags) }) });
                }));
                setBulkTagInput('');
                showToast("Теги добавлены");
              } catch (e) { console.error(e); }
            }}>Добавить тег</button>
            <button className="btn btn-danger" onClick={async () => {
              if (!bulkTagInput.trim()) return;
              try {
                await Promise.all(selectedIds.map(async id => {
                  const v = vacancies.find(x => x.id === id);
                  if (!v) return;
                  const tags = new Set(v.tags || []);
                  tags.delete(bulkTagInput.trim());
                  await fetch(`/api/v2/vacancies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tags: Array.from(tags) }) });
                }));
                setBulkTagInput('');
                showToast("Теги удалены");
              } catch (e) { console.error(e); }
            }}>Удалить тег</button>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 4px' }} />
            <button className="btn btn-danger btn-icon" onClick={async () => {
              if (!window.confirm(`Вы уверены, что хотите удалить ${selectedIds.length} карточек?`)) return;
              try {
                await Promise.all(selectedIds.map(id => fetch(`/api/v2/vacancies/${id}`, { method: 'DELETE' })));
                setSelectedIds([]);
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
                  <option value="">{t('nav.filter_all_countries')} [{allCountries.length}]</option>
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
                    updateFilterParams({ city }, false);
                  }}
                  title={t('nav.filter_all_cities')}
                >
                  <option value="">{t('nav.filter_all_cities')} [{allCities.length}]</option>
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
                  updateFilterParams({ workplace_type: wp }, false);
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
                    updateFilterParams({ source: src }, false);
                  }}
                  title={t('nav.filter_all_sources')}
                >
                  <option value="">{t('nav.filter_all_sources')} [{allSources.length}]</option>
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
                  updateFilterParams({ is_closed: val }, false);
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
            const nonRejectedClosedCount = vacancies.filter(v => v.is_closed && v.status !== 'Отказ').length;
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
                  {t('nav.move_all_to_rejected')}{nonRejectedClosedCount > 0 ? ` [${nonRejectedClosedCount}]` : ''}
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
                  updateFilterParams({ tag: '' }, false);
                }}
              >
                {t('nav.all_tags')} [{vacancies.length - hiddenVacancyIds.size}]
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`tag-filter-chip ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => {
                    const nextTag = selectedTag === tag ? '' : tag;
                    trackEvent(EVENTS.FILTER_TAG, { tag: nextTag || 'all' });
                    updateFilterParams({ tag: nextTag }, false);
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
          hiddenVacancyIds={hiddenVacancyIds}
          columns={columns}
          onColumnsChange={(newCols) => {
            setColumns(newCols);
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
      />

      <QueueModal
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queueState={queueState}
      />

      {isGuestAuthModalOpen && (
        <LoginModal
          isOpen={isGuestAuthModalOpen}
          onClose={() => setIsGuestAuthModalOpen(false)}
          onLoginSuccess={(updatedUser) => {
            setIsGuestAuthModalOpen(false);
            if (onUserUpdated) onUserUpdated(updatedUser);
            fetchVacancies();
          }}
          isGuestPromotion={true}
        />
      )}
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
