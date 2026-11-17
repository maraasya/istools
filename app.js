/* IS Tools — интерфейс и маршрутизация (hash-router) */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmtDate = iso => new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
const view = html => { $('#view').innerHTML = html; };

function toast(m) {
  const t = $('#toast'); t.textContent = m; t.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2800);
}

function splat(svg, n) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = 600 + Math.random() * 400, y = Math.random() * 600, r = Math.pow(Math.random(), 3) * 8 + 1;
    s += `<circle cx="${x | 0}" cy="${y | 0}" r="${r.toFixed(1)}"/>`;
  }
  svg.innerHTML = s;
}

/* ---------- навигация ---------- */
function renderNav(p) {
  const u = Store.me();
  const items = [['', 'Главная'], ['labs', 'Лабораторные работы']];
  if (u && u.role === 'student') items.push(['cabinet', 'Личный кабинет'], ['certificate', 'Сертификат']);
  if (u && u.role === 'teacher') items.push(['teacher', 'Панель преподавателя']);
  const cur = p === 'lab' ? 'labs' : p;
  $('#nav').innerHTML = items.map(([h, t]) => `<a href="#/${h}" class="${cur === h ? 'on' : ''}">${t}</a>`).join('');
  $('#userbox').innerHTML = u
    ? `<b>${esc(u.name)}</b>${u.role === 'teacher' ? 'Преподаватель' : esc(u.group || 'Студент')}<br><button class="btn ghost" id="logout">Выйти</button>`
    : `<a class="btn ghost" href="#/auth">Войти</a>`;
  const lo = $('#logout'); if (lo) lo.onclick = () => { Store.logout(); location.hash = '#/'; route(); };
}

function route() {
  const [p, a] = (location.hash.slice(2) || '').split('/');
  const u = Store.me();
  if (!u && !['', 'auth'].includes(p)) { location.hash = '#/auth'; return; }
  if (p === 'teacher' && (!u || u.role !== 'teacher')) { location.hash = '#/'; return; }
  if (['cabinet', 'certificate'].includes(p) && u.role === 'teacher') { location.hash = '#/teacher'; return; }
  renderNav(p);
  const V = { '': home, auth: authView, labs: labsView, lab: () => labView(+a), cabinet: cabinetView, certificate: certView, teacher: teacherView };
  (V[p] || home)();
  window.scrollTo(0, 0); $('#side').classList.remove('open');
}

/* ---------- главная ---------- */
function home() {
  const u = Store.me(), st = u && u.role === 'student' ? Store.stat(u.id) : null;
  view(`
  <section class="hero">
    <svg class="splat" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"></svg>
    <div>
      <h1>Инструментальные средства информационной системы</h1>
      <p class="lead">IS Tools — образовательная лаборатория для студентов вузов. Вы пройдёте путь от моделирования процессов и проектирования базы данных до веб-интерфейса, REST API, тестирования и работы с искусственным интеллектом.</p>
      <div class="cta">
        <a class="btn" href="${u ? '#/labs' : '#/auth'}">Начать обучение</a>
        ${u ? '' : '<a class="btn ghost" href="#/auth">Войти</a>'}
      </div>
    </div>
    <img src="assets/hero.jpg" alt="Самурай в чернильной графике">
  </section>
  <div class="stats">
    <div><strong>${LABS.length}</strong>лабораторных работ</div>
    <div><strong>${st ? st.pct + '%' : '—'}</strong>прогресс выполнения${st ? ` (${st.done} из ${LABS.length})` : ''}</div>
    <div><strong>${st ? st.pts : '—'}</strong>баллов из ${LABS.length * MAX_LAB}</div>
  </div>
  <div class="bar" style="margin-top:18px"><i style="width:${st ? st.pct : 0}%"></i></div>
  <div class="two">
    <div><h2>О курсе</h2>
      <p>Дисциплина формирует практические навыки проектирования, разработки, тестирования и использования информационных систем с применением современных инструментов: BPMN и UML, MySQL, HTML/CSS/JavaScript, MS Access, Excel, no-code платформ и ИИ-ассистентов.</p>
      <p>Каждая лабораторная включает теорию, пошаговую инструкцию, задания, загрузку отчёта и автоматически проверяемый тест. За работу начисляется до ${MAX_LAB} баллов: ${MAX_TEST} за тест и ${MAX_WORK} за проверку преподавателем.</p></div>
    <div><h2>Цели и задачи</h2>
      <ul>
        <li>Освоить инструменты моделирования и проектирования ИС.</li>
        <li>Научиться создавать и администрировать базы данных.</li>
        <li>Разрабатывать веб-интерфейсы и интерактивные формы.</li>
        <li>Автоматизировать обработку данных и строить no-code решения.</li>
        <li>Работать с API, тестировать систему и защищать доступ к ней.</li>
        <li>Ответственно использовать ИИ в разработке.</li>
      </ul></div>
  </div>
  <h2>Как проходит обучение</h2>
  <ol class="steps-list">
    <li>Изучите теорию и цель работы.</li><li>Выполните шаги инструкции и задания.</li>
    <li>Загрузите отчёт на проверку.</li><li>Пройдите тест — нужно не менее ${PASS} баллов из ${MAX_TEST}.</li>
    <li>Получите сертификат после всех ${LABS.length} работ.</li>
  </ol>`);
  splat($('.splat'), 70);
}

