import React, { useState } from 'react';

const NAMES = [
  'Человек 1', 'Человек 2', 'Человек 3', 'Человек 4',
  'Человек 5', 'Человек 6', 'Человек 7', 'Человек 8',
];

export default function CreateCompany({ onNext }) {
  const [title, setTitle] = useState('');
  const [count, setCount] = useState(2);
  const [organizer, setOrganizer] = useState(NAMES[0]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedNames = NAMES.slice(0, count);

    // If organizer is not in the selected range, default to first
    const finalOrganizer = selectedNames.includes(organizer)
      ? organizer
      : selectedNames[0];

    const participants = selectedNames.map((name) => ({
      name,
      order: '',
      amount: 0,
    }));

    onNext({
      title: title.trim() || 'Ужин',
      organizerName: finalOrganizer,
      participants,
    });
  };

  const countOptions = [2, 3, 4, 5, 6, 7, 8];
  const availableOrganizers = NAMES.slice(0, count);

  return (
    <form className="create-company" onSubmit={handleSubmit}>
      <h2>🎉 Создание компании</h2>

      <div className="form-group">
        <label>Название компании (опционально)</label>
        <input
          type="text"
          placeholder="Например: Ужин у Паши"
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

      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
        Создать компанию
      </button>
    </form>
  );
}