import React, { useState, useEffect } from 'react';

export default function CreateCompany({ onNext, prefill, onBackToOrders }) {
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState([
    { name: '' },
    { name: '' },
  ]);

  useEffect(() => {
    if (prefill) {
      setTitle(prefill.title || '');
      if (prefill.participants && prefill.participants.length >= 2) {
        setParticipants(prefill.participants.map((p) => ({ name: p.name || '' })));
      }
    } else {
      setTitle('');
      setParticipants([{ name: '' }, { name: '' }]);
    }
  }, [prefill]);

  const MAX_PARTICIPANTS = 8;

  const isEditing = !!prefill;

  const hasChanges = isEditing
    ? title !== (prefill.title || '') ||
      participants.length !== (prefill.participants ? prefill.participants.length : 2) ||
      participants.some((p, i) => p.name !== (prefill.participants?.[i]?.name || ''))
    : true;

  const handleNameChange = (index, value) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = { name: value };
      return next;
    });
  };

  const handleAddParticipant = () => {
    if (participants.length >= MAX_PARTICIPANTS) return;
    setParticipants((prev) => [...prev, { name: '' }]);
  };

  const handleRemoveParticipant = (index) => {
    if (participants.length <= 2) return;
    setParticipants((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const names = participants.map((p) => p.name?.trim() || `Участник ${participants.indexOf(p) + 1}`);

    onNext(
      {
        title: title.trim() || 'Ужин',
        participants: names.map((name) => ({ name, items: [], contribution: 0 })),
      },
      prefill?.id || null
    );
  };

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
        <label>Участники</label>
        <div className="participants-list">
          {participants.map((p, i) => (
            <div className="participant-row" key={i}>
              <input
                className="name-input"
                type="text"
                value={p.name}
                onChange={(e) => handleNameChange(i, e.target.value)}
                placeholder={`Участник ${i + 1}`}
              />
              {participants.length > 2 && (
                <button
                  type="button"
                  className="btn-delete"
                  onClick={() => handleRemoveParticipant(i)}
                  title="Удалить участника"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-add"
          onClick={handleAddParticipant}
          disabled={participants.length >= MAX_PARTICIPANTS}
          style={{ marginTop: '10px' }}
        >
          + Добавить участника
          {participants.length >= MAX_PARTICIPANTS ? ' (макс 8)' : ''}
        </button>
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