/* ---------- вход и регистрация ---------- */
function authView() {
  if (Store.me()) { location.hash = '#/labs'; return; }
  view(`<div class="auth card">
    <div class="tabs"><button class="on" data-t="in">Вход</button><button data-t="up">Регистрация</button></div>
    <form id="fin"><label class="f" for="e1">Email</label><input id="e1" type="email" required autocomplete="email">
      <label class="f" for="p1">Пароль</label><input id="p1" type="password" required autocomplete="current-password">
      <p class="err" id="er1"></p><button class="btn">Войти</button>
      <p class="note">Демо-доступ преподавателя: teacher@iis.edu / teacher123</p></form>
    <form id="fup" hidden><label class="f" for="n2">ФИО</label><input id="n2" type="text" required>
      <label class="f" for="g2">Группа</label><input id="g2" type="text" required>
      <label class="f" for="e2">Email</label><input id="e2" type="email" required autocomplete="email">
      <label class="f" for="p2">Пароль (не менее 6 символов)</label><input id="p2" type="password" minlength="6" required autocomplete="new-password">
      <p class="err" id="er2"></p><button class="btn">Создать аккаунт</button></form>
  </div>`);
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
    $('#fin').hidden = b.dataset.t !== 'in'; $('#fup').hidden = b.dataset.t !== 'up';
  });
  $('#fin').onsubmit = e => { e.preventDefault(); const r = Store.login($('#e1').value, $('#p1').value); if (r) $('#er1').textContent = r; else { location.hash = '#/labs'; route(); } };
  $('#fup').onsubmit = e => { e.preventDefault(); const r = Store.register($('#n2').value, $('#e2').value, $('#p2').value, $('#g2').value); if (r) $('#er2').textContent = r; else { location.hash = '#/labs'; route(); } };
}

/* ---------- список лабораторных ---------- */
function labStatus(uid, n) {
  if (Store.done(uid, n)) return ['Выполнена', 'ok'];
  const m = Store.marks(uid, n);
  return (m.s.length || m.t.length || Store.sub(uid, n) || Store.test(uid, n) !== null) ? ['В процессе', 'wait'] : ['Не начата', ''];
}
function labsView() {
  const u = Store.me(), stu = u.role === 'student';
  view(`<h1>Лабораторные работы</h1><p class="lead">Выполняйте работы по порядку: прогресс сохраняется автоматически.</p>
  <div class="grid">${LABS.map(l => {
    const L = Store.lab(l.n), [txt, cls] = stu ? labStatus(u.id, l.n) : ['', ''];
    const m = stu ? Store.marks(u.id, l.n) : { s: [], t: [] };
    const pr = stu ? Math.round((m.s.length + m.t.length) / (L.steps.length + L.tasks.length) * 100) : 0;
    return `<a class="card lab-card" href="#/lab/${l.n}"><div class="num">${l.n}</div><h3>${esc(L.t)}</h3>
      <p style="margin:0" class="muted">${esc(L.goal)}</p>${stu ? `<span class="chip ${cls}" style="align-self:flex-start">${txt}</span><div class="bar"><i style="width:${pr}%"></i></div>` : ''}</a>`;
  }).join('')}</div>`);
}

