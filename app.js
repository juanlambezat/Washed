const EXERCISE_CATALOG = [
  { name: "Press de banca plano", cat: "Pecho" }, { name: "Press inclinado con mancuernas", cat: "Pecho" }, { name: "Aperturas en polea", cat: "Pecho" }, { name: "Fondos en paralelas (Pecho)", cat: "Pecho" }, { name: "Press declinado", cat: "Pecho" },
  { name: "Press de banca con mancuernas", cat: "Pecho" }, { name: "Press de pecho en máquina", cat: "Pecho" }, { name: "Cruce de poleas", cat: "Pecho" }, { name: "Flexiones de brazos", cat: "Pecho" }, { name: "Aperturas con mancuernas", cat: "Pecho" },
  { name: "Dominadas", cat: "Espalda" }, { name: "Remo con barra", cat: "Espalda" }, { name: "Jalón al pecho en polea", cat: "Espalda" }, { name: "Remo en polea baja", cat: "Espalda" }, { name: "Pull-over en polea", cat: "Espalda" },
  { name: "Remo en máquina", cat: "Espalda" }, { name: "Remo con mancuerna a un brazo", cat: "Espalda" }, { name: "Remo en T", cat: "Espalda" }, { name: "Jalón con agarre cerrado", cat: "Espalda" }, { name: "Hiperextensiones", cat: "Espalda" },
  { name: "Sentadilla libre", cat: "Piernas" }, { name: "Peso muerto convencional", cat: "Piernas" }, { name: "Prensa de piernas 45°", cat: "Piernas" }, { name: "Extensiones de cuádriceps", cat: "Piernas" }, { name: "Curl femoral tumbado", cat: "Piernas" }, { name: "Elevación de talones (Gemelos)", cat: "Piernas" }, { name: "Hip Thrust", cat: "Piernas" },
  { name: "Zancadas con mancuernas", cat: "Piernas" }, { name: "Sentadilla búlgara", cat: "Piernas" }, { name: "Peso muerto rumano", cat: "Piernas" }, { name: "Sentadilla frontal", cat: "Piernas" }, { name: "Zancada caminando", cat: "Piernas" }, { name: "Puente de glúteos", cat: "Piernas" }, { name: "Sentadilla goblet", cat: "Piernas" }, { name: "Curl femoral sentado", cat: "Piernas" }, { name: "Peso muerto sumo", cat: "Piernas" }, { name: "Buenos días", cat: "Piernas" }, { name: "Patada de glúteo en polea", cat: "Piernas" },
  { name: "Press militar con barra", cat: "Hombros" }, { name: "Elevaciones laterales con mancuernas", cat: "Hombros" }, { name: "Press Arnold", cat: "Hombros" }, { name: "Pájaros (Posteriores)", cat: "Hombros" }, { name: "Encogimientos de hombros con mancuernas", cat: "Hombros" },
  { name: "Press de hombros con mancuernas", cat: "Hombros" }, { name: "Elevación frontal con mancuernas", cat: "Hombros" }, { name: "Face pull", cat: "Hombros" }, { name: "Elevación lateral en polea", cat: "Hombros" }, { name: "Pájaro con mancuernas inclinado", cat: "Hombros" }, { name: "Remo al mentón", cat: "Hombros" },
  { name: "Curl de bíceps con barra", cat: "Brazos" }, { name: "Curl de bíceps con mancuernas tipo martillo", cat: "Brazos" }, { name: "Curl de bíceps en polea", cat: "Brazos" }, { name: "Extensiones de tríceps en polea", cat: "Brazos" }, { name: "Press francés con barra Z", cat: "Brazos" }, { name: "Extensiones de tríceps por encima de la cabeza", cat: "Brazos" },
  { name: "Curl concentrado", cat: "Brazos" }, { name: "Curl en banco Scott", cat: "Brazos" }, { name: "Press francés con mancuerna", cat: "Brazos" }, { name: "Fondos en banco (Tríceps)", cat: "Brazos" }, { name: "Patada de tríceps", cat: "Brazos" }, { name: "Press cerrado con barra", cat: "Brazos" }, { name: "Curl inverso con barra", cat: "Brazos" },
  { name: "Plancha abdominal", cat: "Core" }, { name: "Elevación de piernas colgado", cat: "Core" }, { name: "Crunch en polea", cat: "Core" },
  { name: "Rueda abdominal", cat: "Core" }, { name: "Elevación de piernas en banco", cat: "Core" }, { name: "Giro ruso", cat: "Core" }, { name: "Plancha lateral", cat: "Core" }
];

const PREDEFINED_ROUTINES = [
  { id: 'def1', title: 'Torso (Upper)', exercises: ['Press de banca plano', 'Dominadas', 'Press militar con barra', 'Remo con barra'] },
  { id: 'def2', title: 'Piernas (Lower)', exercises: ['Sentadilla libre', 'Prensa de piernas 45°', 'Curl femoral tumbado', 'Elevación de talones (Gemelos)'] },
  { id: 'def3', title: 'Full Body Básico', exercises: ['Sentadilla libre', 'Press de banca plano', 'Remo en polea baja', 'Press militar con barra'] },
  { id: 'def4', title: 'Push (Empuje)', exercises: ['Press de banca plano', 'Press militar con barra', 'Fondos en paralelas (Pecho)', 'Extensiones de tríceps en polea'] }
];

// Los ejercicios de una rutina pueden venir en formato viejo (solo el nombre, string) o nuevo
// ({ name, sets: [{type, weight, reps}] }). Esta función siempre devuelve el formato nuevo con al
// menos 1 serie normal; weight/reps son presets opcionales que precargan el peso al arrancar la rutina.
function normalizeRoutineExercise(item){
  if(typeof item === 'string') return { name: item, note:'', superset:false, collapsed:false, restSeconds:90, sets: [{ type: 'N', weight: '', reps: '' }] };
  const sets = (item.sets && item.sets.length) ? item.sets.map(s => ({ type: s.type || 'N', weight: s.weight ?? '', reps: s.reps ?? '' })) : [{ type: 'N', weight: '', reps: '' }];
  return { name: item.name, note: item.note || '', superset: item.superset || false, collapsed: item.collapsed || false, restSeconds: item.restSeconds ?? 90, sets };
}

// Colores por función muscular: rojo = empuje/anterior, violeta = tracción/posterior, extras para acentuar zonas puntuales.
const MUSCLE_COLOR = { push: "#EB5757", pull: "#9B51E0", accent: "#F2994A", calf: "#F2C94C" };

// Mapea cada ejercicio del catálogo a una sub-zona muscular específica (no solo la categoría general).
const EXERCISE_ICON_MAP = {
  'Press de banca plano': 'chest_mid', 'Press inclinado con mancuernas': 'chest_upper', 'Aperturas en polea': 'chest_mid', 'Fondos en paralelas (Pecho)': 'chest_lower', 'Press declinado': 'chest_lower',
  'Press de banca con mancuernas': 'chest_mid', 'Press de pecho en máquina': 'chest_mid', 'Cruce de poleas': 'chest_mid', 'Flexiones de brazos': 'chest_mid', 'Aperturas con mancuernas': 'chest_mid',
  'Dominadas': 'back_lats', 'Remo con barra': 'back_mid', 'Jalón al pecho en polea': 'back_lats', 'Remo en polea baja': 'back_mid', 'Pull-over en polea': 'back_lats',
  'Remo en máquina': 'back_mid', 'Remo con mancuerna a un brazo': 'back_mid', 'Remo en T': 'back_mid', 'Jalón con agarre cerrado': 'back_lats', 'Hiperextensiones': 'back_mid',
  'Sentadilla libre': 'legs_quads_glutes', 'Peso muerto convencional': 'legs_hamstrings_glutes', 'Prensa de piernas 45°': 'legs_quads', 'Extensiones de cuádriceps': 'legs_quads', 'Curl femoral tumbado': 'legs_hamstrings', 'Elevación de talones (Gemelos)': 'legs_calves', 'Hip Thrust': 'legs_glutes',
  'Zancadas con mancuernas': 'legs_quads_glutes', 'Sentadilla búlgara': 'legs_quads_glutes', 'Peso muerto rumano': 'legs_hamstrings_glutes', 'Sentadilla frontal': 'legs_quads_glutes', 'Zancada caminando': 'legs_quads_glutes', 'Puente de glúteos': 'legs_glutes', 'Sentadilla goblet': 'legs_quads_glutes', 'Curl femoral sentado': 'legs_hamstrings', 'Peso muerto sumo': 'legs_hamstrings_glutes', 'Buenos días': 'legs_hamstrings_glutes', 'Patada de glúteo en polea': 'legs_glutes',
  'Press militar con barra': 'shoulders_front', 'Elevaciones laterales con mancuernas': 'shoulders_side', 'Press Arnold': 'shoulders_front_side', 'Pájaros (Posteriores)': 'shoulders_rear', 'Encogimientos de hombros con mancuernas': 'back_traps',
  'Press de hombros con mancuernas': 'shoulders_front', 'Elevación frontal con mancuernas': 'shoulders_front', 'Face pull': 'shoulders_rear', 'Elevación lateral en polea': 'shoulders_side', 'Pájaro con mancuernas inclinado': 'shoulders_rear', 'Remo al mentón': 'shoulders_side',
  'Curl de bíceps con barra': 'arms_biceps', 'Curl de bíceps con mancuernas tipo martillo': 'arms_biceps', 'Curl de bíceps en polea': 'arms_biceps', 'Extensiones de tríceps en polea': 'arms_triceps', 'Press francés con barra Z': 'arms_triceps', 'Extensiones de tríceps por encima de la cabeza': 'arms_triceps',
  'Curl concentrado': 'arms_biceps', 'Curl en banco Scott': 'arms_biceps', 'Press francés con mancuerna': 'arms_triceps', 'Fondos en banco (Tríceps)': 'arms_triceps', 'Patada de tríceps': 'arms_triceps', 'Press cerrado con barra': 'arms_triceps', 'Curl inverso con barra': 'arms_biceps',
  'Plancha abdominal': 'core_abs', 'Elevación de piernas colgado': 'core_lower_abs', 'Crunch en polea': 'core_abs',
  'Rueda abdominal': 'core_abs', 'Elevación de piernas en banco': 'core_lower_abs', 'Giro ruso': 'core_abs', 'Plancha lateral': 'core_abs'
};

function getExerciseIconKey(exName){
  if(EXERCISE_ICON_MAP[exName]) return EXERCISE_ICON_MAP[exName];
  const cat = getExerciseCategory(exName);
  const n = exName.toLowerCase();
  if(cat === 'Pecho') return n.includes('inclinad') ? 'chest_upper' : (n.includes('declinad') || n.includes('fondos')) ? 'chest_lower' : 'chest_mid';
  if(cat === 'Espalda') return n.includes('remo') ? 'back_mid' : 'back_lats';
  if(cat === 'Piernas'){
    if(n.includes('gemelo') || n.includes('pantorrilla')) return 'legs_calves';
    if(n.includes('femoral') || n.includes('isquio')) return 'legs_hamstrings';
    if(n.includes('gluteo') || n.includes('glúteo') || n.includes('hip thrust')) return 'legs_glutes';
    if(n.includes('peso muerto')) return 'legs_hamstrings_glutes';
    if(n.includes('sentadilla')) return 'legs_quads_glutes';
    return 'legs_quads';
  }
  if(cat === 'Hombros'){
    if(n.includes('encogimiento') || n.includes('encogimientos')) return 'back_traps';
    if(n.includes('lateral')) return 'shoulders_side';
    if(n.includes('posterior') || n.includes('pájaro') || n.includes('pajaro')) return 'shoulders_rear';
    if(n.includes('arnold')) return 'shoulders_front_side';
    return 'shoulders_front';
  }
  if(cat === 'Brazos') return (n.includes('tríceps') || n.includes('tricep') || n.includes('francés') || n.includes('frances')) ? 'arms_triceps' : 'arms_biceps';
  if(cat === 'Core') return (n.includes('pierna') || n.includes('colgado')) ? 'core_lower_abs' : 'core_abs';
  return 'core_abs';
}

// ---- Ilustración anatómica real (muscle-front.png / muscle-back.png) para toda la app ----
// muscle-front.png / muscle-back.png: solo el dibujo de líneas (fondo y relleno transparentes).
// muscle-front-mask.png / muscle-back-mask.png: la silueta sólida, se usa como máscara para que el
// color de "músculo entrenado" no se salga del cuerpo. Se aplica como <mask> nativo de SVG (no como
// mask-image de CSS): bajo file:// varios navegadores bloquean la carga de imágenes locales como
// máscara CSS y no se veía nada; como <image> dentro de un <svg> carga igual que un <img> normal.
// Cada máscara (muscle-front-chest.png, muscle-front-shoulders.png, etc.) es la silueta EXACTA de
// ese músculo tal como está dibujado en la imagen de referencia: se generó separando automáticamente
// cada forma cerrada por las líneas del dibujo (segmentación por componentes conexas), así el color
// nunca se sale del contorno real ni se mezcla en un blob, a diferencia de los óvalos calculados a mano.
const FRONT_REGIONS = ['chest', 'shoulders', 'arms', 'abs', 'quads'];
const BACK_REGIONS = ['traps', 'upperback', 'espaldabaja', 'shoulders', 'lats', 'arms', 'glutes', 'hamstrings', 'calves'];

// Qué región de cada vista prende cada key de EXERCISE_ICON_MAP / getExerciseIconKey. El trapecio se
// separa del resto de la espalda y del hombro; el pecho queda unificado (sin superior/inferior).
const FRONT_KEY_REGIONS = {
  chest_upper: ['chest'], chest_mid: ['chest'], chest_lower: ['chest'],
  shoulders_front: ['shoulders'], shoulders_side: ['shoulders'], shoulders_front_side: ['shoulders'],
  arms_biceps: ['arms'],
  legs_quads: ['quads'], legs_quads_glutes: ['quads'],
  core_abs: ['abs'], core_lower_abs: ['abs']
};
const BACK_KEY_REGIONS = {
  back_lats: ['lats'], back_mid: ['upperback'], back_traps: ['traps'],
  shoulders_rear: ['shoulders'],
  arms_triceps: ['arms'],
  legs_hamstrings: ['hamstrings'], legs_hamstrings_glutes: ['hamstrings','glutes','espaldabaja'],
  legs_glutes: ['glutes'], legs_quads_glutes: ['glutes'],
  legs_calves: ['calves']
};

function getRegionsForNames(exNames, keyRegionMap){
  const set = new Set();
  exNames.forEach(n => { (keyRegionMap[getExerciseIconKey(n)] || []).forEach(r => set.add(r)); });
  return set;
}

let muscleMaskUid = 0;
function renderMuscleView(view, activeRegions){
  const color = (region) => region === 'calves' ? MUSCLE_COLOR.calf : (view === 'front' ? MUSCLE_COLOR.push : MUSCLE_COLOR.pull);
  const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS;
  let defs = '', rects = '';
  regions.filter(r => activeRegions.has(r)).forEach(r => {
    const maskId = `muscleMask${muscleMaskUid++}`;
    defs += `<mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="465" height="825"><image href="musculos/muscle-${view}-${r}.png" x="0" y="0" width="465" height="825"/></mask>`;
    rects += `<rect width="465" height="825" fill="${color(r)}" mask="url(#${maskId})"/>`;
  });
  return `<svg class="muscle-figure-svg" viewBox="0 0 465 825" xmlns="http://www.w3.org/2000/svg">
    <defs>${defs}</defs>
    ${rects}
    <image href="musculos/muscle-${view}.png" x="0" y="0" width="465" height="825"/>
  </svg>`;
}

// Par frente/espalda para el resumen semanal, donde sí hay lugar para mostrar las dos vistas
// (igual que la referencia): evita que pecho y espalda se pisen en una sola figura.
function getWeeklyMuscleSvgPair(exNames){
  return renderMuscleView('front', getRegionsForNames(exNames, FRONT_KEY_REGIONS))
       + renderMuscleView('back', getRegionsForNames(exNames, BACK_KEY_REGIONS));
}

