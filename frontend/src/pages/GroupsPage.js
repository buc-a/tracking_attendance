import React, { useEffect, useState } from 'react';
import { getGroups } from '../api';

// Shows list of groups fetched from GET /api/v1/groups/
export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [error, setError]   = useState('');

  useEffect(() => {
    getGroups()
      .then(setGroups)
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h2>Группы</h2>
      {groups.length === 0 ? (
        <p>Нет данных</p>
      ) : (
        <table>
          <thead>
            <tr><th>#</th><th>Название</th></tr>
          </thead>
          <tbody>
            {groups.map((g, i) => (
              <tr key={g.id ?? i}>
                <td>{g.id ?? i + 1}</td>
                <td>{g.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
