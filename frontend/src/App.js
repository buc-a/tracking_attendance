import React, { useState } from 'react';
import { getToken, logout } from './api';
import LoginPage    from './pages/LoginPage';
import GroupsPage   from './pages/GroupsPage';
import SubjectsPage from './pages/SubjectsPage';
import LessonsPage  from './pages/LessonsPage';
import SchedulePage from './pages/SchedulePage';
import GradesPage   from './pages/GradesPage';

// Pages available after login. Add new pages here.
const PAGES = [
  { key: 'groups',   label: 'Группы',    Component: GroupsPage },
  { key: 'subjects', label: 'Предметы',  Component: SubjectsPage },
  { key: 'lessons',  label: 'Занятия',   Component: LessonsPage },
  { key: 'schedule', label: 'Расписание', Component: SchedulePage },
  { key: 'grades',   label: 'Оценки',    Component: GradesPage },
];

export default function App() {
  // isLoggedIn is derived from localStorage token presence
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());
  const [page, setPage]             = useState('groups');

  function handleLogin() {
    setIsLoggedIn(true);
  }

  function handleLogout() {
    logout();
    setIsLoggedIn(false);
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const current = PAGES.find(p => p.key === page) ?? PAGES[0];
  const { Component } = current;

  return (
    <div className="app">
      <header className="header">
        <span className="header-title">Учёт посещаемости</span>
        <nav>
          {PAGES.map(p => (
            <button
              key={p.key}
              className={page === p.key ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setPage(p.key)}
            >
              {p.label}
            </button>
          ))}
        </nav>
        <button className="logout-btn" onClick={handleLogout}>Выйти</button>
      </header>

      <main className="main">
        <Component />
      </main>
    </div>
  );
}