// Ícono de un solo ejercicio (tarjetas, listas, PRs): una sola vista, frente si el músculo se ve de
// frente, espalda si no. Se usa en todos los ícono chicos de la app en vez del muñequito simple viejo.
function getExerciseMiniFigure(exNameOrCategory){
  const front = getRegionsForNames([exNameOrCategory], FRONT_KEY_REGIONS);
  if(front.size) return renderMuscleView('front', front);
  const back = getRegionsForNames([exNameOrCategory], BACK_KEY_REGIONS);
  return renderMuscleView('back', back);
}

// Resumen de un día para el calendario: una sola figura (no entra el par frente/espalda), eligiendo
// la vista con más músculos entrenados ese día.
// Antes elegía UNA sola vista (la de más músculos) y descartaba la otra entera: un día de torso
// (pecho + espalda) mostraba solo pecho y perdía la espalda. Ahora muestra el mismo par frente/espalda
// que la semana, sin descartar nada, solo que en miniatura para entrar en la casilla del calendario.
function getDayMuscleFigure(exNames){
  return getWeeklyMuscleSvgPair(exNames);
}

function getExerciseVideoUrl(exName){
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(exName + ' como hacer tecnica correcta')}`;
}

// Un video de YouTube verificado por ejercicio del catálogo (técnica correcta). Los ejercicios personalizados
// que no están acá muestran un buscador de YouTube en lugar de un video embebido específico.
const EXERCISE_VIDEO_MAP = {
  'Press de banca plano': 'TAH8RxOS0VI',
  'Press inclinado con mancuernas': 'spNjkT0ne18',
  'Aperturas en polea': 'WNtBIde3Qks',
  'Fondos en paralelas (Pecho)': 'HIXAJlYMdL0',
  'Press declinado': 'L1U8yy4OqbQ',
  'Dominadas': 'npyLB-7o19o',
  'Remo con barra': 'OXH-ecu-Obw',
  'Jalón al pecho en polea': 'oLQj4fySWQQ',
  'Remo en polea baja': 'duJvtG1qIko',
  'Pull-over en polea': '9YQ1YXKko8s',
  'Sentadilla libre': 'qsAkuNORgmk',
  'Peso muerto convencional': 'kancsOn7CJY',
  'Prensa de piernas 45°': 'bNsrqXUIJqc',
  'Extensiones de cuádriceps': 'DI34ngDC8FU',
  'Curl femoral tumbado': 'kmtn5RJkvVE',
  'Elevación de talones (Gemelos)': '1BL4681pIz4',
  'Hip Thrust': '14wE63cK26I',
  'Press militar con barra': '4I6gCfiIHlw',
  'Elevaciones laterales con mancuernas': 'Lv1pZGF44wg',
  'Press Arnold': 'V8GcUp4COLg',
  'Pájaros (Posteriores)': 'Jhzr4SYgXVM',
  'Curl de bíceps con barra': 'vq22h2ovm_I',
  'Curl de bíceps con mancuernas tipo martillo': '8w3_KHigrh0',
  'Curl de bíceps en polea': 'OGI2K-Qc2z0',
  'Extensiones de tríceps en polea': 'HAS8uy73HqM',
  'Press francés con barra Z': 'PTO862T8U7Y',
  'Extensiones de tríceps por encima de la cabeza': 'fQ-KB40W3d8',
  'Plancha abdominal': 'zfY5XXa26ug',
  'Elevación de piernas colgado': 'dDbr6K35tTA',
  'Crunch en polea': 'ui3iEsYbXtI'
};

function openVideoModal(exName){
  const videoId = EXERCISE_VIDEO_MAP[exName];
  const overlay = document.createElement('div'); overlay.className = 'video-modal-overlay';
  const body = videoId
    ? `<div class="video-modal-frame-wrap"><iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" title="Video de ${escapeHtml(exName)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><div style="padding:8px 14px 12px; text-align:right;"><a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener" style="font-size:11px; color:var(--text-dim);">¿No carga? Verlo en YouTube ↗</a></div>`
    : `<div class="video-modal-empty">Todavía no tenemos un video cargado para este ejercicio.<br><button class="btn-primary" id="videoModalSearchBtn" style="margin-top:14px; width:auto; padding:10px 18px;">Buscar en YouTube</button></div>`;
  overlay.innerHTML = `<div class="video-modal-card"><div class="video-modal-head"><h4>${escapeHtml(exName)}</h4><button class="btn-icon" id="videoModalCloseBtn" style="width:28px; height:28px; font-size:14px; flex-shrink:0;">✕</button></div>${body}</div>`;
  document.body.appendChild(overlay);
  const close = ()=>{ if(document.body.contains(overlay)) document.body.removeChild(overlay); };
  overlay.querySelector('#videoModalCloseBtn').addEventListener('click', close);
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) close(); });
  if(!videoId){ overlay.querySelector('#videoModalSearchBtn').addEventListener('click', ()=> window.open(getExerciseVideoUrl(exName), '_blank', 'noopener')); }
}

function getExerciseCategory(exName){
  const found = EXERCISE_CATALOG.find(i => i.name.toLowerCase() === exName.toLowerCase());
  if(found) return found.cat;
  const nameL = exName.toLowerCase();
  if(nameL.includes('bicep') || nameL.includes('tricep') || nameL.includes('curl') || nameL.includes('extension') || nameL.includes('francés')) return 'Brazos';
  if(nameL.includes('pecho') || nameL.includes('banca') || nameL.includes('aperturas') || nameL.includes('fondos')) return 'Pecho';
  if(nameL.includes('espalda') || nameL.includes('remo') || nameL.includes('dominadas') || nameL.includes('jalón')) return 'Espalda';
  if(nameL.includes('pierna') || nameL.includes('sentadilla') || nameL.includes('peso muerto') || nameL.includes('prensa') || nameL.includes('cuádriceps') || nameL.includes('femoral') || nameL.includes('gemelos') || nameL.includes('hip thrust')) return 'Piernas';
  if(nameL.includes('hombro') || nameL.includes('militar') || nameL.includes('lateral') || nameL.includes('arnold')) return 'Hombros';
  return 'Core';
}

let exercises = [], workouts = [], routines = [], active = null, bodyWeightLog = [];
let currentTab = 'train', expandedWorkoutId = null, routineDraft = null;
let historySearchQuery = '', historyDateFrom = '', historyDateTo = '';
let editingWorkoutId = null, editingWorkoutDraft = null;
let prsFilterCat = 'Todos';
let newlyAddedExIdx = -1;
let calendarViewMode = 'month', calendarViewDate = new Date();
let timerInterval = null, restInterval = null, restSecondsRemaining = 0;
let currentTheme = 'copper';
let themeMode = 'dark';
let weightUnit = 'kg';

const mainEl = document.getElementById('main');

// ---- Unidad de peso (kg/lb) ----
// Todo el peso se GUARDA siempre en kg (dato canónico, sin importar la unidad elegida). weightUnit
// solo afecta cómo se muestra y cómo se interpreta lo que el usuario tipea; así cambiar de unidad
// no requiere migrar ni tocar ningún dato ya guardado.
const KG_PER_LB = 0.45359237;
function toDisplayWeight(kg){
  if(kg === '' || kg === null || kg === undefined || isNaN(kg)) return kg;
  const n = Number(kg);
  return weightUnit === 'lb' ? Math.round((n / KG_PER_LB) * 100) / 100 : Math.round(n * 100) / 100;
}
function toKgWeight(displayVal){
  if(displayVal === '' || displayVal === null || displayVal === undefined || isNaN(displayVal)) return displayVal;
  const n = Number(displayVal);
  return weightUnit === 'lb' ? Math.round(n * KG_PER_LB * 100) / 100 : Math.round(n * 100) / 100;
}
function fmtW(kg){ if(kg === '' || kg === null || kg === undefined || isNaN(kg)) return '-'; return `${toDisplayWeight(kg)}${weightUnit}`; }
function unitMaxWeight(){ return weightUnit === 'lb' ? 2200 : 999; }

// ---- Debounce de guardado mientras se tipea ----
// Cada input de peso/reps antes disparaba un guardado async completo por tecla; con historiales
// grandes eso se nota. Ahora se agrupa en una sola escritura 400ms después de la última tecla.
// flushActiveSave() se usa antes de cualquier acción que dependa de que ya esté guardado (cambiar de
// pestaña, finalizar o descartar el entrenamiento).
let saveActiveDebounceTimer = null;
function saveActiveDebounced(){
  if(saveActiveDebounceTimer) clearTimeout(saveActiveDebounceTimer);
  saveActiveDebounceTimer = setTimeout(()=>{ saveActiveDebounceTimer = null; saveActive(); }, 400);
}
function flushActiveSave(){
  if(saveActiveDebounceTimer){ clearTimeout(saveActiveDebounceTimer); saveActiveDebounceTimer = null; saveActive(); }
}

// Sugerencia de progresión: mismo peso que la última vez que se hizo ese ejercicio en esa posición de
// serie, con +1 repetición como incentivo de sobrecarga progresiva. Devuelve null si no hay antecedente.
function getSuggestedSet(exName, setIndex){
  const lastWorkout = workouts.find(w => w.exercises.some(e => e.name === exName));
  if(!lastWorkout) return null;
  const ex = lastWorkout.exercises.find(e => e.name === exName);
  const s = ex.sets[setIndex] || ex.sets[ex.sets.length - 1];
  if(!s || s.weight === '' || s.reps === '') return null;
  return { weight: s.weight, reps: Number(s.reps) + 1 };
}

// ---- Almacenamiento persistente ----
// Si corre adentro de Claude.ai usa window.storage (persiste entre sesiones en la nube).
// Si se abrió como archivo local (doble clic, file:///...) usa IndexedDB del navegador (más capacidad y confiabilidad
// que localStorage), con fallback a localStorage si IndexedDB no está disponible.
const hasClaudeStorage = (typeof window.storage !== 'undefined') && window.storage && typeof window.storage.get === 'function';
let storageWarned = false;

const IDB_NAME = 'washed-db', IDB_STORE = 'kv';
let idbConn = null, idbAvailable = null;

