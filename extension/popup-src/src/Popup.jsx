import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box, Button, Chip, CircularProgress, Divider, IconButton,
  LinearProgress, Paper, Stack, Tooltip, Typography,
  useMediaQuery,
} from '@mui/material'
import {
  Add, AutoAwesome, Extension, OpenInNew, Refresh,
  WarningAmber, CheckCircle, ErrorOutline, HourglassTop,
} from '@mui/icons-material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

// Chrome extension API shim for dev outside extension context
const chrome = window.chrome ?? {
  tabs: { query: (_, cb) => cb([{ url: 'https://example.com', title: 'Example' }]) },
  scripting: { executeScript: async () => [{ result: '<html></html>' }] },
  runtime: { sendMessage: async () => ({}) },
}

// Injected at build time from APP_URL (see extension/build/config.mjs)
// eslint-disable-next-line no-undef
const API_BASE = __API_BASE__

function buildTheme(mode) {
  const dark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: { main: '#8ab4f8' },          // Google Blue adapted for dark/light
      ...(dark ? {
        primary:    { main: '#8ab4f8' },      // light blue on dark bg
        success:    { main: '#81c995' },
        warning:    { main: '#fdd663' },
        error:      { main: '#f28b82' },
        background: { default: '#202124', paper: '#292a2d' },
        text:       { primary: '#e8eaed', secondary: '#9aa0a6' },
        divider:    'rgba(255,255,255,0.12)',
      } : {
        primary:    { main: '#1a73e8' },      // Google Blue
        success:    { main: '#188038' },
        warning:    { main: '#e37400' },
        error:      { main: '#c5221f' },
        background: { default: '#fff', paper: '#f8f9fa' },
      }),
    },
    typography: {
      fontFamily: '"Google Sans", "Roboto", system-ui, sans-serif',
      fontSize: 13,
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600 },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600, fontSize: 11 } },
      },
      MuiPaper: {
        styleOverrides: {
          outlined: ({ theme }) => ({
            borderColor: theme.palette.divider,
          }),
        },
      },
    },
  })
}

// ── API helpers ──────────────────────────────────────────────────────────────

async function fetchQueueData() {
  const [tasksRes, statusRes] = await Promise.all([
    fetch(`${API_BASE}/api/queue/tasks`, { credentials: 'include' }),
    fetch(`${API_BASE}/api/queue/status`, { credentials: 'include' }),
  ])
  const tasks  = tasksRes.ok  ? await tasksRes.json()  : []
  const status = statusRes.ok ? await statusRes.json() : {}
  return { tasks, total: status.total_remaining ?? tasks.length }
}

