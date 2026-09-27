// Estadísticas: resumen por período, comparaciones, objetivos, insignias e imagen para compartir.
// Se carga antes que app.js: solo define funciones y datos; usa el estado de app.js recién cuando se las llama.

// ================= Períodos =================
const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

let summaryMode = 'week', summaryOffset = 0, compareOffsetB = -1, funFactShift = 0;

// mode 'week' (lunes a domingo) o 'month'; offset 0 = actual, -1 = anterior, etc. El fin es exclusivo.
function getPeriodRange(mode, offset){
  const now = new Date();
  if(mode === 'week'){
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + offset * 7);
    const end = new Date(start); end.setDate(end.getDate() + 7);
    const last = new Date(end); last.setDate(last.getDate() - 1);
    const fmt = (d, withMonth)=> d.toLocaleDateString('es-AR', withMonth ? { day: 'numeric', month: 'short' } : { day: 'numeric' });
    const sameMonth = start.getMonth() === last.getMonth();
    return { mode, start, end, label: `${fmt(start, !sameMonth)} – ${fmt(last, true)}${offset === 0 ? ' (esta semana)' : ''}` };
  }
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  const monthName = MONTH_NAMES[start.getMonth()];
  return { mode, start, end, label: `${monthName[0].toUpperCase()}${monthName.slice(1)} ${start.getFullYear()}${offset === 0 ? ' (este mes)' : ''}` };
}

function computePeriodStats(range){
  const inRange = workouts.filter(w => { const t = new Date(w.date).getTime(); return t >= range.start.getTime() && t < range.end.getTime(); });
  const stats = { workouts: inRange, count: inRange.length, days: 0, volume: 0, sets: 0, reps: 0, seconds: 0, records: 0, exercises: 0, byExercise: {}, byCat: {}, byDay: [0, 0, 0, 0, 0, 0, 0], byWeek: {}, heaviest: null };
  const days = new Set(), exSet = new Set();
  inRange.forEach(w => {
    const d = new Date(w.date);
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    stats.seconds += w.duration || 0; stats.records += w.recordsCount || 0;
    let wVol = 0;
    w.exercises.forEach(ex => {
      exSet.add(ex.name);
      const cat = getExerciseCategory(ex.name), mode = getExerciseMode(ex.name);
      ex.sets.forEach(s => {
        if(s.type === 'W') return;
        const v = getSetVolume(s, ex.name, w.date);
        stats.volume += v; wVol += v; stats.sets++;
        if(mode !== 'time') stats.reps += Number(s.reps) || 0;
        const e = stats.byExercise[ex.name] = stats.byExercise[ex.name] || { sets: 0, volume: 0 };
        e.sets++; e.volume += v;
        stats.byCat[cat] = (stats.byCat[cat] || 0) + 1;
        if(mode === 'weight' && (!stats.heaviest || Number(s.weight) > stats.heaviest.weight)) stats.heaviest = { weight: Number(s.weight), reps: s.reps, name: ex.name };
      });
    });
    stats.byDay[(d.getDay() + 6) % 7] += wVol;
    const weekOfMonth = Math.floor((d.getDate() - 1) / 7);
    stats.byWeek[weekOfMonth] = (stats.byWeek[weekOfMonth] || 0) + wVol;
  });
  stats.days = days.size; stats.exercises = exSet.size;
  return stats;
}

