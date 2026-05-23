/* Sitha Sai 50 Days Challenge — v1.0.0 */

const STORAGE_KEY = 'sitha-sai-50d-v1';
const TOTAL_DAYS = 50;

const DEFAULT_TASKS = [
  { id: 'exercise', name: 'Home exercise', sub: '45 mins' },
  { id: 'meditation', name: 'Meditation', sub: '10 mins' },
  { id: 'pooja', name: 'Bhakti Pooja', sub: '20 mins' },
  { id: 'study', name: 'MSc Diabetes revision', sub: 'Daily revision block' },
  { id: 'gym', name: 'Gym session', sub: 'Strength / cardio' },
  { id: 'social', name: 'Social activity', sub: 'Connect with someone' },
];

const AFFIRMATIONS = [
  "Every small step is rebuilding you.",
  "Discipline today, freedom tomorrow.",
  "Your comeback is stronger than any gap.",
  "Knowledge + consistency = unstoppable.",
  "Trust the process, honor the routine.",
  "Your future self is watching today.",
  "Calm mind, focused study, healthy body.",
  "You're not behind — you're on your own timeline.",
  "Show up, even on the hard days.",
  "Small daily wins build big lives.",
  "Your dedication is your superpower.",
  "Rooted in faith, growing in strength.",
];

