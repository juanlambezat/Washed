const EXERCISE_CATALOG = buildExerciseCatalog();
const CATALOG_BY_NAME = new Map(EXERCISE_CATALOG.map(e => [e.name.toLowerCase(), e]));
function getCatalogEntry(name){ return CATALOG_BY_NAME.get(String(name).toLowerCase()) || null; }

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
const EXERCISE_ICON_MAP = buildExerciseIconMap();

function getExerciseIconKey(exName){
  if(EXERCISE_ICON_MAP[exName]) return EXERCISE_ICON_MAP[exName];
  if(exerciseMeta[exName] && exerciseMeta[exName].key) return exerciseMeta[exName].key;
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
  let unregisterOverlay = () => {};
  const close = ()=>{ unregisterOverlay(); if(document.body.contains(overlay)) document.body.removeChild(overlay); };
  unregisterOverlay = registerOverlay(close);
  overlay.querySelector('#videoModalCloseBtn').addEventListener('click', close);
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) close(); });
  if(!videoId){ overlay.querySelector('#videoModalSearchBtn').addEventListener('click', ()=> window.open(getExerciseVideoUrl(exName), '_blank', 'noopener')); }
}

function getExerciseCategory(exName){
  const found = getCatalogEntry(exName);
  if(found) return found.cat;
  if(exerciseMeta[exName] && exerciseMeta[exName].cat) return exerciseMeta[exName].cat;
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
let historyCompareMode = false, historyCompareSelection = [];
let editingWorkoutId = null, editingWorkoutDraft = null;
let prsFilterCat = 'Todos';
let newlyAddedExIdx = -1;
let calendarViewMode = 'month', calendarViewDate = new Date();
let timerInterval = null, restInterval = null, restSecondsRemaining = 0;
let currentTheme = 'copper';
let themeMode = 'dark';
let weightUnit = 'kg';
let lockScreenTimer = true;
let exerciseMeta = {};
let favoriteExercises = [];
let goals = [];
let badges = null;
let alertPrefs = { sound: 'beep', volume: 1, vibrate: true };
let keepAwake = true;
let lastBackupAt = null, backupSnoozeUntil = 0;

const mainEl = document.getElementById('main');

// ---- Diálogos propios (reemplazan alert/confirm/prompt nativos) ----
// Todos devuelven una Promise: uiAlert -> true, uiConfirm -> true/false, uiPrompt -> string o null si se cancela.
// En uiPrompt, opts.validate(valor) puede devolver un mensaje de error: se muestra dentro del mismo diálogo
// y no se cierra hasta que el valor sea válido o se cancele.
function openDialog({ title = '', message = '', confirmText = 'Aceptar', cancelText = 'Cancelar', showCancel = true, danger = false, input = null }){
  return new Promise(resolve => {
    const previousFocus = document.activeElement;
    const overlay = document.createElement('div'); overlay.className = 'dialog-overlay';
    const card = document.createElement('div'); card.className = 'dialog-card';
    card.setAttribute('role', input ? 'dialog' : 'alertdialog'); card.setAttribute('aria-modal', 'true');
    card.innerHTML = `${title ? `<h3>${escapeHtml(title)}</h3>` : ''}
      <p class="dialog-message">${escapeHtml(message)}</p>
      ${input && input.chips ? `<div class="dialog-chips">${input.chips.map((c, i) => `<button type="button" class="cat-pill" data-chip="${i}">${escapeHtml(c.label)}</button>`).join('')}</div>` : ''}
      ${input ? `<input type="text" class="dialog-input" inputmode="${input.inputMode || 'text'}" autocomplete="off"><div class="dialog-error" role="alert"></div>` : ''}
      <div class="dialog-actions">
        ${showCancel ? `<button type="button" class="btn-ghost" data-dialog-cancel>${escapeHtml(cancelText)}</button>` : ''}
        <button type="button" class="${danger ? 'btn-danger' : 'btn-primary'}" data-dialog-ok>${escapeHtml(confirmText)}</button>
      </div>`;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const inputEl = card.querySelector('.dialog-input');
    const errorEl = card.querySelector('.dialog-error');
    const okBtn = card.querySelector('[data-dialog-ok]');
    const cancelBtn = card.querySelector('[data-dialog-cancel]');
    if(inputEl) inputEl.value = input.value ?? '';

    let unregisterOverlay = () => {};
    const finish = (result)=>{
      document.removeEventListener('keydown', onKey, true);
      unregisterOverlay();
      if(document.body.contains(overlay)) document.body.removeChild(overlay);
      if(previousFocus && typeof previousFocus.focus === 'function' && document.body.contains(previousFocus)) previousFocus.focus();
      resolve(result);
    };
    const cancel = ()=> finish(input ? null : false);
    unregisterOverlay = registerOverlay(cancel);
    const accept = ()=>{
      if(!input) return finish(true);
      const value = inputEl.value.trim();
      const err = input.validate ? input.validate(value) : null;
      if(err){
        errorEl.textContent = err;
        inputEl.classList.remove('input-invalid'); void inputEl.offsetWidth; inputEl.classList.add('input-invalid');
        inputEl.focus();
        return;
      }
      finish(value);
    };
    const onKey = (e)=>{
      const overlays = document.querySelectorAll('.dialog-overlay');
      if(overlays[overlays.length - 1] !== overlay) return;
      if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); showCancel ? cancel() : accept(); }
      else if(e.key === 'Enter' && e.target === inputEl){ e.preventDefault(); accept(); }
      else if(e.key === 'Tab'){
        const focusables = Array.from(card.querySelectorAll('input, button'));
        const first = focusables[0], last = focusables[focusables.length - 1];
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);

    okBtn.addEventListener('click', accept);
    if(cancelBtn) cancelBtn.addEventListener('click', cancel);
    card.querySelectorAll('[data-chip]').forEach(chip => chip.addEventListener('click', ()=>{ inputEl.value = input.chips[parseInt(chip.dataset.chip)].value; accept(); }));
    overlay.addEventListener('mousedown', (e)=>{ if(e.target === overlay) showCancel ? cancel() : accept(); });

    if(inputEl){ inputEl.focus(); inputEl.select(); }
    else (danger && cancelBtn ? cancelBtn : okBtn).focus();
  });
}
function uiAlert(message, title = ''){ return openDialog({ title, message, showCancel: false }); }
function uiConfirm(message, opts = {}){ return openDialog({ message, ...opts }); }
function uiPrompt(message, defaultValue, opts = {}){
  const { title, confirmText = 'Guardar', cancelText, ...input } = opts;
  return openDialog({ title, message, confirmText, cancelText, input: { value: String(defaultValue ?? ''), ...input } });
}
// Acepta segundos ("90") o minutos:segundos ("1:30"). Devuelve NaN si no se entiende.
function parseRestInput(v){
  const t = String(v).trim();
  const mmss = t.match(/^(\d+):([0-5]?\d)$/);
  if(mmss) return parseInt(mmss[1], 10) * 60 + parseInt(mmss[2], 10);
  return /^\d+$/.test(t) ? parseInt(t, 10) : NaN;
}
const REST_PRESETS = [
  { label: 'APAGADO', value: '0' }, { label: '30s', value: '30' }, { label: '1min', value: '60' }, { label: '1:30', value: '90' },
  { label: '2min', value: '120' }, { label: '3min', value: '180' }, { label: '5min', value: '300' }
];
async function askRestSeconds(current){
  const raw = await uiPrompt('Elegí un tiempo, o escribilo en segundos o como m:ss. 0 apaga el descanso de este ejercicio.', current ?? 90, {
    title: 'Descanso entre series', inputMode: 'text', chips: REST_PRESETS,
    validate: (v)=>{ const n = parseRestInput(v); return (isNaN(n) || n < 0 || n > 1800) ? 'Ingresá un tiempo válido: de 0 a 1800 segundos, o como m:ss.' : null; }
  });
  return raw === null ? null : parseRestInput(raw);
}

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
  if(!isSetFilled(exName, s)) return null;
  return { weight: s.weight === '' || s.weight == null ? 0 : s.weight, reps: Number(s.reps) + (getExerciseMode(exName) === 'time' ? 5 : 1) };
}

// Valores exactos (sin el +1 de la sugerencia) de la serie equivalente del último entrenamiento con ese ejercicio.
function getLastSetValues(exName, setIndex){
  const lastWorkout = workouts.find(w => w.exercises.some(e => e.name === exName));
  if(!lastWorkout) return null;
  const ex = lastWorkout.exercises.find(e => e.name === exName);
  const s = ex.sets[setIndex] || ex.sets[ex.sets.length - 1];
  if(!isSetFilled(exName, s)) return null;
  return { weight: s.weight === '' || s.weight == null ? 0 : s.weight, reps: s.reps };
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
  uiAlert('Puede ser algo momentáneo del servicio. Seguí usando la app, y si persiste probá recargar.', 'Hubo un problema guardando tus datos');
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
  lockScreenTimer = (await sGet('lockscreen')) !== false;
  exerciseMeta = (await sGet('exercisemeta')) || {};
  favoriteExercises = (await sGet('favorites')) || [];
  goals = (await sGet('goals')) || [];
  badges = await sGet('badges');
  alertPrefs = { ...alertPrefs, ...((await sGet('alertprefs')) || {}) };
  keepAwake = (await sGet('keepawake')) !== false;
  lastBackupAt = await sGet('lastbackup');
  backupSnoozeUntil = (await sGet('backupsnooze')) || 0;
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
async function saveLockScreenTimer(){ await sSet('lockscreen', lockScreenTimer); }
async function saveExerciseMeta(){ await sSet('exercisemeta', exerciseMeta); }
async function saveFavorites(){ await sSet('favorites', favoriteExercises); }
async function saveGoals(){ await sSet('goals', goals); }
async function saveBadges(){ await sSet('badges', badges); }
async function saveAlertPrefs(){ await sSet('alertprefs', alertPrefs); }
async function saveKeepAwake(){ await sSet('keepawake', keepAwake); }
async function saveBackupMeta(){ await sSet('lastbackup', lastBackupAt); await sSet('backupsnooze', backupSnoozeUntil); }
async function saveBodyWeight(){ await sSet('bodyweight', bodyWeightLog); }

// Sonido de aviso con la app abierta: el que elegiste en Ajustes (ver playAlarmSound en features.js).
function playBeep(){ playAlarmSound(); }

const reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
function prefersReducedMotion(){ return !!(reducedMotionQuery && reducedMotionQuery.matches); }

// Agrega una clase de animación puntual y la saca sola: así la animación se dispara solo cuando pasa el
// evento (marcar una serie, romper un récord) y no se repite cada vez que se vuelve a dibujar la pantalla.
function flashClass(el, cls, ms = 700){
  if(!el) return;
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  setTimeout(()=> el.classList.remove(cls), ms);
}

// Entrada escalonada de las tarjetas al cambiar de pestaña (en orden de aparición, con tope para que
// las listas largas no tarden en terminar de entrar). Se limpia sola para no pisar el drag & drop.
const STAGGER_SELECTOR = '.motivation-banner, .session-stats-bar, .workout-card, .exercise-card, .pr-global-card, .pr-card, .bw-card, .chart-wrap, .dash-top-panel, .week-muscle-card, .start-card, .empty-state, .add-exercise-btn';
function staggerIn(){
  if(prefersReducedMotion()) return;
  const items = Array.from(mainEl.querySelectorAll(STAGGER_SELECTOR)).slice(0, 12);
  items.forEach((el, i)=>{ el.style.setProperty('--i', i); el.classList.add('enter-item'); });
  setTimeout(()=> items.forEach(el => { el.classList.remove('enter-item'); el.style.removeProperty('--i'); }), 1200);
}

function fireConfetti(){
  if(prefersReducedMotion()) return;
  const colors = ['#F2C94C', '#E3823D', '#27AE60', '#EB5757', '#2F80ED', '#9B51E0'];
  for(let i=0; i<70; i++){
    let el = document.createElement('div');
    el.className = 'confetti-piece';
    const size = 6 + Math.random() * 7;
    el.style.left = Math.random() * 100 + 'vw';
    el.style.width = size + 'px';
    el.style.height = (Math.random() < 0.5 ? size : size * 1.8) + 'px';
    el.style.borderRadius = Math.random() < 0.35 ? '50%' : '2px';
    el.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
    el.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
    el.style.animationDuration = (Math.random() * 1.6 + 1.8) + 's';
    el.style.animationDelay = (Math.random() * 0.4) + 's';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 4400);
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

// ---- Timer de descanso ----
// El descanso se calcula contra una hora de fin (restEndTime) y no restando 1 por segundo: si el celular
// suspende la página con la pantalla bloqueada, al volver el tiempo sigue siendo el correcto.
// restSeconds = 0 en un ejercicio significa "APAGADO": no arranca ningún descanso al terminar sus series.
const REST_STEP = 15;
let restTotalSeconds = 90, restEndTime = 0, restExerciseName = '';

function formatRestLabel(sec){
  if(!sec) return 'APAGADO';
  const m = Math.floor(sec / 60), s = sec % 60;
  if(m === 0) return `${s}s`;
  return s ? `${m}min ${s}s` : `${m}min`;
}
function formatClock(sec){ return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; }
function getRestRemaining(){ return restEndTime ? Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000)) : 0; }

