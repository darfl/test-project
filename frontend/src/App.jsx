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

  // Create or update company → go to orders (preserve existing orders)
  const handleCreate = useCallback((data, existingId) => {
    setEvents((prev) => {
      if (existingId) {
        const oldEvent = prev.find((e) => e.id === existingId);
        const oldParticipants = oldEvent ? oldEvent.participants : [];
        const merged = data.participants.map((p) => {
          const old = oldParticipants.find((op) => op.name === p.name);
          return old ? { ...old, name: p.name } : p;
        });
        const oldShared = oldEvent ? (oldEvent.sharedItems || []) : [];
        const idx = prev.findIndex((e) => e.id === existingId);
        const next = prev.map((e) =>
          e.id === existingId
            ? { ...e, title: data.title, organizerName: data.organizerName, participants: merged, sharedItems: oldShared, splitRequest: null, result: null }
            : e
        );
        if (idx > 0) {
          const [item] = next.splice(idx, 1);
          next.unshift(item);
        }
        return next;
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
        return [newEvent, ...prev];
      }
    });
    if (!existingId) {
      // For new event, set activeEventId to the first (newest) event
      setActiveEventId((prevEvents) => {
        // We need to read the id that was just generated
        // Use a callback approach — but we can't access the new id here easily.
        // Instead, after setEvents, we infer it.
        return null; // will be set by the effect below
      });
    }
    setError('');
    setScreen(SCREENS.ORDERS);
  }, []);

  // After handleCreate for new events, set activeEventId
  useEffect(() => {
    if (screen === SCREENS.ORDERS && !activeEventId && events.length > 0) {
      setActiveEventId(events[0].id);
    }
  }, [screen, events, activeEventId]);

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

  // Back to orders from create screen (skip save)
  const handleBackToOrdersFromCreate = useCallback(() => {
    setScreen(SCREENS.ORDERS);
    setError('');
  }, []);

  // "Создать новое событие" — go to blank create form
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
        existingParticipants: activeEvent.participants,
      }
    : null;

  const orderCompanyData = activeEvent
    ? {
        title: activeEvent.title,
        organizerName: activeEvent.organizerName,
        participants: activeEvent.participants,
        sharedItems: activeEvent.sharedItems || [],
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