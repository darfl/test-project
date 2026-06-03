import React, { useMemo } from 'react';

export default function ResultTable({ result, companyData, participants, paidDebtors, onTogglePaid, onBack }) {
  const { total, debts } = result;
  const organizerName = companyData.organizerName;
  const title = companyData.title;

  const paidSet = useMemo(() => new Set(paidDebtors || []), [paidDebtors]);

  const tableData = useMemo(() => {
    return participants.map((p) => {
      const debt = debts.find((d) => d.debtor === p.name);
      const creditorName = debt ? debt.creditor : '—';
      const oweAmount = debt ? debt.amount : 0;

      return {
        name: p.name,
        order: p.order || '—',
        amount: parseFloat(p.amount) || 0,
        creditorName,
        oweAmount,
      };
    });
  }, [participants, debts]);

  const handleCopyReminder = async () => {
    const lines = [];
    for (const row of tableData) {
      if (row.oweAmount > 0) {
        lines.push(
          `Привет! Ужин в компании ${title}. Ты должен(на) ${row.oweAmount.toFixed(2)} ₽ организатору ${organizerName}. Спасибо!`
        );
      }
    }

    const text = lines.join('\n');
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
              <th>Заказал</th>
              <th>Сумма</th>
              <th>Кому должен</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => {
              const isPaid = paidSet.has(row.name);
              const isOrganizer = row.name === organizerName;

              return (
                <tr key={row.name} className={isPaid ? 'paid' : ''}>
                  <td data-label="Участник">{row.name}</td>
                  <td data-label="Заказал">{row.order}</td>
                  <td data-label="Сумма">{row.amount.toFixed(2)} ₽</td>
                  <td data-label="Кому должен">
                    {isOrganizer ? '—' : `${row.creditorName} (${row.oweAmount.toFixed(2)} ₽)`}
                  </td>
                  <td data-label="">
                    {!isOrganizer && (
                      <label className="paid-checkbox">
                        <input
                          type="checkbox"
                          checked={isPaid}
                          onChange={() => onTogglePaid(row.name)}
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
          Организатор <strong style={{ color: '#4ade80' }}>{organizerName}</strong> платит{' '}
          <strong style={{ color: '#4ade80' }}>{total.toFixed(2)} ₽</strong>
        </p>
        <ul>
          {debts.map((debt) => (
            <li key={debt.debtor}>
              {debt.debtor} переводит {debt.creditor} {debt.amount.toFixed(2)} ₽
            </li>
          ))}
        </ul>
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