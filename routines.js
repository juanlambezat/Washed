// Rutinas: plantillas prearmadas y compartir / importar rutinas por link o código.

// ================= Plantillas =================
function templateToRoutines(tpl){
  const stamp = Date.now();
  return tpl.routines.map((r, i) => ({
    id: `${stamp}${i}`, title: r.title, days: [],
    exercises: r.exercises.map(([name, sets, reps, rest]) => ({
      name, note: '', superset: false, collapsed: false, restSeconds: rest,
      sets: Array.from({ length: sets }, () => ({ type: 'N', weight: '', reps }))
    }))
  }));
}

function openTemplatesSheet(){
  const overlay = document.createElement('div'); overlay.className = 'picker-overlay';
  let openId = null;
  const close = ()=>{ unregisterOverlay(); if(document.body.contains(overlay)) document.body.removeChild(overlay); };
  const unregisterOverlay = registerOverlay(close);
  const draw = ()=>{
    overlay.innerHTML = `<div class="picker-sheet"><h3>Plantillas de rutinas</h3>
      <div class="setting-hint" style="margin-bottom:10px;">Elegí una y se agrega a tus rutinas. Después podés editarla como quieras: los pesos se sugieren solos desde tu historial.</div>
      <div class="picker-list template-list">${ROUTINE_TEMPLATES.map(t => {
        const isOpen = openId === t.id, exCount = t.routines.reduce((n, r) => n + r.exercises.length, 0);
        return `<div class="template-card ${isOpen ? 'open' : ''}" data-tpl="${t.id}">
          <div class="template-head"><div><div class="template-title">${escapeHtml(t.title)}</div><div class="template-meta">${escapeHtml(t.level)} · ${escapeHtml(t.perWeek)} · ${t.routines.length} rutina${t.routines.length === 1 ? '' : 's'} · ${exCount} ejercicios</div></div><span class="template-chevron">${isOpen ? '▲' : '▼'}</span></div>
          <div class="template-desc">${escapeHtml(t.desc)}</div>
          ${isOpen ? `<div class="template-body">${t.routines.map(r => `<div class="template-routine"><strong>${escapeHtml(r.title)}</strong><span>${r.exercises.map(([n, s, rp]) => `${escapeHtml(n)} <em>${s}×${rp}${getExerciseMode(n) === 'time' ? 's' : ''}</em>`).join(' · ')}</span></div>`).join('')}
            <button class="btn-primary" data-add-tpl="${t.id}" style="margin-top:10px;">Agregar ${t.routines.length} rutina${t.routines.length === 1 ? '' : 's'} a mis rutinas</button></div>` : ''}
        </div>`;
      }).join('')}</div>
      <button class="btn-ghost" id="closeTplBtn" style="margin-top:12px;">Cerrar</button></div>`;
    overlay.querySelector('#closeTplBtn').addEventListener('click', close);
    overlay.querySelectorAll('.template-head').forEach(h => h.addEventListener('click', ()=>{ const id = h.parentElement.dataset.tpl; openId = openId === id ? null : id; draw(); }));
    overlay.querySelectorAll('[data-add-tpl]').forEach(b => b.addEventListener('click', ()=>{
      const tpl = ROUTINE_TEMPLATES.find(t => t.id === b.dataset.addTpl);
      const added = templateToRoutines(tpl);
      routines.push(...added); saveRoutines(); close(); render();
      showToast(`Se agregaron ${added.length} rutina${added.length === 1 ? '' : 's'} ✓`);
    }));
  };
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) close(); });
  document.body.appendChild(overlay); draw();
}

// ================= Compartir rutinas =================
const SHARE_PREFIX = 'WASHED-R1:';

function toBase64Url(str){
  const bytes = new TextEncoder().encode(str); let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64Url(s){
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4);
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, ch => ch.charCodeAt(0)));
}

function encodeRoutineShare(routine){
  const custom = {};
  const exs = routine.exercises.map(normalizeRoutineExercise).map(e => {
    if(!getCatalogEntry(e.name)){ const m = getExerciseMeta(e.name); custom[e.name] = [m.cat, m.key, m.eq, m.mode]; }
    return [e.name, e.restSeconds ?? 90, e.superset ? 1 : 0, e.note || '', e.sets.map(s => [s.type, s.weight === '' ? null : s.weight, s.reps === '' ? null : s.reps])];
  });
  return toBase64Url(JSON.stringify({ v: 1, t: routine.title, e: exs, c: custom }));
}

