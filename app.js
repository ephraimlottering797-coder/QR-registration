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

// ─── TOGGLE OTHER PROGRAM FIELD ───────────────────────────────
function toggleOtherProgram() {
  const programSelect = document.getElementById('program');
  const otherProgramGroup = document.getElementById('other-program-group');
  const otherInput = document.getElementById('otherProgram');

  if (programSelect.value === 'other') {
    // Show the custom program field with smooth slide-in
    otherProgramGroup.classList.remove('hidden');
    // Auto-focus for better UX
    setTimeout(() => otherInput.focus(), 100);
  } else {
    // Hide and clear the custom program field
    otherProgramGroup.classList.add('hidden');
    otherInput.value = '';
  }
}

// ─── REGISTRATION HANDLER ─────────────────────────────────────
function handleRegister(e) {
  e.preventDefault(); // Prevent form default submission

  const studentNumber = document.getElementById('studentNumber').value.trim();
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const program = document.getElementById('program').value;
  const otherProgram = document.getElementById('otherProgram').value.trim();
  const errEl = document.getElementById('error-msg');

  // Clear previous errors
  errEl.classList.add('hidden');
  errEl.textContent = '';

  // Validation
  if (!studentNumber) return showError('Please enter your student number.');
  if (!firstName) return showError('Please enter your first name.');
  if (!lastName) return showError('Please enter your last name.');
  if (!program) return showError('Please select your program.');
  
  // Validate custom program if "Other" is selected
  if (program === 'other' && !otherProgram) {
    return showError('Please specify your program.');
  }

  const students = getStudents();

  if (students.length >= MAX_SEATS) {
    showError('Sorry — all 200 spots are taken. Registration is closed.');
    return;
  }

  // Check duplicate student number
  if (students.find(s => s.studentNumber === studentNumber)) {
    return showError('This student number is already registered.');
  }

  // Use custom program if "Other" is selected, otherwise use the dropdown value
  const finalProgram = program === 'other' ? otherProgram : program;

  // Save
  const entry = {
    id: Date.now(),
    studentNumber,
    name: `${firstName} ${lastName}`,
    program: finalProgram,
    registeredAt: new Date().toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })
  };

  students.push(entry);
  saveStudents(students);

  // Reset form
  document.getElementById('registrationForm').reset();
  document.getElementById('other-program-group').classList.add('hidden');

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
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('empty-state');

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
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
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

// ─── EVENT LISTENERS ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateCounter();

  // Form submission
  const registrationForm = document.getElementById('registrationForm');
  if (registrationForm) {
    registrationForm.addEventListener('submit', handleRegister);
  }

  // Program selection toggle
  const programSelect = document.getElementById('program');
  if (programSelect) {
    programSelect.addEventListener('change', toggleOtherProgram);
  }

  // Close popup button
  const closePopupBtn = document.getElementById('closePopupBtn');
  if (closePopupBtn) {
    closePopupBtn.addEventListener('click', closePopup);
  }

  // Search input for admin page
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', renderTable);
  }
});
