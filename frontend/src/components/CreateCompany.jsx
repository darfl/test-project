import React, { useState, useEffect } from 'react';

const NAMES = [
  'Человек 1', 'Человек 2', 'Человек 3', 'Человек 4',
  'Человек 5', 'Человек 6', 'Человек 7', 'Человек 8',
];

export default function CreateCompany({ onNext, prefill, onBackToOrders }) {
  const [title, setTitle] = useState('');
  const [count, setCount] = useState(2);
  const [organizer, setOrganizer] = useState(NAMES[0]);

  // Pre-fill from existing event when going back, or reset for new event
  useEffect(() => {
    if (prefill) {
      setTitle(prefill.title || '');
      if (prefill.count >= 2 && prefill.count <= 8) {
        setCount(prefill.count);
      }
      if (prefill.organizerName) {
        setOrganizer(prefill.organizerName);
      }
    } else {
      setTitle('');
      setCount(2);
      setOrganizer(NAMES[0]);
    }
  }, [prefill]);

  const isEditing = !!prefill;

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedNames = NAMES.slice(0, count);

    const finalOrganizer = selectedNames.includes(organizer)
      ? organizer
      : selectedNames[0];

    // Build participants: preserve existing orders/amounts when editing
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
  const availableOrganizers = NAMES.slice(0, count);

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
        <select value={count} onChange={(e) => {
          const newCount = parseInt(e.target.value, 10);
          setCount(newCount);
          const newOrganizers = NAMES.slice(0, newCount);
          if (!newOrganizers.includes(organizer)) {
            setOrganizer(newOrganizers[0]);
          }
        }}>
          {countOptions.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Организатор</label>
        <select value={organizer} onChange={(e) => setOrganizer(e.target.value)}>
          {availableOrganizers.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className="bottom-actions">
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Сохранить изменения и перейти к заказам' : 'Создать компанию'}
        </button>
        {isEditing && onBackToOrders && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onBackToOrders}
          >
            Вернуться к заказам →
          </button>
        )}
      </div>
    </form>
  );
}