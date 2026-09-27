// Catálogo de ejercicios y plantillas de rutinas. Solo datos y funciones puras: no toca el estado de la app.
// Cada fila: Categoría|Nombre|Equipo|Zona (clave de la figura anatómica)|Modo
// Modo: vacío = peso y repeticiones · b = peso corporal (el peso es lastre extra) · a = asistido (el peso es la ayuda)
//       · t = por tiempo (las "reps" son segundos)
// Los nombres que ya existían se mantienen idénticos para no romper el historial guardado.

const EXERCISE_CATEGORIES = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core'];
const EXERCISE_EQUIPMENT = ['Barra', 'Mancuernas', 'Máquina', 'Polea', 'Peso corporal', 'Kettlebell', 'Banda', 'Otro'];
const EXERCISE_MODES = {
  weight: { label: 'Peso y repeticiones', weightLabel: 'KG', repsLabel: 'REPS' },
  bodyweight: { label: 'Peso corporal (+ lastre opcional)', weightLabel: '+KG', repsLabel: 'REPS' },
  assisted: { label: 'Asistido (restás ayuda)', weightLabel: 'AYUDA', repsLabel: 'REPS' },
  time: { label: 'Por tiempo (segundos)', weightLabel: 'KG', repsLabel: 'SEG' }
};
const MODE_BY_CODE = { '': 'weight', b: 'bodyweight', a: 'assisted', t: 'time' };

// Zonas disponibles por categoría (para crear ejercicios propios).
const MUSCLE_ZONES = {
  Pecho: [['chest_mid', 'Pecho (medio)'], ['chest_upper', 'Pecho superior'], ['chest_lower', 'Pecho inferior']],
  Espalda: [['back_lats', 'Dorsales'], ['back_mid', 'Espalda media'], ['back_traps', 'Trapecio']],
  Piernas: [['legs_quads', 'Cuádriceps'], ['legs_quads_glutes', 'Cuádriceps y glúteos'], ['legs_hamstrings', 'Isquiotibiales'], ['legs_hamstrings_glutes', 'Isquios y glúteos'], ['legs_glutes', 'Glúteos'], ['legs_calves', 'Gemelos']],
  Hombros: [['shoulders_front', 'Hombro frontal'], ['shoulders_side', 'Hombro lateral'], ['shoulders_front_side', 'Frontal y lateral'], ['shoulders_rear', 'Hombro posterior']],
  Brazos: [['arms_biceps', 'Bíceps'], ['arms_triceps', 'Tríceps']],
  Core: [['core_abs', 'Abdominales'], ['core_lower_abs', 'Abdomen inferior']]
};

