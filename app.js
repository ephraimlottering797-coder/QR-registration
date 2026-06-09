// ─── CONSTANTS ───────────────────────────────────────────────
const MAX_SEATS = 200;
const STORAGE_KEY = 'ffd_students';

// ─── HELPERS ─────────────────────────────────────────────────
function getStudents() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveStudents(students) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function updateCounter() {
  const students = getStudents();
  const count = students.length;
  const pct = (count / MAX_SEATS) * 100;

  const bar = document.getElementById('seat-bar');
  const label = document.getElementById('seat-count');

  if (bar) bar.style.width = pct + '%';
  if (label) label.textContent = count;

  // Change bar colour as it fills
  if (bar) {
    if (pct < 50) bar.style.background = 'var(--accent)';
    else if (pct < 85) bar.style.background = '#f59e0b';
    else bar.style.background = '#ef4444';
  }

  // Lock form if full
  if (count >= MAX_SEATS) {
    const locked = document.getElementById('locked-overlay');
    if (locked) locked.classList.remove('hidden');

    const btn = document.getElementById('registerBtn');
    if (btn) { btn.disabled = true; btn.textContent = '🔒 Registration Full'; }
  }
}

// ─── REGISTRATION HANDLER ─────────────────────────────────────
function handleRegister() {
  const studentNumber = document.getElementById('studentNumber').value.trim();
  const firstName     = document.getElementById('firstName').value.trim();
  const lastName      = document.getElementById('lastName').value.trim();
  const program       = document.getElementById('program').value;
  const errEl         = document.getElementById('error-msg');

  // Clear previous errors
  errEl.classList.add('hidden');
  errEl.textContent = '';

  // Validation
  if (!studentNumber) return showError('Please enter your student number.');
  if (!firstName)     return showError('Please enter your first name.');
  if (!lastName)      return showError('Please enter your last name.');
  if (!program)       return showError('Please select your program.');

  const students = getStudents();

  if (students.length >= MAX_SEATS) {
    showError('Sorry — all 200 spots are taken. Registration is closed.');
    return;
  }

  // Check duplicate student number
  if (students.find(s => s.studentNumber === studentNumber)) {
    return showError('This student number is already registered.');
  }

  // Save
  const entry = {
    id: Date.now(),
    studentNumber,
    name: `${firstName} ${lastName}`,
    program,
    registeredAt: new Date().toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })
  };

  students.push(entry);
  saveStudents(students);

  // Reset form
  document.getElementById('studentNumber').value = '';
  document.getElementById('firstName').value = '';
  document.getElementById('lastName').value = '';
  document.getElementById('program').value = '';

  updateCounter();
  showPopup();
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ─── POPUP ────────────────────────────────────────────────────
function showPopup() {
  document.getElementById('popup-overlay').classList.remove('hidden');
}

function closePopup() {
  document.getElementById('popup-overlay').classList.add('hidden');
}

// ─── ADMIN TABLE ──────────────────────────────────────────────
function renderTable() {
  const students = getStudents();
  const query    = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const tbody    = document.getElementById('tableBody');
  const empty    = document.getElementById('empty-state');

  if (!tbody) return;

  const filtered = students.filter(s =>
    s.studentNumber.toLowerCase().includes(query) ||
    s.name.toLowerCase().includes(query) ||
    s.program.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }

  empty?.classList.add('hidden');

  tbody.innerHTML = filtered.map((s, i) => `
    <tr>
      <td class="row-num">${i + 1}</td>
      <td><span class="badge-num">${s.studentNumber}</span></td>
      <td>${s.name}</td>
      <td><span class="badge-prog">${s.program}</span></td>
      <td class="ts">${s.registeredAt}</td>
    </tr>
  `).join('');
}

// ─── EXPORT CSV ───────────────────────────────────────────────
function exportCSV() {
  const students = getStudents();
  if (students.length === 0) { alert('No data to export yet.'); return; }

  const rows = [
    ['#', 'Student Number', 'Full Name', 'Program', 'Registered At'],
    ...students.map((s, i) => [i + 1, s.studentNumber, s.name, s.program, s.registeredAt])
  ];

  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'FutureFocusDay_Registrations.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── CLEAR ALL (admin) ────────────────────────────────────────
function clearAll() {
  if (confirm('⚠️ This will permanently delete ALL registrations. Are you sure?')) {
    localStorage.removeItem(STORAGE_KEY);
    updateCounter();
    renderTable();
  }
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateCounter();
});
