(() => {
  const titles = {
    overview: 'Resumen', classrooms: 'Mis salones', create: 'Crear salón',
    students: 'Estudiantes y avances', classes: 'Clases', quizzes: 'Cuestionarios'
  };
  const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  function show(view) {
    document.querySelectorAll('[data-panel]').forEach(panel => {
      panel.hidden = panel.dataset.panel !== view;
      panel.classList.toggle('active', panel.dataset.panel === view);
    });
    document.querySelectorAll('[data-show]').forEach(button => button.classList.toggle('active', button.dataset.show === view));
    document.querySelector('#title').textContent = titles[view];
    document.querySelector('#teacher-shell').classList.remove('menu-open');
  }

  document.querySelectorAll('[data-show]').forEach(button => button.addEventListener('click', () => show(button.dataset.show)));
  document.querySelectorAll('[data-link]').forEach(button => button.addEventListener('click', () => show(button.dataset.link)));
  document.querySelector('#menu').addEventListener('click', () => document.querySelector('#teacher-shell').classList.toggle('menu-open'));

  const previewQuizzes = [];
  let activeQuiz = null;
  let pastedImage = null;
  const quizList = document.querySelector('#preview-quiz-list');
  const editor = document.querySelector('#preview-quiz-editor');

  function clearImage() {
    pastedImage = null;
    document.querySelector('#preview-pasted-image').hidden = true;
    document.querySelector('#preview-pasted-image-img').removeAttribute('src');
    document.querySelector('#preview-paste-zone').hidden = false;
  }

  function renderQuizList() {
    quizList.innerHTML = previewQuizzes.map((quiz, index) => `<article class="teacher-content-card"><span>🧪</span><div><strong>${escapeHtml(quiz.title)}</strong><small>Grado ${quiz.grade} · ${quiz.questions.length} de ${quiz.limit} preguntas</small></div><b>Borrador</b><button class="teacher-secondary-btn" type="button" data-preview-quiz="${index}">Ver y editar preguntas</button></article>`).join('');
  }

  function openQuiz(index) {
    activeQuiz = previewQuizzes[index];
    editor.hidden = false;
    document.querySelector('#preview-editor-title').textContent = activeQuiz.title;
    document.querySelector('#preview-editor-meta').textContent = `${activeQuiz.questions.length} de ${activeQuiz.limit} preguntas guardadas`;
    document.querySelector('#preview-question-list').innerHTML = activeQuiz.questions.length ? activeQuiz.questions.map((question, questionIndex) => `<article class="teacher-question-card"><div class="teacher-question-number">${questionIndex + 1}</div><div><strong>${escapeHtml(question.text)}</strong>${question.image ? `<img class="teacher-question-image" src="${escapeHtml(question.image)}" alt="Imagen de apoyo para la pregunta ${questionIndex + 1}">` : ''}<ol type="A">${question.options.map((option, optionIndex) => `<li class="${optionIndex === question.correct ? 'correct' : ''}">${escapeHtml(option)}${optionIndex === question.correct ? ' ✓' : ''}</li>`).join('')}</ol></div></article>`).join('') : '<div class="teacher-empty">Este quiz todavía no tiene preguntas.</div>';
  }

  document.querySelector('#preview-quiz-form').addEventListener('submit', event => {
    event.preventDefault();
    previewQuizzes.unshift({ title: document.querySelector('#preview-quiz-title').value.trim(), grade: document.querySelector('#preview-quiz-grade').value, limit: Number(document.querySelector('#preview-quiz-count').value), questions: [] });
    renderQuizList(); openQuiz(0); event.target.reset(); document.querySelector('#preview-quiz-count').value = 5;
  });
  quizList.addEventListener('click', event => { const button = event.target.closest('[data-preview-quiz]'); if (button) openQuiz(Number(button.dataset.previewQuiz)); });
  document.querySelector('#preview-question-form').addEventListener('submit', event => {
    event.preventDefault(); if (!activeQuiz || activeQuiz.questions.length >= activeQuiz.limit) return;
    activeQuiz.questions.push({ text: document.querySelector('#preview-question').value.trim(), image: pastedImage, options: ['#preview-a','#preview-b','#preview-c','#preview-d'].map(selector => document.querySelector(selector).value.trim()), correct: Number(document.querySelector('#preview-correct').value) });
    event.target.reset(); clearImage(); renderQuizList(); openQuiz(previewQuizzes.indexOf(activeQuiz));
  });
  document.querySelector('#preview-paste-zone').addEventListener('paste', event => {
    const item = [...(event.clipboardData?.items || [])].find(entry => entry.type.startsWith('image/'));
    if (!item) return;
    event.preventDefault();
    const reader = new FileReader();
    reader.onload = () => { pastedImage = reader.result; document.querySelector('#preview-pasted-image-img').src = pastedImage; document.querySelector('#preview-pasted-image').hidden = false; document.querySelector('#preview-paste-zone').hidden = true; };
    reader.readAsDataURL(item.getAsFile());
  });
  document.querySelector('#preview-paste-zone').addEventListener('click', event => event.currentTarget.focus());
  document.querySelector('#preview-remove-image').addEventListener('click', clearImage);
})();