const CATALOG_ROWS = [
  // ---- Pecho ----
  'Pecho|Press de banca plano|Barra|chest_mid', 'Pecho|Press declinado|Barra|chest_lower', 'Pecho|Press inclinado con barra|Barra|chest_upper',
  'Pecho|Press inclinado con mancuernas|Mancuernas|chest_upper', 'Pecho|Press de banca con mancuernas|Mancuernas|chest_mid', 'Pecho|Press declinado con mancuernas|Mancuernas|chest_lower',
  'Pecho|Press de suelo con mancuernas|Mancuernas|chest_mid', 'Pecho|Press con agarre neutro|Mancuernas|chest_mid',
  'Pecho|Aperturas con mancuernas|Mancuernas|chest_mid', 'Pecho|Aperturas inclinadas con mancuernas|Mancuernas|chest_upper', 'Pecho|Pullover con mancuerna|Mancuernas|chest_mid',
  'Pecho|Press de pecho en máquina|Máquina|chest_mid', 'Pecho|Press inclinado en máquina|Máquina|chest_upper', 'Pecho|Peck deck (Contractora)|Máquina|chest_mid',
  'Pecho|Press en Smith plano|Máquina|chest_mid', 'Pecho|Press en Smith inclinado|Máquina|chest_upper',
  'Pecho|Aperturas en polea|Polea|chest_mid', 'Pecho|Cruce de poleas|Polea|chest_mid', 'Pecho|Cruce de poleas alto a bajo|Polea|chest_lower', 'Pecho|Cruce de poleas bajo a alto|Polea|chest_upper',
  'Pecho|Fondos en paralelas (Pecho)|Peso corporal|chest_lower|b', 'Pecho|Flexiones de brazos|Peso corporal|chest_mid|b', 'Pecho|Flexiones diamante|Peso corporal|chest_mid|b',
  'Pecho|Flexiones inclinadas|Peso corporal|chest_lower|b', 'Pecho|Flexiones con pies elevados|Peso corporal|chest_upper|b', 'Pecho|Fondos asistidos (Pecho)|Máquina|chest_lower|a',
  // ---- Espalda ----
  'Espalda|Dominadas|Peso corporal|back_lats|b', 'Espalda|Dominadas con agarre supino (Chin-ups)|Peso corporal|back_lats|b', 'Espalda|Dominadas agarre neutro|Peso corporal|back_lats|b',
  'Espalda|Dominadas asistidas|Máquina|back_lats|a', 'Espalda|Remo invertido|Peso corporal|back_mid|b', 'Espalda|Hiperextensiones|Peso corporal|back_mid|b', 'Espalda|Superman|Peso corporal|back_mid|b',
  'Espalda|Jalón al pecho en polea|Polea|back_lats', 'Espalda|Jalón con agarre cerrado|Polea|back_lats', 'Espalda|Jalón con agarre neutro|Polea|back_lats', 'Espalda|Jalón a un brazo|Polea|back_lats',
  'Espalda|Remo en polea baja|Polea|back_mid', 'Espalda|Remo en polea a un brazo|Polea|back_mid', 'Espalda|Pull-over en polea|Polea|back_lats',
  'Espalda|Remo con barra|Barra|back_mid', 'Espalda|Remo Pendlay|Barra|back_mid', 'Espalda|Remo con barra agarre supino|Barra|back_mid', 'Espalda|Remo en T|Barra|back_mid',
  'Espalda|Remo Meadows|Barra|back_mid', 'Espalda|Rack pull|Barra|back_mid', 'Espalda|Encogimientos con barra|Barra|back_traps',
  'Espalda|Remo con mancuerna a un brazo|Mancuernas|back_mid', 'Espalda|Remo con mancuernas inclinado|Mancuernas|back_mid',
  'Espalda|Remo en máquina|Máquina|back_mid', 'Espalda|Remo en máquina agarre ancho|Máquina|back_mid', 'Espalda|Encogimientos en máquina|Máquina|back_traps',
  // ---- Piernas ----
  'Piernas|Sentadilla libre|Barra|legs_quads_glutes', 'Piernas|Sentadilla frontal|Barra|legs_quads_glutes', 'Piernas|Sentadilla con pausa|Barra|legs_quads_glutes', 'Piernas|Zancada con barra|Barra|legs_quads_glutes',
  'Piernas|Peso muerto convencional|Barra|legs_hamstrings_glutes', 'Piernas|Peso muerto rumano|Barra|legs_hamstrings_glutes', 'Piernas|Peso muerto sumo|Barra|legs_hamstrings_glutes',
  'Piernas|Peso muerto con piernas rígidas|Barra|legs_hamstrings_glutes', 'Piernas|Buenos días|Barra|legs_hamstrings_glutes',
  'Piernas|Sentadilla goblet|Mancuernas|legs_quads_glutes', 'Piernas|Sentadilla búlgara|Mancuernas|legs_quads_glutes', 'Piernas|Sentadilla sumo con mancuerna|Mancuernas|legs_quads_glutes',
  'Piernas|Zancadas con mancuernas|Mancuernas|legs_quads_glutes', 'Piernas|Zancada caminando|Mancuernas|legs_quads_glutes', 'Piernas|Estocada reversa|Mancuernas|legs_quads_glutes',
  'Piernas|Estocada lateral|Mancuernas|legs_quads_glutes', 'Piernas|Sentadilla split|Mancuernas|legs_quads_glutes', 'Piernas|Step-up (subida al cajón)|Mancuernas|legs_quads_glutes',
  'Piernas|Peso muerto a una pierna|Mancuernas|legs_hamstrings_glutes',
  'Piernas|Prensa de piernas 45°|Máquina|legs_quads', 'Piernas|Prensa de piernas horizontal|Máquina|legs_quads', 'Piernas|Prensa de piernas unilateral|Máquina|legs_quads',
  'Piernas|Sentadilla en Smith|Máquina|legs_quads_glutes', 'Piernas|Sentadilla hack|Máquina|legs_quads', 'Piernas|Extensiones de cuádriceps|Máquina|legs_quads', 'Piernas|Extensiones de cuádriceps unilateral|Máquina|legs_quads',
  'Piernas|Curl femoral tumbado|Máquina|legs_hamstrings', 'Piernas|Curl femoral sentado|Máquina|legs_hamstrings', 'Piernas|Curl femoral de pie|Máquina|legs_hamstrings',
  'Piernas|Hip Thrust|Barra|legs_glutes', 'Piernas|Hip Thrust en máquina|Máquina|legs_glutes', 'Piernas|Puente de glúteos|Peso corporal|legs_glutes|b', 'Piernas|Puente de glúteos con banda|Banda|legs_glutes',
  'Piernas|Patada de glúteo en polea|Polea|legs_glutes', 'Piernas|Patada de glúteo en máquina|Máquina|legs_glutes', 'Piernas|Abducciones en máquina|Máquina|legs_glutes', 'Piernas|Aducciones en máquina|Máquina|legs_quads',
  'Piernas|Elevación de talones (Gemelos)|Máquina|legs_calves', 'Piernas|Elevación de talones sentado|Máquina|legs_calves', 'Piernas|Elevación de talones en prensa|Máquina|legs_calves',
  'Piernas|Elevación de talones a una pierna|Peso corporal|legs_calves|b',
  'Piernas|Curl nórdico|Peso corporal|legs_hamstrings|b', 'Piernas|Sissy squat|Peso corporal|legs_quads|b', 'Piernas|Sentadilla con salto|Peso corporal|legs_quads_glutes|b',
  'Piernas|Sentadilla isométrica en pared|Peso corporal|legs_quads|t', 'Piernas|Kettlebell swing|Kettlebell|legs_hamstrings_glutes',
  // ---- Hombros ----
  'Hombros|Press militar con barra|Barra|shoulders_front', 'Hombros|Press militar sentado con barra|Barra|shoulders_front', 'Hombros|Push press|Barra|shoulders_front', 'Hombros|Press landmine|Barra|shoulders_front_side',
  'Hombros|Remo al mentón|Barra|shoulders_side', 'Hombros|Remo alto con agarre ancho|Barra|shoulders_rear',
  'Hombros|Press de hombros con mancuernas|Mancuernas|shoulders_front', 'Hombros|Press Arnold|Mancuernas|shoulders_front_side', 'Hombros|Elevaciones laterales con mancuernas|Mancuernas|shoulders_side',
  'Hombros|Elevación lateral inclinada|Mancuernas|shoulders_side', 'Hombros|Elevación frontal con mancuernas|Mancuernas|shoulders_front', 'Hombros|Elevación frontal con disco|Otro|shoulders_front',
  'Hombros|Pájaros (Posteriores)|Mancuernas|shoulders_rear', 'Hombros|Pájaro con mancuernas inclinado|Mancuernas|shoulders_rear', 'Hombros|Elevaciones en Y|Mancuernas|shoulders_rear',
  'Hombros|Encogimientos de hombros con mancuernas|Mancuernas|back_traps',
  'Hombros|Press de hombros en máquina|Máquina|shoulders_front', 'Hombros|Press de hombros en Smith|Máquina|shoulders_front', 'Hombros|Elevación lateral en máquina|Máquina|shoulders_side',
  'Hombros|Pájaros en máquina|Máquina|shoulders_rear',
  'Hombros|Elevación lateral en polea|Polea|shoulders_side', 'Hombros|Elevación lateral a un brazo en polea|Polea|shoulders_side', 'Hombros|Elevación frontal en polea|Polea|shoulders_front',
  'Hombros|Pájaros en polea|Polea|shoulders_rear', 'Hombros|Face pull|Polea|shoulders_rear', 'Hombros|Flexiones pica|Peso corporal|shoulders_front|b',
  // ---- Brazos ----
  'Brazos|Curl de bíceps con barra|Barra|arms_biceps', 'Brazos|Curl con barra Z|Barra|arms_biceps', 'Brazos|Curl en banco Scott|Barra|arms_biceps', 'Brazos|Curl inverso con barra|Barra|arms_biceps',
  'Brazos|Curl de bíceps con mancuernas tipo martillo|Mancuernas|arms_biceps', 'Brazos|Curl con mancuernas alterno|Mancuernas|arms_biceps', 'Brazos|Curl inclinado con mancuernas|Mancuernas|arms_biceps',
  'Brazos|Curl concentrado|Mancuernas|arms_biceps', 'Brazos|Curl araña|Mancuernas|arms_biceps', 'Brazos|Curl Zottman|Mancuernas|arms_biceps',
  'Brazos|Curl de muñeca|Mancuernas|arms_biceps', 'Brazos|Curl de muñeca inverso|Mancuernas|arms_biceps',
  'Brazos|Curl de bíceps en polea|Polea|arms_biceps', 'Brazos|Curl en polea alta (doble bíceps)|Polea|arms_biceps', 'Brazos|Curl martillo en polea con cuerda|Polea|arms_biceps', 'Brazos|Curl en máquina|Máquina|arms_biceps',
  'Brazos|Press francés con barra Z|Barra|arms_triceps', 'Brazos|Extensiones de tríceps tras nuca con barra Z|Barra|arms_triceps', 'Brazos|Press cerrado con barra|Barra|arms_triceps', 'Brazos|Press JM|Barra|arms_triceps',
  'Brazos|Press francés con mancuerna|Mancuernas|arms_triceps', 'Brazos|Extensiones de tríceps por encima de la cabeza|Mancuernas|arms_triceps', 'Brazos|Patada de tríceps|Mancuernas|arms_triceps',
  'Brazos|Extensiones de tríceps en polea|Polea|arms_triceps', 'Brazos|Extensiones de tríceps con cuerda|Polea|arms_triceps', 'Brazos|Extensiones de tríceps con barra V|Polea|arms_triceps',
  'Brazos|Extensiones de tríceps a un brazo en polea|Polea|arms_triceps', 'Brazos|Fondos en máquina (Tríceps)|Máquina|arms_triceps',
  'Brazos|Fondos en banco (Tríceps)|Peso corporal|arms_triceps|b', 'Brazos|Fondos en paralelas (Tríceps)|Peso corporal|arms_triceps|b', 'Brazos|Flexiones cerradas (Tríceps)|Peso corporal|arms_triceps|b',
  // ---- Core ----
  'Core|Crunch en polea|Polea|core_abs', 'Core|Pallof press|Polea|core_abs', 'Core|Leñador en polea|Polea|core_abs', 'Core|Crunch en máquina|Máquina|core_abs',
  'Core|Giro ruso|Otro|core_abs', 'Core|Giro ruso con disco|Otro|core_abs', 'Core|Paseo del granjero|Mancuernas|core_abs|t',
  'Core|Elevación de piernas colgado|Peso corporal|core_lower_abs|b', 'Core|Elevación de rodillas colgado|Peso corporal|core_lower_abs|b', 'Core|Toes to bar|Peso corporal|core_lower_abs|b',
  'Core|Elevación de piernas en banco|Peso corporal|core_lower_abs|b', 'Core|Crunch inverso|Peso corporal|core_lower_abs|b', 'Core|Tijeras|Peso corporal|core_lower_abs|t',
  'Core|Rueda abdominal|Otro|core_abs|b', 'Core|Crunch abdominal|Peso corporal|core_abs|b', 'Core|Bicicleta abdominal|Peso corporal|core_abs|b', 'Core|V-ups|Peso corporal|core_abs|b',
  'Core|Dead bug|Peso corporal|core_abs|b', 'Core|Bird dog|Peso corporal|core_abs|b', 'Core|Plancha con toque de hombro|Peso corporal|core_abs|b',
  'Core|Plancha abdominal|Peso corporal|core_abs|t', 'Core|Plancha lateral|Peso corporal|core_abs|t', 'Core|Hollow hold|Peso corporal|core_abs|t', 'Core|Escaladores|Peso corporal|core_abs|t'
];