/* ---------- страница лабораторной ---------- */
function labView(n) {
  const L = Store.lab(n); if (!L) { location.hash = '#/labs'; return; }
  const u = Store.me(), stu = u.role === 'student';
  const m = Store.marks(u.id, n), sub = Store.sub(u.id, n), best = Store.test(u.id, n);
  const chk = (arr, kind) => arr.map((t, i) => `<label class="chk"><input type="checkbox" data-k="${kind}" data-i="${i}" ${m[kind].includes(i) ? 'checked' : ''} ${stu ? '' : 'disabled'}><span>${esc(t)}</span></label>`).join('');
  const quiz = L.quiz.map(q => ({ q: q[0], o: shuffle(q[1].map((t, i) => ({ t, ok: i === 0 }))) }));
  view(`
  <div class="lab-head"><div class="num">${n}</div><div><h1 style="margin:0">${esc(L.t)}</h1></div></div>
  <div class="sec"><h2>Цель работы</h2><p>${esc(L.goal)}</p>
  <h2>Теоретические сведения</h2><p>${esc(L.theory)}</p>
  <h2>Используемые программные инструменты</h2><div class="tags">${L.tools.map(t => `<span>${esc(t)}</span>`).join('')}</div>
  <h2>Пошаговая инструкция</h2><div class="card">${chk(L.steps, 's')}</div>
  <h2>Практические задания</h2><div class="card">${chk(L.tasks, 't')}</div>
  <h2>Задания повышенной сложности</h2><div class="card">${L.adv.map(t => `<p style="margin:6px 0">★ ${esc(t)}</p>`).join('')}</div>
  <h2>Контрольные вопросы</h2><ol>${L.quiz.map(q => `<li>${esc(q[0])}</li>`).join('')}</ol>
  <h2>Загрузка выполненной работы</h2>
  <div class="card">${!stu ? '<p>Режим преподавателя: загрузка и тест доступны студентам.</p>' : `
    ${sub ? `<div class="note">Отправлено ${fmtDate(sub.date)}: ${esc(sub.name)}. ${sub.status === 'checked'
      ? `Проверено — <b>${sub.score} из ${MAX_WORK}</b>${sub.comment ? '. Комментарий: ' + esc(sub.comment) : ''}` : 'Ожидает проверки преподавателем.'}</div>` : ''}
    <form id="upl"><label class="f" for="file">Файл отчёта (до 600 КБ сохраняется целиком)</label><input id="file" type="file">
    <label class="f" for="note">Комментарий для преподавателя</label><textarea id="note" placeholder="Что сделано, что вызвало вопросы">${sub ? esc(sub.note) : ''}</textarea>
    <p style="margin:14px 0 0"><button class="btn">Отправить на проверку</button></p></form>`}</div>
  <h2>Тест</h2>
  <div class="card">${!stu ? '<p>Режим преподавателя: тест доступен студентам.</p>' : `
    ${best !== null ? `<div class="note">Лучший результат: ${best} из ${MAX_TEST}. ${best >= PASS ? 'Тест сдан.' : 'Нужно не менее ' + PASS + ' — попробуйте ещё раз.'}</div>` : ''}
    <form id="quiz">${quiz.map((q, i) => `<div class="q"><p>${i + 1}. ${esc(q.q)}</p>${q.o.map((o, j) => `<label class="opt" data-ok="${o.ok ? 1 : 0}"><input type="radio" name="q${i}" value="${j}">${esc(o.t)}</label>`).join('')}</div>`).join('')}
    <button class="btn">Проверить тест</button> <span id="qres" style="margin-left:12px;font-weight:700"></span></form>`}</div></div>
  <div class="pager">${n > 1 ? `<a class="btn ghost" href="#/lab/${n - 1}">Предыдущая</a>` : '<span></span>'}
    ${n < LABS.length ? `<a class="btn" href="#/lab/${n + 1}">Следующая</a>` : ''}</div>`);
  if (!stu) return;

  document.querySelectorAll('.chk input').forEach(c => c.onchange = () => { Store.mark(u.id, n, c.dataset.k, +c.dataset.i, c.checked); });

  $('#upl').onsubmit = e => {
    e.preventDefault();
    const f = $('#file').files[0], note = $('#note').value;
    if (!f && !sub) { toast('Выберите файл с выполненной работой.'); return; }
    const done = (file) => {
      const ok = Store.submit(u.id, n, file, note);
      toast(ok ? 'Работа отправлена на проверку.' : 'Файл слишком большой: сохранено только название.'); labView(n);
    };
    if (!f) { done({ name: sub.name, size: sub.size, data: sub.data }); return; }
    if (f.size > 600 * 1024) { done({ name: f.name, size: f.size, data: '' }); return; }
    const r = new FileReader(); r.onload = () => done({ name: f.name, size: f.size, data: r.result }); r.readAsDataURL(f);
  };

  $('#quiz').onsubmit = e => {
    e.preventDefault();
    const boxes = document.querySelectorAll('.q');
    if ([...boxes].some((b, i) => !b.querySelector('input:checked'))) { toast('Ответьте на все вопросы.'); return; }
    let ok = 0;
    boxes.forEach(b => b.querySelectorAll('.opt').forEach(o => {
      const picked = o.querySelector('input').checked, right = o.dataset.ok === '1';
      o.classList.toggle('good', right); o.classList.toggle('bad', picked && !right);
      if (picked && right) ok++;
      o.querySelector('input').disabled = true;
    }));
    const score = Math.round(ok / boxes.length * MAX_TEST);
    Store.setTest(u.id, n, score);
    $('#qres').textContent = `Верно: ${ok} из ${boxes.length} — ${score} из ${MAX_TEST} баллов.`;
    toast(score >= PASS ? 'Тест сдан.' : 'Тест не сдан. Повторите материал и попробуйте снова.');
    $('#quiz button').textContent = 'Пройти заново'; $('#quiz button').type = 'button'; $('#quiz button').onclick = () => labView(n);
  };
}