async function getBlockedTabs() {
  try {
    return await chrome.runtime.sendMessage({ type: 'GET_BLOCKED_TABS' }) ?? {}
  } catch { return {} }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StageBadge({ stage, status }) {
  const isProcessing = status === 'processing'
  if (status === 'failed') {
    return (
      <Chip
        icon={<ErrorOutline sx={{ fontSize: '12px !important' }} />}
        label="ERR"
        size="small"
        color="error"
        variant="filled"
        sx={{ fontSize: 10, height: 20 }}
      />
    )
  }
  if (stage === 'ai_analysis' || stage === 'ai') {
    return (
      <Chip
        icon={<AutoAwesome sx={{ fontSize: '12px !important' }} />}
        label="AI"
        size="small"
        color={isProcessing ? 'primary' : 'default'}
        variant={isProcessing ? 'filled' : 'outlined'}
        sx={{ fontSize: 10, height: 20 }}
      />
    )
  }
  if (stage === 'pending_extension') {
    return (
      <Chip
        icon={<Extension sx={{ fontSize: '12px !important' }} />}
        label="EXT"
        size="small"
        color="warning"
        variant="outlined"
        sx={{ fontSize: 10, height: 20 }}
      />
    )
  }
  return (
    <Chip
      icon={<HourglassTop sx={{ fontSize: '12px !important' }} />}
      label="SCR"
      size="small"
      color={isProcessing ? 'primary' : 'default'}
      variant={isProcessing ? 'filled' : 'outlined'}
      sx={{ fontSize: 10, height: 20 }}
    />
  )
}

function QueueItem({ task }) {
  const isActive = task.status === 'processing'
  const isFailed = task.status === 'failed' || Boolean(task.error)
  const isPendingExt = task.status === 'pending_extension' || task.stage === 'pending_extension'
  const title = task.title || task.url || task.task_id

  return (
    <Paper
      variant="outlined"
      sx={{
        px: 1.5, py: 0.75,
        display: 'flex', alignItems: 'center', gap: 1,
        borderColor: isFailed ? '#ef4444' : isPendingExt ? '#f59e0b' : isActive ? 'primary.light' : 'divider',
        bgcolor: isFailed ? 'rgba(239, 68, 68, 0.08)' : isPendingExt ? 'rgba(245, 158, 11, 0.08)' : isActive ? 'rgba(26,115,232,0.04)' : 'background.paper',
        transition: 'all 0.2s',
      }}
    >
      {isActive && (
        <CircularProgress size={14} thickness={5} sx={{ flexShrink: 0 }} />
      )}
      {isFailed && (
        <ErrorOutline sx={{ fontSize: 16, color: '#ef4444', flexShrink: 0 }} />
      )}
      {isPendingExt && (
        <WarningAmber sx={{ fontSize: 16, color: '#f59e0b', flexShrink: 0 }} />
      )}
      <Box flex={1} minWidth={0}>
        <Typography variant="body2" noWrap fontWeight={500} title={title} color={isFailed ? '#ef4444' : 'text.primary'}>
          {title}
        </Typography>
        {task.error ? (
          <Typography variant="caption" color="error.main" noWrap title={task.error} display="block">
            {task.error}
          </Typography>
        ) : task.company ? (
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {task.company}
          </Typography>
        ) : null}
      </Box>
      <StageBadge stage={task.stage} status={task.status} />
    </Paper>
  )
}

function BlockedItem({ tabId, entry, onAction }) {
  const shortUrl = entry.url?.length > 42 ? entry.url.slice(0, 42) + '…' : entry.url
  const title = entry.title || shortUrl
  const agoSec = entry.detected_at ? Math.round((Date.now() - entry.detected_at) / 1000) : null
  const ago = agoSec != null ? (agoSec < 60 ? `${agoSec}s ago` : `${Math.round(agoSec / 60)}m ago`) : null

  return (
    <Paper
      variant="outlined"
      onClick={() => onAction('focus', tabId)}
      sx={{
        px: 1.5,
        py: 1.25,
        cursor: 'pointer',
        border: '2px solid #ef4444',
        borderRadius: 2,
        bgcolor: 'rgba(239, 68, 68, 0.08)',
        boxShadow: '0 0 12px rgba(239, 68, 68, 0.3)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          bgcolor: 'rgba(239, 68, 68, 0.15)',
          boxShadow: '0 0 18px rgba(239, 68, 68, 0.5)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.75}>
        <Chip
          icon={<WarningAmber sx={{ fontSize: '13px !important', color: '#fff !important' }} />}
          label="Требуется решение капчи"
          size="small"
          sx={{
            height: 20,
            fontSize: 10,
            fontWeight: 700,
            bgcolor: '#ef4444',
            color: '#fff',
            letterSpacing: 0.3,
          }}
        />
        {ago && <Typography variant="caption" color="text.secondary">{ago}</Typography>}
      </Box>

      <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all', mb: 0.5 }} title={entry.url}>
        {title}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          color: '#ef4444',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mb: 1,
        }}
      >
        <OpenInNew sx={{ fontSize: 13 }} />
        Нажмите, чтобы переключиться на вкладку
      </Typography>

      <Stack direction="row" spacing={0.75} mt={0.5}>
        <Button
          size="small"
          variant="contained"
          color="error"
          startIcon={<OpenInNew sx={{ fontSize: '13px !important' }} />}
          onClick={(e) => {
            e.stopPropagation();
            onAction('focus', tabId);
          }}
          sx={{ fontSize: 11, py: 0.4, flex: 1, fontWeight: 700 }}
        >
          Перейти к вкладке
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={(e) => {
            e.stopPropagation();
            onAction('retry', tabId);
          }}
          sx={{ fontSize: 11, py: 0.4, minWidth: 65 }}
        >
          Retry
        </Button>
        <Tooltip title="Закрыть вкладку">
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onAction('dismiss', tabId);
            }}
            sx={{ p: 0.25 }}
          >
            <ErrorOutline sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  )
}

