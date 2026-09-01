const authScreen = document.getElementById('auth-screen');
const appShell = document.getElementById('app-shell');
const googleLoginButton = document.getElementById('google-login-btn');
const logoutButton = document.getElementById('logout-btn');
const authStatus = document.getElementById('auth-status');
const accountChip = document.getElementById('account-chip');

async function showAccount(session) {
  accountChip.hidden = !session;
  accountChip.textContent = '';

  if (!session) return;

  const { data: profile, error } = await window.chemquestSupabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('No se pudo cargar el perfil:', error.message);
    accountChip.textContent = session.user.email || 'Cuenta de Google';
    return;
  }

  accountChip.textContent = profile.full_name || profile.email;
  accountChip.title = profile.email;
}

function showAuthenticatedApp(isAuthenticated, session = null) {
  authScreen.hidden = isAuthenticated;
  appShell.hidden = !isAuthenticated;
  logoutButton.hidden = !isAuthenticated;
  showAccount(session);
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
  logoutButton.disabled = true;
  const { error } = await window.chemquestSupabase.auth.signOut();
  logoutButton.disabled = false;

  if (error) {
    console.error('No se pudo cerrar la sesión:', error.message);
  }
}

async function initializeAuthentication() {
  // Durante desarrollo, ChemQuest sigue disponible en modo local si la
  // librería externa no pudo cargarse.
  if (!window.chemquestSupabase) {
    showAuthenticatedApp(true);
    return;
  }

  appShell.hidden = true;
  authScreen.hidden = false;
  authStatus.textContent = 'Comprobando tu sesión…';

  const { data, error } = await window.chemquestSupabase.auth.getSession();
  if (error) {
    authStatus.textContent = 'No pudimos comprobar tu sesión. Intenta nuevamente.';
    return;
  }

  authStatus.textContent = '';
  showAuthenticatedApp(Boolean(data.session), data.session);

  window.chemquestSupabase.auth.onAuthStateChange((_event, session) => {
    authStatus.textContent = '';
    googleLoginButton.disabled = false;
    showAuthenticatedApp(Boolean(session), session);
  });
}

googleLoginButton.addEventListener('click', signInWithGoogle);
logoutButton.addEventListener('click', signOut);
initializeAuthentication();
