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
        items: [{ name: '', amount: 0, sharedWith: [] }],
        paidBy: companyData.participants[0]?.name || '',
      },
    ];
  });

  const participants = companyData.participants || [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleCheckPayerChange = useCallback((cIdx, value) => {
    setChecks((prev) => { const next = [...prev]; next[cIdx] = { ...next[cIdx], paidBy: value }; return next; });
  }, []);

  const handleAddCheck = () => {
    setChecks((prev) => [...prev, { name: `Чек ${prev.length + 1}`, items: [{ name: '', amount: 0, sharedWith: [] }], paidBy: participants[0]?.name || '' }]);
  };

  const handleRemoveCheck = (cIdx) => {
    if (checks.length <= 1) return;
    setChecks((prev) => { const next = [...prev]; next.splice(cIdx, 1); return next; });
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
            paidBy: c.paidBy || participants[0]?.name || '',
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
        <div key={cIdx} className="check-block" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
            <input
              className="name-input"
              type="text"
              value={c.name}
              onChange={(e) => handleCheckNameChange(cIdx, e.target.value)}
              placeholder="Название чека"
              style={{ flex: 2 }}
            />
            <select
              className="payee-select"
              value={c.paidBy || ''}
              onChange={(e) => handleCheckPayerChange(cIdx, e.target.value)}
            >
              <option value="">Кто оплатил</option>
              {participants.map((pp) => (
                <option key={pp.name} value={pp.name}>{pp.name}</option>
              ))}
            </select>
            {checks.length > 1 && (
              <button className="btn-delete" onClick={() => handleRemoveCheck(cIdx)} title="Удалить чек">✕</button>
            )}
          </div>

          <div className="participants-list">
            {(c.items || []).map((it, iIdx) => {
              const sharedWith = it.sharedWith || [];
              const allSelected = participants.length > 0 && sharedWith.length === participants.length;
              return (
                <div className="participant-block" key={iIdx}>
                  <div className="participant-row">
                    <input className="order-input" type="text" value={it.name} onChange={(e) => handleItemNameChange(cIdx, iIdx, e.target.value)} placeholder="Что заказал" style={{ flex: 2 }} />
                    <input className="amount-input" type="number" min="0" onKeyDown={(e) => { if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault(); }} value={it.amount === 0 ? '' : it.amount} onChange={(e) => handleItemAmountChange(cIdx, iIdx, e.target.value)} placeholder="Сумма" />
                    {(c.items || []).length > 1 && (
                      <button className="btn-delete" onClick={() => handleRemoveItem(cIdx, iIdx)} title="Удалить позицию" style={{ fontSize: '1rem', padding: '2px 8px' }}>✕</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px', paddingLeft: '4px' }}>
                    <label style={{ color: allSelected ? '#4ade80' : '#555', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '4px', background: allSelected ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${allSelected ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.05)'}` }}>
                      <input type="checkbox" checked={allSelected} onChange={() => { setChecks((prev) => { const next = [...prev]; const items = [...(next[cIdx].items || [])]; if (allSelected) { items[iIdx] = { ...items[iIdx], sharedWith: [] }; } else { items[iIdx] = { ...items[iIdx], sharedWith: participants.map((pp) => pp.name) }; } next[cIdx] = { ...next[cIdx], items }; return next; }); }} style={{ accentColor: '#4ade80', width: '12px', height: '12px' }} />
                      Все
                    </label>
                    {participants.map((pp) => { const isChecked = sharedWith.includes(pp.name); return (
                      <label key={pp.name} style={{ color: isChecked ? '#4ade80' : '#555', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '4px', background: isChecked ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isChecked ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.05)'}` }}>
                        <input type="checkbox" checked={isChecked} onChange={() => { setChecks((prev) => { const next = [...prev]; const items = [...(next[cIdx].items || [])]; const cur = items[iIdx].sharedWith || []; if (isChecked) { items[iIdx] = { ...items[iIdx], sharedWith: cur.filter((n) => n !== pp.name) }; } else { items[iIdx] = { ...items[iIdx], sharedWith: [...cur, pp.name] }; } next[cIdx] = { ...next[cIdx], items }; return next; }); }} style={{ accentColor: '#4ade80', width: '12px', height: '12px' }} />
                        {pp.name}
                      </label>
                    ); })}
                  </div>
                </div>
              );
            })}
          </div>

          <button className="btn btn-add" onClick={() => handleAddItem(cIdx)} style={{ fontSize: '0.78rem', padding: '5px 10px' }}>+ добавить позицию</button>
        </div>
      ))}

      <button className="btn btn-add" onClick={handleAddCheck} style={{ marginTop: '8px' }}>
        + Добавить чек
      </button>

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