function formatHoursMinutes(seconds){
  const h = Math.floor(seconds / 3600), m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

// Variación porcentual con flecha. neutral=true (para tiempos) no la pinta de verde ni de rojo: más tiempo no es mejor ni peor.
function deltaHtml(cur, prev, neutral = false){
  if(prev === 0 && cur === 0) return '<span class="delta flat">—</span>';
  if(prev === 0) return `<span class="delta ${neutral ? 'flat' : 'up'}">Nuevo</span>`;
  const pct = Math.round((cur - prev) / prev * 100);
  if(pct === 0) return '<span class="delta flat">= igual</span>';
  return `<span class="delta ${neutral ? 'flat' : (pct > 0 ? 'up' : 'down')}">${pct > 0 ? '▲' : '▼'} ${Math.abs(pct)}%</span>`;
}

// ================= Datos interesantes =================
const VOLUME_EQUIVALENTS = [
  ['una bolsa de cemento', 50, '🧱'], ['una heladera', 80, '🧊'], ['una moto', 200, '🏍️'], ['un auto chico', 1000, '🚗'],
  ['un elefante africano', 5500, '🐘'], ['un colectivo', 12000, '🚌'], ['una ballena jorobada', 30000, '🐋'],
  ['un Boeing 737 vacío', 41000, '✈️'], ['un Boeing 747 vacío', 180000, '🛫'], ['la Estatua de la Libertad', 204000, '🗽']
];

function volumeEquivalent(kg){
  let pick = VOLUME_EQUIVALENTS[0];
  VOLUME_EQUIVALENTS.forEach(e => { if(kg >= e[1]) pick = e; });
  const count = kg / pick[1];
  const nice = count >= 10 ? Math.round(count).toLocaleString('es-AR') : count.toFixed(1).replace('.', ',').replace(/,0$/, '');
  return `${nice} ${pick[0]} ${pick[2]}`;
}

function getFunFacts(stats, prevStats, isAllTime){
  const facts = [];
  const where = isAllTime ? 'En total' : 'En este período';
  if(stats.volume > 0) facts.push(`${where} levantaste ${toDisplayWeight(Math.round(stats.volume)).toLocaleString('es-AR')} ${weightUnit}: aproximadamente el peso de ${volumeEquivalent(stats.volume)}.`);
  if(stats.seconds >= 900){
    const films = stats.seconds / 7200;
    facts.push(`Pasaste ${formatHoursMinutes(stats.seconds)} entrenando: con ese tiempo podrías haber visto ${films >= 1.5 ? Math.round(films) : 'casi una'} película${films >= 1.5 ? 's' : ''} 🎬.`);
  }
  const bestDayIdx = stats.byDay.indexOf(Math.max(...stats.byDay));
  if(Math.max(...stats.byDay) > 0 && stats.count >= 2) facts.push(`Tu día más fuerte fue el ${DAY_NAMES[(bestDayIdx + 1) % 7]}: ${toDisplayWeight(Math.round(stats.byDay[bestDayIdx])).toLocaleString('es-AR')} ${weightUnit} de volumen 💪.`);
  const topEx = Object.entries(stats.byExercise).sort((a, b) => b[1].sets - a[1].sets)[0];
  if(topEx) facts.push(`Tu ejercicio más entrenado fue ${topEx[0]}, con ${topEx[1].sets} series.`);
  if(stats.reps >= 50){
    const secs = stats.reps * 3;
    facts.push(`Hiciste ${stats.reps.toLocaleString('es-AR')} repeticiones. Si cada una dura unos 3 segundos, estuviste ${formatHoursMinutes(secs)} bajo tensión ⏱️.`);
  }
  if(stats.heaviest && stats.heaviest.weight > 0) facts.push(`Tu serie más pesada fue ${fmtW(stats.heaviest.weight)} × ${stats.heaviest.reps} en ${stats.heaviest.name} 🏋️.`);
  if(!isAllTime && prevStats && prevStats.volume > 0 && stats.volume > 0){
    const pct = Math.round((stats.volume - prevStats.volume) / prevStats.volume * 100);
    if(pct >= 3) facts.push(`Levantaste un ${pct}% más que el período anterior 📈.`);
    else if(pct <= -3) facts.push(`Levantaste un ${Math.abs(pct)}% menos que el período anterior: a veces bajar la carga también es parte del plan.`);
  }
  if(stats.count >= 2){ const avg = stats.seconds / stats.count; if(avg > 0) facts.push(`Tus entrenamientos duraron en promedio ${formatHoursMinutes(avg)}.`); }
  const cats = Object.entries(stats.byCat).sort((a, b) => b[1] - a[1]);
  if(cats.length >= 2) facts.push(`Trabajaste más ${cats[0][0].toLowerCase()} (${cats[0][1]} series) que ${cats[cats.length - 1][0].toLowerCase()} (${cats[cats.length - 1][1]}).`);
  return facts;
}

// ================= Resumen (sección de Progreso) =================
function renderSummarySection(container){
  const range = getPeriodRange(summaryMode, summaryOffset);
  const prevRange = getPeriodRange(summaryMode, summaryOffset - 1);
  const stats = computePeriodStats(range), prev = computePeriodStats(prevRange);
  const tile = (icon, label, value, cur, prevVal, neutral = false)=> `<div class="summary-tile"><div class="tile-icon">${icon}</div><div class="tile-value">${value}</div><div class="tile-label">${label}</div>${deltaHtml(cur, prevVal, neutral)}</div>`;

  let html = `<div class="cal-mode-switch" style="margin-bottom:12px;"><button class="cal-mode-btn ${summaryMode === 'week' ? 'active' : ''}" data-summary-mode="week">Semana</button><button class="cal-mode-btn ${summaryMode === 'month' ? 'active' : ''}" data-summary-mode="month">Mes</button></div>
    <div class="period-nav"><button class="cal-nav-btn" data-summary-shift="-1" aria-label="Período anterior">‹</button><div class="period-label">${range.label}</div><button class="cal-nav-btn" data-summary-shift="1" ${summaryOffset >= 0 ? 'disabled' : ''} aria-label="Período siguiente">›</button></div>`;

  if(stats.count === 0){
    html += `<div class="empty-state" style="padding:26px 10px;"><div class="big">Sin entrenamientos en este período</div><div>Elegí otro o hacé un entreno para verlo acá.</div></div>`;
  } else {
    html += `<div class="summary-tiles">
      ${tile('🏋️', 'Entrenamientos', stats.count, stats.count, prev.count)}
      ${tile('⏱️', 'Tiempo total', formatHoursMinutes(stats.seconds), stats.seconds, prev.seconds, true)}
      ${tile('📦', `Volumen (${weightUnit})`, toDisplayWeight(Math.round(stats.volume)).toLocaleString('es-AR'), stats.volume, prev.volume)}
      ${tile('🔁', 'Series', stats.sets, stats.sets, prev.sets)}
      ${tile('🏆', 'Récords', stats.records, stats.records, prev.records)}
      ${tile('📅', 'Días entrenados', stats.days, stats.days, prev.days)}
    </div>`;

    const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const bars = summaryMode === 'week' ? stats.byDay.map((v, i) => [dayLabels[i], v]) : Object.keys(stats.byWeek).sort().map(k => [`S${Number(k) + 1}`, stats.byWeek[k]]);
    const maxBar = Math.max(...bars.map(b => b[1]), 1);
    html += `<div class="chart-wrap"><h4>${summaryMode === 'week' ? 'Volumen por día' : 'Volumen por semana del mes'}</h4><div class="bar-chart">${bars.map(([l, v]) => `<div class="bar-col"><div class="bar-val">${v > 0 ? Math.round(toDisplayWeight(v)).toLocaleString('es-AR') : ''}</div><div class="bar" style="height:${Math.max(v / maxBar * 100, v > 0 ? 6 : 2)}%"></div><div class="bar-label">${l}</div></div>`).join('')}</div></div>`;

    const cats = Object.entries(stats.byCat).sort((a, b) => b[1] - a[1]);
    const maxCat = cats.length ? cats[0][1] : 1;
    html += `<div class="chart-wrap"><h4>Series por grupo muscular</h4>${cats.map(([c, n]) => `<div class="hbar-row"><span class="hbar-name">${c}</span><div class="hbar-track"><div class="hbar-fill" style="width:${Math.round(n / maxCat * 100)}%"></div></div><span class="hbar-num">${n}</span></div>`).join('')}</div>`;

    const top = Object.entries(stats.byExercise).sort((a, b) => b[1].sets - a[1].sets).slice(0, 5);
    html += `<div class="chart-wrap"><h4>Ejercicios más entrenados</h4>${top.map(([n, e], i) => `<div class="top-ex-row"><span class="top-rank">${i + 1}</span><span class="top-name">${escapeHtml(n)}</span><span class="top-detail">${e.sets} series${e.volume > 0 ? ` · ${toDisplayWeight(Math.round(e.volume)).toLocaleString('es-AR')} ${weightUnit}` : ''}</span></div>`).join('')}</div>`;
  }

  const allStats = computePeriodStats({ start: new Date(0), end: new Date(8640000000000000) });
  const usePeriod = stats.count > 0;
  const facts = getFunFacts(usePeriod ? stats : allStats, usePeriod ? prev : null, !usePeriod);
  if(facts.length){
    const seed = (summaryMode.length * 7 + summaryOffset * 3 + range.start.getMonth() + range.start.getDate()) % facts.length;
    const idx = ((seed + funFactShift) % facts.length + facts.length) % facts.length;
    html += `<div class="fun-fact"><div class="fun-fact-title">💡 Dato interesante</div><div class="fun-fact-text">${facts[idx]}</div>${facts.length > 1 ? '<button class="btn-ghost" id="nextFactBtn" style="margin-top:10px;">Otro dato ↻</button>' : ''}</div>`;
  }

  html += renderPeriodCompare(range, stats);
  container.innerHTML = html;

  container.querySelectorAll('[data-summary-mode]').forEach(b => b.addEventListener('click', ()=>{ if(summaryMode === b.dataset.summaryMode) return; summaryMode = b.dataset.summaryMode; summaryOffset = 0; compareOffsetB = -1; funFactShift = 0; renderProgress(); }));
  container.querySelectorAll('[data-summary-shift]').forEach(b => b.addEventListener('click', ()=>{ summaryOffset = Math.min(0, summaryOffset + parseInt(b.dataset.summaryShift, 10)); funFactShift = 0; renderProgress(); }));
  const nextFact = document.getElementById('nextFactBtn'); if(nextFact) nextFact.addEventListener('click', ()=>{ funFactShift++; renderProgress(); });
  container.querySelectorAll('[data-compare-shift]').forEach(b => b.addEventListener('click', ()=>{ compareOffsetB = Math.min(0, compareOffsetB + parseInt(b.dataset.compareShift, 10)); renderProgress(); }));
}

// ================= Comparar períodos =================
function renderPeriodCompare(rangeA, statsA){
  const rangeB = getPeriodRange(summaryMode, compareOffsetB);
  const statsB = computePeriodStats(rangeB);
  const sameAsA = compareOffsetB === summaryOffset;
  const rows = [
    ['Entrenamientos', statsA.count, statsB.count, v => v],
    ['Días entrenados', statsA.days, statsB.days, v => v],
    ['Tiempo total', statsA.seconds, statsB.seconds, v => formatHoursMinutes(v), true],
    [`Volumen (${weightUnit})`, statsA.volume, statsB.volume, v => toDisplayWeight(Math.round(v)).toLocaleString('es-AR')],
    ['Series', statsA.sets, statsB.sets, v => v],
    ['Récords', statsA.records, statsB.records, v => v]
  ];
  return `<div class="chart-wrap compare-card"><h4>⚖️ Comparar períodos</h4>
    <div class="compare-pick"><span class="compare-tag a">A</span><span class="compare-pick-label">${rangeA.label}</span></div>
    <div class="compare-pick"><span class="compare-tag b">B</span><button class="cal-nav-btn" data-compare-shift="-1" aria-label="B anterior">‹</button><span class="compare-pick-label">${rangeB.label}</span><button class="cal-nav-btn" data-compare-shift="1" ${compareOffsetB >= 0 ? 'disabled' : ''} aria-label="B siguiente">›</button></div>
    ${sameAsA ? '<div class="setting-hint" style="margin:8px 0;">Elegí un período B distinto de A para comparar.</div>' : ''}
    <div class="compare-table"><div class="compare-row head"><span></span><span>A</span><span>B</span><span>A vs B</span></div>
      ${rows.map(([label, a, b, fmt, neutral]) => `<div class="compare-row"><span>${label}</span><span>${fmt(a)}</span><span>${fmt(b)}</span>${deltaHtml(a, b, !!neutral)}</div>`).join('')}
    </div></div>`;
}

// ================= Comparar dos entrenamientos =================
function getWorkoutExerciseSummary(w){
  const map = {};
  w.exercises.forEach(ex => {
    const mode = getExerciseMode(ex.name);
    const entry = map[ex.name] = map[ex.name] || { sets: 0, volume: 0, seconds: 0, best: null, bestScore: -Infinity };
    ex.sets.forEach(s => {
      if(s.type === 'W') return;
      entry.sets++;
      entry.volume += getSetVolume(s, ex.name, w.date);
      if(mode === 'time') entry.seconds += Number(s.reps) || 0;
      const sc = getSetScore(ex.name, s);
      if(!isNaN(sc) && sc >= entry.bestScore){ entry.bestScore = sc; entry.best = s; }
    });
  });
  return map;
}

function openCompareWorkouts(idA, idB){
  let a = workouts.find(w => w.id === idA), b = workouts.find(w => w.id === idB);
  if(!a || !b) return;
  if(new Date(a.date) > new Date(b.date)) [a, b] = [b, a];
  const ea = getWorkoutExerciseSummary(a), eb = getWorkoutExerciseSummary(b);
  const names = [...new Set([...Object.keys(ea), ...Object.keys(eb)])];
  const setCount = (w)=> w.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.type !== 'W').length, 0);
  const summaryRows = [
    ['Duración', a.duration || 0, b.duration || 0, v => formatDuration(v), true],
    [`Volumen (${weightUnit})`, getWorkoutVolume(a), getWorkoutVolume(b), v => toDisplayWeight(Math.round(v)).toLocaleString('es-AR')],
    ['Series', setCount(a), setCount(b), v => v],
    ['Ejercicios', a.exercises.length, b.exercises.length, v => v]
  ];
  const cell = (entry, name)=> entry ? `<div class="cmp-best">${entry.best ? fmtSetShort(name, entry.best) : '-'}</div><div class="cmp-sub">${entry.sets} serie${entry.sets === 1 ? '' : 's'}${entry.volume > 0 ? ` · ${toDisplayWeight(Math.round(entry.volume)).toLocaleString('es-AR')} ${weightUnit}` : (entry.seconds ? ` · ${formatSeconds(entry.seconds)}` : '')}</div>` : '<div class="cmp-none">No lo hiciste</div>';
  const exRow = (name)=> {
    const x = ea[name], y = eb[name];
    const dv = (x && y) ? (getExerciseMode(name) === 'time' ? deltaHtml(y.seconds, x.seconds) : deltaHtml(y.volume, x.volume)) : '';
    return `<div class="cmp-ex"><div class="cmp-ex-name">${escapeHtml(name)} ${dv}</div><div class="cmp-ex-cols"><div>${cell(x, name)}</div><div>${cell(y, name)}</div></div></div>`;
  };
  const overlay = document.createElement('div'); overlay.className = 'sheet-overlay';
  overlay.innerHTML = `<div class="sheet-full" role="dialog" aria-modal="true"><div class="sheet-head"><h3>⚖️ Comparar entrenamientos</h3><button class="btn-icon" id="cmpClose" aria-label="Cerrar">✕</button></div>
    <div class="cmp-headers"><div><span class="compare-tag a">A</span><strong>${escapeHtml(a.name)}</strong><small>${fmtDate(a.date)}</small></div><div><span class="compare-tag b">B</span><strong>${escapeHtml(b.name)}</strong><small>${fmtDate(b.date)}</small></div></div>
    <div class="compare-table"><div class="compare-row head"><span></span><span>A</span><span>B</span><span>B vs A</span></div>
      ${summaryRows.map(([label, x, y, fmt, neutral]) => `<div class="compare-row"><span>${label}</span><span>${fmt(x)}</span><span>${fmt(y)}</span>${deltaHtml(y, x, !!neutral)}</div>`).join('')}</div>
    <h4 class="cmp-title">Por ejercicio (mejor serie · series · volumen)</h4>${names.map(exRow).join('')}
    <button class="btn-ghost" id="cmpClose2" style="margin:14px 0 20px; width:100%;">Cerrar</button></div>`;
  document.body.appendChild(overlay);
  const close = ()=>{ unregisterOverlay(); if(document.body.contains(overlay)) document.body.removeChild(overlay); };
  const unregisterOverlay = registerOverlay(close);
  overlay.querySelector('#cmpClose').addEventListener('click', close);
  overlay.querySelector('#cmpClose2').addEventListener('click', close);
}

