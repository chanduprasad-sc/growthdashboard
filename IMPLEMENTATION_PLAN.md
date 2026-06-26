# B2B Dashboard Improvements — Detailed Implementation Plan

This plan covers all 12 user requests. Changes are organized by file with exact line references.

---

## 1. Custom Dropdown Filters Fix

### Problem
The native `<select>` elements have `style="display:none"` inline, but `populateFilterDropdowns()` can change options without the custom dropdown UI rebuilding its option list.

### Changes

**dashboard.css** — Add rule to hide native multi-selects:
```css
select.dropdown-select { display: none !important; }
```
This ensures that even if JS fails to apply `display:none`, the native selects never show as listboxes.

**dashboard.js** — `convertSelectToCustomDropdown()` (line 9757):
- After the existing `select.addEventListener('change', syncValue)` at line 9797, add a `MutationObserver` that watches the select's child list for changes (when `populateFilterDropdowns` rewrites `<option>` elements) and calls `rebuildOptions()` + `syncValue()` automatically.

---

## 2. Active Support Cohorts & RM Contacts Mapper Removal

### Changes

**dashboard.js** — `compileRawCache()` (lines 632–1508):
- **Line 740:** Remove `let rm_contacts_map = {};` declaration.
- **Line 812:** Remove the line `rm_contacts_map[cleaned_num] = { rm_name, broker_family, branch, poc };` inside the Call Tickets parsing block.
- **Line 914:** Remove the same `rm_contacts_map[cleaned_num] = ...` line inside the WhatsApp Chats parsing block.
- **Lines 1077–1092:** Remove the `let rm_info = rm_contacts_map[cleaned_caller]` lookup and all conditional logic that enriches calls from `rm_info`. Calls will no longer be mapped to RMs via phone number.

**dashboard.js** — `exportCohortToCSV()` (line 3997):
- Change the grouping key from:
  ```js
  const key = item.rm_name;
  ```
  to:
  ```js
  const key = `${item.rm_name}||${item.broker_family || '—'}||${item.branch || '—'}`;
  ```
- Update the `rmMap` structure to store broker and branch from the first item encountered for each composite key.

---

## 3. Cross-Attribute Explorer Matrix Sticky Toggle Relocation

### Changes

**index.html** (lines 454–508):
- Move the sticky toggle `<label>` block (lines 477–482) and the reset `<button>` (line 483) from inside `#exp-options-header` to immediately after the `<h3 class="card-title">Cross-Attribute Explorer Matrix</h3>` tag at line 456, before the `explorer-tabs` div.
- New structure:
  ```html
  <h3 class="card-title">Cross-Attribute Explorer Matrix</h3>
  <div style="display:flex; align-items:center; gap:12px; margin-top:4px;">
      <!-- sticky toggle label + reset button moved here -->
  </div>
  <p class="card-subtitle">...</p>
  ```

**dashboard.js** — Event listeners at lines 2129 and 2220 will continue to work since they use `document.getElementById()` and the IDs are unchanged. No JS changes needed for this item.

---

## 4. Chart.js Styling Standardization

### Changes

**dashboard.js** — Add a new global helper function (after the Chart interceptor IIFE at line 198):

```js
function getStandardChartOptions(type, showLegend = false) {
    const isDark = document.body.classList.contains('dark-mode');
    const THEME_COLORS = {
        border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        textSecondary: isDark ? '#94a3b8' : '#64748b'
    };

    const base = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: showLegend, labels: { color: THEME_COLORS.textSecondary, font: { family: "'SF Pro Text', sans-serif", size: 10 } } },
            tooltip: { backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)', titleColor: isDark ? '#f8fafc' : '#0f172a', bodyColor: THEME_COLORS.textSecondary, borderColor: THEME_COLORS.border, borderWidth: 1, padding: 10, cornerRadius: 6 }
        }
    };

    if (type === 'line' || type === 'bar') {
        base.scales = {
            x: { grid: { color: THEME_COLORS.border, drawBorder: false, drawTicks: false }, ticks: { color: THEME_COLORS.textSecondary, font: { size: 9 } } },
            y: { grid: { color: THEME_COLORS.border, drawBorder: false, drawTicks: false }, ticks: { color: THEME_COLORS.textSecondary, font: { size: 9 } } }
        };
    }
    return base;
}
```

