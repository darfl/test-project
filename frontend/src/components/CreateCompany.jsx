import React, { useState, useEffect, useRef } from 'react';

export default function CreateCompany({ onNext, prefill, draftId, onTitleChange, onBackToOrders }) {
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState([
    { name: '' },
    { name: '' },
  ]);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editParticipantName, setEditParticipantName] = useState('');
  const [confirmDeleteParticipant, setConfirmDeleteParticipant] = useState(null);
  const editInputRef = useRef(null);

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
    setConfirmDeleteParticipant(index);
  };

  const confirmRemoveParticipant = () => {
    if (confirmDeleteParticipant === null) return;
    setParticipants((prev) => {
      const next = [...prev];
      next.splice(confirmDeleteParticipant, 1);
      return next;
    });
    setConfirmDeleteParticipant(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const names = participants.map((p) => p.name?.trim() || `Участник ${participants.indexOf(p) + 1}`);

    onNext(
      {
        title: title.trim() || 'Новое событие',
        participants: names.map((name) => ({ name, items: [], contribution: 0 })),
      },
      prefill?.id || draftId || null
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
          onChange={(e) => {
            setTitle(e.target.value);
            if (onTitleChange) onTitleChange(e.target.value);
          }}
        />
      </div>

      <div className="form-group">
        <label>Участники</label>
        <div className="participants-list">
          {participants.map((p, i) => {
            const displayName = p.name || `Участник ${i + 1}`;
            const isEditingThis = editingParticipant === i;
            return (
              <div className="participant-row" key={i}>
                {isEditing ? (
                  // Editing mode: span + pencil
                  isEditingThis ? (
                    <>
                      <input
                        ref={editInputRef}
                        className="name-input"
                        type="text"
                        value={editParticipantName}
                        onChange={(e) => setEditParticipantName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') {
                            handleNameChange(i, editParticipantName || `Участник ${i + 1}`);
                            setEditingParticipant(null);
                          }
                        }}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '4px 8px', minWidth: 'auto' }}
                        onClick={() => setEditingParticipant(null)}
                        title="Отменить редактирование"
                      >
                        ✕
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ fontSize: '0.78rem', padding: '4px 10px', minWidth: 'auto' }}
                        disabled={editParticipantName === p.name}
                        onClick={() => {
                          handleNameChange(i, editParticipantName || `Участник ${i + 1}`);
                          setEditingParticipant(null);
                        }}
                      >
                        ✓
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`participant-name-text ${!p.name ? 'placeholder' : ''}`}>
                        {displayName}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-edit-participant"
                        style={{ fontSize: '0.78rem', padding: '3px 7px', minWidth: 'auto', lineHeight: 1 }}
                        onClick={() => {
                          setEditingParticipant(i);
                          setEditParticipantName(p.name);
                          setTimeout(() => editInputRef.current && editInputRef.current.focus(), 0);
                        }}
                        title="Редактировать имя"
                      >
                        ✎
                      </button>
                    </>
                  )
                ) : (
                  // Create mode: simple text input
                  <input
                    className="participant-input"
                    type="text"
                    value={p.name}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                    placeholder={`Участник ${i + 1}`}
                  />
                )}
                {participants.length > 2 && editingParticipant !== i && (
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
            );
          })}
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

      {confirmDeleteParticipant !== null && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteParticipant(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p style={{ marginBottom: '20px', fontSize: '1rem', color: 'var(--text-primary)' }}>Удалить участника?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteParticipant(null)}
                style={{ fontSize: '0.85rem', padding: '8px 18px' }}
              >
                Отмена
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmRemoveParticipant}
                style={{ fontSize: '0.85rem', padding: '8px 18px', background: 'var(--danger)' }}
              >
                🗑️ Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bottom-actions">
        {!isEditing && (
          <button type="submit" className="btn btn-primary">
            Создать компанию
          </button>
        )}
        {isEditing && onBackToOrders && (
          <button type="button" className="btn btn-secondary" onClick={onBackToOrders}>
            Вернуться к расходам →
          </button>
        )}
      </div>
    </form>
  );
}