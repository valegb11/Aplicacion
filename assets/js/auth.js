const authScreen = document.getElementById('auth-screen');
const appShell = document.getElementById('app-shell');
const teacherShell = document.getElementById('teacher-shell');
const studentJoinScreen = document.getElementById('student-join-screen');
const studentJoinForm = document.getElementById('student-join-form');
const studentClassroomCode = document.getElementById('student-classroom-code');
const studentJoinButton = document.getElementById('student-join-btn');
const studentJoinStatus = document.getElementById('student-join-status');
const googleLoginButton = document.getElementById('google-login-btn');
const googleRegisterButton = document.getElementById('google-register-btn');
const registerForm = document.getElementById('register-form');
const registerName = document.getElementById('register-name');
const registerEmail = document.getElementById('register-email');
const registerClassroomCode = document.getElementById('register-classroom-code');
const registerSubmitButton = document.getElementById('register-submit-btn');
const registerCancelButton = document.getElementById('register-cancel-btn');
const logoutButtons = document.querySelectorAll('#logout-btn, #teacher-logout-btn, #student-join-logout-btn');
const authStatus = document.getElementById('auth-status');
const accountChip = document.getElementById('account-chip');
const DEFAULT_TEACHER_EMAIL = 'valentina.gonzalez@gimsaber.edu.co';
let displayedUserId = null;

function isDefaultTeacher(profile, session) {
  const email = (profile.email || session.user.email || '').trim().toLowerCase();
  return profile.role === 'teacher' || email === DEFAULT_TEACHER_EMAIL;
}

function setLogoutState(isAuthenticated) {
  logoutButtons.forEach(button => {
    button.hidden = !isAuthenticated;
    button.disabled = false;
  });
}

function showStudentAccount(profile, session) {
  accountChip.hidden = false;
  accountChip.textContent = profile.full_name || profile.email || session.user.email || 'Cuenta de Google';
  accountChip.title = profile.email || session.user.email || '';
  window.chemquestCurrentStudentId = profile.id;
  window.chemquestLoadCloudProgress?.(profile.id);
}

async function getStudentClassroom(studentId) {
  const { data, error } = await window.chemquestSupabase
    .from('classroom_members')
    .select('classroom_id, joined_at, classrooms(id, name, grade)')
    .eq('student_id', studentId)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.classrooms || null;
}

function showStudentClassroom(profile, session, classroom) {
  authScreen.hidden = true;
  studentJoinScreen.hidden = true;
  teacherShell.hidden = true;
  appShell.hidden = false;
  showStudentAccount(profile, session);
  window.chemquestSetStudentGrade?.(classroom.grade);
}

function showStudentJoin() {
  authScreen.hidden = true;
  appShell.hidden = true;
  teacherShell.hidden = true;
  studentJoinScreen.hidden = false;
  studentJoinStatus.textContent = '';
  studentClassroomCode.value = '';
  setTimeout(() => studentClassroomCode.focus(), 0);
}

function showSignedOut() {
  displayedUserId = null;
  authScreen.hidden = false;
  appShell.hidden = true;
  teacherShell.hidden = true;
  studentJoinScreen.hidden = true;
  accountChip.hidden = true;
  setLogoutState(false);
  window.chemquestTeacher?.reset();
  window.chemquestCurrentStudentId = null;
}

async function showAuthenticatedExperience(session) {
  const { data: profile, error } = await window.chemquestSupabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('No se pudo cargar el perfil:', error.message);
    showSignedOut();
    authStatus.textContent = 'Tu cuenta inició sesión, pero no pudimos cargar su perfil. Verifica la configuración de Supabase.';
    return;
  }

  authScreen.hidden = true;
  setLogoutState(true);

  const pendingRegistrationRaw = sessionStorage.getItem('chemquest_pending_registration');
  if (pendingRegistrationRaw && !isDefaultTeacher(profile, session)) {
    const pendingRegistration = JSON.parse(pendingRegistrationRaw);
    const googleEmail = (session.user.email || '').trim().toLowerCase();
    if (googleEmail !== pendingRegistration.email) {
      sessionStorage.removeItem('chemquest_pending_registration');
      await window.chemquestSupabase.auth.signOut();
      showSignedOut();
      authStatus.textContent = 'El correo elegido en Google no coincide con el correo del registro. Intenta nuevamente.';
      return;
    }
    const profileResult = await window.chemquestSupabase.from('profiles')
      .update({ full_name: pendingRegistration.name })
      .eq('id', session.user.id);
    if (profileResult.error) {
      showStudentJoin();
      studentJoinStatus.textContent = `No pudimos guardar tu nombre: ${profileResult.error.message}`;
      return;
    }
    const joinResult = await window.chemquestSupabase.rpc('join_classroom_by_code', { requested_code: pendingRegistration.code });
    if (joinResult.error) {
      showStudentJoin();
      studentClassroomCode.value = pendingRegistration.code;
      studentJoinStatus.textContent = joinResult.error.message.includes('no es válido') ? 'El código del salón no es válido.' : `No pudimos completar el registro: ${joinResult.error.message}`;
      return;
    }
    sessionStorage.removeItem('chemquest_pending_registration');
    profile.full_name = pendingRegistration.name;
  }

  if (isDefaultTeacher(profile, session)) {
    appShell.hidden = true;
    teacherShell.hidden = false;
    await window.chemquestTeacher.initialize(profile, session);
    return;
  }

  teacherShell.hidden = true;
  try {
    const classroom = await getStudentClassroom(profile.id);
    if (classroom) showStudentClassroom(profile, session, classroom);
    else showStudentJoin();
  } catch (classroomError) {
    console.error('No se pudo comprobar el salón:', classroomError.message);
    showStudentJoin();
    studentJoinStatus.textContent = 'No pudimos consultar tu salón. Verifica la configuración de Supabase.';
  }
}