function parseCatalogRow(row){
  const [cat, name, eq, key, code] = row.split('|');
  return { name, cat, eq, key, mode: MODE_BY_CODE[code || ''] };
}

function buildExerciseCatalog(){ return CATALOG_ROWS.map(parseCatalogRow); }

function buildExerciseIconMap(){
  const map = {};
  CATALOG_ROWS.forEach(row => { const e = parseCatalogRow(row); map[e.name] = e.key; });
  return map;
}

// Músculos secundarios estimados según la zona principal y el tipo de movimiento (no se guardan: se calculan al mostrar).
function secondaryMuscles(name, key){
  const n = name.toLowerCase();
  if(key.startsWith('chest')){
    if(/aperturas|cruce|peck|contractora|pullover/.test(n)) return 'Hombro frontal';
    return 'Tríceps · Hombro frontal';
  }
  if(key === 'back_lats') return /pull-over|pullover/.test(n) ? 'Pecho · Tríceps' : 'Bíceps · Antebrazo';
  if(key === 'back_mid') return /hiperext|superman|rack pull/.test(n) ? 'Glúteos · Isquios' : 'Bíceps · Hombro posterior';
  if(key === 'back_traps') return 'Antebrazo';
  if(key === 'legs_quads') return /extensiones|sissy|isom/.test(n) ? '' : 'Glúteos';
  if(key === 'legs_quads_glutes') return 'Core · Isquios';
  if(key === 'legs_hamstrings') return 'Glúteos';
  if(key === 'legs_hamstrings_glutes') return 'Espalda baja · Antebrazo';
  if(key === 'legs_glutes') return 'Isquios';
  if(key === 'legs_calves') return '';
  if(key === 'shoulders_front') return 'Tríceps · Pecho superior';
  if(key === 'shoulders_front_side') return 'Tríceps · Trapecio';
  if(key === 'shoulders_side') return 'Trapecio';
  if(key === 'shoulders_rear') return 'Espalda alta · Trapecio';
  if(key === 'arms_biceps') return /muñeca/.test(n) ? '' : 'Antebrazo';
  if(key === 'arms_triceps') return /press|fondos|flexiones/.test(n) ? 'Pecho · Hombro frontal' : '';
  if(key.startsWith('core')) return 'Oblicuos';
  return '';
}

