(() => {
  const shell = document.getElementById('teacher-shell');
  const status = document.getElementById('teacher-status');
  const name = document.getElementById('teacher-name');
  const grade = document.getElementById('teacher-grade');
  const account = document.getElementById('teacher-account-chip');
  const classroomCount = document.getElementById('teacher-classroom-count');
  const studentCount = document.getElementById('teacher-student-count');
  const moduleCount = document.getElementById('teacher-module-count');
  const classroomList = document.getElementById('teacher-classroom-list');
  const classroomEmpty = document.getElementById('teacher-classrooms-empty');
  const createForm = document.getElementById('create-classroom-form');
  const classroomName = document.getElementById('classroom-name');
  const classroomGrade = document.getElementById('classroom-grade');
  const createButton = document.getElementById('create-classroom-btn');
  const refreshButton = document.getElementById('refresh-classrooms-btn');
  const rosterPanel = document.getElementById('teacher-roster-panel');
  const rosterName = document.getElementById('roster-classroom-name');
  const rosterList = document.getElementById('teacher-roster-list');
  const rosterEmpty = document.getElementById('teacher-roster-empty');
  const copyCodeButton = document.getElementById('copy-classroom-code-btn');

  let currentProfile = null;
  let currentSession = null;
  let classrooms = [];
  let selectedClassroom = null;
  let assignedGrades = [];

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function setStatus(message = '', type = '') {
    status.textContent = message;
    status.className = `teacher-status${type ? ` ${type}` : ''}`;
  }

  function formatDate(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date(value));
  }

  function renderClassrooms() {
    classroomCount.textContent = classrooms.length;
    studentCount.textContent = classrooms.reduce((total, classroom) => total + classroom.studentCount, 0);
    classroomEmpty.hidden = classrooms.length > 0;
    classroomList.innerHTML = classrooms.map(classroom => `
      <button class="teacher-classroom-card" type="button" data-classroom-id="${classroom.id}">
        <strong>${escapeHtml(classroom.name)}</strong>
        <span class="classroom-code">${escapeHtml(classroom.join_code)}</span>
        <small>Grado ${classroom.grade} · Creado ${escapeHtml(formatDate(classroom.created_at))}</small>
        <small class="student-total">${classroom.studentCount} estudiante${classroom.studentCount === 1 ? '' : 's'}</small>
      </button>
    `).join('');
  }

  async function loadClassrooms() {
    if (!window.chemquestSupabase || !currentSession) return;

    refreshButton.disabled = true;
    setStatus('Cargando tus salones…');

    const { data, error } = await window.chemquestSupabase
      .from('classrooms')
      .select('id, name, grade, join_code, created_at')
      .eq('teacher_id', currentSession.user.id)
      .order('created_at', { ascending: true });

    if (error) {
      setStatus(`No se pudieron cargar los salones: ${error.message}`, 'error');
      refreshButton.disabled = false;
      return;
    }

    const classroomIds = data.map(classroom => classroom.id);
    let memberships = [];

    if (classroomIds.length) {
      const membershipResult = await window.chemquestSupabase
        .from('classroom_members')
        .select('classroom_id')
        .in('classroom_id', classroomIds);

      if (membershipResult.error) {
        setStatus(`Los salones cargaron, pero no fue posible contar estudiantes: ${membershipResult.error.message}`, 'error');
      } else {
        memberships = membershipResult.data;
      }
    }

    const totals = memberships.reduce((result, membership) => {
      result[membership.classroom_id] = (result[membership.classroom_id] || 0) + 1;
      return result;
    }, {});

    classrooms = data.map(classroom => ({
      ...classroom,
      studentCount: totals[classroom.id] || 0
    }));

    renderClassrooms();
    setStatus('');
    refreshButton.disabled = false;
  }

  async function createClassroom(event) {
    event.preventDefault();
    const cleanName = classroomName.value.trim();

    const selectedGrade = Number(classroomGrade.value);

    if (!assignedGrades.includes(selectedGrade)) {
      setStatus('Selecciona uno de los grados asignados a tu cuenta.', 'error');
      return;
    }

    if (cleanName.length < 2) {
      setStatus('Escribe un nombre de al menos 2 caracteres.', 'error');
      classroomName.focus();
      return;
    }

    createButton.disabled = true;
    setStatus('Creando el salón…');

    const { data, error } = await window.chemquestSupabase
      .from('classrooms')
      .insert({
        name: cleanName,
        grade: selectedGrade,
        teacher_id: currentSession.user.id
      })
      .select('id, name, grade, join_code, created_at')
      .single();

    createButton.disabled = false;

    if (error) {
      setStatus(`No se pudo crear el salón: ${error.message}`, 'error');
      return;
    }

    classrooms.push({ ...data, studentCount: 0 });
    classroomName.value = '';
    renderClassrooms();
    setStatus(`Salón creado. Código para estudiantes: ${data.join_code}`, 'success');
  }

  async function openClassroom(classroomId) {
    selectedClassroom = classrooms.find(classroom => classroom.id === classroomId);
    if (!selectedClassroom) return;

    rosterPanel.hidden = false;
    rosterName.textContent = `${selectedClassroom.name} · Código ${selectedClassroom.join_code}`;
    rosterEmpty.hidden = true;
    rosterList.innerHTML = '';
    setStatus('Cargando estudiantes…');

    const { data: memberships, error } = await window.chemquestSupabase
      .from('classroom_members')
      .select('student_id, joined_at')
      .eq('classroom_id', classroomId)
      .order('joined_at', { ascending: true });

    if (error) {
      setStatus(`No se pudieron cargar los estudiantes: ${error.message}`, 'error');
      return;
    }

    const studentIds = memberships.map(membership => membership.student_id);
    let profiles = [];

    if (studentIds.length) {
      const profileResult = await window.chemquestSupabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds);

      if (profileResult.error) {
        setStatus(`No se pudieron cargar los perfiles: ${profileResult.error.message}`, 'error');
        return;
      }
      profiles = profileResult.data;
    }

    const profileById = Object.fromEntries(profiles.map(profile => [profile.id, profile]));
    rosterEmpty.hidden = memberships.length > 0;
    rosterList.innerHTML = memberships.map(membership => {
      const profile = profileById[membership.student_id] || {};
      const displayName = profile.full_name || profile.email || 'Estudiante';
      const initial = displayName.trim().charAt(0).toUpperCase() || 'E';
      return `
        <article class="teacher-roster-item">
          <div class="teacher-avatar" aria-hidden="true">${escapeHtml(initial)}</div>
          <div>
            <div class="teacher-roster-name">${escapeHtml(displayName)}</div>
            <div class="teacher-roster-email">${escapeHtml(profile.email || '')}</div>
          </div>
          <div class="teacher-roster-date">Ingresó ${escapeHtml(formatDate(membership.joined_at))}</div>
        </article>
      `;
    }).join('');

    setStatus('');
    rosterPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function copyClassroomCode() {
    if (!selectedClassroom) return;
    try {
      await navigator.clipboard.writeText(selectedClassroom.join_code);
      setStatus(`Código ${selectedClassroom.join_code} copiado.`, 'success');
    } catch (_error) {
      setStatus(`Código del salón: ${selectedClassroom.join_code}`, 'success');
    }
  }

  async function initialize(profile, session) {
    currentProfile = profile;
    currentSession = session;
    selectedClassroom = null;
    rosterPanel.hidden = true;

    const displayName = profile.full_name || profile.email || 'docente';
    name.textContent = displayName.split(' ')[0];
    account.textContent = displayName;
    account.title = profile.email;
    moduleCount.textContent = '0';

    const { data: gradeRows, error: gradeError } = await window.chemquestSupabase
      .from('teacher_grades')
      .select('grade')
      .eq('teacher_id', session.user.id)
      .order('grade', { ascending: true });

    if (gradeError) {
      assignedGrades = [];
      grade.textContent = 'No disponible';
      classroomGrade.innerHTML = '<option value="">Sin grados asignados</option>';
      createButton.disabled = true;
      setStatus(`No se pudieron cargar tus grados: ${gradeError.message}`, 'error');
      return;
    }

    assignedGrades = gradeRows.map(row => row.grade);
    grade.textContent = assignedGrades.length
      ? assignedGrades.map(value => `${value}.º`).join(' y ')
      : 'Sin asignar';
    classroomGrade.innerHTML = assignedGrades
      .map(value => `<option value="${value}">${value}.º</option>`)
      .join('') || '<option value="">Sin grados asignados</option>';
    createButton.disabled = assignedGrades.length === 0;

    await loadClassrooms();

    if (!assignedGrades.length) {
      setStatus('Un administrador debe asignarte al menos un grado antes de crear salones.', 'error');
    }
  }

  function reset() {
    currentProfile = null;
    currentSession = null;
    classrooms = [];
    selectedClassroom = null;
    assignedGrades = [];
    classroomList.innerHTML = '';
    rosterList.innerHTML = '';
    rosterPanel.hidden = true;
  }

  createForm.addEventListener('submit', createClassroom);
  refreshButton.addEventListener('click', loadClassrooms);
  copyCodeButton.addEventListener('click', copyClassroomCode);
  classroomList.addEventListener('click', event => {
    const card = event.target.closest('[data-classroom-id]');
    if (card) openClassroom(card.dataset.classroomId);
  });

  window.chemquestTeacher = { shell, initialize, reset };
})();
