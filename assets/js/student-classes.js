(() => {
  const section = document.getElementById('student-classes');
  const list = document.getElementById('student-class-list');
  const status = document.getElementById('student-class-status');
  const quizList = document.getElementById('student-quiz-list');
  const quizStatus = document.getElementById('student-quiz-status');
  let classroomId = null;
  let revision = 0;
  let currentQuestions = [];

  async function refresh() {
    if (!classroomId) return;
    const request = ++revision;
    status.textContent = 'Cargando clases…';
    try {
      const [{ data, error }, quizResult] = await Promise.all([
        window.chemquestSupabase.from('classroom_modules')
          .select('study_modules(id, title, description)').eq('classroom_id', classroomId),
        window.chemquestSupabase.from('classroom_quizzes')
          .select('teacher_quizzes(id, title, status)').eq('classroom_id', classroomId)
      ]);
      if (request !== revision) return;
      if (error) throw error;
      list.replaceChildren();
      for (const row of data || []) {
        const module = row.study_modules;
        if (!module) continue;
        const details = document.createElement('details');
        details.className = 'teacher-panel';
        const title = document.createElement('summary');
        title.textContent = module.title;
        const content = document.createElement('div');
        content.style.whiteSpace = 'pre-wrap';
        content.style.overflowWrap = 'anywhere';
        content.style.marginTop = '1rem';
        content.textContent = module.description || 'Esta clase todavía no tiene contenido.';
        const completeButton = document.createElement('button');
        const completed = window.chemquestIsTeacherClassComplete?.(module.id);
        completeButton.type = 'button'; completeButton.className = 'teacher-primary-btn student-complete-class';
        completeButton.dataset.moduleId = module.id;
        completeButton.textContent = completed ? '✓ Clase completada' : 'Marcar clase como completada · +30 XP';
        completeButton.disabled = Boolean(completed);
        details.append(title, content, completeButton);
        list.append(details);
      }
      status.textContent = list.childElementCount ? 'Selecciona una clase para leerla.' : 'Tu docente aún no ha compartido clases con este salón.';
      if (quizResult.error) throw quizResult.error;
      const quizzes = (quizResult.data || []).map(row => row.teacher_quizzes).filter(quiz => quiz?.status === 'published');
      const quizIds = quizzes.map(quiz => quiz.id);
      let questions = [];
      if (quizIds.length) {
        const questionResult = await window.chemquestSupabase.from('quiz_questions')
          .select('id, quiz_id, prompt, image_url, option_a, option_b, option_c, option_d, position')
          .in('quiz_id', quizIds).order('position', { ascending: true });
        if (questionResult.error) throw questionResult.error;
        questions = questionResult.data || [];
      }
      currentQuestions = questions;
      quizList.replaceChildren();
      for (const quiz of quizzes) {
        const details = document.createElement('details');
        details.className = 'teacher-panel';
        const title = document.createElement('summary');
        title.textContent = quiz.title;
        details.append(title);
        const quizQuestions = questions.filter(question => question.quiz_id === quiz.id);
        for (const [index, question] of quizQuestions.entries()) {
          const card = document.createElement('article');
          card.className = 'teacher-question-card';
          const heading = document.createElement('strong');
          heading.textContent = `${index + 1}. ${question.prompt}`;
          card.append(heading);
          if (question.image_url) {
            const image = document.createElement('img');
            image.className = 'teacher-question-image'; image.src = question.image_url; image.alt = `Imagen de la pregunta ${index + 1}`;
            card.append(image);
          }
          const options = document.createElement('div'); options.className = 'student-quiz-options';
          for (const [optionIndex, value] of [question.option_a, question.option_b, question.option_c, question.option_d].entries()) {
            const label = document.createElement('label');
            const input = document.createElement('input'); input.type = 'radio'; input.name = `quiz-${quiz.id}-question-${question.id}`; input.value = String(optionIndex);
            label.append(input, document.createTextNode(` ${String.fromCharCode(65 + optionIndex)}. ${value}`)); options.append(label);
          }
          card.append(options); details.append(card);
        }
        if (quizQuestions.length) {
          const submit = document.createElement('button'); submit.type = 'button'; submit.className = 'teacher-primary-btn student-submit-quiz'; submit.dataset.quizId = quiz.id; submit.textContent = 'Entregar quiz'; details.append(submit);
          const result = document.createElement('p'); result.className = 'student-quiz-result'; result.dataset.quizResult = quiz.id; details.append(result);
        } else details.append(document.createTextNode('Este quiz todavía no tiene preguntas.'));
        quizList.append(details);
      }
      quizStatus.textContent = quizList.childElementCount ? 'Selecciona un quiz para ver sus preguntas.' : 'Tu docente aún no ha publicado quizzes para este salón.';
    } catch (_error) {
      if (request === revision) {
        status.textContent = 'No pudimos cargar el contenido. Pulsa Actualizar para intentarlo de nuevo.';
        quizStatus.textContent = '';
      }
    }
  }
  window.chemquestStudentClasses = {
    load(id) { classroomId = id; section.hidden = false; list.replaceChildren(); refresh(); },
    reset() { classroomId = null; revision++; section.hidden = true; list.replaceChildren(); quizList.replaceChildren(); status.textContent = ''; quizStatus.textContent = ''; }
  };
  list.addEventListener('click', event => {
    const button = event.target.closest('[data-module-id]');
    if (!button || button.disabled) return;
    if (window.chemquestCompleteTeacherClass?.(button.dataset.moduleId)) {
      button.textContent = '✓ Clase completada'; button.disabled = true;
      status.textContent = 'Clase completada. Ganaste 30 XP.';
    }
  });
  quizList.addEventListener('click', async event => {
    const button = event.target.closest('[data-quiz-id]');
    if (!button) return;
    const quizId = button.dataset.quizId;
    const quizQuestions = currentQuestions.filter(question => question.quiz_id === quizId);
    const answers = quizQuestions.map(question => {
      const selected = quizList.querySelector(`input[name="quiz-${quizId}-question-${question.id}"]:checked`);
      return selected ? Number(selected.value) : null;
    });
    const resultNode = quizList.querySelector(`[data-quiz-result="${quizId}"]`);
    if (answers.some(answer => answer === null)) { resultNode.textContent = 'Responde todas las preguntas antes de entregar.'; return; }
    button.disabled = true; resultNode.textContent = 'Calificando…';
    const { data, error } = await window.chemquestSupabase.rpc('submit_teacher_quiz', { requested_quiz: quizId, submitted_answers: answers });
    if (error) { resultNode.textContent = `No pudimos guardar tu resultado: ${error.message}`; button.disabled = false; return; }
    const outcome = data || {};
    window.chemquestAwardTeacherQuizXP?.(outcome.awarded_xp);
    resultNode.textContent = `Resultado: ${outcome.score}/${outcome.total}. ${outcome.awarded_xp ? `Ganaste ${outcome.awarded_xp} XP.` : 'Ya habías obtenido este puntaje o uno mejor.'}`;
    button.textContent = 'Volver a entregar'; button.disabled = false;
  });
  document.getElementById('refresh-student-classes').addEventListener('click', refresh);
})();
