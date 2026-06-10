import React, { useState, useCallback, useEffect } from 'react';
import CreateCompany from './components/CreateCompany';
import OrderEntry from './components/OrderEntry';
import ResultTable from './components/ResultTable';
import { calculateSplit } from './services/api';

const STORAGE_KEY = 'fair-split-events';

function getUniqueDraftTitle(events) {
  const base = 'Новое событие';
  const used = new Set(events.map((e) => e.title));
  if (!used.has(base)) return base;
  for (let i = 1; ; i++) {
    const candidate = `${base} (${i})`;
    if (!used.has(candidate)) return candidate;
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

function saveEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (_) {}
}

const SCREENS = {
  CREATE: 'CREATE',
  ORDERS: 'ORDERS',
  RESULT: 'RESULT',
};

export default function App() {
  const [events, setEvents] = useState(loadEvents);
  const [activeEventId, setActiveEventId] = useState(null);
  const [screen, setScreen] = useState(SCREENS.CREATE);
  const [error, setError] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [draftEventId, setDraftEventId] = useState(null);

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  const activeEvent = events.find((e) => e.id === activeEventId) || null;

  const updateEvent = useCallback((id, patch) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const handleTogglePaid = useCallback((name) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== activeEventId) return e;
        const paid = e.paidDebtors || [];
        const newPaid = paid.includes(name)
          ? paid.filter((n) => n !== name)
          : [...paid, name];
        return { ...e, paidDebtors: newPaid };
      })
    );
  }, [activeEventId]);

  const handleCreate = useCallback((data, existingId) => {
    setEvents((prev) => {
      if (existingId) {
        const oldEvent = prev.find((e) => e.id === existingId);
        const merged = data.participants.map((p) => {
          const old = (oldEvent && oldEvent.participants)
            ? oldEvent.participants.find((op) => op.name === p.name)
            : null;
          return old ? { ...old, name: p.name } : p;
        });
        const oldChecks = oldEvent ? (oldEvent.checks || []) : [];
        const idx = prev.findIndex((e) => e.id === existingId);
        const next = prev.map((e) =>
          e.id === existingId
            ? { ...e, title: data.title, participants: merged, checks: oldChecks, splitRequest: null, result: null }
            : e
        );
        if (idx > 0) {
          const [item] = next.splice(idx, 1);
          next.unshift(item);
        }
        return next;
      } else {
        const uniqueTitle = data.title === 'Новое событие' ? getUniqueDraftTitle(prev) : data.title;
        const newId = generateId();
        const newEvent = {
          id: newId,
          title: uniqueTitle,
          participants: data.participants.map((p) => ({ ...p })),
          checks: [],
          splitRequest: null,
          result: null,
          paidDebtors: [],
        };
        // Установить активным новое событие после рендера
        setTimeout(() => setActiveEventId(newId), 0);
        return [newEvent, ...prev];
      }
    });
    setDraftEventId(null);
    setError('');
    setScreen(SCREENS.ORDERS);
  }, []);

  useEffect(() => {
    if (screen === SCREENS.ORDERS && !activeEventId && events.length > 0) {
      setActiveEventId(events[0].id);
      setDraftEventId(null);
    }
  }, [screen, events, activeEventId]);

  const handleSplit = useCallback(async (requestData) => {
    setError('');
    try {
      const res = await calculateSplit(requestData);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === activeEventId
            ? { ...e, splitRequest: requestData, result: res, paidDebtors: e.paidDebtors || [] }
            : e
        )
      );
      setScreen(SCREENS.RESULT);
    } catch (err) {
      setError(err.message || 'Ошибка сервера');
    }
  }, [activeEventId]);

  const handleBackToOrders = useCallback(() => {
    setScreen(SCREENS.ORDERS);
  }, []);

  const handleBackToCreate = useCallback(() => {
    setScreen(SCREENS.CREATE);
    setError('');
  }, []);

  const handleBackToOrdersFromCreate = useCallback(() => {
    setScreen(SCREENS.ORDERS);
    setError('');
  }, []);

  const handleNewCompany = useCallback(() => {
    const draftId = generateId();
    setEvents((prev) => {
      const draft = {
        id: draftId,
        title: getUniqueDraftTitle(prev),
        participants: [{ name: 'Участник 1' }, { name: 'Участник 2' }],
        checks: [],
        splitRequest: null,
        result: null,
        paidDebtors: [],
      };
      return [draft, ...prev];
    });
    setActiveEventId(draftId);
    setDraftEventId(draftId);
    setScreen(SCREENS.CREATE);
    setError('');
  }, []);

  const handleTitleChange = useCallback((title) => {
    const targetId = draftEventId || activeEventId;
    if (!targetId) return;
    updateEvent(targetId, { title: title || 'Новое событие' });
  }, [activeEventId, draftEventId, updateEvent]);

  const handleSelectEvent = useCallback((event) => {
      if (draftEventId === event.id) {
        // Clicking on the draft — stay on creation screen
        setActiveEventId(event.id);
        setScreen(SCREENS.CREATE);
      } else {
        setActiveEventId(event.id);
        setDraftEventId(null);
        setError('');
        if (event.result && event.splitRequest) {
          setScreen(SCREENS.RESULT);
        } else {
          setScreen(SCREENS.ORDERS);
        }
      }
  }, []);

  const handleDeleteEvent = useCallback((id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (activeEventId === id) {
      setActiveEventId(null);
      setScreen(SCREENS.CREATE);
      setError('');
    }
    if (draftEventId === id) {
      setDraftEventId(null);
    }
  }, [activeEventId, draftEventId]);

  const isEventFullyPaid = useCallback((event) => {
    if (!event.result || !event.splitRequest) return false;
    const debts = event.result.debts || [];
    const paid = event.paidDebtors || [];
    if (debts.length === 0) return false;
    return debts.every((d) => paid.includes(d.debtor));
  }, []);

  const isNewDraft = !!(draftEventId && screen === SCREENS.CREATE);
  const prefillData = screen === SCREENS.CREATE && activeEvent && !isNewDraft
    ? {
        id: activeEvent.id,
        title: activeEvent.title,
        participants: activeEvent.participants,
      }
    : null;

  const orderCompanyData = activeEvent
    ? {
        title: activeEvent.title,
        participants: activeEvent.participants,
        checks: activeEvent.checks || [],
      }
    : null;

  const resultData = activeEvent?.result || null;
  const splitRequest = activeEvent?.splitRequest || null;
  const paidDebtors = activeEvent?.paidDebtors || [];

  return (
    <div className="app-layout">
      <aside className="sidebar" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
          <div className="sidebar-header">
            <h3>📋 События</h3>
            <button className="btn btn-add btn-new-event" onClick={handleNewCompany}>
              + Создать новое событие
            </button>
          </div>
          {events.length === 0 && (
            <p className="sidebar-empty">Пока нет событий</p>
          )}
          <ul className="sidebar-list">
            {events.map((event) => {
              const fullyPaid = isEventFullyPaid(event);
              return (
                <li
                  key={event.id}
                  className={`sidebar-item ${event.id === activeEventId ? 'active' : ''}`}
                >
                  <button
                    className="sidebar-item-btn"
                    onClick={() => handleSelectEvent(event)}
                    title={`Открыть "${event.title}"`}
                  >
                    <span className="sidebar-item-title">
                      {event.title}
                      {fullyPaid && (
                        <span style={{ marginLeft: '8px', color: '#4ade80', fontSize: '0.85rem' }}>✅</span>
                      )}
                    </span>
                  <span className="sidebar-item-meta">
                    {event.participants.length} чел.
                  </span>
                  </button>
                  <button
                    className="sidebar-item-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event.id);
                    }}
                    title="Удалить событие"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        <div
          className="sidebar-resize-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = sidebarWidth;
            const onMouseMove = (ev) => {
              const delta = ev.clientX - startX;
              const newWidth = Math.min(500, Math.max(240, startWidth + delta));
              setSidebarWidth(newWidth);
            };
            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove);
              document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          }}
        >
          <span className="resize-handle-icon">⟷</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="app-header">
          <h1>💸 Сплиттер счетов</h1>
          <p>Для особых событий ™</p>
        </header>

        {error && <div className="error-message">{error}</div>}

        <nav className="breadcrumbs">
          <span
            className={`breadcrumb-item ${screen === SCREENS.CREATE ? 'active' : ''}`}
            onClick={() => { setError(''); setScreen(SCREENS.CREATE); }}
          >
            Компания
          </span>
          <span className="breadcrumb-sep">›</span>
          <span
            className={`breadcrumb-item ${screen === SCREENS.ORDERS ? 'active' : ''}`}
            onClick={() => {
              if (activeEventId) { setError(''); setScreen(SCREENS.ORDERS); }
            }}
            style={!activeEventId ? { opacity: 0.4, cursor: 'default' } : {}}
          >
            Расходы
          </span>
          <span className="breadcrumb-sep">›</span>
          <span
            className={`breadcrumb-item ${screen === SCREENS.RESULT ? 'active' : ''}`}
            onClick={() => {
              if (activeEventId && activeEvent?.result) { setError(''); setScreen(SCREENS.RESULT); }
            }}
            style={!activeEvent?.result ? { opacity: 0.4, cursor: 'default' } : {}}
          >
            Результаты
          </span>
        </nav>

        {screen === SCREENS.CREATE && (
          <CreateCompany
            onNext={handleCreate}
            prefill={prefillData}
            onTitleChange={handleTitleChange}
            onNewCompany={handleNewCompany}
            onBackToOrders={handleBackToOrdersFromCreate}
            events={events}
            activeEventId={activeEventId}
          />
        )}

        {screen === SCREENS.ORDERS && orderCompanyData && (
          <OrderEntry
            companyData={orderCompanyData}
            onBack={handleBackToCreate}
            onSplit={handleSplit}
            eventId={activeEventId}
            onUpdateEvent={updateEvent}
          />
        )}

        {screen === SCREENS.RESULT && resultData && splitRequest && activeEvent && (
          <ResultTable
            result={resultData}
            companyData={{ title: activeEvent.title, organizerName: '' }}
            participants={splitRequest.participants}
            paidDebtors={paidDebtors}
            onTogglePaid={handleTogglePaid}
            onBack={handleBackToOrders}
          />
        )}
      </main>
    </div>
  );
}