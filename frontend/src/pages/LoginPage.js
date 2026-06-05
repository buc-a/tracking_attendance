import React, { useState } from 'react';
import { login } from '../api';

// Simple login form. Calls login() from api.js, then notifies parent via onLogin().
export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      onLogin();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="center-box">
      <h2>Вход</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>Логин</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <label>Пароль</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Войти</button>
      </form>
    </div>
  );
}
