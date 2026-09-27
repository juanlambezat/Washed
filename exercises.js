// Ejercicios: formulario genérico, selector con favoritos y recientes, ejercicios propios y cronómetro.

// ================= Formulario genérico =================
// fields: [{ key, label, type: 'text' | 'select', value, placeholder, options }]; en un select, options puede ser una función
// (valores actuales) => [[valor, texto], ...] para listas que dependen de otro campo. Devuelve un objeto con los valores, o null.
function uiForm({ title, message = '', fields, confirmText = 'Guardar', cancelText = 'Cancelar', validate }){
  return new Promise(resolve => {
    const previousFocus = document.activeElement;
    const overlay = document.createElement('div'); overlay.className = 'dialog-overlay';
    const card = document.createElement('div'); card.className = 'dialog-card dialog-card-wide';
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true');
    card.innerHTML = `<h3>${escapeHtml(title)}</h3>${message ? `<p class="dialog-message">${escapeHtml(message)}</p>` : ''}
      <div class="form-fields"></div><div class="dialog-error" role="alert"></div>
      <div class="dialog-actions"><button type="button" class="btn-ghost" data-dialog-cancel>${escapeHtml(cancelText)}</button><button type="button" class="btn-primary" data-dialog-ok>${escapeHtml(confirmText)}</button></div>`;
    overlay.appendChild(card); document.body.appendChild(overlay);

    const fieldsEl = card.querySelector('.form-fields'), errorEl = card.querySelector('.dialog-error'), controls = {};
    fields.forEach(f => {
      const wrap = document.createElement('label'); wrap.className = 'dialog-field';
      wrap.innerHTML = `<span>${escapeHtml(f.label)}</span>`;
      const control = document.createElement(f.type === 'select' ? 'select' : 'input');
      if(f.type !== 'select'){ control.type = 'text'; control.autocomplete = 'off'; if(f.placeholder) control.placeholder = f.placeholder; control.value = f.value ?? ''; }
      control.className = f.type === 'select' ? 'dialog-select' : 'dialog-input';
      controls[f.key] = control; wrap.appendChild(control); fieldsEl.appendChild(wrap);
    });
    const currentValues = ()=> { const v = {}; fields.forEach(f => { v[f.key] = controls[f.key].value; }); return v; };
    const refreshOptions = ()=>{
      fields.forEach(f => {
        if(f.type !== 'select') return;
        const sel = controls[f.key], previous = sel.value || f.value;
        const opts = typeof f.options === 'function' ? f.options(currentValues()) : f.options;
        sel.innerHTML = opts.map(([v, l]) => `<option value="${escapeHtml(v)}">${escapeHtml(l)}</option>`).join('');
        sel.value = opts.some(([v]) => v === previous) ? previous : (opts[0] ? opts[0][0] : '');
      });
    };
    refreshOptions();
    fields.forEach(f => { if(f.type === 'select') controls[f.key].addEventListener('change', refreshOptions); });

    let unregisterOverlay = () => {};
    const finish = (result)=>{
      document.removeEventListener('keydown', onKey, true);
      unregisterOverlay();
      if(document.body.contains(overlay)) document.body.removeChild(overlay);
      if(previousFocus && typeof previousFocus.focus === 'function' && document.body.contains(previousFocus)) previousFocus.focus();
      resolve(result);
    };
    unregisterOverlay = registerOverlay(() => finish(null));
    const accept = ()=>{
      const vals = currentValues();
      const err = validate ? validate(vals) : null;
      if(err){ errorEl.textContent = err; return; }
      finish(vals);
    };
    const onKey = (e)=>{
      const overlays = document.querySelectorAll('.dialog-overlay');
      if(overlays[overlays.length - 1] !== overlay) return;
      if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); finish(null); }
      else if(e.key === 'Enter' && e.target.tagName === 'INPUT'){ e.preventDefault(); accept(); }
      else if(e.key === 'Tab'){
        const focusables = Array.from(card.querySelectorAll('input, select, button')), first = focusables[0], last = focusables[focusables.length - 1];
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    card.querySelector('[data-dialog-ok]').addEventListener('click', accept);
    card.querySelector('[data-dialog-cancel]').addEventListener('click', ()=> finish(null));
    overlay.addEventListener('mousedown', (e)=>{ if(e.target === overlay) finish(null); });
    const firstControl = controls[fields[0].key]; firstControl.focus(); if(firstControl.select) firstControl.select();
  });
}

