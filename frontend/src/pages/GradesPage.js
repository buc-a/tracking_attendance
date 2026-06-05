import React, { useEffect, useState, useCallback } from 'react';
import { getMySubjects, getGroups, getStudents, getLessonsBySubject, getGrades, createGrade, deleteGrade } from '../api';

export default function GradesPage() {
  // ── Reference data ────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [students, setStudents] = useState([]);
  const [lessons,  setLessons]  = useState([]);

  // ── Filter state ──────────────────────────────────────────────────────
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGroup,   setSelectedGroup]   = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedLesson,  setSelectedLesson]  = useState('');
  const [gradeValue,      setGradeValue]      = useState('');

  // ── Grades list ───────────────────────────────────────────────────────
  const [grades, setGrades] = useState([]);

  // ── UI flags ──────────────────────────────────────────────────────────
  const [loadingInit,     setLoadingInit]     = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingLessons,  setLoadingLessons]  = useState(false);
  const [loadingGrades,   setLoadingGrades]   = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');

  // ── Load subjects & groups once ───────────────────────────────────────
  useEffect(() => {
    Promise.all([getMySubjects(), getGroups()])
      .then(([subs, grps]) => {
        setSubjects(subs);
        setGroups(grps);
        if (subs.length > 0) setSelectedSubject(String(subs[0].id));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoadingInit(false));
  }, []);

  // ── Reload students when group filter changes ─────────────────────────
  useEffect(() => {
    setSelectedStudent('');
    setLoadingStudents(true);
    getStudents(selectedGroup || undefined)
      .then(setStudents)
      .catch(err => setError(err.message))
      .finally(() => setLoadingStudents(false));
  }, [selectedGroup]);

  // ── Reload lessons when subject or group changes ──────────────────────
  useEffect(() => {
    if (!selectedSubject) return;
    setSelectedLesson('');
    setLoadingLessons(true);
    getLessonsBySubject(selectedSubject, selectedGroup || undefined)
      .then(setLessons)
      .catch(err => setError(err.message))
      .finally(() => setLoadingLessons(false));
  }, [selectedSubject, selectedGroup]);

  // ── Reload grades when subject changes ────────────────────────────────
  const loadGrades = useCallback(() => {
    if (!selectedSubject) return;
    setLoadingGrades(true);
    setError('');
    getGrades({ subject: selectedSubject })
      .then(setGrades)
      .catch(err => setError(err.message))
      .finally(() => setLoadingGrades(false));
  }, [selectedSubject]);

  useEffect(() => { loadGrades(); }, [loadGrades]);

  // ── Submit new grade ──────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedStudent) { setError('Выберите студента.'); return; }
    if (!selectedLesson)  { setError('Выберите занятие.'); return; }
    const val = parseInt(gradeValue, 10);
    if (isNaN(val) || val < 1 || val > 100) {
      setError('Оценка должна быть числом от 1 до 100.');
      return;
    }

    setSaving(true);
    try {
      await createGrade({
        student: parseInt(selectedStudent, 10),
        subject: parseInt(selectedSubject, 10),
        lesson:  parseInt(selectedLesson,  10),
        value:   val,
      });
      setSuccess('Оценка выставлена.');
      setGradeValue('');
      loadGrades();
    } catch (err) {
      try {
        const parsed = JSON.parse(err.message);
        setError(Object.values(parsed).flat().join(' ') || 'Ошибка при сохранении.');
      } catch {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Delete grade ──────────────────────────────────────────────────────
  async function handleDelete(id) {
    if (!window.confirm('Удалить оценку?')) return;
    setError('');
    try {
      await deleteGrade(id);
      setGrades(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  function studentLabel(s) {
    const full = `${s.first_name} ${s.last_name}`.trim();
    const name = full || s.username;
    return s.group_name ? `${name} (${s.group_name})` : name;
  }

  // Grades filtered by selected student (client-side)
  const visibleGrades = selectedStudent
    ? grades.filter(g => String(g.student) === selectedStudent)
    : grades;

  // ── Render ────────────────────────────────────────────────────────────
  if (loadingInit) return <p>Загрузка…</p>;

  if (subjects.length === 0) {
    return (
      <div>
        <h2>Оценки</h2>
        <p className="no-data">У вас нет предметов. Обратитесь к администратору.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Оценки</h2>

      {/* ── Form ── */}
      <div className="grades-card">
        <h3>Выставить оценку</h3>
        <form className="grades-form" onSubmit={handleSubmit}>

          <label>
            Предмет
            <select
              value={selectedSubject}
              onChange={e => { setSelectedSubject(e.target.value); setSuccess(''); }}
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          <label>
            Группа (фильтр студентов и занятий)
            <select
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
            >
              <option value="">Все группы</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </label>

          <label>
            Занятие
            <select
              value={selectedLesson}
              onChange={e => setSelectedLesson(e.target.value)}
              required
              disabled={loadingLessons}
            >
              <option value="">
                {loadingLessons ? 'Загрузка…' : lessons.length === 0 ? 'Нет занятий' : '— выберите занятие —'}
              </option>
              {lessons.map(l => (
                <option key={l.id} value={l.id}>{l.date} — пара №{l.lesson_number}</option>
              ))}
            </select>
          </label>

          <label>
            Студент
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              required
              disabled={loadingStudents}
            >
              <option value="">
                {loadingStudents ? 'Загрузка…' : '— выберите студента —'}
              </option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{studentLabel(s)}</option>
              ))}
            </select>
          </label>

          <label>
            Оценка (1–100)
            <input
              type="number"
              min="1"
              max="100"
              value={gradeValue}
              onChange={e => setGradeValue(e.target.value)}
              placeholder="например, 85"
              required
            />
          </label>

          <button type="submit" className="search-btn" disabled={saving}>
            {saving ? 'Сохранение…' : 'Выставить'}
          </button>
        </form>

        {error   && <p className="error"   style={{ marginTop: 8 }}>{error}</p>}
        {success && <p className="success" style={{ marginTop: 8 }}>{success}</p>}
      </div>

      {/* ── Grades table ── */}
      <div style={{ marginTop: 24 }}>
        <div className="grades-table-header">
          <h3 style={{ margin: 0 }}>
            Оценки по предмету «{subjects.find(s => String(s.id) === selectedSubject)?.name ?? '…'}»
          </h3>
          <select
            value={selectedStudent}
            onChange={e => setSelectedStudent(e.target.value)}
            className="student-filter"
          >
            <option value="">Все студенты</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{studentLabel(s)}</option>
            ))}
          </select>
        </div>

        {loadingGrades ? (
          <p>Загрузка оценок…</p>
        ) : visibleGrades.length === 0 ? (
          <p className="no-data">Оценок пока нет.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Студент</th>
                <th>Оценка</th>
                <th>Дата</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleGrades.map((g, i) => (
                <tr key={g.id}>
                  <td>{i + 1}</td>
                  <td>{g.student_full_name || g.student_username}</td>
                  <td>
                    <span className={`grade-badge ${gradeColor(g.value)}`}>
                      {g.value}
                    </span>
                  </td>
                  <td>{g.date_received}</td>
                  <td>
                    <button
                      className="del-btn"
                      onClick={() => handleDelete(g.id)}
                      title="Удалить оценку"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function gradeColor(value) {
  if (value >= 90) return 'grade-excellent';
  if (value >= 75) return 'grade-good';
  if (value >= 60) return 'grade-satisfactory';
  return 'grade-poor';
}
