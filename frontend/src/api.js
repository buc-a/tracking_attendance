// Base URL — backend runs on port 8000, proxy set in package.json
const BASE = '/api/v1';

// --- Auth helpers ---

export function getToken() {
  return localStorage.getItem('access');
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// POST /api/v1/jwt/create/  → { access, refresh }
export async function login(username, password) {
  const res = await fetch(`${BASE}/jwt/create/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Неверный логин или пароль');
  const data = await res.json();
  localStorage.setItem('access', data.access);
  localStorage.setItem('refresh', data.refresh);
  return data;
}

export function logout() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
}

// --- Generic GET ---

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Ошибка ${res.status}`);
  return res.json();
}

// --- API calls ---

export const getGroups   = () => get('/groups/');
export const getSubjects = () => get('/subjects/');
export const getLessons  = () => get('/lessons/');

// GET /api/v1/lessons/?subject=<id>&group=<id>
export function getLessonsBySubject(subjectId, groupId) {
  const params = new URLSearchParams();
  if (subjectId) params.append('subject', subjectId);
  if (groupId)   params.append('group',   groupId);
  return get(`/lessons/?${params.toString()}`);
}

// GET /api/v1/my-subjects/ — предметы текущего преподавателя
export const getMySubjects = () => get('/my-subjects/');

// GET /api/v1/students/?group=<id> — студенты (опционально фильтр по группе)
export function getStudents(groupId) {
  const qs = groupId ? `?group=${groupId}` : '';
  return get(`/students/${qs}`);
}

// GET /api/v1/grades/?subject=<id>&student=<id>
export function getGrades(filters = {}) {
  const params = new URLSearchParams();
  if (filters.subject) params.append('subject', filters.subject);
  if (filters.student) params.append('student', filters.student);
  const qs = params.toString();
  return get(`/grades/${qs ? '?' + qs : ''}`);
}

// POST /api/v1/grades/
export async function createGrade(payload) {
  const res = await fetch(`${BASE}/grades/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

// DELETE /api/v1/grades/<id>/
export async function deleteGrade(id) {
  const res = await fetch(`${BASE}/grades/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Ошибка ${res.status}`);
}

/**
 * GET /api/v1/lessons/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD[&group=N][&subject=N]
 * Returns Lesson objects in the given date range, optionally filtered by group/subject.
 * @param {string} dateFrom  — ISO date string, e.g. "2026-09-01"
 * @param {string} dateTo    — ISO date string, e.g. "2026-09-30"
 * @param {object} filters   — optional { group, subject }
 */
export function getSchedule(dateFrom, dateTo, filters = {}) {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
  if (filters.group)   params.append('group',   filters.group);
  if (filters.subject) params.append('subject', filters.subject);
  return get(`/lessons/?${params.toString()}`);
}
