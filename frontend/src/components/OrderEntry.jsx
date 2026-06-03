import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

export default function OrderEntry({ companyData, onBack, onSplit, eventId, onUpdateEvent }) {
  const [participants, setParticipants] = useState(() =>
    companyData.participants.map((p) => ({ ...p, contribution: p.contribution || 0 }))
  );
  const [sharedItems, setSharedItems] = useState(() =>
    companyData.sharedItems ? companyData.sharedItems.map((s) => ({ ...s })) : []
  );
  const [organizerName, setOrganizerName] = useState(companyData.organizerName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync data back to parent event whenever it changes
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (onUpdateEvent && eventId) {
      onUpdateEvent(eventId, {
        participants: participants.map((p) => ({ ...p })),
        sharedItems: sharedItems.map((s) => ({ ...s })),
        organizerName,
      });
    }
  }, [participants, sharedItems, organizerName, onUpdateEvent, eventId]);

  const MAX_PARTICIPANTS = 8;
  const MIN_PARTICIPANTS = 2;

  const personalTotal = useMemo(() => {
    return participants.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }, [participants]);

  const sharedTotal = useMemo(() => {
    return sharedItems.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  }, [sharedItems]);

  const grandTotal = personalTotal + sharedTotal;

  const perPerson = useMemo(() => {
    return participants.length > 0 ? grandTotal / participants.length : 0;
  }, [grandTotal, participants.length]);

  const sharedPerPerson = useMemo(() => {
    return participants.length > 0 ? sharedTotal / participants.length : 0;
  }, [sharedTotal, participants.length]);

  const handleNameChange = useCallback((index, value) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: value };
      return next;
    });
  }, []);

  const handleOrderChange = useCallback((index, value) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], order: value };
      return next;
    });
  }, []);

  const handleAmountChange = useCallback((index, value) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], amount: value === '' ? 0 : parseFloat(value) || 0 };
      return next;
    });
  }, []);

  const handleContributionChange = useCallback((index, value) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], contribution: value === '' ? 0 : parseFloat(value) || 0 };
      return next;
    });
  }, []);

  const handleSharedItemNameChange = useCallback((index, value) => {
    setSharedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: value };
      return next;
    });
  }, []);

  const handleSharedItemAmountChange = useCallback((index, value) => {
    setSharedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], amount: value === '' ? 0 : parseFloat(value) || 0 };
      return next;
    });
  }, []);

  const handleAddParticipant = () => {
    if (participants.length >= MAX_PARTICIPANTS) return;
    const newIndex = participants.length + 1;
    setParticipants((prev) => [
      ...prev,
      { name: `Человек ${newIndex}`, order: '', amount: 0, contribution: 0 },
    ]);
  };

  const handleRemoveParticipant = (index) => {
    if (participants.length <= MIN_PARTICIPANTS) return;
    setParticipants((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleAddSharedItem = () => {
    setSharedItems((prev) => [...prev, { name: '', amount: 0, paidBy: '' }]);
  };

  const handleRemoveSharedItem = (index) => {
    setSharedItems((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleSplit = async () => {
    setError('');

    const hasAnyAmount = participants.some((p) => parseFloat(p.amount) > 0) || sharedItems.some((s) => parseFloat(s.amount) > 0);
    if (!hasAnyAmount) {
      setError('Должна быть хотя бы одна сумма > 0');
      return;
    }

    const orgExists = participants.some((p) => p.name === organizerName);
    if (!orgExists) {
      setError('Организатор должен быть среди участников');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        organizerName,
        participants: participants.map((p) => ({
          name: p.name.trim() || `Человек ${participants.indexOf(p) + 1}`,
          order: p.order,
          amount: parseFloat(p.amount) || 0,
          contribution: parseFloat(p.contribution) || 0,
        })),
        sharedItems: sharedItems
          .filter((s) => parseFloat(s.amount) > 0)
          .map((s) => ({
            name: s.name || 'Общее',
            amount: parseFloat(s.amount) || 0,
            paidBy: s.paidBy || '',
          })),
      };

      onSplit(requestData);
    } catch (err) {
      setError(err.message || 'Ошибка при расчёте');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-entry">
      <h2>🍽️ Заказы — {companyData.title}</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label>Организатор (кто платит картой)</label>
        <select value={organizerName} onChange={(e) => setOrganizerName(e.target.value)}>
          {participants.map((p, i) => (
            <option key={i} value={p.name || `Человек ${i + 1}`}>
              {p.name || `Человек ${i + 1}`}
            </option>
          ))}
        </select>
      </div>

      {/* Personal orders */}
      <h3 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '12px', marginTop: '16px' }}>👤 Личные заказы</h3>
      <div className="participants-list">
        {participants.map((p, i) => (
          <div className="participant-row" key={i}>
            <input
              className="name-input"
              type="text"
              value={p.name}
              onChange={(e) => handleNameChange(i, e.target.value)}
              placeholder={`Имя ${i + 1}`}
              title="Нажмите, чтобы изменить имя"
            />
            <input
              className="order-input"
              type="text"
              value={p.order}
              onChange={(e) => handleOrderChange(i, e.target.value)}
              placeholder="Что заказал"
            />
            <input
              className="amount-input"
              type="number"
              min="0"
              step="0.01"
              value={p.amount === 0 ? '' : p.amount}
              onChange={(e) => handleAmountChange(i, e.target.value)}
              placeholder="Сумма"
            />
            <input
              className="amount-input"
              type="number"
              min="0"
              step="0.01"
              value={p.contribution === 0 ? '' : p.contribution}
              onChange={(e) => handleContributionChange(i, e.target.value)}
              placeholder="Взнос"
              title="Сколько уже заплатил"
              style={{ maxWidth: '90px' }}
            />
            <button
              className="btn-delete"
              onClick={() => handleRemoveParticipant(i)}
              disabled={participants.length <= MIN_PARTICIPANTS}
              title="Удалить участника"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        className="btn btn-add"
        onClick={handleAddParticipant}
        disabled={participants.length >= MAX_PARTICIPANTS}
      >
        + Добавить человека
        {participants.length >= MAX_PARTICIPANTS ? ' (макс 8)' : ''}
      </button>

      {/* Shared items */}
      <h3 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '12px', marginTop: '24px' }}>🍕 Общие позиции (на всех)</h3>
      {sharedItems.length === 0 && (
        <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '10px' }}>
          Пицца, пиво, кальян — всё, что делится на всех
        </p>
      )}
      <div className="participants-list">
        {sharedItems.map((s, i) => (
          <div className="participant-row" key={i}>
            <input
              className="order-input"
              type="text"
              value={s.name}
              onChange={(e) => handleSharedItemNameChange(i, e.target.value)}
              placeholder="Название"
              style={{ flex: 2 }}
            />
            <input
              className="amount-input"
              type="number"
              min="0"
              step="0.01"
              value={s.amount === 0 ? '' : s.amount}
              onChange={(e) => handleSharedItemAmountChange(i, e.target.value)}
              placeholder="Сумма"
            />
            <select
              className="form-group"
              value={s.paidBy || ''}
              onChange={(e) => {
                setSharedItems((prev) => {
                  const next = [...prev];
                  next[i] = { ...next[i], paidBy: e.target.value };
                  return next;
                });
              }}
              style={{
                maxWidth: '130px',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: '0.9rem',
              }}
            >
              <option value="">Кто заплатил</option>
              {participants.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
            <button
              className="btn-delete"
              onClick={() => handleRemoveSharedItem(i)}
              title="Удалить позицию"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button className="btn btn-add" onClick={handleAddSharedItem}>
        + Добавить общую позицию
      </button>

      {sharedItems.length > 0 && (
        <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '8px' }}>
          Каждый платит по {sharedPerPerson.toFixed(2)} ₽ за общие позиции
        </div>
      )}

      <div className="stats-bar">
        <div className="stat">
          Личные: <span>{personalTotal.toFixed(2)} ₽</span>
        </div>
        <div className="stat">
          Общие: <span>{sharedTotal.toFixed(2)} ₽</span>
        </div>
        <div className="stat">
          Итого: <span>{grandTotal.toFixed(2)} ₽</span>
        </div>
        <div className="stat">
          С человека: <span>{perPerson.toFixed(2)} ₽</span>
        </div>
      </div>

      <div className="bottom-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Назад
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSplit}
          disabled={loading}
        >
          {loading ? 'Считаем...' : 'Разделить'}
        </button>
      </div>
    </div>
  );
}