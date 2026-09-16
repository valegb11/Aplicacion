# Siguiente sesión: salones y módulos

Esta lista evita saltarnos pasos y protege lo que ya funciona.

1. Abrir ChemQuest publicado y confirmar que Google todavía permite entrar.
2. Revisar en Supabase el perfil que se usará como docente.
3. Cambiar únicamente ese perfil de `student` a `teacher` y asignarle el grado
   `8` o `10` en `assigned_grade`.
4. Leer juntos `02_classrooms_and_modules.sql` antes de ejecutarlo.
5. Ejecutar el archivo una sola vez desde el SQL Editor de Supabase.
6. Ejecutar `verify_02_classrooms_and_modules.sql`, que solo lee datos.
7. Confirmar que aparecen cuatro tablas y que todas tienen RLS activado.
8. Crear un salón de prueba y comprobar sus permisos.
   Confirmar que su código contiene exactamente 6 dígitos y que el docente no
   puede crear salones para un grado distinto del asignado.
9. Con una cuenta de estudiante, ejecutar `join_classroom_by_code` usando el
   código de ese salón y confirmar que aparece la inscripción.
10. Confirmar que el docente puede ver el nombre del estudiante inscrito, pero
    no perfiles de estudiantes ajenos a sus salones.
11. Confirmar que una cuenta anónima no puede consultar tablas ni ejecutar la
    función de inscripción.
12. Solo después, comenzar la interfaz para docentes en ChemQuest.

## Lo que no debemos hacer todavía

- No guardar notas ni resultados hasta definir cómo se relacionan con los módulos.
- No permitir que cualquier usuario se convierta en docente desde la aplicación.
- No publicar cambios nuevos antes de probarlos localmente.
- No copiar claves secretas dentro del repositorio o del chat.
