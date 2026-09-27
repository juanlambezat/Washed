// Funciones de apoyo de Washed: sonidos, pantalla encendida, aviso de entreno olvidado, datos y ajustes,
// ejercicios propios, selector de ejercicios, cronómetro, plantillas y compartir rutinas.
// Se carga antes que app.js: solo define funciones y datos; usa el estado de app.js recién cuando se las llama.

// ================= Registro de ventanas abiertas =================
// Todo diálogo/selector/hoja propio se anota acá al abrirse y se saca al cerrarse. Sirve para poder
// cerrarlos todos de golpe: así un toque en la barra de navegación SIEMPRE cambia de pestaña en el acto,
// nunca se lo come una ventana que haya quedado abierta (antes hacía falta un segundo toque para eso).
const openOverlays = [];
function registerOverlay(closeFn){ const entry = { close: closeFn }; openOverlays.push(entry); return () => { const i = openOverlays.indexOf(entry); if(i >= 0) openOverlays.splice(i, 1); }; }
function closeAllOverlays(){ while(openOverlays.length){ const entry = openOverlays.pop(); try{ entry.close(); } catch(e){} } }

// ================= Utilidades =================
let toastTimer = null;
function showToast(message, ms = 2600){
  let el = document.getElementById('appToast');
  if(!el){ el = document.createElement('div'); el.id = 'appToast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = message; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=> el.classList.remove('show'), ms);
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
}

function todayStamp(){ return new Date().toISOString().slice(0, 10); }

function daysSince(iso){ return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); }

// ================= Sonidos de aviso =================
const SOUND_PATTERNS = {
  beep: { label: 'Beep', tones: [{ t: 0, d: 0.3, f: 880 }] },
  double: { label: 'Doble', tones: [{ t: 0, d: 0.16, f: 880 }, { t: 0.24, d: 0.16, f: 880 }] },
  triple: { label: 'Triple', tones: [{ t: 0, d: 0.14, f: 988 }, { t: 0.22, d: 0.14, f: 988 }, { t: 0.44, d: 0.14, f: 988 }] },
  bell: { label: 'Campana', tones: [{ t: 0, d: 1.1, f: 1174, decay: true }, { t: 0, d: 1.1, f: 2349, decay: true, amp: 0.35 }] },
  rise: { label: 'Ascendente', tones: [{ t: 0, d: 0.16, f: 660 }, { t: 0.18, d: 0.16, f: 880 }, { t: 0.36, d: 0.3, f: 1175 }] },
  off: { label: 'Silencio', tones: [] }
};
const ALERT_VOLUMES = [0.06, 0.14, 0.32];
const ALERT_VOLUME_LABELS = ['Bajo', 'Medio', 'Alto'];

function alertVolume(idx){ return ALERT_VOLUMES[idx] ?? ALERT_VOLUMES[1]; }

// Reproduce el sonido elegido con Web Audio (para cuando la app está abierta).
function playAlarmSound(soundId = alertPrefs.sound, volumeIdx = alertPrefs.volume){
  const pattern = SOUND_PATTERNS[soundId];
  if(!pattern || !pattern.tones.length) return;
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain(); master.gain.value = alertVolume(volumeIdx); master.connect(ctx.destination);
    pattern.tones.forEach(tone => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = tone.f;
      const start = ctx.currentTime + tone.t, amp = tone.amp ?? 1;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(amp, start + 0.01);
      if(tone.decay) gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.d);
      else { gain.gain.setValueAtTime(amp, start + Math.max(tone.d - 0.03, 0.02)); gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.d); }
      osc.connect(gain); gain.connect(master); osc.start(start); osc.stop(start + tone.d + 0.02);
    });
    const total = Math.max(...pattern.tones.map(t => t.t + t.d));
    setTimeout(()=> { try{ ctx.close(); } catch(e){} }, (total + 0.5) * 1000);
  } catch(e){}
}