function startRestTimer(seconds = 90, exName = ''){
  if(restInterval) clearInterval(restInterval);
  restTotalSeconds = Math.max(seconds, 1); restEndTime = Date.now() + seconds * 1000; restExerciseName = exName;
  restSecondsRemaining = seconds;
  ensureRestDock(); updateRestBar();
  restLockScreen.start();
  restInterval = setInterval(tickRest, 250);
}

function tickRest(){
  const remaining = getRestRemaining();
  if(remaining !== restSecondsRemaining){ restSecondsRemaining = remaining; updateRestBar(); }
  if(remaining <= 0) finishRest(Date.now() - restEndTime < 3000);
}

function adjustRest(amount){
  if(!restEndTime) return;
  restEndTime += amount * 1000;
  const remaining = getRestRemaining();
  if(remaining <= 0){ stopRest(); return; }
  restTotalSeconds = Math.max(restTotalSeconds, remaining);
  restSecondsRemaining = remaining; updateRestBar();
}

function stopRest(keepLockScreen = false){
  if(restInterval){ clearInterval(restInterval); restInterval = null; }
  restEndTime = 0; restSecondsRemaining = 0;
  updateRestBar();
  if(!keepLockScreen) restLockScreen.stop();
}

// Terminó el descanso solo. alarm=false cuando ya pasó hace rato (la página estuvo suspendida): no suena tarde.
// La sesión de audio del bloqueo se deja viva hasta que suene el beep (alarm la cierra sola).
function finishRest(alarm){
  const exName = restExerciseName;
  stopRest(true);
  if(!alarm){ restLockScreen.stop(); return; }
  if(alertPrefs.vibrate && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 300]);
  restLockScreen.alarm();
  notifyRestEnd(exName);
}

function notifyRestEnd(exName){
  if(!document.hidden || !('Notification' in window) || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then(reg => reg.showNotification('Descanso terminado', {
    body: exName ? `Próxima serie de ${exName}` : 'Hora de la próxima serie',
    icon: 'icon-192.png', badge: 'icon-192.png', tag: 'rest-end', renotify: true, vibrate: [200, 100, 200, 100, 300]
  })).catch(()=>{});
}

// Barra fija abajo (arriba de la navegación), visible en todas las pestañas mientras dura el descanso.
function ensureRestDock(){
  let dock = document.getElementById('restDock');
  if(dock) return dock;
  dock = document.createElement('div'); dock.id = 'restDock'; dock.className = 'rest-dock hidden';
  dock.innerHTML = `<div class="rest-dock-progress"></div>
    <button type="button" class="rest-dock-btn" id="restMinus" aria-label="Restar ${REST_STEP} segundos">-${REST_STEP}</button>
    <div class="rest-dock-time"><div class="rest-dock-count" id="restCountdown">00:00</div><div class="rest-dock-label" id="restLabel">Descanso</div></div>
    <button type="button" class="rest-dock-btn" id="restPlus" aria-label="Sumar ${REST_STEP} segundos">+${REST_STEP}</button>
    <button type="button" class="rest-dock-skip" id="restSkip">Omitir</button>`;
  document.getElementById('app').appendChild(dock);
  dock.querySelector('#restMinus').addEventListener('click', ()=> adjustRest(-REST_STEP));
  dock.querySelector('#restPlus').addEventListener('click', ()=> adjustRest(REST_STEP));
  dock.querySelector('#restSkip').addEventListener('click', ()=> stopRest());
  return dock;
}

function updateRestBar(){
  const dock = document.getElementById('restDock');
  if(!dock) return;
  const visible = restSecondsRemaining > 0;
  dock.classList.toggle('hidden', !visible);
  document.body.classList.toggle('rest-active', visible);
  if(!visible) return;
  const countEl = document.getElementById('restCountdown');
  const text = formatClock(restSecondsRemaining);
  if(countEl.textContent !== text){ countEl.textContent = text; flashClass(countEl, 'tick', 300); }
  countEl.classList.toggle('urgent', restSecondsRemaining <= 5);
  document.getElementById('restLabel').textContent = restExerciseName ? `Descanso · ${restExerciseName}` : 'Descanso';
  dock.style.setProperty('--rest-pct', `${Math.min(100, (restSecondsRemaining / restTotalSeconds) * 100)}%`);
  restLockScreen.update();
}

document.addEventListener('visibilitychange', ()=>{
  if(!document.hidden && restEndTime) tickRest();
  updateWakeLock();
  if(!document.hidden) checkStaleWorkout();
});

// ---- Timer en la pantalla de bloqueo ----
// Una PWA no puede crear un widget ni una Live Activity propia. Lo más parecido que permite el navegador
// es la "sesión multimedia": mientras suena un audio en silencio, el celular muestra en el bloqueo una
// tarjeta con el título/artista (acá: el tiempo restante y el ejercicio), una barra de progreso que avanza
// sola y botones que se mapean a -15 / +15 / Omitir. Tiene un costo: mientras dura el descanso se pausa la
// música de otras apps. Por eso se puede apagar en Progreso > Ajustes.
const restLockScreen = (function(){
  let audio = null, silentUrl = null, beepUrl = null, beepKey = '', running = false, stopTimeout = null;
  const supported = ()=> lockScreenTimer && 'mediaSession' in navigator && typeof MediaMetadata !== 'undefined';

  function makeWavUrl(seconds, freq, volume){
    const rate = 8000, n = Math.floor(rate * seconds), buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const str = (o, s)=>{ for(let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
    for(let i = 0; i < n; i++){
      const fade = Math.min(1, i / 200, (n - i) / 200);
      v.setInt16(44 + i * 2, freq ? Math.sin(2 * Math.PI * freq * i / rate) * volume * fade * 32767 : 0, true);
    }
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }

  function setHandlers(){
    const handlers = {
      seekbackward: ()=> adjustRest(-REST_STEP), previoustrack: ()=> adjustRest(-REST_STEP),
      seekforward: ()=> adjustRest(REST_STEP), nexttrack: ()=> adjustRest(REST_STEP),
      pause: ()=> stopRest(), stop: ()=> stopRest(), play: ()=>{ if(audio) audio.play().catch(()=>{}); }
    };
    Object.keys(handlers).forEach(action => { try{ navigator.mediaSession.setActionHandler(action, handlers[action]); } catch(e){} });
  }

  function update(){
    if(!running || !supported()) return;
    try{
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `⏱ ${formatClock(restSecondsRemaining)}`,
        artist: restExerciseName ? `Descanso · ${restExerciseName}` : 'Descanso',
        album: 'Washed',
        artwork: [{ src: 'icon-512.png', sizes: '512x512', type: 'image/png' }]
      });
      navigator.mediaSession.playbackState = 'playing';
      navigator.mediaSession.setPositionState({ duration: restTotalSeconds, position: Math.min(restTotalSeconds, Math.max(0, restTotalSeconds - restSecondsRemaining)), playbackRate: 1 });
    } catch(e){}
  }

  function start(){
    if(!supported()) return;
    try{
      if(stopTimeout){ clearTimeout(stopTimeout); stopTimeout = null; }
      if(!audio){ audio = new Audio(); audio.setAttribute('playsinline', ''); }
      if(!silentUrl) silentUrl = makeWavUrl(2, 0, 0);
      audio.src = silentUrl; audio.loop = true;
      const p = audio.play(); if(p && p.catch) p.catch(()=>{});
      running = true; setHandlers(); update();
    } catch(e){}
  }

  function stop(){
    if(stopTimeout){ clearTimeout(stopTimeout); stopTimeout = null; }
    if(!running) return;
    running = false;
    try{
      if(audio){ audio.pause(); audio.removeAttribute('src'); audio.load(); }
      navigator.mediaSession.playbackState = 'none'; navigator.mediaSession.metadata = null;
    } catch(e){}
  }

  // Con el celular bloqueado el beep tiene que salir por la misma sesión de audio; con la app abierta, el de siempre.
  function alarm(){
    if(!(document.hidden && audio && running)){ playBeep(); stop(); return; }
    try{
      const soundKey = `${alertPrefs.sound}-${alertPrefs.volume}`;
      if(beepKey !== soundKey){ if(beepUrl) URL.revokeObjectURL(beepUrl); beepUrl = makeAlarmWavUrl(); beepKey = soundKey; }
      navigator.mediaSession.metadata = new MediaMetadata({ title: 'Descanso terminado', artist: restExerciseName || 'Washed', album: 'Washed', artwork: [{ src: 'icon-512.png', sizes: '512x512', type: 'image/png' }] });
      if(!beepUrl){ stop(); return; }
      audio.loop = false; audio.src = beepUrl;
      audio.play().catch(()=> playBeep());
      stopTimeout = setTimeout(()=>{ stopTimeout = null; stop(); }, 1800);
    } catch(e){ playBeep(); }
  }

  return { start, update, stop, alarm };
})();

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
  if(!isSetFilled(exName, s)) return '-';
  return fmtSetShort(exName, s);
}

// ---- Modos de ejercicio ----
// weight: peso × reps · bodyweight: el peso es lastre extra sobre el peso corporal · assisted: el peso es la ayuda que
// se resta del peso corporal · time: las "reps" son segundos. Ver EXERCISE_MODES en catalog.js.
const ASSIST_CAP = 1000;

function getExerciseMode(name){
  const c = getCatalogEntry(name);
  if(c) return c.mode;
  const m = exerciseMeta[name];
  return (m && m.mode) || 'weight';
}
function getModeLabels(name){ return EXERCISE_MODES[getExerciseMode(name)] || EXERCISE_MODES.weight; }
function getRepsMax(name){ return getExerciseMode(name) === 'time' ? 3600 : 99; }

// Peso corporal registrado más cercano (sin pasarse) a una fecha. Si todos los registros son posteriores usa el primero.
function getBodyWeightAt(dateISO){
  if(!bodyWeightLog.length) return 0;
  const t = new Date(dateISO || Date.now()).getTime();
  let best = null;
  bodyWeightLog.forEach(e => { const d = new Date(e.date).getTime(); if(d <= t && (!best || d >= new Date(best.date).getTime())) best = e; });
  return Number((best || bodyWeightLog[0]).weight) || 0;
}

function setWeightNum(s){ const n = Number(s && s.weight); return (!s || s.weight === '' || s.weight == null || isNaN(n)) ? 0 : n; }

// Una serie está completa si tiene repeticiones; el peso solo es obligatorio en el modo "peso y repeticiones"
// (en los demás modos vacío significa 0: sin lastre, sin ayuda o sin carga).
function isSetFilled(exName, s){
  if(!s || s.reps === '' || s.reps == null || isNaN(s.reps)) return false;
  if(getExerciseMode(exName) === 'weight') return s.weight !== '' && s.weight != null && !isNaN(s.weight);
  return s.weight === '' || s.weight == null || !isNaN(s.weight);
}

