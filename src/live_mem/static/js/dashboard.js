/**
 * Live Memory - Dashboard (panneau gauche)
 */

function renderDashboard() {
    const el = document.getElementById('dashboardContent');
    if (app.allMode) return renderDashboardAll(el);
    const info = app.info;
    if (!info) { el.innerHTML = '<div class="empty-state">Loading…</div>'; return; }

    let h = '';

    // Espace
    h += `<div class="dash-section">
        <div class="dash-section-title">🏷️ Space</div>
        <div class="dash-row"><span>ID</span><span class="val">${esc(info.space_id||app.spaceId)}</span></div>
        <div class="dash-row"><span>Description</span><span class="val">${esc(info.description||'-')}</span></div>
        <div class="dash-row"><span>Owner</span><span class="val">${esc(info.owner||'-')}</span></div>
        <div class="dash-row"><span>Created</span><span class="val">${fmtDate(info.created_at)}</span></div>
    </div>`;

    // Consolidation
    h += `<div class="dash-section">
        <div class="dash-section-title">🔄 Consolidation</div>
        <div class="dash-row"><span>Last</span><span class="val">${fmtDate(info.last_consolidation)}</span></div>
        <div class="dash-row"><span>Count</span><span class="val">${info.consolidation_count||0}</span></div>
        <div class="dash-row"><span>Notes processed</span><span class="val">${info.total_notes_processed||0}</span></div>
    </div>`;

    // Stats live
    const notes = app.notes;
    h += `<div class="dash-section">
        <div class="dash-section-title">📊 Statistics</div>
        <div class="dash-row"><span>Live notes</span><span class="val">${notes.length}</span></div>
        <div class="dash-row"><span>Bank files</span><span class="val">${app.bankFiles.length}</span></div>
        <div class="dash-row"><span>Live size</span><span class="val">${fmtSize(info.live?.total_size)}</span></div>
        <div class="dash-row"><span>Bank size</span><span class="val">${fmtSize(info.bank?.total_size)}</span></div>
    </div>`;

    // Agents
    const ac = {};
    notes.forEach(n => { if(n.agent) ac[n.agent]=(ac[n.agent]||0)+1; });
    const agents = Object.entries(ac).sort((a,b)=>b[1]-a[1]);
    h += `<div class="dash-section">
        <div class="dash-section-title">👥 Agents (${agents.length})</div>
        <div class="dash-agents">
            ${agents.map(([n,c])=>{
                const col=getAgentColor(n);
                return `<span class="dash-agent-badge" style="background:${col}22;border-color:${col}55;color:${col}">● ${esc(n)} (${c})</span>`;
            }).join('')}
            ${agents.length===0?'<span style="color:#555;font-size:0.7rem">—</span>':''}
        </div>
    </div>`;

    // Catégories
    const cc = {};
    notes.forEach(n => { if(n.category) cc[n.category]=(cc[n.category]||0)+1; });
    const cats = Object.entries(cc).sort((a,b)=>b[1]-a[1]);
    h += `<div class="dash-section">
        <div class="dash-section-title">🏷️ Categories</div>
        ${cats.map(([c,cnt])=>{
            const s=getCatStyle(c); const pct=notes.length?Math.round(cnt/notes.length*100):0;
            return `<div class="dash-row"><span>${getCatIcon(c)} ${c}</span><span class="val" style="color:${s.text}">${cnt} (${pct}%)</span></div>`;
        }).join('')}
        ${cats.length===0?'<div style="color:#555;font-size:0.7rem;padding:0.1rem">—</div>':''}
    </div>`;

    // Rules
    if (info.rules) {
        h += `<div class="dash-section">
            <div class="dash-section-title">📐 Rules</div>
            <div class="dash-rules">${md(info.rules)}</div>
        </div>`;
    }

    // Graph Memory
    if (info.graph_memory && info.graph_memory.url) {
        const g = info.graph_memory;
        h += `<div class="dash-section">
            <div class="dash-section-title">🌉 Graph Memory</div>
            <div class="dash-row"><span>URL</span><span class="val" style="font-size:0.6rem">${esc(g.url)}</span></div>
            <div class="dash-row"><span>Memory</span><span class="val">${esc(g.memory_id||'-')}</span></div>
            <div class="dash-row"><span>Ontology</span><span class="val">${esc(g.ontology||'general')}</span></div>
            <div class="dash-row"><span>Last push</span><span class="val">${fmtDate(g.last_push)}</span></div>
            <div class="dash-row"><span>Pushes</span><span class="val">${g.push_count||0}</span></div>
        </div>`;
    }

    el.innerHTML = h;
}

