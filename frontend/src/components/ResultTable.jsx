import React, { useMemo } from 'react';

export default function ResultTable({ result, companyData, participants, paidDebtors, onTogglePaid, onBack }) {
  const { total, debts } = result;
  const organizerName = companyData.organizerName;
  const title = companyData.title;

  const paidSet = useMemo(() => new Set(paidDebtors || []), [paidDebtors]);

  // Group debts per participant
  const perPersonDebts = useMemo(() => {
    const map = {};
    if (!participants) return map;
    participants.forEach((p) => {
      const name = p.name?.trim() || '';
      if (name) {
        map[name] = {
          name,
          order: p.order || '—',
          amount: parseFloat(p.amount) || 0,
          owes: [],   // debts where this person is debtor
          owedBy: [], // debts where this person is creditor
        };
      }
    });
    (debts || []).forEach((d) => {
      if (map[d.debtor]) {
        map[d.debtor].owes.push({ to: d.creditor, amount: d.amount });
      }
      if (map[d.creditor]) {
        map[d.creditor].owedBy.push({ from: d.debtor, amount: d.amount });
      }
    });
    return map;
  }, [participants, debts]);

  const tableRows = useMemo(() => {
    return Object.values(perPersonDebts);
  }, [perPersonDebts]);

  const togglePaid = (name) => {
    if (onTogglePaid) onTogglePaid(name);
  };

  const handleCopyReminder = async () => {
    const lines = [];
    tableRows.forEach((row) => {
      row.owes.forEach((d) => {
        lines.push(
          `Привет! ${title}. Ты должен(на) ${d.amount.toFixed(2)} ₽ — ${d.to}. Спасибо!`
        );
      });
    });

    const text = lines.join('\n') || 'Нет долгов!';
    try {
      await navigator.clipboard.writeText(text);
      alert('Напоминалка скопирована в буфер! 📋');
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Напоминалка скопирована в буфер! 📋');
    }
  };

  return (
    <div className="result-container">
      <h2>📊 Результат — {title}</h2>

      <div className="split-table-wrapper">
        <table className="split-table">
          <thead>
            <tr>
              <th>Участник</th>
              <th>Сумма</th>
              <th>Должен / получает</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => {
              const isPaid = paidSet.has(row.name);

              // Build display for debts
              const oweLines = row.owes.map((d) => `${d.to} ${d.amount.toFixed(2)} ₽`);
              const owedLines = row.owedBy.map((d) => `${d.from} → ${d.amount.toFixed(2)} ₽`);

              let debtDisplay;
              if (oweLines.length > 0 && owedLines.length === 0) {
                debtDisplay = 'Должен: ' + oweLines.join(', ');
              } else if (owedLines.length > 0 && oweLines.length === 0) {
                debtDisplay = 'Получает: ' + owedLines.join(', ');
              } else if (oweLines.length > 0 && owedLines.length > 0) {
                debtDisplay = (
                  <>
                    Должен: {oweLines.join(', ')}<br />
                    Получает: {owedLines.join(', ')}
                  </>
                );
              } else {
                debtDisplay = '—';
              }

              return (
                <tr key={row.name} className={isPaid ? 'paid' : ''}>
                  <td data-label="Участник">{row.name}</td>
                  <td data-label="Сумма">{row.amount.toFixed(2)} ₽</td>
                  <td data-label="Должен / получает">{debtDisplay}</td>
                  <td data-label="">
                    {row.owes.length > 0 && (
                      <label className="paid-checkbox">
                        <input
                          type="checkbox"
                          checked={isPaid}
                          onChange={() => togglePaid(row.name)}
                        />
                        Оплачено
                      </label>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary block */}
      <div className="summary-block">
        <h3>💰 Итого</h3>
        <p style={{ marginBottom: '10px', fontSize: '1.05rem' }}>
          Общий счёт: <strong style={{ color: '#4ade80' }}>{total.toFixed(2)} ₽</strong>
        </p>
        {debts.length === 0 ? (
          <p style={{ color: '#4ade80' }}>✅ Все рассчитались, долгов нет!</p>
        ) : (
          <ul>
            {debts.map((debt, i) => (
              <li key={i}>
                {debt.debtor} переводит {debt.creditor} — {debt.amount.toFixed(2)} ₽
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="action-buttons">
        <button className="btn btn-copy" onClick={handleCopyReminder}>
          📋 Скопировать напоминалку
        </button>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Вернуться к заказам
        </button>
      </div>
    </div>
  );
}