// "Puntaje" de una serie para el récord de peso: peso (o lastre), menos ayuda (asistido) o segundos (por tiempo).
function getSetScore(exName, s){
  if(!isSetFilled(exName, s)) return NaN;
  const mode = getExerciseMode(exName), w = setWeightNum(s);
  if(mode === 'assisted') return ASSIST_CAP - w;
  if(mode === 'time') return Number(s.reps);
  return w;
}

function formatSeconds(sec){
  const n = Math.round(Number(sec) || 0);
  if(n < 60) return `${n}s`;
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}

// Texto corto de una serie según el modo del ejercicio ("60kg × 8", "+10kg × 6", "45s").
function fmtSetShort(exName, s){
  const mode = getExerciseMode(exName), w = setWeightNum(s);
  if(mode === 'time') return `${formatSeconds(s.reps)}${w > 0 ? ' · ' + fmtW(w) : ''}`;
  if(mode === 'bodyweight') return `${w > 0 ? '+' + fmtW(w) : 'PC'} × ${s.reps}`;
  if(mode === 'assisted') return `${w > 0 ? '−' + fmtW(w) : 'Sin ayuda'} × ${s.reps}`;
  return `${fmtW(s.weight)} × ${s.reps}`;
}
function fmtSetLong(exName, s){
  const mode = getExerciseMode(exName), w = setWeightNum(s);
  if(mode === 'time') return fmtSetShort(exName, s);
  if(mode === 'bodyweight') return `${w > 0 ? 'Peso corporal +' + fmtW(w) : 'Peso corporal'} × ${s.reps} reps`;
  if(mode === 'assisted') return `${w > 0 ? 'Ayuda −' + fmtW(w) : 'Sin ayuda'} × ${s.reps} reps`;
  return `${fmtW(s.weight)} × ${s.reps} reps`;
}
// Texto de un puntaje de récord (lo que devuelve getSetScore) para mostrar en pantallas de récords y objetivos.
function fmtScore(exName, score){
  const mode = getExerciseMode(exName);
  if(mode === 'time') return formatSeconds(score);
  if(mode === 'assisted') return score >= ASSIST_CAP ? 'Sin ayuda' : `−${fmtW(ASSIST_CAP - score)}`;
  if(mode === 'bodyweight') return score > 0 ? `+${fmtW(score)}` : 'Peso corporal';
  return fmtW(score);
}

// Recorre todas las series del historial de un ejercicio (con el entrenamiento al que pertenecen).
function forEachHistorySet(exName, historyWorkouts, fn){
  (historyWorkouts || workouts).forEach(w => w.exercises.forEach(e => { if(e.name === exName) e.sets.forEach(s => fn(s, w)); }));
}

// Mejor puntaje histórico ya guardado (no cuenta la sesión activa) para un ejercicio.
function getHistoricalMaxWeight(exName, historyWorkouts){
  let best = 0;
  forEachHistorySet(exName, historyWorkouts, s => { if(s.type === 'W') return; const sc = getSetScore(exName, s); if(sc > best) best = sc; });
  return best;
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
  let unregisterOverlay = () => {};
  const close = ()=>{ unregisterOverlay(); if(document.body.contains(overlay)) document.body.removeChild(overlay); };
  unregisterOverlay = registerOverlay(close);
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) close(); });
  overlay.querySelectorAll('[data-set-type]').forEach(el=> el.addEventListener('click', ()=>{ onSelect(el.dataset.setType); close(); }));
}

// Series ya marcadas como hechas en la sesión activa para el mismo ejercicio que vienen ANTES de la serie que
// se está evaluando (en orden). Solo cuentan las anteriores: así repetir un peso no cuenta como récord de nuevo,
// y un récord ya logrado no desaparece cuando después hacés una serie todavía mejor.
function getEarlierDoneSets(exName, exIdx, sIdx){
  const result = [];
  if(!active) return result;
  active.exercises.forEach((ex, i)=>{
    if(ex.name !== exName || i > exIdx) return;
    ex.sets.forEach((s, j)=>{
      if(i === exIdx && j >= sIdx) return;
      if(s.done) result.push(s);
    });
  });
  return result;
}

function getSessionMaxWeight(exName, excludeExIdx, excludeSIdx){
  let best = 0;
  getEarlierDoneSets(exName, excludeExIdx, excludeSIdx).forEach(s => { if(s.type === 'W') return; const sc = getSetScore(exName, s); if(sc > best) best = sc; });
  return best;
}

// Determina si una serie EN CURSO (sesión activa) supera el récord histórico previo Y lo ya hecho en esta
// misma sesión, para que solo la serie que realmente mejora el peso dispare el trofeo/confetti.
function isPersonalRecord(exName, weight, reps, type, exIdx, sIdx){
  if(type === 'W') return false;
  const score = getSetScore(exName, { weight, reps });
  if(isNaN(score)) return false;
  const maxW = Math.max(getHistoricalMaxWeight(exName, workouts), getSessionMaxWeight(exName, exIdx, sIdx));
  return score > maxW && maxW > 0;
}

function isPersonalRecordBefore(exName, s, existingWorkouts, sessionMax = 0){
  const score = getSetScore(exName, s);
  if(isNaN(score)) return false;
  return score > Math.max(getHistoricalMaxWeight(exName, existingWorkouts), sessionMax);
}

// Volumen de UNA serie = carga × reps (0 si falta algún dato, si es calentamiento o si es por tiempo).
// La carga depende del modo: peso, peso corporal + lastre, o peso corporal − ayuda (con el peso corporal
// registrado a la fecha de la serie). El récord de volumen es la mejor serie del ejercicio:
// 25kg × 12 = 300; 25kg × 13 = 325 es récord, y 30kg × 11 = 330 también, aunque tenga menos repeticiones.
function getSetVolume(s, exName, dateISO){
  if(!s || s.type === 'W' || !isSetFilled(exName, s)) return 0;
  const mode = getExerciseMode(exName);
  if(mode === 'time') return 0;
  const w = setWeightNum(s), r = Number(s.reps);
  if(mode === 'bodyweight') return (getBodyWeightAt(dateISO) + w) * r;
  if(mode === 'assisted') return Math.max(getBodyWeightAt(dateISO) - w, 0) * r;
  return w * r;
}

// Volumen total de un entrenamiento guardado.
function getWorkoutVolume(w){
  return w.exercises.reduce((acc, ex) => acc + ex.sets.reduce((a, s) => a + getSetVolume(s, ex.name, w.date), 0), 0);
}

// Mejor volumen de una serie ya guardado en el historial (no cuenta la sesión activa). Se calcula desde el historial,
// igual que el peso máximo: si se edita o borra un entrenamiento, el récord se ajusta solo.
function getHistoricalMaxSetVolume(exName, historyWorkouts){
  let best = 0;
  forEachHistorySet(exName, historyWorkouts, (s, w) => { const v = getSetVolume(s, exName, w.date); if(v > best) best = v; });
  return best;
}

// Mejor volumen de una serie hecha ANTES de la que se está evaluando en la sesión activa (igual que getSessionMaxWeight).
function getSessionMaxSetVolume(exName, excludeExIdx, excludeSIdx){
  let best = 0;
  getEarlierDoneSets(exName, excludeExIdx, excludeSIdx).forEach(s => { const v = getSetVolume(s, exName, active && active.date); if(v > best) best = v; });
  return best;
}

// Serie de la sesión activa que supera tu mejor volumen histórico Y lo ya hecho en esta sesión.
// Puede coincidir con un récord de peso (30kg × 11 supera a 25kg × 12 en peso y en volumen).
// Requiere un antecedente (hist > 0), igual que el PR de peso requiere maxW > 0.
function isVolumeRecord(exName, weight, reps, type, exIdx, sIdx){
  if(type === 'W') return false;
  const cur = getSetVolume({ weight, reps, type }, exName, active && active.date);
  if(!(cur > 0)) return false;
  const hist = getHistoricalMaxSetVolume(exName, workouts);
  return hist > 0 && cur > Math.max(hist, getSessionMaxSetVolume(exName, exIdx, sIdx));
}

function isVolumeRecordBefore(exName, s, existingWorkouts, sessionMax = 0, dateISO){
  const cur = getSetVolume(s, exName, dateISO);
  if(!(cur > 0)) return false;
  const hist = getHistoricalMaxSetVolume(exName, existingWorkouts);
  return hist > 0 && cur > Math.max(hist, sessionMax);
}

// 1RM estimado (fórmula de Epley) para comparar series de distinto peso/reps entre sí. Solo tiene sentido en el modo
// "peso y repeticiones": en los demás no se estima.
function estimated1RM(weight, reps){
  const w = Number(weight), r = Number(reps);
  if(!w || !r) return 0;
  return w * (1 + r / 30);
}

function getHistoricalMax1RM(exName, historyWorkouts){
  let max1RM = 0;
  if(getExerciseMode(exName) !== 'weight') return max1RM;
  forEachHistorySet(exName, historyWorkouts, s => { if(s.type !== 'W' && s.weight !== '' && s.reps !== ''){ const rm = estimated1RM(s.weight, s.reps); if(rm > max1RM) max1RM = rm; } });
  return max1RM;
}