// ================= Datos de un ejercicio =================
function getExerciseEquipment(name){
  const c = getCatalogEntry(name);
  if(c) return c.eq;
  return (exerciseMeta[name] && exerciseMeta[name].eq) || '';
}

function getExerciseSecondary(name){
  const c = getCatalogEntry(name);
  const key = c ? c.key : getExerciseIconKey(name);
  return secondaryMuscles(name, key);
}

function isCustomExercise(name){ return !getCatalogEntry(name); }

function getCustomExerciseNames(){ return exercises.filter(isCustomExercise); }

function exerciseNameTaken(name, exceptName){
  const lower = name.toLowerCase();
  if(exceptName && exceptName.toLowerCase() === lower) return false;
  return !!getCatalogEntry(name) || exercises.some(n => n.toLowerCase() === lower);
}

// ================= Ejercicios propios =================
async function openExerciseForm(initial = {}){
  const cat0 = initial.cat || 'Pecho';
  const fields = [
    { key: 'name', label: 'Nombre', type: 'text', value: initial.name || '', placeholder: 'Ej: Remo con cable en V' },
    { key: 'cat', label: 'Categoría', type: 'select', options: EXERCISE_CATEGORIES.map(c => [c, c]), value: cat0 },
    { key: 'key', label: 'Músculo principal (para la figura)', type: 'select', options: (vals) => MUSCLE_ZONES[vals.cat] || [], value: initial.key || MUSCLE_ZONES[cat0][0][0] },
    { key: 'eq', label: 'Equipo', type: 'select', options: EXERCISE_EQUIPMENT.map(e => [e, e]), value: initial.eq || 'Otro' },
    { key: 'mode', label: 'Cómo se registra', type: 'select', options: Object.entries(EXERCISE_MODES).map(([id, m]) => [id, m.label]), value: initial.mode || 'weight' }
  ];
  return uiForm({
    title: initial.isEdit ? 'Editar ejercicio' : 'Nuevo ejercicio', fields, confirmText: initial.isEdit ? 'Guardar' : 'Crear ejercicio',
    validate: (vals)=>{
      const name = vals.name.trim();
      if(name.length < 2) return 'Escribí un nombre de al menos 2 letras.';
      if(name.length > 60) return 'El nombre puede tener hasta 60 caracteres.';
      if(exerciseNameTaken(name, initial.originalName)) return 'Ya existe un ejercicio con ese nombre.';
      return null;
    }
  });
}

async function createCustomExercise(suggestedName = ''){
  const vals = await openExerciseForm({ name: suggestedName, cat: suggestedName ? getExerciseCategory(suggestedName) : 'Pecho', key: suggestedName ? getExerciseIconKey(suggestedName) : undefined });
  if(!vals) return null;
  const name = vals.name.trim();
  exercises.push(name);
  exerciseMeta[name] = { cat: vals.cat, key: vals.key, eq: vals.eq, mode: vals.mode };
  saveExercises(); saveExerciseMeta();
  return name;
}

function renameExercise(oldName, newName){
  workouts.forEach(w => w.exercises.forEach(e => { if(e.name === oldName) e.name = newName; }));
  routines.forEach(r => { r.exercises = r.exercises.map(e => typeof e === 'string' ? (e === oldName ? newName : e) : (e.name === oldName ? { ...e, name: newName } : e)); });
  if(active) active.exercises.forEach(e => { if(e.name === oldName) e.name = newName; });
  exercises = exercises.map(n => n === oldName ? newName : n);
  favoriteExercises = favoriteExercises.map(n => n === oldName ? newName : n);
  if(exerciseMeta[oldName]){ exerciseMeta[newName] = exerciseMeta[oldName]; delete exerciseMeta[oldName]; }
  goals.forEach(g => { if(g.exercise === oldName) g.exercise = newName; });
  if(selectedProgressExercise === oldName) selectedProgressExercise = newName;
  saveWorkouts(); saveRoutines(); saveActive(); saveExercises(); saveFavorites(); saveExerciseMeta(); saveGoals();
}

async function editCustomExercise(name){
  const meta = exerciseMeta[name] || { cat: getExerciseCategory(name), key: getExerciseIconKey(name), eq: 'Otro', mode: 'weight' };
  const vals = await openExerciseForm({ name, cat: meta.cat, key: meta.key, eq: meta.eq, mode: meta.mode, isEdit: true, originalName: name });
  if(!vals) return false;
  const newName = vals.name.trim();
  if(newName !== name){
    if(!(await uiConfirm(`Se va a renombrar "${name}" a "${newName}" en tu historial, rutinas y objetivos. ¿Continuar?`, { title: 'Renombrar ejercicio', confirmText: 'Renombrar' }))) return false;
    renameExercise(name, newName);
  }
  exerciseMeta[newName] = { cat: vals.cat, key: vals.key, eq: vals.eq, mode: vals.mode };
  saveExerciseMeta();
  return true;
}

