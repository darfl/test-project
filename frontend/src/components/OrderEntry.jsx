import React, { useState, useMemo, useCallback } from 'react';

export default function OrderEntry({ companyData, onBack, onSplit }) {
  const [participants, setParticipants] = useState(() =>
    companyData.participants.map((p) => ({ ...p }))
  );
  const [organizerName, setOrganizerName] = useState(companyData.organizerName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const MAX_PARTICIPANTS = 8;
  const MIN_PARTICIPANTS = 2;

  const total = useMemo(() => {
    return participants.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }, [participants]);

  const perPerson = useMemo(() => {
    return participants.length > 0 ? total / participants.length : 0;
  }, [total, participants.length]);

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

  const handleAddParticipant = () => {
    if (participants.length >= MAX_PARTICIPANTS) return;
    const newIndex = participants.length + 1;
    setParticipants((prev) => [
      ...prev,
      { name: `Человек ${newIndex}`, order: '', amount: 0 },
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

  const handleSplit = async () => {
    // Validation
    setError('');

    const filled = participants.filter((p) => p.amount > 0);
    if (filled.length === 0) {
      setError('Хотя бы один участник должен иметь сумму > 0');
      return;
    }

    // Ensure organizer exists in participants
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

      <div className="stats-bar">
        <div className="stat">
          Общая сумма: <span>{total.toFixed(2)} ₽</span>
        </div>
        <div className="stat">
          Поровну: <span>{perPerson.toFixed(2)} ₽</span> с человека
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