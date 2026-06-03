import React, { useState, useCallback, useEffect } from 'react';
import CreateCompany from './components/CreateCompany';
import OrderEntry from './components/OrderEntry';
import ResultTable from './components/ResultTable';
import { calculateSplit } from './services/api';

const STORAGE_KEY = 'fair-split-events';

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

  // Persist events to localStorage on every change
  useEffect(() => {
    saveEvents(events);
  }, [events]);

  // Find active event
  const activeEvent = events.find((e) => e.id === activeEventId) || null;

  // Update an event in the list
  const updateEvent = useCallback((id, patch) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  // Toggle paid status for a debtor in active event
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

  // Create or update company → go to orders
  const handleCreate = useCallback((data, existingId) => {
    if (existingId) {
      updateEvent(existingId, {
        title: data.title,
        organizerName: data.organizerName,
        participants: data.participants.map((p) => ({ ...p })),
        splitRequest: null,
        result: null,
      });
      setEvents((prev) => {
        const idx = prev.findIndex((e) => e.id === existingId);
        if (idx <= 0) return prev;
        const next = [...prev];
        const [item] = next.splice(idx, 1);
        next.unshift(item);
        return next;
      });
    } else {
      const newEvent = {
        id: generateId(),
        title: data.title,
        organizerName: data.organizerName,
        participants: data.participants.map((p) => ({ ...p })),
        splitRequest: null,
        result: null,
        paidDebtors: [],
      };
      setEvents((prev) => [newEvent, ...prev]);
      setActiveEventId(newEvent.id);
    }
    setError('');
    setScreen(SCREENS.ORDERS);
  }, [updateEvent]);

  // Split → go to results
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

  // Back to orders from results
  const handleBackToOrders = useCallback(() => {
    setScreen(SCREENS.ORDERS);
  }, []);

  // Back to create from orders — keep active event, form pre-filled
  const handleBackToCreate = useCallback(() => {
    setScreen(SCREENS.CREATE);
    setError('');
  }, []);

  // "Создать ещё команду" — go to blank create form
  const handleNewCompany = useCallback(() => {
    setActiveEventId(null);
    setScreen(SCREENS.CREATE);
    setError('');
  }, []);

  // Select event from sidebar → go to orders (or results if already calculated)
  const handleSelectEvent = useCallback((event) => {
    setActiveEventId(event.id);
    setError('');
    if (event.result && event.splitRequest) {
      setScreen(SCREENS.RESULT);
    } else {
      setScreen(SCREENS.ORDERS);
    }
  }, []);

  // Delete event from sidebar
  const handleDeleteEvent = useCallback((id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (activeEventId === id) {
      setActiveEventId(null);
      setScreen(SCREENS.CREATE);
      setError('');
    }
  }, [activeEventId]);

  // Compute if event is fully paid (all debtors checked)
  const isEventFullyPaid = useCallback((event) => {
    if (!event.result || !event.splitRequest) return false;
    const debts = event.result.debts || [];
    const paid = event.paidDebtors || [];
    if (debts.length === 0) return false;
    return debts.every((d) => paid.includes(d.debtor));
  }, []);

  // Prefill data for CreateCompany form
  const prefillData = screen === SCREENS.CREATE && activeEvent
    ? {
        id: activeEvent.id,
        title: activeEvent.title,
        organizerName: activeEvent.organizerName,
        count: activeEvent.participants.length,
      }
    : null;

  const orderCompanyData = activeEvent
    ? {
        title: activeEvent.title,
        organizerName: activeEvent.organizerName,
        participants: activeEvent.participants,
      }
    : null;

  const resultData = activeEvent?.result || null;
  const splitRequest = activeEvent?.splitRequest || null;
  const paidDebtors = activeEvent?.paidDebtors || [];

  const showSidebar = screen === SCREENS.CREATE;

  return (
    <div className={`app-layout ${showSidebar ? '' : 'no-sidebar'}`}>
      {showSidebar && (
        <aside className="sidebar">
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
                      {event.participants.length} чел. — {event.organizerName}
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
        </aside>
      )}

      <main className="main-content">
        <header className="app-header">
          <h1>💸 Сплиттер счетов</h1>
          <p>Для особых событий ™</p>
        </header>

        {error && <div className="error-message">{error}</div>}

        {screen === SCREENS.CREATE && (
          <CreateCompany
            onNext={handleCreate}
            prefill={prefillData}
            onNewCompany={handleNewCompany}
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
            companyData={{ title: activeEvent.title, organizerName: activeEvent.organizerName }}
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