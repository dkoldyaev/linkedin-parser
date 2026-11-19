import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, Search, Filter, 
  RefreshCw, CheckCircle2, AlertCircle, X, Loader2, Download,
  Globe, MapPin, RotateCcw, ChevronDown, Laptop, Trash2, ExternalLink, Ban, XCircle
} from 'lucide-react';
import {
  Header,
  SearchBar,
  FilterBar,
  DashboardLayout,
  AlertBanner,
  Button,
  Icon,
  Badge,
  Spinner,
  Input,
  Text,
} from '@blueprint/ui-kit';
import KanbanBoard from '../components/KanbanBoard';
import BatchImportModal from '../components/BatchImportModal';
import VacancyModal from '../components/VacancyModal';
import SettingsModal from '../components/SettingsModal';
import QueueModal from '../components/QueueModal';
import LoginModal from '../components/LoginModal';
import { useMenu } from '../components/menuContext';
import { useTranslation } from '../i18n/I18nContext';
import { STATUS_REJECTED } from '../constants/columns';
import { trackEvent, EVENTS } from '../utils/analytics';

export default function HomePage({ user, onLogout, onUserUpdated }) {
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

  const { open: menuOpen, toggle: toggleMenu } = useMenu();
  const [theme, setTheme] = useState(() => (typeof document !== 'undefined' ? document.documentElement.dataset.theme || 'dark' : 'dark'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleThemeToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('workspace-theme', next);
    } catch {
      /* Session fallback */
    }
    setTheme(next);
  };

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
        if (requestId === vacancyRequest.current) setVacancies(data);
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
    fetchColumns();
    fetchTags();
    fetchCountries();
    fetchCities(selectedCountry);
    fetchSources();
    fetchQueueStatus();
  }, [user, fetchColumns, fetchTags, fetchCountries, fetchCities, fetchSources, fetchQueueStatus, selectedCountry]);

  useEffect(() => {
    const timer = setTimeout(fetchVacancies, 150);
    return () => { clearTimeout(timer); vacancyRequest.current += 1; };
  }, [fetchVacancies]);

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
    hasFilters: Boolean(search.trim() || selectedTag || selectedCountry || selectedCity || selectedWorkplaceType || selectedSource || selectedClosed),
    fetchQueueStatus,
    showToast,
    t
  };

  // Connect to Mercure SSE Hub for real-time updates
  useEffect(() => {
    if (!user) return;
    let eventSource = null;
    let isSubscribed = true;
    let refreshTimer;
    let reconcileTimer;
    const scheduleRefresh = () => {
      clearTimeout(reconcileTimer);
      reconcileTimer = setTimeout(() => {
        if (!isSubscribed) return;
        const cb = callbacksRef.current;
        cb.fetchVacancies();
        cb.fetchTags();
        cb.fetchCountries();
        cb.fetchCities(cb.selectedCountry);
        cb.fetchSources();
        cb.fetchQueueStatus();
      }, 150);
    };

    const initMercure = async () => {
      try {
        setMercureStatus('connecting');
        const configRes = await fetch('/api/config', { credentials: 'include' });
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
            scheduleRefresh();
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
                if (callbacksRef.current.hasFilters) return prev;
                if (currentSelectedClosed === 'false' && vacancy.is_closed) return prev;
                if (currentSelectedClosed === 'true' && !vacancy.is_closed) return prev;
                const exists = prev.some(v => v.id === vacancy.id);
                if (exists) {
                  return prev.map(v => v.id === vacancy.id ? vacancy : v);
                }
                return [vacancy, ...prev];
              });
              currentShowToast(currentT('mercure.vacancy_created', { title: vacancy.title, company: vacancy.company }));
              scheduleRefresh();
            } else if (type === 'vacancy_updated' && vacancy) {
              setVacancies(prev => {
                if (callbacksRef.current.hasFilters) return prev;
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
              scheduleRefresh();
            } else if (type === 'compatibility_analyzed') {
              const matchedId = vacancy_id || data.vacancy_id;
              const newScore = data.match_score !== undefined
                ? data.match_score
                : (data.calculated_score !== undefined ? data.calculated_score : data.overall_score);
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
                scheduleRefresh();
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
              scheduleRefresh();
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
      clearTimeout(reconcileTimer);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user]);

  // Handle status change from drag & drop or quick move
  const handleStatusChange = async (vacancyId, newStatus, lane = 0) => {
    const targetCol = columns.find(c => c.id === newStatus);
    const targetLane = targetCol?.has_lanes ? lane : 0;
    // Optimistic UI update
    setVacancies(prev => prev.map(v => v.id === vacancyId ? { ...v, status: newStatus, lane: targetLane } : v));
    if (selectedVacancy && selectedVacancy.id === vacancyId) {
      setSelectedVacancy(prev => ({ ...prev, status: newStatus, lane: targetLane }));
    }

    try {
      const res = await fetch(`/api/vacancies/${vacancyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, lane: targetLane })
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
      const res = await fetch('/api/vacancies/reorder', {
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

  const handleStatusChangeMulti = async (vacancyIds, newStatus, lane = 0) => {
    const targetCol = columns.find(c => c.id === newStatus);
    const targetLane = targetCol?.has_lanes ? lane : 0;
    setVacancies(prev => prev.map(v => vacancyIds.includes(v.id) ? { ...v, status: newStatus, lane: targetLane } : v));
    try {
      await Promise.all(vacancyIds.map(vid => 
        fetch(`/api/vacancies/${vid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, lane: targetLane })
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
    const targets = vacancies.filter(v => v.status !== STATUS_REJECTED);
    if (targets.length === 0) return;
    const confirmMsg = t('nav.move_all_to_rejected_confirm', { count: targets.length });
    if (!window.confirm(confirmMsg)) return;

    setIsMovingAllRejected(true);
    trackEvent(EVENTS.MOVE_ALL_CLOSED_REJECTED, { count: targets.length });
    try {
      const ids = targets.map(v => v.id);
      setVacancies(prev => prev.map(v => ids.includes(v.id) ? { ...v, status: STATUS_REJECTED } : v));
      await Promise.all(ids.map(vid => 
        fetch(`/api/vacancies/${vid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: STATUS_REJECTED })
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

  // Filter configurations for UI-Kit FilterBar
  const filterSelects = [
    (allCountries.length > 0 || selectedCountry) && {
      id: 'country',
      ariaLabel: t('nav.filter_all_countries'),
      placeholder: `${t('nav.filter_all_countries')} [${allCountries.length}]`,
      value: selectedCountry,
      options: [
        { value: '', label: `${t('nav.filter_all_countries')} [${allCountries.length}]` },
        ...allCountries.map((c) => ({ value: c, label: c })),
      ],
      onChange: (val) => handleCountryChange(val),
    },
    (allCities.length > 0 || selectedCity) && {
      id: 'city',
      ariaLabel: t('nav.filter_all_cities'),
      placeholder: `${t('nav.filter_all_cities')} [${allCities.length}]`,
      value: selectedCity,
      options: [
        { value: '', label: `${t('nav.filter_all_cities')} [${allCities.length}]` },
        ...allCities.map((c) => ({ value: c, label: c })),
      ],
      onChange: (val) => {
        trackEvent(EVENTS.FILTER_CITY, { city: val || 'all' });
        setSelectedCity(val);
      },
    },
    {
      id: 'workplace',
      ariaLabel: t('nav.filter_all_workplaces'),
      placeholder: t('nav.filter_all_workplaces'),
      value: selectedWorkplaceType,
      options: [
        { value: '', label: t('nav.filter_all_workplaces') },
        { value: 'remote', label: t('workplace.remote') },
        { value: 'hybrid', label: t('workplace.hybrid') },
        { value: 'on-site', label: t('workplace.on-site') },
      ],
      onChange: (val) => {
        trackEvent(EVENTS.FILTER_WORKPLACE, { workplace_type: val || 'all' });
        setSelectedWorkplaceType(val);
      },
    },
    (allSources.length > 0 || selectedSource) && {
      id: 'source',
      ariaLabel: t('nav.filter_all_sources'),
      placeholder: `${t('nav.filter_all_sources')} [${allSources.length}]`,
      value: selectedSource,
      options: [
        { value: '', label: `${t('nav.filter_all_sources')} [${allSources.length}]` },
        ...allSources.map((s) => ({ value: s, label: s })),
      ],
      onChange: (val) => {
        trackEvent(EVENTS.FILTER_SOURCE, { source: val || 'all' });
        setSelectedSource(val);
      },
    },
    {
      id: 'closed',
      ariaLabel: t('nav.filter_all_closed'),
      placeholder: t('nav.filter_all_closed'),
      value: selectedClosed,
      options: [
        { value: '', label: t('nav.filter_all_closed') },
        { value: 'false', label: t('nav.filter_open') },
        { value: 'true', label: t('nav.filter_closed') },
      ],
      onChange: (val) => {
        trackEvent(EVENTS.FILTER_CLOSED, { is_closed: val || 'all' });
        setSelectedClosed(val);
      },
    },
  ].filter(Boolean);

  const filterTags = allTags.map((tag) => ({
    label: tag,
  }));

  const nonRejectedClosedCount = vacancies.filter((v) => v.status !== STATUS_REJECTED).length;
  const closedActions = selectedClosed === 'true' && nonRejectedClosedCount > 0 ? (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleMoveAllClosedToRejected}
      disabled={isMovingAllRejected}
      title={t('nav.move_all_to_rejected_confirm', { count: nonRejectedClosedCount })}
      startIcon={isMovingAllRejected ? <Spinner size="xs" /> : <Icon icon={XCircle} size="xs" />}
    >
      {t('nav.move_all_to_rejected')} [{nonRejectedClosedCount}]
    </Button>
  ) : null;

  const filterBarSlot = selectedIds.length > 0 ? (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box',
        gap: 'var(--ui-space-3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-3)' }}>
        <Badge variant="primary" size="sm">
          {t('kanban.selected_count', { count: selectedIds.length })}
        </Badge>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSelectedIds([])}
          title={t('kanban.clear_selection')}
          aria-label={t('kanban.clear_selection')}
        >
          <Icon icon={X} size="xs" />
        </Button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
        <div style={{ width: 'calc(4 * var(--ui-grid-cell))' }}>
          <Input
            size="sm"
            placeholder={t('kanban.bulk_tag_placeholder')}
            value={bulkTagInput}
            onChange={(e) => setBulkTagInput(e.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
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
              showToast(t('kanban.bulk_tags_added'));
            } catch (e) { console.error(e); }
          }}
        >
          {t('kanban.bulk_add_tag')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          tone="danger"
          onClick={async () => {
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
              showToast(t('kanban.bulk_tags_removed'));
            } catch (e) { console.error(e); }
          }}
        >
          {t('kanban.bulk_remove_tag')}
        </Button>
        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--ui-pixel-line)', margin: '0 var(--ui-space-1)' }} />
        <Button
          variant="ghost"
          size="icon-sm"
          tone="danger"
          onClick={async () => {
            if (!window.confirm(t('kanban.confirm_delete_selected', { count: selectedIds.length }))) return;
            try {
              await Promise.all(selectedIds.map(id => fetch(`/api/vacancies/${id}`, { method: 'DELETE' })));
              setSelectedIds([]);
              fetchVacancies();
              fetchTags();
              fetchSources();
              showToast(t('kanban.bulk_deleted'));
            } catch (e) { console.error(e); }
          }}
          title={t('kanban.bulk_delete_title')}
          aria-label={t('kanban.bulk_delete_title')}
        >
          <Icon icon={Trash2} size="xs" />
        </Button>
      </div>
    </div>
  ) : (allCountries.length > 0 || allCities.length > 0 || allSources.length > 0 || allTags.length > 0 || selectedCountry || selectedCity || selectedWorkplaceType || selectedSource || selectedClosed !== '' || selectedTag) ? (
    <FilterBar
      selects={filterSelects}
      tags={filterTags}
      selectedTags={selectedTag ? [selectedTag] : []}
      onToggleTag={(tag) => {
        const next = selectedTag === tag ? '' : tag;
        trackEvent(EVENTS.FILTER_TAG, { tag: next || 'all' });
        setSelectedTag(next);
      }}
      tagPrefix="#"
      hasActiveFilters={Boolean(selectedCountry || selectedCity || selectedWorkplaceType || selectedSource || selectedClosed !== '' || selectedTag || search)}
      onReset={resetAllFilters}
      resetLabel={t('nav.reset_filters')}
      actionsSlot={closedActions}
    />
  ) : undefined;

  const guestToolbar = (user?.is_anonymous && vacancies.length >= 2 && !guestBannerDismissed) ? (
    <AlertBanner
      tone="info"
      dismissible
      onDismiss={() => {
        setGuestBannerDismissed(true);
        sessionStorage.setItem('guest_banner_dismissed', 'true');
      }}
      action={
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsGuestAuthModalOpen(true)}
        >
          {t('auth.guest_banner_btn')}
        </Button>
      }
      style={{ width: '100%', borderRadius: 0 }}
    >
      {t('auth.guest_banner_text')}
    </AlertBanner>
  ) : undefined;

  return (
    <DashboardLayout
      header={
        <>
          <Header
            title={t('nav.title')}
            subtitle={t('nav.subtitle')}
            search={
              <SearchBar
                ref={searchInputRef}
                value={search}
                onValueChange={(val) => {
                  setSearch(val);
                }}
                onClear={() => {
                  trackEvent(EVENTS.SEARCH_APPLIED, { query_length: 0 });
                  setSearch('');
                }}
                placeholder={t('nav.search_placeholder')}
                expandOnFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.target.blur();
                  }
                }}
              />
            }
            queueCount={queueRemaining}
            queueLabel={t('nav.queue_label', { count: queueRemaining, unit: queueUnit })}
            onQueueClick={() => setIsQueueOpen(true)}
            primaryActionLabel={t('nav.batch_import_btn')}
            onPrimaryAction={handleAddVacanciesClick}
            onRefresh={async () => {
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
            refreshLabel={selectedIds.length > 0 ? t('nav.refresh_selected_btn') : t('nav.refresh_btn')}
            showThemeToggle
            theme={theme}
            onThemeToggle={handleThemeToggle}
            onSettingsClick={user ? () => {
              trackEvent(EVENTS.SETTINGS_OPEN);
              setIsSettingsOpen(true);
            } : undefined}
            settingsLabel={t('nav.settings_btn')}
            user={user ? {
              name: user.name,
              email: user.email,
              picture: user.picture,
              isAnonymous: user.is_anonymous,
            } : undefined}
            loginLabel={t('auth.login_btn')}
            logoutLabel={t('auth.logout')}
            onLogin={() => setIsGuestAuthModalOpen(true)}
            onLogout={handleLogout}
            menuOpen={menuOpen}
            onMenuToggle={toggleMenu}
            actions={
              user ? (
                <Button
                  as="a"
                  href="/extension.zip"
                  download
                  variant="ghost"
                  size="icon"
                  title={t('nav.download_extension')}
                  aria-label={t('nav.download_extension')}
                >
                  <Icon icon={Download} size="sm" aria-hidden="true" />
                </Button>
              ) : null
            }
          />

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            vacancies={vacancies}
            onColumnsUpdated={(newCols) => {
              setColumns(newCols);
              fetchVacancies();
            }}
            onUserUpdated={onUserUpdated}
          />
        </>
      }
      filterBar={filterBarSlot}
      toolbar={guestToolbar}
      style={{ minHeight: '100%', height: '100%' }}
    >
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
        <div style={{ position: 'fixed', bottom: 'var(--ui-space-6)', right: 'var(--ui-space-6)', zIndex: 9999, maxWidth: '420px' }}>
          <AlertBanner
            tone={toast.type === 'error' ? 'danger' : 'success'}
            dismissible
            onDismiss={() => setToast(null)}
          >
            {toast.message}
          </AlertBanner>
        </div>
      )}
    </DashboardLayout>
  );
}