// ================= Objetivos =================
const GOAL_KINDS = [['weight', 'Marca de un ejercicio (peso, lastre o tiempo)'], ['e1rm', '1RM estimado de un ejercicio'], ['bodyweight', 'Peso corporal'], ['frequency', 'Entrenamientos por semana']];

function getExerciseE1RM(exName){
  let best = 0;
  forEachHistorySet(exName, workouts, s => { if(s.type !== 'W' && s.weight !== '' && s.reps !== ''){ const rm = estimated1RM(s.weight, s.reps); if(rm > best) best = rm; } });
  return best;
}

function getWeeklyWorkoutCount(){
  const start = getPeriodRange('week', 0);
  return workouts.filter(w => { const t = new Date(w.date).getTime(); return t >= start.start.getTime() && t < start.end.getTime(); }).length;
}

function getGoalCurrent(g){
  if(g.kind === 'weight') return getHistoricalMaxWeight(g.exercise, workouts);
  if(g.kind === 'e1rm') return getExerciseE1RM(g.exercise);
  if(g.kind === 'bodyweight') return bodyWeightLog.length ? Number(bodyWeightLog[bodyWeightLog.length - 1].weight) : g.startValue;
  return getWeeklyWorkoutCount();
}

function isGoalReached(g, cur){
  if(g.kind === 'bodyweight') return g.target < g.startValue ? cur <= g.target : cur >= g.target;
  return cur >= g.target;
}