// ═══════════════ ALL-SPACES OVERVIEW ═══════════════
// Cross-space dashboard: totals + global top agents/categories + a
// clickable per-space mini-list that jumps back into single-space mode.
function renderDashboardAll(el) {
    const spaces = app.allSpaces || [];
    const notes = app.notes || [];
    const sumLive = spaces.reduce((a,s) => a + (s.info?.live?.total_size || 0), 0);
    const sumBank = spaces.reduce((a,s) => a + (s.info?.bank?.total_size || 0), 0);
    const sumBankFiles = spaces.reduce((a,s) => a + (s.info?.bank?.file_count || 0), 0);
    const sumConsolidations = spaces.reduce((a,s) => a + (s.info?.consolidation_count || 0), 0);

    let h = '';

    h += `<div class="dash-section">
        <div class="dash-section-title">⊕ All spaces</div>
        <div class="dash-row"><span>Spaces</span><span class="val">${spaces.length}</span></div>
        <div class="dash-row"><span>Live notes</span><span class="val">${notes.length}</span></div>
        <div class="dash-row"><span>Bank files</span><span class="val">${sumBankFiles}</span></div>
        <div class="dash-row"><span>Consolidations</span><span class="val">${sumConsolidations}</span></div>
        <div class="dash-row"><span>Live size</span><span class="val">${fmtSize(sumLive)}</span></div>
        <div class="dash-row"><span>Bank size</span><span class="val">${fmtSize(sumBank)}</span></div>
    </div>`;

    // Global top agents (across all spaces).
    const ac = {};
    notes.forEach(n => { if(n.agent) ac[n.agent]=(ac[n.agent]||0)+1; });
    const agents = Object.entries(ac).sort((a,b)=>b[1]-a[1]);
    h += `<div class="dash-section">
        <div class="dash-section-title">👥 Top agents (${agents.length})</div>
        <div class="dash-agents">
            ${agents.slice(0,12).map(([n,c])=>{
                const col=getAgentColor(n);
                return `<span class="dash-agent-badge" style="background:${col}22;border-color:${col}55;color:${col}">● ${esc(n)} (${c})</span>`;
            }).join('')}
            ${agents.length===0?'<span style="color:#555;font-size:0.7rem">—</span>':''}
        </div>
    </div>`;

    // Global categories.
    const cc = {};
    notes.forEach(n => { if(n.category) cc[n.category]=(cc[n.category]||0)+1; });
    const cats = Object.entries(cc).sort((a,b)=>b[1]-a[1]);
    h += `<div class="dash-section">
        <div class="dash-section-title">🏷️ Categories</div>
        ${cats.map(([c,cnt])=>{
            const s=getCatStyle(c); const pct=notes.length?Math.round(cnt/notes.length*100):0;
            return `<div class="dash-row"><span>${getCatIcon(c)} ${c}</span><span class="val" style="color:${s.text}">${cnt} (${pct}%)</span></div>`;
        }).join('')}
        ${cats.length===0?'<div style="color:#555;font-size:0.7rem;padding:0.1rem">—</div>':''}
    </div>`;

    // Per-space mini-list — clickable rows jump back to single-space view.
    h += `<div class="dash-section">
        <div class="dash-section-title">🗂️ Per space</div>
        ${spaces.map(s => {
            const col = getSpaceColor(s.space_id);
            const last = s.last_consolidation
                ? fmtDate(s.last_consolidation)
                : '<span style="color:#777">never</span>';
            return `<div class="dash-row dash-space-row" data-space="${esc(s.space_id)}" title="Open ${esc(s.space_id)}" style="cursor:pointer">
                <span style="color:${col}">● ${esc(s.space_id)}</span>
                <span class="val">${s.note_count} · ${last}</span>
            </div>`;
        }).join('')}
        ${spaces.length===0?'<div style="color:#555;font-size:0.7rem">—</div>':''}
    </div>`;

    el.innerHTML = h;

    // Wire per-space click → switch dropdown + URL + load.
    el.querySelectorAll('.dash-space-row').forEach(row => {
        row.addEventListener('click', () => {
            const sid = row.dataset.space;
            const sel = document.getElementById('spaceSelect');
            if ([...sel.options].some(o => o.value === sid)) {
                sel.value = sid;
                setSpaceInUrl(sid);
                loadSpace(sid);
            }
        });
    });
}
