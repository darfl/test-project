import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

export default function OrderEntry({ companyData, onBack, onSplit, eventId, onUpdateEvent }) {
  const [participants, setParticipants] = useState(() =>
    companyData.participants.map((p) => ({
      ...p,
      contribution: p.contribution || 0,
      items: p.items && p.items.length > 0
        ? p.items.map((it) => ({ name: it.name || '', amount: it.amount || 0 }))
        : [{ name: p.order || '', amount: p.amount || 0 }], // migrate from single order
    }))
  );
  const [sharedItems, setSharedItems] = useState(() =>
    companyData.sharedItems ? companyData.sharedItems.map((s) => ({ ...s })) : []
  );
  const [organizerName, setOrganizerName] = useState(companyData.organizerName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // Computed totals from items
  const personalTotal = useMemo(() => {
    let sum = 0;
    participants.forEach((p) => {
      (p.items || []).forEach((it) => {
        sum += parseFloat(it.amount) || 0;
      });
    });
    return sum;
  }, [participants]);

  const sharedTotal = useMemo(() => {
    return sharedItems.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  }, [sharedItems]);

  const grandTotal = personalTotal + sharedTotal;
  const sharedPerPerson = useMemo(() => {
    return participants.length > 0 ? sharedTotal / participants.length : 0;
  }, [sharedTotal, participants.length]);

  // --- Participant handlers ---
  const handleNameChange = useCallback((index, value) => {
    setParticipants((prev) => {
      const oldName = prev[index].name;
      const next = [...prev];
      next[index] = { ...next[index], name: value };
      if (oldName === organizerName || (!oldName && organizerName === `Человек ${index + 1}`)) {
        setOrganizerName(value || `Человек ${index + 1}`);
      }
      return next;
    });
  }, [organizerName]);

  const handleItemNameChange = useCallback((pIdx, idx, value) => {
    setParticipants((prev) => {
      const next = [...prev];
      const items = [...(next[pIdx].items || [])];
      items[idx] = { ...items[idx], name: value };
      next[pIdx] = { ...next[pIdx], items };
      return next;
    });
  }, []);

  const handleItemAmountChange = useCallback((pIdx, idx, value) => {
    setParticipants((prev) => {
      const next = [...prev];
      const items = [...(next[pIdx].items || [])];
      items[idx] = { ...items[idx], amount: value === '' ? 0 : parseFloat(value) || 0 };
      next[pIdx] = { ...next[pIdx], items };
      return next;
    });
  }, []);

  const handleAddItem = useCallback((pIdx) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[pIdx] = {
        ...next[pIdx],
        items: [...(next[pIdx].items || []), { name: '', amount: 0 }],
      };
      return next;
    });
  }, []);

  const handleRemoveItem = useCallback((pIdx, idx) => {
    setParticipants((prev) => {
      const next = [...prev];
      const items = [...(next[pIdx].items || [])];
      if (items.length <= 1) return prev; // keep at least one
      items.splice(idx, 1);
      next[pIdx] = { ...next[pIdx], items };
      return next;
    });
  }, []);

  const handleAddParticipant = () => {
    if (participants.length >= MAX_PARTICIPANTS) return;
    const newIndex = participants.length + 1;
    setParticipants((prev) => [
      ...prev,
      { name: `Человек ${newIndex}`, items: [{ name: '', amount: 0 }], contribution: 0 },
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

  // --- Shared item handlers ---
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

    const hasAnyAmount =
      participants.some((p) =>
        (p.items || []).some((it) => parseFloat(it.amount) > 0)
      ) || sharedItems.some((s) => parseFloat(s.amount) > 0);

    if (!hasAnyAmount) {
      setError('Должна быть хотя бы одна сумма > 0');
      return;
    }

    const orgExists = participants.some((p) => {
      const pName = (p.name || '').trim();
      const fallback = `Человек ${participants.indexOf(p) + 1}`;
      return organizerName === (pName || fallback);
    });
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
          items: (p.items || []).map((it) => ({
            name: it.name || '',
            amount: parseFloat(it.amount) || 0,
          })),
          contribution: parseFloat(p.contribution) || 0,
        })),
        sharedItems: sharedItems
          .filter((s) => parseFloat(s.amount) > 0)
          .map((s) => ({
            name: s.name || 'Общее',
            amount: parseFloat(s.amount) || 0,
            paidBy: s.paidBy || '',
            sharedWith: s.sharedWith || [],
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
      <h2>💰 Расходы компании {companyData.title}</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label>💵 Кто оплатил</label>
        <select value={organizerName} onChange={(e) => setOrganizerName(e.target.value)}>
          {participants.map((p, i) => (
            <option key={i} value={p.name || `Человек ${i + 1}`}>
              {p.name || `Человек ${i + 1}`}
            </option>
          ))}
        </select>
      </div>

      {/* Personal orders */}
      <h3 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '12px', marginTop: '16px' }}>👤 Личные траты</h3>
      <div className="participants-list">
        {participants.map((p, pIdx) => (
          <div className="participant-block" key={pIdx}>
            <div className="participant-row">
              <input
                className="name-input"
                type="text"
                value={p.name}
                onChange={(e) => handleNameChange(pIdx, e.target.value)}
                onFocus={(e) => {
                  if (e.target.value === `Человек ${pIdx + 1}`) {
                    e.target.select();
                  }
                }}
                placeholder={`Имя ${pIdx + 1}`}
                title="Нажмите, чтобы изменить имя"
              />
              <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(p.items || []).map((it, iIdx) => (
                  <div key={iIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      className="order-input"
                      type="text"
                      value={it.name}
                      onChange={(e) => handleItemNameChange(pIdx, iIdx, e.target.value)}
                      placeholder="Что заказал"
                      style={{ flex: 2 }}
                    />
                    <input
                      className="amount-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={it.amount === 0 ? '' : it.amount}
                      onChange={(e) => handleItemAmountChange(pIdx, iIdx, e.target.value)}
                      placeholder="Сумма"
                    />
                    {(p.items || []).length > 1 && (
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleRemoveItem(pIdx, iIdx)}
                        title="Удалить позицию"
                        style={{ fontSize: '1rem', padding: '2px 8px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-add"
                  onClick={() => handleAddItem(pIdx)}
                  style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                >
                  + добавить позицию
                </button>
              </div>
              <button
                className="btn-delete"
                onClick={() => handleRemoveParticipant(pIdx)}
                disabled={participants.length <= MIN_PARTICIPANTS}
                title="Удалить участника"
              >
                ✕
              </button>
            </div>
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
      <h3 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '12px', marginTop: '24px' }}>🍕 Совместные позиции</h3>
      {sharedItems.length === 0 && (
        <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '10px' }}>
          Пицца, пиво, кальян — всё, что делится на нескольких участников
        </p>
      )}
      <div className="participants-list">
        {sharedItems.map((s, i) => {
          const sharedWith = s.sharedWith || [];
          const allSelected = participants.length > 0 && sharedWith.length === participants.length;
          return (
            <div className="participant-block" key={i}>
              <div className="participant-row">
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
                  className="payee-select"
                  value={s.paidBy || ''}
                  onChange={(e) => {
                    setSharedItems((prev) => {
                      const next = [...prev];
                      next[i] = { ...next[i], paidBy: e.target.value };
                      return next;
                    });
                  }}
                >
                  <option value="">Кто оплатил</option>
                  {participants.map((pp) => (
                    <option key={pp.name} value={pp.name}>{pp.name}</option>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px', paddingLeft: '8px' }}>
                <label
                  style={{
                    color: allSelected ? '#4ade80' : '#888',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    background: allSelected ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${allSelected ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => {
                      setSharedItems((prev) => {
                        const next = [...prev];
                        if (allSelected) {
                          next[i] = { ...next[i], sharedWith: [] };
                        } else {
                          next[i] = { ...next[i], sharedWith: participants.map((pp) => pp.name) };
                        }
                        return next;
                      });
                    }}
                    style={{ accentColor: '#4ade80' }}
                  />
                  Все
                </label>
                {participants.map((pp) => {
                  const isChecked = sharedWith.includes(pp.name);
                  return (
                    <label
                      key={pp.name}
                      style={{
                        color: isChecked ? '#4ade80' : '#888',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: isChecked ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isChecked ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSharedItems((prev) => {
                            const next = [...prev];
                            const current = next[i].sharedWith || [];
                            if (isChecked) {
                              next[i] = { ...next[i], sharedWith: current.filter((n) => n !== pp.name) };
                            } else {
                              next[i] = { ...next[i], sharedWith: [...current, pp.name] };
                            }
                            return next;
                          });
                        }}
                        style={{ accentColor: '#4ade80' }}
                      />
                      {pp.name}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
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