- Apply this to all chart instantiations across Weekly Pulse (`renderPulseCharts()`), Main Dashboard (`renderMainDashboard()`), and Intelligence tabs by merging the returned options into each chart config.
- The Visual Control tab charts already use the interceptor theme, so this standardizes the remaining tabs.

---

## 5. Productivity Control Room QA Score Formatting

### Changes

**dashboard.js** — `setQAVal` function (line 6253):
- Change from:
  ```js
  el.innerText = pct !== null ? pct + '%' : '-';
  ```
  to:
  ```js
  el.innerText = pct !== null ? String(pct) : '-';
  ```
- The `/100` label is already hardcoded in the HTML badge cards (lines 963, 967, 971, 975, 979, 983), so removing the `%` suffix prevents the redundant `85%/100` display.

---

## 6. Predictive Capacity Planner & Workload Simulator Responsive Layout

### Changes

**index.html** — Replace inline grid styles:
- **Line 1333:** Change `style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 10px;"` to `class="predictive-planner-grid"`.
- **Line 1341:** Change `style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;"` to `class="simulator-grid"`.

**dashboard.css** — Add responsive grid classes:
```css
.predictive-planner-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-top: 10px;
}
.simulator-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
}
@media (max-width: 900px) {
    .predictive-planner-grid,
    .simulator-grid {
        grid-template-columns: 1fr;
    }
}
```

- Also style range input tracks with higher contrast:
```css
input[type="range"]::-webkit-slider-ranges-track {
    background: rgba(0, 0, 0, 0.1);
}
body.dark-mode input[type="range"]::-webkit-slider-ranges-track {
    background: rgba(255, 255, 255, 0.15);
}
input[type="range"]::-moz-range-track {
    background: rgba(0, 0, 0, 0.1);
}
body.dark-mode input[type="range"]::-moz-range-track {
    background: rgba(255, 255, 255, 0.15);
}
```

---

## 7. Intelligence Tab Empty Views & Sankey Canvas Bug Fixes

### Changes

**dashboard.js** — Add missing functions (before `renderIntelligenceDashboard()` at line 7498):

```js
function renderIntelLoopsSquished(dynamicLoops) {
    const container = document.getElementById('intel-repeat-loops');
    if (!container) return;
    if (!dynamicLoops || dynamicLoops.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No repeat loops detected.</p>';
        return;
    }
    // Render top 5 with expand/collapse
    const top = dynamicLoops.slice(0, 5);
    let html = '<div class="scrollbar-themed" style="max-height:250px;overflow-y:auto;">';
    html += '<table class="dashboard-table" style="font-size:0.82rem;"><thead><tr><th>RM</th><th>Broker</th><th>Branch</th><th>Issue</th><th style="text-align:right">Count</th></tr></thead><tbody>';
    top.forEach(l => {
        html += `<tr><td>${l.rm_name||'-'}</td><td>${l.broker_family||'-'}</td><td>${l.branch||'-'}</td><td>${l.issue||'-'}</td><td style="text-align:right;font-weight:700;color:var(--accent-red)">${l.repeat_count}</td></tr>`;
    });
    html += '</tbody></table></div>';
    if (dynamicLoops.length > 5) {
        html += `<p style="text-align:center;font-size:0.75rem;color:var(--text-muted);margin-top:8px;">+ ${dynamicLoops.length - 5} more loops</p>`;
    }
    container.innerHTML = html;
}

function renderIntelOutliersSquished(dynamicOutliers) {
    const container = document.getElementById('intel-outliers');
    if (!container) return;
    if (!dynamicOutliers || dynamicOutliers.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No outliers detected.</p>';
        return;
    }
    const top = dynamicOutliers.slice(0, 5);
    let html = '<div class="scrollbar-themed" style="max-height:250px;overflow-y:auto;">';
    html += '<table class="dashboard-table" style="font-size:0.82rem;"><thead><tr><th>RM</th><th>Broker</th><th>Branch</th><th style="text-align:right">Volume</th></tr></thead><tbody>';
    top.forEach(o => {
        html += `<tr><td>${o.rm_name||'-'}</td><td>${o.broker_family||'-'}</td><td>${o.branch||'-'}</td><td style="text-align:right;font-weight:700;color:var(--accent-yellow)">${o.volume||o.count||'-'}</td></tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}
