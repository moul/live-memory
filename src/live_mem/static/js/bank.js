/**
 * Live Memory - Bank (panneau bas-droit, onglets de fichiers)
 */

function renderBankTabs() {
    if (app.allMode) return;  // digest replaces the bank tab strip in All mode
    const tabsEl = document.getElementById('bankTabs');
    const countEl = document.getElementById('bankCount');
    const files = app.bankFiles;

    countEl.textContent = files.length > 0 ? `(${files.length})` : '';

    if (files.length === 0) {
        tabsEl.innerHTML = '';
        document.getElementById('bankContent').innerHTML = '<div class="empty-state">📘 No consolidated bank files</div>';
        return;
    }

    // LM2-01 fix : le `${name}` final dans innerHTML était NON ÉCHAPPÉ —
    // un nom de fichier malicieux (`<img src=x onerror=...>`) injecté par
    // un opérateur compromis (ou un LLM dérivant) exécutait du JS arbitraire
    // dans le navigateur de chaque admin ouvrant /live. Échappement systématique
    // + le serveur refuse maintenant les caractères dangereux (LM2-12 fix).
    // CSP fix : inline onclick="..." interdit par script-src 'self'.
    // On utilise addEventListener via data-filename + délégation.
    tabsEl.innerHTML = files.map(f => {
        const name = f.filename || f;
        const safeName = esc(name);
        const active = app.currentBankFile === name ? 'active' : '';
        return `<div class="bank-tab ${active}" data-filename="${safeName}">${safeName}</div>`;
    }).join('');

    // Attach click handlers (CSP-safe, no inline scripts)
    tabsEl.querySelectorAll('.bank-tab').forEach(tab => {
        tab.addEventListener('click', () => selectBank(tab.dataset.filename));
    });

    // Si aucun fichier sélectionné, sélectionner le premier
    if (!app.currentBankFile && files.length > 0) {
        selectBank(files[0].filename || files[0]);
    }
}

async function selectBank(filename) {
    app.currentBankFile = filename;

    // Mettre à jour les onglets actifs
    document.querySelectorAll('.bank-tab').forEach(t => {
        t.classList.toggle('active', t.textContent === filename);
    });

    const el = document.getElementById('bankContent');
    el.innerHTML = '<div class="empty-state">Loading…</div>';

    try {
        const r = await apiLoadBankFile(app.spaceId, filename);
        if (r.status === 'ok' && r.content) {
            el.innerHTML = `<div class="md-content">${md(r.content)}</div>`;
        } else {
            el.innerHTML = `<div class="empty-state">❌ ${esc(r.message||'Error')}</div>`;
        }
    } catch (e) {
        if (e.message !== 'Unauthorized') {
            el.innerHTML = `<div class="empty-state">❌ ${esc(e.message)}</div>`;
        }
    }
}

// ═══════════════ DIGEST (All-mode) ═══════════════
// Replaces the bank tab strip + content view with a stack of cards,
// one per space, showing the first paragraph of its activeContext.md.
// Card header is clickable → jump back to the space's single view.
function renderDigest() {
    if (!app.allMode) return;
    const el = document.getElementById('bankContent');
    const spaces = app.allSpaces || [];
    const digests = app.allDigests || {};

    if (spaces.length === 0) {
        el.innerHTML = '<div class="empty-state">No spaces to aggregate</div>';
        return;
    }

    const cards = spaces.map(s => {
        const sid = s.space_id;
        const col = getSpaceColor(sid);
        const desc = s.description ? esc(s.description) : '';
        const snippet = digests[sid]
            ? md(digests[sid])
            : '<span style="color:#777;font-size:0.75rem">No activeContext.md yet — never consolidated.</span>';
        return `<div class="digest-card" style="border-left-color:${col}">
            <div class="digest-header" data-space="${esc(sid)}" title="Open ${esc(sid)}">
                <span class="digest-space" style="color:${col}">🗂️ ${esc(sid)}</span>
                ${desc ? `<span class="digest-desc">${desc}</span>` : ''}
                <span class="digest-count">${s.note_count} live</span>
            </div>
            <div class="digest-body">${snippet}</div>
        </div>`;
    }).join('');

    el.innerHTML = `<div class="digest-list">${cards}</div>`;

    el.querySelectorAll('.digest-header').forEach(h => {
        h.addEventListener('click', () => {
            const sid = h.dataset.space;
            const sel = document.getElementById('spaceSelect');
            if ([...sel.options].some(o => o.value === sid)) {
                sel.value = sid;
                setSpaceInUrl(sid);
                loadSpace(sid);
            }
        });
    });
}