async function deleteCustomExercise(name){
  const inHistory = workouts.some(w => w.exercises.some(e => e.name === name));
  const ok = await uiConfirm(
    `"${name}" deja de aparecer en el selector de ejercicios.${inHistory ? ' Tu historial con este ejercicio no se toca.' : ''}`,
    { title: 'Borrar ejercicio propio', confirmText: 'Borrar', danger: true }
  );
  if(!ok) return false;
  exercises = exercises.filter(n => n !== name);
  favoriteExercises = favoriteExercises.filter(n => n !== name);
  delete exerciseMeta[name];
  saveExercises(); saveFavorites(); saveExerciseMeta();
  return true;
}

function openManageExercises(){
  const overlay = document.createElement('div'); overlay.className = 'picker-overlay';
  const close = ()=>{ unregisterOverlay(); if(document.body.contains(overlay)) document.body.removeChild(overlay); if(currentTab === 'progress') renderProgress(); };
  const unregisterOverlay = registerOverlay(close);
  const draw = ()=>{
    const list = getCustomExerciseNames();
    overlay.innerHTML = `<div class="picker-sheet"><h3>Mis ejercicios</h3>
      <button class="btn-primary" id="newCustomExBtn" style="margin-bottom:12px;">+ Crear ejercicio</button>
      <div class="picker-list">${list.length === 0 ? '<div class="picker-item" style="color:var(--text-dim); justify-content:center;">Todavía no creaste ejercicios propios</div>' : list.map(n => {
        const meta = getExerciseMeta(n);
        return `<div class="picker-item"><div class="picker-item-left"><div class="muscle-mini-icon" style="width:28px; height:28px;">${getExerciseMiniFigure(n)}</div><div class="picker-name"><span class="picker-title">${escapeHtml(n)}</span><span class="picker-sub">${escapeHtml(meta.cat)} · ${escapeHtml(EXERCISE_MODES[meta.mode].label)}</span></div></div>
          <div style="display:flex; gap:6px;"><button class="btn-icon" data-edit-custom="${escapeHtml(n)}" title="Editar" style="width:28px; height:28px; font-size:12px;">✏️</button><button class="btn-icon" data-del-custom="${escapeHtml(n)}" title="Borrar" style="width:28px; height:28px; font-size:12px;">🗑️</button></div></div>`;
      }).join('')}</div>
      <button class="btn-ghost" id="closeManageBtn" style="margin-top:12px;">Cerrar</button></div>`;
    overlay.querySelector('#newCustomExBtn').addEventListener('click', async ()=>{ if(await createCustomExercise()) draw(); });
    overlay.querySelector('#closeManageBtn').addEventListener('click', close);
    overlay.querySelectorAll('[data-edit-custom]').forEach(b => b.addEventListener('click', async ()=>{ if(await editCustomExercise(b.dataset.editCustom)) draw(); }));
    overlay.querySelectorAll('[data-del-custom]').forEach(b => b.addEventListener('click', async ()=>{ if(await deleteCustomExercise(b.dataset.delCustom)) draw(); }));
  };
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) close(); });
  document.body.appendChild(overlay); draw();
}

// ================= Selector de ejercicios =================
function getExerciseMeta(name){
  const c = getCatalogEntry(name);
  if(c) return c;
  const m = exerciseMeta[name] || {};
  return { name, cat: m.cat || getExerciseCategory(name), key: m.key || getExerciseIconKey(name), eq: m.eq || 'Otro', mode: m.mode || 'weight', custom: true };
}

function getRecentExercises(limit = 8){
  const seen = [];
  const push = (n)=>{ if(!seen.includes(n)) seen.push(n); };
  if(active) active.exercises.slice().reverse().forEach(e => push(e.name));
  for(const w of workouts){ w.exercises.forEach(e => push(e.name)); if(seen.length >= limit) break; }
  return seen.slice(0, limit);
}

