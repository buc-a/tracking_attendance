import React, { useEffect, useState } from 'react';
import { getLessons } from '../api';

// Shows list of lessons fetched from GET /api/v1/lessons/
export default function LessonsPage() {
  const [lessons, setLessons] = useState([]);
  const [error, setError]     = useState('');

  useEffect(() => {
    getLessons()
      .then(setLessons)
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h2>Занятия</h2>
      {lessons.length === 0 ? (
        <p>Нет данных</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Дата</th>
              <th>Тема</th>
              <th>Пара №</th>
              <th>Предмет</th>
              <th>Группа</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l, i) => (
              <tr key={l.id ?? i}>
                <td>{l.id ?? i + 1}</td>
                <td>{l.date}</td>
                <td>{l.topic}</td>
                <td>{l.lesson_number}</td>
                <td>{l.subject}</td>
                <td>{l.group}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
