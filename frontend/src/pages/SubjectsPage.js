import React, { useEffect, useState } from 'react';
import { getSubjects } from '../api';

// Shows list of subjects fetched from GET /api/v1/subjects/
export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [error, setError]       = useState('');

  useEffect(() => {
    getSubjects()
      .then(setSubjects)
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h2>Предметы</h2>
      {subjects.length === 0 ? (
        <p>Нет данных</p>
      ) : (
        <table>
          <thead>
            <tr><th>#</th><th>Название</th></tr>
          </thead>
          <tbody>
            {subjects.map((s, i) => (
              <tr key={s.id ?? i}>
                <td>{s.id ?? i + 1}</td>
                <td>{s.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
