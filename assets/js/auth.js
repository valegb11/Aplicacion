const authScreen = document.getElementById('auth-screen');
const appShell = document.getElementById('app-shell');
const teacherShell = document.getElementById('teacher-shell');
const googleLoginButton = document.getElementById('google-login-btn');
const logoutButtons = document.querySelectorAll('#logout-btn, #teacher-logout-btn');
const authStatus = document.getElementById('auth-status');
const accountChip = document.getElementById('account-chip');

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
}

function showSignedOut() {
  authScreen.hidden = false;
  appShell.hidden = true;
  teacherShell.hidden = true;
  accountChip.hidden = true;
  setLogoutState(false);
  window.chemquestTeacher?.reset();
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

  if (profile.role === 'teacher') {
    appShell.hidden = true;
    teacherShell.hidden = false;
    await window.chemquestTeacher.initialize(profile, session);
    return;
  }

  teacherShell.hidden = true;
  appShell.hidden = false;
  showStudentAccount(profile, session);
}

async function signInWithGoogle() {
  googleLoginButton.disabled = true;
  authStatus.textContent = 'Abriendo el acceso seguro de Google…';

  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await window.chemquestSupabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });

  if (error) {
    authStatus.textContent = `No se pudo iniciar sesión: ${error.message}`;
    googleLoginButton.disabled = false;
  }
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

  if (!session) {
    showSignedOut();
    return;
  }

  authScreen.hidden = false;
  appShell.hidden = true;
  teacherShell.hidden = true;
  authStatus.textContent = 'Preparando tu espacio…';
  await showAuthenticatedExperience(session);
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
    setTimeout(() => handleSession(session), 0);
  });
}

googleLoginButton.addEventListener('click', signInWithGoogle);
logoutButtons.forEach(button => button.addEventListener('click', signOut));
initializeAuthentication();