function openIdb(){
  if(idbConn) return idbConn;
  idbConn = new Promise((resolve, reject) => {
    if(!('indexedDB' in window)){ reject(new Error('IndexedDB no disponible')); return; }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => { if(!req.result.objectStoreNames.contains(IDB_STORE)) req.result.createObjectStore(IDB_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return idbConn;
}
async function idbGet(key){
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet(key, val){
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDel(key){
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// La primera vez que abrimos IndexedDB, si hay datos viejos guardados en localStorage (versión anterior de la app)
// los copiamos para no perder el historial de entrenamientos del usuario.
async function migrateFromLocalStorage(){
  const keys = ['exercises', 'workouts', 'active-workout', 'routines', 'theme'];
  for(const key of keys){
    try{
      const existing = await idbGet(key);
      if(existing !== undefined) continue;
      const raw = localStorage.getItem('barra_' + key);
      if(raw != null) await idbSet(key, JSON.parse(raw));
    } catch(e){}
  }
}

async function ensureIdb(){
  if(idbAvailable === null){
    try{ await openIdb(); await migrateFromLocalStorage(); idbAvailable = true; }
    catch(e){ idbAvailable = false; }
  }
  return idbAvailable;
}

async function sGet(key){
  try{
    if(hasClaudeStorage){
      const r = await window.storage.get(key, false);
      return r ? JSON.parse(r.value) : null;
    }
    if(await ensureIdb()){
      const v = await idbGet(key);
      return v === undefined ? null : v;
    }
    const v = localStorage.getItem('barra_' + key);
    return v ? JSON.parse(v) : null;
  } catch(e){ return null; }
}
async function sSet(key, val){
  if(hasClaudeStorage){
    const json = JSON.stringify(val);
    for(let attempt = 1; attempt <= 2; attempt++){
      try{ await window.storage.set(key, json, false); return; }
      catch(e){
        console.error(`No se pudo guardar ${key} (intento ${attempt})`, e);
        if(attempt === 2) warnStorageOnce();
        else await new Promise(r => setTimeout(r, 500));
      }
    }
    return;
  }
  if(await ensureIdb()){
    try{ await idbSet(key, val); return; }
    catch(e){ console.error('No se pudo guardar en IndexedDB', key, e); }
  }
  try{ localStorage.setItem('barra_' + key, JSON.stringify(val)); }
  catch(e){ console.error('No se pudo guardar', key, e); warnStorageOnce(); }
}
function warnStorageOnce(){
  if(storageWarned) return;
  storageWarned = true;
  alert('Hubo un problema guardando tus datos. Puede ser algo momentáneo del servicio - segui usando la app, si persiste probá recargar.');
}
async function sDel(key){
  try{
    if(hasClaudeStorage){ await window.storage.delete(key, false); return; }
    if(await ensureIdb()){ await idbDel(key); return; }
    localStorage.removeItem('barra_' + key);
  } catch(e){}
}

async function loadState(){
  exercises = (await sGet('exercises')) || EXERCISE_CATALOG.map(e => e.name);
  workouts = (await sGet('workouts')) || [];
  active = await sGet('active-workout');
  routines = (await sGet('routines')) || [];
  bodyWeightLog = (await sGet('bodyweight')) || [];
  currentTheme = (await sGet('theme')) || 'copper';
  themeMode = (await sGet('thememode')) || 'dark';
  weightUnit = (await sGet('weightunit')) || 'kg';
  document.body.setAttribute('data-theme', currentTheme);
  document.body.setAttribute('data-mode', themeMode);
  if(active) startTimer();
}

async function saveRoutines(){ await sSet('routines', routines); }
async function saveExercises(){ await sSet('exercises', exercises); }
async function saveWorkouts(){ await sSet('workouts', workouts); }
async function saveActive(){ if(active) await sSet('active-workout', active); else await sDel('active-workout'); }
async function saveTheme(){ await sSet('theme', currentTheme); }
async function saveThemeMode(){ await sSet('thememode', themeMode); }
async function saveWeightUnit(){ await sSet('weightunit', weightUnit); }
async function saveBodyWeight(){ await sSet('bodyweight', bodyWeightLog); }

function playBeep(){
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch(e){}
}

function fireConfetti(){
  const colors = ['#F2C94C', '#E3823D', '#27AE60', '#EB5757'];
  for(let i=0; i<50; i++){
    let el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
    el.style.animationDuration = (Math.random() * 1.6 + 1.8) + 's';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 3800);
  }
}

function startTimer(){
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    if(active){
      const durationEl = document.getElementById('liveDuration');
      if(durationEl) durationEl.textContent = formatDuration(Math.floor((Date.now() - active.startTime)/1000));
    }
  }, 1000);
}

function startRestTimer(seconds = 90){
  if(restInterval) clearInterval(restInterval);
  restSecondsRemaining = seconds; updateRestBar();
  restInterval = setInterval(()=>{
    restSecondsRemaining--;
    if(restSecondsRemaining <= 0){
      clearInterval(restInterval); restInterval = null;
      playBeep(); if(navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 300]);
    }
    updateRestBar();
  }, 1000);
}

function adjustRest(amount){ restSecondsRemaining = Math.max(0, restSecondsRemaining + amount); updateRestBar(); }

function updateRestBar(){
  const barEl = document.getElementById('restTimerBar');
  const countEl = document.getElementById('restCountdown');
  if(barEl && countEl){
    if(restSecondsRemaining > 0){ barEl.classList.remove('hidden'); countEl.textContent = `${restSecondsRemaining}s`; }
    else barEl.classList.add('hidden');
  }
}

function formatDuration(totalSeconds){
  const hrs = Math.floor(totalSeconds / 3600), mins = Math.floor((totalSeconds % 3600) / 60), secs = totalSeconds % 60;
  if(hrs > 0) return `${hrs}h ${mins}m`; if(mins > 0) return `${mins}m ${secs}s`; return `${secs}s`;
}

function fmtDate(iso){ const d = new Date(iso); return d.toLocaleDateString('es-AR', { day:'numeric', month:'short', year:'numeric' }); }
function todayLabel(){ const d = new Date(); return d.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' }); }

function getMotivationalBanner(){
  const quotes = [
    { icon: "🔥", text: "El dolor que sentís hoy es la fuerza que vas a sentir mañana." },
    { icon: "⚡", text: "No cuentes los días, hacé que los días cuenten." },
    { icon: "🎯", text: "La única mala sesión es la que no se hizo." },
    { icon: "💪", text: "Constancia y disciplina le ganan al talento cuando el talento no entrena." },
    { icon: "🚀", text: "Cada serie te acerca un paso más a tu mejor versión." }
  ];
  return quotes[new Date().getDate() % quotes.length];
}

// Devuelve el string "anterior" (peso x reps) para un ejercicio en un índice de serie dado,
// tomando SIEMPRE el entrenamiento más reciente que incluyó ese ejercicio.
function getLastSetString(exName, setIndex){
  const lastWorkout = workouts.find(w => w.exercises.some(e => e.name === exName));
  if(!lastWorkout) return '-';
  const ex = lastWorkout.exercises.find(e => e.name === exName);
  const s = ex.sets[setIndex] || ex.sets[ex.sets.length - 1];
  if(!s || s.weight === '' || s.reps === '') return '-';
  return `${fmtW(s.weight)} × ${s.reps}`;
}

// Máximo peso histórico ya guardado (no cuenta la sesión activa) para un ejercicio.
function getHistoricalMaxWeight(exName, historyWorkouts){
  let maxW = 0;
  (historyWorkouts || workouts).forEach(w => {
    const foundEx = w.exercises.find(e => e.name === exName);
    if(foundEx) foundEx.sets.forEach(s => { if(s.type !== 'W' && s.weight !== '' && Number(s.weight) > maxW) maxW = Number(s.weight); });
  });
  return maxW;
}

// Días de la semana para asignar rutinas a un día fijo (orden lunes-primero, como el calendario).
// Se guardan como el valor de Date.getDay() (0=domingo) para comparar directo contra "hoy".
const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const WEEKDAY_JS_VALUES = [1, 2, 3, 4, 5, 6, 0];

// Tipos de serie: Normal (muestra el número/trofeo), y tres tipos especiales marcados con una "S" de color.
const SET_TYPE_INFO = {
  N: { label: 'Normal', badge: null, bg: 'var(--surface-2)', fg: 'var(--text-dim)' },
  W: { label: 'Calentamiento', badge: 'S', bg: '#F2C94C', fg: '#1A1500' },
  F: { label: 'Al fallo', badge: 'S', bg: '#EB5757', fg: '#fff' },
  D: { label: 'Descanso', badge: 'S', bg: '#2F80ED', fg: '#fff' }
};

function getSetTypeRowClass(type){
  if(type === 'W') return 'is-warmup';
  if(type === 'F') return 'is-failure';
  if(type === 'D') return 'is-restpause';
  return '';
}

// Menú genérico para elegir el tipo de serie. onSelect recibe el nuevo tipo ('N'/'W'/'F'/'D').
function openSetTypeMenu(currentType, onSelect){
  const overlay = document.createElement('div'); overlay.className = 'picker-overlay';
  const order = ['N', 'W', 'F', 'D'];
  overlay.innerHTML = `<div class="picker-sheet" style="max-height:none;">
    <h3>Seleccionar tipo de serie</h3>
    ${order.map(type => {
      const info = SET_TYPE_INFO[type];
      const isActive = currentType === type;
      return `<div class="set-type-option ${isActive ? 'active' : ''}" data-set-type="${type}">
        <span class="set-type-swatch" style="background:${info.bg}; color:${info.fg};">${info.badge || '#'}</span>
        <span>${info.label}</span>
        ${isActive ? '<span class="set-type-check">✓</span>' : ''}
      </div>`;
    }).join('')}
  </div>`;
  document.body.appendChild(overlay);
  const close = ()=>{ if(document.body.contains(overlay)) document.body.removeChild(overlay); };
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) close(); });
  overlay.querySelectorAll('[data-set-type]').forEach(el=> el.addEventListener('click', ()=>{ onSelect(el.dataset.setType); close(); }));
}

// Peso máximo ya marcado como hecho en la sesión activa para el mismo ejercicio, sin contar la serie
// que se está evaluando. Sirve para que repetir el mismo peso en otra serie no cuente como récord de nuevo.
function getSessionMaxWeight(exName, excludeExIdx, excludeSIdx){
  let maxW = 0;
  if(!active) return maxW;
  active.exercises.forEach((ex, exIdx)=>{
    if(ex.name !== exName) return;
    ex.sets.forEach((s, sIdx)=>{
      if(exIdx === excludeExIdx && sIdx === excludeSIdx) return;
      if(s.type !== 'W' && s.done && s.weight !== '' && Number(s.weight) > maxW) maxW = Number(s.weight);
    });
  });
  return maxW;
}

// Determina si una serie EN CURSO (sesión activa) supera el récord histórico previo Y lo ya hecho en esta
// misma sesión, para que solo la serie que realmente mejora el peso dispare el trofeo/confetti.
function isPersonalRecord(exName, weight, reps, type, exIdx, sIdx){
  if(weight === '' || isNaN(weight) || type === 'W') return false;
  const maxW = Math.max(getHistoricalMaxWeight(exName, workouts), getSessionMaxWeight(exName, exIdx, sIdx));
  return Number(weight) > maxW && maxW > 0;
}

function isPersonalRecordBefore(exName, weight, existingWorkouts, sessionMax = 0){
  if(weight === '' || isNaN(weight)) return false;
  return Number(weight) > Math.max(getHistoricalMaxWeight(exName, existingWorkouts), sessionMax);
}

// Mejor cantidad de repeticiones ya lograda históricamente con ESE MISMO peso exacto para el ejercicio
// (no cuenta calentamiento). Es la base para detectar "récord de volumen": misma carga, más repeticiones.
function getHistoricalBestRepsAtWeight(exName, weight, historyWorkouts){
  let best = 0;
  (historyWorkouts || workouts).forEach(w => {
    const foundEx = w.exercises.find(e => e.name === exName);
    if(foundEx) foundEx.sets.forEach(s => { if(s.type !== 'W' && s.weight !== '' && Number(s.weight) === Number(weight) && Number(s.reps) > best) best = Number(s.reps); });
  });
  return best;
}

// Igual que getSessionMaxWeight pero para reps al mismo peso, dentro de la sesión activa.
function getSessionBestRepsAtWeight(exName, weight, excludeExIdx, excludeSIdx){
  let best = 0;
  if(!active) return best;
  active.exercises.forEach((ex, exIdx)=>{
    if(ex.name !== exName) return;
    ex.sets.forEach((s, sIdx)=>{
      if(exIdx === excludeExIdx && sIdx === excludeSIdx) return;
      if(s.type !== 'W' && s.done && s.weight !== '' && Number(s.weight) === Number(weight) && Number(s.reps) > best) best = Number(s.reps);
    });
  });
  return best;
}

// Récord de volumen: con el mismo peso que ya usaste antes, hacés más repeticiones que nunca
// (ej. tu mejor serie con 100kg era 11 reps y ahora hacés 100kg x 12). Requiere que exista un
// antecedente con ese peso exacto (bestReps > 0), igual que el PR de peso requiere maxW > 0.
function isVolumeRecord(exName, weight, reps, type, exIdx, sIdx){
  if(weight === '' || reps === '' || isNaN(weight) || isNaN(reps) || type === 'W') return false;
  const bestReps = Math.max(getHistoricalBestRepsAtWeight(exName, weight, workouts), getSessionBestRepsAtWeight(exName, weight, exIdx, sIdx));
  return Number(reps) > bestReps && bestReps > 0;
}

function isVolumeRecordBefore(exName, weight, reps, existingWorkouts, sessionBestReps = 0){
  if(weight === '' || reps === '' || isNaN(weight) || isNaN(reps)) return false;
  const bestReps = Math.max(getHistoricalBestRepsAtWeight(exName, weight, existingWorkouts), sessionBestReps);
  return Number(reps) > bestReps && bestReps > 0;
}

// 1RM estimado (fórmula de Epley) para comparar series de distinto peso/reps entre sí.
function estimated1RM(weight, reps){
  const w = Number(weight), r = Number(reps);
  if(!w || !r) return 0;
  return w * (1 + r / 30);
}

function getHistoricalMax1RM(exName, historyWorkouts){
  let max1RM = 0;
  (historyWorkouts || workouts).forEach(w => {
    const foundEx = w.exercises.find(e => e.name === exName);
    if(foundEx) foundEx.sets.forEach(s => { if(s.type !== 'W' && s.weight !== '' && s.reps !== ''){ const rm = estimated1RM(s.weight, s.reps); if(rm > max1RM) max1RM = rm; } });
  });
  return max1RM;
}

// Detecta combinaciones de peso/reps poco realistas (ej. errores de tipeo como "300kg x 99 reps").
// Sin historial: cualquier 1RM estimado extremo (>400) se marca. Con historial propio del ejercicio,
// se permite un salto amplio (75% por encima de tu mejor 1RM estimado) para no molestar con PRs
// genuinos, pero cualquier cosa más allá de eso se considera sospechosa.
function isSuspiciousSet(exName, weight, reps, type){
  if(type === 'W' || weight === '' || reps === '' || isNaN(weight) || isNaN(reps)) return false;
  const w = Number(weight), r = Number(reps);
  if(w <= 0 || r <= 0) return false;
  if(r > 30) return true;
  const rm = estimated1RM(w, r);
  const histMax = getHistoricalMax1RM(exName, workouts);
  return histMax > 0 ? rm > histMax * 1.75 : rm > 400;
}

function getISOWeek(date){
  const d = new Date(date); d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - (d.getDay()||7));
  const yearStart = new Date(d.getFullYear(),0,1);
  return `${d.getFullYear()}-W${Math.ceil((((d - yearStart)/86400000) + 1)/7)}`;
}

function calculateStreak(){
  if(workouts.length === 0) return 0;
  const weekCounts = {};
  workouts.forEach(w => { const wk = getISOWeek(w.date); weekCounts[wk] = (weekCounts[wk] || 0) + 1; });
  const currentWeek = getISOWeek(new Date());
  const prevWeekDate = new Date(); prevWeekDate.setDate(prevWeekDate.getDate() - 7);
  const prevWeek = getISOWeek(prevWeekDate);
  let streak = 0;
  let checkingDate = new Date();
  if(weekCounts[currentWeek] >= 3) { streak++; checkingDate.setDate(checkingDate.getDate() - 7); }
  else if (weekCounts[prevWeek] >= 3) { checkingDate.setDate(checkingDate.getDate() - 7); }
  else return 0;
  while(true){
    const wk = getISOWeek(checkingDate);
    if(weekCounts[wk] >= 3) { streak++; checkingDate.setDate(checkingDate.getDate() - 7); }
    else break;
  }
  return streak;
}

window.addEventListener('beforeunload', (e)=>{ if(active){ e.preventDefault(); e.returnValue = ''; } });

document.getElementById('themeBtn').addEventListener('click', ()=>{
  const themes = ['copper', 'blue', 'emerald', 'violet', 'orange'];
  currentTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
  document.body.setAttribute('data-theme', currentTheme);
  saveTheme();
});

function renderNav(){ document.querySelectorAll('nav button').forEach(b=> b.classList.toggle('active', b.dataset.tab === currentTab)); }
document.querySelectorAll('nav button').forEach(b=>{ b.addEventListener('click', ()=>{ if(currentTab !== b.dataset.tab){ flushActiveSave(); currentTab = b.dataset.tab; render(); } }); });