// Detecta combinaciones de peso/reps poco realistas (ej. errores de tipeo como "300kg x 99 reps").
// Sin historial: cualquier 1RM estimado extremo (>400) se marca. Con historial propio del ejercicio,
// se permite un salto amplio (75% por encima de tu mejor 1RM estimado) para no molestar con PRs
// genuinos, pero cualquier cosa más allá de eso se considera sospechosa. Solo aplica al modo "peso y repeticiones".
function isSuspiciousSet(exName, weight, reps, type){
  if(getExerciseMode(exName) !== 'weight') return false;
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
document.querySelectorAll('nav button').forEach(b=>{ b.addEventListener('click', ()=>{
  closeAllOverlays();
  if(currentTab !== b.dataset.tab){ flushActiveSave(); currentTab = b.dataset.tab; render(); }
}); });

let lastRenderedTab = null;
function render(){
  renderNav();
  // Solo repetimos la animación de entrada y perdemos el scroll cuando realmente cambiamos de pestaña.
  // Si seguimos en la misma pestaña (marcar una serie, agregar un ejercicio, etc.) no queremos que
  // toda la pantalla parpadee/reinicie como si fuera una recarga.
  const tabChanged = currentTab !== lastRenderedTab;
  lastRenderedTab = currentTab;
  if(tabChanged && currentTab !== 'history'){ historyCompareMode = false; historyCompareSelection = []; }
  const scrollPos = mainEl.scrollTop;
  if(tabChanged){ mainEl.style.animation = 'none'; mainEl.offsetHeight; mainEl.style.animation = 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'; }
  else mainEl.style.animation = 'none';
  if(currentTab === 'train') renderTrain();
  else if(currentTab === 'routines') renderRoutines();
  else if(currentTab === 'history') renderHistory();
  else if(currentTab === 'prs') renderPRs();
  else renderProgress();
  if(!tabChanged) mainEl.scrollTop = scrollPos;
  else staggerIn();
  updateWakeLock();
}

// ---- ENTRENAR ----
function renderTrain(){
  if(!active){
    if(timerInterval) clearInterval(timerInterval);
    stopRest();

    const banner = getMotivationalBanner();
    let html = `<div class="motivation-banner"><div class="motivation-icon">${banner.icon}</div><div class="motivation-text">${banner.text}</div></div>${renderBackupReminder()}`;

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
    bindBackupReminder();
    document.getElementById('startBtn').addEventListener('click', ()=>{
      const name = document.getElementById('workoutName').value.trim() || 'Entrenamiento';
      active = { id: Date.now().toString(), name, date: new Date().toISOString(), startTime: Date.now(), exercises: [], globalNote: '' };
      saveActive(); startTimer(); render();
    });
    mainEl.querySelectorAll('[data-use-routine]').forEach(b=> b.addEventListener('click', ()=> startFromRoutine(b.dataset.useRoutine)));
    return;
  }

  const { vol: totalVol, sets: totalSetsCount } = getActiveSessionStats();

  const durationSecs = Math.floor((Date.now() - active.startTime) / 1000);

  let html = `
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
      const modeLabels = getModeLabels(ex.name), isTimed = getExerciseMode(ex.name) === 'time';
      html += `<div class="ex-rest-row"><button class="rest-pill ${(ex.restSeconds ?? 90) === 0 ? 'is-off' : ''}" data-edit-rest="${exIdx}">⏱️ Descanso: ${formatRestLabel(ex.restSeconds ?? 90)}</button>${isTimed ? `<button class="rest-pill" data-stopwatch-ex="${exIdx}">⏲️ Cronometrar serie</button>` : ''}<button class="rest-pill" data-replace-ex="${exIdx}">🔄 Reemplazar</button></div>
        <input type="text" class="exercise-note-input" placeholder="Añadir nota al ejercicio..." value="${escapeHtml(ex.note || '')}" data-ex-note="${exIdx}">
        <div class="set-table-head"><span>S</span><span>Anterior</span><span>${modeLabels.weightLabel.replace('KG', weightUnit.toUpperCase())}</span><span>${isTimed ? 'Seg' : 'Reps'}</span><span>✓</span></div>`;

      ex.sets.forEach((s, sIdx)=>{
        const isPr = isPersonalRecord(ex.name, s.weight, s.reps, s.type, exIdx, sIdx);
        const isVol = isVolumeRecord(ex.name, s.weight, s.reps, s.type, exIdx, sIdx);
        const isSuspicious = isSuspiciousSet(ex.name, s.weight, s.reps, s.type);
        const prevStr = getLastSetString(ex.name, sIdx);
        html += `<div class="set-swipe-wrap" data-swipe-wrap="${exIdx}-${sIdx}">
          <div class="set-swipe-delete">🗑️</div>
          <div class="set-row-hevy ${s.done ? 'done':''} ${isPr ? 'is-pr':''} ${isVol ? 'is-volume-pr':''} ${isSuspicious ? 'is-suspicious':''} ${getSetTypeRowClass(s.type)}" data-row="${exIdx}-${sIdx}" title="${isSuspicious ? 'Revisá este valor: parece fuera de lo normal' : ''}">
            <div class="set-badge ${isPr && isVol ? 'has-medal' : ''}" data-open-type-menu="${exIdx}-${sIdx}" title="Toca para elegir el tipo de serie">${s.type === 'N' ? (isPr ? '🏆' : (isVol ? '🏅' : sIdx+1)) : SET_TYPE_INFO[s.type].badge}</div>
            <div class="set-prev ${prevStr !== '-' ? 'is-tappable' : ''}" data-copy-prev="${exIdx}-${sIdx}" ${prevStr !== '-' ? 'title="Tocá para copiar estos valores"' : ''}>${prevStr}</div>
            <input type="number" inputmode="decimal" min="0" max="${unitMaxWeight()}" placeholder="0" value="${s.weight === '' || s.weight == null ? '' : toDisplayWeight(s.weight)}" data-ex="${exIdx}" data-set="${sIdx}" data-field="weight">
            <input type="number" inputmode="numeric" step="1" min="0" max="${getRepsMax(ex.name)}" placeholder="0" value="${s.reps ?? ''}" data-ex="${exIdx}" data-set="${sIdx}" data-field="reps">
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

  if(document.getElementById('discardBtn')) document.getElementById('discardBtn').addEventListener('click', async ()=>{ if(await uiConfirm('¿Descartar este entrenamiento sin guardar?', { title: 'Descartar entrenamiento', confirmText: 'Descartar', danger: true })){ if(saveActiveDebounceTimer){ clearTimeout(saveActiveDebounceTimer); saveActiveDebounceTimer = null; } active = null; saveActive(); render(); }});
  if(document.getElementById('finishBtn')) document.getElementById('finishBtn').addEventListener('click', finishWorkout);
  if(document.getElementById('addExBtn')) document.getElementById('addExBtn').addEventListener('click', ()=>{ openExercisePicker((name)=>{ newlyAddedExIdx = active.exercises.length; const sug = getSuggestedSet(name, 0); active.exercises.push({ name, note: '', collapsed:false, superset:false, restSeconds:90, sets:[{ weight: sug ? sug.weight : '', reps: sug ? sug.reps : '', done:false, type:'N' }] }); saveActive(); render(); }); });
  if(document.getElementById('globalNoteInput')) document.getElementById('globalNoteInput').addEventListener('input', (e)=>{ active.globalNote = e.target.value; saveActiveDebounced(); });

  mainEl.querySelectorAll('[data-remove-ex]').forEach(b=> b.addEventListener('click', async ()=>{ if(await uiConfirm('¿Eliminar este ejercicio del entrenamiento?', { title: 'Eliminar ejercicio', confirmText: 'Eliminar', danger: true })){ active.exercises.splice(parseInt(b.dataset.removeEx),1); saveActive(); render(); } }));
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
  mainEl.querySelectorAll('[data-edit-rest]').forEach(b=> b.addEventListener('click', async ()=>{
    const ex = active.exercises[parseInt(b.dataset.editRest)];
    const val = await askRestSeconds(ex.restSeconds);
    if(val === null) return;
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
        const repsMax = getRepsMax(active.exercises[exIdx].name);
        if(raw !== '' && Number(raw) > repsMax){ raw = String(repsMax); invalid = true; }
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
      liveUpdateRow(exIdx);
    });
  });

  mainEl.querySelectorAll('[data-ex-note]').forEach(inp=> inp.addEventListener('input', ()=>{ active.exercises[parseInt(inp.dataset.exNote)].note = inp.value; saveActiveDebounced(); }));

  // Tocar "Anterior" copia el peso y las repeticiones (o segundos) de la serie equivalente del último entrenamiento.
  mainEl.querySelectorAll('[data-copy-prev]').forEach(el=> el.addEventListener('click', ()=>{
    const [exIdx, sIdx] = el.dataset.copyPrev.split('-').map(Number);
    const ex = active.exercises[exIdx], s = ex.sets[sIdx];
    const prev = getLastSetValues(ex.name, sIdx);
    if(!prev) return;
    s.weight = prev.weight; s.reps = prev.reps;
    ['weight', 'reps'].forEach(field => {
      const input = mainEl.querySelector(`input[data-ex="${exIdx}"][data-set="${sIdx}"][data-field="${field}"]`);
      if(input){ input.value = field === 'weight' ? toDisplayWeight(prev.weight) : prev.reps; flashClass(input, 'just-filled', 500); }
    });
    saveActiveDebounced(); liveUpdateRow(exIdx);
  }));

  mainEl.querySelectorAll('[data-replace-ex]').forEach(b=> b.addEventListener('click', async ()=>{
    const ex = active.exercises[parseInt(b.dataset.replaceEx)];
    if(ex.sets.some(s => s.done)){ await uiAlert('Este ejercicio ya tiene series hechas. Para cambiarlo, agregá el nuevo ejercicio y sacá este.', 'No se puede reemplazar'); return; }
    openExercisePicker((name)=>{
      if(name === ex.name) return;
      ex.name = name;
      ex.sets = ex.sets.map((s, i) => { const sug = getSuggestedSet(name, i); return { weight: sug ? sug.weight : '', reps: sug ? sug.reps : '', done: false, type: s.type }; });
      saveActive(); render();
    });
  }));

  mainEl.querySelectorAll('[data-stopwatch-ex]').forEach(b=> b.addEventListener('click', ()=>{
    const exIdx = parseInt(b.dataset.stopwatchEx), ex = active.exercises[exIdx];
    openStopwatch(ex.name, (seconds)=>{
      let idx = ex.sets.findIndex(s => !s.done && (s.reps === '' || s.reps == null));
      if(idx < 0) idx = ex.sets.findIndex(s => !s.done);
      if(idx < 0){ const last = ex.sets[ex.sets.length - 1]; ex.sets.push({ weight: last ? last.weight : '', reps: '', done: false, type: last ? last.type : 'N' }); idx = ex.sets.length - 1; }
      ex.sets[idx].reps = Math.min(seconds, getRepsMax(ex.name));
      saveActive(); render();
    });
  }));

  mainEl.querySelectorAll('[data-open-type-menu]').forEach(b=> b.addEventListener('click', ()=>{
    const [exIdx, sIdx] = b.dataset.openTypeMenu.split('-'); const s = active.exercises[exIdx].sets[sIdx];
    openSetTypeMenu(s.type, (newType)=>{ s.type = newType; saveActive(); render(); });
  }));

  mainEl.querySelectorAll('[data-toggle-ex]').forEach(b=> b.addEventListener('click', ()=>{
    const exIdx = parseInt(b.dataset.toggleEx), sIdx = parseInt(b.dataset.toggleSet);
    const ex = active.exercises[exIdx], s = ex.sets[sIdx];
    if(!s.done && !isSetFilled(ex.name, s)){
      const rowEl = mainEl.querySelector(`[data-row="${exIdx}-${sIdx}"]`);
      if(rowEl){ rowEl.querySelectorAll('input').forEach(i=>{ i.classList.remove('input-invalid'); void i.offsetWidth; i.classList.add('input-invalid'); setTimeout(()=>i.classList.remove('input-invalid'),400); }); }
      return;
    }
    if(!s.done && (s.weight === '' || s.weight == null)){
      s.weight = 0;
      const weightInput = mainEl.querySelector(`input[data-ex="${exIdx}"][data-set="${sIdx}"][data-field="weight"]`);
      if(weightInput) weightInput.value = toDisplayWeight(0);
    }
    s.done = !s.done; saveActive();
    if(s.done) {
      if(isPersonalRecord(ex.name, s.weight, s.reps, s.type, exIdx, sIdx) || isVolumeRecord(ex.name, s.weight, s.reps, s.type, exIdx, sIdx)) fireConfetti();
      const restSecs = ex.restSeconds ?? 90;
      if(!ex.superset && restSecs > 0) startRestTimer(restSecs, ex.name);
    }
    // Actualizamos solo la fila y las estadísticas en vez de re-renderizar toda la pantalla:
    // evita que todas las tarjetas repitan su animación y que se pierda la posición del scroll.
    const rowEl = mainEl.querySelector(`[data-row="${exIdx}-${sIdx}"]`);
    if(rowEl) rowEl.classList.toggle('done', s.done);
    if(s.done){ flashClass(rowEl, 'just-done', 800); flashClass(b, 'just-done', 600); }
    liveUpdateRow(exIdx);
    updateSessionStatsBar();
  }));
}

// Volumen y series efectivas (hechas y sin contar calentamiento) de la sesión activa.
function getActiveSessionStats(){
  let vol = 0, sets = 0;
  active.exercises.forEach(ex => ex.sets.forEach(s => {
    if(s.type !== 'W' && s.done && isSetFilled(ex.name, s)){ vol += getSetVolume(s, ex.name, active.date); sets++; }
  }));
  return { vol, sets };
}

// Recalcula volumen y series totales de la sesión activa y actualiza esos números sin tocar el resto del DOM.
function updateSessionStatsBar(){
  if(!active) return;
  const { vol: totalVol, sets: totalSetsCount } = getActiveSessionStats();
  const volEl = document.getElementById('liveVolume'), setsEl = document.getElementById('liveSets');
  if(volEl){ const text = `${toDisplayWeight(totalVol).toLocaleString('es-AR')} ${weightUnit}`; if(volEl.textContent !== text){ volEl.textContent = text; flashClass(volEl, 'bump', 450); } }
  if(setsEl){ const text = String(totalSetsCount); if(setsEl.textContent !== text){ setsEl.textContent = text; flashClass(setsEl, 'bump', 450); } }
}

// Actualiza las filas del ejercicio (récord + badge) sin re-renderizar todo, para no perder el foco al tipear.
// Se recalculan todas las series del ejercicio porque un récord depende de las otras series ya hechas:
// tildar o cambiar una serie puede prender o apagar el trofeo/medalla de las demás.
function liveUpdateRow(exIdx){
  const ex = active.exercises[exIdx];
  ex.sets.forEach((s, sIdx)=>{
    const rowEl = mainEl.querySelector(`[data-row="${exIdx}-${sIdx}"]`);
    if(!rowEl) return;
    const isPr = isPersonalRecord(ex.name, s.weight, s.reps, s.type, exIdx, sIdx);
    const isVol = isVolumeRecord(ex.name, s.weight, s.reps, s.type, exIdx, sIdx);
    const isSuspicious = isSuspiciousSet(ex.name, s.weight, s.reps, s.type);
    const wasRecord = rowEl.classList.contains('is-pr') || rowEl.classList.contains('is-volume-pr');
    rowEl.classList.toggle('is-pr', isPr && s.type === 'N');
    rowEl.classList.toggle('is-volume-pr', isVol && s.type === 'N');
    rowEl.classList.toggle('is-suspicious', isSuspicious);
    rowEl.title = isSuspicious ? 'Revisá este valor: parece fuera de lo normal' : '';
    const badge = rowEl.querySelector('.set-badge');
    if(badge && s.type === 'N'){ badge.textContent = isPr ? '🏆' : (isVol ? '🏅' : (sIdx+1)); badge.classList.toggle('has-medal', isPr && isVol); }
    if(badge && !wasRecord && s.type === 'N' && (isPr || isVol)) flashClass(badge, 'just-record', 800);
  });
}

function startFromRoutine(routineId){
  const r = routines.find(x => x.id === routineId); if(!r) return;
  active = { id: Date.now().toString(), name: r.title, routineId: r.id, date: new Date().toISOString(), startTime: Date.now(), globalNote: '', exercises: r.exercises.map(normalizeRoutineExercise).map(re => ({ name: re.name, note: re.note || '', collapsed:false, superset: re.superset || false, restSeconds: re.restSeconds ?? 90, sets: re.sets.map((s, sIdx) => {
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

// Un entreno abierto más de este tiempo casi seguro quedó olvidado: se pregunta cuánto duró de verdad.
const STALE_WORKOUT_SECONDS = 5 * 3600;

// Acepta minutos ("75") o horas:minutos ("1:15"). Devuelve NaN si no se entiende.
function parseDurationInput(v){
  const t = String(v).trim();
  const hm = t.match(/^(\d+):([0-5]?\d)$/);
  if(hm) return parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10);
  return /^\d+$/.test(t) ? parseInt(t, 10) : NaN;
}
const DURATION_PRESETS = [{ label: '30 min', value: '30' }, { label: '45 min', value: '45' }, { label: '1 h', value: '60' }, { label: '1:15', value: '75' }, { label: '1:30', value: '90' }, { label: '2 h', value: '120' }];

// Devuelve los minutos que eligió el usuario, o null si prefiere dejar la duración como está.
async function askRealDuration(computedSeconds){
  const raw = await uiPrompt(
    `Este entrenamiento estuvo abierto ${formatDuration(computedSeconds)}. Si te olvidaste de cerrarlo, indicá cuánto duró de verdad (en minutos, o como h:mm).`,
    60,
    {
      title: '¿Cuánto duró realmente?', confirmText: 'Usar esta duración', cancelText: 'Dejar como está', inputMode: 'text', chips: DURATION_PRESETS,
      validate: (v)=>{ const n = parseDurationInput(v); return (isNaN(n) || n < 1 || n > 1440) ? 'Ingresá una duración válida: de 1 a 1440 minutos, o como h:mm.' : null; }
    }
  );
  return raw === null ? null : parseDurationInput(raw);
}

async function finishWorkout(){
  flushActiveSave();
  const suspiciousExNames = [...new Set(
    active.exercises
      .filter(ex => ex.sets.some(s => s.done && isSuspiciousSet(ex.name, s.weight, s.reps, s.type)))
      .map(ex => ex.name)
  )];
  const confirmMsg = suspiciousExNames.length
    ? `⚠️ Revisá "${suspiciousExNames.join('", "')}": el peso o las repeticiones parecen fuera de lo normal.\n\n¿Estás seguro que querés finalizar el entrenamiento?`
    : '¿Estás seguro que querés finalizar el entrenamiento?';
  if(!(await uiConfirm(confirmMsg, { title: 'Finalizar entrenamiento', confirmText: 'Finalizar' }))) return;

  const hasAnyDone = active.exercises.some(ex => ex.sets.some(s => s.done));
  if(!hasAnyDone){ if(!(await uiConfirm('No marcaste ninguna serie como completada. ¿Terminar igual?', { title: 'Sin series completadas', confirmText: 'Terminar igual' }))) return; }

  let errorMsg = "";
  active.exercises.forEach(ex => {
    ex.sets.forEach((s) => {
      const weightRequired = getExerciseMode(ex.name) === 'weight';
      if((s.weight !== '' && s.reps === '') || (weightRequired && s.weight === '' && s.reps !== '')) errorMsg = `En "${ex.name}" falta completar ${weightRequired ? 'peso o reps' : 'las repeticiones o los segundos'} en una serie.`;
      if(s.reps !== '' && !Number.isInteger(Number(s.reps))) errorMsg = `En "${ex.name}" ${getExerciseMode(ex.name) === 'time' ? 'los segundos' : 'las repeticiones'} deben ser un número entero.`;
      if(s.weight !== '' && Number(s.weight) < 0) errorMsg = `En "${ex.name}" el peso no puede ser negativo.`;
      if(Number(s.weight) > 999 || Number(s.reps) > getRepsMax(ex.name)) errorMsg = `En "${ex.name}" hay un valor fuera de rango.`;
    });
  });
  if(errorMsg){ uiAlert(errorMsg, '⚠️ Revisá tus datos'); return; }

  const computedDuration = Math.floor((Date.now() - active.startTime) / 1000);
  if(computedDuration > STALE_WORKOUT_SECONDS && active.durationOverride == null){
    const minutes = await askRealDuration(computedDuration);
    if(minutes !== null) active.durationOverride = minutes * 60;
  }

  const cleaned = {
    ...active, duration: active.durationOverride ?? computedDuration,
    exercises: active.exercises.map(ex => ({ name: ex.name, note: ex.note || '', superset: ex.superset||false, sets: ex.sets.filter(s => s.done && isSetFilled(ex.name, s)).map(s => ({ ...s, weight: (s.weight === '' || s.weight == null) ? 0 : s.weight })) })).filter(ex => ex.sets.length > 0)
  };
  delete cleaned.durationOverride; delete cleaned.staleDismissedAt;

  let recordsList = [];
  const sessionMaxVolumeByExercise = {};
  cleaned.exercises.forEach(ex => {
    let sessionMax = 0;
    ex.sets.forEach(s => {
      if(s.type === 'W') return;
      if(isPersonalRecordBefore(ex.name, s, workouts, sessionMax)){
        recordsList.push(`¡Nuevo récord en ${ex.name}: ${fmtSetShort(ex.name, s)}!`);
        sessionMax = getSetScore(ex.name, s);
      }
      const setVolume = getSetVolume(s, ex.name, cleaned.date);
      if(isVolumeRecordBefore(ex.name, s, workouts, sessionMaxVolumeByExercise[ex.name] || 0, cleaned.date)){
        recordsList.push(`🏅 Récord de volumen en ${ex.name}: ${fmtSetShort(ex.name, s)} (${fmtW(setVolume)})!`);
      }
      sessionMaxVolumeByExercise[ex.name] = Math.max(sessionMaxVolumeByExercise[ex.name] || 0, setVolume);
    });
  });
  cleaned.recordsCount = recordsList.length;

  workouts.unshift(cleaned);
  const finishedWorkout = cleaned, routineId = active.routineId, sessionExercises = active.exercises;
  active = null; saveWorkouts(); saveActive();
  if(timerInterval) clearInterval(timerInterval); stopRest();
  maybeRequestPersist();
  const extras = [...checkGoalsAchieved(), ...checkNewBadges().map(b => `${b.icon} Nueva insignia: ${b.name}`)];
  await offerRoutineUpdate(routineId, sessionExercises);
  showSummaryModal(finishedWorkout, recordsList, extras);
}

// Compara los ejercicios de la rutina con los del entrenamiento que se hizo: qué se agregó, qué se quitó
// (o reemplazó) y si cambió el orden. Devuelve las líneas para mostrarle al usuario; vacío si no hay cambios.
function describeRoutineChanges(before, after){
  const removed = [...before], added = [];
  after.forEach(n => { const i = removed.indexOf(n); if(i >= 0) removed.splice(i, 1); else added.push(n); });
  const lines = [];
  const pairs = Math.min(added.length, removed.length);
  for(let i = 0; i < pairs; i++) lines.push(`• Reemplazaste ${removed[i]} por ${added[i]}`);
  added.slice(pairs).forEach(n => lines.push(`• Agregaste ${n}`));
  removed.slice(pairs).forEach(n => lines.push(`• Quitaste ${n}`));
  if(!added.length && !removed.length && before.some((n, i) => n !== after[i])) lines.push('• Cambiaste el orden de los ejercicios');
  return lines;
}

// Si el entrenamiento salió de una rutina y le cambiaste los ejercicios, pregunta si querés dejar la rutina así.
// Los ejercicios que ya estaban conservan su configuración de la rutina (notas, descanso, series); los nuevos
// entran con las series que hiciste, sin pesos fijos (el peso se sugiere solo desde tu historial).
async function offerRoutineUpdate(routineId, sessionExercises){
  const routine = routineId && routines.find(r => r.id === routineId);
  if(!routine) return;
  const pool = routine.exercises.map(normalizeRoutineExercise);
  const lines = describeRoutineChanges(pool.map(e => e.name), sessionExercises.map(e => e.name));
  if(!lines.length) return;
  const update = await uiConfirm(
    `Hiciste cambios respecto de la rutina "${routine.title}":\n\n${lines.join('\n')}\n\n¿Querés guardarlos para que la próxima vez la rutina arranque así?`,
    { title: '¿Actualizar la rutina?', confirmText: 'Actualizar rutina', cancelText: 'Dejarla como estaba' }
  );
  if(!update) return;
  routine.exercises = sessionExercises.map(se => {
    const i = pool.findIndex(p => p.name === se.name);
    const base = i >= 0 ? pool.splice(i, 1)[0] : { name: se.name, note: se.note || '', collapsed: false, restSeconds: se.restSeconds ?? 90, sets: se.sets.map(s => ({ type: s.type || 'N', weight: '', reps: '' })) };
    return { ...base, superset: se.superset || false };
  });
  await saveRoutines();
}

// achievements: récords de la sesión; extras: objetivos cumplidos e insignias nuevas (se listan como logros, pero no cuentan como récords).
function showSummaryModal(w, achievements, extras = []){
  const totalVol = getWorkoutVolume(w);
  const totalSets = w.exercises.reduce((acc,ex)=> acc + ex.sets.length, 0);
  const allLogros = [...achievements, ...extras];

  let praiseTitle = "¡Buen entrenamiento!"; let praiseText = "Dejaste todo en el gimnasio hoy.";
  if(achievements.length > 0) { praiseTitle = "¡Sesión con récords!"; praiseText = `Superaste ${achievements.length} récord${achievements.length>1?'es':''} personal${achievements.length>1?'es':''}.`; fireConfetti(); }
  else if(extras.length > 0) { praiseTitle = "¡Logro desbloqueado!"; praiseText = extras.length > 1 ? `Conseguiste ${extras.length} logros nuevos.` : 'Conseguiste un logro nuevo.'; fireConfetti(); }
  else if(totalVol > 5000) { praiseTitle = "¡Volumen enorme!"; praiseText = `Moviste ${toDisplayWeight(totalVol).toLocaleString('es-AR')} ${weightUnit} en total.`; }

  const modal = document.createElement('div'); modal.className = 'modal-overlay';
  modal.innerHTML = `<div class="modal-card"><h2>${praiseTitle}</h2><p>${praiseText}</p><div class="summary-grid"><div class="summary-box"><div class="sb-label">Tiempo</div><div class="sb-val">${formatDuration(w.duration || 0)}</div></div><div class="summary-box"><div class="sb-label">Volumen</div><div class="sb-val">${toDisplayWeight(totalVol).toLocaleString('es-AR')} ${weightUnit}</div></div><div class="summary-box"><div class="sb-label">Ejercicios</div><div class="sb-val">${w.exercises.length}</div></div><div class="summary-box"><div class="sb-label">Series</div><div class="sb-val">${totalSets}</div></div></div>${allLogros.length > 0 ? `<div class="achievement-list"><div style="font-weight:600; font-size:12px; color:var(--gold-text); margin-bottom:6px;">🏆 LOGROS</div>${allLogros.map(a => `<div class="achievement-item">✓ ${escapeHtml(a)}</div>`).join('')}</div>` : ''}<div class="summary-actions"><button class="btn-ghost" id="shareSummaryBtn">📤 Compartir</button><button class="btn-primary" id="closeSummaryBtn">Continuar</button></div></div>`;
  document.body.appendChild(modal);
  const unregisterOverlay = registerOverlay(() => { if(document.body.contains(modal)) document.body.removeChild(modal); });
  document.getElementById('shareSummaryBtn').addEventListener('click', ()=> openWorkoutImagePreview(w, allLogros));
  document.getElementById('closeSummaryBtn').addEventListener('click', ()=>{ unregisterOverlay(); document.body.removeChild(modal); currentTab = 'history'; render(); });
}

// ---- RUTINAS ----
function renderRoutines(){
  if(routineDraft){ renderRoutineEditor(); return; }

  let html = `<button class="add-exercise-btn" id="newRoutineBtn" style="margin-bottom:10px;">+ Crear nueva rutina</button>
    <div class="routines-tools"><button class="btn-ghost" id="openTemplatesBtn">📋 Plantillas</button><button class="btn-ghost" id="importRoutineBtn">📥 Importar rutina</button></div>`;

  if(routines.length === 0){
    html += `<div class="empty-state" style="padding:20px 10px;">
      <div class="big">Sin rutinas guardadas</div>
      <div>Creá una, importá la de otra persona o arrancá con una plantilla.</div>
      <button class="btn-primary" id="loadDefaultsBtn" style="margin-top:16px;">Ver plantillas de rutinas</button>
    </div>`;
  } else {
    const todayJs = new Date().getDay();
    routines.forEach(r=>{
      const exNames = r.exercises.map(e => typeof e === 'string' ? e : e.name);
      const isToday = (r.days||[]).includes(todayJs);
      const dayTags = (r.days||[]).length ? WEEKDAY_JS_VALUES.map((jsVal,i)=> (r.days||[]).includes(jsVal) ? WEEKDAY_LABELS[i] : '').filter(Boolean).join(' ') : '';
      html += `<div class="workout-card"><div class="wc-head" style="display:flex; justify-content:space-between; align-items:center;"><div><div class="wc-title-main">${escapeHtml(r.title)}${isToday ? '<span style="background:var(--accent); color:#fff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px; margin-left:8px; vertical-align:middle;">HOY</span>' : ''}</div><div style="font-size:12px; color:var(--text-dim);">${exNames.map(escapeHtml).join(', ') || 'Sin ejercicios'}</div>${dayTags ? `<div style="font-size:11px; color:var(--text-dim); margin-top:4px;">📅 ${dayTags}</div>` : ''}</div><button class="btn-primary" style="width:auto; padding:10px 16px; font-size:13px;" data-use="${r.id}">Empezar</button></div><div class="wc-body" style="border-top:1px solid var(--border); display:flex; gap:8px; padding-top:12px;"><button class="btn-ghost" style="flex:1;" data-edit="${r.id}">Editar</button><button class="btn-ghost" style="flex:1;" data-dup="${r.id}">Duplicar</button><button class="btn-ghost" style="flex:1;" data-share-routine="${r.id}">Compartir</button><button class="btn-danger-ghost" style="flex:1;" data-del="${r.id}">Borrar</button></div></div>`;
    });
  }

  mainEl.innerHTML = html;
  document.getElementById('newRoutineBtn').addEventListener('click', ()=>{ routineDraft = { id: Date.now().toString(), title: '', exercises: [], days: [] }; render(); });
  document.getElementById('openTemplatesBtn').addEventListener('click', openTemplatesSheet);
  document.getElementById('importRoutineBtn').addEventListener('click', openImportRoutine);
  if(document.getElementById('loadDefaultsBtn')) document.getElementById('loadDefaultsBtn').addEventListener('click', openTemplatesSheet);
  mainEl.querySelectorAll('[data-share-routine]').forEach(b=> b.addEventListener('click', ()=> shareRoutine(b.dataset.shareRoutine)));
  mainEl.querySelectorAll('[data-use]').forEach(b=> b.addEventListener('click', ()=> startFromRoutine(b.dataset.use)));
  mainEl.querySelectorAll('[data-edit]').forEach(b=> b.addEventListener('click', ()=>{ const r = routines.find(x => x.id === b.dataset.edit); routineDraft = { id: r.id, title: r.title, exercises: r.exercises.map(normalizeRoutineExercise), days: r.days || [] }; render(); }));
  mainEl.querySelectorAll('[data-dup]').forEach(b=> b.addEventListener('click', ()=>{
    const r = routines.find(x => x.id === b.dataset.dup); if(!r) return;
    const copy = JSON.parse(JSON.stringify(r));
    copy.id = Date.now().toString();
    copy.title = r.title + ' (copia)';
    routines.push(copy); saveRoutines(); render();
  }));
  mainEl.querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', async ()=>{ if(await uiConfirm('¿Eliminar esta rutina?', { title: 'Eliminar rutina', confirmText: 'Eliminar', danger: true })){ routines = routines.filter(x => x.id !== b.dataset.del); saveRoutines(); render(); } }));
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
        <div class="ex-rest-row"><button class="rest-pill ${(re.restSeconds ?? 90) === 0 ? 'is-off' : ''}" data-edit-routine-rest="${idx}">⏱️ Descanso: ${formatRestLabel(re.restSeconds ?? 90)}</button><button class="rest-pill" data-replace-routine-ex="${idx}">🔄 Reemplazar</button></div>
        <input type="text" class="exercise-note-input" placeholder="Añadir nota al ejercicio..." value="${escapeHtml(re.note || '')}" data-routine-ex-note="${idx}">
        <div class="set-table-head"><span>S</span><span>Previo</span><span>${getModeLabels(re.name).weightLabel.replace('KG', weightUnit.toUpperCase())}</span><span>${getExerciseMode(re.name) === 'time' ? 'Seg' : 'Reps'}</span><span></span></div>
        ${re.sets.map((s, sIdx) => {
          const info = SET_TYPE_INFO[s.type];
          return `<div class="set-row-hevy ${getSetTypeRowClass(s.type)}">
            <div class="set-badge" data-edit-routine-set-type="${idx}-${sIdx}" title="${info.label} - tocá para cambiar" style="background:${info.bg}; color:${info.fg};">${info.badge || (sIdx+1)}</div>
            <div class="set-prev">${getLastSetString(re.name, sIdx)}</div>
            <input type="number" inputmode="decimal" min="0" max="${unitMaxWeight()}" placeholder="Opcional" value="${s.weight === '' ? '' : toDisplayWeight(s.weight)}" data-routine-set-field="${idx}-${sIdx}-weight">
            <input type="number" inputmode="numeric" min="0" max="${getRepsMax(re.name)}" placeholder="Opcional" value="${s.reps === '' ? '' : s.reps}" data-routine-set-field="${idx}-${sIdx}-reps">
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
  mainEl.querySelectorAll('[data-edit-routine-rest]').forEach(b=> b.addEventListener('click', async ()=>{
    const ex = routineDraft.exercises[parseInt(b.dataset.editRoutineRest)];
    const val = await askRestSeconds(ex.restSeconds);
    if(val === null) return;
    ex.restSeconds = val; render();
  }));
  mainEl.querySelectorAll('[data-replace-routine-ex]').forEach(b=> b.addEventListener('click', ()=>{
    const ex = routineDraft.exercises[parseInt(b.dataset.replaceRoutineEx)];
    openExercisePicker((name)=>{
      if(name === ex.name) return;
      ex.name = name;
      ex.sets = ex.sets.map(s => ({ type: s.type, weight: '', reps: '' }));
      render();
    });
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
    const max = field === 'reps' ? getRepsMax(routineDraft.exercises[parseInt(idx)].name) : unitMaxWeight();
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
    if(!title){ uiAlert('Asigná un título a la rutina.'); return; }
    if(routineDraft.exercises.length === 0){ uiAlert('Agregá al menos un ejercicio.'); return; }
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
    const jsFirstDay = new Date(year, m, 1).getDay(); // 0=Dom
    const firstDayMon = (jsFirstDay + 6) % 7; // 0=Lun, para que la semana empiece igual que el resto del calendario
    let dots = '';
    for(let i=0; i<firstDayMon; i++) dots += `<div class="year-dot year-dot-empty"></div>`;
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
  const compareTools = workouts.length >= 2 ? (historyCompareMode
    ? `<div class="compare-hint"><span>Tocá dos entrenamientos para compararlos</span><button class="btn-ghost" id="compareToggleBtn">Cancelar</button></div>`
    : `<div class="history-tools"><button class="btn-ghost" id="compareToggleBtn">⚖️ Comparar entrenamientos</button></div>`) : '';
  html += renderHistoryFilters() + compareTools + '<div id="historyList"></div>';
  mainEl.innerHTML = html;
  bindCalendarControls();
  bindHistoryFilterEvents();
  const compareToggle = document.getElementById('compareToggleBtn');
  if(compareToggle) compareToggle.addEventListener('click', ()=>{ historyCompareMode = !historyCompareMode; historyCompareSelection = []; renderHistory(); });
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
    const totalVolume = getWorkoutVolume(w);
    const expanded = expandedWorkoutId === w.id;
    const isSelected = historyCompareSelection.includes(w.id);
    html += `<div class="workout-card ${historyCompareMode ? 'compare-selectable' : ''} ${isSelected ? 'compare-selected' : ''}">
      <div class="wc-head" data-toggle="${w.id}">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          ${historyCompareMode ? `<div class="cmp-check ${isSelected ? 'on' : ''}">${isSelected ? '✓' : ''}</div>` : ''}
          <div class="wc-title-main" style="margin-bottom:4px; flex:1;">${escapeHtml(w.name)}</div>
          ${historyCompareMode ? '' : `<div style="display:flex; gap:6px;">
            <button class="btn-ghost" style="padding:4px 8px; font-size:11px;" data-repeat-workout="${w.id}">Repetir</button>
            <button class="btn-ghost" style="padding:4px 8px; font-size:11px;" data-edit-workout="${w.id}">Editar</button>
            <button class="btn-danger-ghost" style="padding:4px 8px; font-size:11px;" data-delete-workout="${w.id}">Eliminar</button>
          </div>`}
        </div>
        <div style="font-size:11px; color:var(--text-dim); margin-bottom:6px;">${fmtDate(w.date)}</div>
        <div class="wc-stats-row"><span>Duración <strong>${formatDuration(w.duration || 0)}</strong></span><span>Volumen <strong>${toDisplayWeight(Math.round(totalVolume)).toLocaleString('es-AR')} ${weightUnit}</strong></span></div>
      </div>
      ${expanded ? `<div class="wc-body">
        ${w.globalNote ? `<div style="background:var(--surface-2); padding:10px; border-radius:8px; font-size:12px; font-style:italic; margin-top:10px; border-left:3px solid var(--accent);">${escapeHtml(w.globalNote)}</div>` : ''}
        ${w.exercises.map(ex => {
          const priorWorkouts = workouts.filter(wo => new Date(wo.date) < new Date(w.date));
          let sessionMax = 0, sessionMaxVol = 0;
          return `<div class="wc-ex-block ${ex.superset?'is-superset':''}">
            <div class="wc-ex-header-row"><div class="muscle-mini-icon" style="width:30px; height:30px;">${getExerciseMiniFigure(ex.name)}</div><div class="wc-ex-title" style="flex:1;">${escapeHtml(ex.name)} ${ex.superset?'🔗':''}</div><button class="btn-icon" data-video-hist-ex="${escapeHtml(ex.name)}" title="Ver video de ejecución" style="width:26px; height:26px; font-size:12px;">🎥</button></div>
            ${ex.note ? `<div class="wc-ex-note-view">Nota: "${escapeHtml(ex.note)}"</div>` : ''}
            <div class="wc-history-table-head"><span>Series</span><span>Peso y repeticiones</span></div>
            ${ex.sets.map((s,i)=> {
              const isBest = s.type!=='W' && isPersonalRecordBefore(ex.name, s, priorWorkouts, sessionMax);
              if(isBest) sessionMax = getSetScore(ex.name, s);
              const isVolBest = s.type!=='W' && isVolumeRecordBefore(ex.name, s, priorWorkouts, sessionMaxVol, w.date);
              sessionMaxVol = Math.max(sessionMaxVol, getSetVolume(s, ex.name, w.date));
              return `<div class="wc-history-row ${isBest ? 'is-best':''} ${isVolBest && !isBest ? 'is-vol-best':''}"><div class="wc-set-num">${s.type!=='N'?`<span class="badge-type" style="background:${SET_TYPE_INFO[s.type].bg}; color:${SET_TYPE_INFO[s.type].fg};">${SET_TYPE_INFO[s.type].badge}</span>`:(i+1)}</div><div class="wc-set-det"><span>${fmtSetLong(ex.name, s)}</span>${isBest ? `<span style="font-size:11px; color:var(--gold-text); font-weight:600;">🏆 PR</span>` : ''}${isVolBest ? `<span style="font-size:11px; color:var(--success-text); font-weight:600;">🏅 Volumen ${fmtW(getSetVolume(s, ex.name, w.date))}</span>` : ''}</div></div>`;
            }).join('')}
          </div>`;
        }).join('')}
        <button class="btn-ghost" data-share-workout="${w.id}" style="margin-top:14px; width:100%;">📤 Compartir como imagen</button>
      </div>` : ''}
    </div>`;
  });
  if(historyCompareMode) html += `<div class="compare-bar"><span>${historyCompareSelection.length} de 2 seleccionados</span><button class="btn-primary" id="runCompareBtn" ${historyCompareSelection.length === 2 ? '' : 'disabled'}>Comparar</button></div>`;
  listEl.innerHTML = html;

  listEl.querySelectorAll('[data-toggle]').forEach(el=> el.addEventListener('click', (e)=>{
    if(e.target.tagName === 'BUTTON') return;
    if(historyCompareMode){
      const id = el.dataset.toggle, i = historyCompareSelection.indexOf(id);
      if(i >= 0) historyCompareSelection.splice(i, 1);
      else { if(historyCompareSelection.length >= 2) historyCompareSelection.shift(); historyCompareSelection.push(id); }
      renderHistoryList(); return;
    }
    expandedWorkoutId = expandedWorkoutId === el.dataset.toggle ? null : el.dataset.toggle; renderHistoryList();
  }));
  const runCompare = document.getElementById('runCompareBtn');
  if(runCompare) runCompare.addEventListener('click', ()=>{ const [a, b] = historyCompareSelection; historyCompareMode = false; historyCompareSelection = []; renderHistory(); openCompareWorkouts(a, b); });
  listEl.querySelectorAll('[data-share-workout]').forEach(b=> b.addEventListener('click', (e)=>{ e.stopPropagation(); const w = workouts.find(x => x.id === b.dataset.shareWorkout); if(w) openWorkoutImagePreview(w, []); }));
  listEl.querySelectorAll('[data-edit-workout]').forEach(b=> b.addEventListener('click', (e)=>{ e.stopPropagation(); editingWorkoutId = b.dataset.editWorkout; editingWorkoutDraft = JSON.parse(JSON.stringify(workouts.find(w => w.id === editingWorkoutId))); render(); }));
  listEl.querySelectorAll('[data-delete-workout]').forEach(b=> b.addEventListener('click', async (e)=>{
    e.stopPropagation();
    if(await uiConfirm('¿Eliminar este entrenamiento del historial? Esta acción no se puede deshacer.', { title: 'Eliminar entrenamiento', confirmText: 'Eliminar', danger: true })){
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
  <div class="start-card" style="margin-bottom:16px;"><label>Nombre</label><input type="text" id="editWorkoutName" value="${escapeHtml(w.name)}">
    <label>Duración del entrenamiento</label>
    <div class="duration-edit">
      <div><input type="text" inputmode="numeric" maxlength="2" id="editDurationH" value="${Math.floor((w.duration || 0) / 3600)}" aria-label="Horas"><span>h</span></div>
      <div><input type="text" inputmode="numeric" maxlength="2" id="editDurationM" value="${Math.floor(((w.duration || 0) % 3600) / 60)}" aria-label="Minutos"><span>min</span></div>
    </div>
    <div class="setting-hint" id="editDurationHint">Si te olvidaste de cerrar el entreno y quedó con muchas horas, corregilo acá.</div>
  </div>`;

  if(w.exercises.length === 0){ html += `<div class="empty-state"><div class="big">Sin ejercicios</div></div>`; }
  w.exercises.forEach((ex, exIdx)=>{
    html += `<div class="exercise-card">
      <div class="exercise-header">
        <div class="exercise-title-wrap"><div class="muscle-mini-icon">${getExerciseMiniFigure(ex.name)}</div><h3>${escapeHtml(ex.name)}</h3></div>
        <div class="exercise-actions-top"><button class="btn-icon" data-remove-edit-ex="${exIdx}" style="width:26px; height:26px; font-size:13px;">✕</button></div>
      </div>
      <div class="set-table-head"><span>S</span><span></span><span>${getModeLabels(ex.name).weightLabel.replace('KG', weightUnit.toUpperCase())}</span><span>${getExerciseMode(ex.name) === 'time' ? 'Seg' : 'Reps'}</span><span></span></div>
      ${ex.sets.map((s, sIdx)=> `<div class="set-row-hevy">
        <div class="set-badge">${sIdx+1}</div>
        <div class="set-prev"></div>
        <input type="number" inputmode="decimal" min="0" max="${unitMaxWeight()}" value="${s.weight === '' ? '' : toDisplayWeight(s.weight)}" data-edit-set-field="${exIdx}-${sIdx}-weight">
        <input type="number" inputmode="numeric" min="0" max="${getRepsMax(ex.name)}" value="${s.reps === '' ? '' : s.reps}" data-edit-set-field="${exIdx}-${sIdx}-reps">
        <button class="set-check-btn" data-remove-edit-set="${exIdx}-${sIdx}" style="color:var(--danger);">✕</button>
      </div>`).join('')}
      <button class="add-set-hevy" data-add-edit-set="${exIdx}">+ Agregar serie</button>
    </div>`;
  });
  html += `<div style="display:flex; gap:8px; margin-top:6px; margin-bottom:20px;"><button class="btn-ghost" id="cancelEditWorkoutBtn" style="flex:1;">Cancelar</button><button class="btn-primary" id="saveEditWorkoutBtn" style="flex:2;">Guardar cambios</button></div>`;

  mainEl.innerHTML = html;

  document.getElementById('editWorkoutName').addEventListener('input', (e)=>{ editingWorkoutDraft.name = e.target.value; });
  const hoursEl = document.getElementById('editDurationH'), minutesEl = document.getElementById('editDurationM');
  const onDurationInput = (inp, max)=>{
    let raw = inp.value.replace(/\D/g, '');
    if(raw !== '' && Number(raw) > max) raw = String(max);
    if(raw !== inp.value) inp.value = raw;
    editingWorkoutDraft.duration = (parseInt(hoursEl.value, 10) || 0) * 3600 + (parseInt(minutesEl.value, 10) || 0) * 60;
    editingWorkoutDraft.durationEdited = true;
  };
  hoursEl.addEventListener('input', ()=> onDurationInput(hoursEl, 23));
  minutesEl.addEventListener('input', ()=> onDurationInput(minutesEl, 59));
  [hoursEl, minutesEl].forEach(inp => inp.addEventListener('focus', ()=> inp.select()));
  mainEl.querySelectorAll('[data-remove-edit-ex]').forEach(b=> b.addEventListener('click', async ()=>{ if(await uiConfirm('¿Eliminar este ejercicio del entrenamiento?', { title: 'Eliminar ejercicio', confirmText: 'Eliminar', danger: true })){ editingWorkoutDraft.exercises.splice(parseInt(b.dataset.removeEditEx), 1); renderWorkoutEditor(); } }));
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
    if(field === 'reps'){ const repsMax = getRepsMax(editingWorkoutDraft.exercises[parseInt(exIdx)].name); if(/[.,]/.test(raw)) raw = raw.split(/[.,]/)[0]; if(raw !== '' && Number(raw) > repsMax) raw = String(repsMax); }
    else { if(raw !== '' && Number(raw) > unitMaxWeight()) raw = String(unitMaxWeight()); }
    if(raw !== inp.value) inp.value = raw;
    const parsed = raw === '' ? '' : parseFloat(raw);
    editingWorkoutDraft.exercises[parseInt(exIdx)].sets[parseInt(sIdx)][field] = (field === 'weight' && parsed !== '') ? toKgWeight(parsed) : parsed;
  }));
  document.getElementById('cancelEditWorkoutBtn').addEventListener('click', ()=>{ editingWorkoutId = null; editingWorkoutDraft = null; render(); });
  document.getElementById('saveEditWorkoutBtn').addEventListener('click', ()=>{
    let errorMsg = '';
    editingWorkoutDraft.exercises.forEach(ex => ex.sets.forEach(s=>{
      const weightRequired = getExerciseMode(ex.name) === 'weight';
      if((s.weight !== '' && s.reps === '') || (weightRequired && s.weight === '' && s.reps !== '')) errorMsg = `En "${ex.name}" falta completar ${weightRequired ? 'peso o reps' : 'las repeticiones o los segundos'} en una serie.`;
      if(s.reps !== '' && !Number.isInteger(Number(s.reps))) errorMsg = `En "${ex.name}" ${getExerciseMode(ex.name) === 'time' ? 'los segundos' : 'las repeticiones'} deben ser un número entero.`;
      if(s.weight !== '' && Number(s.weight) < 0) errorMsg = `En "${ex.name}" el peso no puede ser negativo.`;
    }));
    if(editingWorkoutDraft.durationEdited && editingWorkoutDraft.duration < 60) errorMsg = 'La duración tiene que ser de al menos 1 minuto.';
    if(errorMsg){ uiAlert(errorMsg, '⚠️ Revisá tus datos'); return; }
    const cleanedExercises = editingWorkoutDraft.exercises.map(ex => ({ ...ex, sets: ex.sets.filter(s => isSetFilled(ex.name, s)).map(s => ({ ...s, weight: (s.weight === '' || s.weight == null) ? 0 : s.weight })) })).filter(ex => ex.sets.length > 0);
    const idx = workouts.findIndex(w => w.id === editingWorkoutDraft.id);
    if(idx >= 0){
      workouts[idx] = { ...workouts[idx], name: editingWorkoutDraft.name.trim() || workouts[idx].name, exercises: cleanedExercises };
      if(editingWorkoutDraft.durationEdited) workouts[idx].duration = editingWorkoutDraft.duration;
    }
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
    let bestSet = null, bestScore = 0, bestDate = '', volSet = null, maxVol = 0, volDate = '';
    workouts.forEach(w => w.exercises.forEach(e => { if(e.name === exName) e.sets.forEach(s => {
      if(s.type === 'W') return;
      const sc = getSetScore(exName, s);
      if(!isNaN(sc) && (bestSet === null || sc > bestScore || (sc === bestScore && Number(s.reps) > Number(bestSet.reps)))){ bestSet = s; bestScore = sc; bestDate = w.date; }
      const v = getSetVolume(s, exName, w.date);
      if(v > maxVol){ maxVol = v; volSet = s; volDate = w.date; }
    }); }));
    if(bestSet){
      anyShown = true;
      const mode = getExerciseMode(exName);
      const repsNote = mode === 'time' ? '' : `× ${bestSet.reps} reps`;
      const mainValue = (mode === 'bodyweight' && bestScore === 0) ? `${bestSet.reps} reps` : fmtScore(exName, bestScore);
      html += `<div class="pr-global-card"><div class="pr-top-row"><div style="display:flex; align-items:center; gap:12px;"><div class="muscle-mini-icon" style="width:38px; height:38px;">${getExerciseMiniFigure(exName)}</div><div><div style="font-size:14px; font-weight:600; color:var(--text);">${escapeHtml(exName)}</div><div style="font-size:11px; color:var(--text-dim);">${fmtDate(bestDate)}</div></div></div><div style="text-align:right;"><div style="font-size:18px; font-weight:700; color:var(--gold-text);">${mainValue}</div><div style="font-size:12px; color:var(--text-dim);">${(mode === 'bodyweight' && bestScore === 0) ? '' : repsNote}</div></div></div>${volSet ? `<div class="pr-volume-row"><span>🏅 Mejor volumen<br><small>${fmtSetShort(exName, volSet)} · ${fmtDate(volDate)}</small></span><strong>${fmtW(maxVol)}</strong></div>` : ''}</div>`;
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
  const deltaHtml = delta !== null && delta !== 0 ? `<span class="bw-delta" style="color:${delta < 0 ? 'var(--success-text)' : 'var(--danger)'};">${delta > 0 ? '+' : ''}${delta}${weightUnit}</span>` : '';
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
    const vol = getWorkoutVolume(w);
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

// La pestaña Progreso se divide en secciones; cada una se dibuja en su propia función (varias viven en features.js).
let progressSection = 'charts';
const PROGRESS_SECTIONS = [['charts', '📈 Gráficos'], ['summary', '📅 Resumen'], ['goals', '🎯 Objetivos'], ['badges', '🏅 Logros'], ['settings', '⚙️ Ajustes']];

function renderProgress(){
  const nav = `<div class="categories-filter progress-sections">${PROGRESS_SECTIONS.map(([id, label]) => `<div class="cat-pill ${progressSection === id ? 'active' : ''}" data-progress-section="${id}">${label}</div>`).join('')}</div>`;
  mainEl.innerHTML = `${nav}<div id="progressBody"></div>`;
  mainEl.querySelectorAll('[data-progress-section]').forEach(p => p.addEventListener('click', ()=>{ if(progressSection === p.dataset.progressSection) return; progressSection = p.dataset.progressSection; renderProgress(); }));
  const body = document.getElementById('progressBody');
  if(progressSection === 'summary') renderSummarySection(body);
  else if(progressSection === 'goals') renderGoalsSection(body);
  else if(progressSection === 'badges') renderBadgesSection(body);
  else if(progressSection === 'settings') renderSettingsSection(body);
  else renderProgressCharts(body);
}

// Valor de un puntaje de récord listo para graficar: peso, lastre, ayuda o segundos según el modo del ejercicio.
function scoreToChartValue(exName, score){
  const mode = getExerciseMode(exName);
  if(mode === 'time') return score;
  if(mode === 'assisted') return toDisplayWeight(ASSIST_CAP - score);
  return toDisplayWeight(score);
}

function renderProgressCharts(container){
  const exList = getExercisesWithData();
  container.innerHTML = renderBodyWeightCard() + renderWeeklyVolumeChart() + (exList.length === 0 ? `<div class="empty-state"><div class="big">Sin datos de progreso</div></div>` : '<div id="progressExBody"></div>');
  document.getElementById('logBwBtn').addEventListener('click', async ()=>{
    const currentDisplay = bodyWeightLog.length ? toDisplayWeight(bodyWeightLog[bodyWeightLog.length-1].weight) : '';
    const maxDisplay = weightUnit === 'lb' ? 880 : 400;
    const parseBw = (raw)=> parseFloat(String(raw).replace(',', '.'));
    const raw = await uiPrompt(`Peso corporal actual (${weightUnit}):`, currentDisplay, {
      title: 'Peso corporal', inputMode: 'decimal',
      validate: (v)=>{ const n = parseBw(v); return (isNaN(n) || n <= 0 || n > maxDisplay) ? `Ingresá un peso válido en ${weightUnit}.` : null; }
    });
    if(raw === null) return;
    const val = parseBw(raw);
    bodyWeightLog.push({ date: new Date().toISOString(), weight: toKgWeight(val) });
    saveBodyWeight(); checkGoalsAfterBodyWeight(); renderProgress();
  });
  if(exList.length === 0) return;
  if(!selectedProgressExercise || !exList.includes(selectedProgressExercise)) selectedProgressExercise = exList[0];
  const exName = selectedProgressExercise, mode = getExerciseMode(exName);

  const points = []; let theoreticalMax1RM = 0;
  workouts.slice().reverse().forEach(w=>{
    const ex = w.exercises.find(e => e.name === exName);
    if(!ex || !ex.sets.length) return;
    const validSets = ex.sets.filter(s => s.type !== 'W' && isSetFilled(exName, s));
    if(validSets.length === 0) return;
    const scores = validSets.map(s => getSetScore(exName, s));
    const maxScore = Math.max(...scores);
    const bestSet = validSets[scores.indexOf(maxScore)];
    const volume = mode === 'time' ? validSets.reduce((acc, s) => acc + Number(s.reps), 0) : validSets.reduce((acc, s) => acc + getSetVolume(s, exName, w.date), 0);
    points.push({ date: w.date, score: maxScore, reps: bestSet.reps, volume });
    if(mode === 'weight') validSets.forEach(s => { const wt = Number(s.weight), rp = Number(s.reps); if(wt > 0 && rp > 0 && rp <= 12){ const rm = wt * (36 / (37 - rp)); if(rm > theoreticalMax1RM) theoreticalMax1RM = rm; } else if(wt > 0 && rp > 12) { if(wt > theoreticalMax1RM) theoreticalMax1RM = wt; } });
  });

  const body = document.getElementById('progressExBody');
  if(points.length === 0){ body.innerHTML = `<div class="empty-state"><div class="big">Sin series efectivas registradas</div></div>`; return; }

  const prPoint = points.reduce((a, b) => b.score > a.score ? b : a, points[0]);
  const exGrid = `<div class="progress-ex-grid">${exList.map(e => `<div class="progress-ex-card ${e===exName?'active':''}" data-pick-progress-ex="${escapeHtml(e)}"><div class="muscle-mini-icon">${getExerciseMiniFigure(e)}</div><div class="pe-name">${escapeHtml(e)}</div></div>`).join('')}</div>`;
  const prLabel = mode === 'time' ? 'Mejor tiempo' : mode === 'assisted' ? 'Menor ayuda' : mode === 'bodyweight' ? 'Mayor lastre' : 'Récord personal';
  const prMain = (mode === 'bodyweight' && prPoint.score === 0) ? `${prPoint.reps} reps` : fmtScore(exName, prPoint.score);
  const prSub = mode === 'time' ? '' : ((mode === 'bodyweight' && prPoint.score === 0) ? '' : `× ${prPoint.reps} reps`);
  const rightBlock = mode === 'weight' ? `<div style="text-align:right;"><div class="pr-label">1RM teórico</div><div style="font-size:18px; font-weight:700; color:var(--accent-text);">${fmtW(theoreticalMax1RM)}</div></div>` : '';
  const weightTitle = mode === 'time' ? 'Mejor tiempo por sesión (seg)' : mode === 'assisted' ? `Ayuda por sesión (${weightUnit})` : mode === 'bodyweight' ? `Lastre máximo por sesión (${weightUnit})` : `Peso máximo por sesión (${weightUnit})`;
  const volumeTitle = mode === 'time' ? 'Tiempo total del ejercicio (seg)' : `Volumen total del ejercicio (${weightUnit})`;

  body.innerHTML = `${exGrid}<div class="pr-card"><div style="display:flex; align-items:center; gap:14px;"><div class="muscle-mini-icon" style="width:42px; height:42px;">${getExerciseMiniFigure(exName)}</div><div><div class="pr-label">${prLabel}</div><div class="pr-value">${prMain} <span style="font-size:13px; color:var(--text-dim); font-weight:400;">${prSub}</span></div></div></div>${rightBlock}</div><div class="chart-wrap"><h4>${weightTitle}</h4><div id="chartHolderWeight"></div></div><div class="chart-wrap"><h4>${volumeTitle}</h4><div id="chartHolderVolume"></div></div>`;
  mainEl.querySelectorAll('[data-pick-progress-ex]').forEach(c=> c.addEventListener('click', ()=>{ selectedProgressExercise = c.dataset.pickProgressEx; renderProgress(); }));
  document.getElementById('chartHolderWeight').innerHTML = buildChart(points.map(p => ({ date: p.date, val: scoreToChartValue(exName, p.score) })), 'var(--accent)');
  document.getElementById('chartHolderVolume').innerHTML = buildChart(points.map(p => ({ date: p.date, val: mode === 'time' ? p.volume : toDisplayWeight(p.volume) })), 'var(--gold)');
}

function buildChart(pointData, strokeColor){
  const w = 420, h = 160, pad = 28;
  if(pointData.length === 1) return `<svg viewBox="0 0 ${w} ${h}" width="100%"><circle cx="${w/2}" cy="${h/2}" r="5" fill="${strokeColor}"></circle><text x="${w/2}" y="${h/2-14}" fill="var(--text)" font-size="12" text-anchor="middle" font-weight="600">${pointData[0].val}</text></svg>`;
  const vals = pointData.map(p=>p.val), minV = Math.min(...vals), maxV = Math.max(...vals), range = (maxV - minV) || 1, stepX = (w - pad*2) / (pointData.length - 1);
  const coords = pointData.map((p,i)=> ({ x: pad + i*stepX, y: h - pad - ((p.val - minV) / range) * (h - pad*2), p }));
  const path = coords.map((c,i)=> (i===0?'M':'L') + c.x.toFixed(1) + ' ' + c.y.toFixed(1)).join(' ');
  const gradId = `chartGrad${chartGradUid++}`;
  const area = `${path} L ${coords[coords.length-1].x.toFixed(1)} ${h - pad} L ${coords[0].x.toFixed(1)} ${h - pad} Z`;
  const defs = `<defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${strokeColor}; stop-opacity:0.32"></stop><stop offset="1" style="stop-color:${strokeColor}; stop-opacity:0"></stop></linearGradient></defs>`;
  const circles = coords.map((c, i) => `<circle class="chart-dot" style="--i:${i}" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4" fill="${strokeColor}"></circle>`).join('');
  const labelColor = strokeColor === 'var(--accent)' ? 'var(--accent-text)' : strokeColor === 'var(--gold)' ? 'var(--gold-text)' : strokeColor;
  const maxLabel = `<text x="${coords.reduce((a,c)=>c.p.val===maxV?c:a,coords[0]).x}" y="${coords.reduce((a,c)=>c.p.val===maxV?c:a,coords[0]).y - 10}" fill="${labelColor}" font-size="11" text-anchor="middle" font-weight="600">${Math.round(maxV)}</text>`;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%">${defs}<path class="chart-area" d="${area}" fill="url(#${gradId})" stroke="none"></path><path class="chart-line" pathLength="1" d="${path}" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>${circles}${maxLabel}</svg>`;
}
let chartGradUid = 0;

function escapeHtml(str){ const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}

(async function init(){
  document.getElementById('todayLabel').textContent = todayLabel(); ensureRestDock();
  await loadState(); initBadgesIfNeeded(); render();
  checkRoutineLinkOnLoad(); checkStaleWorkout();
})();
