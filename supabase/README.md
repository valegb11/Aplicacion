# Supabase de ChemQuest

Esta carpeta conserva la estructura de la base de datos como archivos de texto.
Así podemos saber exactamente qué se creó y repetirlo si fuera necesario.

## Archivos y orden

`01_profiles.sql` crea:

- los roles `student`, `teacher` y `admin`;
- la tabla `profiles`;
- un perfil automático cuando una persona se registra;
- reglas para que cada persona solo consulte su propia ficha;
- una restricción que impide cambiar el rol desde la página web.

`02_classrooms_and_modules.sql` crea:

- los grados asignados al docente, limitados a 8.º y 10.º;
- salones pertenecientes a docentes;
- módulos o clases reutilizables;
- inscripciones de estudiantes en salones;
- ingreso seguro de estudiantes mediante un código numérico de 6 dígitos;
- asignaciones de módulos a salones;
- reglas para que cada persona vea o modifique únicamente lo permitido;
- acceso del docente a los perfiles de los estudiantes de sus propios salones.

Este segundo archivo se aplicó el 21 de septiembre de 2026. Se verificaron las
ocho tablas académicas con RLS activado, el rol docente y los grados 8 y 10 de
la cuenta predeterminada. El acceso por código requiere autenticación.
La tabla interna `private.teacher_defaults` también tiene RLS activado y no
concede acceso directo a los roles `anon` ni `authenticated`.

Después de ejecutarlo, `verify_02_classrooms_and_modules.sql` comprueba las
tablas y sus reglas sin modificar información. `TOMORROW_CHECKLIST.md` contiene
el orden recomendado para la siguiente sesión.

`03_share_teacher_content.sql` crea la relación entre salones y quizzes,
comparte automáticamente las clases y quizzes con los salones del mismo grado,
y permite que los estudiantes lean únicamente los quizzes publicados y sus
preguntas. También vincula el contenido que existía antes de ejecutar el archivo.

Ejecuta los archivos en orden y solo después de revisar cada paso. Nunca pegues
aquí contraseñas, claves `secret` o `service_role`.