function getGoalProgress(g, cur){
  if(g.kind === 'bodyweight'){ const span = g.target - g.startValue; return span === 0 ? 1 : Math.min(1, Math.max(0, (cur - g.startValue) / span)); }
  if(g.kind === 'weight' && getExerciseMode(g.exercise) === 'assisted'){ const span = g.target - g.startValue; return span <= 0 ? 1 : Math.min(1, Math.max(0, (cur - g.startValue) / span)); }
  return g.target > 0 ? Math.min(1, Math.max(0, cur / g.target)) : 0;
}

function formatGoalValue(g, v){
  if(g.kind === 'weight') return fmtScore(g.exercise, v);
  if(g.kind === 'frequency') return `${v}`;
  return fmtW(v);
}

function goalTitle(g){
  if(g.kind === 'weight') return `${g.exercise}: ${fmtScore(g.exercise, g.target)}`;
  if(g.kind === 'e1rm') return `1RM estimado en ${g.exercise}: ${fmtW(g.target)}`;
  if(g.kind === 'bodyweight') return `Peso corporal: ${fmtW(g.target)}`;
  return `Entrenar ${g.target} ${g.target === 1 ? 'vez' : 'veces'} por semana`;
}

// Fecha estimada para llegar a la meta según el ritmo de las últimas semanas (regresión lineal simple). null si no alcanza la data.
function estimateGoalDate(g, cur){
  if(g.kind !== 'weight' && g.kind !== 'e1rm') return null;
  const since = Date.now() - 16 * 7 * 86400000;
  const points = [];
  workouts.slice().reverse().forEach(w => {
    const t = new Date(w.date).getTime();
    if(t < since) return;
    let best = 0;
    w.exercises.forEach(ex => { if(ex.name !== g.exercise) return; ex.sets.forEach(s => {
      if(s.type === 'W') return;
      const v = g.kind === 'e1rm' ? (s.weight !== '' && s.reps !== '' ? estimated1RM(s.weight, s.reps) : 0) : getSetScore(g.exercise, s);
      if(v > best) best = v;
    }); });
    if(best > 0) points.push([t / 86400000, best]);
  });
  if(points.length < 3 || points[points.length - 1][0] - points[0][0] < 14) return null;
  const n = points.length, sx = points.reduce((a, p) => a + p[0], 0), sy = points.reduce((a, p) => a + p[1], 0);
  const sxy = points.reduce((a, p) => a + p[0] * p[1], 0), sxx = points.reduce((a, p) => a + p[0] * p[0], 0);
  const denom = n * sxx - sx * sx;
  if(denom === 0) return null;
  const slope = (n * sxy - sx * sy) / denom;
  if(!(slope > 0)) return null;
  const days = (g.target - cur) / slope;
  if(days < 0 || days > 730) return null;
  return new Date(Date.now() + days * 86400000);
}

function renderGoalsSection(container){
  const active_ = goals.filter(g => !g.achievedAt), done = goals.filter(g => g.achievedAt);
  const card = (g)=> {
    const cur = getGoalCurrent(g), pct = Math.round(getGoalProgress(g, cur) * 100), eta = estimateGoalDate(g, cur);
    const icon = g.kind === 'bodyweight' ? '⚖️' : g.kind === 'frequency' ? '📅' : '🎯';
    const etaText = g.kind === 'frequency' ? `Esta semana: ${cur} de ${g.target}` : (eta ? `Ritmo actual: llegás aprox. en ${MONTH_NAMES[eta.getMonth()]} ${eta.getFullYear()}` : 'Necesito unos entrenamientos más para estimar cuándo llegás');
    return `<div class="goal-card"><div class="goal-head"><div class="goal-icon">${icon}</div><div class="goal-info"><div class="goal-title">${escapeHtml(goalTitle(g))}</div><div class="goal-now">${g.kind === 'frequency' ? '' : `Ahora: ${escapeHtml(formatGoalValue(g, cur))} · `}${pct}%</div></div>
      <div class="goal-actions"><button class="btn-icon" data-edit-goal="${g.id}" title="Cambiar la meta" style="width:28px; height:28px; font-size:12px;">✏️</button><button class="btn-icon" data-del-goal="${g.id}" title="Borrar" style="width:28px; height:28px; font-size:12px;">🗑️</button></div></div>
      <div class="goal-bar"><div class="goal-fill" style="width:${pct}%"></div></div><div class="goal-eta">${etaText}</div></div>`;
  };
  container.innerHTML = `<button class="add-exercise-btn" id="addGoalBtn" style="margin-bottom:14px;">+ Nuevo objetivo</button>
    ${active_.length ? active_.map(card).join('') : '<div class="empty-state" style="padding:26px 10px;"><div class="big">Sin objetivos activos</div><div>Poné una meta, por ejemplo "Press de banca 100 kg", y seguí tu avance acá.</div></div>'}
    ${done.length ? `<div class="picker-section" style="margin-top:16px;">✅ Cumplidos</div>${done.map(g => `<div class="goal-card done"><div class="goal-head"><div class="goal-icon">🏆</div><div class="goal-info"><div class="goal-title">${escapeHtml(goalTitle(g))}</div><div class="goal-now">Cumplido el ${fmtDate(g.achievedAt)}</div></div><div class="goal-actions"><button class="btn-icon" data-del-goal="${g.id}" title="Borrar" style="width:28px; height:28px; font-size:12px;">🗑️</button></div></div></div>`).join('')}` : ''}`;
  document.getElementById('addGoalBtn').addEventListener('click', ()=> openAddGoal());
  container.querySelectorAll('[data-edit-goal]').forEach(b => b.addEventListener('click', ()=> editGoalTarget(b.dataset.editGoal)));
  container.querySelectorAll('[data-del-goal]').forEach(b => b.addEventListener('click', async ()=>{
    if(await uiConfirm('¿Borrar este objetivo?', { title: 'Borrar objetivo', confirmText: 'Borrar', danger: true })){ goals = goals.filter(g => g.id !== b.dataset.delGoal); saveGoals(); renderProgress(); }
  }));
}