let lastRenderedTab = null;
function render(){
  renderNav();
  // Solo repetimos la animación de entrada y perdemos el scroll cuando realmente cambiamos de pestaña.
  // Si seguimos en la misma pestaña (marcar una serie, agregar un ejercicio, etc.) no queremos que
  // toda la pantalla parpadee/reinicie como si fuera una recarga.
  const tabChanged = currentTab !== lastRenderedTab;
  lastRenderedTab = currentTab;
  const scrollPos = mainEl.scrollTop;
  if(tabChanged){ mainEl.style.animation = 'none'; mainEl.offsetHeight; mainEl.style.animation = 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'; }
  else mainEl.style.animation = 'none';
  if(currentTab === 'train') renderTrain();
  else if(currentTab === 'routines') renderRoutines();
  else if(currentTab === 'history') renderHistory();
  else if(currentTab === 'prs') renderPRs();
  else renderProgress();
  if(!tabChanged) mainEl.scrollTop = scrollPos;
}

// ---- ENTRENAR ----
function renderTrain(){
  if(!active){
    if(timerInterval) clearInterval(timerInterval);
    if(restInterval) clearInterval(restInterval);
    restSecondsRemaining = 0;

    const banner = getMotivationalBanner();
    let html = `<div class="motivation-banner"><div class="motivation-icon">${banner.icon}</div><div class="motivation-text">${banner.text}</div></div>`;

    if(routines.length){
      const todayJs = new Date().getDay();
      const sortedRoutines = [...routines].sort((a,b)=>{
        const aToday = (a.days||[]).includes(todayJs) ? 0 : 1;
        const bToday = (b.days||[]).includes(todayJs) ? 0 : 1;
        return aToday - bToday;
      });
      html += `<div style="margin-bottom:18px;"><h4 style="font-size:13px;color:var(--text-dim);margin:0 0 8px 2px;font-weight:500;">Tus rutinas</h4>
        ${sortedRoutines.map(r => { const isToday = (r.days||[]).includes(todayJs); return `
          <div class="workout-card">
            <div class="wc-head" style="display:flex; justify-content:space-between; align-items:center;">
              <div><div class="wc-title-main" style="margin-bottom:2px;">${escapeHtml(r.title)}${isToday ? '<span style="background:var(--accent); color:#fff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px; margin-left:8px; vertical-align:middle;">HOY</span>' : ''}</div><div style="font-size:12px; color:var(--text-dim);">${r.exercises.length} ejercicio${r.exercises.length===1?'':'s'}</div></div>
              <button class="btn-primary" style="width:auto; padding:10px 16px; font-size:13px;" data-use-routine="${r.id}">Empezar</button>
            </div>
          </div>
        `; }).join('')}</div>`;
    }

    html += `
      <div class="start-card">
        <label for="workoutName">Entrenamiento libre</label>
        <input type="text" id="workoutName" placeholder="Ej: Empuje A, Piernas, Torso" value="Entrenamiento">
        <button class="btn-primary" id="startBtn">Comenzar entrenamiento</button>
      </div>
    `;

    mainEl.innerHTML = html;
    document.getElementById('startBtn').addEventListener('click', ()=>{
      const name = document.getElementById('workoutName').value.trim() || 'Entrenamiento';
      active = { id: Date.now().toString(), name, date: new Date().toISOString(), startTime: Date.now(), exercises: [], globalNote: '' };
      saveActive(); startTimer(); render();
    });
    mainEl.querySelectorAll('[data-use-routine]').forEach(b=> b.addEventListener('click', ()=> startFromRoutine(b.dataset.useRoutine)));
    return;
  }

  let totalVol = 0, totalSetsCount = 0;
  active.exercises.forEach(ex => {
    ex.sets.forEach(s => {
      if(s.type !== 'W' && s.done && s.weight !== '' && s.reps !== '') { totalVol += Number(s.weight) * Number(s.reps); totalSetsCount++; }
    });
  });

  const durationSecs = Math.floor((Date.now() - active.startTime) / 1000);

  let html = `
    <div id="restTimerBar" class="rest-timer-bar ${restSecondsRemaining > 0 ? '' : 'hidden'}">
      <span class="rest-timer-info">⏱️ Descanso</span>
      <div class="rest-controls">
        <button class="rest-btn-sm" id="restMinus">-30s</button>
        <span class="rest-timer-countdown" id="restCountdown">${restSecondsRemaining}s</span>
        <button class="rest-btn-sm" id="restPlus">+30s</button>
        <button class="rest-btn-sm" id="restCancel" style="color:var(--danger);">✕</button>
      </div>
    </div>
    <div class="session-stats-bar">
      <div class="stat-item"><div class="s-label">Duración</div><div class="s-val time" id="liveDuration">${formatDuration(durationSecs)}</div></div>
      <div class="stat-item"><div class="s-label">Volumen</div><div class="s-val" id="liveVolume">${toDisplayWeight(totalVol).toLocaleString('es-AR')} ${weightUnit}</div></div>
      <div class="stat-item"><div class="s-label">Series</div><div class="s-val" id="liveSets">${totalSetsCount}</div></div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; gap:10px;">
      <h2 style="font-size:18px; margin:0; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(active.name)}</h2>
      <button class="btn-ghost" id="discardBtn" style="color:var(--danger); border-color:var(--danger); flex-shrink:0;">Descartar</button>
    </div>
  `;

  if(active.exercises.length === 0){ html += `<div class="empty-state" style="padding:40px 10px;"><div class="big">Sin ejercicios agregados</div></div>`; }

  active.exercises.forEach((ex, exIdx)=>{
    const cat = getExerciseCategory(ex.name);
    const isSuperset = ex.superset;

    html += `<div class="exercise-card ${exIdx === newlyAddedExIdx ? 'is-new' : ''} ${isSuperset ? 'is-superset' : ''} ${exIdx>0 && active.exercises[exIdx-1].superset ? 'is-superset-next' : ''}" data-eidx="${exIdx}">
      <div class="exercise-header">
        <div class="exercise-title-wrap">
          <div class="drag-handle" data-drag-handle="${exIdx}" title="Mantené presionado para reordenar"><span></span><span></span><span></span><span></span><span></span><span></span></div>
          <div class="muscle-mini-icon" title="${cat}">${getExerciseMiniFigure(ex.name)}</div>
          <h3>${escapeHtml(ex.name)}</h3>
        </div>
        <div class="exercise-actions-top">
          <button class="btn-icon" data-video-ex="${exIdx}" title="Ver video de ejecución" style="width:26px; height:26px; font-size:12px;">🎥</button>
          <button class="btn-icon ${isSuperset ? 'active-toggle' : ''}" data-toggle-superset="${exIdx}" title="${isSuperset ? 'Quitar de la superserie' : 'Agregar ejercicio en superserie'}" style="width:26px; height:26px; font-size:12px;">🔗</button>
          <button class="btn-icon" data-toggle-collapse="${exIdx}" style="width:26px; height:26px; font-size:12px;">${ex.collapsed ? '▼' : '▲'}</button>
          <button class="btn-icon" data-remove-ex="${exIdx}" style="width:26px; height:26px; font-size:13px;">✕</button>
        </div>
      </div>`;

    if(!ex.collapsed){
      html += `<div class="ex-rest-row"><button class="rest-pill" data-edit-rest="${exIdx}">⏱️ Descanso: ${ex.restSeconds ?? 90}s</button></div>
        <input type="text" class="exercise-note-input" placeholder="Añadir nota al ejercicio..." value="${escapeHtml(ex.note || '')}" data-ex-note="${exIdx}">
        <div class="set-table-head"><span>S</span><span>Anterior</span><span>${weightUnit.toUpperCase()}</span><span>Reps</span><span>✓</span></div>`;

      ex.sets.forEach((s, sIdx)=>{
        const isPr = isPersonalRecord(ex.name, s.weight, s.reps, s.type, exIdx, sIdx);
        const isVol = !isPr && isVolumeRecord(ex.name, s.weight, s.reps, s.type, exIdx, sIdx);
        const isSuspicious = isSuspiciousSet(ex.name, s.weight, s.reps, s.type);
        const prevStr = getLastSetString(ex.name, sIdx);
        html += `<div class="set-swipe-wrap" data-swipe-wrap="${exIdx}-${sIdx}">
          <div class="set-swipe-delete">🗑️</div>
          <div class="set-row-hevy ${s.done ? 'done':''} ${isPr ? 'is-pr':''} ${isVol ? 'is-volume-pr':''} ${isSuspicious ? 'is-suspicious':''} ${getSetTypeRowClass(s.type)}" data-row="${exIdx}-${sIdx}" title="${isSuspicious ? 'Revisá este valor: parece fuera de lo normal' : ''}">
            <div class="set-badge" data-open-type-menu="${exIdx}-${sIdx}" title="Toca para elegir el tipo de serie">${s.type === 'N' ? (isPr ? '🏆' : (isVol ? '📈' : sIdx+1)) : SET_TYPE_INFO[s.type].badge}</div>
            <div class="set-prev">${prevStr}</div>
            <input type="number" inputmode="decimal" min="0" max="${unitMaxWeight()}" placeholder="0" value="${s.weight === '' || s.weight == null ? '' : toDisplayWeight(s.weight)}" data-ex="${exIdx}" data-set="${sIdx}" data-field="weight">
            <input type="number" inputmode="numeric" step="1" min="0" max="99" placeholder="0" value="${s.reps ?? ''}" data-ex="${exIdx}" data-set="${sIdx}" data-field="reps">
            <button class="set-check-btn" data-toggle-ex="${exIdx}" data-toggle-set="${sIdx}">✓</button>
          </div>
        </div>`;
      });
      html += `<button class="add-set-hevy" data-addset="${exIdx}">+ Agregar serie</button>`;
    }
    html += `</div>`;
  });

  html += `<button class="add-exercise-btn" id="addExBtn">+ Agregar ejercicio</button>`;

  if(active.exercises.length > 0){
    html += `<textarea id="globalNoteInput" class="global-note-input" placeholder="Notas generales del entrenamiento...">${escapeHtml(active.globalNote || '')}</textarea>`;
    html += `<button class="btn-primary" id="finishBtn" style="padding:16px; font-size:16px; margin-bottom:20px;">Terminar entrenamiento</button>`;
  }

  mainEl.innerHTML = html;
  updateRestBar();
  newlyAddedExIdx = -1;

  if(document.getElementById('discardBtn')) document.getElementById('discardBtn').addEventListener('click', ()=>{ if(confirm('¿Descartar este entrenamiento sin guardar?')){ if(saveActiveDebounceTimer){ clearTimeout(saveActiveDebounceTimer); saveActiveDebounceTimer = null; } active = null; saveActive(); render(); }});
  if(document.getElementById('finishBtn')) document.getElementById('finishBtn').addEventListener('click', finishWorkout);
  if(document.getElementById('addExBtn')) document.getElementById('addExBtn').addEventListener('click', ()=>{ openExercisePicker((name)=>{ newlyAddedExIdx = active.exercises.length; const sug = getSuggestedSet(name, 0); active.exercises.push({ name, note: '', collapsed:false, superset:false, restSeconds:90, sets:[{ weight: sug ? sug.weight : '', reps: sug ? sug.reps : '', done:false, type:'N' }] }); saveActive(); render(); }); });
  if(document.getElementById('globalNoteInput')) document.getElementById('globalNoteInput').addEventListener('input', (e)=>{ active.globalNote = e.target.value; saveActiveDebounced(); });
  if(document.getElementById('restMinus')) document.getElementById('restMinus').addEventListener('click', ()=> adjustRest(-30));
  if(document.getElementById('restPlus')) document.getElementById('restPlus').addEventListener('click', ()=> adjustRest(30));
  if(document.getElementById('restCancel')) document.getElementById('restCancel').addEventListener('click', ()=>{ if(restInterval) clearInterval(restInterval); restSecondsRemaining = 0; updateRestBar(); });

  mainEl.querySelectorAll('[data-remove-ex]').forEach(b=> b.addEventListener('click', ()=>{ if(confirm('¿Eliminar este ejercicio del entrenamiento?')){ active.exercises.splice(parseInt(b.dataset.removeEx),1); saveActive(); render(); } }));
  mainEl.querySelectorAll('[data-toggle-collapse]').forEach(b=> b.addEventListener('click', ()=>{ const ex = active.exercises[parseInt(b.dataset.toggleCollapse)]; ex.collapsed = !ex.collapsed; saveActive(); render(); }));
  mainEl.querySelectorAll('[data-toggle-superset]').forEach(b=> b.addEventListener('click', ()=>{
    const idx = parseInt(b.dataset.toggleSuperset);
    const ex = active.exercises[idx];
    if(ex.superset){ ex.superset = false; saveActive(); render(); return; }
    openExercisePicker((name)=>{
      const sug = getSuggestedSet(name, 0);
      active.exercises.splice(idx+1, 0, { name, note:'', collapsed:false, superset:false, restSeconds:90, sets:[{ weight: sug ? sug.weight : '', reps: sug ? sug.reps : '', done:false, type:'N' }] });
      ex.superset = true;
      newlyAddedExIdx = idx+1;
      saveActive(); render();
    });
  }));
  mainEl.querySelectorAll('[data-edit-rest]').forEach(b=> b.addEventListener('click', ()=>{
    const ex = active.exercises[parseInt(b.dataset.editRest)];
    const raw = prompt('Descanso entre series (segundos):', ex.restSeconds ?? 90);
    if(raw === null) return;
    const val = parseInt(raw, 10);
    if(isNaN(val) || val < 0 || val > 600){ alert('Ingresá un tiempo válido (0 a 600 segundos).'); return; }
    ex.restSeconds = val; saveActive(); render();
  }));
  mainEl.querySelectorAll('[data-video-ex]').forEach(b=> b.addEventListener('click', ()=>{ const ex = active.exercises[parseInt(b.dataset.videoEx)]; openVideoModal(ex.name); }));
  bindDragReorder('exercise-card', () => active.exercises, saveActive);
  bindSetSwipe();

  mainEl.querySelectorAll('[data-addset]').forEach(b=> b.addEventListener('click', ()=>{ const sets = active.exercises[parseInt(b.dataset.addset)].sets; const last = sets[sets.length-1]; sets.push({ weight: last ? last.weight : '', reps: last ? last.reps : '', done:false, type: last ? last.type : 'N' }); saveActive(); render(); }));

  // Inputs de peso y reps: sanitizan en vivo (reps siempre entero, sin negativos) y refrescan el estado de récord sin perder el foco.
  mainEl.querySelectorAll('input[data-field]').forEach(inp=>{
    inp.addEventListener('input', ()=>{
      const exIdx = parseInt(inp.dataset.ex), sIdx = parseInt(inp.dataset.set), field = inp.dataset.field;
      let raw = inp.value;
      let invalid = false;

      if(/[^0-9.,]/.test(raw)){ raw = raw.replace(/[^0-9.,]/g, ''); invalid = true; }
      if(field === 'reps'){
        if(/[.,]/.test(raw)){ raw = raw.split(/[.,]/)[0]; invalid = true; }
        if(raw.includes('-')){ raw = raw.replace(/-/g,''); invalid = true; }
        if(raw !== '' && Number(raw) > 99){ raw = '99'; invalid = true; }
      } else if(field === 'weight'){
        if(raw.includes('-')){ raw = raw.replace(/-/g,''); invalid = true; }
        if(raw !== '' && !/^\d*(\.\d{0,2})?$/.test(raw)){ raw = raw.slice(0, -1); invalid = true; }
        if(raw !== '' && Number(raw) > unitMaxWeight()){ raw = String(unitMaxWeight()); invalid = true; }
      }
      if(raw !== inp.value) inp.value = raw;
      if(invalid){
        inp.classList.remove('input-invalid'); void inp.offsetWidth; inp.classList.add('input-invalid');
        setTimeout(()=> inp.classList.remove('input-invalid'), 400);
      }

      const parsed = raw === '' ? '' : parseFloat(raw);
      active.exercises[exIdx].sets[sIdx][field] = (field === 'weight' && parsed !== '') ? toKgWeight(parsed) : parsed;
      saveActiveDebounced();
      liveUpdateRow(exIdx, sIdx);
    });
  });

  mainEl.querySelectorAll('[data-ex-note]').forEach(inp=> inp.addEventListener('input', ()=>{ active.exercises[parseInt(inp.dataset.exNote)].note = inp.value; saveActiveDebounced(); }));

  mainEl.querySelectorAll('[data-open-type-menu]').forEach(b=> b.addEventListener('click', ()=>{
    const [exIdx, sIdx] = b.dataset.openTypeMenu.split('-'); const s = active.exercises[exIdx].sets[sIdx];
    openSetTypeMenu(s.type, (newType)=>{ s.type = newType; saveActive(); render(); });
  }));

  mainEl.querySelectorAll('[data-toggle-ex]').forEach(b=> b.addEventListener('click', ()=>{
    const exIdx = parseInt(b.dataset.toggleEx), sIdx = parseInt(b.dataset.toggleSet);
    const ex = active.exercises[exIdx], s = ex.sets[sIdx];
    if(!s.done && (s.weight === '' || s.reps === '')){
      const rowEl = mainEl.querySelector(`[data-row="${exIdx}-${sIdx}"]`);
      if(rowEl){ rowEl.querySelectorAll('input').forEach(i=>{ i.classList.remove('input-invalid'); void i.offsetWidth; i.classList.add('input-invalid'); setTimeout(()=>i.classList.remove('input-invalid'),400); }); }
      return;
    }
    s.done = !s.done; saveActive();
    if(s.done) {
      if(isPersonalRecord(ex.name, s.weight, s.reps, s.type, exIdx, sIdx) || isVolumeRecord(ex.name, s.weight, s.reps, s.type, exIdx, sIdx)) fireConfetti();
      if(!ex.superset) startRestTimer(ex.restSeconds ?? 90);
    }
    // Actualizamos solo la fila y las estadísticas en vez de re-renderizar toda la pantalla:
    // evita que todas las tarjetas repitan su animación y que se pierda la posición del scroll.
    const rowEl = mainEl.querySelector(`[data-row="${exIdx}-${sIdx}"]`);
    if(rowEl) rowEl.classList.toggle('done', s.done);
    liveUpdateRow(exIdx, sIdx);
    updateSessionStatsBar();
  }));
}

// Recalcula volumen y series totales de la sesión activa y actualiza esos números sin tocar el resto del DOM.
function updateSessionStatsBar(){
  if(!active) return;
  let totalVol = 0, totalSetsCount = 0;
  active.exercises.forEach(ex => ex.sets.forEach(s => {
    if(s.type !== 'W' && s.done && s.weight !== '' && s.reps !== ''){ totalVol += Number(s.weight) * Number(s.reps); totalSetsCount++; }
  }));
  const volEl = document.getElementById('liveVolume'), setsEl = document.getElementById('liveSets');
  if(volEl) volEl.textContent = `${toDisplayWeight(totalVol).toLocaleString('es-AR')} ${weightUnit}`;
  if(setsEl) setsEl.textContent = totalSetsCount;
}

// Actualiza solo la fila puntual (récord + badge) sin re-renderizar todo, para no perder el foco al tipear.
function liveUpdateRow(exIdx, sIdx){
  const ex = active.exercises[exIdx];
  const s = ex.sets[sIdx];
  const rowEl = mainEl.querySelector(`[data-row="${exIdx}-${sIdx}"]`);
  if(!rowEl) return;
  const isPr = isPersonalRecord(ex.name, s.weight, s.reps, s.type, exIdx, sIdx);
  const isVol = !isPr && isVolumeRecord(ex.name, s.weight, s.reps, s.type, exIdx, sIdx);
  const isSuspicious = isSuspiciousSet(ex.name, s.weight, s.reps, s.type);
  rowEl.classList.toggle('is-pr', isPr && s.type === 'N');
  rowEl.classList.toggle('is-volume-pr', isVol && s.type === 'N');
  rowEl.classList.toggle('is-suspicious', isSuspicious);
  rowEl.title = isSuspicious ? 'Revisá este valor: parece fuera de lo normal' : '';
  const badge = rowEl.querySelector('.set-badge');
  if(badge && s.type === 'N') badge.textContent = isPr ? '🏆' : (isVol ? '📈' : (sIdx+1));
}

function openExercisePicker(onPick){
  let currentCat = 'Todos';
  const overlay = document.createElement('div'); overlay.className = 'picker-overlay';
  overlay.innerHTML = `<div class="picker-sheet"><h3>Seleccionar ejercicio</h3><input type="text" id="pickerSearch" placeholder="Buscar o crear ejercicio..."><div class="categories-filter" id="catFilter"><div class="cat-pill active" data-cat="Todos">Todos</div><div class="cat-pill" data-cat="Pecho">Pecho</div><div class="cat-pill" data-cat="Espalda">Espalda</div><div class="cat-pill" data-cat="Piernas">Piernas</div><div class="cat-pill" data-cat="Hombros">Hombros</div><div class="cat-pill" data-cat="Brazos">Brazos</div><div class="cat-pill" data-cat="Core">Core</div></div><div class="picker-list" id="pickerList"></div></div>`;
  document.body.appendChild(overlay);
  const listEl = overlay.querySelector('#pickerList'), searchEl = overlay.querySelector('#pickerSearch');

  function allExercises(){
    const catalogNames = new Set(EXERCISE_CATALOG.map(e=>e.name));
    const custom = exercises.filter(n => !catalogNames.has(n)).map(n => ({ name:n, cat: getExerciseCategory(n) }));
    return EXERCISE_CATALOG.concat(custom);
  }

  function renderList(filter){
    const f = (filter||'').toLowerCase();
    const all = allExercises();
    const matching = all.filter(item => (currentCat === 'Todos' || item.cat === currentCat) && item.name.toLowerCase().includes(f));
    let html = matching.map(item => `<div class="picker-item" data-name="${escapeHtml(item.name)}"><div class="picker-item-left"><div class="muscle-mini-icon" style="width:28px; height:28px;">${getExerciseMiniFigure(item.name)}</div>${escapeHtml(item.name)}</div><div style="display:flex; align-items:center; gap:8px;"><button class="btn-icon" data-video-name="${escapeHtml(item.name)}" title="Ver video de ejecución" style="width:24px; height:24px; font-size:11px;">🎥</button><span>${item.cat}</span></div></div>`).join('');
    if(f && !all.some(i => i.name.toLowerCase() === f)) html += `<div class="picker-item" style="color:var(--accent);" data-newname="${escapeHtml(filter.trim())}"><div class="picker-item-left"><div class="muscle-mini-icon" style="width:28px; height:28px;">${getExerciseMiniFigure(getExerciseCategory(filter.trim()))}</div>+ Crear "${escapeHtml(filter.trim())}"</div><span>Nuevo</span></div>`;
    listEl.innerHTML = html || '<div class="picker-item" style="color:var(--text-dim); justify-content:center;">Sin resultados</div>';
    listEl.querySelectorAll('[data-name]').forEach(el=> el.addEventListener('click', ()=> pick(el.dataset.name)));
    listEl.querySelectorAll('[data-newname]').forEach(el=> el.addEventListener('click', ()=>{ const name = el.dataset.newname.trim(); if(name && !exercises.includes(name)){ exercises.push(name); saveExercises(); } pick(name); }));
    listEl.querySelectorAll('[data-video-name]').forEach(el=> el.addEventListener('click', (e)=>{ e.stopPropagation(); openVideoModal(el.dataset.videoName); }));
  }
  function pick(name){ if(!name) return; document.body.removeChild(overlay); onPick(name); }
  overlay.querySelectorAll('[data-cat]').forEach(pill=> pill.addEventListener('click', ()=>{ overlay.querySelectorAll('[data-cat]').forEach(p=>p.classList.remove('active')); pill.classList.add('active'); currentCat = pill.dataset.cat; renderList(searchEl.value); }));
  searchEl.addEventListener('input', ()=> renderList(searchEl.value));
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) document.body.removeChild(overlay); });
  renderList('');
}

