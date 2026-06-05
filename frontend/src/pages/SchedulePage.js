import React, { useState } from 'react';
import { getSchedule, getGroups, getSubjects } from '../api';

// Returns today's date as YYYY-MM-DD
function today() {
  return new Date().toISOString().slice(0, 10);
}

// Returns date N days from now as YYYY-MM-DD
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const RECURRENCE_LABELS = {
  once:     'Разово',
  weekly:   'Еженедельно',
  biweekly: 'Раз в 2 недели',
};

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function SchedulePage() {
  const [dateFrom, setDateFrom]   = useState(today());
  const [dateTo,   setDateTo]     = useState(daysFromNow(30));
  const [groupId,  setGroupId]    = useState('');
  const [subjectId, setSubjectId] = useState('');

  const [groups,   setGroups]   = useState(null);
  const [subjects, setSubjects] = useState(null);

  const [schedule, setSchedule] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Lazy-load filter options on first render
  React.useEffect(() => {
    getGroups().then(setGroups).catch(() => setGroups([]));
    getSubjects().then(setSubjects).catch(() => setSubjects([]));
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    setError('');
    setSchedule(null);
    setLoading(true);
    try {
      const filters = {};
      if (groupId)   filters.group   = groupId;
      if (subjectId) filters.subject = subjectId;
      const data = await getSchedule(dateFrom, dateTo, filters);
      setSchedule(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Group schedule items by date for a cleaner view
  const byDate = React.useMemo(() => {
    if (!schedule) return [];
    const map = new Map();
    for (const item of schedule) {
      if (!map.has(item.date)) map.set(item.date, []);
      map.get(item.date).push(item);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [schedule]);

  return (
    <div>
      <h2>Расписание</h2>

      {/* ── Filter form ── */}
      <form className="schedule-filters" onSubmit={handleSearch}>
        <div className="filter-row">
          <label>
            С
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              required
            />
          </label>

          <label>
            По
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              required
            />
          </label>

          <label>
            Группа
            <select value={groupId} onChange={e => setGroupId(e.target.value)}>
              <option value="">Все</option>
              {(groups ?? []).map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </label>

          <label>
            Предмет
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">Все</option>
              {(subjects ?? []).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? 'Загрузка…' : 'Показать'}
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {/* ── Results ── */}
      {schedule !== null && (
        byDate.length === 0 ? (
          <p className="no-data">Занятий в выбранном периоде не найдено.</p>
        ) : (
          <div className="schedule-list">
            {byDate.map(([date, items]) => (
              <div key={date} className="schedule-day">
                <div className="schedule-day-header">
                  {formatDate(date)}
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Пара №</th>
                      <th>Предмет</th>
                      <th>Преподаватель</th>
                      <th>Группа</th>
                      <th>Периодичность</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td>{item.lesson_number}</td>
                        <td>{item.subject_name}</td>
                        <td>{item.teacher_username}</td>
                        <td>{item.group_name}</td>
                        <td>
                          <span className={`badge badge-${item.recurrence}`}>
                            {RECURRENCE_LABELS[item.recurrence] ?? item.recurrence}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

/** "2026-09-07" → "Пн, 7 сентября 2026" */
function formatDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00'); // force local midnight
  const weekday = WEEKDAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];
  return `${weekday}, ${d.toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })}`;
}