// Genera un WAV con el mismo sonido, para reproducirlo desde la sesión de audio de la pantalla de bloqueo.
function makeAlarmWavUrl(soundId = alertPrefs.sound, volumeIdx = alertPrefs.volume){
  const pattern = SOUND_PATTERNS[soundId];
  if(!pattern || !pattern.tones.length) return null;
  const rate = 8000, total = Math.max(...pattern.tones.map(t => t.t + t.d)) + 0.05, n = Math.floor(rate * total);
  const samples = new Float32Array(n), vol = alertVolume(volumeIdx);
  pattern.tones.forEach(tone => {
    const start = Math.floor(tone.t * rate), len = Math.floor(tone.d * rate), amp = (tone.amp ?? 1) * vol;
    for(let i = 0; i < len && start + i < n; i++){
      const env = tone.decay ? Math.exp(-4 * i / len) : Math.min(1, i / 80, (len - i) / 200);
      samples[start + i] += Math.sin(2 * Math.PI * tone.f * i / rate) * amp * Math.max(env, 0);
    }
  });
  const buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const str = (o, s)=>{ for(let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
  for(let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 32767, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

// ================= Pantalla encendida durante el entreno =================
let wakeLockSentinel = null;
async function updateWakeLock(){
  if(!('wakeLock' in navigator)) return;
  const wanted = keepAwake && !!active && !document.hidden;
  try{
    if(wanted && !wakeLockSentinel){
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', ()=>{ wakeLockSentinel = null; });
    } else if(!wanted && wakeLockSentinel){
      const s = wakeLockSentinel; wakeLockSentinel = null; await s.release();
    }
  } catch(e){ wakeLockSentinel = null; }
}

// ================= Entreno olvidado abierto =================
let staleCheckRunning = false;
async function checkStaleWorkout(){
  if(!active || staleCheckRunning || active.staleDismissedAt) return;
  const elapsed = Math.floor((Date.now() - active.startTime) / 1000);
  if(elapsed < STALE_WORKOUT_SECONDS) return;
  staleCheckRunning = true;
  const finishNow = await uiConfirm(
    `Este entrenamiento lleva abierto ${formatDuration(elapsed)}. Si te olvidaste de cerrarlo, podés terminarlo ahora e indicar cuánto duró de verdad.`,
    { title: '¿Te olvidaste de cerrar el entreno?', confirmText: 'Terminar y ajustar', cancelText: 'Sigue en curso' }
  );
  staleCheckRunning = false;
  if(!active) return;
  if(!finishNow){ active.staleDismissedAt = Date.now(); saveActive(); return; }
  currentTab = 'train'; render(); finishWorkout();
}

// ================= Almacenamiento y backup =================
async function getStorageStatus(){
  const out = { supported: !!navigator.storage, persisted: null, usage: null };
  try{
    if(navigator.storage && navigator.storage.persisted) out.persisted = await navigator.storage.persisted();
    if(navigator.storage && navigator.storage.estimate){ const e = await navigator.storage.estimate(); out.usage = e.usage; }
  } catch(e){}
  return out;
}
async function requestPersistentStorage(){
  try{ if(navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); } catch(e){}
  return false;
}
let persistAsked = false;
function maybeRequestPersist(){ if(persistAsked) return; persistAsked = true; requestPersistentStorage(); }

function formatBytes(n){
  if(n == null) return '-';
  if(n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function buildBackupPayload(){
  return {
    version: 2, exportedAt: new Date().toISOString(),
    exercises, exerciseMeta, favoriteExercises, workouts, routines, bodyWeightLog, goals, badges,
    theme: currentTheme, themeMode, weightUnit, alertPrefs, keepAwake, lockScreenTimer
  };
}

function exportBackup(){
  downloadBlob(new Blob([JSON.stringify(buildBackupPayload(), null, 2)], { type: 'application/json' }), `washed-backup-${todayStamp()}.json`);
  lastBackupAt = new Date().toISOString(); backupSnoozeUntil = 0; saveBackupMeta();
}

// Exporta el historial a CSV (separador ";" y BOM para que Excel en español lo abra bien). Los pesos van siempre en kg.
function exportCSV(){
  const cell = (v)=> { const s = String(v ?? ''); return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const rows = [['fecha', 'hora', 'entrenamiento', 'duracion_min', 'ejercicio', 'categoria', 'modo', 'serie', 'tipo_serie', 'peso_kg', 'reps_o_seg', 'volumen_kg', 'nota_ejercicio', 'nota_entrenamiento']];
  const typeLabel = { N: 'normal', W: 'calentamiento', F: 'fallo', D: 'descanso' };
  workouts.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(w => {
    const d = new Date(w.date);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    w.exercises.forEach(ex => ex.sets.forEach((s, i) => {
      rows.push([date, time, w.name, Math.round((w.duration || 0) / 60), ex.name, getExerciseCategory(ex.name), getExerciseMode(ex.name), i + 1, typeLabel[s.type] || 'normal',
        s.weight === '' || s.weight == null ? 0 : s.weight, s.reps, Math.round(getSetVolume(s, ex.name, w.date) * 100) / 100, ex.note || '', w.globalNote || '']);
    }));
  });
  const csv = '﻿' + rows.map(r => r.map(cell).join(';')).join('\r\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `washed-entrenamientos-${todayStamp()}.csv`);
  return rows.length - 1;
}

function handleImportFile(e){
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = async ()=>{
    try{
      const data = JSON.parse(reader.result);
      if(!data || !Array.isArray(data.workouts)) throw new Error('Formato inválido');
      if(!(await uiConfirm('Importar reemplazará TODOS tus datos actuales (entrenamientos, rutinas, récords) por los del archivo. ¿Continuar?', { title: 'Importar datos', confirmText: 'Importar', danger: true }))){ e.target.value = ''; return; }
      exercises = data.exercises || EXERCISE_CATALOG.map(x => x.name);
      exerciseMeta = data.exerciseMeta || {};
      favoriteExercises = data.favoriteExercises || [];
      workouts = data.workouts || [];
      routines = data.routines || [];
      bodyWeightLog = data.bodyWeightLog || [];
      goals = data.goals || [];
      badges = data.badges || null;
      if(data.theme){ currentTheme = data.theme; document.body.setAttribute('data-theme', currentTheme); }
      if(data.themeMode){ themeMode = data.themeMode; document.body.setAttribute('data-mode', themeMode); }
      if(data.weightUnit) weightUnit = data.weightUnit;
      if(data.alertPrefs) alertPrefs = { ...alertPrefs, ...data.alertPrefs };
      if(typeof data.keepAwake === 'boolean') keepAwake = data.keepAwake;
      if(typeof data.lockScreenTimer === 'boolean') lockScreenTimer = data.lockScreenTimer;
      await Promise.all([saveExercises(), saveExerciseMeta(), saveFavorites(), saveWorkouts(), saveRoutines(), saveBodyWeight(), saveGoals(), saveBadges(), saveTheme(), saveThemeMode(), saveWeightUnit(), saveAlertPrefs(), saveKeepAwake(), saveLockScreenTimer()]);
      render();
      uiAlert('Datos importados con éxito.');
    } catch(err){ uiAlert('El archivo no tiene un formato válido.', 'No se pudo importar'); }
    e.target.value = '';
  };
  reader.readAsText(file);
}

// Recordatorio de backup en la pantalla de inicio: si hay historial y hace 30 días o más que no exportás.
function shouldRemindBackup(){
  if(workouts.length < 3 || Date.now() < backupSnoozeUntil) return false;
  if(lastBackupAt) return daysSince(lastBackupAt) >= 30;
  const oldest = workouts.reduce((min, w) => Math.min(min, new Date(w.date).getTime()), Infinity);
  return (Date.now() - oldest) / 86400000 >= 7;
}

function renderBackupReminder(){
  if(!shouldRemindBackup()) return '';
  const text = lastBackupAt
    ? `Hace ${daysSince(lastBackupAt)} días que no hacés un backup de tus ${workouts.length} entrenamientos.`
    : `Todavía no hiciste ningún backup de tus ${workouts.length} entrenamientos.`;
  return `<div class="backup-banner"><div class="backup-text"><strong>💾 Cuidá tu historial</strong><span>${text} Los datos viven solo en este dispositivo.</span></div><div class="backup-actions"><button class="btn-primary" id="backupNowBtn">Exportar ahora</button><button class="btn-ghost" id="backupLaterBtn">Más tarde</button></div></div>`;
}

function bindBackupReminder(){
  const now = document.getElementById('backupNowBtn'), later = document.getElementById('backupLaterBtn');
  if(now) now.addEventListener('click', ()=>{ exportBackup(); showToast('Backup exportado ✓'); render(); });
  if(later) later.addEventListener('click', ()=>{ backupSnoozeUntil = Date.now() + 7 * 86400000; saveBackupMeta(); render(); });
}

// ================= Ajustes =================
async function renderSettingsSection(container){
  const notifSupported = 'Notification' in window;
  const notifPerm = notifSupported ? Notification.permission : null;
  const notifControl = notifPerm === 'granted' ? `<span class="setting-status">Activado ✓</span>`
    : notifPerm === 'denied' ? `<span class="setting-status">Bloqueado en el navegador</span>`
    : `<button class="btn-ghost" id="enableNotifBtn" style="padding:8px 14px;">Activar</button>`;
  const yesNo = (attr, value)=> `<div class="cal-mode-switch setting-switch"><button class="cal-mode-btn ${value ? 'active' : ''}" data-${attr}="on">Sí</button><button class="cal-mode-btn ${!value ? 'active' : ''}" data-${attr}="off">No</button></div>`;
  const customCount = exercises.filter(n => !getCatalogEntry(n)).length;

  container.innerHTML = `
    <div class="dash-top-panel">
      <div class="settings-title">Preferencias</div>
      <div class="setting-row"><span>Unidad de peso</span>
        <div class="cal-mode-switch setting-switch"><button class="cal-mode-btn ${weightUnit==='kg'?'active':''}" data-set-unit="kg">KG</button><button class="cal-mode-btn ${weightUnit==='lb'?'active':''}" data-set-unit="lb">LB</button></div></div>
      <div class="setting-row"><span>Apariencia</span>
        <div class="cal-mode-switch setting-switch"><button class="cal-mode-btn ${themeMode==='dark'?'active':''}" data-set-mode="dark">Oscuro</button><button class="cal-mode-btn ${themeMode==='light'?'active':''}" data-set-mode="light">Claro</button></div></div>
    </div>

    <div class="dash-top-panel" style="margin-top:14px;">
      <div class="settings-title">Durante el entreno</div>
      <div class="setting-row"><span>Mantener la pantalla encendida</span>${yesNo('set-awake', keepAwake)}</div>
      <div class="setting-row"><span>Timer en pantalla de bloqueo</span>${yesNo('set-lock', lockScreenTimer)}</div>
      <div class="setting-hint">Muestra el descanso en el bloqueo con -15 / +15 / omitir. Mientras dura, pausa la música de otras apps.</div>
      ${notifSupported ? `<div class="setting-row"><span>Aviso al terminar el descanso</span>${notifControl}</div>` : ''}
      <div class="setting-block-title">Sonido al terminar el descanso</div>
      <div class="categories-filter" style="margin-bottom:10px;">${Object.entries(SOUND_PATTERNS).map(([id, p]) => `<div class="cat-pill ${alertPrefs.sound===id?'active':''}" data-set-sound="${id}">${p.label}</div>`).join('')}</div>
      <div class="setting-row"><span>Volumen</span>
        <div class="cal-mode-switch setting-switch" style="width:190px;">${ALERT_VOLUME_LABELS.map((l, i) => `<button class="cal-mode-btn ${alertPrefs.volume===i?'active':''}" data-set-volume="${i}">${l}</button>`).join('')}</div></div>
      <div class="setting-row"><span>Vibración</span>${yesNo('set-vibrate', alertPrefs.vibrate)}</div>
      <button class="btn-ghost" id="testSoundBtn" style="width:100%; margin-top:2px;">🔊 Probar sonido</button>
    </div>

    <div class="dash-top-panel" style="margin-top:14px;">
      <div class="settings-title">Mis ejercicios</div>
      <div class="setting-hint" style="margin-bottom:10px;">Ejercicios que creaste vos: ${customCount === 0 ? 'todavía no tenés ninguno' : `${customCount} en total`}. Podés editarlos o borrarlos.</div>
      <button class="btn-ghost" id="manageExercisesBtn" style="width:100%;">🛠️ Gestionar ejercicios propios</button>
    </div>

    <div class="dash-top-panel" style="margin-top:14px;">
      <div class="settings-title">Datos y respaldo</div>
      <div class="setting-row"><span>Último backup</span><span class="setting-status" id="lastBackupLabel">${lastBackupAt ? `${fmtDate(lastBackupAt)} (hace ${daysSince(lastBackupAt)} d)` : 'Nunca'}</span></div>
      <div class="setting-row"><span>Almacenamiento protegido</span><span class="setting-status" id="storageStatus">Consultando…</span></div>
      <div class="setting-hint" id="storageHint" style="margin-bottom:10px;"></div>
      <div style="display:flex; gap:8px; margin-bottom:8px;">
        <button class="btn-ghost" id="exportDataBtn" style="flex:1;">⬇️ Exportar datos</button>
        <button class="btn-ghost" id="importDataBtn" style="flex:1;">⬆️ Importar datos</button>
      </div>
      <button class="btn-ghost" id="exportCsvBtn" style="width:100%;">📊 Exportar historial a CSV</button>
      <input type="file" id="importDataFile" accept="application/json" style="display:none;">
    </div>`;

  container.querySelectorAll('[data-set-unit]').forEach(b=> b.addEventListener('click', ()=>{ if(weightUnit === b.dataset.setUnit) return; weightUnit = b.dataset.setUnit; saveWeightUnit(); render(); }));
  container.querySelectorAll('[data-set-mode]').forEach(b=> b.addEventListener('click', ()=>{ if(themeMode === b.dataset.setMode) return; themeMode = b.dataset.setMode; document.body.setAttribute('data-mode', themeMode); saveThemeMode(); render(); }));
  container.querySelectorAll('[data-set-awake]').forEach(b=> b.addEventListener('click', ()=>{ const on = b.dataset.setAwake === 'on'; if(keepAwake === on) return; keepAwake = on; saveKeepAwake(); updateWakeLock(); render(); }));
  container.querySelectorAll('[data-set-lock]').forEach(b=> b.addEventListener('click', ()=>{
    const on = b.dataset.setLock === 'on';
    if(lockScreenTimer === on) return;
    lockScreenTimer = on; saveLockScreenTimer();
    if(!on) restLockScreen.stop();
    render();
  }));
  container.querySelectorAll('[data-set-sound]').forEach(b=> b.addEventListener('click', ()=>{ alertPrefs.sound = b.dataset.setSound; saveAlertPrefs(); playAlarmSound(); render(); }));
  container.querySelectorAll('[data-set-volume]').forEach(b=> b.addEventListener('click', ()=>{ alertPrefs.volume = parseInt(b.dataset.setVolume, 10); saveAlertPrefs(); playAlarmSound(); render(); }));
  container.querySelectorAll('[data-set-vibrate]').forEach(b=> b.addEventListener('click', ()=>{ alertPrefs.vibrate = b.dataset.setVibrate === 'on'; saveAlertPrefs(); if(alertPrefs.vibrate && navigator.vibrate) navigator.vibrate(120); render(); }));
  document.getElementById('testSoundBtn').addEventListener('click', ()=>{ playAlarmSound(); if(alertPrefs.vibrate && navigator.vibrate) navigator.vibrate([200, 100, 200]); });
  const notifBtn = document.getElementById('enableNotifBtn');
  if(notifBtn) notifBtn.addEventListener('click', async ()=>{ try{ await Notification.requestPermission(); } catch(e){} render(); });
  document.getElementById('manageExercisesBtn').addEventListener('click', ()=> openManageExercises());
  document.getElementById('exportDataBtn').addEventListener('click', ()=>{ exportBackup(); showToast('Backup exportado ✓'); const l = document.getElementById('lastBackupLabel'); if(l) l.textContent = 'Hoy'; });
  document.getElementById('exportCsvBtn').addEventListener('click', ()=>{ if(!workouts.length){ uiAlert('Todavía no tenés entrenamientos para exportar.'); return; } const n = exportCSV(); showToast(`Se exportaron ${n} series ✓`); });
  document.getElementById('importDataBtn').addEventListener('click', ()=> document.getElementById('importDataFile').click());
  document.getElementById('importDataFile').addEventListener('change', handleImportFile);

  const status = await getStorageStatus();
  const statusEl = document.getElementById('storageStatus'), hintEl = document.getElementById('storageHint');
  if(!statusEl) return;
  if(!status.supported){ statusEl.textContent = 'No disponible'; hintEl.textContent = 'Este navegador no permite pedir protección de datos. Hacé backups seguido.'; return; }
  statusEl.innerHTML = status.persisted ? 'Sí ✓' : `No <button class="btn-ghost" id="persistBtn" style="padding:4px 10px; margin-left:6px;">Solicitar</button>`;
  hintEl.textContent = `${status.persisted ? 'El navegador no va a borrar tus datos si falta espacio.' : 'Sin esta protección, el navegador podría borrar tus datos si falta espacio.'} Usando ${formatBytes(status.usage)}.`;
  const persistBtn = document.getElementById('persistBtn');
  if(persistBtn) persistBtn.addEventListener('click', async ()=>{
    const ok = await requestPersistentStorage();
    showToast(ok ? 'Almacenamiento protegido ✓' : 'El navegador no lo concedió. Probá instalando la app o hacé backups.');
    if(document.getElementById('storageStatus')) renderProgress();
  });
}