```

**dashboard.js** — Fix Sankey canvas ID (line 5902):
- Change function signature from `function renderSankeyFlowCanvas(data)` to `function renderSankeyFlowCanvas(data, canvasId)`.
- Change line 5903 from `const canvas = document.getElementById('vc-chart-sankey-flow');` to `const canvas = document.getElementById(canvasId || 'vc-chart-sankey-flow');`.

**dashboard.js** — Update the intelligence tab call (line 7648):
- Change `renderSankeyFlowCanvas(data);` to `renderSankeyFlowCanvas(data, 'intel-sankey-canvas');`.

---

## 8. Monthly View Filtering Arrays Fix

### Changes

**dashboard.js** — `renderMonthlyView()` (lines 7788–7803):
- Replace the string-based filter checks with array-based checks:

```js
// Broker filter (multi-select array)
if (activeFilters.broker && !activeFilters.broker.includes('all')) {
    allInteractions = allInteractions.filter(d => activeFilters.broker.includes(d.broker_family));
    allCalls = allCalls.filter(c => activeFilters.broker.includes(c.broker_family));
}
// POC filter
if (activeFilters.poc && !activeFilters.poc.includes('all')) {
    allInteractions = allInteractions.filter(d => activeFilters.poc.includes(d.poc));
    allCalls = allCalls.filter(c => activeFilters.poc.includes(c.poc));
}
// Agent filter
if (activeFilters.agent && !activeFilters.agent.includes('all')) {
    allInteractions = allInteractions.filter(d => activeFilters.agent.includes(d.agent));
    allCalls = allCalls.filter(c => activeFilters.agent.includes(c.agent));
}
// Branch filter (remains single-select)
if (activeFilters.branch && activeFilters.branch !== 'all') {
    allInteractions = allInteractions.filter(d => d.branch === activeFilters.branch);
    allCalls = allCalls.filter(c => c.branch === activeFilters.branch);
}
```

- Also fix line 6386 in the agent breaks tab: change `activeFilters.broker !== 'all'` to `activeFilters.broker && !activeFilters.broker.includes('all')`.

---

## 9. Tickets & Chats Stage Count Hiding

### Changes

**dashboard.js** — `renderTicketsChatsView()` (lines 8663–8672):
- After computing `counts` (line 8661), filter the status pills and stat badges to only render those with count > 0 (plus 'all'):

```js
// Render stats bar — only show stages with count > 0
const statsBar = document.getElementById('tickets-stats-bar');
if (statsBar) {
    let barHtml = `<span class="tickets-stat-badge">Total: ${counts.all}</span>`;
    config.forEach(opt => {
        if (opt.value === 'all') return;
        if (counts[opt.value] > 0) {
            const color = STATUS_COLORS[opt.value] || '#6b7280';
            barHtml += `<span class="tickets-stat-badge" style="border-left: 3px solid ${color};">${opt.label}: ${counts[opt.value]}</span>`;
        }
    });
    statsBar.innerHTML = barHtml;
}
```

- Also filter the status pills themselves (line 8509) to only render pills for stages that have at least 1 record:

```js
statusPillsContainer.innerHTML = config.filter(opt => opt.value === 'all' || counts[opt.value] > 0).map(opt => {
    const isActive = opt.value === ticketsState.statusFilter ? 'active' : '';
    return `<button class="status-pill ${isActive}" data-status="${opt.value}">${opt.label}</button>`;
}).join('');
```

Note: The `counts` computation must be moved before the pills rendering, or the pills must be re-rendered after counts are computed. The simplest approach is to move the stats computation block (lines 8634–8661) to before the pills rendering (before line 8509).

---

## 10. AI Summary Narrative & Inter-Weekly Interaction Bar Chart

### Changes

**dashboard.js** — Upgrade `generateLocalFallbackSummary()` (line 4541):
- Rewrite to produce a premium executive HTML report with styled cards:

```js
function generateLocalFallbackSummary(commentsList) {
    const data = window.viewModel ? window.viewModel.interactions : commentsList;
    // ... existing aggregation logic for brokerCounts, branchCounts, issueCounts ...

    // Premium card-based layout
    return `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
            <div style="background:linear-gradient(135deg,rgba(31,122,224,0.08),rgba(16,185,129,0.08));border-left:4px solid var(--accent-primary);border-radius:12px;padding:16px;">
                <h4 style="margin:0 0 8px 0;color:var(--accent-primary);">📊 Data Scope</h4>
                <p style="margin:0;font-size:0.85rem;"><strong>${data.length}</strong> total interactions analyzed</p>
                <p style="margin:4px 0 0;font-size:0.85rem;"><strong>${commentsList.length}</strong> records with detailed comments</p>
            </div>
            <div style="background:linear-gradient(135deg,rgba(139,92,246,0.08),rgba(236,72,153,0.08));border-left:4px solid var(--accent-primary);border-radius:12px;padding:16px;">
                <h4 style="margin:0 0 8px 0;color:var(--purple);">🏢 Active Coverage</h4>
                <p style="margin:0;font-size:0.85rem;"><strong>${Object.keys(brokerCounts).length}</strong> unique broker families</p>
                <p style="margin:4px 0 0;font-size:0.85rem;"><strong>${Object.keys(branchCounts).length}</strong> unique branches</p>
            </div>
        </div>
        <h4>🔍 Key Observations</h4>
        <ul>... (enhanced bullet points) ...</ul>
        <h4>🏢 Top Broker Families</h4>
        <ul>${topBrokers.map(([b, c]) => `<li><strong>${b}:</strong> ${c} interactions (${Math.round(c/data.length*100)}%)</li>`).join('')}</ul>
        <h4>🏛️ Most Active Branches</h4>
        <ul>${branchesHTML}</ul>
        <h4>📋 Issue Clusters</h4>
        <ul>${issuesHTML}</ul>
        <h4>💬 Sample RM Comments</h4>
        <ul>${sampleComments}</ul>
        <h4>💡 Actionable Recommendations</h4>
        <ul>... (enhanced recommendations) ...</ul>
    `;
}
```

**dashboard.js** — Add channel mix chart in `renderKeyMetricsGrid()` (after line 3049):
- After populating the KPI values, add Chart.js rendering on `weekly-channel-mix-chart`:

```js
// Render channel mix mini bar chart
const channelMixCanvas = document.getElementById('weekly-channel-mix-chart');
if (channelMixCanvas) {
    const existingChart = Chart.getChart(channelMixCanvas);
    if (existingChart) existingChart.destroy();
    new Chart(channelMixCanvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Calls', 'WhatsApp', 'Emails'],
            datasets: [{
                data: [tkt, wa, mail],
                backgroundColor: ['rgba(31,122,224,0.7)', 'rgba(16,185,129,0.7)', 'rgba(244,63,94,0.7)'],
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: true } },
            scales: { x: { display: false }, y: { display: false } }
        }
    });
}
```

---

## 11. React Bits Components Adaptations

### BorderGlow Enhancement

**dashboard.js** — Upgrade the existing `BorderGlow` class (line 327):
- Enhance with cursor angle tracking and edge proximity calculations:

```js
class BorderGlow {
    static init() {
        const attachGlow = (card) => {
            if (card._hasGlow) return;
            card._hasGlow = true;

            // Add inner elements for glow effect
            const inner = document.createElement('div');
            inner.className = 'border-glow-inner';
            card.appendChild(inner);

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const angle = Math.atan2(y - centerY, x - centerX);
                const edgeDist = Math.min(x, y, rect.width - x, rect.height - y);
                const proximity = Math.max(0, 1 - edgeDist / 80);

                card.style.setProperty('--cursor-x', `${x}px`);
                card.style.setProperty('--cursor-y', `${y}px`);
                card.style.setProperty('--cursor-angle', `${angle}rad`);
                card.style.setProperty('--edge-proximity', String(proximity));
                card.classList.add('border-glow-active');
            });