// ---- Plantillas de rutinas ----
// Cada ejercicio: [nombre, series, repeticiones (o segundos si es por tiempo), descanso en segundos]
const ROUTINE_TEMPLATES = [
  {
    id: 'ppl', title: 'Push / Pull / Legs', level: 'Intermedio', perWeek: '3 a 6 días',
    desc: 'Empuje, tracción y piernas: cada grupo se entrena en su propio día.',
    routines: [
      { title: 'PPL · Push (empuje)', exercises: [['Press de banca plano', 4, 8, 150], ['Press inclinado con mancuernas', 3, 10, 120], ['Press militar con barra', 3, 8, 120], ['Elevaciones laterales con mancuernas', 3, 15, 60], ['Extensiones de tríceps con cuerda', 3, 12, 60], ['Fondos en paralelas (Tríceps)', 2, 10, 90]] },
      { title: 'PPL · Pull (tracción)', exercises: [['Dominadas', 4, 8, 150], ['Remo con barra', 4, 8, 120], ['Jalón al pecho en polea', 3, 10, 90], ['Remo en polea baja', 3, 12, 90], ['Face pull', 3, 15, 60], ['Curl de bíceps con barra', 3, 10, 60], ['Curl de bíceps con mancuernas tipo martillo', 2, 12, 60]] },
      { title: 'PPL · Legs (piernas)', exercises: [['Sentadilla libre', 4, 6, 180], ['Peso muerto rumano', 3, 10, 120], ['Prensa de piernas 45°', 3, 12, 120], ['Curl femoral tumbado', 3, 12, 90], ['Extensiones de cuádriceps', 3, 12, 60], ['Elevación de talones (Gemelos)', 4, 15, 60]] }
    ]
  },
  {
    id: 'upper-lower', title: 'Torso / Pierna (4 días)', level: 'Principiante a intermedio', perWeek: '4 días',
    desc: 'Alterná torso y piernas dos veces por semana, con dos variantes para no aburrirte.',
    routines: [
      { title: 'Torso A', exercises: [['Press de banca plano', 4, 6, 150], ['Remo con barra', 4, 8, 120], ['Press militar con barra', 3, 8, 120], ['Jalón al pecho en polea', 3, 10, 90], ['Curl de bíceps con barra', 2, 10, 60], ['Extensiones de tríceps en polea', 2, 12, 60]] },
      { title: 'Pierna A', exercises: [['Sentadilla libre', 4, 6, 180], ['Peso muerto rumano', 3, 8, 150], ['Prensa de piernas 45°', 3, 12, 120], ['Curl femoral sentado', 3, 12, 90], ['Elevación de talones (Gemelos)', 4, 15, 60], ['Plancha abdominal', 3, 45, 60]] },
      { title: 'Torso B', exercises: [['Press inclinado con mancuernas', 4, 8, 120], ['Remo con mancuerna a un brazo', 3, 10, 90], ['Press de hombros con mancuernas', 3, 10, 90], ['Dominadas', 3, 8, 120], ['Elevaciones laterales con mancuernas', 3, 15, 60], ['Curl de bíceps con mancuernas tipo martillo', 2, 12, 60]] },
      { title: 'Pierna B', exercises: [['Peso muerto convencional', 3, 5, 180], ['Sentadilla búlgara', 3, 10, 120], ['Hip Thrust', 3, 10, 120], ['Extensiones de cuádriceps', 3, 12, 60], ['Curl femoral tumbado', 3, 12, 90], ['Elevación de piernas colgado', 3, 12, 60]] }
    ]
  },
  {
    id: 'fullbody3', title: 'Full Body (3 días)', level: 'Principiante', perWeek: '3 días',
    desc: 'Todo el cuerpo en cada sesión, ideal para arrancar o si tenés poco tiempo.',
    routines: [
      { title: 'Full Body A', exercises: [['Sentadilla libre', 3, 8, 150], ['Press de banca plano', 3, 8, 120], ['Remo con barra', 3, 8, 120], ['Press militar con barra', 2, 10, 90], ['Plancha abdominal', 3, 40, 60]] },
      { title: 'Full Body B', exercises: [['Peso muerto rumano', 3, 8, 150], ['Press inclinado con mancuernas', 3, 10, 90], ['Jalón al pecho en polea', 3, 10, 90], ['Zancadas con mancuernas', 3, 10, 90], ['Curl de bíceps con barra', 2, 12, 60], ['Extensiones de tríceps en polea', 2, 12, 60]] },
      { title: 'Full Body C', exercises: [['Prensa de piernas 45°', 3, 12, 120], ['Press de banca con mancuernas', 3, 10, 90], ['Remo en polea baja', 3, 10, 90], ['Elevaciones laterales con mancuernas', 3, 15, 60], ['Hip Thrust', 3, 10, 90], ['Crunch en polea', 3, 15, 60]] }
    ]
  },
  {
    id: 'weider4', title: 'Por grupo muscular (4 días)', level: 'Intermedio', perWeek: '4 días',
    desc: 'Un par de grupos por día con más volumen: pecho y tríceps, espalda y bíceps, piernas, hombros.',
    routines: [
      { title: 'Pecho y tríceps', exercises: [['Press de banca plano', 4, 8, 150], ['Press inclinado con mancuernas', 4, 10, 120], ['Aperturas en polea', 3, 12, 75], ['Press francés con barra Z', 3, 10, 90], ['Extensiones de tríceps con cuerda', 3, 12, 60]] },
      { title: 'Espalda y bíceps', exercises: [['Dominadas', 4, 8, 150], ['Remo con barra', 4, 8, 120], ['Remo en polea baja', 3, 12, 90], ['Curl de bíceps con barra', 3, 10, 75], ['Curl de bíceps con mancuernas tipo martillo', 3, 12, 60]] },
      { title: 'Piernas completas', exercises: [['Sentadilla libre', 4, 8, 180], ['Prensa de piernas 45°', 4, 12, 120], ['Peso muerto rumano', 3, 10, 120], ['Curl femoral tumbado', 3, 12, 75], ['Elevación de talones (Gemelos)', 4, 15, 60]] },
      { title: 'Hombros y brazos', exercises: [['Press militar con barra', 4, 8, 120], ['Elevaciones laterales con mancuernas', 4, 15, 60], ['Pájaros (Posteriores)', 3, 15, 60], ['Curl concentrado', 3, 12, 60], ['Patada de tríceps', 3, 12, 60]] }
    ]
  },
  {
    id: 'ul-ppl', title: 'Upper / Lower / Push / Pull / Legs (5 días)', level: 'Avanzado', perWeek: '5 días',
    desc: 'Mezcla de torso/pierna con empuje, tracción y piernas: frecuencia alta y mucho volumen.',
    routines: [
      { title: 'Upper (fuerza)', exercises: [['Press de banca plano', 4, 5, 180], ['Remo con barra', 4, 5, 150], ['Press militar con barra', 3, 6, 150], ['Dominadas', 3, 6, 150]] },
      { title: 'Lower (fuerza)', exercises: [['Sentadilla libre', 4, 5, 210], ['Peso muerto convencional', 3, 5, 210], ['Prensa de piernas 45°', 3, 10, 120], ['Elevación de talones (Gemelos)', 3, 12, 60]] },
      { title: 'Push (volumen)', exercises: [['Press inclinado con mancuernas', 4, 10, 90], ['Press de hombros con mancuernas', 3, 12, 90], ['Cruce de poleas', 3, 15, 60], ['Elevaciones laterales con mancuernas', 4, 15, 45], ['Extensiones de tríceps por encima de la cabeza', 3, 12, 60]] },
      { title: 'Pull (volumen)', exercises: [['Jalón al pecho en polea', 4, 10, 90], ['Remo en polea baja', 3, 12, 90], ['Remo con mancuerna a un brazo', 3, 12, 75], ['Face pull', 3, 15, 45], ['Curl de bíceps en polea', 3, 12, 60]] },
      { title: 'Legs (volumen)', exercises: [['Sentadilla búlgara', 3, 10, 120], ['Hip Thrust', 4, 10, 120], ['Curl femoral sentado', 3, 12, 75], ['Extensiones de cuádriceps', 3, 15, 60], ['Elevación de talones sentado', 4, 15, 45]] }
    ]
  },
  {
    id: 'fuerza5x5', title: 'Fuerza básica 5×5', level: 'Principiante', perWeek: '3 días',
    desc: 'Pocos ejercicios, muy pesados, subiendo carga cada sesión. Dos rutinas que se alternan.',
    routines: [
      { title: '5×5 · A', exercises: [['Sentadilla libre', 5, 5, 210], ['Press de banca plano', 5, 5, 180], ['Remo con barra', 5, 5, 150]] },
      { title: '5×5 · B', exercises: [['Sentadilla libre', 5, 5, 210], ['Press militar con barra', 5, 5, 180], ['Peso muerto convencional', 1, 5, 240]] }
    ]
  },
  {
    id: 'gluteos', title: 'Glúteos y piernas', level: 'Todos', perWeek: '2 a 3 días',
    desc: 'Foco en glúteos, isquios y cuádriceps con mucho trabajo de cadera.',
    routines: [
      { title: 'Glúteos A', exercises: [['Hip Thrust', 4, 10, 120], ['Sentadilla búlgara', 3, 10, 120], ['Peso muerto rumano', 3, 10, 120], ['Patada de glúteo en polea', 3, 15, 60], ['Abducciones en máquina', 3, 20, 45]] },
      { title: 'Glúteos B', exercises: [['Sentadilla sumo con mancuerna', 4, 10, 90], ['Puente de glúteos con banda', 3, 20, 60], ['Curl femoral sentado', 3, 12, 75], ['Estocada reversa', 3, 12, 90], ['Elevación de talones (Gemelos)', 3, 15, 45]] }
    ]
  },
  {
    id: 'calistenia', title: 'Calistenia básica (peso corporal)', level: 'Principiante', perWeek: '3 días',
    desc: 'Sin equipamiento, o casi: usa peso corporal y ejercicios por tiempo.',
    routines: [
      { title: 'Calistenia · Empuje', exercises: [['Flexiones de brazos', 4, 12, 75], ['Flexiones diamante', 3, 8, 75], ['Fondos en banco (Tríceps)', 3, 12, 75], ['Flexiones pica', 3, 8, 75], ['Plancha abdominal', 3, 40, 45]] },
      { title: 'Calistenia · Tracción y core', exercises: [['Dominadas', 4, 6, 120], ['Remo invertido', 4, 10, 90], ['Superman', 3, 12, 45], ['Elevación de rodillas colgado', 3, 10, 60], ['Hollow hold', 3, 30, 45]] },
      { title: 'Calistenia · Piernas', exercises: [['Sentadilla con salto', 4, 12, 75], ['Estocada reversa', 3, 12, 75], ['Puente de glúteos', 3, 15, 60], ['Elevación de talones a una pierna', 3, 12, 45], ['Sentadilla isométrica en pared', 3, 45, 45]] }
    ]
  },
  {
    id: 'core20', title: 'Core y abdomen (20 minutos)', level: 'Todos', perWeek: '2 a 4 días',
    desc: 'Circuito corto para sumar al final de otra rutina o en un día libre.',
    routines: [
      { title: 'Core 20 min', exercises: [['Plancha abdominal', 3, 45, 30], ['Plancha lateral', 2, 30, 30], ['Crunch inverso', 3, 15, 30], ['Bicicleta abdominal', 3, 20, 30], ['Dead bug', 3, 12, 30], ['Elevación de piernas en banco', 3, 12, 30]] }
    ]
  }
];

// Comprueba que todos los ejercicios de las plantillas existan en el catálogo. Devuelve los nombres que faltan.
function findMissingTemplateExercises(){
  const names = new Set(CATALOG_ROWS.map(r => r.split('|')[1]));
  const missing = [];
  ROUTINE_TEMPLATES.forEach(t => t.routines.forEach(r => r.exercises.forEach(([n]) => { if(!names.has(n)) missing.push(`${t.title}: ${n}`); })));
  return missing;
}