// onPick(nombre) al elegir; onCancel() (opcional) si se cierra sin elegir nada.
function openExercisePicker(onPick, onCancel){
  let currentCat = 'Todos', currentEq = 'Todos';
  const overlay = document.createElement('div'); overlay.className = 'picker-overlay';
  overlay.innerHTML = `<div class="picker-sheet"><h3>Seleccionar ejercicio</h3><input type="text" id="pickerSearch" placeholder="Buscar o crear ejercicio..." autocomplete="off">
    <div class="categories-filter" id="catFilter">${['Todos', ...EXERCISE_CATEGORIES].map((c, i) => `<div class="cat-pill ${i === 0 ? 'active' : ''}" data-cat="${c}">${c}</div>`).join('')}</div>
    <div class="categories-filter" id="eqFilter">${['Todos', ...EXERCISE_EQUIPMENT].map((c, i) => `<div class="cat-pill cat-pill-small ${i === 0 ? 'active' : ''}" data-eq="${c}">${c === 'Todos' ? 'Todo equipo' : c}</div>`).join('')}</div>
    <div class="picker-list" id="pickerList"></div></div>`;
  document.body.appendChild(overlay);
  const listEl = overlay.querySelector('#pickerList'), searchEl = overlay.querySelector('#pickerSearch');

  const allExercises = ()=>{
    const custom = exercises.filter(isCustomExercise).map(n => getExerciseMeta(n));
    return EXERCISE_CATALOG.concat(custom);
  };

  const itemHtml = (item)=>{
    const sec = getExerciseSecondary(item.name);
    const fav = favoriteExercises.includes(item.name);
    const sub = [item.eq === 'Otro' && item.custom ? '' : item.eq, sec, item.mode !== 'weight' ? EXERCISE_MODES[item.mode].label.split(' (')[0] : ''].filter(Boolean).join(' · ');
    return `<div class="picker-item" data-name="${escapeHtml(item.name)}"><div class="picker-item-left"><div class="muscle-mini-icon" style="width:30px; height:30px;">${getExerciseMiniFigure(item.name)}</div>
      <div class="picker-name"><span class="picker-title">${escapeHtml(item.name)}${item.custom ? ' <em class="picker-own">propio</em>' : ''}</span>${sub ? `<span class="picker-sub">${escapeHtml(sub)}</span>` : ''}</div></div>
      <div style="display:flex; align-items:center; gap:6px;"><button class="btn-icon fav-btn ${fav ? 'is-fav' : ''}" data-fav="${escapeHtml(item.name)}" title="${fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}" style="width:26px; height:26px; font-size:13px;">${fav ? '★' : '☆'}</button>
      <button class="btn-icon" data-video-name="${escapeHtml(item.name)}" title="Ver video de ejecución" style="width:26px; height:26px; font-size:12px;">🎥</button></div></div>`;
  };

  function renderList(filter){
    const f = (filter || '').trim().toLowerCase();
    const all = allExercises();
    const matches = (item)=> (currentCat === 'Todos' || item.cat === currentCat) && (currentEq === 'Todos' || item.eq === currentEq) && item.name.toLowerCase().includes(f);
    let html = '';
    const showSections = !f && currentCat === 'Todos' && currentEq === 'Todos';
    if(showSections){
      const favs = favoriteExercises.map(n => all.find(i => i.name === n)).filter(Boolean);
      if(favs.length) html += `<div class="picker-section">⭐ Favoritos</div>${favs.map(itemHtml).join('')}`;
      const recents = getRecentExercises().map(n => all.find(i => i.name === n)).filter(Boolean).filter(i => !favoriteExercises.includes(i.name));
      if(recents.length) html += `<div class="picker-section">🕘 Recientes</div>${recents.map(itemHtml).join('')}`;
      html += `<div class="picker-section">Todos los ejercicios</div>`;
    }
    const matching = all.filter(matches);
    html += matching.map(itemHtml).join('');
    if(f && !all.some(i => i.name.toLowerCase() === f)) html += `<div class="picker-item" style="color:var(--accent-text);" data-newname="${escapeHtml(filter.trim())}"><div class="picker-item-left"><div class="muscle-mini-icon" style="width:30px; height:30px;">${getExerciseMiniFigure(getExerciseCategory(filter.trim()))}</div>+ Crear "${escapeHtml(filter.trim())}"</div><span>Nuevo</span></div>`;
    listEl.innerHTML = matching.length || (f && !all.some(i => i.name.toLowerCase() === f)) ? html : (html + '<div class="picker-item" style="color:var(--text-dim); justify-content:center;">Sin resultados</div>');
    listEl.querySelectorAll('[data-name]').forEach(el=> el.addEventListener('click', ()=> pick(el.dataset.name)));
    listEl.querySelectorAll('[data-newname]').forEach(el=> el.addEventListener('click', async ()=>{ const created = await createCustomExercise(el.dataset.newname.trim()); if(created) pick(created); }));
    listEl.querySelectorAll('[data-video-name]').forEach(el=> el.addEventListener('click', (e)=>{ e.stopPropagation(); openVideoModal(el.dataset.videoName); }));
    listEl.querySelectorAll('[data-fav]').forEach(el=> el.addEventListener('click', (e)=>{
      e.stopPropagation();
      const n = el.dataset.fav, i = favoriteExercises.indexOf(n);
      if(i >= 0) favoriteExercises.splice(i, 1); else favoriteExercises.unshift(n);
      saveFavorites(); renderList(searchEl.value);
    }));
  }
  function pick(name){ if(!name) return; unregisterOverlay(); if(document.body.contains(overlay)) document.body.removeChild(overlay); onPick(name); }
  const unregisterOverlay = registerOverlay(()=>{ if(document.body.contains(overlay)) document.body.removeChild(overlay); if(onCancel) onCancel(); });
  overlay.querySelectorAll('[data-cat]').forEach(pill=> pill.addEventListener('click', ()=>{ overlay.querySelectorAll('[data-cat]').forEach(p=>p.classList.remove('active')); pill.classList.add('active'); currentCat = pill.dataset.cat; renderList(searchEl.value); }));
  overlay.querySelectorAll('[data-eq]').forEach(pill=> pill.addEventListener('click', ()=>{ overlay.querySelectorAll('[data-eq]').forEach(p=>p.classList.remove('active')); pill.classList.add('active'); currentEq = pill.dataset.eq; renderList(searchEl.value); }));
  searchEl.addEventListener('input', ()=> renderList(searchEl.value));
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay && document.body.contains(overlay)){ unregisterOverlay(); document.body.removeChild(overlay); if(onCancel) onCancel(); } });
  renderList('');
}

