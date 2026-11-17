/* Хранилище на localStorage: пользователи, прогресс, тесты, работы.
   Учебная версия без сервера: пароли хранятся в виде простого кодирования, а не стойкого хэша. */
const Store = {
  KEY: 'is_tools_v1',
  d: null,
  hash: s => btoa(unescape(encodeURIComponent('is$' + s))),

  init() {
    try { this.d = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { this.d = null; }
    if (!this.d) this.d = { users: [], subs: [], tests: {}, steps: {}, custom: {}, session: null };
    if (!this.d.users.some(u => u.role === 'teacher')) {
      this.d.users.push({ id: 't1', name: 'Преподаватель', email: 'teacher@iis.edu', pass: this.hash('teacher123'), role: 'teacher', group: '—' });
    }
    this.save();
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); return true; } catch (e) { return false; } },

  /* аккаунты */
  me() { return this.d.users.find(u => u.id === this.d.session) || null; },
  register(name, email, pass, group) {
    email = email.trim().toLowerCase();
    if (this.d.users.some(u => u.email === email)) return 'Пользователь с таким email уже зарегистрирован.';
    const u = { id: 'u' + Date.now(), name: name.trim(), email, pass: this.hash(pass), role: 'student', group: group.trim() };
    this.d.users.push(u); this.d.session = u.id; this.save(); return '';
  },
  login(email, pass) {
    const u = this.d.users.find(x => x.email === email.trim().toLowerCase() && x.pass === this.hash(pass));
    if (!u) return 'Неверный email или пароль.';
    this.d.session = u.id; this.save(); return '';
  },
  logout() { this.d.session = null; this.save(); },
  students() { return this.d.users.filter(u => u.role === 'student'); },
  user(id) { return this.d.users.find(u => u.id === id); },

  /* лабораторные с правками преподавателя */
  lab(n) { const b = LABS[n - 1]; return b ? { ...b, ...(this.d.custom[n] || {}) } : null; },
  setCustom(n, obj) { this.d.custom[n] = obj; this.save(); },
  resetCustom(n) { delete this.d.custom[n]; this.save(); },

  /* отметки шагов и заданий */
  marks(uid, n) { return this.d.steps[uid + ':' + n] || { s: [], t: [] }; },
  mark(uid, n, kind, i, on) {
    const m = this.marks(uid, n), a = m[kind];
    const p = a.indexOf(i);
    if (on && p < 0) a.push(i); if (!on && p >= 0) a.splice(p, 1);
    this.d.steps[uid + ':' + n] = m; this.save();
  },

  /* тесты */
  test(uid, n) { const v = this.d.tests[uid + ':' + n]; return v === undefined ? null : v; },
  setTest(uid, n, v) { const k = uid + ':' + n; this.d.tests[k] = Math.max(v, this.d.tests[k] || 0); this.save(); },

  /* работы */
  sub(uid, n) { return this.d.subs.find(s => s.uid === uid && s.lab === n) || null; },
  submit(uid, n, file, note) {
    this.d.subs = this.d.subs.filter(s => !(s.uid === uid && s.lab === n));
    const s = { uid, lab: n, name: file.name, size: file.size, data: file.data || '', note, date: new Date().toISOString(), status: 'sent', score: 0, comment: '' };
    this.d.subs.push(s);
    if (!this.save()) { s.data = ''; this.save(); return false; }
    return true;
  },
  grade(uid, n, score, comment) {
    const s = this.sub(uid, n); if (!s) return;
    s.score = Math.max(0, Math.min(MAX_WORK, +score || 0)); s.comment = comment; s.status = 'checked'; this.save();
  },

  /* баллы и оценки */
  done(uid, n) { return (this.test(uid, n) || 0) >= PASS && !!this.sub(uid, n); },
  pts(uid, n) { const s = this.sub(uid, n); return (this.test(uid, n) || 0) + (s && s.status === 'checked' ? s.score : 0); },
  stat(uid) {
    let done = 0, pts = 0, mx = 0, checked = 0;
    LABS.forEach(l => {
      if (this.done(uid, l.n)) done++;
      pts += this.pts(uid, l.n);
      if (this.test(uid, l.n) !== null) mx += MAX_TEST;
      const s = this.sub(uid, l.n); if (s && s.status === 'checked') { mx += MAX_WORK; checked++; }
    });
    const rate = mx ? Math.round(pts / mx * 100) : 0;
    return { done, pts, mx, checked, rate, grade: mx ? Store.mark5(rate) : '—', pct: Math.round(done / LABS.length * 100) };
  },
  mark5(p) { return p >= 90 ? 5 : p >= 75 ? 4 : p >= 60 ? 3 : 2; },
  eligible(uid) { const s = this.stat(uid); return s.done === LABS.length && s.checked === LABS.length; }
};
