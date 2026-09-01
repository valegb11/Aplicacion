# Supabase de ChemQuest

Esta carpeta conserva la estructura de la base de datos como archivos de texto.
Así podemos saber exactamente qué se creó y repetirlo si fuera necesario.

## Primer archivo

`01_profiles.sql` crea:

- los roles `student`, `teacher` y `admin`;
- la tabla `profiles`;
- un perfil automático cuando una persona se registra;
- reglas para que cada persona solo consulte su propia ficha;
- una restricción que impide cambiar el rol desde la aplicación.

No ejecutes archivos de esta carpeta más de una vez sin revisar primero los
cambios. Nunca pegues aquí contraseñas, claves `secret` o `service_role`.