// ── Main Popup ───────────────────────────────────────────────────────────────

export default function Popup() {
  // ── Detect system color scheme and build MUI theme ──
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const theme = useMemo(() => buildTheme(prefersDark ? 'dark' : 'light'), [prefersDark])

  const [currentUrl, setCurrentUrl] = useState('')
  const [currentHostname, setCurrentHostname] = useState('—')
  const [currentTabId, setCurrentTabId] = useState(null)

  const [addState, setAddState] = useState('idle') // idle | loading | success | error
  const [addMsg, setAddMsg] = useState('')

  const [queueTasks, setQueueTasks] = useState([])
  const [queueTotal, setQueueTotal] = useState(0)
  const [blockedTabs, setBlockedTabs] = useState({})
  const [refreshing, setRefreshing] = useState(false)

  const intervalRef = useRef(null)

  // Show current tab
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0]
      if (!tab) return
      setCurrentUrl(tab.url || '')
      setCurrentTabId(tab.id)
      try {
        setCurrentHostname(new URL(tab.url).hostname)
      } catch {
        setCurrentHostname(tab.url?.slice(0, 40) || '—')
      }
    })
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const [qd, blocked] = await Promise.all([fetchQueueData(), getBlockedTabs()])
      setQueueTasks(qd.tasks || [])
      setQueueTotal(qd.total)
      setBlockedTabs(blocked || {})
    } catch { /* ignore */ } finally {
      setRefreshing(false)
    }
  }, [])

  // Initial load + polling
  useEffect(() => {
    refresh()
    intervalRef.current = setInterval(refresh, 5000)
    return () => clearInterval(intervalRef.current)
  }, [refresh])

  const handleAdd = async () => {
    setAddState('loading')
    setAddMsg('Extracting page…')
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        func: () => document.documentElement.outerHTML,
      })
      const html = results?.[0]?.result
      if (!html) throw new Error('Failed to extract page')

      setAddMsg('Sending to server…')
      const res = await fetch(`${API_BASE}/api/extension/parse_and_add`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentUrl, html }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err.slice(0, 80) || `HTTP ${res.status}`)
      }

      setAddState('success')
      setAddMsg('Added! AI is analyzing…')
      setTimeout(refresh, 800)
      setTimeout(() => { setAddState('idle'); setAddMsg('') }, 4000)
    } catch (e) {
      setAddState('error')
      setAddMsg(e.message)
      setTimeout(() => { setAddState('idle'); setAddMsg('') }, 4000)
    }
  }

  const handleBlockedAction = async (action, tabId) => {
    const tid = parseInt(tabId, 10)
    if (action === 'focus') {
      await chrome.runtime.sendMessage({ type: 'FOCUS_BLOCKED_TAB', tabId: tid })
      window.close()
    } else if (action === 'retry') {
      await chrome.runtime.sendMessage({ type: 'RETRY_BLOCKED_TAB', tabId: tid })
      await refresh()
    } else if (action === 'dismiss') {
      await chrome.runtime.sendMessage({ type: 'DISMISS_BLOCKED_TAB', tabId: tid })
      await refresh()
    }
  }

  const blockedEntries = Object.entries(blockedTabs)
  const activeTasks   = queueTasks.filter(t => t.status === 'processing')
  const pendingTasks  = queueTasks.filter(t => t.status !== 'processing')

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ width: 340, bgcolor: 'background.default' }}>

        {/* ── Header ── */}
        <Box
          sx={{
            px: 2, py: 1.25,
            bgcolor: prefersDark ? 'background.paper' : 'primary.main',
            borderBottom: prefersDark ? '1px solid' : 'none',
            borderColor: 'divider',
            display: 'flex', alignItems: 'center', gap: 1.5,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} color={prefersDark ? 'text.primary' : '#fff'} lineHeight={1.2}>
            💼 Job Tracker
          </Typography>
          <Box flex={1} />
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={refresh} disabled={refreshing} sx={{ color: prefersDark ? 'text.secondary' : 'rgba(255,255,255,0.8)' }}>
              <Refresh sx={{ fontSize: 18, transition: 'transform 0.4s', transform: refreshing ? 'rotate(360deg)' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* ── URL bar ── */}
        <Box
          sx={{
            px: 2, py: 0.75,
            bgcolor: '#f1f3f4',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex', alignItems: 'center', gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary" noWrap title={currentUrl} flex={1}>
            {currentHostname}
          </Typography>
        </Box>

        <Box sx={{ px: 1.5, pt: 1.5, pb: 2 }}>

          {/* ── Add button ── */}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="medium"
            startIcon={
              addState === 'loading'
                ? <CircularProgress size={16} color="inherit" />
                : addState === 'success'
                ? <CheckCircle sx={{ fontSize: 18 }} />
                : <Add />
            }
            onClick={handleAdd}
            disabled={addState === 'loading'}
            sx={{ mb: 0.75 }}
          >
            {addState === 'idle' ? 'Add This Vacancy' : addMsg}
          </Button>

          {addState === 'error' && (
            <Typography variant="caption" color="error" display="block" textAlign="center" mb={0.5}>
              {addMsg}
            </Typography>
          )}

          {/* ── Blocked tabs (captcha) ── */}
          {blockedEntries.length > 0 && (
            <>
              <Divider sx={{ my: 1.25 }} />
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <WarningAmber sx={{ fontSize: 15, color: 'warning.main' }} />
                  <Typography variant="caption" fontWeight={700} color="warning.main" textTransform="uppercase" letterSpacing={0.5}>
                    Needs attention
                  </Typography>
                </Box>
                <Chip label={blockedEntries.length} size="small" color="warning" sx={{ height: 18, fontSize: 10 }} />
              </Box>
              <Stack spacing={0.75} mb={0.5}>
                {blockedEntries.map(([tabId, entry]) => (
                  <BlockedItem key={tabId} tabId={tabId} entry={entry} onAction={handleBlockedAction} />
                ))}
              </Stack>
            </>
          )}

          {/* ── Queue ── */}
          <Divider sx={{ my: 1.25 }} />
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
              Queue
            </Typography>
            <Chip
              label={queueTotal}
              size="small"
              color={queueTotal > 0 ? 'primary' : 'default'}
              variant={queueTotal > 0 ? 'filled' : 'outlined'}
              sx={{ height: 18, fontSize: 10 }}
            />
          </Box>

          {queueTasks.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={1} sx={{ fontStyle: 'italic' }}>
              Queue is empty ✓
            </Typography>
          ) : (
            <Stack spacing={0.5}>
              {activeTasks.map(t  => <QueueItem key={t.task_id} task={t} />)}
              {pendingTasks.map(t => <QueueItem key={t.task_id} task={t} />)}
            </Stack>
          )}

          {refreshing && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
        </Box>
      </Box>
    </ThemeProvider>
  )
}
