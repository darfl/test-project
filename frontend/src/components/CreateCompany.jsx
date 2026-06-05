import React, { useState, useEffect } from 'react';

const NAMES = [
  'Человек 1', 'Человек 2', 'Человек 3', 'Человек 4',
  'Человек 5', 'Человек 6', 'Человек 7', 'Человек 8',
];

export default function CreateCompany({ onNext, prefill, onBackToOrders }) {
  const [title, setTitle] = useState('');
  const [count, setCount] = useState(2);

  useEffect(() => {
    if (prefill) {
      setTitle(prefill.title || '');
      if (prefill.count >= 2 && prefill.count <= 8) {
        setCount(prefill.count);
      }
    } else {
      setTitle('');
      setCount(2);
    }
  }, [prefill]);

  const isEditing = !!prefill;

  const hasChanges = isEditing
    ? title !== (prefill.title || '') || count !== prefill.count
    : true;

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedNames = NAMES.slice(0, count);
    const finalOrganizer = selectedNames[0];

    const existingParticipants = prefill?.existingParticipants || [];
    const participants = selectedNames.map((name) => {
      const existing = existingParticipants.find((p) => p.name === name);
      return {
        name,
        order: existing ? existing.order : '',
        amount: existing ? existing.amount : 0,
      };
    });

    onNext(
      {
        title: title.trim() || 'Ужин',
        organizerName: finalOrganizer,
        participants,
      },
      prefill?.id || null
    );
  };

  const countOptions = [2, 3, 4, 5, 6, 7, 8];

  return (
    <form className="create-company" onSubmit={handleSubmit}>
      <h2>{isEditing ? '✏️ Редактирование компании' : '🎉 Создание компании'}</h2>

      <div className="form-group">
        <label>Название компании (опционально)</label>
        <input
          type="text"
          placeholder="Например: Ужин у Ильи"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Количество человек</label>
        <select value={count} onChange={(e) => setCount(parseInt(e.target.value, 10))}>
          {countOptions.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="bottom-actions">
        <button type="submit" className="btn btn-primary" disabled={isEditing && !hasChanges}>
          {isEditing ? 'Сохранить изменения и перейти к заказам' : 'Создать компанию'}
        </button>
        {isEditing && onBackToOrders && (
          <button type="button" className="btn btn-secondary" onClick={onBackToOrders}>
            Вернуться к заказам →
          </button>
        )}
      </div>
    </form>
  );
}