// Convierte lo que escribe el usuario (en la unidad elegida o en segundos) al valor interno de la meta.
function goalTargetPrompt(kind, exName){
  const mode = exName ? getExerciseMode(exName) : 'weight';
  if(kind === 'bodyweight') return { message: `¿Qué peso corporal querés alcanzar? (${weightUnit})`, max: weightUnit === 'lb' ? 880 : 400, toInternal: v => toKgWeight(v), decimals: true };
  if(kind === 'frequency') return { message: '¿Cuántos entrenamientos por semana querés hacer?', max: 7, toInternal: v => Math.round(v), decimals: false };
  if(kind === 'e1rm') return { message: `¿Qué 1RM estimado querés alcanzar en ${exName}? (${weightUnit})`, max: unitMaxWeight(), toInternal: v => toKgWeight(v), decimals: true };
  if(mode === 'time') return { message: `¿Cuántos segundos querés sostener en ${exName}?`, max: 3600, toInternal: v => Math.round(v), decimals: false };
  if(mode === 'assisted') return { message: `¿Con cuánta ayuda máxima querés hacer ${exName}? (${weightUnit}, menos es mejor)`, max: unitMaxWeight(), toInternal: v => ASSIST_CAP - toKgWeight(v), decimals: true };
  if(mode === 'bodyweight') return { message: `¿Cuánto lastre querés llegar a usar en ${exName}? (${weightUnit})`, max: unitMaxWeight(), toInternal: v => toKgWeight(v), decimals: true };
  return { message: `¿Qué peso querés alcanzar en ${exName}? (${weightUnit})`, max: unitMaxWeight(), toInternal: v => toKgWeight(v), decimals: true };
}

async function askGoalTarget(kind, exName, currentDisplay = ''){
  const cfg = goalTargetPrompt(kind, exName);
  const raw = await uiPrompt(cfg.message, currentDisplay, {
    title: 'Objetivo', inputMode: cfg.decimals ? 'decimal' : 'numeric',
    validate: (v)=>{ const n = parseFloat(String(v).replace(',', '.')); return (isNaN(n) || n <= 0 || n > cfg.max) ? `Ingresá un número entre 1 y ${cfg.max}.` : null; }
  });
  if(raw === null) return null;
  return cfg.toInternal(parseFloat(String(raw).replace(',', '.')));
}

async function openAddGoal(){
  const vals = await uiForm({ title: 'Nuevo objetivo', fields: [{ key: 'kind', label: '¿Qué querés lograr?', type: 'select', options: GOAL_KINDS, value: 'weight' }], confirmText: 'Continuar' });
  if(!vals) return;
  const kind = vals.kind;
  let exName = null;
  if(kind === 'weight' || kind === 'e1rm'){
    exName = await new Promise(resolve => openExercisePicker(resolve, () => resolve(null)));
    if(!exName) return;
    if(kind === 'e1rm' && getExerciseMode(exName) !== 'weight'){ await uiAlert('El 1RM estimado solo se calcula para ejercicios de peso y repeticiones. Elegí "Marca de un ejercicio" para este.', 'No disponible'); return; }
  }
  const target = await askGoalTarget(kind, exName);
  if(target === null) return;
  if(kind === 'bodyweight' && !bodyWeightLog.length){ await uiAlert('Primero registrá tu peso corporal actual en Progreso → Gráficos, así puedo medir tu avance.', 'Falta tu peso actual'); return; }
  const g = { id: Date.now().toString(), kind, exercise: exName, target, createdAt: new Date().toISOString(), startValue: 0 };
  g.startValue = kind === 'bodyweight' ? Number(bodyWeightLog[bodyWeightLog.length - 1].weight) : getGoalCurrent(g);
  if(kind !== 'bodyweight' && kind !== 'frequency' && isGoalReached(g, getGoalCurrent(g))){ await uiAlert('Esa marca ya la alcanzaste. Elegí una meta un poco más alta.', 'Ya cumplida'); return; }
  goals.push(g); saveGoals(); renderProgress(); showToast('Objetivo agregado ✓');
}

async function editGoalTarget(id){
  const g = goals.find(x => x.id === id); if(!g) return;
  const current = g.kind === 'weight' && getExerciseMode(g.exercise) === 'assisted' ? toDisplayWeight(ASSIST_CAP - g.target) : (g.kind === 'frequency' || (g.kind === 'weight' && getExerciseMode(g.exercise) === 'time')) ? g.target : toDisplayWeight(g.target);
  const t = await askGoalTarget(g.kind, g.exercise, current);
  if(t === null) return;
  g.target = t; g.achievedAt = null; saveGoals(); renderProgress();
}

// Marca como cumplidos los objetivos alcanzados y devuelve sus textos (para mostrarlos en el resumen).
function checkGoalsAchieved(){
  const hits = [];
  goals.forEach(g => {
    if(g.achievedAt || g.kind === 'frequency') return;
    if(isGoalReached(g, getGoalCurrent(g))){ g.achievedAt = new Date().toISOString(); hits.push(`🎯 ¡Objetivo cumplido! ${goalTitle(g)}`); }
  });
  if(hits.length) saveGoals();
  return hits;
}
function checkGoalsAfterWorkout(){ return checkGoalsAchieved(); }
function checkGoalsAfterBodyWeight(){
  const hits = checkGoalsAchieved();
  if(hits.length){ fireConfetti(); showToast(hits[0]); }
}

// ================= Insignias =================
function computeBadgeStats(){
  const s = { workouts: workouts.length, volume: 0, sets: 0, records: 0, maxStreak: 0, heaviest: 0, early: false, night: false, marathon: false, weekend: false, doubleSession: false, comeback: false, maxWeekCount: 0, exercises: new Set(), categories: new Set(), modes: new Set(), routineSessions: 0, goals: goals.filter(g => g.achievedAt).length, bwLogs: bodyWeightLog.length, timedSeconds: 0, bodyweightReps: 0, customExercises: getCustomExerciseNames().length };
  const weeks = {}, weekendDays = {}, dayCounts = {};
  workouts.forEach(w => {
    const d = new Date(w.date), hour = d.getHours();
    s.volume += getWorkoutVolume(w); s.records += w.recordsCount || 0;
    if(hour < 7) s.early = true; if(hour >= 22) s.night = true;
    if((w.duration || 0) >= 7200 && (w.duration || 0) <= STALE_WORKOUT_SECONDS) s.marathon = true;
    if(w.routineId) s.routineSessions++;
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate()); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const wk = monday.getTime();
    weeks[wk] = (weeks[wk] || 0) + 1;
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;
    const dow = d.getDay();
    if(dow === 6 || dow === 0){ (weekendDays[wk] = weekendDays[wk] || new Set()).add(dow); }
    w.exercises.forEach(ex => {
      s.exercises.add(ex.name);
      s.categories.add(getExerciseCategory(ex.name));
      const mode = getExerciseMode(ex.name);
      s.modes.add(mode);
      ex.sets.forEach(set => {
        if(set.type === 'W') return;
        s.sets++;
        if(mode === 'weight' && Number(set.weight) > s.heaviest) s.heaviest = Number(set.weight);
        if(mode === 'time') s.timedSeconds += Number(set.reps) || 0;
        if(mode === 'bodyweight') s.bodyweightReps += Number(set.reps) || 0;
      });
    });
  });
  s.exercises = s.exercises.size; s.categories = s.categories.size; s.modes = s.modes.size;
  Object.values(weekendDays).forEach(set => { if(set.size === 2) s.weekend = true; });
  Object.values(dayCounts).forEach(n => { if(n >= 2) s.doubleSession = true; });
  s.maxWeekCount = Object.values(weeks).reduce((a, b) => Math.max(a, b), 0);
  const goodWeeks = Object.keys(weeks).filter(k => weeks[k] >= 3).map(Number).sort((a, b) => a - b);
  let run = 0, prev = null;
  goodWeeks.forEach(k => { run = (prev !== null && Math.round((k - prev) / 86400000) === 7) ? run + 1 : 1; prev = k; if(run > s.maxStreak) s.maxStreak = run; });
  const sortedDates = workouts.map(w => new Date(w.date).getTime()).sort((a, b) => a - b);
  for(let i = 1; i < sortedDates.length; i++){ if((sortedDates[i] - sortedDates[i - 1]) / 86400000 >= 30) s.comeback = true; }
  return s;
}