/* ---------- личный кабинет ---------- */
function cabinetView() {
  const u = Store.me(), st = Store.stat(u.id);
  view(`<h1>Личный кабинет</h1>
  <div class="card"><h3>${esc(u.name)}</h3><p style="margin:0">${esc(u.group)} · ${esc(u.email)}</p></div>
  <div class="stats" style="margin-top:28px">
    <div><strong>${st.done}/${LABS.length}</strong>выполнено работ</div>
    <div><strong>${st.pts}</strong>баллов из ${LABS.length * MAX_LAB}</div>
    <div><strong>${st.grade}</strong>оценка по проверенным работам${st.mx ? ` (${st.rate}%)` : ''}</div>
  </div>
  <div class="bar" style="margin:18px 0"><i style="width:${st.pct}%"></i></div>
  <h2>Мои работы</h2><div class="tw"><table><thead><tr><th>№</th><th>Работа</th><th>Статус</th><th>Тест</th><th>Проверка</th><th>Баллы</th></tr></thead><tbody>
  ${LABS.map(l => {
    const [t, c] = labStatus(u.id, l.n), s = Store.sub(u.id, l.n), ts = Store.test(u.id, l.n);
    return `<tr><td>${l.n}</td><td><a href="#/lab/${l.n}">${esc(Store.lab(l.n).t)}</a></td><td><span class="chip ${c}">${t}</span></td>
    <td>${ts === null ? '—' : ts + '/' + MAX_TEST}</td><td>${!s ? '—' : s.status === 'checked' ? s.score + '/' + MAX_WORK + (s.comment ? '<br><small>' + esc(s.comment) + '</small>' : '') : 'на проверке'}</td><td>${Store.pts(u.id, l.n)}</td></tr>`;
  }).join('')}</tbody></table></div>
  <p style="margin-top:22px"><a class="btn" href="#/certificate">Сертификат</a></p>`);
}

