import React, { useMemo } from 'react';

export default function ResultTable({ result, companyData, participants, paidDebtors, onTogglePaid, onBack }) {
  const { total, debts } = result;
  const title = companyData.title;

  const paidSet = useMemo(() => new Set(paidDebtors || []), [paidDebtors]);

  const togglePaid = (name) => {
    if (onTogglePaid) onTogglePaid(name);
  };

  const handleCopyReminder = async () => {
    const lines = (debts || []).map((d) =>
      `Привет! ${title}. Ты должен(на) ${d.amount.toFixed(2)} ₽ — ${d.creditor}. Спасибо!`
    );
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
      <h2>📊 Результаты расходов для компании «{title}»</h2>

      <div className="summary-block">
        <h3>💰 Итого</h3>
        <p style={{ marginBottom: '10px', fontSize: '1.05rem' }}>
          Общий расход: <strong style={{ color: '#4ade80' }}>{total.toFixed(2)} ₽</strong>
        </p>
        {(!debts || debts.length === 0) ? (
          <p style={{ color: '#4ade80' }}>✅ Все рассчитались, долгов нет!</p>
        ) : (
          <ul>
            {debts.map((debt, i) => {
              const isPaid = paidSet.has(debt.debtor);
              return (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
                  <span style={isPaid ? { textDecoration: 'line-through', opacity: 0.45 } : {}}>
                    {debt.debtor} переводит {debt.creditor} — {debt.amount.toFixed(2)} ₽
                  </span>
                  <label className="paid-checkbox" style={{ fontSize: '0.8rem' }}>
                    <input
                      type="checkbox"
                      checked={isPaid}
                      onChange={() => togglePaid(debt.debtor)}
                    />
                    Оплачено
                  </label>
                </li>
              );
            })}
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