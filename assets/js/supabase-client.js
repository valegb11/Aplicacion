// Dirección pública del proyecto ChemQuest en Supabase.
const SUPABASE_URL = 'https://xkeghjvtjgonmnnpeexn.supabase.co';

// Esta clave es publicable. La seguridad de los datos se controlará con
// permisos (Row Level Security) dentro de Supabase.
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_aBmZrRxy54MttxDSVpUtQw_hrmElazZ';

// Cliente compartido que usaremos más adelante para autenticación y datos.
// Si la librería externa no carga, ChemQuest puede seguir funcionando y
// mostrará una advertencia útil durante el desarrollo.
if (window.supabase?.createClient) {
  window.chemquestSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
} else {
  console.warn('Supabase no pudo cargarse. ChemQuest continuará en modo local.');
}