/* ---------- сертификат ---------- */
function certView() {
  const u = Store.me(), st = Store.stat(u.id);
  if (!Store.eligible(u.id)) {
    view(`<h1>Сертификат</h1><div class="card"><p>Сертификат откроется, когда все ${LABS.length} работ будут выполнены (отправлены и тест сдан) и проверены преподавателем.</p>
    <p>Выполнено: <b>${st.done}</b> из ${LABS.length}. Проверено преподавателем: <b>${st.checked}</b> из ${LABS.length}.</p><div class="bar"><i style="width:${st.pct}%"></i></div>
    <p><a class="btn" href="#/labs">К лабораторным</a></p></div>`); return;
  }
  view(`<h1>Сертификат</h1><canvas class="cert" id="cv" width="1400" height="990"></canvas>
  <p style="margin-top:22px"><button class="btn" id="dl">Скачать PNG</button> <button class="btn ghost" onclick="window.print()">Печать</button></p>`);
  const c = $('#cv'), x = c.getContext('2d'), W = 1400, H = 990;
  x.fillStyle = '#c9c1b3'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#0e111a';
  for (let i = 0; i < 90; i++) { x.beginPath(); x.arc(W * .55 + Math.random() * W * .45, Math.random() * H, Math.pow(Math.random(), 3) * 7 + 1, 0, 7); x.fill(); }
  x.strokeStyle = '#0e111a'; x.lineWidth = 8; x.strokeRect(40, 40, W - 80, H - 80); x.lineWidth = 2; x.strokeRect(62, 62, W - 124, H - 124);
  x.beginPath(); x.moveTo(300, 330); x.lineTo(W - 300, 318); x.lineTo(W - 330, 338); x.lineTo(320, 346); x.fill();
  x.textAlign = 'center'; x.fillStyle = '#0e111a';
  const T = (s, y, f) => { x.font = f; x.fillText(s, W / 2, y); };
  const F = "'Yeseva One', Georgia, serif", S = "'PT Sans', Arial, sans-serif";
  T('СЕРТИФИКАТ', 250, `96px ${F}`);
  T('IS Tools — Образовательная лаборатория', 300, `28px ${S}`);
  T('Настоящим подтверждается, что', 440, `30px ${S}`);
  T(u.name, 540, `64px ${F}`);
  T(`группа ${u.group}`, 590, `28px ${S}`);
  T('успешно освоил(а) курс', 665, `30px ${S}`);
  T('«Инструментальные средства информационной системы»', 725, `42px ${F}`);
  T(`Выполнено лабораторных работ: ${st.done} из ${LABS.length}  ·  Баллов: ${st.pts} из ${LABS.length * MAX_LAB}  ·  Оценка: ${st.grade}`, 800, `28px ${S}`);
  T('Дата выдачи: ' + new Date().toLocaleDateString('ru-RU'), 880, `26px ${S}`);
  x.fillStyle = '#f4f1e8'; x.shadowColor = '#f4f1e8'; x.shadowBlur = 14;
  [[W / 2 - 30, 160], [W / 2 + 30, 160]].forEach(([a, b]) => { x.beginPath(); x.ellipse(a, b, 16, 4, -.12, 0, 7); x.fill(); });
  $('#dl').onclick = () => { const a = document.createElement('a'); a.download = 'certificate.png'; a.href = c.toDataURL('image/png'); a.click(); };
}