function startFromRoutine(routineId){
  const r = routines.find(x => x.id === routineId); if(!r) return;
  active = { id: Date.now().toString(), name: r.title, date: new Date().toISOString(), startTime: Date.now(), globalNote: '', exercises: r.exercises.map(normalizeRoutineExercise).map(re => ({ name: re.name, note: re.note || '', collapsed:false, superset: re.superset || false, restSeconds: re.restSeconds ?? 90, sets: re.sets.map((s, sIdx) => {
    if(s.weight !== '' && s.reps !== '') return { weight: s.weight, reps: s.reps, done:false, type: s.type };
    const sug = getSuggestedSet(re.name, sIdx);
    return { weight: s.weight !== '' ? s.weight : (sug ? sug.weight : ''), reps: s.reps !== '' ? s.reps : (sug ? sug.reps : ''), done:false, type: s.type };
  }) })) };
  saveActive(); startTimer(); currentTab = 'train'; render();
}

function repeatWorkout(workoutId){
  const w = workouts.find(x => x.id === workoutId); if(!w) return;
  active = { id: Date.now().toString(), name: w.name, date: new Date().toISOString(), startTime: Date.now(), globalNote: '', exercises: JSON.parse(JSON.stringify(w.exercises)) };
  active.exercises.forEach(ex => { ex.collapsed=false; ex.sets.forEach(s => s.done=false); });
  saveActive(); startTimer(); currentTab = 'train'; render();
}

function finishWorkout(){
  if(saveActiveDebounceTimer){ clearTimeout(saveActiveDebounceTimer); saveActiveDebounceTimer = null; }
  const suspiciousExNames = [...new Set(
    active.exercises
      .filter(ex => ex.sets.some(s => s.done && isSuspiciousSet(ex.name, s.weight, s.reps, s.type)))
      .map(ex => ex.name)
  )];
  const confirmMsg = suspiciousExNames.length
    ? `⚠️ Revisá "${suspiciousExNames.join('", "')}": el peso o las repeticiones parecen fuera de lo normal.\n\n¿Estás seguro que querés finalizar el entrenamiento?`
    : '¿Estás seguro que querés finalizar el entrenamiento?';
  if(!confirm(confirmMsg)) return;

  const hasAnyDone = active.exercises.some(ex => ex.sets.some(s => s.done));
  if(!hasAnyDone){ if(!confirm('No marcaste ninguna serie como completada. ¿Terminar igual?')) return; }

  let errorMsg = "";
  active.exercises.forEach(ex => {
    ex.sets.forEach((s) => {
      if((s.weight !== '' && s.reps === '') || (s.weight === '' && s.reps !== '')) errorMsg = `En "${ex.name}" falta completar peso o reps en una serie.`;
      if(s.reps !== '' && !Number.isInteger(Number(s.reps))) errorMsg = `En "${ex.name}" las repeticiones deben ser un número entero.`;
      if(s.weight !== '' && Number(s.weight) < 0) errorMsg = `En "${ex.name}" el peso no puede ser negativo.`;
      if(Number(s.weight) > 999 || Number(s.reps) > 99) errorMsg = `En "${ex.name}" hay un valor fuera de rango.`;
    });
  });
  if(errorMsg){ alert("⚠️ Revisá tus datos:\n" + errorMsg); return; }

  const cleaned = {
    ...active, duration: Math.floor((Date.now() - active.startTime) / 1000),
    exercises: active.exercises.map(ex => ({ name: ex.name, note: ex.note || '', superset: ex.superset||false, sets: ex.sets.filter(s => s.done && s.weight !== '' && s.reps !== '') })).filter(ex => ex.sets.length > 0)
  };

  let recordsList = [];
  cleaned.exercises.forEach(ex => {
    let sessionMax = 0;
    let sessionBestRepsByWeight = {};
    ex.sets.forEach(s => {
      if(s.type === 'W') return;
      if(isPersonalRecordBefore(ex.name, s.weight, workouts, sessionMax)){
        recordsList.push(`¡Nuevo récord en ${ex.name}: ${fmtW(s.weight)} × ${s.reps}!`);
        sessionMax = Number(s.weight);
      } else {
        const wKey = String(s.weight);
        const priorBestReps = sessionBestRepsByWeight[wKey] || 0;
        if(isVolumeRecordBefore(ex.name, s.weight, s.reps, workouts, priorBestReps)){
          recordsList.push(`📈 Récord de volumen en ${ex.name}: ${fmtW(s.weight)} × ${s.reps}!`);
        }
        if(Number(s.reps) > priorBestReps) sessionBestRepsByWeight[wKey] = Number(s.reps);
      }
    });
  });
  cleaned.recordsCount = recordsList.length;

  workouts.unshift(cleaned);
  const finishedWorkout = cleaned; active = null; saveWorkouts(); saveActive();
  if(timerInterval) clearInterval(timerInterval); if(restInterval) clearInterval(restInterval); restSecondsRemaining = 0;
  showSummaryModal(finishedWorkout, recordsList);
}

function showSummaryModal(w, achievements){
  const totalVol = w.exercises.reduce((acc,ex)=> acc + ex.sets.reduce((a,s)=> a + (s.type!=='W' ? (s.weight*s.reps) : 0),0), 0);
  const totalSets = w.exercises.reduce((acc,ex)=> acc + ex.sets.length, 0);

  let praiseTitle = "¡Buen entrenamiento!"; let praiseText = "Dejaste todo en el gimnasio hoy.";
  if(achievements.length > 0) { praiseTitle = "¡Sesión con récords!"; praiseText = `Superaste ${achievements.length} récord${achievements.length>1?'es':''} personal${achievements.length>1?'es':''}.`; fireConfetti(); }
  else if(totalVol > 5000) { praiseTitle = "¡Volumen enorme!"; praiseText = `Moviste ${toDisplayWeight(totalVol).toLocaleString('es-AR')} ${weightUnit} en total.`; }

  const modal = document.createElement('div'); modal.className = 'modal-overlay';
  modal.innerHTML = `<div class="modal-card"><h2>${praiseTitle}</h2><p>${praiseText}</p><div class="summary-grid"><div class="summary-box"><div class="sb-label">Tiempo</div><div class="sb-val">${formatDuration(w.duration || 0)}</div></div><div class="summary-box"><div class="sb-label">Volumen</div><div class="sb-val">${toDisplayWeight(totalVol).toLocaleString('es-AR')} ${weightUnit}</div></div><div class="summary-box"><div class="sb-label">Ejercicios</div><div class="sb-val">${w.exercises.length}</div></div><div class="summary-box"><div class="sb-label">Series</div><div class="sb-val">${totalSets}</div></div></div>${achievements.length > 0 ? `<div class="achievement-list"><div style="font-weight:600; font-size:12px; color:var(--gold); margin-bottom:6px;">🏆 LOGROS</div>${achievements.map(a => `<div class="achievement-item">✓ ${escapeHtml(a)}</div>`).join('')}</div>` : ''}<button class="btn-primary" id="closeSummaryBtn">Continuar</button></div>`;
  document.body.appendChild(modal);
  document.getElementById('closeSummaryBtn').addEventListener('click', ()=>{ document.body.removeChild(modal); currentTab = 'history'; render(); });
}

// ---- RUTINAS ----
function renderRoutines(){
  if(routineDraft){ renderRoutineEditor(); return; }

  let html = `<button class="add-exercise-btn" id="newRoutineBtn" style="margin-bottom:16px;">+ Crear nueva rutina</button>`;

  if(routines.length === 0){
    html += `<div class="empty-state" style="padding:20px 10px;">
      <div class="big">Sin rutinas guardadas</div>
      <button class="btn-primary" id="loadDefaultsBtn" style="margin-top:16px;">Cargar plantillas predeterminadas</button>
    </div>`;
  } else {
    const todayJs = new Date().getDay();
    routines.forEach(r=>{
      const exNames = r.exercises.map(e => typeof e === 'string' ? e : e.name);
      const isToday = (r.days||[]).includes(todayJs);
      const dayTags = (r.days||[]).length ? WEEKDAY_JS_VALUES.map((jsVal,i)=> (r.days||[]).includes(jsVal) ? WEEKDAY_LABELS[i] : '').filter(Boolean).join(' ') : '';
      html += `<div class="workout-card"><div class="wc-head" style="display:flex; justify-content:space-between; align-items:center;"><div><div class="wc-title-main">${escapeHtml(r.title)}${isToday ? '<span style="background:var(--accent); color:#fff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px; margin-left:8px; vertical-align:middle;">HOY</span>' : ''}</div><div style="font-size:12px; color:var(--text-dim);">${exNames.map(escapeHtml).join(', ') || 'Sin ejercicios'}</div>${dayTags ? `<div style="font-size:11px; color:var(--text-dim); margin-top:4px;">📅 ${dayTags}</div>` : ''}</div><button class="btn-primary" style="width:auto; padding:10px 16px; font-size:13px;" data-use="${r.id}">Empezar</button></div><div class="wc-body" style="border-top:1px solid var(--border); display:flex; gap:8px; padding-top:12px;"><button class="btn-ghost" style="flex:1;" data-edit="${r.id}">Editar</button><button class="btn-ghost" style="flex:1;" data-dup="${r.id}">Duplicar</button><button class="btn-danger-ghost" style="flex:1;" data-del="${r.id}">Borrar</button></div></div>`;
    });
  }

  mainEl.innerHTML = html;
  document.getElementById('newRoutineBtn').addEventListener('click', ()=>{ routineDraft = { id: Date.now().toString(), title: '', exercises: [], days: [] }; render(); });
  if(document.getElementById('loadDefaultsBtn')) document.getElementById('loadDefaultsBtn').addEventListener('click', ()=>{ routines = JSON.parse(JSON.stringify(PREDEFINED_ROUTINES)); saveRoutines(); render(); });
  mainEl.querySelectorAll('[data-use]').forEach(b=> b.addEventListener('click', ()=> startFromRoutine(b.dataset.use)));
  mainEl.querySelectorAll('[data-edit]').forEach(b=> b.addEventListener('click', ()=>{ const r = routines.find(x => x.id === b.dataset.edit); routineDraft = { id: r.id, title: r.title, exercises: r.exercises.map(normalizeRoutineExercise), days: r.days || [] }; render(); }));
  mainEl.querySelectorAll('[data-dup]').forEach(b=> b.addEventListener('click', ()=>{
    const r = routines.find(x => x.id === b.dataset.dup); if(!r) return;
    const copy = JSON.parse(JSON.stringify(r));
    copy.id = Date.now().toString();
    copy.title = r.title + ' (copia)';
    routines.push(copy); saveRoutines(); render();
  }));
  mainEl.querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', ()=>{ if(confirm('¿Eliminar esta rutina?')){ routines = routines.filter(x => x.id !== b.dataset.del); saveRoutines(); render(); } }));
}

// Reordenar ejercicios de la rutina con el mango de 6 puntos, apto para touch (pointer events).
// Al soltar, calcula sobre qué tarjeta quedó el dedo/mouse (usando las posiciones originales) y
// mueve el ejercicio en routineDraft.exercises a esa posición.
// Deslizar una fila de serie (Entrenar) hacia la izquierda la borra, revelando el tacho rojo de fondo.
// Soltar antes del umbral la devuelve a su lugar. Solo se usa en Entrenar; en el editor de rutinas
// las series se borran con la cruz roja fija.
function bindSetSwipe(){
  mainEl.querySelectorAll('[data-swipe-wrap]').forEach(wrap=>{
    const row = wrap.querySelector('.set-row-hevy');
    let startX = 0, dx = 0, dragging = false;
    row.addEventListener('pointerdown', (e)=>{
      if(e.target.closest('input, button, .set-badge')) return;
      startX = e.clientX; dragging = true; row.style.transition = 'none';
      row.setPointerCapture(e.pointerId);
    });
    row.addEventListener('pointermove', (e)=>{
      if(!dragging) return;
      dx = Math.min(0, e.clientX - startX);
      row.style.transform = `translateX(${dx}px)`;
    });
    const endSwipe = ()=>{
      if(!dragging) return;
      dragging = false;
      row.style.transition = 'transform 0.2s ease';
      if(dx < -70){
        row.style.transform = 'translateX(-100%)';
        const [exIdx, sIdx] = wrap.dataset.swipeWrap.split('-').map(Number);
        setTimeout(()=>{
          const sets = active.exercises[exIdx].sets;
          sets.splice(sIdx, 1);
          if(sets.length === 0) sets.push({ weight:'', reps:'', done:false, type:'N' });
          saveActive(); render();
        }, 180);
      } else {
        row.style.transform = '';
      }
      dx = 0;
    };
    row.addEventListener('pointerup', endSwipe);
    row.addEventListener('pointercancel', endSwipe);
  });
}

// Calcula sobre qué posición original quedó el puntero, comparando contra el punto medio de cada tarjeta.
function computeDropTargetIdx(rects, y){
  for(let i=0; i<rects.length; i++){ if(y < rects[i].top + rects[i].height/2) return i; }
  return rects.length - 1;
}