const BADGE_DEFS = [
  { id: 'w1', group: 'Constancia', icon: '👟', name: 'Primer paso', desc: 'Completá tu primer entrenamiento', value: s => s.workouts, target: 1 },
  { id: 'w10', group: 'Constancia', icon: '🔟', name: 'Le agarraste la mano', desc: '10 entrenamientos', value: s => s.workouts, target: 10 },
  { id: 'w25', group: 'Constancia', icon: '💪', name: 'Hábito en marcha', desc: '25 entrenamientos', value: s => s.workouts, target: 25 },
  { id: 'w50', group: 'Constancia', icon: '🔥', name: 'Medio centenar', desc: '50 entrenamientos', value: s => s.workouts, target: 50 },
  { id: 'w100', group: 'Constancia', icon: '💯', name: 'Club de los 100', desc: '100 entrenamientos', value: s => s.workouts, target: 100 },
  { id: 'w250', group: 'Constancia', icon: '🏅', name: 'Veterano', desc: '250 entrenamientos', value: s => s.workouts, target: 250 },
  { id: 'w500', group: 'Constancia', icon: '👑', name: 'Leyenda', desc: '500 entrenamientos', value: s => s.workouts, target: 500 },
  { id: 'w750', group: 'Constancia', icon: '🎖️', name: 'Incansable', desc: '750 entrenamientos', value: s => s.workouts, target: 750 },
  { id: 'w1000', group: 'Constancia', icon: '🏛️', name: 'Salón de la fama', desc: '1.000 entrenamientos', value: s => s.workouts, target: 1000 },
  { id: 'streak2', group: 'Constancia', icon: '📆', name: 'Dos semanas al hilo', desc: '2 semanas seguidas con 3 o más entrenamientos', value: s => s.maxStreak, target: 2 },
  { id: 'streak4', group: 'Constancia', icon: '🗓️', name: 'Un mes imparable', desc: '4 semanas seguidas con 3 o más entrenamientos', value: s => s.maxStreak, target: 4 },
  { id: 'streak8', group: 'Constancia', icon: '⚡', name: 'Racha de acero', desc: '8 semanas seguidas con 3 o más entrenamientos', value: s => s.maxStreak, target: 8 },
  { id: 'streak12', group: 'Constancia', icon: '🌟', name: 'Trimestre perfecto', desc: '12 semanas seguidas con 3 o más entrenamientos', value: s => s.maxStreak, target: 12 },
  { id: 'streak20', group: 'Constancia', icon: '🛡️', name: 'Medio año de hierro', desc: '20 semanas seguidas con 3 o más entrenamientos', value: s => s.maxStreak, target: 20 },
  { id: 'streak52', group: 'Constancia', icon: '🎇', name: 'Un año entero', desc: '52 semanas seguidas con 3 o más entrenamientos', value: s => s.maxStreak, target: 52 },
  { id: 'ironWeek', group: 'Constancia', icon: '🗓️', name: 'Semana de hierro', desc: '5 o más entrenamientos en una misma semana', value: s => s.maxWeekCount, target: 5 },
  { id: 'comeback', group: 'Constancia', icon: '🔄', name: 'El regreso', desc: 'Volvé a entrenar después de 30 días de pausa', value: s => s.comeback ? 1 : 0, target: 1 },
  { id: 'lift60', group: 'Fuerza', icon: '🏋️', name: 'Levantador', desc: 'Levantá 60 kg en una serie', value: s => s.heaviest, target: 60 },
  { id: 'lift100', group: 'Fuerza', icon: '🦍', name: 'Club de los 100 kg', desc: 'Levantá 100 kg en una serie', value: s => s.heaviest, target: 100 },
  { id: 'lift150', group: 'Fuerza', icon: '🐂', name: 'Bestia', desc: 'Levantá 150 kg en una serie', value: s => s.heaviest, target: 150 },
  { id: 'lift200', group: 'Fuerza', icon: '🐘', name: 'Titán', desc: 'Levantá 200 kg en una serie', value: s => s.heaviest, target: 200 },
  { id: 'lift250', group: 'Fuerza', icon: '🦾', name: 'Sobrehumano', desc: 'Levantá 250 kg en una serie', value: s => s.heaviest, target: 250 },
  { id: 'lift300', group: 'Fuerza', icon: '💎', name: 'Fuera de escala', desc: 'Levantá 300 kg en una serie', value: s => s.heaviest, target: 300 },
  { id: 'pr1', group: 'Fuerza', icon: '🏆', name: 'Primer récord', desc: 'Rompé tu primer récord personal', value: s => s.records, target: 1 },
  { id: 'pr10', group: 'Fuerza', icon: '🥇', name: 'Cazador de récords', desc: '10 récords personales', value: s => s.records, target: 10 },
  { id: 'pr50', group: 'Fuerza', icon: '🚀', name: 'Máquina de récords', desc: '50 récords personales', value: s => s.records, target: 50 },
  { id: 'pr100', group: 'Fuerza', icon: '🌠', name: 'Imparable', desc: '100 récords personales', value: s => s.records, target: 100 },
  { id: 'sets100', group: 'Volumen', icon: '🔂', name: 'Primeras 100', desc: 'Completá 100 series', value: s => s.sets, target: 100 },
  { id: 'vol10k', group: 'Volumen', icon: '📦', name: '10 toneladas', desc: 'Movés 10.000 kg en total', value: s => s.volume, target: 10000 },
  { id: 'vol50k', group: 'Volumen', icon: '🚚', name: '50 toneladas', desc: 'Movés 50.000 kg en total', value: s => s.volume, target: 50000 },
  { id: 'vol100k', group: 'Volumen', icon: '🚛', name: '100 toneladas', desc: 'Movés 100.000 kg en total', value: s => s.volume, target: 100000 },
  { id: 'vol500k', group: 'Volumen', icon: '🚢', name: '500 toneladas', desc: 'Movés 500.000 kg en total', value: s => s.volume, target: 500000 },
  { id: 'vol1m', group: 'Volumen', icon: '🌋', name: 'Un millón de kilos', desc: 'Movés 1.000.000 kg en total', value: s => s.volume, target: 1000000 },
  { id: 'sets500', group: 'Volumen', icon: '🔁', name: '500 series', desc: 'Completá 500 series', value: s => s.sets, target: 500 },
  { id: 'sets2500', group: 'Volumen', icon: '♾️', name: '2.500 series', desc: 'Completá 2.500 series', value: s => s.sets, target: 2500 },
  { id: 'sets5000', group: 'Volumen', icon: '🌀', name: 'Insaciable', desc: '5.000 series', value: s => s.sets, target: 5000 },
  { id: 'variety10', group: 'Variedad', icon: '🔍', name: 'Probando cosas', desc: 'Entrená 10 ejercicios distintos', value: s => s.exercises, target: 10 },
  { id: 'variety20', group: 'Variedad', icon: '🎨', name: 'Curioso', desc: 'Entrená 20 ejercicios distintos', value: s => s.exercises, target: 20 },
  { id: 'variety50', group: 'Variedad', icon: '🧭', name: 'Explorador', desc: 'Entrená 50 ejercicios distintos', value: s => s.exercises, target: 50 },
  { id: 'allCategories', group: 'Variedad', icon: '🧩', name: 'Todoterreno', desc: 'Entrená los 6 grupos musculares', value: s => s.categories, target: EXERCISE_CATEGORIES.length },
  { id: 'allModes', group: 'Variedad', icon: '🧬', name: 'Multiformato', desc: 'Registrá un ejercicio de cada tipo (peso, corporal, asistido, tiempo)', value: s => s.modes, target: Object.keys(EXERCISE_MODES).length },
  { id: 'customEx', group: 'Variedad', icon: '🛠️', name: 'Inventor', desc: 'Creá tu primer ejercicio propio', value: s => s.customExercises, target: 1 },
  { id: 'routines10', group: 'Variedad', icon: '📋', name: 'Con plan', desc: '10 entrenamientos siguiendo una rutina', value: s => s.routineSessions, target: 10 },
  { id: 'routines50', group: 'Variedad', icon: '🗂️', name: 'Metódico', desc: '50 entrenamientos siguiendo una rutina', value: s => s.routineSessions, target: 50 },
  { id: 'calis500', group: 'Variedad', icon: '🤸', name: 'Calistenia', desc: '500 repeticiones con peso corporal', value: s => s.bodyweightReps, target: 500 },
  { id: 'calis2000', group: 'Variedad', icon: '🤾', name: 'Cuerpo libre', desc: '2.000 repeticiones con peso corporal', value: s => s.bodyweightReps, target: 2000 },
  { id: 'timed600', group: 'Variedad', icon: '🧘', name: 'Isométrico', desc: '10 minutos acumulados en ejercicios por tiempo', value: s => s.timedSeconds, target: 600 },
  { id: 'timed3600', group: 'Variedad', icon: '⏲️', name: 'Resistencia', desc: '1 hora acumulada en ejercicios por tiempo', value: s => s.timedSeconds, target: 3600 },
  { id: 'early', group: 'Especiales', icon: '🌅', name: 'Madrugador', desc: 'Empezá un entrenamiento antes de las 7', value: s => s.early ? 1 : 0, target: 1 },
  { id: 'night', group: 'Especiales', icon: '🌙', name: 'Noctámbulo', desc: 'Empezá un entrenamiento después de las 22', value: s => s.night ? 1 : 0, target: 1 },
  { id: 'marathon', group: 'Especiales', icon: '⏳', name: 'Maratón', desc: 'Un entrenamiento de 2 horas o más', value: s => s.marathon ? 1 : 0, target: 1 },
  { id: 'weekend', group: 'Especiales', icon: '🎯', name: 'Finde activo', desc: 'Entrená sábado y domingo del mismo fin de semana', value: s => s.weekend ? 1 : 0, target: 1 },
  { id: 'doubleSession', group: 'Especiales', icon: '🌗', name: 'Doble turno', desc: 'Dos entrenamientos en el mismo día', value: s => s.doubleSession ? 1 : 0, target: 1 },
  { id: 'goal1', group: 'Especiales', icon: '✅', name: 'Meta cumplida', desc: 'Cumplí un objetivo', value: s => s.goals, target: 1 },
  { id: 'goal3', group: 'Especiales', icon: '🎖️', name: 'Coleccionista de metas', desc: 'Cumplí 3 objetivos', value: s => s.goals, target: 3 },
  { id: 'bw5', group: 'Especiales', icon: '⚖️', name: 'Seguimiento', desc: 'Registrá tu peso corporal 5 veces', value: s => s.bwLogs, target: 5 },
  { id: 'bw20', group: 'Especiales', icon: '📈', name: 'Seguimiento constante', desc: 'Registrá tu peso corporal 20 veces', value: s => s.bwLogs, target: 20 }
];