/* ---------- панель преподавателя ---------- */
function teacherView(tab) {
  tab = typeof tab === 'string' ? tab : 'students';
  view(`<h1>Панель преподавателя</h1><div class="tabs">${[['students', 'Студенты'], ['subs', 'Проверка работ'], ['tasks', 'Задания']].map(([k, t]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${t}</button>`).join('')}</div><div id="tp"></div>`);
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => teacherView(b.dataset.t));
  ({ students: tStudents, subs: tSubs, tasks: tTasks })[tab]();
}
function tStudents() {
  const rows = Store.students().map(s => { const st = Store.stat(s.id); return `<tr><td>${esc(s.name)}</td><td>${esc(s.group)}</td><td>${esc(s.email)}</td><td>${st.done}/${LABS.length}</td><td>${st.pts}</td><td>${st.grade}</td></tr>`; }).join('');
  $('#tp').innerHTML = rows ? `<div class="tw"><table><thead><tr><th>ФИО</th><th>Группа</th><th>Email</th><th>Работы</th><th>Баллы</th><th>Оценка</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p>Студентов пока нет: они появятся после регистрации.</p>';
}
function tSubs() {
  const list = Store.d.subs.slice().sort((a, b) => (a.status === 'sent' ? 0 : 1) - (b.status === 'sent' ? 0 : 1) || b.date.localeCompare(a.date));
  $('#tp').innerHTML = list.length ? list.map((s, i) => {
    const st = Store.user(s.uid); if (!st) return '';
    return `<div class="card sub-card"><div class="row" style="align-items:center"><h3 style="margin:0">${esc(st.name)} · работа ${s.lab}</h3><span class="chip ${s.status === 'checked' ? 'ok' : 'wait'}" style="flex:none">${s.status === 'checked' ? 'проверена' : 'ждёт проверки'}</span></div>
    <p>${esc(Store.lab(s.lab).t)}<br><small>${fmtDate(s.date)} · ${s.data ? `<a href="${s.data}" download="${esc(s.name)}">${esc(s.name)}</a>` : esc(s.name) + ' (содержимое не сохранено)'}</small></p>
    ${s.note ? `<div class="note">${esc(s.note)}</div>` : ''}
    <div class="row"><div><label class="f" for="sc${i}">Баллы (0–${MAX_WORK})</label><input id="sc${i}" type="number" min="0" max="${MAX_WORK}" value="${s.score}"></div>
    <div style="flex:3"><label class="f" for="cm${i}">Комментарий</label><input id="cm${i}" type="text" value="${esc(s.comment)}"></div>
    <div style="flex:none"><button class="btn sm" data-i="${i}">Сохранить оценку</button></div></div></div>`;
  }).join('') : '<p>Работ на проверку пока нет.</p>';
  document.querySelectorAll('#tp button[data-i]').forEach(b => b.onclick = () => {
    const i = +b.dataset.i, s = list[i]; Store.grade(s.uid, s.lab, $('#sc' + i).value, $('#cm' + i).value); toast('Оценка сохранена.'); teacherView('subs');
  });
}
function tTasks() {
  const sel = +(tTasks.sel || 1), L = Store.lab(sel);
  $('#tp').innerHTML = `<div class="card"><label class="f" for="ls">Лабораторная работа</label>
    <select id="ls">${LABS.map(l => `<option value="${l.n}" ${l.n === sel ? 'selected' : ''}>${l.n}. ${esc(l.t)}</option>`).join('')}</select>
    <label class="f" for="eg">Цель работы</label><textarea id="eg">${esc(L.goal)}</textarea>
    <label class="f" for="et">Практические задания (каждое с новой строки)</label><textarea id="et" rows="5">${esc(L.tasks.join('\n'))}</textarea>
    <label class="f" for="ea">Задания повышенной сложности (каждое с новой строки)</label><textarea id="ea">${esc(L.adv.join('\n'))}</textarea>
    <p style="margin:18px 0 0"><button class="btn" id="sv">Сохранить</button> <button class="btn ghost" id="rs">Вернуть исходные</button></p></div>`;
  const lines = id => $(id).value.split('\n').map(s => s.trim()).filter(Boolean);
  $('#ls').onchange = e => { tTasks.sel = e.target.value; tTasks(); };
  $('#sv').onclick = () => {
    const t = lines('#et'); if (!t.length) { toast('Добавьте хотя бы одно задание.'); return; }
    Store.setCustom(sel, { goal: $('#eg').value.trim() || L.goal, tasks: t, adv: lines('#ea') }); toast('Задания обновлены.');
  };
  $('#rs').onclick = () => { Store.resetCustom(sel); toast('Исходное содержание восстановлено.'); tTasks(); };
}

/* ---------- запуск ---------- */
Store.init();
$('#burger').onclick = () => $('#side').classList.toggle('open');
window.addEventListener('hashchange', route);
route();