// Reordenar tarjetas (ejercicios de una rutina, o de un entrenamiento activo) con el mango de 6 puntos,
// apto para touch. cardClass identifica las tarjetas en el DOM, getArray devuelve el array a reordenar
// (evaluado en cada uso porque puede cambiar entre renders) y afterReorder guarda el resultado.
function bindDragReorder(cardClass, getArray, afterReorder){
  let drag = null;
  const cardsSel = ()=> [...mainEl.querySelectorAll('.'+cardClass)];

  // Mientras se arrastra, las tarjetas de en medio se corren (con transición CSS) para "abrir hueco"
  // en la posición donde quedaría la tarjeta si se soltara ahora, simulando drag-and-drop nativo.
  function applyGapAnimation(targetIdx){
    const cards = cardsSel();
    const order = drag.rects.map((_, i) => i).filter(i => i !== drag.idx);
    order.splice(Math.min(targetIdx, order.length), 0, drag.idx);
    const gap = drag.rects.length > 1 ? (drag.rects[1].top - (drag.rects[0].top + drag.rects[0].height)) : 0;
    let cursor = drag.rects[0].top;
    const slotTop = [];
    order.forEach(origIdx => { slotTop.push(cursor); cursor += drag.rects[origIdx].height + gap; });
    cards.forEach((c, origIdx) => {
      if(origIdx === drag.idx) return;
      const slot = order.indexOf(origIdx);
      c.style.transform = `translateY(${slotTop[slot] - drag.rects[origIdx].top}px)`;
    });
  }

  mainEl.querySelectorAll(`.${cardClass} [data-drag-handle]`).forEach(handle=>{
    handle.addEventListener('pointerdown', (e)=>{
      e.preventDefault();
      const idx = parseInt(handle.dataset.dragHandle);
      const card = handle.closest('.'+cardClass);
      const rects = cardsSel().map(c => c.getBoundingClientRect());
      drag = { idx, card, startY: e.clientY, lastY: e.clientY, rects, lastTarget: idx };
      card.classList.add('dragging');
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e)=>{
      if(!drag) return;
      drag.lastY = e.clientY;
      drag.card.style.transform = `translateY(${e.clientY - drag.startY}px) scale(1.02)`;
      const target = computeDropTargetIdx(drag.rects, e.clientY);
      if(target !== drag.lastTarget){ drag.lastTarget = target; applyGapAnimation(target); }
    });
    const endDrag = ()=>{
      if(!drag) return;
      const targetIdx = computeDropTargetIdx(drag.rects, drag.lastY);
      cardsSel().forEach(c => { c.style.transform = ''; });
      drag.card.classList.remove('dragging');
      if(targetIdx !== drag.idx){
        const arr = getArray();
        const moved = arr.splice(drag.idx, 1)[0];
        arr.splice(targetIdx, 0, moved);
        afterReorder();
        render();
      }
      drag = null;
    };
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
  });
}

function renderRoutineEditor(){
  const isNew = !routines.some(r => r.id === routineDraft.id);
  let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;"><h2 style="font-size:18px; margin:0; font-weight:700;">${isNew ? 'Nueva rutina' : 'Editar rutina'}</h2></div><div class="start-card" style="margin-bottom:16px;"><label>Título</label><input type="text" id="routineTitle" placeholder="Ej: Pecho y tríceps" value="${escapeHtml(routineDraft.title)}">
    <label style="margin-top:4px;">Días de la semana (opcional, sugiere esta rutina primero ese día)</label>
    <div style="display:flex; gap:6px; flex-wrap:wrap;">
      ${WEEKDAY_LABELS.map((lbl,i)=>{ const jsVal = WEEKDAY_JS_VALUES[i]; const isActive = (routineDraft.days||[]).includes(jsVal); return `<button type="button" class="btn-icon ${isActive?'active-toggle':''}" data-toggle-day="${jsVal}" style="width:36px; height:36px;">${lbl}</button>`; }).join('')}
    </div>
  </div>`;
  if(routineDraft.exercises.length === 0){ html += `<div class="empty-state"><div class="big">Sin ejercicios</div></div>`; }
  else {
    routineDraft.exercises.forEach((re, idx)=>{
      const isSuperset = re.superset;
      html += `<div class="routine-ex-card ${isSuperset ? 'is-superset' : ''} ${idx>0 && routineDraft.exercises[idx-1].superset ? 'is-superset-next' : ''}" data-ridx="${idx}">
        <div class="routine-ex-top">
          <div class="drag-handle" data-drag-handle="${idx}" title="Mantené presionado para reordenar"><span></span><span></span><span></span><span></span><span></span><span></span></div>
          <div class="muscle-mini-icon" style="width:30px; height:30px;">${getExerciseMiniFigure(re.name)}</div>
          <div class="routine-ex-name">${escapeHtml(re.name)}</div>
          <button class="btn-icon" data-video-routine-ex="${escapeHtml(re.name)}" title="Ver video de ejecución" style="width:26px; height:26px; font-size:12px;">🎥</button>
          <button class="btn-icon ${isSuperset ? 'active-toggle' : ''}" data-toggle-routine-superset="${idx}" title="${isSuperset ? 'Quitar de la superserie' : 'Agregar ejercicio en superserie'}" style="width:26px; height:26px; font-size:12px;">🔗</button>
          <button class="btn-icon" data-toggle-routine-collapse="${idx}" style="width:26px; height:26px; font-size:12px;">${re.collapsed ? '▼' : '▲'}</button>
          <button class="btn-icon" data-remove-routine-ex="${idx}" style="width:26px; height:26px; font-size:13px;">✕</button>
        </div>
        ${re.collapsed ? '' : `
        <div class="ex-rest-row"><button class="rest-pill" data-edit-routine-rest="${idx}">⏱️ Descanso: ${re.restSeconds ?? 90}s</button></div>
        <input type="text" class="exercise-note-input" placeholder="Añadir nota al ejercicio..." value="${escapeHtml(re.note || '')}" data-routine-ex-note="${idx}">
        <div class="set-table-head"><span>S</span><span>Previo</span><span>${weightUnit.toUpperCase()}</span><span>Reps</span><span></span></div>
        ${re.sets.map((s, sIdx) => {
          const info = SET_TYPE_INFO[s.type];
          return `<div class="set-row-hevy ${getSetTypeRowClass(s.type)}">
            <div class="set-badge" data-edit-routine-set-type="${idx}-${sIdx}" title="${info.label} - tocá para cambiar" style="background:${info.bg}; color:${info.fg};">${info.badge || (sIdx+1)}</div>
            <div class="set-prev">${getLastSetString(re.name, sIdx)}</div>
            <input type="number" inputmode="decimal" min="0" max="${unitMaxWeight()}" placeholder="Opcional" value="${s.weight === '' ? '' : toDisplayWeight(s.weight)}" data-routine-set-field="${idx}-${sIdx}-weight">
            <input type="number" inputmode="numeric" min="0" max="99" placeholder="Opcional" value="${s.reps === '' ? '' : s.reps}" data-routine-set-field="${idx}-${sIdx}-reps">
            <button class="set-check-btn" data-remove-routine-set="${idx}-${sIdx}" style="color:var(--danger);">✕</button>
          </div>`;
        }).join('')}
        <button class="add-set-hevy" data-add-routine-set="${idx}">+ Agregar serie</button>
        `}
      </div>`;
    });
  }
  html += `<button class="add-exercise-btn" id="addRoutineExBtn">+ Agregar ejercicio</button><div style="display:flex; gap:8px;"><button class="btn-ghost" id="cancelRoutineBtn" style="flex:1;">Cancelar</button><button class="btn-primary" id="saveRoutineBtn" style="flex:2;">Guardar rutina</button></div>`;

  mainEl.innerHTML = html;
  document.getElementById('routineTitle').addEventListener('input', (e)=> routineDraft.title = e.target.value);
  mainEl.querySelectorAll('[data-toggle-day]').forEach(b=> b.addEventListener('click', ()=>{
    const jsVal = parseInt(b.dataset.toggleDay);
    routineDraft.days = routineDraft.days || [];
    const dIdx = routineDraft.days.indexOf(jsVal);
    if(dIdx >= 0) routineDraft.days.splice(dIdx, 1); else routineDraft.days.push(jsVal);
    render();
  }));
  document.getElementById('addRoutineExBtn').addEventListener('click', ()=> openExercisePicker((name)=>{ routineDraft.exercises.push({ name, note:'', superset:false, collapsed:false, restSeconds:90, sets: [{ type: 'N', weight:'', reps:'' }] }); render(); }));
  mainEl.querySelectorAll('[data-remove-routine-ex]').forEach(b=> b.addEventListener('click', ()=>{ routineDraft.exercises.splice(parseInt(b.dataset.removeRoutineEx), 1); render(); }));
  mainEl.querySelectorAll('[data-video-routine-ex]').forEach(b=> b.addEventListener('click', ()=> openVideoModal(b.dataset.videoRoutineEx)));
  mainEl.querySelectorAll('[data-toggle-routine-superset]').forEach(b=> b.addEventListener('click', ()=>{
    const idx = parseInt(b.dataset.toggleRoutineSuperset);
    const ex = routineDraft.exercises[idx];
    if(ex.superset){ ex.superset = false; render(); return; }
    openExercisePicker((name)=>{
      routineDraft.exercises.splice(idx+1, 0, { name, note:'', superset:false, collapsed:false, restSeconds:90, sets:[{ type:'N', weight:'', reps:'' }] });
      ex.superset = true;
      render();
    });
  }));
  mainEl.querySelectorAll('[data-toggle-routine-collapse]').forEach(b=> b.addEventListener('click', ()=>{ const ex = routineDraft.exercises[parseInt(b.dataset.toggleRoutineCollapse)]; ex.collapsed = !ex.collapsed; render(); }));
  mainEl.querySelectorAll('[data-routine-ex-note]').forEach(inp=> inp.addEventListener('input', ()=>{ routineDraft.exercises[parseInt(inp.dataset.routineExNote)].note = inp.value; }));
  mainEl.querySelectorAll('[data-edit-routine-rest]').forEach(b=> b.addEventListener('click', ()=>{
    const ex = routineDraft.exercises[parseInt(b.dataset.editRoutineRest)];
    const raw = prompt('Descanso entre series (segundos):', ex.restSeconds ?? 90);
    if(raw === null) return;
    const val = parseInt(raw, 10);
    if(isNaN(val) || val < 0 || val > 600){ alert('Ingresá un tiempo válido (0 a 600 segundos).'); return; }
    ex.restSeconds = val; render();
  }));
  mainEl.querySelectorAll('[data-add-routine-set]').forEach(b=> b.addEventListener('click', ()=>{
    const sets = routineDraft.exercises[parseInt(b.dataset.addRoutineSet)].sets;
    sets.push({ type: sets[sets.length-1] ? sets[sets.length-1].type : 'N', weight:'', reps:'' }); render();
  }));
  mainEl.querySelectorAll('[data-remove-routine-set]').forEach(b=> b.addEventListener('click', ()=>{
    const [idx, sIdx] = b.dataset.removeRoutineSet.split('-').map(Number);
    const sets = routineDraft.exercises[idx].sets;
    sets.splice(sIdx, 1);
    if(sets.length === 0) sets.push({ type: 'N', weight:'', reps:'' });
    render();
  }));
  mainEl.querySelectorAll('[data-routine-set-field]').forEach(inp=> inp.addEventListener('input', ()=>{
    const [idx, sIdx, field] = inp.dataset.routineSetField.split('-');
    let raw = inp.value.replace(/[^0-9.,]/g, '').replace('-', '');
    const max = field === 'reps' ? 99 : unitMaxWeight();
    if(field === 'reps' && /[.,]/.test(raw)) raw = raw.split(/[.,]/)[0];
    if(raw !== '' && Number(raw) > max) raw = String(max);
    if(raw !== inp.value) inp.value = raw;
    const parsed = raw === '' ? '' : parseFloat(raw);
    routineDraft.exercises[parseInt(idx)].sets[parseInt(sIdx)][field] = (field === 'weight' && parsed !== '') ? toKgWeight(parsed) : parsed;
  }));
  mainEl.querySelectorAll('[data-edit-routine-set-type]').forEach(b=> b.addEventListener('click', ()=>{
    const [idx, sIdx] = b.dataset.editRoutineSetType.split('-').map(Number);
    const s = routineDraft.exercises[idx].sets[sIdx];
    openSetTypeMenu(s.type, (newType)=>{ s.type = newType; render(); });
  }));
  bindDragReorder('routine-ex-card', () => routineDraft.exercises, () => {});
  document.getElementById('cancelRoutineBtn').addEventListener('click', ()=>{ routineDraft = null; render(); });
  document.getElementById('saveRoutineBtn').addEventListener('click', ()=>{
    const title = routineDraft.title.trim();
    if(!title){ alert('Asigná un título a la rutina.'); return; }
    if(routineDraft.exercises.length === 0){ alert('Agregá al menos un ejercicio.'); return; }
    const idx = routines.findIndex(r => r.id === routineDraft.id);
    const toSave = { id: routineDraft.id, title, exercises: routineDraft.exercises, days: routineDraft.days || [] };
    if(idx >= 0) routines[idx] = toSave; else routines.push(toSave);
    saveRoutines(); routineDraft = null; render();
  });
}

// ---- HISTORIAL ----
function getWorkoutsByDateKey(){
  const map = {};
  workouts.forEach(w=>{
    const d = new Date(w.date);
    const key = d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();
    if(!map[key]) map[key] = [];
    map[key].push(w.name);
  });
  return map;
}

// Nombres de ejercicios entrenados por día (para dibujar la personita con los músculos trabajados ese día).
function getExerciseNamesByDateKey(){
  const map = {};
  workouts.forEach(w=>{
    const d = new Date(w.date);
    const key = d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();
    if(!map[key]) map[key] = [];
    w.exercises.forEach(ex => map[key].push(ex.name));
  });
  return map;
}

function getLast7DaysExerciseNames(){
  const cutoff = new Date(); cutoff.setHours(0,0,0,0); cutoff.setDate(cutoff.getDate() - 6);
  const names = [];
  workouts.forEach(w => { if(new Date(w.date).getTime() >= cutoff.getTime()) w.exercises.forEach(ex => names.push(ex.name)); });
  return names;
}

function calculateRestDaysInView(){
  if(calendarViewMode !== 'month') return null;
  const year = calendarViewDate.getFullYear(), month = calendarViewDate.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);
  const monthStart = new Date(year, month, 1);
  if(monthStart > today) return null; // mes futuro, sin datos todavía
  const isCurrentMonth = today.getFullYear()===year && today.getMonth()===month;
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;
  const byDate = getWorkoutsByDateKey();
  let trainedCount = 0;
  for(let d=1; d<=lastDay; d++){ if(byDate[year+'-'+month+'-'+d]) trainedCount++; }
  return Math.max(0, lastDay - trainedCount);
}

function getMonthCalendarHTML(viewDate){
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const jsFirstDay = new Date(year, month, 1).getDay(); // 0=Dom
  const firstDayMon = (jsFirstDay + 6) % 7; // 0=Lun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewDate.toLocaleDateString('es-AR', {month:'long', year:'numeric'}).replace(/^\w/, c => c.toUpperCase());
  const namesByDate = getExerciseNamesByDateKey();
  const today = new Date();

  let html = `<div class="cal-nav">
    <button class="cal-nav-btn" id="calPrev">‹</button>
    <div class="cal-month-label">${monthLabel}</div>
    <button class="cal-nav-btn" id="calNext">›</button>
  </div><div class="cal-grid">`;
  const dayLabels = ['L','M','M','J','V','S','D'];
  dayLabels.forEach(d => html += `<div class="cal-day-label">${d}</div>`);
  for(let i=0; i<firstDayMon; i++) html += `<div class="cal-day-cell"></div>`;
  for(let i=1; i<=daysInMonth; i++){
    const key = year+'-'+month+'-'+i;
    const names = namesByDate[key];
    const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===i;
    const dayEl = names
      ? `<div class="cal-day-body ${isToday ? 'today':''}"><div class="cal-day-body-icon">${getDayMuscleFigure(names)}</div><span class="cal-day-num-badge">${i}</span></div>`
      : `<div class="cal-day ${isToday ? 'today':''}">${i}</div>`;
    html += `<div class="cal-day-cell">${dayEl}</div>`;
  }
  html += `</div>`;
  return html;
}

function getYearCalendarHTML(year){
  const byDate = getWorkoutsByDateKey();
  const monthsAbbr = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  let html = `<div class="cal-nav">
    <button class="cal-nav-btn" id="calPrev">‹</button>
    <div class="cal-month-label">${year}</div>
    <button class="cal-nav-btn" id="calNext">›</button>
  </div><div class="year-grid">`;
  for(let m=0; m<12; m++){
    const daysInMonth = new Date(year, m+1, 0).getDate();
    let dots = '';
    for(let d=1; d<=daysInMonth; d++){
      const trained = !!byDate[year+'-'+m+'-'+d];
      dots += `<div class="year-dot ${trained?'trained':''}"></div>`;
    }
    html += `<div class="year-month-block"><div class="year-month-label">${monthsAbbr[m]}</div><div class="year-dots">${dots}</div></div>`;
  }
  html += `</div>`;
  return html;
}

function renderCalendarPanel(){
  const streak = calculateStreak();
  const restDays = calculateRestDaysInView();
  const body = calendarViewMode === 'month' ? getMonthCalendarHTML(calendarViewDate) : getYearCalendarHTML(calendarViewDate.getFullYear());
  return `<div class="dash-top-panel">
    <div class="cal-stats-row">
      <div class="cal-stat"><span>🔥</span> Racha de ${streak} semana${streak!==1?'s':''}</div>
      ${restDays !== null ? `<div class="cal-stat-divider"></div><div class="cal-stat"><span>🌙</span> ${restDays} día${restDays!==1?'s':''} de descanso</div>` : ''}
    </div>
    <div class="cal-mode-switch">
      <button class="cal-mode-btn ${calendarViewMode==='month'?'active':''}" data-cal-mode="month">Mes</button>
      <button class="cal-mode-btn ${calendarViewMode==='year'?'active':''}" data-cal-mode="year">Año</button>
    </div>
    ${body}
  </div>
  ${calendarViewMode === 'month' ? `<div class="week-muscle-card">
    <div class="week-muscle-label">Últimos 7 días</div>
    <div class="week-muscle-body">${getWeeklyMuscleSvgPair(getLast7DaysExerciseNames())}</div>
  </div>` : ''}`;
}

// Filtra por nombre de ejercicio/entrenamiento y por rango de fechas. Se aplica solo a la lista de
// abajo del calendario (el calendario/racha siguen mostrando todo el historial real).
function getFilteredWorkouts(){
  return workouts.filter(w=>{
    if(historyDateFrom && new Date(w.date) < new Date(historyDateFrom)) return false;
    if(historyDateTo && new Date(w.date) > new Date(historyDateTo + 'T23:59:59')) return false;
    if(historySearchQuery){
      const q = historySearchQuery.toLowerCase();
      const matchesName = w.name.toLowerCase().includes(q);
      const matchesEx = w.exercises.some(ex => ex.name.toLowerCase().includes(q));
      if(!matchesName && !matchesEx) return false;
    }
    return true;
  });
}

function renderHistoryFilters(){
  const hasFilters = historySearchQuery || historyDateFrom || historyDateTo;
  return `<div class="start-card" style="padding:12px; margin-bottom:14px;">
    <input type="text" id="historySearchInput" placeholder="Buscar por ejercicio o nombre..." value="${escapeHtml(historySearchQuery)}" style="margin-bottom:${hasFilters?'10px':'0'};">
    <div style="display:flex; gap:8px; align-items:center;">
      <input type="date" id="historyDateFrom" value="${historyDateFrom}" style="flex:1; background:var(--surface-2); border:1px solid var(--border); color:var(--text); padding:10px; border-radius:8px; font-size:13px;">
      <input type="date" id="historyDateTo" value="${historyDateTo}" style="flex:1; background:var(--surface-2); border:1px solid var(--border); color:var(--text); padding:10px; border-radius:8px; font-size:13px;">
      ${hasFilters ? `<button class="btn-icon" id="historyClearFilters" title="Limpiar filtros" style="width:32px; height:32px; flex-shrink:0;">✕</button>` : ''}
    </div>
  </div>`;
}

function bindHistoryFilterEvents(){
  const searchInp = document.getElementById('historySearchInput');
  if(searchInp) searchInp.addEventListener('input', ()=>{ historySearchQuery = searchInp.value; renderHistoryList(); });
  const fromInp = document.getElementById('historyDateFrom');
  if(fromInp) fromInp.addEventListener('change', ()=>{ historyDateFrom = fromInp.value; renderHistory(); });
  const toInp = document.getElementById('historyDateTo');
  if(toInp) toInp.addEventListener('change', ()=>{ historyDateTo = toInp.value; renderHistory(); });
  const clearBtn = document.getElementById('historyClearFilters');
  if(clearBtn) clearBtn.addEventListener('click', ()=>{ historySearchQuery=''; historyDateFrom=''; historyDateTo=''; renderHistory(); });
}

function renderHistory(){
  if(editingWorkoutId){ renderWorkoutEditor(); return; }
  let html = renderCalendarPanel();
  if(workouts.length === 0){ html += `<div class="empty-state"><div class="big">Sin historial todavía</div></div>`; mainEl.innerHTML = html; bindCalendarControls(); return; }
  html += renderHistoryFilters() + '<div id="historyList"></div>';
  mainEl.innerHTML = html;
  bindCalendarControls();
  bindHistoryFilterEvents();
  renderHistoryList();
}

// Solo redibuja la lista de entrenamientos filtrada (no el calendario ni la barra de búsqueda), para
// que tipear en el buscador no pierda el foco del input en cada tecla.
function renderHistoryList(){
  const listEl = document.getElementById('historyList');
  if(!listEl) return;
  const filtered = getFilteredWorkouts();
  if(filtered.length === 0){ listEl.innerHTML = `<div class="empty-state"><div class="big">Sin resultados con estos filtros</div></div>`; return; }

  let html = '';
  filtered.forEach(w=>{
    const totalVolume = w.exercises.reduce((acc,ex)=> acc + ex.sets.reduce((a,s)=> a + (s.type!=='W'?(s.weight*s.reps):0),0), 0);
    const expanded = expandedWorkoutId === w.id;
    html += `<div class="workout-card">
      <div class="wc-head" data-toggle="${w.id}">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="wc-title-main" style="margin-bottom:4px;">${escapeHtml(w.name)}</div>
          <div style="display:flex; gap:6px;">
            <button class="btn-ghost" style="padding:4px 8px; font-size:11px;" data-repeat-workout="${w.id}">Repetir</button>
            <button class="btn-ghost" style="padding:4px 8px; font-size:11px;" data-edit-workout="${w.id}">Editar</button>
            <button class="btn-danger-ghost" style="padding:4px 8px; font-size:11px;" data-delete-workout="${w.id}">Eliminar</button>
          </div>
        </div>
        <div style="font-size:11px; color:var(--text-dim); margin-bottom:6px;">${fmtDate(w.date)}</div>
        <div class="wc-stats-row"><span>Duración <strong>${formatDuration(w.duration || 0)}</strong></span><span>Volumen <strong>${toDisplayWeight(Math.round(totalVolume)).toLocaleString('es-AR')} ${weightUnit}</strong></span></div>
      </div>
      ${expanded ? `<div class="wc-body">
        ${w.globalNote ? `<div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; font-size:12px; font-style:italic; margin-top:10px; border-left:3px solid var(--accent);">${escapeHtml(w.globalNote)}</div>` : ''}
        ${w.exercises.map(ex => {
          const priorWorkouts = workouts.filter(wo => new Date(wo.date) < new Date(w.date));
          let sessionMax = 0;
          return `<div class="wc-ex-block ${ex.superset?'is-superset':''}">
            <div class="wc-ex-header-row"><div class="muscle-mini-icon" style="width:30px; height:30px;">${getExerciseMiniFigure(ex.name)}</div><div class="wc-ex-title" style="flex:1;">${escapeHtml(ex.name)} ${ex.superset?'🔗':''}</div><button class="btn-icon" data-video-hist-ex="${escapeHtml(ex.name)}" title="Ver video de ejecución" style="width:26px; height:26px; font-size:12px;">🎥</button></div>
            ${ex.note ? `<div class="wc-ex-note-view">Nota: "${escapeHtml(ex.note)}"</div>` : ''}
            <div class="wc-history-table-head"><span>Series</span><span>Peso y repeticiones</span></div>
            ${ex.sets.map((s,i)=> {
              const isBest = s.type!=='W' && isPersonalRecordBefore(ex.name, s.weight, priorWorkouts, sessionMax);
              if(isBest) sessionMax = Number(s.weight);
              return `<div class="wc-history-row ${isBest ? 'is-best':''}"><div class="wc-set-num">${s.type!=='N'?`<span class="badge-type" style="background:${SET_TYPE_INFO[s.type].bg}; color:${SET_TYPE_INFO[s.type].fg};">${SET_TYPE_INFO[s.type].badge}</span>`:(i+1)}</div><div class="wc-set-det"><span>${fmtW(s.weight)} × ${s.reps} reps</span>${isBest ? `<span style="font-size:11px; color:var(--gold); font-weight:600;">🏆 PR</span>` : ''}</div></div>`;
            }).join('')}
          </div>`;
        }).join('')}
      </div>` : ''}
    </div>`;
  });
  listEl.innerHTML = html;

  listEl.querySelectorAll('[data-toggle]').forEach(el=> el.addEventListener('click', (e)=>{ if(e.target.tagName === 'BUTTON') return; expandedWorkoutId = expandedWorkoutId === el.dataset.toggle ? null : el.dataset.toggle; renderHistoryList(); }));
  listEl.querySelectorAll('[data-edit-workout]').forEach(b=> b.addEventListener('click', (e)=>{ e.stopPropagation(); editingWorkoutId = b.dataset.editWorkout; editingWorkoutDraft = JSON.parse(JSON.stringify(workouts.find(w => w.id === editingWorkoutId))); render(); }));
  listEl.querySelectorAll('[data-delete-workout]').forEach(b=> b.addEventListener('click', (e)=>{
    e.stopPropagation();
    if(confirm('¿Eliminar este entrenamiento del historial? Esta acción no se puede deshacer.')){
      workouts = workouts.filter(w => w.id !== b.dataset.deleteWorkout);
      if(expandedWorkoutId === b.dataset.deleteWorkout) expandedWorkoutId = null;
      saveWorkouts(); renderHistory();
    }
  }));
  listEl.querySelectorAll('[data-repeat-workout]').forEach(b=> b.addEventListener('click', (e)=>{ e.stopPropagation(); repeatWorkout(b.dataset.repeatWorkout); }));
  listEl.querySelectorAll('[data-video-hist-ex]').forEach(b=> b.addEventListener('click', (e)=>{ e.stopPropagation(); openVideoModal(b.dataset.videoHistEx); }));
}