async function joinStudentClassroom(event) {
  event.preventDefault();
  const code = studentClassroomCode.value.replace(/\D/g, '').slice(0, 6);
  studentClassroomCode.value = code;
  if (code.length !== 6) {
    studentJoinStatus.textContent = 'El código debe tener 6 dígitos.';
    return;
  }
  studentJoinButton.disabled = true;
  studentJoinStatus.textContent = 'Buscando tu salón…';
  const { error } = await window.chemquestSupabase.rpc('join_classroom_by_code', { requested_code: code });
  if (error) {
    studentJoinStatus.textContent = error.message.includes('no es válido') ? 'El código del salón no es válido.' : `No pudimos unirte al salón: ${error.message}`;
    studentJoinButton.disabled = false;
    return;
  }
  const { data: { session } } = await window.chemquestSupabase.auth.getSession();
  if (session) await showAuthenticatedExperience(session);
  studentJoinButton.disabled = false;
}

async function signInWithGoogle(isRegistration = false) {
  googleLoginButton.disabled = true;
  googleRegisterButton.disabled = true;
  authStatus.textContent = isRegistration ? 'Abriendo el registro seguro de Google…' : 'Abriendo el acceso seguro de Google…';

  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await window.chemquestSupabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });

  if (error) {
    authStatus.textContent = `No se pudo iniciar sesión: ${error.message}`;
    googleLoginButton.disabled = false;
    googleRegisterButton.disabled = false;
  }
}

function openRegisterForm() {
  registerForm.hidden = false;
  googleRegisterButton.hidden = true;
  authStatus.textContent = '';
  registerName.focus();
}

function closeRegisterForm() {
  registerForm.hidden = true;
  googleRegisterButton.hidden = false;
  registerForm.reset();
  authStatus.textContent = '';
}

async function beginRegistration(event) {
  event.preventDefault();
  const name = registerName.value.trim().replace(/\s+/g, ' ');
  const email = registerEmail.value.trim().toLowerCase();
  const code = registerClassroomCode.value.replace(/\D/g, '').slice(0, 6);
  if (name.length < 3 || !registerEmail.validity.valid || code.length !== 6) {
    authStatus.textContent = 'Completa tu nombre, correo y el código de 6 dígitos.';
    return;
  }
  sessionStorage.setItem('chemquest_pending_registration', JSON.stringify({ name, email, code }));
  registerSubmitButton.disabled = true;
  await signInWithGoogle(true);
  registerSubmitButton.disabled = false;
}

async function signOut() {
  logoutButtons.forEach(button => { button.disabled = true; });
  const { error } = await window.chemquestSupabase.auth.signOut();

  if (error) {
    console.error('No se pudo cerrar la sesión:', error.message);
    logoutButtons.forEach(button => { button.disabled = false; });
  }
}

async function handleSession(session) {
  authStatus.textContent = '';
  googleLoginButton.disabled = false;
  googleRegisterButton.disabled = false;

  if (!session) {
    showSignedOut();
    return;
  }

  authScreen.hidden = false;
  appShell.hidden = true;
  teacherShell.hidden = true;
  studentJoinScreen.hidden = true;
  authStatus.textContent = 'Preparando tu espacio…';
  await showAuthenticatedExperience(session);
  if (authScreen.hidden) displayedUserId = session.user.id;
}

async function initializeAuthentication() {
  // Durante desarrollo, ChemQuest sigue disponible en modo local si la
  // librería externa no pudo cargarse.
  if (!window.chemquestSupabase) {
    authScreen.hidden = true;
    appShell.hidden = false;
    teacherShell.hidden = true;
    return;
  }

  showSignedOut();
  authStatus.textContent = 'Comprobando tu sesión…';

  const { data, error } = await window.chemquestSupabase.auth.getSession();
  if (error) {
    authStatus.textContent = 'No pudimos comprobar tu sesión. Intenta nuevamente.';
    return;
  }

  await handleSession(data.session);

  window.chemquestSupabase.auth.onAuthStateChange((_event, session) => {
    // Google/Supabase can reaffirm the same session when the tab regains focus.
    // Keep the current view and drafts; only rebuild for a different account.
    setTimeout(() => {
      if (session && session.user.id === displayedUserId) return;
      handleSession(session);
    }, 0);
  });
}

googleLoginButton.addEventListener('click', () => signInWithGoogle(false));
googleRegisterButton.addEventListener('click', openRegisterForm);
registerForm.addEventListener('submit', beginRegistration);
registerCancelButton.addEventListener('click', closeRegisterForm);
registerClassroomCode.addEventListener('input', () => {
  registerClassroomCode.value = registerClassroomCode.value.replace(/\D/g, '').slice(0, 6);
});
studentJoinForm.addEventListener('submit', joinStudentClassroom);
studentClassroomCode.addEventListener('input', () => {
  studentClassroomCode.value = studentClassroomCode.value.replace(/\D/g, '').slice(0, 6);
});
logoutButtons.forEach(button => button.addEventListener('click', signOut));
initializeAuthentication();