// Lee un link o código compartido y devuelve la rutina ya validada y limpia, o null si no es válido.
// Todo lo que viene de afuera se sanea: tipos, largos y rangos.
function decodeRoutineShare(text){
  let code = String(text || '').trim();
  const fromLink = code.match(/[#&?]rutina=([A-Za-z0-9_-]+)/);
  if(fromLink) code = fromLink[1];
  code = code.replace(SHARE_PREFIX, '').trim();
  if(!/^[A-Za-z0-9_-]{8,20000}$/.test(code)) return null;
  let data;
  try{ data = JSON.parse(fromBase64Url(code)); } catch(e){ return null; }
  if(!data || data.v !== 1 || !Array.isArray(data.e) || data.e.length === 0 || data.e.length > 40) return null;

  const num = (v, min, max)=> (v == null || v === '' || isNaN(v)) ? '' : Math.min(max, Math.max(min, Number(v)));
  const clean = (v, max)=> String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  const customIn = (data.c && typeof data.c === 'object') ? data.c : {};
  const customMeta = {};
  const exerciseList = [];
  for(const item of data.e){
    if(!Array.isArray(item)) return null;
    const name = clean(item[0], 80);
    if(!name) return null;
    const sets = (Array.isArray(item[4]) ? item[4] : []).slice(0, 15).map(s => Array.isArray(s) ? {
      type: ['N', 'W', 'F', 'D'].includes(s[0]) ? s[0] : 'N', weight: num(s[1], 0, 999), reps: num(s[2], 0, 3600)
    } : { type: 'N', weight: '', reps: '' });
    exerciseList.push({ name, note: clean(item[3], 200), superset: item[2] === 1, collapsed: false, restSeconds: num(item[1], 0, 1800) === '' ? 90 : num(item[1], 0, 1800), sets: sets.length ? sets : [{ type: 'N', weight: '', reps: '' }] });
    if(!getCatalogEntry(name) && Array.isArray(customIn[name])){
      const [cat, key, eq, mode] = customIn[name];
      const validCat = EXERCISE_CATEGORIES.includes(cat) ? cat : 'Core';
      const validKey = (MUSCLE_ZONES[validCat] || []).some(([k]) => k === key) ? key : MUSCLE_ZONES[validCat][0][0];
      customMeta[name] = { cat: validCat, key: validKey, eq: EXERCISE_EQUIPMENT.includes(eq) ? eq : 'Otro', mode: EXERCISE_MODES[mode] ? mode : 'weight' };
    }
  }
  return { title: clean(data.t, 60) || 'Rutina importada', exercises: exerciseList, customMeta };
}

async function shareRoutine(routineId){
  const routine = routines.find(r => r.id === routineId);
  if(!routine) return;
  const code = encodeRoutineShare(routine);
  const isWeb = /^https?:$/.test(location.protocol);
  const link = `${location.origin}${location.pathname}#rutina=${code}`;
  const shareText = isWeb ? link : `${SHARE_PREFIX}${code}`;
  if(navigator.share){
    try{
      await navigator.share(isWeb
        ? { title: `Rutina "${routine.title}"`, text: `Te paso mi rutina "${routine.title}". Abrí el link en Washed para importarla:`, url: link }
        : { title: `Rutina "${routine.title}"`, text: shareText });
      return;
    } catch(e){ if(e && e.name === 'AbortError') return; }
  }
  try{ await navigator.clipboard.writeText(shareText); showToast(isWeb ? 'Link de la rutina copiado ✓' : 'Código de la rutina copiado ✓'); }
  catch(e){ await uiPrompt('Copiá este texto y pasáselo a quien quieras compartirle la rutina.', shareText, { title: 'Compartir rutina', confirmText: 'Listo', cancelText: 'Cerrar', inputMode: 'text' }); }
}

async function importSharedRoutine(parsed){
  const lines = parsed.exercises.slice(0, 8).map(e => `• ${e.name} (${e.sets.length} serie${e.sets.length === 1 ? '' : 's'})`);
  if(parsed.exercises.length > 8) lines.push(`• y ${parsed.exercises.length - 8} más`);
  const ok = await uiConfirm(`Rutina "${parsed.title}" con ${parsed.exercises.length} ejercicios:\n\n${lines.join('\n')}\n\n¿Agregarla a tus rutinas?`, { title: 'Importar rutina', confirmText: 'Agregar' });
  if(!ok) return false;
  Object.entries(parsed.customMeta).forEach(([name, meta]) => { if(!exercises.includes(name)){ exercises.push(name); exerciseMeta[name] = meta; } });
  parsed.exercises.forEach(e => { if(!getCatalogEntry(e.name) && !exercises.includes(e.name)) exercises.push(e.name); });
  let title = parsed.title;
  if(routines.some(r => r.title === title)) title += ' (importada)';
  routines.push({ id: Date.now().toString(), title, days: [], exercises: parsed.exercises });
  saveExercises(); saveExerciseMeta(); saveRoutines();
  render(); showToast('Rutina agregada ✓');
  return true;
}

async function openImportRoutine(){
  const raw = await uiPrompt('Pegá el link o el código de la rutina que te pasaron.', '', {
    title: 'Importar rutina', confirmText: 'Continuar', inputMode: 'text',
    validate: (v)=> decodeRoutineShare(v) ? null : 'No reconozco ese link o código. Copialo completo.'
  });
  if(raw === null) return;
  const parsed = decodeRoutineShare(raw);
  if(parsed) await importSharedRoutine(parsed);
}

// Si la app se abre con un link de rutina compartida (#rutina=...), ofrece importarla.
async function checkRoutineLinkOnLoad(){
  const m = location.hash.match(/rutina=([A-Za-z0-9_-]+)/);
  if(!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  const parsed = decodeRoutineShare(m[1]);
  if(!parsed){ uiAlert('El link de la rutina no es válido o está incompleto.', 'No se pudo importar'); return; }
  currentTab = 'routines'; render();
  await importSharedRoutine(parsed);
}
