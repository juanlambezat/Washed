# Washed 🏋️

**Washed** es una PWA (aplicación web instalable) para registrar entrenamientos de gimnasio. Está hecha en JavaScript, HTML y CSS puros — sin frameworks, sin build, sin dependencias — y funciona sin conexión una vez cargada.

No requiere backend ni cuenta: todo se guarda en el propio dispositivo.

## Funciones principales

**Entrenar**
- Registro de series con peso y repeticiones, tipos de serie (normal, calentamiento, al fallo, descanso-pausa) y superseries.
- Tres modos extra de ejercicio además del clásico peso × repeticiones: **peso corporal + lastre** (dominadas, fondos), **asistido** (máquina de asistencia) y **por tiempo** (plancha, isométricos), cada uno con su propio cronómetro, unidades y cálculo de récord.
- Sugerencia de progresión automática, copiar la serie anterior con un toque, reemplazar un ejercicio sin perder el progreso de la sesión.
- Timer de descanso configurable por ejercicio, con dock fijo en pantalla, sonidos personalizables, vibración y una tarjeta en la pantalla de bloqueo (vía Media Session).
- Detección de récords de peso y de volumen en tiempo real, con confeti y aviso de valores sospechosos.
- Aviso si un entrenamiento quedó abierto por error durante muchas horas, con ajuste de la duración real al cerrarlo.
- Pantalla del dispositivo encendida durante el entreno (Wake Lock).

**Rutinas**
- Editor de rutinas con reordenamiento por arrastre, superseries y asignación a días de la semana.
- 9 plantillas prearmadas (Push/Pull/Legs, Torso/Pierna, Full Body, 5×5, calistenia, etc.).
- Compartir una rutina por link o código, e importar la de otra persona.

**Historial**
- Calendario mensual y anual con las figuras musculares trabajadas cada día.
- Edición de entrenamientos ya guardados (series, ejercicios, nombre y duración).
- Comparación lado a lado de dos entrenamientos.
- Compartir un entrenamiento como imagen generada al vuelo.

**Récords y Progreso**
- Récords personales por ejercicio (peso, volumen, 1RM estimado).
- Gráficos de evolución, volumen semanal y peso corporal.
- Resumen por semana o mes, con comparación contra el período anterior y un dato curioso generado a partir del historial.
- Objetivos (peso, 1RM, peso corporal, frecuencia semanal) con barra de progreso y fecha estimada.
- 57 insignias por constancia, fuerza, volumen, variedad y logros especiales.

**Catálogo de ejercicios**
- Más de 170 ejercicios con categoría, equipo y músculos secundarios.
- Ejercicios propios totalmente editables (nombre, categoría, músculo, equipo, modo).
- Selector con favoritos, recientes y filtro por equipo.
- Video de técnica correcta por ejercicio (YouTube).

**Datos y ajustes**
- Exportar/importar un backup completo en JSON, y exportar el historial a CSV.
- Recordatorio de backup si hace mucho que no se exporta.
- Solicitud de almacenamiento persistente para que el navegador no borre los datos.
- Modo claro/oscuro y 5 colores de acento.
- Unidad de peso kg/lb.

## ¿Cómo la utilizo?

No hace falta instalar nada. Como es solo HTML/CSS/JS estático, alcanza con ingresar al siguiente enlace para acceder a la página tanto de manera móvil o en escritorio.

**[Ingresar a la aplicación Washed.](https://juanlambezat.github.io/Washed/)**

Además, al ser una Aplicación Web Progresiva (PWA), puedes instalarla en tu dispositivo (celular o computadora) como si fuera una app nativa. Solo necesitas abrir el enlace anterior desde tu navegador y buscar la opción "Instalar" o "Agregar a la pantalla de inicio" en el menú.

## Estructura del proyecto

```
index.html      Estructura de la página y metadatos de la PWA
manifest.json    Metadatos de instalación (nombre, íconos, colores)
sw.js            Service worker: caché para uso offline

styles.css       Todos los estilos (variables de tema, layout, animaciones)

catalog.js       Catálogo de ejercicios, plantillas de rutinas (datos puros)
features.js      Sonidos, pantalla encendida, backup, ajustes (utilidades)
exercises.js     Selector de ejercicios, ejercicios propios, cronómetro
routines.js      Plantillas y compartir/importar rutinas
stats.js         Resumen, comparaciones, objetivos, insignias, imagen para compartir
app.js           Estado de la app, render de cada pestaña, lógica de récords

musculos/        Ilustraciones anatómicas (figura + máscara por grupo muscular)
```

Los archivos JS se cargan en ese orden desde `index.html`: `catalog.js` y `features.js` solo definen datos y funciones de apoyo; `app.js` es el que arranca la aplicación al final.

## Datos y privacidad

Todo se guarda en el dispositivo (IndexedDB, con reserva a `localStorage` si no está disponible) — no se envía a ningún servidor. Por eso conviene exportar un backup de tanto en tanto (la app lo recuerda sola después de un tiempo); si se borran los datos del navegador o se cambia de dispositivo, se pierde el historial salvo que se haya exportado antes.

## Estado

Proyecto personal en desarrollo activo. No probado todavía en un dispositivo móvil real (solo en navegador de escritorio) para las funciones que dependen del hardware: pantalla de bloqueo, vibración y pantalla siempre encendida.
