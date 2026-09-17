(() => {
  const $ = id => document.getElementById(id);
  const shell = $('teacher-shell');
  const status = $('teacher-status');
  const classroomList = $('teacher-classroom-list');
  const rosterPanel = $('teacher-roster-panel');
  const rosterList = $('teacher-roster-list');
  const studentClassrooms = $('teacher-student-classrooms');
  const studentGradeFilter = $('student-grade-filter');
  const viewTitles = { overview: 'Resumen', classrooms: 'Mis salones', 'create-classroom': 'Crear salón', students: 'Estudiantes y avances', classes: 'Clases', quizzes: 'Cuestionarios' };
  let currentSession = null;
  let classrooms = [];
  let selectedClassroom = null;
  let assignedGrades = [];
  let studyModules = [];
  let quizDrafts = [];
  let selectedQuiz = null;
  let quizQuestions = [];
  let pastedQuestionImage = null;

  const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const formatDate = value => value ? new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '';
  function setStatus(message = '', type = '') { status.textContent = message; status.className = `teacher-status${type ? ` ${type}` : ''}`; }

  function clearPastedQuestionImage() {
    pastedQuestionImage = null;
    $('quiz-image-preview').hidden = true;
    $('quiz-image-preview-img').removeAttribute('src');
    $('quiz-image-paste-zone').hidden = false;
  }

  function compressClipboardImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('El formato de imagen no es compatible.'));
        image.onload = () => {
          const maxSide = 1200;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function pasteQuestionImage(event) {
    const imageItem = [...(event.clipboardData?.items || [])].find(item => item.type.startsWith('image/'));
    if (!imageItem) { setStatus('El portapapeles no contiene una imagen. Copia una imagen y vuelve a intentarlo.', 'error'); return; }
    event.preventDefault();
    try {
      pastedQuestionImage = await compressClipboardImage(imageItem.getAsFile());
      $('quiz-image-preview-img').src = pastedQuestionImage;
      $('quiz-image-preview').hidden = false;
      $('quiz-image-paste-zone').hidden = true;
      setStatus('Imagen pegada correctamente.', 'success');
    } catch (error) { setStatus(error.message, 'error'); }
  }

  function showView(view) {
    document.querySelectorAll('[data-view-panel]').forEach(panel => { const active = panel.dataset.viewPanel === view; panel.hidden = !active; panel.classList.toggle('active', active); });
    document.querySelectorAll('[data-teacher-view]').forEach(button => button.classList.toggle('active', button.dataset.teacherView === view));
    $('teacher-view-title').textContent = viewTitles[view] || 'Panel docente';
    shell.classList.remove('menu-open');
    $('teacher-menu-btn').setAttribute('aria-expanded', 'false');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderClassrooms() {
    $('teacher-classroom-count').textContent = classrooms.length;
    $('teacher-student-count').textContent = classrooms.reduce((total, item) => total + item.studentCount, 0);
    $('teacher-classrooms-empty').hidden = classrooms.length > 0;
    classroomList.innerHTML = classrooms.map(item => `<article class="teacher-classroom-card">
      <div class="teacher-classroom-icon">${item.grade === 10 ? '⚛' : '🧫'}</div>
      <div><strong>${escapeHtml(item.name)}</strong><small>Grado ${item.grade} · ${item.studentCount} estudiante${item.studentCount === 1 ? '' : 's'}</small></div>
      <div class="classroom-code-wrap"><span>CÓDIGO</span><b>${escapeHtml(item.join_code)}</b></div>
      <button class="teacher-secondary-btn" type="button" data-classroom-id="${item.id}">Ver estudiantes</button>
    </article>`).join('');
    renderStudentClassrooms();
  }

  function renderStudentClassrooms() {
    const chosen = studentGradeFilter.value || 'all';
    const filtered = classrooms.filter(item => chosen === 'all' || String(item.grade) === chosen);
    studentClassrooms.innerHTML = filtered.length ? filtered.map(item => `<button type="button" class="teacher-student-classroom" data-student-classroom-id="${item.id}">
      <span>${item.grade}.º</span><div><strong>${escapeHtml(item.name)}</strong><small>${item.studentCount} estudiante${item.studentCount === 1 ? '' : 's'}</small></div><b>Ver lista →</b>
    </button>`).join('') : '<div class="teacher-empty">No hay salones en este grado.</div>';
  }

  function renderModules() {
    $('teacher-module-count').textContent = studyModules.length;
    $('teacher-class-list').innerHTML = studyModules.length ? studyModules.map(item => `<article class="teacher-content-card"><span>📘</span><div><strong>${escapeHtml(item.title)}</strong><small>Grado ${item.grade} · ${escapeHtml(item.description || 'Sin descripción')}</small></div><b>Guardada</b></article>`).join('') : '<div class="teacher-empty">Todavía no has creado clases.</div>';
  }

  function renderQuizDrafts() {
    $('teacher-quiz-list').innerHTML = quizDrafts.length ? quizDrafts.map(item => `<article class="teacher-content-card"><span>🧪</span><div><strong>${escapeHtml(item.title)}</strong><small>Grado ${item.grade} · Hasta ${item.questions} preguntas</small></div><b>${item.status === 'published' ? 'Publicado' : 'Borrador'}</b><button class="teacher-secondary-btn" type="button" data-edit-quiz-id="${item.id}">Ver y editar preguntas</button></article>`).join('') : '<div class="teacher-empty">Todavía no hay borradores de cuestionarios.</div>';
  }

  function renderQuizQuestions() {
    $('quiz-editor-meta').textContent = `Grado ${selectedQuiz.grade} · ${quizQuestions.length} de ${selectedQuiz.questions} preguntas guardadas`;
    $('save-quiz-question-btn').disabled = quizQuestions.length >= selectedQuiz.questions;
    $('teacher-question-list').innerHTML = quizQuestions.length ? quizQuestions.map((question, index) => {
      const options = [question.option_a, question.option_b, question.option_c, question.option_d];
      return `<article class="teacher-question-card"><div class="teacher-question-number">${index + 1}</div><div><strong>${escapeHtml(question.prompt)}</strong>${question.image_url ? `<img class="teacher-question-image" src="${escapeHtml(question.image_url)}" alt="Imagen de apoyo para la pregunta ${index + 1}" loading="lazy">` : ''}<ol type="A">${options.map((option, optionIndex) => `<li class="${optionIndex === question.correct_option ? 'correct' : ''}">${escapeHtml(option)}${optionIndex === question.correct_option ? ' ✓' : ''}</li>`).join('')}</ol>${question.explanation ? `<small>${escapeHtml(question.explanation)}</small>` : ''}</div></article>`;
    }).join('') : '<div class="teacher-empty">Este quiz todavía no tiene preguntas.</div>';
  }

  async function loadClassrooms() {
    if (!window.chemquestSupabase || !currentSession) return;
    $('refresh-classrooms-btn').disabled = true; setStatus('Cargando tus salones…');
    const { data = [], error } = await window.chemquestSupabase.from('classrooms').select('id, name, grade, join_code, created_at').eq('teacher_id', currentSession.user.id).order('created_at', { ascending: true });
    if (error) { setStatus(`No se pudieron cargar los salones: ${error.message}`, 'error'); $('refresh-classrooms-btn').disabled = false; return; }
    const ids = data.map(item => item.id); let memberships = [];
    if (ids.length) { const result = await window.chemquestSupabase.from('classroom_members').select('classroom_id').in('classroom_id', ids); if (!result.error) memberships = result.data || []; }
    const totals = memberships.reduce((map, item) => { map[item.classroom_id] = (map[item.classroom_id] || 0) + 1; return map; }, {});
    classrooms = data.map(item => ({ ...item, studentCount: totals[item.id] || 0 }));
    renderClassrooms(); setStatus(''); $('refresh-classrooms-btn').disabled = false;
  }

  async function loadModules() {
    const { data = [], error } = await window.chemquestSupabase.from('study_modules').select('id, title, description, grade, created_at').eq('created_by', currentSession.user.id).order('created_at', { ascending: false });
    if (!error) studyModules = data;
    renderModules();
  }

  async function loadQuizzes() {
    const { data = [], error } = await window.chemquestSupabase.from('teacher_quizzes')
      .select('id, title, grade, question_count, status, created_at')
      .eq('created_by', currentSession.user.id).order('created_at', { ascending: false });
    if (!error) quizDrafts = data.map(item => ({ ...item, questions: item.question_count }));
    renderQuizDrafts();
  }

  async function createClassroom(event) {
    event.preventDefault();
    const cleanName = $('classroom-name').value.trim().replace(/\s+/g, ' '); const selectedGrade = Number($('classroom-grade').value);
    if (!assignedGrades.includes(selectedGrade) || cleanName.length < 2) { setStatus('Completa el nombre y selecciona un grado asignado.', 'error'); return; }
    const normalizedName = cleanName.toLocaleLowerCase('es-CO');
    const alreadyExists = classrooms.some(item =>
      item.grade === selectedGrade && item.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-CO') === normalizedName
    );
    if (alreadyExists) {
      setStatus('Este salón ya fue creado', 'error');
      $('classroom-name').focus();
      return;
    }
    $('create-classroom-btn').disabled = true;
    const { data, error } = await window.chemquestSupabase.from('classrooms').insert({ name: cleanName, grade: selectedGrade, teacher_id: currentSession.user.id }).select('id, name, grade, join_code, created_at').single();
    $('create-classroom-btn').disabled = false;
    if (error) {
      setStatus(error.code === '23505' ? 'Este salón ya fue creado' : `No se pudo crear el salón: ${error.message}`, 'error');
      return;
    }
    classrooms.push({ ...data, studentCount: 0 }); $('classroom-name').value = ''; renderClassrooms(); setStatus(`Salón creado. Código: ${data.join_code}`, 'success'); showView('classrooms');
  }

  async function createClass(event) {
    event.preventDefault();
    const payload = { title: $('class-title').value.trim(), description: $('class-description').value.trim(), grade: Number($('class-grade').value), created_by: currentSession.user.id };
    const { data, error } = await window.chemquestSupabase.from('study_modules').insert(payload).select('id, title, description, grade, created_at').single();
    if (error) { setStatus(`No se pudo guardar la clase: ${error.message}`, 'error'); return; }
    studyModules.unshift(data); $('create-class-form').reset(); renderModules(); setStatus('Clase guardada correctamente.', 'success');
  }

  async function createQuizDraft(event) {
    event.preventDefault();
    const payload = { title: $('quiz-title').value.trim(), grade: Number($('quiz-grade').value), question_count: Number($('quiz-question-count').value), status: 'draft', created_by: currentSession.user.id };
    const { data, error } = await window.chemquestSupabase.from('teacher_quizzes').insert(payload).select('id, title, grade, question_count, status, created_at').single();
    if (error) { setStatus(`No se pudo crear el quiz: ${error.message}`, 'error'); return; }
    const newQuiz = { ...data, questions: data.question_count };
    quizDrafts.unshift(newQuiz);
    $('create-quiz-form').reset(); $('quiz-question-count').value = 5; renderQuizDrafts(); setStatus('Borrador de quiz guardado. Ya puedes añadir preguntas.', 'success');
    await openQuizEditor(newQuiz.id);
  }

  async function openQuizEditor(quizId) {
    selectedQuiz = quizDrafts.find(quiz => quiz.id === quizId);
    if (!selectedQuiz) return;
    $('teacher-quiz-editor').hidden = false;
    $('quiz-editor-title').textContent = selectedQuiz.title;
    $('teacher-question-list').innerHTML = '<div class="teacher-empty">Cargando preguntas…</div>';
    const { data = [], error } = await window.chemquestSupabase.from('quiz_questions')
      .select('id, prompt, image_url, option_a, option_b, option_c, option_d, correct_option, explanation, position')
      .eq('quiz_id', selectedQuiz.id).order('position', { ascending: true });
    if (error) { setStatus(`No se pudieron cargar las preguntas: ${error.message}`, 'error'); return; }
    quizQuestions = data;
    renderQuizQuestions();
    $('teacher-quiz-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function saveQuizQuestion(event) {
    event.preventDefault();
    if (!selectedQuiz) return;
    if (quizQuestions.length >= selectedQuiz.questions) { setStatus(`Este quiz admite máximo ${selectedQuiz.questions} preguntas.`, 'error'); return; }
    const payload = {
      quiz_id: selectedQuiz.id,
      prompt: $('quiz-question-text').value.trim(),
      image_url: pastedQuestionImage,
      option_a: $('quiz-option-a').value.trim(), option_b: $('quiz-option-b').value.trim(),
      option_c: $('quiz-option-c').value.trim(), option_d: $('quiz-option-d').value.trim(),
      correct_option: Number($('quiz-correct-option').value),
      explanation: $('quiz-explanation').value.trim(), position: quizQuestions.length + 1
    };
    $('save-quiz-question-btn').disabled = true;
    const { data, error } = await window.chemquestSupabase.from('quiz_questions').insert(payload)
      .select('id, prompt, image_url, option_a, option_b, option_c, option_d, correct_option, explanation, position').single();
    if (error) { $('save-quiz-question-btn').disabled = false; setStatus(`No se pudo guardar la pregunta: ${error.message}`, 'error'); return; }
    quizQuestions.push(data); $('quiz-question-form').reset(); clearPastedQuestionImage(); renderQuizQuestions(); setStatus('Pregunta guardada correctamente.', 'success');
  }

  function closeQuizEditor() {
    selectedQuiz = null; quizQuestions = []; $('teacher-quiz-editor').hidden = true; $('quiz-question-form').reset(); clearPastedQuestionImage();
  }

  async function openClassroom(classroomId) {
    selectedClassroom = classrooms.find(item => item.id === classroomId); if (!selectedClassroom) return;
    showView('students'); rosterPanel.hidden = false; $('roster-classroom-name').textContent = `${selectedClassroom.name} · Código ${selectedClassroom.join_code}`;
    $('teacher-roster-empty').hidden = true; rosterList.innerHTML = ''; setStatus('Cargando estudiantes…');
    const { data: memberships = [], error } = await window.chemquestSupabase.from('classroom_members').select('student_id, joined_at').eq('classroom_id', classroomId).order('joined_at', { ascending: true });
    if (error) { setStatus(`No se pudieron cargar los estudiantes: ${error.message}`, 'error'); return; }
    const ids = memberships.map(item => item.student_id); let profiles = [];
    if (ids.length) { const result = await window.chemquestSupabase.from('profiles').select('id, full_name, email').in('id', ids); if (result.error) { setStatus(`No se pudieron cargar los perfiles: ${result.error.message}`, 'error'); return; } profiles = result.data || []; }
    let progressRows = [];
    if (ids.length) {
      const result = await window.chemquestSupabase.from('student_progress').select('student_id, total_xp, level, completed_days, updated_at').in('student_id', ids);
      if (!result.error) progressRows = result.data || [];
    }
    const byId = Object.fromEntries(profiles.map(profile => [profile.id, profile]));
    const progressById = Object.fromEntries(progressRows.map(progress => [progress.student_id, progress]));
    $('teacher-roster-empty').hidden = memberships.length > 0;
    rosterList.innerHTML = memberships.map(membership => { const profile = byId[membership.student_id] || {}; const progress = progressById[membership.student_id] || {}; const displayName = profile.full_name || profile.email || 'Estudiante'; const completed = (progress.completed_days || []).filter(day => String(day).startsWith(`d${selectedClassroom.grade}-`)).length; const percent = Math.round((completed / 6) * 100); return `<article class="teacher-roster-item">
      <div class="teacher-avatar">${escapeHtml(displayName.charAt(0).toUpperCase() || 'E')}</div><div class="teacher-student-identity"><strong>${escapeHtml(displayName)}</strong><small>${escapeHtml(profile.email || '')}</small></div>
      <div class="teacher-progress"><div><span>Avance general</span><b>${percent}%</b></div><div class="teacher-progress-track"><i style="width:${percent}%"></i></div><small>${completed} de 6 clases · ${progress.total_xp || 0} XP · Nivel ${progress.level || 1}</small></div><div class="teacher-roster-date">${progress.updated_at ? `Actividad ${escapeHtml(formatDate(progress.updated_at))}` : `Desde ${escapeHtml(formatDate(membership.joined_at))}`}</div>
    </article>`; }).join(''); setStatus('');
  }

  async function copyClassroomCode() {
    if (!selectedClassroom) return;
    try { await navigator.clipboard.writeText(selectedClassroom.join_code); setStatus(`Código ${selectedClassroom.join_code} copiado.`, 'success'); } catch (_error) { setStatus(`Código: ${selectedClassroom.join_code}`, 'success'); }
  }

  async function initialize(profile, session) {
    currentSession = session; selectedClassroom = null; rosterPanel.hidden = true;
    const displayName = profile.full_name || profile.email || 'docente';
    $('teacher-name').textContent = displayName.split(' ')[0]; $('teacher-sidebar-name').textContent = displayName; $('teacher-account-chip').textContent = profile.email || displayName;
    const { data: rows = [], error } = await window.chemquestSupabase.from('teacher_grades').select('grade').eq('teacher_id', session.user.id).order('grade', { ascending: true });
    if (error) { assignedGrades = []; setStatus(`No se pudieron cargar tus grados: ${error.message}`, 'error'); return; }
    assignedGrades = rows.map(row => row.grade); const gradeText = assignedGrades.length ? assignedGrades.map(value => `${value}.º`).join(' y ') : 'Sin asignar';
    $('teacher-grade').textContent = gradeText; $('teacher-header-grades').textContent = gradeText;
    const options = assignedGrades.map(value => `<option value="${value}">${value}.º</option>`).join('') || '<option value="">Sin grados asignados</option>';
    $('classroom-grade').innerHTML = options; $('class-grade').innerHTML = options; $('quiz-grade').innerHTML = options; studentGradeFilter.innerHTML = '<option value="all">Todos</option>' + options;
    $('create-classroom-btn').disabled = assignedGrades.length === 0; showView('overview'); await Promise.all([loadClassrooms(), loadModules(), loadQuizzes()]);
  }

  function reset() { currentSession = null; classrooms = []; selectedClassroom = null; assignedGrades = []; studyModules = []; quizDrafts = []; selectedQuiz = null; quizQuestions = []; classroomList.innerHTML = ''; rosterList.innerHTML = ''; rosterPanel.hidden = true; $('teacher-quiz-editor').hidden = true; clearPastedQuestionImage(); }

  document.querySelectorAll('[data-teacher-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.teacherView)));
  document.querySelectorAll('[data-go-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.goView)));
  $('teacher-menu-btn').addEventListener('click', () => { const open = shell.classList.toggle('menu-open'); $('teacher-menu-btn').setAttribute('aria-expanded', String(open)); });
  $('create-classroom-form').addEventListener('submit', createClassroom); $('create-class-form').addEventListener('submit', createClass); $('create-quiz-form').addEventListener('submit', createQuizDraft);
  $('quiz-question-form').addEventListener('submit', saveQuizQuestion); $('close-quiz-editor-btn').addEventListener('click', closeQuizEditor);
  $('quiz-image-paste-zone').addEventListener('paste', pasteQuestionImage);
  $('quiz-image-paste-zone').addEventListener('click', () => $('quiz-image-paste-zone').focus());
  $('remove-quiz-image-btn').addEventListener('click', clearPastedQuestionImage);
  $('refresh-classrooms-btn').addEventListener('click', loadClassrooms); $('copy-classroom-code-btn').addEventListener('click', copyClassroomCode); studentGradeFilter.addEventListener('change', renderStudentClassrooms);
  classroomList.addEventListener('click', event => { const target = event.target.closest('[data-classroom-id]'); if (target) openClassroom(target.dataset.classroomId); });
  studentClassrooms.addEventListener('click', event => { const target = event.target.closest('[data-student-classroom-id]'); if (target) openClassroom(target.dataset.studentClassroomId); });
  $('teacher-quiz-list').addEventListener('click', event => { const target = event.target.closest('[data-edit-quiz-id]'); if (target) openQuizEditor(target.dataset.editQuizId); });
  renderQuizDrafts(); window.chemquestTeacher = { shell, initialize, reset };
})();