function getUnlockedBadgeIds(stats = computeBadgeStats()){
  return BADGE_DEFS.filter(b => b.value(stats) >= b.target).map(b => b.id);
}

// Primera vez que se abre la app con insignias: se marcan sin aviso las que ya tenías, para no llenarte de carteles.
function initBadgesIfNeeded(){
  if(badges !== null) return;
  badges = {};
  const stamp = workouts.length ? workouts[0].date : new Date().toISOString();
  getUnlockedBadgeIds().forEach(id => { badges[id] = stamp; });
  saveBadges();
}

// Después de un entrenamiento: devuelve las insignias recién desbloqueadas (y las guarda).
function checkNewBadges(){
  initBadgesIfNeeded();
  const fresh = getUnlockedBadgeIds().filter(id => !badges[id]);
  fresh.forEach(id => { badges[id] = new Date().toISOString(); });
  if(fresh.length) saveBadges();
  return BADGE_DEFS.filter(b => fresh.includes(b.id));
}

function renderBadgesSection(container){
  initBadgesIfNeeded();
  const stats = computeBadgeStats();
  const unlockedCount = BADGE_DEFS.filter(b => badges[b.id]).length;
  const groups = [...new Set(BADGE_DEFS.map(b => b.group))];
  container.innerHTML = `<div class="badges-summary"><div class="badges-count"><strong>${unlockedCount}</strong> / ${BADGE_DEFS.length} desbloqueadas</div><div class="goal-bar"><div class="goal-fill" style="width:${Math.round(unlockedCount / BADGE_DEFS.length * 100)}%"></div></div></div>
    ${groups.map(g => `<div class="picker-section">${g}</div><div class="badge-grid">${BADGE_DEFS.filter(b => b.group === g).map(b => {
      const unlocked = !!badges[b.id], val = Math.min(b.value(stats), b.target);
      const fmtNum = (n)=> Math.floor(n).toLocaleString('es-AR');
      return `<div class="badge-card ${unlocked ? 'unlocked' : 'locked'}"><div class="badge-icon">${b.icon}</div><div class="badge-name">${b.name}</div><div class="badge-desc">${b.desc}</div>${unlocked ? `<div class="badge-date">${fmtDate(badges[b.id])}</div>` : `<div class="badge-progress"><div class="goal-bar"><div class="goal-fill" style="width:${Math.round(val / b.target * 100)}%"></div></div><span>${fmtNum(val)} / ${fmtNum(b.target)}</span></div>`}</div>`;
    }).join('')}</div>`).join('')}`;
}

