'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { useAuth } from '../components/AppShell';
import { trackEvent, EVENTS } from '../utils/analytics';
import { shouldShowExtensionPrompt } from '../utils/extension';
import { scheduleRevalidate } from '../utils/revalidate';

export default function HomePage({
  initialVacancies = [],
  initialColumns = [],
  activeVacancyId = null,
  onModalClose = null,
}) {
  const { t } = useTranslation();
  const { user, handleLogout, setUser } = useAuth();
  const router = useRouter();

  const [vacancies, setVacancies] = useState(initialVacancies);
  const [columns, setColumns] = useState(initialColumns);
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

  // Sync selectedVacancy with activeVacancyId or vacancies list
  useEffect(() => {
    if (activeVacancyId) {
      const found = vacancies.find((v) => String(v.id) === String(activeVacancyId));
      if (found) {
        setSelectedVacancy(found);
      } else {
        // Fetch specific vacancy if not loaded in initial list
        fetch(`/api/vacancies/${activeVacancyId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) setSelectedVacancy(data);
          })
          .catch((e) => console.error('Error fetching vacancy modal:', e));
      }
    } else {
      setSelectedVacancy(null);
    }
  }, [activeVacancyId, vacancies]);

  // Multiselect state
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkTagOpen, setIsBulkTagOpen] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [showExtPrompt, setShowExtPrompt] = useState(false);

  const fetchVacancies = useCallback(async () => {
    if (!user) return;
    try {
      let url = '/api/vacancies';
      const params = new URLSearchParams();
      if (selectedTag) params.append('tag', selectedTag);
      if (selectedCountry) params.append('country', selectedCountry);
      if (selectedCity) params.append('city', selectedCity);
      if (selectedWorkplaceType) params.append('workplace_type', selectedWorkplaceType);
      if (selectedSource) params.append('source', selectedSource);
      if (selectedClosed) params.append('is_closed', selectedClosed);
      if (search) params.append('search', search);

      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVacancies(data);
      }
    } catch (err) {
      console.error('Failed to fetch vacancies', err);
    }
  }, [selectedTag, selectedCountry, selectedCity, selectedWorkplaceType, selectedSource, selectedClosed, search, user]);

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
  };

  const fetchQueueStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/queue/status');
      if (res.ok) {
        const data = await res.json();
        const rem = data.pending_count + data.processing_count;
        setQueueRemaining(rem);
      }
    } catch (err) {
      console.error('Failed to fetch queue status', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTags();
      fetchCountries();
      fetchCities();
      fetchSources();
      fetchColumns();
      fetchQueueStatus();
    }
  }, [user, fetchTags, fetchCountries, fetchCities, fetchSources, fetchColumns, fetchQueueStatus]);

  // Initial load or filter change
  const initialMount = useRef(true);
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      // If we got initialVacancies from server and no filter active, keep them
      if (initialVacancies.length > 0 && !selectedTag && !selectedCountry && !selectedCity && !selectedWorkplaceType && !selectedSource && !selectedClosed && !search) {
        return;
      }
    }
    const timer = setTimeout(() => {
      fetchVacancies();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchVacancies, selectedTag, selectedCountry, selectedCity, selectedWorkplaceType, selectedSource, selectedClosed, search, initialVacancies.length]);

  // Check extension prompt
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    shouldShowExtensionPrompt().then((show) => {
      if (!cancelled && show) setShowExtPrompt(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Mercure SSE
  useEffect(() => {
    if (!user) return;

    let eventSource = null;
    let isCancelled = false;

    const connectMercure = async () => {
      try {
        let hubUrl = `${window.location.origin}/.well-known/mercure`;
        try {
          const configRes = await fetch('/api/config');
          if (configRes.ok) {
            const configData = await configRes.json();
            if (configData.mercure_public_url) {
              hubUrl = configData.mercure_public_url;
            }
          }
        } catch (e) {
          console.warn('Could not fetch /api/config, fallback to default Mercure hub', e);
        }

        if (isCancelled) return;

        const sseUrl = new URL(hubUrl, window.location.origin);
        sseUrl.searchParams.append('topic', 'urn:vacancies:updates');
        sseUrl.searchParams.append('topic', 'urn:queue:tasks');

        eventSource = new EventSource(sseUrl.toString());

        eventSource.onopen = () => {
          setMercureStatus('connected');
        };

        eventSource.onerror = (err) => {
          console.warn('Mercure connection error, retrying...', err);
          setMercureStatus('connecting');
        };

        eventSource.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'queue_status') {
              setQueueRemaining(msg.remaining_tasks || 0);
            } else if (msg.type === 'vacancy_updated' || msg.type === 'vacancy_created') {
              const vacancy = msg.data;
              if (vacancy && vacancy.id) {
                setVacancies((prev) => {
                  const idx = prev.findIndex((v) => v.id === vacancy.id);
                  if (idx !== -1) {
                    const copy = [...prev];
                    copy[idx] = { ...copy[idx], ...vacancy };
                    return copy;
                  } else {
                    return [vacancy, ...prev];
                  }
                });
                setSelectedVacancy((prev) => (prev && prev.id === vacancy.id ? { ...prev, ...vacancy } : prev));
                fetchTags();
                fetchCountries();
                fetchCities(selectedCountry);
                fetchSources();
              }
            } else if (msg.type === 'vacancy_match_updated') {
              const { id: matchedId, match_score: newScore } = msg.data || {};
              if (matchedId) {
                setVacancies((prev) =>
                  prev.map((v) => (v.id === matchedId ? { ...v, match_score: newScore } : v))
                );
                setSelectedVacancy((prev) => (prev && prev.id === matchedId ? { ...prev, match_score: newScore } : prev));
              }
            } else if (msg.type === 'vacancy_deleted') {
              const delId = msg.data?.id;
              if (delId) {
                setVacancies((prev) => prev.filter((v) => v.id !== delId));
                setSelectedVacancy((prev) => (prev && prev.id === delId ? null : prev));
              }
            }
          } catch (parseErr) {
            console.error('Error handling Mercure SSE message', parseErr);
          }
        };
      } catch (err) {
        console.error('Failed to initialize Mercure EventSource', err);
        setMercureStatus('connecting');
      }
    };

    connectMercure();

    return () => {
      isCancelled = true;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user, fetchTags, fetchCountries, fetchCities, selectedCountry, fetchSources]);

  // Card click opens URL /vacancies/[id]
  const handleCardClick = (vacancy) => {
    router.push(`/vacancies/${vacancy.id}`, { scroll: false });
  };

  const handleCloseVacancyModal = () => {
    if (onModalClose) {
      onModalClose();
    } else {
      router.push('/', { scroll: false });
    }
  };

  // Card status change (drag or arrows)
  const handleStatusChange = async (vacancyId, newStatus) => {
    trackEvent(EVENTS.VACANCY_MOVE_STATUS, { status: newStatus });
    setVacancies((prev) =>
      prev.map((v) => (v.id === vacancyId ? { ...v, status: newStatus } : v))
    );
    setSelectedVacancy((prev) => (prev && prev.id === vacancyId ? { ...prev, status: newStatus } : prev));

    try {
      const res = await fetch(`/api/vacancies/${vacancyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setVacancies((prev) => prev.map((v) => (v.id === vacancyId ? updated : v)));
        scheduleRevalidate({ tag: 'vacancies', path: '/' });
      }
    } catch (err) {
      console.error('Failed to update vacancy status', err);
      fetchVacancies();
    }
  };

  // Reorder
  const handleReorder = async (reorderedVacancies) => {
    setVacancies(reorderedVacancies);
    const orderPayload = reorderedVacancies.map((v, idx) => ({ id: v.id, order_index: idx }));
    try {
      await fetch('/api/vacancies/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      scheduleRevalidate({ tag: 'vacancies', path: '/' });
    } catch (e) {
      console.error('Failed to save vacancy order', e);
    }
  };

  const handleVacancyUpdate = (updatedVacancy) => {
    setVacancies((prev) =>
      prev.map((v) => (v.id === updatedVacancy.id ? updatedVacancy : v))
    );
    setSelectedVacancy(updatedVacancy);
    scheduleRevalidate({ tag: 'vacancies', path: `/vacancies/${updatedVacancy.id}` });
  };

  const handleVacancyDelete = (deletedId) => {
    setVacancies((prev) => prev.filter((v) => v.id !== deletedId));
    handleCloseVacancyModal();
    scheduleRevalidate({ tag: 'vacancies', path: '/' });
  };

  const handleImportComplete = () => {
    scheduleRevalidate({ tag: 'vacancies', path: '/' });
    fetchQueueStatus();
    fetchVacancies();
  };

  // Selection toggle
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setIsBulkTagOpen(false);
    setBulkTagInput('');
  };

  const handleStatusChangeMulti = async (colId) => {
    const ids = [...selectedIds];
    setVacancies((prev) =>
      prev.map((v) => (ids.includes(v.id) ? { ...v, status: colId } : v))
    );
    clearSelection();
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/vacancies/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: colId }),
          })
        )
      );
      scheduleRevalidate({ tag: 'vacancies', path: '/' });
      fetchVacancies();
    } catch (err) {
      console.error('Failed to change status in bulk', err);
      fetchVacancies();
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(t('kanban.confirm_bulk_delete', { count: selectedIds.length }) || `Delete ${selectedIds.length} vacancies?`)) {
      return;
    }
    const ids = [...selectedIds];
    setVacancies((prev) => prev.filter((v) => !ids.includes(v.id)));
    clearSelection();
    try {
      await Promise.all(ids.map((id) => fetch(`/api/vacancies/${id}`, { method: 'DELETE' })));
      scheduleRevalidate({ tag: 'vacancies', path: '/' });
      fetchVacancies();
    } catch (err) {
      console.error('Failed to bulk delete', err);
      fetchVacancies();
    }
  };

  const handleAddBulkTag = async (e) => {
    e.preventDefault();
    if (!bulkTagInput.trim()) return;
    setIsBulkLoading(true);
    const newTag = bulkTagInput.trim();
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          const v = vacancies.find((item) => item.id === id);
          const currentTags = v?.tags || [];
          if (!currentTags.includes(newTag)) {
            await fetch(`/api/vacancies/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tags: [...currentTags, newTag] }),
            });
          }
        })
      );
      setBulkTagInput('');
      setIsBulkTagOpen(false);
      clearSelection();
      fetchVacancies();
      fetchTags();
    } catch (err) {
      console.error('Failed to add bulk tag', err);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const activeFiltersCount = [
    selectedTag,
    selectedCountry,
    selectedCity,
    selectedWorkplaceType,
    selectedSource,
    selectedClosed,
  ].filter(Boolean).length;

  return (
    <div className="home-page">
      {/* App Header with search, import, and filters */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Briefcase size={20} />
          </div>
          <div>
            <div className="brand-title">{t('nav.title')}</div>
            <p className="brand-subtitle">{t('nav.subtitle')}</p>
          </div>
        </div>

        <div className="header-search-container">
          <div className={`search-input-wrapper ${isSearchFocused ? 'focused' : ''}`}>
            <Search size={16} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('nav.search_placeholder')}
              value={search}
              onChange={onChangeSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="search-input"
            />
            {search && (
              <button
                type="button"
                className="btn-icon search-clear-btn"
                onClick={resetSearch}
                aria-label="Clear search"
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
          onColumnsUpdated={setColumns}
          onUserUpdated={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
        >
          {queueRemaining > 0 && (
            <button
              className="btn btn-secondary queue-indicator-btn"
              onClick={() => setIsQueueOpen(true)}
              title={t('nav.queue_modal_title')}
            >
              <RefreshCw size={14} className="spinner" />
              <span>{queueRemaining}</span>
            </button>
          )}

          <button
            className="btn btn-primary"
            onClick={() => setIsBatchOpen(true)}
          >
            <Plus size={16} />
            <span>{t('nav.import_btn')}</span>
          </button>
        </HeaderControls>
      </header>

      {/* Filter Toolbar */}
      <section className="filter-toolbar">
        <div className="filter-group">
          {/* Tag Filter */}
          <div className="filter-item">
            <TagFilterSelect
              options={allTags}
              value={selectedTag}
              onChange={(val) => {
                trackEvent(EVENTS.FILTER_TAG, { tag: val || 'all' });
                setSelectedTag(val);
              }}
              placeholder={t('filters.all_tags')}
            />
          </div>

          {/* Country Filter */}
          <div className="filter-item">
            <select
              className="filter-select"
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
            >
              <option value="">{t('filters.all_countries')}</option>
              {allCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div className="filter-item">
            <select
              className="filter-select"
              value={selectedCity}
              onChange={(e) => {
                trackEvent(EVENTS.FILTER_CITY, { city: e.target.value || 'all' });
                setSelectedCity(e.target.value);
              }}
            >
              <option value="">{t('filters.all_cities')}</option>
              {allCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Workplace Type */}
          <div className="filter-item">
            <select
              className="filter-select"
              value={selectedWorkplaceType}
              onChange={(e) => {
                trackEvent(EVENTS.FILTER_WORKPLACE, { type: e.target.value || 'all' });
                setSelectedWorkplaceType(e.target.value);
              }}
            >
              <option value="">{t('filters.workplace_all')}</option>
              <option value="remote">{t('filters.workplace_remote')}</option>
              <option value="hybrid">{t('filters.workplace_hybrid')}</option>
              <option value="on-site">{t('filters.workplace_on_site')}</option>
            </select>
          </div>

          {/* Source */}
          <div className="filter-item">
            <select
              className="filter-select"
              value={selectedSource}
              onChange={(e) => {
                trackEvent(EVENTS.FILTER_SOURCE, { source: e.target.value || 'all' });
                setSelectedSource(e.target.value);
              }}
            >
              <option value="">{t('filters.all_sources')}</option>
              {allSources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Closed Status */}
          <div className="filter-item">
            <select
              className="filter-select"
              value={selectedClosed}
              onChange={(e) => {
                trackEvent(EVENTS.FILTER_STATUS, { status: e.target.value || 'all' });
                setSelectedClosed(e.target.value);
              }}
            >
              <option value="">{t('filters.all_statuses')}</option>
              <option value="false">{t('filters.active_only')}</option>
              <option value="true">{t('filters.closed_only')}</option>
            </select>
          </div>

          {/* Reset Filters */}
          {activeFiltersCount > 0 && (
            <button
              className="btn btn-secondary btn-sm reset-filters-btn"
              onClick={resetAllFilters}
              title={t('filters.reset')}
            >
              <RotateCcw size={13} />
              <span>{t('filters.reset')}</span>
            </button>
          )}
        </div>

        {/* Mercure status indicator */}
        <div className="mercure-indicator" title={`Live sync: ${mercureStatus}`}>
          <span className={`mercure-dot ${mercureStatus}`} />
          <span className="mercure-text">{mercureStatus === 'connected' ? 'Live' : 'Syncing'}</span>
        </div>
      </section>

      {/* Multiselect Bar */}
      {selectedIds.length > 0 && (
        <div className="bulk-actions-bar">
          <span className="bulk-count">
            {t('kanban.selected_count', { count: selectedIds.length }) || `Selected: ${selectedIds.length}`}
          </span>
          <div className="bulk-buttons">
            <button className="btn btn-secondary btn-sm" onClick={() => setIsBulkTagOpen((p) => !p)}>
              {t('kanban.bulk_add_tag')}
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
              <Trash2 size={13} />
              <span>{t('kanban.bulk_delete')}</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={clearSelection}>
              <X size={13} />
            </button>
          </div>

          {isBulkTagOpen && (
            <form onSubmit={handleAddBulkTag} className="bulk-tag-form">
              <input
                type="text"
                placeholder={t('kanban.new_tag_placeholder')}
                value={bulkTagInput}
                onChange={(e) => setBulkTagInput(e.target.value)}
                className="input input-sm"
                autoFocus
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={isBulkLoading}>
                {t('kanban.save')}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Main Kanban Board */}
      <main className="board-container">
        <KanbanBoard
          vacancies={vacancies}
          columns={columns}
          onColumnsChange={(newCols) => {
            setColumns(newCols);
            fetchVacancies();
          }}
          onCardClick={handleCardClick}
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
        onClose={handleCloseVacancyModal}
        onUpdate={handleVacancyUpdate}
        onDelete={handleVacancyDelete}
      />

      <QueueModal
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
      />

      <ExtensionPromptModal
        isOpen={showExtPrompt}
        onClose={() => setShowExtPrompt(false)}
      />
    </div>
  );
}

function TagFilterSelect({ options, value, onChange, placeholder }) {
  return (
    <select
      className="filter-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}