// ================= Cronómetro (ejercicios por tiempo) =================
// onUse recibe los segundos cronometrados para cargarlos en una serie.
function openStopwatch(exName, onUse){
  const overlay = document.createElement('div'); overlay.className = 'dialog-overlay';
  overlay.innerHTML = `<div class="dialog-card stopwatch-card" role="dialog" aria-modal="true"><h3>Cronómetro</h3><p class="dialog-message" style="margin-bottom:6px;">${escapeHtml(exName)}</p>
    <div class="stopwatch-time" id="swTime">0:00</div>
    <div class="dialog-actions" style="margin-bottom:8px;"><button type="button" class="btn-ghost" id="swReset">Reiniciar</button><button type="button" class="btn-primary" id="swToggle">Iniciar</button></div>
    <div class="dialog-actions"><button type="button" class="btn-ghost" id="swClose">Cerrar</button><button type="button" class="btn-primary" id="swUse" disabled>Usar este tiempo</button></div></div>`;
  document.body.appendChild(overlay);
  const timeEl = overlay.querySelector('#swTime'), toggleBtn = overlay.querySelector('#swToggle'), useBtn = overlay.querySelector('#swUse');
  let elapsedMs = 0, startedAt = 0, timer = null;
  const currentMs = ()=> elapsedMs + (startedAt ? Date.now() - startedAt : 0);
  const paint = ()=>{ const s = Math.floor(currentMs() / 1000); timeEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; useBtn.disabled = s < 1; };
  const close = ()=>{ unregisterOverlay(); if(timer) clearInterval(timer); if(document.body.contains(overlay)) document.body.removeChild(overlay); };
  const unregisterOverlay = registerOverlay(close);
  toggleBtn.addEventListener('click', ()=>{
    if(startedAt){ elapsedMs += Date.now() - startedAt; startedAt = 0; clearInterval(timer); timer = null; toggleBtn.textContent = 'Continuar'; }
    else { startedAt = Date.now(); timer = setInterval(paint, 200); toggleBtn.textContent = 'Pausar'; }
    paint();
  });
  overlay.querySelector('#swReset').addEventListener('click', ()=>{ elapsedMs = 0; startedAt = 0; if(timer){ clearInterval(timer); timer = null; } toggleBtn.textContent = 'Iniciar'; paint(); });
  overlay.querySelector('#swClose').addEventListener('click', close);
  useBtn.addEventListener('click', ()=>{ const secs = Math.max(1, Math.round(currentMs() / 1000)); close(); onUse(secs); });
  overlay.addEventListener('mousedown', (e)=>{ if(e.target === overlay) close(); });
}