// ================= Imagen para compartir =================
function canvasFitText(ctx, text, maxWidth){
  if(ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while(t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
  return t + '…';
}

function canvasRoundRect(ctx, x, y, w, h, r){
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

async function makeWorkoutImage(w, achievements = []){
  try{ if(document.fonts && document.fonts.ready) await document.fonts.ready; } catch(e){}
  const W = 1080, H = 1350, canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#E3823D';
  const display = "Oswald, 'Arial Narrow', Impact, sans-serif", body = "Inter, 'Segoe UI', system-ui, sans-serif";

  const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#0A0E17'); bg.addColorStop(1, '#172240');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(180, 120, 20, 180, 120, 620); glow.addColorStop(0, accent + '55'); glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 76px ${display}`; ctx.fillStyle = '#FFFFFF'; ctx.fillText('WASH', 70, 130);
  const washWidth = ctx.measureText('WASH').width; ctx.fillStyle = accent; ctx.fillText('ED', 70 + washWidth, 130);

  ctx.fillStyle = '#FFFFFF'; ctx.font = `700 64px ${body}`; ctx.fillText(canvasFitText(ctx, w.name, W - 140), 70, 250);
  ctx.fillStyle = '#8C9BB8'; ctx.font = `500 32px ${body}`;
  ctx.fillText(new Date(w.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), 70, 300);

  const vol = getWorkoutVolume(w), setCount = w.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.type !== 'W').length, 0);
  const tiles = [['TIEMPO', formatDuration(w.duration || 0)], ['VOLUMEN', `${toDisplayWeight(Math.round(vol)).toLocaleString('es-AR')} ${weightUnit}`], ['SERIES', String(setCount)], ['RÉCORDS', String(w.recordsCount || 0)]];
  const tileW = (W - 140 - 3 * 20) / 4;
  tiles.forEach(([label, value], i) => {
    const x = 70 + i * (tileW + 20), y = 350;
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; canvasRoundRect(ctx, x, y, tileW, 150, 24); ctx.fill();
    ctx.fillStyle = '#8C9BB8'; ctx.font = `600 22px ${body}`; ctx.textAlign = 'center'; ctx.fillText(label, x + tileW / 2, y + 48);
    ctx.fillStyle = accent; ctx.font = `700 ${value.length > 8 ? 34 : 44}px ${display}`; ctx.fillText(canvasFitText(ctx, value, tileW - 20), x + tileW / 2, y + 108);
    ctx.textAlign = 'left';
  });

  ctx.fillStyle = '#FFFFFF'; ctx.font = `700 34px ${body}`; ctx.fillText('Ejercicios', 70, 570);
  const recs = achievements.slice(0, 3);
  const shown = w.exercises.slice(0, recs.length ? 6 : 8);
  shown.forEach((ex, i) => {
    const y = 620 + i * 74, sets = ex.sets.filter(s => s.type !== 'W');
    const scores = sets.map(s => getSetScore(ex.name, s)), best = sets.length ? sets[scores.indexOf(Math.max(...scores))] : null;
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; canvasRoundRect(ctx, 70, y - 42, W - 140, 62, 16); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = `600 30px ${body}`; ctx.fillText(canvasFitText(ctx, ex.name, 560), 92, y);
    ctx.fillStyle = '#8C9BB8'; ctx.font = `500 28px ${body}`; ctx.textAlign = 'right';
    ctx.fillText(`${sets.length} serie${sets.length === 1 ? '' : 's'} · ${best ? fmtSetShort(ex.name, best) : '-'}`, W - 92, y); ctx.textAlign = 'left';
  });
  if(w.exercises.length > shown.length){ ctx.fillStyle = '#8C9BB8'; ctx.font = `500 26px ${body}`; ctx.fillText(`y ${w.exercises.length - shown.length} ejercicio${w.exercises.length - shown.length === 1 ? '' : 's'} más`, 92, 620 + shown.length * 74 - 8); }

  if(recs.length){
    const baseY = 1100;
    ctx.fillStyle = 'rgba(242,201,76,0.13)'; canvasRoundRect(ctx, 70, baseY - 50, W - 140, 60 + recs.length * 48, 22); ctx.fill();
    ctx.fillStyle = '#F2C94C'; ctx.font = `700 28px ${body}`; ctx.fillText('LOGROS', 96, baseY - 8);
    ctx.font = `500 27px ${body}`;
    recs.forEach((line, i) => ctx.fillText(canvasFitText(ctx, line.replace(/^✓\s*/, ''), W - 220), 96, baseY + 34 + i * 46));
  }
  ctx.fillStyle = '#5C6B85'; ctx.font = `500 26px ${body}`; ctx.textAlign = 'center'; ctx.fillText('Registrado con Washed', W / 2, H - 28); ctx.textAlign = 'left';

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

async function openWorkoutImagePreview(w, achievements = []){
  const blob = await makeWorkoutImage(w, achievements);
  if(!blob){ uiAlert('No se pudo generar la imagen en este navegador.', 'Error'); return; }
  const url = URL.createObjectURL(blob);
  const file = new File([blob], `washed-${new Date(w.date).toISOString().slice(0, 10)}.png`, { type: 'image/png' });
  const canShareFile = !!(navigator.canShare && navigator.canShare({ files: [file] }));
  const overlay = document.createElement('div'); overlay.className = 'dialog-overlay';
  overlay.innerHTML = `<div class="dialog-card share-preview" role="dialog" aria-modal="true"><h3>Compartir entrenamiento</h3><img src="${url}" alt="Resumen del entrenamiento"><div class="dialog-actions"><button type="button" class="btn-ghost" id="shareClose">Cerrar</button><button type="button" class="btn-ghost" id="shareDownload">Descargar</button>${canShareFile ? '<button type="button" class="btn-primary" id="shareSend">Compartir</button>' : ''}</div></div>`;
  document.body.appendChild(overlay);
  const close = ()=>{ unregisterOverlay(); URL.revokeObjectURL(url); if(document.body.contains(overlay)) document.body.removeChild(overlay); };
  const unregisterOverlay = registerOverlay(close);
  overlay.querySelector('#shareClose').addEventListener('click', close);
  overlay.querySelector('#shareDownload').addEventListener('click', ()=>{ downloadBlob(blob, file.name); showToast('Imagen descargada ✓'); });
  const send = overlay.querySelector('#shareSend');
  if(send) send.addEventListener('click', async ()=>{ try{ await navigator.share({ files: [file], title: w.name }); } catch(e){} });
  overlay.addEventListener('mousedown', (e)=>{ if(e.target === overlay) close(); });
}