/* ---------------- State ---------------- */
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate / ensure shape
      if (!parsed.defaults) parsed.defaults = [...DEFAULT_TASKS];
      if (!parsed.days) parsed.days = {};
      return parsed;
    }
  } catch (e) {
    console.warn('Could not load state:', e);
  }
  // First time
  return {
    startDate: todayISO(),
    userName: 'Sitha Sai',
    defaults: [...DEFAULT_TASKS],
    days: {},
    currentDayView: null, // null = today
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------------- Date helpers ---------------- */
function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

function dateForDay(dayNum) {
  const start = new Date(state.startDate + 'T00:00:00');
  start.setDate(start.getDate() + (dayNum - 1));
  return start;
}

function currentDayNumber() {
  const start = new Date(state.startDate + 'T00:00:00');
  const today = new Date(todayISO() + 'T00:00:00');
  const diff = Math.floor((today - start) / 86400000) + 1;
  return Math.min(Math.max(diff, 1), TOTAL_DAYS);
}

function formatDate(d) {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/* ---------------- Day data ---------------- */
function getDay(num) {
  if (!state.days[num]) {
    state.days[num] = {
      tasks: state.defaults.map(t => ({ ...t, completed: false })),
      studyTopic: '',
      studyHours: '',
      notes: '',
      mood: '',
    };
  } else {
    // Make sure new defaults appear (without duplicating)
    const existingIds = new Set(state.days[num].tasks.map(t => t.id));
    state.defaults.forEach(t => {
      if (!existingIds.has(t.id)) {
        state.days[num].tasks.push({ ...t, completed: false });
      }
    });
  }
  return state.days[num];
}

function dayCompletion(num) {
  const day = state.days[num];
  if (!day || !day.tasks.length) return 0;
  const done = day.tasks.filter(t => t.completed).length;
  return done / day.tasks.length;
}

function isDayDone(num) {
  return dayCompletion(num) >= 1;
}

function totalDoneDays() {
  let n = 0;
  for (let i = 1; i <= TOTAL_DAYS; i++) if (isDayDone(i)) n++;
  return n;
}

function calcStreak() {
  const cur = currentDayNumber();
  let streak = 0;
  for (let i = cur; i >= 1; i--) {
    if (isDayDone(i)) streak++;
    else break;
  }
  return streak;
}

/* ---------------- View ---------------- */
let viewDay = currentDayNumber();

function render() {
  const day = getDay(viewDay);
  const date = dateForDay(viewDay);
  const today = currentDayNumber();

  // Header
  $('dayNumber').textContent = `Day ${viewDay}`;
  const totalDone = totalDoneDays();
  const pct = Math.round((totalDone / TOTAL_DAYS) * 100);
  $('progressPct').textContent = `${pct}%`;
  const ring = $('ringFg');
  const circ = 326.7;
  ring.style.strokeDashoffset = circ - (circ * pct / 100);
  $('streakCount').textContent = calcStreak();
  $('doneCount').textContent = totalDone;

  $('affirmation').textContent = AFFIRMATIONS[(viewDay - 1) % AFFIRMATIONS.length];

  $('dayDate').textContent = formatDate(date);
  $('dayLabel').textContent =
    viewDay === today ? 'Today' :
    viewDay < today ? 'Past day' :
    'Upcoming';

  // Tasks
  const list = $('taskList');
  list.innerHTML = '';
  day.tasks.forEach((t, idx) => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
      <button class="task-check ${t.completed ? 'checked' : ''}" data-toggle="${idx}" aria-label="Toggle ${escapeHtml(t.name)}"></button>
      <div class="task-body">
        <div class="task-name ${t.completed ? 'done' : ''}">${escapeHtml(t.name)}</div>
        ${t.sub ? `<div class="task-sub">${escapeHtml(t.sub)}</div>` : ''}
      </div>
      ${t.custom ? `<button class="task-del" data-del="${idx}" aria-label="Delete">×</button>` : ''}
    `;
    list.appendChild(li);
  });

  $('studyTopic').value = day.studyTopic || '';
  $('studyHours').value = day.studyHours || '';
  $('dayNotes').value = day.notes || '';

  document.querySelectorAll('#moodOptions button').forEach(b => {
    b.classList.toggle('active', b.dataset.mood === day.mood);
  });
}

/* ---------------- Events ---------------- */
function $(id) { return document.getElementById(id); }

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

document.addEventListener('click', (e) => {
  const toggle = e.target.closest('[data-toggle]');
  if (toggle) {
    const idx = +toggle.dataset.toggle;
    const day = getDay(viewDay);
    day.tasks[idx].completed = !day.tasks[idx].completed;
    saveState();
    render();
    if (day.tasks[idx].completed && isDayDone(viewDay)) {
      toast('🎉 Day complete! Beautiful work.');
    }
    return;
  }
  const del = e.target.closest('[data-del]');
  if (del) {
    const idx = +del.dataset.del;
    const day = getDay(viewDay);
    day.tasks.splice(idx, 1);
    saveState();
    render();
    return;
  }
  if (e.target.closest('[data-close]')) {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  }
  if (e.target.classList.contains('modal')) {
    e.target.classList.add('hidden');
  }
});

$('prevDay').addEventListener('click', () => {
  if (viewDay > 1) { viewDay--; render(); }
});
$('nextDay').addEventListener('click', () => {
  if (viewDay < TOTAL_DAYS) { viewDay++; render(); }
});

$('addTaskForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('newTaskInput');
  const name = input.value.trim();
  if (!name) return;
  const day = getDay(viewDay);
  day.tasks.push({ id: 'custom-' + Date.now(), name, sub: '', completed: false, custom: true });
  saveState();
  input.value = '';
  render();
});

['studyTopic', 'studyHours', 'dayNotes'].forEach(id => {
  $(id).addEventListener('input', () => {
    const day = getDay(viewDay);
    if (id === 'studyTopic') day.studyTopic = $(id).value;
    if (id === 'studyHours') day.studyHours = $(id).value;
    if (id === 'dayNotes') day.notes = $(id).value;
    saveState();
  });
});

$('moodOptions').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const day = getDay(viewDay);
  day.mood = day.mood === b.dataset.mood ? '' : b.dataset.mood;
  saveState();
  render();
});

$('saveBtn').addEventListener('click', () => {
  saveState();
  toast('Saved ✓');
});

/* ---------- Overview Modal ---------- */
$('overviewBtn').addEventListener('click', () => {
  renderGrid();
  $('overviewModal').classList.remove('hidden');
});

function renderGrid() {
  const grid = $('grid50');
  grid.innerHTML = '';
  const today = currentDayNumber();
  for (let i = 1; i <= TOTAL_DAYS; i++) {
    const c = dayCompletion(i);
    const cell = document.createElement('button');
    cell.className = 'grid-cell';
    if (c >= 1) cell.classList.add('done');
    else if (c > 0) cell.classList.add('partial');
    if (i === today) cell.classList.add('today');
    cell.textContent = i;
    cell.addEventListener('click', () => {
      viewDay = i;
      $('overviewModal').classList.add('hidden');
      render();
    });
    grid.appendChild(cell);
  }
}

/* ---------- Settings Modal ---------- */
$('settingsBtn').addEventListener('click', () => {
  $('startDateInput').value = state.startDate;
  $('userNameInput').value = state.userName;
  renderDefaults();
  $('settingsModal').classList.remove('hidden');
});

function renderDefaults() {
  const list = $('defaultsList');
  list.innerHTML = '';
  state.defaults.forEach((t, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${escapeHtml(t.name)}${t.sub ? ` <em style="opacity:.6">— ${escapeHtml(t.sub)}</em>` : ''}</span>
      <button class="task-del" data-rm-def="${idx}" aria-label="Remove">×</button>
    `;
    list.appendChild(li);
  });
}

$('defaultsList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-rm-def]');
  if (!b) return;
  state.defaults.splice(+b.dataset.rmDef, 1);
  saveState();
  renderDefaults();
});

$('addDefaultForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('newDefaultInput');
  const name = input.value.trim();
  if (!name) return;
  state.defaults.push({ id: 'def-' + Date.now(), name, sub: '' });
  saveState();
  input.value = '';
  renderDefaults();
});

$('startDateInput').addEventListener('change', () => {
  state.startDate = $('startDateInput').value;
  saveState();
  viewDay = currentDayNumber();
  render();
});

$('userNameInput').addEventListener('input', () => {
  state.userName = $('userNameInput').value;
  saveState();
});

$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sitha-sai-50d-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Exported');
});

$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (imported && imported.days) {
        state = imported;
        saveState();
        viewDay = currentDayNumber();
        render();
        toast('Imported ✓');
      }
    } catch {
      toast('Could not import file');
    }
  };
  reader.readAsText(f);
});

$('resetBtn').addEventListener('click', () => {
  if (confirm('Reset everything? This will erase all your progress.')) {
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    viewDay = currentDayNumber();
    saveState();
    renderDefaults();
    render();
    toast('Reset complete');
  }
});

/* ---------- Init ---------- */
saveState(); // ensure shape
render();
