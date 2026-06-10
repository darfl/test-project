import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

export default function OrderEntry({ companyData, onBack, onSplit, eventId, onUpdateEvent }) {
  const [checks, setChecks] = useState(() => {
    if (companyData.checks && companyData.checks.length > 0) {
      return companyData.checks.map((c) => ({
        name: c.name || '',
        items: c.items ? c.items.map((it) => ({ ...it })) : [],
        paidBy: c.paidBy || companyData.participants[0]?.name || '',
      }));
    }
    return [
      {
        name: 'Чек 1',
        items: [{ name: '', amount: 0, sharedWith: [], paidBy: companyData.participants[0]?.name || '' }],
      },
    ];
  });

  const participants = companyData.participants || [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingCheck, setEditingCheck] = useState(null);
  const [editCheckName, setEditCheckName] = useState('');
  const [confirmDeleteCheck, setConfirmDeleteCheck] = useState(null);
  const editInputRef = useRef(null);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (onUpdateEvent && eventId) {
      onUpdateEvent(eventId, { checks: checks.map((c) => ({ ...c, items: (c.items || []).map((it) => ({ ...it })) })) });
    }
  }, [checks, onUpdateEvent, eventId]);

  const grandTotal = useMemo(() => {
    let sum = 0;
    checks.forEach((c) => (c.items || []).forEach((it) => (sum += parseFloat(it.amount) || 0)));
    return sum;
  }, [checks]);

  // --- Check handlers ---
  const handleCheckNameChange = useCallback((cIdx, value) => {
    setChecks((prev) => { const next = [...prev]; next[cIdx] = { ...next[cIdx], name: value }; return next; });
  }, []);

  const handleItemPayerChange = useCallback((cIdx, iIdx, value) => {
    setChecks((prev) => {
      const next = [...prev];
      const items = [...(next[cIdx].items || [])];
      items[iIdx] = { ...items[iIdx], paidBy: value };
      next[cIdx] = { ...next[cIdx], items };
      return next;
    });
  }, []);

  const handleAddCheck = () => {
    setChecks((prev) => [...prev, { name: `Чек ${prev.length + 1}`, items: [{ name: '', amount: 0, sharedWith: [] }], paidBy: participants[0]?.name || '' }]);
  };

  const handleRemoveCheck = (cIdx) => {
    if (checks.length <= 1) return;
    setConfirmDeleteCheck(cIdx);
  };

  const confirmRemoveCheck = () => {
    if (confirmDeleteCheck === null) return;
    setChecks((prev) => { const next = [...prev]; next.splice(confirmDeleteCheck, 1); return next; });
    setConfirmDeleteCheck(null);
  };

  // --- Item handlers within a check ---
  const handleItemNameChange = useCallback((cIdx, iIdx, value) => {
    setChecks((prev) => {
      const next = [...prev];
      const items = [...(next[cIdx].items || [])];
      items[iIdx] = { ...items[iIdx], name: value };
      next[cIdx] = { ...next[cIdx], items };
      return next;
    });
  }, []);

  const handleItemAmountChange = useCallback((cIdx, iIdx, value) => {
    setChecks((prev) => {
      const next = [...prev];
      const items = [...(next[cIdx].items || [])];
      const num = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
      items[iIdx] = { ...items[iIdx], amount: num };
      next[cIdx] = { ...next[cIdx], items };
      return next;
    });
  }, []);

  const handleAddItem = useCallback((cIdx) => {
    setChecks((prev) => {
      const next = [...prev];
      next[cIdx] = { ...next[cIdx], items: [...(next[cIdx].items || []), { name: '', amount: 0, sharedWith: [] }] };
      return next;
    });
  }, []);

  const handleRemoveItem = useCallback((cIdx, iIdx) => {
    setChecks((prev) => {
      const next = [...prev];
      const items = [...(next[cIdx].items || [])];
      if (items.length <= 1) return prev;
      items.splice(iIdx, 1);
      next[cIdx] = { ...next[cIdx], items };
      return next;
    });
  }, []);

  const handleSplit = async () => {
    setError('');
    const hasAny = checks.some((c) => (c.items || []).some((it) => parseFloat(it.amount) > 0));
    if (!hasAny) { setError('Должна быть хотя бы одна сумма > 0'); return; }
    setLoading(true);
    try {
      const sharedItems = [];
      checks.forEach((c) => {
        (c.items || []).filter((it) => parseFloat(it.amount) > 0).forEach((it) => {
          sharedItems.push({
            name: it.name || 'Позиция',
            amount: parseFloat(it.amount) || 0,
            paidBy: it.paidBy || participants[0]?.name || '',
            sharedWith: it.sharedWith || [],
          });
        });
      });
      const requestData = {
        organizerName: sharedItems.length > 0 ? sharedItems[0].paidBy : '',
        participants: participants.map((p) => ({ name: p.name || '', items: [], contribution: 0 })),
        sharedItems,
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
      <h2>💰 Расходы компании «{companyData.title}»</h2>
      {error && <div className="error-message">{error}</div>}

      {checks.map((c, cIdx) => (
        <div key={cIdx} className="check-block">
          <div className="check-title-row">
            {editingCheck !== null && editingCheck === cIdx ? (
              <>
                <input
                  ref={editInputRef}
                  className="check-name-input"
                  type="text"
                  value={editCheckName}
                  onChange={(e) => setEditCheckName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCheckNameChange(cIdx, editCheckName);
                      setEditingCheck(null);
                    } else if (e.key === 'Escape') {
                      setEditingCheck(null);
                    }
                  }}
                />
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 10px', minWidth: 'auto' }}
                  onClick={() => setEditingCheck(null)}
                  title="Отменить редактирование"
                >
                  ✕
                </button>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  onClick={() => { handleCheckNameChange(cIdx, editCheckName); setEditingCheck(null); }}
                >
                  ✓
                </button>
              </>
            ) : (
              <div className="check-name-group">
                <span className="check-name-text">{c.name}</span>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '3px 7px', minWidth: 'auto', lineHeight: 1 }}
                  onClick={() => {
                  setEditingCheck(cIdx);
                  setEditCheckName(c.name);
                  setTimeout(() => editInputRef.current && editInputRef.current.focus(), 0);
                }}
                  title="Редактировать название"
                >
                  ✎
                </button>
              </div>
            )}
            {checks.length > 1 && editingCheck !== cIdx && (
              <button className="btn btn-secondary btn-remove-check" style={{ fontSize: '0.8rem', padding: '3px 7px', minWidth: 'auto', lineHeight: 1 }} onClick={() => handleRemoveCheck(cIdx)} title="Удалить чек">✕</button>
            )}
          </div>

          {(c.items || []).map((it, iIdx) => {
            const sharedWith = it.sharedWith || [];
            const allSelected = participants.length > 0 && sharedWith.length === participants.length;
            return (
              <div key={iIdx}>
                <div className="position-row">
                  <input
                    className="order-input"
                    type="text"
                    value={it.name}
                    onChange={(e) => handleItemNameChange(cIdx, iIdx, e.target.value)}
                    placeholder="Позиция"
                  />
                  <input
                    className="amount-input"
                    type="number"
                    min="0"
                    onKeyDown={(e) => { if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault(); }}
                    value={it.amount === 0 ? '' : it.amount}
                    onChange={(e) => handleItemAmountChange(cIdx, iIdx, e.target.value)}
                    placeholder="Сумма"
                  />
                  <select
                    className="payee-select"
                    value={it.paidBy || ''}
                    onChange={(e) => handleItemPayerChange(cIdx, iIdx, e.target.value)}
                    style={{ width: '150px' }}
                  >
                    <option value="">Кто оплатил</option>
                    {participants.map((pp) => (
                      <option key={pp.name} value={pp.name}>{pp.name}</option>
                    ))}
                  </select>
                  {(c.items || []).length > 1 && (
                    <button className="btn-delete" onClick={() => handleRemoveItem(cIdx, iIdx)} title="Удалить позицию">✕</button>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px', paddingLeft: '4px', marginBottom: '8px' }}>
                  <label style={{ color: allSelected ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 10px', borderRadius: '8px', background: allSelected ? 'var(--accent-light)' : 'rgba(0,0,0,0.03)', }}>
                    <input type="checkbox" checked={allSelected} onChange={() => { setChecks((prev) => { const next = [...prev]; const items = [...(next[cIdx].items || [])]; if (allSelected) { items[iIdx] = { ...items[iIdx], sharedWith: [] }; } else { items[iIdx] = { ...items[iIdx], sharedWith: participants.map((pp) => pp.name) }; } next[cIdx] = { ...next[cIdx], items }; return next; }); }} style={{ accentColor: 'var(--accent)', width: '12px', height: '12px' }} />
                    Все
                  </label>
                  {participants.map((pp) => { const isChecked = sharedWith.includes(pp.name); return (
                    <label key={pp.name} style={{ color: isChecked ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 10px', borderRadius: '8px', background: isChecked ? 'var(--accent-light)' : 'rgba(0,0,0,0.03)', }}>
                      <input type="checkbox" checked={isChecked} onChange={() => { setChecks((prev) => { const next = [...prev]; const items = [...(next[cIdx].items || [])]; const cur = items[iIdx].sharedWith || []; if (isChecked) { items[iIdx] = { ...items[iIdx], sharedWith: cur.filter((n) => n !== pp.name) }; } else { items[iIdx] = { ...items[iIdx], sharedWith: [...cur, pp.name] }; } next[cIdx] = { ...next[cIdx], items }; return next; }); }} style={{ accentColor: 'var(--accent)', width: '12px', height: '12px' }} />
                      {pp.name}
                    </label>
                  ); })}
                </div>
              </div>
            );
          })}

          <button className="btn btn-add" onClick={() => handleAddItem(cIdx)}>+ добавить позицию</button>
        </div>
      ))}

      <button className="btn btn-add" onClick={handleAddCheck}>
        + Добавить чек
      </button>

      {confirmDeleteCheck !== null && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteCheck(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p style={{ marginBottom: '20px', fontSize: '1rem', color: 'var(--text-primary)' }}>Удалить чек?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteCheck(null)}
                style={{ fontSize: '0.85rem', padding: '8px 18px' }}
              >
                Отмена
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmRemoveCheck}
                style={{ fontSize: '0.85rem', padding: '8px 18px', background: 'var(--danger)' }}
              >
                🗑️ Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="stats-bar">
        <div className="stat">Итого: <span>{grandTotal.toFixed(2)} ₽</span></div>
      </div>

      <div className="bottom-actions">
        <button className="btn btn-secondary" onClick={onBack}>← Назад</button>
        <button className="btn btn-primary" onClick={handleSplit} disabled={loading}>{loading ? 'Считаем...' : 'Разделить'}</button>
      </div>
    </div>
  );
}