// Editor de un entrenamiento ya finalizado: permite corregir peso/reps o borrar series/ejercicios
// sin tener que eliminar todo el entrenamiento. También reemplaza el viejo "renombrar" con un campo
// de nombre editable en el mismo formulario.
function renderWorkoutEditor(){
  const w = editingWorkoutDraft;
  let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;"><h2 style="font-size:18px; margin:0; font-weight:700;">Editar entrenamiento</h2></div>
  <div class="start-card" style="margin-bottom:16px;"><label>Nombre</label><input type="text" id="editWorkoutName" value="${escapeHtml(w.name)}"></div>`;

  if(w.exercises.length === 0){ html += `<div class="empty-state"><div class="big">Sin ejercicios</div></div>`; }
  w.exercises.forEach((ex, exIdx)=>{
    html += `<div class="exercise-card">
      <div class="exercise-header">
        <div class="exercise-title-wrap"><div class="muscle-mini-icon">${getExerciseMiniFigure(ex.name)}</div><h3>${escapeHtml(ex.name)}</h3></div>
        <div class="exercise-actions-top"><button class="btn-icon" data-remove-edit-ex="${exIdx}" style="width:26px; height:26px; font-size:13px;">✕</button></div>
      </div>
      <div class="set-table-head"><span>S</span><span></span><span>${weightUnit.toUpperCase()}</span><span>Reps</span><span></span></div>
      ${ex.sets.map((s, sIdx)=> `<div class="set-row-hevy">
        <div class="set-badge">${sIdx+1}</div>
        <div class="set-prev"></div>
        <input type="number" inputmode="decimal" min="0" max="${unitMaxWeight()}" value="${s.weight === '' ? '' : toDisplayWeight(s.weight)}" data-edit-set-field="${exIdx}-${sIdx}-weight">
        <input type="number" inputmode="numeric" min="0" max="99" value="${s.reps === '' ? '' : s.reps}" data-edit-set-field="${exIdx}-${sIdx}-reps">
        <button class="set-check-btn" data-remove-edit-set="${exIdx}-${sIdx}" style="color:var(--danger);">✕</button>
      </div>`).join('')}
      <button class="add-set-hevy" data-add-edit-set="${exIdx}">+ Agregar serie</button>
    </div>`;
  });
  html += `<div style="display:flex; gap:8px; margin-top:6px; margin-bottom:20px;"><button class="btn-ghost" id="cancelEditWorkoutBtn" style="flex:1;">Cancelar</button><button class="btn-primary" id="saveEditWorkoutBtn" style="flex:2;">Guardar cambios</button></div>`;

  mainEl.innerHTML = html;

  document.getElementById('editWorkoutName').addEventListener('input', (e)=>{ editingWorkoutDraft.name = e.target.value; });
  mainEl.querySelectorAll('[data-remove-edit-ex]').forEach(b=> b.addEventListener('click', ()=>{ if(confirm('¿Eliminar este ejercicio del entrenamiento?')){ editingWorkoutDraft.exercises.splice(parseInt(b.dataset.removeEditEx), 1); renderWorkoutEditor(); } }));
  mainEl.querySelectorAll('[data-add-edit-set]').forEach(b=> b.addEventListener('click', ()=>{
    const sets = editingWorkoutDraft.exercises[parseInt(b.dataset.addEditSet)].sets;
    const last = sets[sets.length-1];
    sets.push({ weight: last ? last.weight : '', reps: last ? last.reps : '', type: last ? last.type : 'N' });
    renderWorkoutEditor();
  }));
  mainEl.querySelectorAll('[data-remove-edit-set]').forEach(b=> b.addEventListener('click', ()=>{
    const [exIdx, sIdx] = b.dataset.removeEditSet.split('-').map(Number);
    editingWorkoutDraft.exercises[exIdx].sets.splice(sIdx, 1);
    renderWorkoutEditor();
  }));
  mainEl.querySelectorAll('[data-edit-set-field]').forEach(inp=> inp.addEventListener('input', ()=>{
    const [exIdx, sIdx, field] = inp.dataset.editSetField.split('-');
    let raw = inp.value.replace(/[^0-9.,]/g, '').replace('-', '');
    if(field === 'reps'){ if(/[.,]/.test(raw)) raw = raw.split(/[.,]/)[0]; if(raw !== '' && Number(raw) > 99) raw = '99'; }
    else { if(raw !== '' && Number(raw) > unitMaxWeight()) raw = String(unitMaxWeight()); }
    if(raw !== inp.value) inp.value = raw;
    const parsed = raw === '' ? '' : parseFloat(raw);
    editingWorkoutDraft.exercises[parseInt(exIdx)].sets[parseInt(sIdx)][field] = (field === 'weight' && parsed !== '') ? toKgWeight(parsed) : parsed;
  }));
  document.getElementById('cancelEditWorkoutBtn').addEventListener('click', ()=>{ editingWorkoutId = null; editingWorkoutDraft = null; render(); });
  document.getElementById('saveEditWorkoutBtn').addEventListener('click', ()=>{
    let errorMsg = '';
    editingWorkoutDraft.exercises.forEach(ex => ex.sets.forEach(s=>{
      if((s.weight !== '' && s.reps === '') || (s.weight === '' && s.reps !== '')) errorMsg = `En "${ex.name}" falta completar peso o reps en una serie.`;
      if(s.reps !== '' && !Number.isInteger(Number(s.reps))) errorMsg = `En "${ex.name}" las repeticiones deben ser un número entero.`;
      if(s.weight !== '' && Number(s.weight) < 0) errorMsg = `En "${ex.name}" el peso no puede ser negativo.`;
    }));
    if(errorMsg){ alert('⚠️ Revisá tus datos:\n' + errorMsg); return; }
    const cleanedExercises = editingWorkoutDraft.exercises.map(ex => ({ ...ex, sets: ex.sets.filter(s => s.weight !== '' && s.reps !== '') })).filter(ex => ex.sets.length > 0);
    const idx = workouts.findIndex(w => w.id === editingWorkoutDraft.id);
    if(idx >= 0) workouts[idx] = { ...workouts[idx], name: editingWorkoutDraft.name.trim() || workouts[idx].name, exercises: cleanedExercises };
    saveWorkouts();
    editingWorkoutId = null; editingWorkoutDraft = null;
    render();
  });
}

function bindCalendarControls(){
  const prevBtn = document.getElementById('calPrev');
  const nextBtn = document.getElementById('calNext');
  if(prevBtn) prevBtn.addEventListener('click', ()=>{
    calendarViewDate = calendarViewMode === 'month'
      ? new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1)
      : new Date(calendarViewDate.getFullYear() - 1, calendarViewDate.getMonth(), 1);
    renderHistory();
  });
  if(nextBtn) nextBtn.addEventListener('click', ()=>{
    calendarViewDate = calendarViewMode === 'month'
      ? new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1)
      : new Date(calendarViewDate.getFullYear() + 1, calendarViewDate.getMonth(), 1);
    renderHistory();
  });
  document.querySelectorAll('[data-cal-mode]').forEach(b=> b.addEventListener('click', ()=>{ calendarViewMode = b.dataset.calMode; renderHistory(); }));
}

// ---- RÉCORDS ----
function renderPRs(){
  const exList = getExercisesWithData();
  if(exList.length === 0){ mainEl.innerHTML = `<div class="empty-state"><div class="big">Sin récords registrados</div></div>`; return; }
  const cats = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core'];
  let html = `<div style="font-size:16px; font-weight:700; margin-bottom:14px;">🏆 Récords personales</div>`;
  html += `<div class="categories-filter" style="margin-bottom:12px;">${cats.map(c => `<div class="cat-pill ${prsFilterCat===c?'active':''}" data-prs-cat="${c}">${c}</div>`).join('')}</div>`;
  let anyShown = false;
  exList.forEach(exName => {
    if(prsFilterCat !== 'Todos' && getExerciseCategory(exName) !== prsFilterCat) return;
    let maxW = 0, bestReps = 0, bestDate = '';
    workouts.forEach(w => { const ex = w.exercises.find(e => e.name === exName); if(ex) ex.sets.forEach(s => { if(s.type!=='W' && s.weight !== '' && Number(s.weight) > maxW){ maxW = Number(s.weight); bestReps = s.reps; bestDate = w.date; } }); });
    if(maxW > 0){
      anyShown = true;
      html += `<div class="pr-global-card"><div style="display:flex; align-items:center; gap:12px;"><div class="muscle-mini-icon" style="width:38px; height:38px;">${getExerciseMiniFigure(exName)}</div><div><div style="font-size:14px; font-weight:600; color:var(--text);">${escapeHtml(exName)}</div><div style="font-size:11px; color:var(--text-dim);">${fmtDate(bestDate)}</div></div></div><div style="text-align:right;"><div style="font-size:18px; font-weight:700; color:var(--gold);">${fmtW(maxW)}</div><div style="font-size:12px; color:var(--text-dim);">× ${bestReps} reps</div></div></div>`;
    }
  });
  if(!anyShown) html += `<div class="empty-state"><div class="big">Sin récords en esta categoría</div></div>`;
  mainEl.innerHTML = html;
  mainEl.querySelectorAll('[data-prs-cat]').forEach(p=> p.addEventListener('click', ()=>{ prsFilterCat = p.dataset.prsCat; renderPRs(); }));
}

// ---- PROGRESO ----
let selectedProgressExercise = null;
function getExercisesWithData(){ const set = new Set(); workouts.forEach(w => w.exercises.forEach(ex => set.add(ex.name))); return Array.from(set).sort(); }

// Tarjeta estática de peso corporal: se registra a mano (no depende de ningún entrenamiento) y queda guardada.
function renderBodyWeightCard(){
  const last = bodyWeightLog[bodyWeightLog.length - 1];
  const prev = bodyWeightLog[bodyWeightLog.length - 2];
  const delta = (last && prev) ? +(toDisplayWeight(last.weight) - toDisplayWeight(prev.weight)).toFixed(1) : null;
  const deltaHtml = delta !== null && delta !== 0 ? `<span class="bw-delta" style="color:${delta < 0 ? 'var(--success)' : 'var(--danger)'};">${delta > 0 ? '+' : ''}${delta}${weightUnit}</span>` : '';
  return `<div class="bw-card">
    <div style="display:flex; align-items:center; gap:12px;">
      <div class="bw-icon">⚖️</div>
      <div>
        <div class="pr-label">Peso corporal</div>
        <div class="bw-value">${last ? fmtW(last.weight) : '-'}${deltaHtml}</div>
        ${last ? `<div class="bw-date">${fmtDate(last.date)}</div>` : ''}
      </div>
    </div>
    <button class="btn-ghost" id="logBwBtn">${last ? 'Actualizar' : 'Registrar'}</button>
  </div>`;
}

// Volumen total (todos los ejercicios) agrupado por semana ISO, para ver la carga de entrenamiento
// general a lo largo del tiempo (no solo por ejercicio individual).
function getWeeklyVolumeSeries(weeksCount = 12){
  const map = {};
  workouts.forEach(w=>{
    const wk = getISOWeek(w.date);
    const vol = w.exercises.reduce((acc,ex)=> acc + ex.sets.reduce((a,s)=> a + (s.type!=='W' ? Number(s.weight)*Number(s.reps) : 0), 0), 0);
    map[wk] = (map[wk] || 0) + vol;
  });
  const weeks = Object.keys(map).sort();
  return weeks.slice(-weeksCount).map(wk => ({ date: wk, val: map[wk] }));
}

function renderWeeklyVolumeChart(){
  const series = getWeeklyVolumeSeries();
  if(series.length === 0) return '';
  const displaySeries = series.map(p => ({ date: p.date, val: toDisplayWeight(p.val) }));
  return `<div class="chart-wrap"><h4>Volumen total por semana (${weightUnit})</h4>${buildChart(displaySeries, 'var(--accent)')}</div>`;
}

// ---- Ajustes (unidad de peso, modo claro/oscuro, backup) ----
function renderSettingsCard(){
  return `<div class="dash-top-panel" style="margin-top:16px;">
    <div style="font-size:13px; font-weight:600; color:var(--text-dim); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.5px;">Ajustes</div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
      <span style="font-size:14px;">Unidad de peso</span>
      <div class="cal-mode-switch" style="width:120px; margin-bottom:0;">
        <button class="cal-mode-btn ${weightUnit==='kg'?'active':''}" data-set-unit="kg">KG</button>
        <button class="cal-mode-btn ${weightUnit==='lb'?'active':''}" data-set-unit="lb">LB</button>
      </div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
      <span style="font-size:14px;">Apariencia</span>
      <div class="cal-mode-switch" style="width:120px; margin-bottom:0;">
        <button class="cal-mode-btn ${themeMode==='dark'?'active':''}" data-set-mode="dark">Oscuro</button>
        <button class="cal-mode-btn ${themeMode==='light'?'active':''}" data-set-mode="light">Claro</button>
      </div>
    </div>
    <div style="display:flex; gap:8px;">
      <button class="btn-ghost" id="exportDataBtn" style="flex:1;">⬇️ Exportar datos</button>
      <button class="btn-ghost" id="importDataBtn" style="flex:1;">⬆️ Importar datos</button>
    </div>
    <input type="file" id="importDataFile" accept="application/json" style="display:none;">
  </div>`;
}

function bindSettingsCardEvents(){
  mainEl.querySelectorAll('[data-set-unit]').forEach(b=> b.addEventListener('click', ()=>{ if(weightUnit === b.dataset.setUnit) return; weightUnit = b.dataset.setUnit; saveWeightUnit(); render(); }));
  mainEl.querySelectorAll('[data-set-mode]').forEach(b=> b.addEventListener('click', ()=>{ if(themeMode === b.dataset.setMode) return; themeMode = b.dataset.setMode; document.body.setAttribute('data-mode', themeMode); saveThemeMode(); render(); }));
  document.getElementById('exportDataBtn').addEventListener('click', exportBackup);
  document.getElementById('importDataBtn').addEventListener('click', ()=> document.getElementById('importDataFile').click());
  document.getElementById('importDataFile').addEventListener('change', handleImportFile);
}

// Backup completo en JSON (siempre en kg, sin importar la unidad elegida) para no perder el historial
// si se cambia de navegador o se borra el almacenamiento local.
function exportBackup(){
  const payload = { version: 1, exportedAt: new Date().toISOString(), exercises, workouts, routines, bodyWeightLog, theme: currentTheme, themeMode, weightUnit };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `washed-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleImportFile(e){
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = async ()=>{
    try{
      const data = JSON.parse(reader.result);
      if(!data || !Array.isArray(data.workouts)) throw new Error('Formato inválido');
      if(!confirm('Importar reemplazará TODOS tus datos actuales (entrenamientos, rutinas, récords) por los del archivo. ¿Continuar?')){ e.target.value = ''; return; }
      exercises = data.exercises || EXERCISE_CATALOG.map(x => x.name);
      workouts = data.workouts || [];
      routines = data.routines || [];
      bodyWeightLog = data.bodyWeightLog || [];
      if(data.theme){ currentTheme = data.theme; document.body.setAttribute('data-theme', currentTheme); }
      if(data.themeMode){ themeMode = data.themeMode; document.body.setAttribute('data-mode', themeMode); }
      if(data.weightUnit) weightUnit = data.weightUnit;
      await Promise.all([saveExercises(), saveWorkouts(), saveRoutines(), saveBodyWeight(), saveTheme(), saveThemeMode(), saveWeightUnit()]);
      alert('Datos importados con éxito.');
      render();
    } catch(err){ alert('No se pudo importar: el archivo no tiene un formato válido.'); }
    e.target.value = '';
  };
  reader.readAsText(file);
}

function renderProgress(){
  const exList = getExercisesWithData();
  mainEl.innerHTML = renderBodyWeightCard() + renderWeeklyVolumeChart() + (exList.length === 0 ? `<div class="empty-state"><div class="big">Sin datos de progreso</div></div>` : '<div id="progressExBody"></div>') + renderSettingsCard();
  document.getElementById('logBwBtn').addEventListener('click', ()=>{
    const currentDisplay = bodyWeightLog.length ? toDisplayWeight(bodyWeightLog[bodyWeightLog.length-1].weight) : '';
    const raw = prompt(`Peso corporal actual (${weightUnit}):`, currentDisplay);
    if(raw === null) return;
    const val = parseFloat(raw.replace(',', '.'));
    const maxDisplay = weightUnit === 'lb' ? 880 : 400;
    if(isNaN(val) || val <= 0 || val > maxDisplay){ alert(`Ingresá un peso válido en ${weightUnit}.`); return; }
    bodyWeightLog.push({ date: new Date().toISOString(), weight: toKgWeight(val) });
    saveBodyWeight(); renderProgress();
  });
  bindSettingsCardEvents();
  if(exList.length === 0) return;
  if(!selectedProgressExercise || !exList.includes(selectedProgressExercise)) selectedProgressExercise = exList[0];

  const points = []; let theoreticalMax1RM = 0;
  workouts.slice().reverse().forEach(w=>{
    const ex = w.exercises.find(e => e.name === selectedProgressExercise);
    if(ex && ex.sets.length){
      const validSets = ex.sets.filter(s=> s.type!=='W');
      if(validSets.length > 0){
        const maxW = Math.max(...validSets.map(s=>Number(s.weight)));
        const bestSet = validSets.reduce((a,b)=> Number(b.weight) > Number(a.weight) ? b : a);
        points.push({ date: w.date, weight: maxW, reps: bestSet.reps, volume: validSets.reduce((acc,s)=> acc + (Number(s.weight)*Number(s.reps)),0) });
        validSets.forEach(s => { const wt = Number(s.weight), rp = Number(s.reps); if(wt > 0 && rp > 0 && rp <= 12){ const rm = wt * (36 / (37 - rp)); if(rm > theoreticalMax1RM) theoreticalMax1RM = rm; } else if(wt > 0 && rp > 12) { if(wt > theoreticalMax1RM) theoreticalMax1RM = wt; } });
      }
    }
  });

  if(points.length === 0){ document.getElementById('progressExBody').innerHTML = `<div class="empty-state"><div class="big">Sin series efectivas registradas</div></div>`; return; }

  const prPoint = points.reduce((a,b)=> b.weight > a.weight ? b : a, points[0]);

  const exGrid = `<div class="progress-ex-grid">${exList.map(e => `<div class="progress-ex-card ${e===selectedProgressExercise?'active':''}" data-pick-progress-ex="${escapeHtml(e)}"><div class="muscle-mini-icon">${getExerciseMiniFigure(e)}</div><div class="pe-name">${escapeHtml(e)}</div></div>`).join('')}</div>`;

  document.getElementById('progressExBody').innerHTML = `${exGrid}<div class="pr-card"><div style="display:flex; align-items:center; gap:14px;"><div class="muscle-mini-icon" style="width:42px; height:42px;">${getExerciseMiniFigure(selectedProgressExercise)}</div><div><div class="pr-label">Récord personal</div><div class="pr-value">${fmtW(prPoint.weight)} <span style="font-size:13px; color:var(--text-dim); font-weight:400;">× ${prPoint.reps} reps</span></div></div></div><div style="text-align:right;"><div class="pr-label">1RM teórico</div><div style="font-size:18px; font-weight:700; color:var(--accent);">${fmtW(theoreticalMax1RM)}</div></div></div><div class="chart-wrap"><h4>Peso máximo por sesión (${weightUnit})</h4><div id="chartHolderWeight"></div></div><div class="chart-wrap"><h4>Volumen total del ejercicio (${weightUnit})</h4><div id="chartHolderVolume"></div></div>`;
  mainEl.querySelectorAll('[data-pick-progress-ex]').forEach(c=> c.addEventListener('click', ()=>{ selectedProgressExercise = c.dataset.pickProgressEx; renderProgress(); }));
  document.getElementById('chartHolderWeight').innerHTML = buildChart(points.map(p => ({ date: p.date, val: toDisplayWeight(p.weight) })), 'var(--accent)');
  document.getElementById('chartHolderVolume').innerHTML = buildChart(points.map(p => ({ date: p.date, val: toDisplayWeight(p.volume) })), 'var(--gold)');
}

function buildChart(pointData, strokeColor){
  const w = 420, h = 160, pad = 28;
  if(pointData.length === 1) return `<svg viewBox="0 0 ${w} ${h}" width="100%"><circle cx="${w/2}" cy="${h/2}" r="5" fill="${strokeColor}"></circle><text x="${w/2}" y="${h/2-14}" fill="#FFFFFF" font-size="12" text-anchor="middle" font-weight="600">${pointData[0].val}</text></svg>`;
  const vals = pointData.map(p=>p.val), minV = Math.min(...vals), maxV = Math.max(...vals), range = (maxV - minV) || 1, stepX = (w - pad*2) / (pointData.length - 1);
  const coords = pointData.map((p,i)=> ({ x: pad + i*stepX, y: h - pad - ((p.val - minV) / range) * (h - pad*2), p }));
  const path = coords.map((c,i)=> (i===0?'M':'L') + c.x.toFixed(1) + ' ' + c.y.toFixed(1)).join(' ');
  const circles = coords.map(c => `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4" fill="${strokeColor}"></circle>`).join('');
  const maxLabel = `<text x="${coords.reduce((a,c)=>c.p.val===maxV?c:a,coords[0]).x}" y="${coords.reduce((a,c)=>c.p.val===maxV?c:a,coords[0]).y - 10}" fill="${strokeColor}" font-size="11" text-anchor="middle" font-weight="600">${Math.round(maxV)}</text>`;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%"><path d="${path}" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>${circles}${maxLabel}</svg>`;
}

function escapeHtml(str){ const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}

(async function init(){ document.getElementById('todayLabel').textContent = todayLabel(); await loadState(); render(); })();
