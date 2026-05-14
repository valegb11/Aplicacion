---

## ChemQuest — Contexto del Proyecto

### ¿Qué es?
Una **aplicación web educativa gamificada** (HTML + CSS + JavaScript puro, un solo archivo) para enseñar química inorgánica a estudiantes de 8° y 10° grado. Inspirada en Duolingo pero con estética de videojuego RPG espacial (fondo oscuro, estrellas, partículas).

---

### Arquitectura
- **Un solo archivo `.html`** sin frameworks, sin dependencias externas (excepto Google Fonts)
- **4 pantallas** gestionadas con clases CSS `.screen` / `.screen.active`:
  - `screen-home` — mapa de lecciones, stats, logros
  - `screen-lesson` — slides educativos + desafío tabla periódica (grado 10)
  - `screen-quiz` — cuestionario de 5 preguntas con temporizador
  - `screen-results` — resultados, XP ganado, revisión de respuestas
- **Persistencia**: todo el progreso se guarda en `localStorage` con la clave `chemquest_v3`

---

### Sistema de gamificación
| Elemento | Detalle |
|---|---|
| XP | 30 XP por respuesta correcta, +50 bonus quiz perfecto, +20 bonus 3 estrellas |
| Estrellas | 1★ (1-2 correctas), 2★ (3-4), 3★ (5/5) |
| Niveles | 10 niveles, XP requerido: `[0,200,500,900,1400,2000,2700,3500,4400,5400]` |
| Racha | Días consecutivos jugando |
| Logros | 7 logros desbloqueables |
| Penalización | <3★ → XP reducido, nodo marcado en naranja con el XP perdido |
| Recuperación | Repetir con mejores estrellas → recupera XP diferencial + 25 XP bonus |
| Desbloqueo | Siguiente lección se desbloquea **solo si consigues 3★**; si no, hay que repetir |

---

### Contenido — 6 lecciones por grado

Cada lección tiene:
1. **2 slides** con ilustración SVG inline, texto explicativo, caja de highlight y chips de fórmulas
2. **Desafío tabla periódica** (solo grado 10, antes del quiz)
3. **Quiz de 5 preguntas** con 4 opciones, temporizador de 20s y retroalimentación inmediata

| Día | Tema | Grado 8 | Grado 10 |
|---|---|---|---|
| 1 | Estructura Atómica | Modelos atómicos, partículas, Z y A | Orbitales s/p/d/f, configuración electrónica, anomalías |
| 2 | Tabla Periódica | Grupos, períodos, metales/no-metales | Bloques, tendencias periódicas, electronegatividad |
| 3 | Tipos de Reacciones | Síntesis, descomposición, combustión | Redox, número de oxidación, velocidad de reacción |
| 4 | Balanceo de Ecuaciones | Método de tanteo | Método redox, semirreacciones, medio ácido/básico |
| 5 | Estequiometría | Mol, Avogadro, n=m/M | Reactivo limitante, rendimiento%, molaridad |
| 6 | Termodinámica | Exo/endotérmica, ΔH, 1ª Ley | ΔG=ΔH−TΔS, Ley de Hess, q=mcΔT |

---

### Desafío Tabla Periódica (Grado 10)

Aparece entre los slides y el quiz en las lecciones de grado 10. Consiste en **5 preguntas aleatorias** del pool `PT_CHALLENGES_10`:
- El estudiante ve el símbolo + número atómico de un elemento
- Debe encontrar en **la tabla periódica interactiva** el grupo, período o bloque correcto (haciendo clic en la tabla)
- Para **configuración electrónica**: se muestran 4 opciones tipo quiz
- La tabla tiene 18 columnas × 7 filas, coloreada por bloques (s=azul, p=morado, d=cyan, f=naranja)
- Pool actual: Na, Cl, Fe, Ca, Ne, Cu, S, K — preguntas sobre grupo, período, bloque o configuración

---

### Estructura del estado (`localStorage`)
```js
{
  grade: 8 | 10,
  totalXP: number,
  level: number,          // 1-10
  streak: number,         // días consecutivos
  lastPlayDate: string,   // new Date().toDateString()
  completedDays: [],      // array de IDs: "d8-1", "d8-2"...
  dayResults: {           // clave = dayId
    "d8-1": {
      score: 4,           // respuestas correctas (0-5)
      stars: 2,           // 1, 2 o 3
      xp: 120,            // XP base ganado
      lostXP: 100,        // XP perdido por <3★
      perfect: false,
      date: "13/5/2026",
      timeSeconds: 67
    }
  },
  perfectQuizzes: number,
  unlockedAch: [],        // IDs de logros
  ptChallengesDone: number
}
```

---

### Mantenimiento del contexto

- Toda modificación funcional, de UX, arquitectura, datos, reglas de gamificación o persistencia debe reflejarse en este archivo cuando sea relevante.
- Si un cambio no impacta comportamiento/documentación del proyecto (por ejemplo ajustes menores visuales sin efecto funcional), no requiere actualización obligatoria.
- Cada actualización debe ser puntual: qué cambió, dónde cambió y por qué.

---

### Mejoras pendientes sugeridas para continuar
1. **Más elementos en el desafío PT** — expandir el pool de 8 a 30+ elementos
2. **Animaciones de transición** entre pantallas (actualmente es corte directo)
3. **Modo repaso** — sesión especial que mezcla preguntas de lecciones anteriores
4. **Sonidos** — usar Web Audio API para efectos de correcto/incorrecto/nivel
5. **Tabla periódica completa** — los 118 elementos en el desafío, no solo ~45
6. **Estadísticas detalladas** — pantalla con gráficas de progreso por tema
7. **Más preguntas por lección** — banco de 10-15 preguntas del que se escogen 5 aleatoriamente cada vez
8. **Modo profesor** — panel para ver el progreso de varios estudiantes (requiere backend)