            card.addEventListener('mouseleave', () => {
                card.style.setProperty('--edge-proximity', '0');
                card.classList.remove('border-glow-active');
            });
        };

        document.querySelectorAll('.visual-card, .kpi-card, .deepdive-chart-card, .intelligence-panel').forEach(attachGlow);
        const observer = new MutationObserver(() => {
            document.querySelectorAll('.visual-card, .kpi-card, .deepdive-chart-card, .intelligence-panel').forEach(attachGlow);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
}
```

### AnimatedList Enhancement

**dashboard.js** — Upgrade the existing `AnimatedList` class (line 316):
- Add entrance animation with scaling and opacity:

```js
class AnimatedList {
    static animate(containerElement) {
        if (!containerElement) return;
        const items = containerElement.children;
        Array.from(items).forEach((item, index) => {
            item.classList.add('animated-item-reveal');
            item.style.animationDelay = `${index * 40}ms`;
        });
    }
}
```

### CSS Additions

**dashboard.css** — Append BorderGlow and AnimatedList styles:

```css
/* BorderGlow Card Enhancement */
.border-glow-card { position: relative; overflow: hidden; }
.border-glow-inner {
    position: absolute; inset: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    background: radial-gradient(
        600px circle at var(--cursor-x, 50%) var(--cursor-y, 50%),
        rgba(31, 122, 224, 0.12),
        transparent 40%
    );
    z-index: 1;
}
.border-glow-active .border-glow-inner { opacity: 1; }

/* Edge light effect */
.edge-light {
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    background: conic-gradient(
        from var(--cursor-angle, 0deg),
        transparent 0%,
        rgba(31, 122, 224, 0.3) 10%,
        transparent 20%
    );
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 1px;
    z-index: 2;
}
.border-glow-active .edge-light { opacity: 1; }

/* AnimatedList Items */
.animated-item-reveal {
    opacity: 0;
    transform: scale(0.95);
    animation: itemReveal 0.3s ease forwards;
}
@keyframes itemReveal {
    to { opacity: 1; transform: scale(1); }
}
```

---

## Verification Plan

1. **Dropdowns:** Launch with `python3 -m http.server`, verify no native listboxes appear, test filter reset.
2. **Charts:** Compare Visual Control, Weekly Pulse, and Main Dashboard chart themes.
3. **Explorer:** Toggle sticky mode off → only one option selectable. Toggle on → multi-select works.
4. **Monthly View:** Select multiple brokers in filter → verify monthly table filters correctly.
5. **Tickets:** Verify stages with 0 count are hidden from pills and stats bar.
6. **Intelligence:** Navigate to Intelligence tab → verify no ReferenceError in console, Sankey renders on correct canvas.
7. **AI Narrative:** Click "Generate AI Narrative" → verify premium HTML fallback summary appears.
8. **QA Scores:** Check Productivity Control Room → QA badges show integer scores without `%`.
9. **Responsive:** Resize browser to <900px → planner grid and simulator grid collapse to single column.
10. **Glow Effect:** Hover over cards → verify border glow follows cursor.
