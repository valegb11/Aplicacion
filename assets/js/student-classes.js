(() => {
  const section = document.getElementById('student-classes');
  const list = document.getElementById('student-class-list');
  const status = document.getElementById('student-class-status');
  const quizList = document.getElementById('student-quiz-list');
  const quizStatus = document.getElementById('student-quiz-status');
  let classroomId = null;
  let revision = 0;
  let currentQuestions = [];
  let currentModules = [];
  let activeModule = null;
  let lessonSlides = [];
  let lessonSlide = 0;
  let lessonCheckAnswered = false;

  const lessonScreen = document.getElementById('screen-teacher-lesson');
  const lessonContent = document.getElementById('teacher-lesson-content');
  const lessonLabel = document.getElementById('teacher-lesson-label');
  const lessonProgress = document.getElementById('teacher-lesson-progress');

  function makeSlides(module) {
    const source = (module.description || 'Esta clase todavía no tiene contenido.').trim();
    const paragraphs = source.split(/\n\s*\n/).map(value => value.trim()).filter(Boolean);
    const chunks = [];
    for (const paragraph of paragraphs.length ? paragraphs : [source]) {
      if (paragraph.length <= 520) { chunks.push(paragraph); continue; }
      const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [paragraph];
      let chunk = '';
      for (const sentence of sentences) {
        if (chunk && `${chunk} ${sentence}`.length > 520) { chunks.push(chunk.trim()); chunk = sentence; }
        else chunk += `${chunk ? ' ' : ''}${sentence.trim()}`;
      }
      if (chunk.trim()) chunks.push(chunk.trim());
    }
    const contentSlides = chunks.map((text, index) => ({
      eyebrow: `📖 EXPLICACIÓN ${index + 1} / ${chunks.length}`,
      title: index === 0 ? module.title : `Continuemos con ${module.title}`,
      text,
      icon: index === 0 ? '🧪' : index % 2 ? '🔎' : '💡'
    }));
    return [...contentSlides, { eyebrow: '⚡ COMPROBACIÓN RÁPIDA', title: 'Antes de terminar…', check: true, text: `¿Qué tan claro quedó el tema “${module.title}”?` }];
  }

  function extractFormulas(text) {
    return [...new Set((text.match(/\b(?:\d*[A-ZÁÉÍÓÚ][a-z]?\d*)+(?:\s*[+→=]\s*(?:\d*[A-ZÁÉÍÓÚ][a-z]?\d*)+)+\b/g) || []).slice(0, 4))];
  }

  function renderTeacherLesson() {
    const slide = lessonSlides[lessonSlide];
    const completed = window.chemquestIsTeacherClassComplete?.(activeModule.id);
    lessonLabel.textContent = activeModule.title.toUpperCase();
    lessonProgress.style.width = `${((lessonSlide + 1) / lessonSlides.length) * 100}%`;
    lessonContent.replaceChildren();
    const card = document.createElement('article'); card.className = 'slide-card';
    const eyebrow = document.createElement('div'); eyebrow.className = 'slide-eyebrow'; eyebrow.textContent = slide.eyebrow;
    const title = document.createElement('h1'); title.className = 'slide-title'; title.textContent = slide.title;
    card.append(eyebrow, title);
    if (slide.check) {
      const question = document.createElement('p'); question.className = 'slide-text'; question.textContent = slide.text;
      const choices = document.createElement('div'); choices.className = 'teacher-lesson-check';
      for (const label of ['Lo entendí y puedo explicarlo', 'Necesito volver a repasarlo']) {
        const choice = document.createElement('button'); choice.type = 'button'; choice.textContent = label;
        choice.addEventListener('click', () => { choices.querySelectorAll('button').forEach(button => button.classList.remove('selected')); choice.classList.add('selected'); lessonCheckAnswered = true; const finish = card.querySelector('[data-finish-lesson]'); if (finish) finish.disabled = false; });
        choices.append(choice);
      }
      const tip = document.createElement('div'); tip.className = 'teacher-lesson-tip'; tip.textContent = '💡 Puedes regresar a cualquier pantalla antes de completar la clase.';
      card.append(question, choices, tip);
    } else {
      const visual = document.createElement('div'); visual.className = 'teacher-lesson-visual';
      const formulas = extractFormulas(slide.text);
      if (formulas.length) {
        const formulaWrap = document.createElement('div'); formulaWrap.className = 'teacher-lesson-formulas';
        formulas.forEach(value => { const formula = document.createElement('span'); formula.className = 'teacher-lesson-formula'; formula.textContent = value; formulaWrap.append(formula); });
        visual.append(formulaWrap);
      } else { const icon = document.createElement('span'); icon.className = 'teacher-lesson-visual-icon'; icon.textContent = slide.icon; visual.append(icon); }
      const copy = document.createElement('p'); copy.className = 'slide-text'; copy.style.whiteSpace = 'pre-wrap'; copy.textContent = slide.text;
      const tip = document.createElement('div'); tip.className = 'teacher-lesson-tip'; tip.textContent = lessonSlide === 0 ? '💡 Lee con calma. El contenido está dividido para que sea más fácil de comprender.' : '💡 Relaciona esta explicación con lo que viste en la pantalla anterior.';
      card.append(visual, copy, tip);
    }
    const actions = document.createElement('div'); actions.className = 'teacher-lesson-actions';
    const previous = document.createElement('button'); previous.type = 'button'; previous.className = 'teacher-secondary-btn'; previous.textContent = '← Anterior'; previous.disabled = lessonSlide === 0;
    previous.addEventListener('click', () => { lessonSlide--; renderTeacherLesson(); });
    const next = document.createElement('button'); next.type = 'button'; next.className = 'teacher-primary-btn';
    next.textContent = lessonSlide === lessonSlides.length - 1 ? (completed ? '✓ Clase completada' : 'Completar clase · +30 XP') : 'Siguiente →'; next.disabled = Boolean(completed && lessonSlide === lessonSlides.length - 1);
    if (lessonSlide === lessonSlides.length - 1) { next.dataset.finishLesson = 'true'; if (!completed && !lessonCheckAnswered) next.disabled = true; }
    next.addEventListener('click', () => {
      if (lessonSlide < lessonSlides.length - 1) { lessonSlide++; renderTeacherLesson(); return; }
      if (window.chemquestCompleteTeacherClass?.(activeModule.id)) { next.textContent = '✓ Clase completada'; next.disabled = true; status.textContent = 'Clase completada. Ganaste 30 XP.'; }
    });
    actions.append(previous, next); card.append(actions); lessonContent.append(card);
    const dots = document.createElement('div'); dots.className = 'teacher-lesson-dots';
    lessonSlides.forEach((_, index) => { const dot = document.createElement('i'); if (index === lessonSlide) dot.className = 'active'; dots.append(dot); }); lessonContent.append(dots);
  }

  function openTeacherLesson(module) {
    activeModule = module; lessonSlides = makeSlides(module); lessonSlide = 0; lessonCheckAnswered = false;
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    lessonScreen.classList.add('active'); window.scrollTo({ top: 0 }); renderTeacherLesson();
  }

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
      list.replaceChildren(); currentModules = [];
      for (const row of data || []) {
        const module = row.study_modules;
        if (!module) continue;
        currentModules.push(module);
        const launch = document.createElement('button'); launch.type = 'button'; launch.className = 'student-class-launch'; launch.dataset.moduleId = module.id;
        const completed = window.chemquestIsTeacherClassComplete?.(module.id);
        if (completed) launch.classList.add('is-complete');
        const icon = document.createElement('span'); icon.textContent = completed ? '✓' : '🧪';
        const info = document.createElement('span'); const title = document.createElement('strong'); title.textContent = module.title; const meta = document.createElement('small'); meta.textContent = completed ? 'Clase completada · Puedes volver a verla' : 'Clase interactiva · 30 XP'; info.append(title, meta);
        const arrow = document.createElement('span'); arrow.textContent = completed ? 'Repasar' : 'Comenzar →';
        launch.append(icon, info, arrow); list.append(launch);
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
    reset() { classroomId = null; revision++; currentModules = []; activeModule = null; section.hidden = true; list.replaceChildren(); quizList.replaceChildren(); status.textContent = ''; quizStatus.textContent = ''; }
  };
  list.addEventListener('click', event => {
    const button = event.target.closest('[data-module-id]');
    if (!button) return;
    const module = currentModules.find(item => item.id === button.dataset.moduleId); if (module) openTeacherLesson(module);
  });
  document.getElementById('teacher-lesson-back').addEventListener('click', () => { window.goHome(); refresh(); });
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
