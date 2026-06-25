// ==========================================================================
// B2B GROWTH & SUPPORT ANALYTICS DASHBOARD - FRONTEND ENGINE
// ==========================================================================

// Global Chart Interceptor and Redesigner for Premium Financial Dashboard style
(function() {
    // Hex to RGBA local helper
    function localHexToRgba(hex, alpha) {
        hex = String(hex).replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        const r = parseInt(hex.substring(0, 2), 16) || 0;
        const g = parseInt(hex.substring(2, 4), 16) || 0;
        const b = parseInt(hex.substring(4, 6), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    if (window.Chart) {
        const OriginalChart = window.Chart;
        
        // Define color mapping helper
        function mapFinancialColors(colors, isDark, index) {
            const palette = isDark ? [
                '#3b82f6', // Premium Accent Blue (smallcase Brand Blue equivalent)
                '#10b981', // Positive Emerald
                '#ef4444', // Negative Coral
                '#8b5cf6', // Indigo Purple
                '#f59e0b', // Amber Yellow
                '#06b6d4', // Teal Cyan
                '#ec4899', // Pink Accent
                '#64748b'  // Slate Gray
            ] : [
                '#1d4ed8', // Dark Blue
                '#047857', // Forest Green
                '#b91c1c', // Crimson
                '#6d28d9', // Deep Violet
                '#b45309', // Dark Amber
                '#0e7490', // Cyan
                '#be185d', // Deep Pink
                '#475569'  // Slate Gray
            ];

            if (Array.isArray(colors)) {
                return colors.map((col, idx) => {
                    if (typeof col === 'string') {
                        const lowCol = col.toLowerCase();
                        if (lowCol.includes('14, 165, 233') || lowCol.includes('#0284c7')) return palette[0];
                        if (lowCol.includes('16, 185, 129') || lowCol.includes('#059669')) return palette[1];
                        if (lowCol.includes('244, 63, 94') || lowCol.includes('#e11d48') || lowCol.includes('ef4444')) return palette[2];
                        if (lowCol.includes('168, 85, 247') || lowCol.includes('#1f7ae0') || lowCol.includes('8b5cf6')) return palette[3];
                        if (lowCol.includes('20, 184, 166') || lowCol.includes('#d97706') || lowCol.includes('f59e0b')) return palette[4];
                    }
                    return col;
                });
            }

            if (typeof colors === 'string') {
                const lowCol = colors.toLowerCase();
                if (lowCol.includes('14, 165, 233') || lowCol === '#0284c7') return palette[0];
                if (lowCol.includes('16, 185, 129') || lowCol === '#059669') return palette[1];
                if (lowCol.includes('244, 63, 94') || lowCol === '#e11d48' || lowCol.includes('ef4444')) return palette[2];
                if (lowCol.includes('168, 85, 247') || lowCol === '#1f7ae0' || lowCol.includes('8b5cf6')) return palette[3];
                if (lowCol.includes('20, 184, 166') || lowCol === '#d97706' || lowCol.includes('f59e0b')) return palette[4];
            }
            return colors;
        }

        // Define config enhancer
        function financialChartConfig(config) {
            const isDark = document.body.classList.contains('dark-mode');
            
            if (!config.options) config.options = {};
            config.options.responsive = true;
            config.options.maintainAspectRatio = false;
            
            const textSecondary = isDark ? '#94a3b8' : '#64748b';
            const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
            const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
            const tooltipColor = isDark ? '#f8fafc' : '#0f172a';
            const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

            if (!config.options.plugins) config.options.plugins = {};
            
            // Custom tooltips
            config.options.plugins.tooltip = {
                enabled: true,
                backgroundColor: tooltipBg,
                titleColor: tooltipColor,
                bodyColor: textSecondary,
                borderColor: tooltipBorder,
                borderWidth: 1,
                padding: 10,
                cornerRadius: 6,
                titleFont: { family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", weight: '600', size: 12 },
                bodyFont: { family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", size: 11 },
                displayColors: true,
                boxWidth: 6,
                boxHeight: 6,
                boxPadding: 4,
                usePointStyle: true,
                ...config.options.plugins.tooltip
            };

            // Custom legend
            if (config.options.plugins.legend) {
                config.options.plugins.legend = {
                    display: config.options.plugins.legend.display !== false,
                    position: config.options.plugins.legend.position || 'top',
                    align: 'end',
                    labels: {
                        color: textSecondary,
                        boxWidth: 8,
                        boxHeight: 8,
                        padding: 16,
                        usePointStyle: true,
                        font: { family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", size: 10, weight: '500' }
                    },
                    ...config.options.plugins.legend
                };
            } else {
                config.options.plugins.legend = { display: false };
            }

            // Custom scales for cartesian
            if (config.options.scales) {
                Object.keys(config.options.scales).forEach(key => {
                    const scale = config.options.scales[key];
                    if (scale) {
                        scale.grid = {
                            display: scale.grid?.display !== false,
                            color: gridColor,
                            drawBorder: false,
                            drawTicks: false,
                            ...scale.grid
                        };
                        scale.ticks = {
                            color: textSecondary,
                            padding: 8,
                            font: { family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", size: 9 },
                            ...scale.ticks
                        };
                    }
                });
            }

            // Datasets
            if (config.data && config.data.datasets) {
                config.data.datasets.forEach((dataset, idx) => {
                    if (config.type === 'line' || dataset.type === 'line') {
                        dataset.tension = dataset.tension !== undefined ? dataset.tension : 0.35;
                        dataset.borderWidth = dataset.borderWidth !== undefined ? dataset.borderWidth : 2;
                        dataset.pointRadius = dataset.pointRadius !== undefined ? dataset.pointRadius : 0;
                        dataset.pointHoverRadius = dataset.pointHoverRadius !== undefined ? dataset.pointHoverRadius : 4;
                        dataset.pointHoverBorderWidth = 1;
                        
                        // Area Gradients
                        if (dataset.fill === true || dataset.fill === 'origin') {
                            dataset.backgroundColor = (context) => {
                                const chart = context.chart;
                                const {ctx, chartArea} = chart;
                                if (!chartArea) return null;
                                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                                const baseColor = dataset.borderColor || '#3b82f6';
                                gradient.addColorStop(0, localHexToRgba(baseColor, 0.25));
                                gradient.addColorStop(1, localHexToRgba(baseColor, 0.0));
                                return gradient;
                            };
                        }
                    }
                    
                    if (config.type === 'bar' || dataset.type === 'bar') {
                        dataset.borderRadius = dataset.borderRadius !== undefined ? dataset.borderRadius : 3;
                        dataset.borderWidth = 0;
                    }

                    if (dataset.backgroundColor) {
                        dataset.backgroundColor = mapFinancialColors(dataset.backgroundColor, isDark, idx);
                    }
                    if (dataset.borderColor) {
                        dataset.borderColor = mapFinancialColors(dataset.borderColor, isDark, idx);
                    }
                });
            }

            return config;
        }

        window.Chart = function(ctx, config) {
            const enhancedConfig = financialChartConfig(config);
            const inst = new OriginalChart(ctx, enhancedConfig);
            setTimeout(addChartExportButtons, 100);
            return inst;
        };
        Object.setPrototypeOf(window.Chart, OriginalChart);
        window.Chart.prototype = OriginalChart.prototype;
    }
})();

// Global Export Buttons Helper
function addChartExportButtons() {
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        if (canvas.id === 'intel-sankey-canvas' || canvas.id === 'agent-breaks-timeline') {
            return;
        }
        
        const card = canvas.closest('.deepdive-chart-card, .ai-report-chart-card, .chart-wrapper, .intelligence-panel, .dashboard-card, .weekly-pulse-card, .chart-card, .theme-card');
        if (!card) return;
        
        if (card.querySelector('.chart-export-btn')) return;
        
        const btn = document.createElement('button');
        btn.className = 'chart-export-btn';
        btn.title = 'Export Chart as Image';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
        `;
        
        if (getComputedStyle(card).position === 'static') {
            card.style.position = 'relative';
        }
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
                const chartInst = Chart.getChart(canvas);
                if (chartInst) {
                    const url = chartInst.toBase64Image();
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${canvas.id || 'chart'}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${canvas.id || 'chart'}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            } catch (err) {
                console.error('Failed to export chart:', err);
            }
        });
        
        card.appendChild(btn);
    });
}


// Global State
let rawData = null;
let currentTab = 'tab-weekly-pulse';
let activeFilters = {
    datePreset: 'week', // default is Current Week (Monday to Sunday)
    dateFrom: '',
    dateTo: '',
    channel: 'all', // Combined, Call Ticket, WhatsApp Chat
    broker: ['all'],
    poc: ['all'],
    agent: ['all'],
    hideSmallcaseRm: ['none'],
    branch: 'all',
    searchQuery: '',
    includeCareEmails: false
};

// Explorer Widget State
let explorerActiveTab = 'broker_family';
let explorerSelectedOption = null;

// Global chart references (for destroy/update lifecycle)
let charts = {
    weeklyComparison: null,
    pocContacts: null,
    pulseTrend: null,
    callStatusPie: null
};

let vcCharts = {
    callTicketsOverTime: null,
    whatsappOverTime: null,
    emailsOverTime: null,
    channelMix: null,
    topRMsCalls: null,
    topRMsWhatsApp: null,
    topRMsEmails: null,
    topBrokers: null,
    topIssuesCalls: null,
    topIssuesWhatsApp: null,
    topIssuesEmails: null,
    pocHotspots: null,
    dayOfWeek: null,
    monthlyTrend: null,
    repeatLoops: null,
    outlierScatter: null
};

function destroyVCCharts() {
    Object.keys(vcCharts).forEach(key => {
        if (vcCharts[key]) {
            vcCharts[key].destroy();
            vcCharts[key] = null;
        }
    });
}

function safeParseDate(dStr) {
    if (!dStr) return null;
    let s = String(dStr).trim();
    if (!s) return null;

    // Handle T indicator (standard ISO)
    if (s.includes('T')) {
        let d = new Date(s);
        if (!isNaN(d.getTime())) return d;
    }

    // Try standard constructor on cleaned space-to-T format
    let clean = s.replace(' ', 'T');
    let d = new Date(clean);
    if (!isNaN(d.getTime())) return d;

    // Parse DD/MM/YYYY or YYYY-MM-DD manually to be safe
    let datePart = s;
    let timePart = '00:00:00';
    if (s.includes(' ')) {
        const parts = s.split(' ');
        datePart = parts[0];
        timePart = parts[1] || '00:00:00';
    } else if (s.includes('T')) {
        const parts = s.split('T');
        datePart = parts[0];
        timePart = parts[1] || '00:00:00';
    }

    let year = new Date().getFullYear();
    let month = 0;
    let day = 1;

    if (datePart.includes('/')) {
        const parts = datePart.split('/');
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
                day = parseInt(parts[2], 10);
            } else {
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
                year = parseInt(parts[2], 10);
            }
        }
    } else if (datePart.includes('-')) {
        const parts = datePart.split('-');
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
                day = parseInt(parts[2], 10);
            } else {
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
                year = parseInt(parts[2], 10);
            }
        }
    }

    let hours = 0, minutes = 0, seconds = 0;
    if (timePart.includes(':')) {
        const parts = timePart.split(':');
        hours = parseInt(parts[0], 10) || 0;
        minutes = parseInt(parts[1], 10) || 0;
        seconds = parseInt(parts[2], 10) || 0;
    }

    d = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(d.getTime())) return d;

    return new Date(dStr);
}


function getDevRevLinkHTML(id, type) {
    if (!id || id === '-') return '-';
    const cleanId = String(id).trim();
    if (type === 'WhatsApp Chat' || cleanId.startsWith('CONV-')) {
        return `<a href="https://app.devrev.ai/smallcasebp/inbox/${cleanId}" target="_blank" onclick="event.stopPropagation();" class="devrev-id-link"><code>${cleanId}</code></a>`;
    } else if (type === 'Call Ticket' || type === 'Care Email' || cleanId.startsWith('TKT-') || cleanId.startsWith('REV-')) {
        return `<a href="https://app.devrev.ai/smallcasebp/works/${cleanId}" target="_blank" onclick="event.stopPropagation();" class="devrev-id-link"><code>${cleanId}</code></a>`;
    }
    return `<code>${cleanId}</code>`;
}

// Colors Matching CSS variables (Light Mode default)
const THEME_COLORS = {
    purple: '#1f7ae0',     // smallcase Brand Blue
    blue: '#0284c7',       // Sky Blue
    green: '#059669',      // Forest Green
    red: '#e11d48',        // Rose Red
    yellow: '#d97706',     // Amber Yellow
    orange: '#f97316',     // Vibrant Orange
    cyan: '#06b6d4',       // Teal Cyan
    pink: '#ec4899',       // Hot Pink
    gray: '#64748b',
    border: 'rgba(0, 0, 0, 0.07)', // light mode border
    textPrimary: '#0f172a', // light mode primary text
    textSecondary: '#334155' // light mode secondary text
};

// Hex to RGBA Utility for gradients & glow effects
function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Google Apps Script Web App Deployment URL Configuration
// Paste your deployed Google Apps Script Web App URL below (must end with /exec?action=getData)
const GOOGLE_SCRIPT_API_URL = "https://script.google.com/a/macros/smallcase.com/s/AKfycbzXb1cgZwP2RdEM8xvf9xaNk_ZHkoBAcAdUgZ1cxLWJ-naMBi5ABMvtHJ6s4RUEHsOj/exec";

function getCleanApiUrl(url) {
    if (!url) return "";
    url = url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) return "";
    try {
        const u = new URL(url);
        u.searchParams.set("action", "getData");
        return u.toString();
    } catch (e) {
        return "";
    }
}

// -------------------------------------------------------------
// CLIENT-SIDE PREPROCESSING COMPILER FOR LIVE GOOGLE SHEET DATA
// -------------------------------------------------------------

function cleanStr(val) {
    if (val === null || val === undefined) return "";
    return String(val).trim();
}

function canonicalBroker(brokerStr) {
    let s = cleanStr(brokerStr).toLowerCase();
    if (!s) return "NA";

    let norm = s.replace(/[^a-z0-9]/g, '');
    if (/^\d+$/.test(norm)) return "NA";

    if (s.includes('sbi')) {
        if (s.includes('mtf')) return "SBI MTF";
        return "SBI";
    } else if (s.includes('hdfc')) {
        if (s.includes('mtf')) return "HDFC MTF";
        if (s.includes('sky')) return "HDFCsky";
        return "HDFC";
    } else if (s.includes('axis')) {
        if (s.includes('mtf')) return "Axis MTF";
        return "Axis";
    } else if (s.includes('angel')) {
        return "Angel One";
    } else if (s.includes('fundz')) {
        return "Fundzbazar";
    } else if (s.includes('5paisa')) {
        return "5paisa";
    } else if (s.includes('kotak')) {
        return "Kotak Sec";
    } else if (s.includes('smc')) {
        return "SMC";
    } else if (s.includes('iifl') || s.includes('iiifl')) {
        return "IIFL";
    } else if (s.includes('nuvama')) {
        return "Nuvama";
    } else if (s.includes('fisdom')) {
        return "Fisdom";
    } else if (s.includes('trustline')) {
        return "Trustline";
    } else if (s.includes('kite')) {
        return "Kite";
    }

    const invalidKeywords = ['test', 'others', 'unknown', 'not shared', 'reported', 'gmail', 'yahoo', 'mail', 'kumar', 'arista', 'ap-south-1', 'shubham', 'wright', 'investorai', 'mutualfundpartner', 'itchotels'];
    if (invalidKeywords.some(kw => s.includes(kw))) return "NA";

    let isAlpha = /^[a-z]+$/.test(norm);
    if (isAlpha && norm.length < 20 && norm.length > 2) {
        return brokerStr.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    return "NA";
}

function normalizeBranch(branchStr) {
    let s = cleanStr(branchStr);
    if (!s) return "Not shared";
    s = s.toLowerCase().replace(/\xa0/g, ' ').replace(/\u200b/g, ' ');
    if (s.includes('|')) {
        let parts = s.split('|');
        s = parts[parts.length - 1];
    }
    s = s.replace(/\([^)]*\)/g, '');
    s = s.replace(/\b(main branch|branch|barnch|main)\b/g, ' ');
    s = s.replace(/[^a-z0-9]/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();

    const placeholders = new Set(['not shared', 'not clear', 'blank call', 'no response', 'none', 'na', 'n a', 'null', 'nan']);
    if (!s || placeholders.has(s)) return "Not shared";
    return s;
}

function cleanPhone(phoneStr) {
    let s = cleanStr(phoneStr);
    s = s.replace(/\D/g, '');
    if (s.length >= 10) return s.slice(-10);
    return s;
}

function parseHmsToSeconds(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return Math.floor(val);
    let s = String(val).trim();
    if (!s) return 0;
    if (s.includes(' ')) {
        s = s.split(' ').pop().trim();
    }
    if (s.includes('T')) {
        let parts = s.split('T');
        s = parts[1] || '';
    }
    // Remove millisecond and timezone parts if any, e.g. "00:02:00.000Z" -> "00:02:00"
    s = s.split('.')[0].replace('Z', '').trim();
    if (s.includes(':')) {
        let parts = s.split(':');
        try {
            if (parts.length === 3) {
                return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
            } else if (parts.length === 2) {
                return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            }
        } catch (e) { }
    }
    let parsed = parseFloat(s);
    return isNaN(parsed) ? 0 : Math.floor(parsed);
}

function cleanDate(val) {
    if (val === null || val === undefined) return null;
    let s = String(val).trim();
    if (!s) return null;
    try {
        if (s.includes('T')) {
            let sClean = s.replace('Z', '').split('.')[0];
            let parts = sClean.split('T');
            return `${parts[0]} ${parts[1]}`;
        }
        let d = safeParseDate(s);
        if (d && !isNaN(d.getTime())) {
            let y = d.getFullYear();
            let m = String(d.getMonth() + 1).padStart(2, '0');
            let day = String(d.getDate()).padStart(2, '0');
            let h = String(d.getHours()).padStart(2, '0');
            let min = String(d.getMinutes()).padStart(2, '0');
            let sec = String(d.getSeconds()).padStart(2, '0');
            return `${y}-${m}-${day} ${h}:${min}:${sec}`;
        }
    } catch (e) { }
    return s;
}

function compileRawCache(cache) {
    console.log("Compiling raw cache...");

    function analyzeSentimentAndCSAT(text, title = '') {
        const txt = ((text || '') + ' ' + (title || '')).toLowerCase();
        let score = 3; // Neutral default
        let label = 'Neutral';

        const positiveWords = ['thank', 'thanks', 'resolved', 'great', 'awesome', 'done', 'good', 'helped', 'perfect', 'appreciate', 'fixed', 'solved'];
        const negativeWords = ['fail', 'error', 'breach', 'issue', 'wrong', 'delay', 'frustrated', 'failed', 'problem', 'missed', 'not working', 'slow', 'broken', 'unhappy', 'poor', 'bad'];

        let posCount = 0;
        let negCount = 0;

        positiveWords.forEach(w => { if (txt.includes(w)) posCount++; });
        negativeWords.forEach(w => { if (txt.includes(w)) negCount++; });

        if (posCount > negCount) {
            label = 'Positive';
            score = posCount - negCount >= 2 ? 5 : 4;
        } else if (negCount > posCount) {
            label = 'Negative';
            score = negCount - posCount >= 2 ? 1 : 2;
        }

        return { label, csat: score };
    }

    function cleanScore(val) {
        if (val === undefined || val === null || val === "") return null;
        let p = parseFloat(val);
        return isNaN(p) ? null : p;
    }

    // 1. Parse POC-Branch mapping
    let poc_mappings = [];
    if (cache.pocBranches && Array.isArray(cache.pocBranches)) {
        let deduped = {};
        cache.pocBranches.forEach(m => {
            let norm_b = normalizeBranch(m.Branch);
            let canon_b = canonicalBroker(m.Broker);
            let key = (m.POC + "||" + norm_b + "||" + canon_b).toLowerCase();
            if (!deduped[key]) {
                let mapping = {
                    "POC": m.POC,
                    "BranchRaw": m.Branch,
                    "BranchNorm": norm_b,
                    "BranchKey": norm_b.replace(/\s+/g, ""),
                    "Channel": m.Channel || "",
                    "BrokerRaw": m.Broker || "",
                    "BrokerFamily": canon_b
                };
                deduped[key] = mapping;
                poc_mappings.push(mapping);
            }
        });
    }

    function matchPoc(brokerFamily, normalizedBranch) {
        if (normalizedBranch === "Not shared") return "Not shared";
        if (normalizedBranch === "smallcase") return "smallcase";
        let branchKey = normalizedBranch.replace(/\s+/g, "");

        // Step 1: Direct Broker-Branch Pair Match
        for (let m of poc_mappings) {
            if (m.BrokerFamily === brokerFamily && m.BranchKey === branchKey) {
                return m.POC;
            }
        }

        // Step 2: Exact Branch Match
        for (let m of poc_mappings) {
            if (m.BranchKey === branchKey) {
                return m.POC;
            }
        }

        // Step 3: Substring Match
        for (let m of poc_mappings) {
            let m_bkey = m.BranchKey;
            if (branchKey.includes(m_bkey) || m_bkey.includes(branchKey)) {
                return m.POC;
            }
        }

        // Step 4: Fuzzy Token-Overlap Match
        let ticketTokens = normalizedBranch.split(" ");
        let bestPoc = null;
        let bestScore = 0;

        for (let m of poc_mappings) {
            let candTokens = m.BranchNorm.split(" ");
            let overlapTokens = ticketTokens.filter(t => candTokens.includes(t));
            let overlap = overlapTokens.length;
            if (overlap >= 2) {
                let score = overlap / Math.max(1, Math.min(candTokens.length, ticketTokens.length));
                if (score >= 0.75 && score > bestScore) {
                    bestScore = score;
                    bestPoc = m.POC;
                }
            }
        }

        if (bestPoc) return bestPoc;
        return "No POC";
    }

    let tickets = [];
    let rm_contacts_map = {};
    let rm_phone_lookup = {};

    // 2. Parse Call Tickets
    if (cache.callTkts && Array.isArray(cache.callTkts)) {
        let filteredTkts = cache.callTkts.filter(r => cleanStr(r.Subtype || r.subtype).toLowerCase() === 'dealer_support');

        filteredTkts.forEach(row => {
            let work_id = cleanStr(row["Work ID"]);
            let title = cleanStr(row["Title"]);
            let created_date = cleanDate(row["Created date"]);
            let close_date = cleanDate(row["Close date"]);
            let owner = cleanStr(row["Owner[0]"]);
            let rm_name = cleanStr(row["RM Name"]);
            let rm_num = cleanStr(row["RM Number"]);
            if (rm_name && rm_name !== 'NA' && rm_num) {
                rm_phone_lookup[rm_name] = rm_num;
            }
            let stage = cleanStr(row["Stage"]);
            let severity = cleanStr(row["Severity.label"]);
            let sla_status = cleanStr(row["SLA Name.status"]);
            let qa_score = cleanStr(row["Overall Score (45)"]);

            let broker_name = cleanStr(row["Broker Name[0]"]) || cleanStr(row["RM Broker Name"]) || cleanStr(row["Broker ID (B2B)"]);
            let branch_loc = cleanStr(row["Branch/Location"]);
            let comments = cleanStr(row["Comments"]) || title;
            let rec_url = cleanStr(row["Recording URL"]);

            let broker_fam = canonicalBroker(broker_name);
            let norm_branch = normalizeBranch(branch_loc);
            let poc = matchPoc(broker_fam, norm_branch);

            let title_lower = title.toLowerCase();
            let call_status = "other";
            if (title_lower.includes("missed call")) {
                call_status = "missed";
            } else if (title_lower.includes("aoh call")) {
                call_status = "aoh";
            } else if (title_lower.includes("answered call")) {
                call_status = "answered";
            }

            // Parse SLA response and resolution times (in minutes, convert to seconds)
            let sla_frt = null;
            let sla_rt = null;
            let sla_frt_status = null;
            let sla_rt_status = null;
            for (let i = 0; i < 5; i++) {
                let metric_col = `Metric Name[${i}]`;
                let comp_col = `Completed In[${i}]`;
                let status_col = `Metric Status[${i}]`;
                if (row[metric_col] !== undefined && row[comp_col] !== undefined) {
                    let m_name = String(row[metric_col]).trim().toLowerCase();
                    let comp_val = parseFloat(row[comp_col]);
                    let m_status = row[status_col] ? String(row[status_col]).trim().toUpperCase() : null;
                    
                    if (m_name === 'first response time' || m_name === 'first_response_time') {
                        if (!isNaN(comp_val)) {
                            sla_frt = Math.round(comp_val * 60);
                            sla_frt_status = m_status;
                        }
                    } else if (m_name === 'resolution time' || m_name === 'resolution_time') {
                        if (!isNaN(comp_val)) {
                            sla_rt = Math.round(comp_val * 60);
                            sla_rt_status = m_status;
                        }
                    }
                }
            }

            let cleaned_num = cleanPhone(rm_num);
            if (cleaned_num && rm_name) {
                rm_contacts_map[cleaned_num] = {
                    "rm_name": rm_name,
                    "broker_family": broker_fam,
                    "branch": norm_branch,
                    "poc": poc
                };
            }

            let analysis = analyzeSentimentAndCSAT(comments, title);
            tickets.push({
                "id": work_id,
                "type": "Call Ticket",
                "date": created_date,
                "close_date": close_date,
                "title": title,
                "rm_name": rm_name || "NA",
                "rm_number": rm_num || "—",
                "broker_family": broker_fam,
                "branch": norm_branch,
                "poc": poc,
                "channel": "Voice Call",
                "issue": cleanStr(row["Issue Type (B2B)"]) || "General",
                "sub_issue": cleanStr(row["Sub Issue Type (B2B)"]) || "General",
                "agent": owner || "Unassigned",
                "stage": stage || "New",
                "comments": comments.length > 300 ? comments.slice(0, 300) : comments,
                "severity": severity || "Medium",
                "sla_status": sla_status || "MET",
                "qa_score": qa_score,
                "recording_url": rec_url,
                "call_status": call_status,
                "resolution_time": sla_rt, // Keep for backwards compatibility
                "qa_greeting": cleanScore(row["Opening & Greetings (5)"]),
                "qa_grammar": cleanScore(row["Grammar (5)"]),
                "qa_acknowledgement": cleanScore(row["Acknowledgement and Assurance (15)"]),
                "qa_sla": cleanScore(row["Maintaining SLA (15)"]),
                "qa_assistance": cleanScore(row["Offer further assistance & Closing statement (5)"]),
                "qa_overall": cleanScore(row["Overall Score (45)"]),
                "sla_frt": sla_frt,
                "sla_rt": sla_rt,
                "sla_frt_status": sla_frt_status,
                "sla_rt_status": sla_rt_status,
                "sentiment": analysis.label,
                "csat": analysis.csat
            });
        });
    }

    // 3. Parse WhatsApp Chats
    let chats = [];
    if (cache.whatsapp && Array.isArray(cache.whatsapp)) {
        let filteredChats = cache.whatsapp.filter(r => cleanStr(r.Subtype || r.subtype).toLowerCase() === 'dealer_support');

        filteredChats.forEach(row => {
            let conv_id = cleanStr(row["ID"]);
            let last_msg = cleanStr(row["Last Message"]);
            let created_date = cleanDate(row["Created date"]);
            let owner = cleanStr(row["Owners[0]"]);
            let rm_name = cleanStr(row["RM Name"]);
            let rm_num = cleanStr(row["RM Number"]);
            if (rm_name && rm_name !== 'NA' && rm_num) {
                rm_phone_lookup[rm_name] = rm_num;
            }
            let stage = cleanStr(row["Stage"]);

            let broker_name = cleanStr(row["RM Broker Name"]) || cleanStr(row["Broker ID (B2B)"]);
            let branch_loc = cleanStr(row["Branch/Location"]);
            let comments = cleanStr(row["Comments"]) || last_msg;

            let broker_fam = canonicalBroker(broker_name);
            let norm_branch = normalizeBranch(branch_loc);
            let poc = matchPoc(broker_fam, norm_branch);

            let sla_frt = null;
            let sla_rt = null;
            let sla_frt_status = null;
            let sla_rt_status = null;
            for (let i = 0; i < 5; i++) {
                let metric_col = `Metric Name[${i}]`;
                let comp_col = `Completed In[${i}]`;
                let status_col = `Metric Status[${i}]`;
                if (row[metric_col] !== undefined && row[comp_col] !== undefined) {
                    let m_name = String(row[metric_col]).trim().toLowerCase();
                    let comp_val = parseFloat(row[comp_col]);
                    let m_status = row[status_col] ? String(row[status_col]).trim().toUpperCase() : null;
                    
                    if (m_name === 'first response time' || m_name === 'first_response_time') {
                        if (!isNaN(comp_val)) {
                            sla_frt = Math.round(comp_val * 60); // minutes to seconds
                            sla_frt_status = m_status;
                        }
                    } else if (m_name === 'resolution time' || m_name === 'resolution_time') {
                        if (!isNaN(comp_val)) {
                            sla_rt = Math.round(comp_val * 60); // minutes to seconds
                            sla_rt_status = m_status;
                        }
                    }
                }
            }

            let cleaned_num = cleanPhone(rm_num);
            if (cleaned_num && rm_name) {
                rm_contacts_map[cleaned_num] = {
                    "rm_name": rm_name,
                    "broker_family": broker_fam,
                    "branch": norm_branch,
                    "poc": poc
                };
            }

            let analysis = analyzeSentimentAndCSAT(comments, `Chat with ${rm_name || 'RM'}`);
            chats.push({
                "id": conv_id,
                "type": "WhatsApp Chat",
                "date": created_date,
                "close_date": null,
                "title": `Chat with ${rm_name || 'RM'}`,
                "rm_name": rm_name || "NA",
                "rm_number": rm_num || "—",
                "broker_family": broker_fam,
                "branch": norm_branch,
                "poc": poc,
                "channel": "WhatsApp",
                "issue": cleanStr(row["Issue Type (B2B)"]) || "General",
                "sub_issue": cleanStr(row["Sub Issue Type (B2B)"]) || "General",
                "agent": owner || "Unassigned",
                "stage": stage || "Closed",
                "comments": comments.length > 300 ? comments.slice(0, 300) : comments,
                "severity": "Medium",
                "sla_status": sla_frt_status || sla_rt_status || "MET",
                "qa_score": "",
                "recording_url": "",
                "resolution_time": sla_rt,
                "sentiment": analysis.label,
                "csat": analysis.csat,
                "sla_frt": sla_frt,
                "sla_rt": sla_rt,
                "sla_frt_status": sla_frt_status || "MET",
                "sla_rt_status": sla_rt_status || "MET"
            });
        });
    }

    // 4. Parse Care Emails
    let emails = [];
    if (cache.careEmails && Array.isArray(cache.careEmails)) {
        let group_col = cache.careEmails.some(r => r.hasOwnProperty('Group')) ? 'Group' : 'group';
        let filteredEmails = cache.careEmails;
        if (cache.careEmails.some(r => r.hasOwnProperty(group_col))) {
            filteredEmails = cache.careEmails.filter(r => cleanStr(r[group_col]).toLowerCase() === 'care emails');
        }

        filteredEmails.forEach(row => {
            let work_id = cleanStr(row["Work ID"]);
            let title = cleanStr(row["Title"]);
            let created_date = cleanDate(row["Created date"]);
            let close_date = cleanDate(row["Close date"]);
            let owner = cleanStr(row["Owner[0]"]);
            let reported_by = cleanStr(row["Reported by[0]"]);
            let rm_num = reported_by ? (rm_phone_lookup[reported_by] || "—") : "—";
            let stage = cleanStr(row["Stage"]);
            let sentiment = cleanStr(row["Sentiment.label"]);

            let broker_name = cleanStr(row["Broker Name[0]"]) || cleanStr(row["Account.display_name"]);
            let body = cleanStr(row["Body"]) || title;

            let broker_fam = canonicalBroker(broker_name);
            let norm_branch = "Not shared";
            let poc = matchPoc(broker_fam, norm_branch);

            // Parse SLA response and resolution times (in minutes, convert to seconds)
            let sla_frt = null;
            let sla_rt = null;
            let sla_frt_status = null;
            let sla_rt_status = null;
            for (let i = 0; i < 3; i++) {
                let metric_col = `Metric Name[${i}]`;
                let comp_col = `Completed In[${i}]`;
                let status_col = `Metric Status[${i}]`;
                if (row[metric_col] !== undefined && row[comp_col] !== undefined) {
                    let m_name = String(row[metric_col]).trim().toLowerCase();
                    let comp_val = parseFloat(row[comp_col]);
                    let m_status = row[status_col] ? String(row[status_col]).trim().toUpperCase() : null;
                    
                    if (m_name === 'first response time' || m_name === 'first_response_time') {
                        if (!isNaN(comp_val)) {
                            sla_frt = Math.round(comp_val * 60);
                            sla_frt_status = m_status;
                        }
                    } else if (m_name === 'resolution time' || m_name === 'resolution_time') {
                        if (!isNaN(comp_val)) {
                            sla_rt = Math.round(comp_val * 60);
                            sla_rt_status = m_status;
                        }
                    }
                }
            }

            let analysis = analyzeSentimentAndCSAT(body, title);
            let rawQA = cleanScore(row["Overall Score (45)"]);
            let calculatedCSAT = (rawQA !== null && !isNaN(rawQA)) ? Math.round((rawQA / 45) * 4) + 1 : analysis.csat;
            emails.push({
                "id": work_id,
                "type": "Care Email",
                "date": created_date,
                "close_date": close_date,
                "title": title,
                "rm_name": reported_by || "NA",
                "rm_number": rm_num || "—",
                "broker_family": broker_fam,
                "account_display_name": cleanStr(row["Account.display_name"]) || broker_fam || "Unknown",
                "branch": norm_branch,
                "poc": poc,
                "channel": "Email",
                "issue": cleanStr(row["Issue"]) || "General",
                "sub_issue": cleanStr(row["Sub-Issue"]) || "General",
                "agent": owner || "Unassigned",
                "stage": stage || "Closed",
                "comments": body.length > 300 ? body.slice(0, 300) : body,
                "severity": "Medium",
                "sla_status": "MET",
                "qa_score": cleanStr(row["Overall Score (45)"]),
                "recording_url": "",
                "sentiment": sentiment || analysis.label,
                "csat": calculatedCSAT,
                "qa_greeting": cleanScore(row["Opening & Greetings (5)"]),
                "qa_grammar": cleanScore(row["Grammar (5)"]),
                "qa_acknowledgement": cleanScore(row["Acknowledgement and Assurance (15)"]),
                "qa_sla": cleanScore(row["Maintaining SLA (15)"]),
                "qa_assistance": cleanScore(row["Offer further assistance & Closing statement (5)"]),
                "qa_overall": rawQA,
                "sla_frt": sla_frt,
                "sla_rt": sla_rt,
                "sla_frt_status": sla_frt_status,
                "sla_rt_status": sla_rt_status
            });
        });
    }

    // 5. Parse Ozonetel Calls
    let calls = [];
    let matched_calls_count = 0;
    if (cache.calls && Array.isArray(cache.calls)) {
        cache.calls.forEach(row => {
            let ucid = cleanStr(row["UCID"]);
            let call_id = cleanStr(row["Call ID"]);
            let caller_no = cleanStr(row["Caller No"]);

            let call_date_val = cleanStr(row["Call Date"]).split(' ')[0];
            let start_time_val = cleanStr(row["Start Time"]);
            let call_date;
            if (call_date_val && start_time_val) {
                let time_part = start_time_val.includes(' ') ? start_time_val.split(' ')[1] : start_time_val;
                call_date = cleanDate(`${call_date_val} ${time_part}`);
            } else {
                call_date = cleanDate(row["Call Date"]);
            }

            let agent = cleanStr(row["Agent"]);
            let status = cleanStr(row["Status"]);
            let duration = parseHmsToSeconds(row["Duration"] || 0);
            let rec_url = cleanStr(row["Recording URL"]);
            let disposition = cleanStr(row["Disposition"]);
            let call_event = cleanStr(row["Call Event"]);

            let cleaned_caller = cleanPhone(caller_no);
            let rm_info = rm_contacts_map[cleaned_caller];
            let rm_name, broker_fam, branch, poc;

            if (rm_info) {
                rm_name = rm_info.rm_name;
                broker_fam = rm_info.broker_family;
                branch = rm_info.branch;
                poc = rm_info.poc;
                matched_calls_count++;
            } else {
                rm_name = "Unknown";
                broker_fam = "Unknown";
                branch = "Not shared";
                poc = "No POC";
            }

            let talk_time = parseHmsToSeconds(row["Talk Time"] || 0);
            let hold_time = parseHmsToSeconds(row["Hold Time"] || 0);
            let queue_time = parseHmsToSeconds(row["Queue Time"] || 0);
            let time_to_answer = parseHmsToSeconds(row["Time to Answer"] || 0);
            let call_type = cleanStr(row["Call Type"] || row["call_type"]);
            let dial_status = cleanStr(row["Dial Status"] || row["dial_status"]);
            let agent_dial_status = cleanStr(row["Agent Dial Status"] || row["agent_dial_status"]);
            let raw_call_event = cleanStr(row["Call Event"] || row["call_event"]);

            calls.push({
                "id": call_id || ucid,
                "type": "Voice Call",
                "date": call_date,
                "caller_no": caller_no,
                "rm_name": rm_name,
                "broker_family": broker_fam,
                "branch": branch,
                "poc": poc,
                "channel": "Voice Call",
                "issue": "Voice Call",
                "sub_issue": disposition || raw_call_event || "General",
                "agent": agent || "System",
                "stage": status || "Answered",
                "comments": `Voice call log: ${disposition} / ${raw_call_event}`,
                "duration": duration,
                "recording_url": rec_url,
                "talk_time": talk_time,
                "hold_time": hold_time,
                "queue_time": queue_time,
                "time_to_answer": time_to_answer,
                "call_type": call_type,
                "dial_status": dial_status,
                "agent_dial_status": agent_dial_status,
                "call_event": raw_call_event
            });
        });
    }

    // 6. Parse Agent Breaks
    let agent_breaks = [];
    if (cache.breaks && Array.isArray(cache.breaks)) {
        cache.breaks.forEach(row => {
            let date_val = cleanDate(row["Date"]);
            let agent_name = cleanStr(row["Agent Name"]);
            let break_type = cleanStr(row["Breaks"]);
            let total_break = cleanStr(row["Total Break Time"]);

            let seconds = 0;
            if (total_break && total_break.includes(':')) {
                let parts = total_break.split(':');
                try {
                    if (parts.length === 3) {
                        seconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
                    } else if (parts.length === 2) {
                        seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                    }
                } catch (e) { }
            }

            agent_breaks.push({
                "date": date_val,
                "agent_name": agent_name,
                "break_type": break_type,
                "duration_str": total_break,
                "duration_sec": seconds
            });
        });
    }

    let support_interactions = [...tickets, ...chats, ...emails];

    // 6.5. POST-PROCESSING: TIME-WINDOWED JOINS & METRICS COMPILATION
    console.log("Running post-processing time-windowed joins & metrics compilation...");

    // Group calls by cleaned phone number
    let calls_by_phone = {};
    calls.forEach(call => {
        let phone = cleanPhone(call.caller_no);
        if (phone) {
            if (!calls_by_phone[phone]) {
                calls_by_phone[phone] = [];
            }
            calls_by_phone[phone].push(call);
        }
    });

    Object.keys(calls_by_phone).forEach(phone => {
        calls_by_phone[phone].sort((a, b) => new Date(a.date.replace(" ", "T")) - new Date(b.date.replace(" ", "T")));
    });

    // Match Ozonetel Call to DevRev Ticket
    tickets.forEach(tkt => {
        let phone = cleanPhone(tkt.rm_num || tkt.rm_number || "");
        if (!phone) {
            phone = cleanPhone(tkt.rm_name);
        }
        if (!phone) return;
        
        let tkt_dt = tkt.date ? new Date(tkt.date.replace(" ", "T")) : null;
        if (!tkt_dt || isNaN(tkt_dt.getTime())) return;
        
        let candidate_calls = calls_by_phone[phone] || [];
        if (candidate_calls.length === 0) return;
        
        let best_call = null;
        let min_diff = 9999999;
        
        candidate_calls.forEach(call => {
            let call_dt = call.date ? new Date(call.date.replace(" ", "T")) : null;
            if (!call_dt || isNaN(call_dt.getTime())) return;
            let diff = Math.abs((tkt_dt - call_dt) / 1000); // difference in seconds
            if (diff <= 20 && diff < min_diff) {
                min_diff = diff;
                best_call = call;
            }
        });
        
        if (best_call) {
            tkt.call_ucid = best_call.id;
            tkt.call_duration = best_call.duration;
            tkt.call_talk_time = best_call.talk_time;
            tkt.call_hold_time = best_call.hold_time;
            tkt.call_queue_time = best_call.queue_time;
            tkt.call_time_to_answer = best_call.time_to_answer;
            tkt.call_agent = best_call.agent;
            tkt.call_status = best_call.stage;
            tkt.recording_url = best_call.recording_url;
            
            // Missed Call callback matching
            let is_missed = tkt.title.toLowerCase().includes("missed call") || best_call.stage.toLowerCase() === "missed" || best_call.stage.toLowerCase() === "unanswered";
            if (is_missed) {
                let best_callback = null;
                let initial_call_dt = new Date(best_call.date.replace(" ", "T"));
                
                for (let call of candidate_calls) {
                    let ctype = String(call.call_type || "").toLowerCase();
                    if (ctype.includes("progressive") || ctype.includes("callback")) {
                        let call_dt = new Date(call.date.replace(" ", "T"));
                        let diff = (call_dt - initial_call_dt) / 1000; // in seconds
                        if (diff > 0 && diff <= 900) {
                            best_callback = call;
                            break;
                        }
                    }
                }
                
                if (best_callback) {
                    tkt.recording_url = best_callback.recording_url;
                    tkt.callback_ucid = best_callback.id;
                    tkt.callback_duration = best_callback.duration;
                    tkt.callback_talk_time = best_callback.talk_time;
                    tkt.callback_agent = best_callback.agent;
                    tkt.callback_status = best_callback.stage;
                }
            }
        }
    });

    // Aggregate Agent breaks and Occupancy
    let agent_summary_map = {};
    agent_breaks.forEach(b => {
        let agent = b.agent_name;
        if (!agent || agent === "NA") return;
        let date_str = b.date ? b.date.split(" ")[0] : "";
        if (!date_str) return;
        
        if (!agent_summary_map[agent]) {
            agent_summary_map[agent] = {
                agent_name: agent,
                active_days: new Set(),
                total_breaks_sec: 0,
                break_types: {}
            };
        }
        let summary = agent_summary_map[agent];
        summary.active_days.add(date_str);
        summary.total_breaks_sec += b.duration_sec;
        
        let btype = b.break_type;
        summary.break_types[btype] = (summary.break_types[btype] || 0) + b.duration_sec;
    });

    calls.forEach(call => {
        let agent = call.agent;
        if (!agent || agent === "System" || agent === "NA") return;
        let date_str = call.date ? call.date.split(" ")[0] : "";
        if (!date_str) return;
        
        if (!agent_summary_map[agent]) {
            agent_summary_map[agent] = {
                agent_name: agent,
                active_days: new Set(),
                total_breaks_sec: 0,
                break_types: {}
            };
        }
        agent_summary_map[agent].active_days.add(date_str);
    });

    let agent_talk_time = {};
    calls.forEach(call => {
        let agent = call.agent;
        if (agent && agent !== "System") {
            agent_talk_time[agent] = (agent_talk_time[agent] || 0) + (call.talk_time || 0);
        }
    });

    let agent_scorecards = [];
    Object.keys(agent_summary_map).forEach(agent => {
        let summary = agent_summary_map[agent];
        let active_days_count = summary.active_days.size;
        let shift_time_sec = active_days_count * 32400; // 9 hours
        let talk_time_sec = agent_talk_time[agent] || 0;
        let break_time_sec = summary.total_breaks_sec;
        
        let denominator = shift_time_sec - break_time_sec;
        let occupancy_pct = 0.0;
        if (denominator > 0) {
            occupancy_pct = Math.round((talk_time_sec / denominator) * 10000) / 100;
            if (occupancy_pct > 100.0) {
                occupancy_pct = 100.0;
            }
        }
        
        agent_scorecards.push({
            agent_name: agent,
            active_days: active_days_count,
            logged_hours: Math.round((shift_time_sec / 3600) * 100) / 100,
            total_breaks_sec: break_time_sec,
            talk_time_sec: talk_time_sec,
            occupancy_rate: occupancy_pct,
            break_types: summary.break_types
        });
    });

    // 7. RM Outlier scoring
    let rm_stats = {};
    support_interactions.forEach(item => {
        let rm = item.rm_name;
        if (rm === "NA" || !rm) return;
        let date_str = item.date ? item.date.split(" ")[0] : "";
        if (!date_str) return;

        if (!rm_stats[rm]) {
            rm_stats[rm] = {
                rm_name: rm,
                contacts: 0,
                active_days: new Set(),
                broker_family: item.broker_family,
                branch: item.branch,
                top_issue_counts: {}
            };
        }
        let stats = rm_stats[rm];
        stats.contacts += 1;
        stats.active_days.add(date_str);

        let issue = `${item.issue} / ${item.sub_issue}`;
        stats.top_issue_counts[issue] = (stats.top_issue_counts[issue] || 0) + 1;
    });

    let outliers = [];
    Object.keys(rm_stats).forEach(rm => {
        let stats = rm_stats[rm];
        let active_days_count = stats.active_days.size;
        if (active_days_count === 0) return;
        let contacts_per_day = Math.round((stats.contacts / active_days_count) * 100) / 100;

        let sorted_issues = Object.entries(stats.top_issue_counts).sort((a, b) => b[1] - a[1]);
        let top_issue = sorted_issues.length > 0 ? sorted_issues[0][0] : "NA";

        let is_outlier = contacts_per_day > 3.0 && stats.contacts >= 5;

        outliers.push({
            "rm_name": rm,
            "contacts": stats.contacts,
            "active_days": active_days_count,
            "contacts_per_day": contacts_per_day,
            "broker_family": stats.broker_family,
            "branch": stats.branch,
            "top_issue": top_issue,
            "is_outlier": is_outlier
        });
    });

    // 8. 7-Day Repeat Loops
    let loop_groups = {};
    support_interactions.forEach(item => {
        let rm = item.rm_name;
        let broker = item.broker_family;
        let branch = item.branch;
        let issue = item.issue;
        let sub_issue = item.sub_issue;

        if (rm === "NA" || !rm) return;
        if (issue.toLowerCase() === "general" && sub_issue.toLowerCase() === "general") return;
        if (!item.date) return;

        let group_key = `${rm}||${broker}||${branch}||${issue}`;
        if (!loop_groups[group_key]) {
            loop_groups[group_key] = [];
        }

        try {
            let isoDate = item.date.replace(" ", "T");
            let timestamp = new Date(isoDate).getTime();
            if (!isNaN(timestamp)) {
                loop_groups[group_key].push(timestamp);
            }
        } catch (e) { }
    });

    let repeat_loops = [];
    Object.keys(loop_groups).forEach(key => {
        let tss = loop_groups[key];
        if (tss.length < 2) return;
        tss.sort((a, b) => a - b);
        let repeat_count = 0;
        for (let i = 1; i < tss.length; i++) {
            let diff = tss[i] - tss[i - 1];
            if (diff <= 7 * 24 * 60 * 60 * 1000) { // 7 days in ms
                repeat_count++;
            }
        }

        if (repeat_count > 0) {
            let parts = key.split("||");
            repeat_loops.push({
                "rm_name": parts[0],
                "broker_family": parts[1],
                "branch": parts[2],
                "issue": parts[3],
                "repeat_count": repeat_count
            });
        }
    });
    repeat_loops.sort((a, b) => b.repeat_count - a.repeat_count);

    // 9. Themes and Word Freq
    let stopwords = new Set([
        'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd",
        'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers',
        'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
        'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
        'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
        'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
        'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
        'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
        'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should',
        "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn',
        "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't", 'ma',
        'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't", 'wasn',
        "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't", 'please', 'query', 'customer', 'client',
        'b2b', 'issue', 'need', 'get', 'want', 'please', 'thanks', 'team', 'hi', 'hello', 'kindly', 'regards', 'dear'
    ]);

    let domain_keywords = new Set([
        "login", "password", "settlement", "payout", "otc", "onboarding", "broker", "feed",
        "sip", "order", "error", "delay", "execution", "pending", "account", "fund", "transfer",
        "api", "integration", "dashboard", "portal", "report", "failure", "success", "reject",
        "kyc", "clientid", "symbol", "stock", "portfolio", "rebalance", "subscription"
    ]);

    let word_freq = {};
    let recent_comments = [];

    let sorted_interactions = [...support_interactions].filter(item => item.date).sort((a, b) => {
        return new Date(b.date.replace(" ", "T")).getTime() - new Date(a.date.replace(" ", "T")).getTime();
    });

    sorted_interactions.forEach(item => {
        let comm = item.comments;
        if (comm && recent_comments.length < 4) {
            recent_comments.push({
                "id": item.id,
                "type": item.type,
                "date": item.date,
                "rm_name": item.rm_name,
                "comment": comm.length > 200 ? comm.slice(0, 200) + "..." : comm
            });
        }

        if (comm) {
            let words = comm.toLowerCase().match(/\b[a-z]{3,15}\b/g) || [];
            words.forEach(w => {
                if (!stopwords.has(w)) {
                    word_freq[w] = (word_freq[w] || 0) + 1;
                }
            });
        }
    });

    let sorted_words = Object.entries(word_freq).sort((a, b) => b[1] - a[1]);
    let top_themes = [];
    for (let [w, f] of sorted_words) {
        if (domain_keywords.has(w) || f >= 5) {
            top_themes.push({ "word": w, "count": f });
        }
        if (top_themes.length >= 25) break;
    }

    return {
        "generated_at": cache.builtAt || (new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"),
        "support_interactions": support_interactions,
        "calls": calls,
        "agent_breaks": agent_breaks,
        "outliers": outliers,
        "repeat_loops": repeat_loops,
        "top_themes": top_themes,
        "recent_comments": recent_comments,
        "poc_mappings": poc_mappings,
        "agent_scorecards": agent_scorecards
    };
}

// -------------------------------------------------------------
// 1. DATA INITIALIZATION & ENTRY
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 1. Instantly load from localStorage if available to speed up load time
    const cachedDataStr = localStorage.getItem('b2b_dashboard_raw_payload');
    if (cachedDataStr) {
        try {
            console.log("Found cached dashboard data in localStorage. Instantly loading...");
            const cachedData = JSON.parse(cachedDataStr);
            if (cachedData && cachedData.calls && cachedData.callTkts && cachedData.whatsapp) {
                rawData = compileRawCache(cachedData);
            } else {
                rawData = cachedData;
            }
            if (rawData) {
                populateFilterDropdowns();
                setDefaultDateRange();
                buildViewModel();
                const statusDot = document.getElementById('connection-status-dot');
                const statusText = document.getElementById('connection-status-text');
                const timeBadge = document.getElementById('data-gen-time');
                if (statusDot) statusDot.className = 'status-dot online';
                if (statusText) statusText.innerText = 'Cached Loaded';
                if (timeBadge) timeBadge.innerText = rawData.generated_at || 'Local';
            }
        } catch (e) {
            console.error("Error loading cached dashboard data", e);
        }
    }

    // 2. Perform background sync/fetch and setup event listeners
    loadDashboardData();
    setupEventListeners();
    initCustomDropdowns();
});

async function loadDashboardData() {
    const statusDot = document.getElementById('connection-status-dot');
    const statusText = document.getElementById('connection-status-text');
    const timeBadge = document.getElementById('data-gen-time');
    const syncBtn = document.getElementById('sidebar-sync-btn');

    function updateStatusUI(status, label, timeStr) {
        if (statusDot) {
            statusDot.className = 'status-dot ' + status;
        }
        if (statusText) {
            statusText.innerText = label;
        }
        if (timeBadge) {
            timeBadge.innerText = timeStr || 'No data';
        }
        if (syncBtn) {
            syncBtn.style.display = (status === 'online') ? 'inline-flex' : 'none';
        }
    }

    try {
        let data = null;
        let isLive = false;
        let connectionError = false;

        const liveUrl = localStorage.getItem('live_google_sheet_url');
        const liveEnabled = localStorage.getItem('live_sync_enabled') !== 'false';
        
        let targetUrl = "";

        if (liveEnabled && liveUrl && liveUrl.trim() !== "") {
            targetUrl = getCleanApiUrl(liveUrl);
        } else if (typeof GOOGLE_SCRIPT_API_URL === "string" &&
                   GOOGLE_SCRIPT_API_URL.trim() !== "" &&
                   !GOOGLE_SCRIPT_API_URL.includes("YOUR_DEPLOYED_SCRIPT_WEB_APP_URL")) {
            targetUrl = getCleanApiUrl(GOOGLE_SCRIPT_API_URL);
        }

        if (targetUrl) {
            console.log("Attempting to fetch live data from Google Sheets API: " + targetUrl);
            try {
                const response = await fetch(targetUrl);
                if (response.ok) {
                    data = await response.json();
                    isLive = true;
                    console.log("Successfully fetched live dashboard data from Google Sheets API.");
                    // Save to localStorage cache
                    localStorage.setItem('b2b_dashboard_raw_payload', JSON.stringify(data));
                } else {
                    console.warn(`Live fetch returned status ${response.status}. Falling back to local cache.`);
                    connectionError = true;
                }
            } catch (err) {
                console.warn("Network or CORS issue fetching from Google Sheets API, falling back to local cache file. Details:", err);
                connectionError = true;
            }
        }

        // If live fetch failed, try loading from localStorage cache
        if (!data) {
            const cachedDataStr = localStorage.getItem('b2b_dashboard_raw_payload');
            if (cachedDataStr) {
                try {
                    data = JSON.parse(cachedDataStr);
                    console.log("Loaded fallback from localStorage cache.");
                } catch (e) {
                    console.error("Error parsing cached data", e);
                }
            }
        }

        // Fallback to empty skeleton data structure directly in code to avoid static files
        if (!data) {
            console.log("No live data loaded. Initializing empty skeleton data structure.");
            data = {
                generated_at: "No live data loaded",
                support_interactions: [],
                calls: [],
                agent_breaks: [],
                outliers: [],
                repeat_loops: [],
                top_themes: [],
                recent_comments: [],
                poc_mappings: [],
                agent_scorecards: []
            };
        }

        if (!data) {
            updateStatusUI('error', 'No Data Found', 'Setup required');
            alert("No data available. Please click 'Setup' in the footer to connect your live Google Sheet.");
            return;
        }

        // Run compiler client-side if raw Google Sheet cache shape is detected
        if (data && data.calls && data.callTkts && data.whatsapp) {
            console.log("Raw Google Sheet cache payload detected. Commencing client-side compilation...");
            rawData = compileRawCache(data);
        } else {
            console.log("Precompiled dashboard data structure detected.");
            rawData = data;
        }

        // Update Connection Status UI
        if (isLive) {
            updateStatusUI('online', 'Live Connected', rawData.generated_at || 'Just Now');
        } else if (connectionError) {
            updateStatusUI('error', 'Sync Failed', 'Local Cache');
        } else {
            updateStatusUI('offline', 'Local Cache', rawData.generated_at || 'Local');
        }

        // Detect empty/skeleton data (prompt user to connect)
        const totalInteractions = (rawData.support_interactions || []).length;
        const totalCalls = (rawData.calls || []).length;
        
        if (totalInteractions === 0 && totalCalls === 0) {
            console.warn("No records found in loaded data. Prompting user to link live Sheet.");
            setTimeout(() => {
                const modal = document.getElementById('live-config-modal');
                if (modal) {
                    modal.classList.add('open');
                    const testResult = document.getElementById('live-test-result');
                    if (testResult) {
                        testResult.style.display = 'block';
                        testResult.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                        testResult.style.color = '#ef4444';
                        testResult.innerText = "Welcome! Your dashboard is currently empty. Please paste your Google Sheets Apps Script Web App URL below to sync your live data.";
                    }
                }
            }, 800);
        }

        // Populate filter dropdown choices
        populateFilterDropdowns();

        // Establish default date range (Last 30 days) if not already set
        if (!activeFilters.dateFrom || !activeFilters.dateTo) {
            setDefaultDateRange();
        } else {
            // Keep UI in sync with active filter variables
            const elFrom = document.getElementById('filter-date-from');
            const elTo = document.getElementById('filter-date-to');
            if (elFrom) elFrom.value = activeFilters.dateFrom;
            if (elTo) elTo.value = activeFilters.dateTo;
        }

        // Run reactive view model compiler
        buildViewModel();
    } catch (error) {
        console.error("Dashboard Load Error:", error);
        updateStatusUI('error', 'Load Error', 'Check console');
        alert("Error loading B2B data file. Please ensure your Google Sheet API is correctly configured.");
    }
}

// -------------------------------------------------------------
// 2. FILTER MANAGEMENT & EVENT LISTENERS
// -------------------------------------------------------------

function setupEventListeners() {
    // Google Sheets Live Settings Modal
    const liveModal = document.getElementById('live-config-modal');
    const openLiveBtn = document.getElementById('sidebar-config-btn');
    const closeLiveBtn = document.getElementById('live-config-modal-close');
    const liveForm = document.getElementById('live-config-form');
    const liveUrlInput = document.getElementById('live-script-url');
    const liveEnabledCheckbox = document.getElementById('live-sync-enabled');
    const testLiveBtn = document.getElementById('live-config-test-btn');
    const testResultDiv = document.getElementById('live-test-result');
    const sidebarSyncBtn = document.getElementById('sidebar-sync-btn');

    if (openLiveBtn && liveModal) {
        openLiveBtn.addEventListener('click', () => {
            const currentUrl = localStorage.getItem('live_google_sheet_url') || 
                               (GOOGLE_SCRIPT_API_URL.includes("YOUR_DEPLOYED_SCRIPT_WEB_APP_URL") ? "" : GOOGLE_SCRIPT_API_URL);
            const isEnabled = localStorage.getItem('live_sync_enabled') !== 'false';
            
            if (liveUrlInput) liveUrlInput.value = currentUrl;
            if (liveEnabledCheckbox) liveEnabledCheckbox.checked = isEnabled;
            if (testResultDiv) testResultDiv.style.display = 'none';
            
            liveModal.classList.add('open');
        });
    }

    if (closeLiveBtn && liveModal) {
        closeLiveBtn.addEventListener('click', () => {
            liveModal.classList.remove('open');
        });
        liveModal.addEventListener('click', (e) => {
            if (e.target === liveModal) {
                liveModal.classList.remove('open');
            }
        });
    }

    if (sidebarSyncBtn) {
        sidebarSyncBtn.addEventListener('click', () => {
            sidebarSyncBtn.disabled = true;
            const originalText = sidebarSyncBtn.innerHTML;
            sidebarSyncBtn.innerHTML = "🔄 Syncing...";
            
            loadDashboardData().finally(() => {
                sidebarSyncBtn.disabled = false;
                sidebarSyncBtn.innerHTML = originalText;
            });
        });
    }

    if (testLiveBtn) {
        testLiveBtn.addEventListener('click', async () => {
            const url = (liveUrlInput ? liveUrlInput.value : "").trim();
            if (!url) {
                alert("Please enter a URL to test.");
                return;
            }
            
            testLiveBtn.disabled = true;
            testLiveBtn.innerText = "⚡ Testing...";
            if (testResultDiv) {
                testResultDiv.style.display = 'block';
                testResultDiv.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                testResultDiv.style.color = 'var(--text-secondary)';
                testResultDiv.innerText = "Connecting to Google Sheet Web App API...";
            }

            try {
                const targetUrl = getCleanApiUrl(url);
                if (!targetUrl) throw new Error("Invalid URL. Must start with http:// or https://");

                console.log("Testing connection to: " + targetUrl);
                const response = await fetch(targetUrl);
                if (!response.ok) throw new Error("HTTP connection failed (Status: " + response.status + ")");
                
                const data = await response.json();
                if (data && data.error) {
                    throw new Error("Apps Script API Error: " + data.error);
                }
                
                if (data && data.calls && data.callTkts && data.whatsapp) {
                    const callCount = data.calls.length;
                    const ticketCount = data.callTkts.length;
                    const waCount = data.whatsapp.length;
                    const emailCount = (data.careEmails || []).length;
                    
                    testResultDiv.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
                    testResultDiv.style.color = '#22c55e';
                    testResultDiv.innerHTML = `<strong>✓ Connection Successful!</strong><br>Successfully fetched sheet data:<br>` +
                        `• Calls: ${callCount} rows<br>` +
                        `• Call Tickets: ${ticketCount} rows<br>` +
                        `• WhatsApp Chats: ${waCount} rows<br>` +
                        `• Care Emails: ${emailCount} rows<br>` +
                        `• Last Built: ${data.builtAt || 'N/A'}`;
                } else {
                    throw new Error("Invalid response format. Missing 'calls', 'callTkts', or 'whatsapp' keys.");
                }
            } catch (err) {
                console.error("Test connection failed:", err);
                testResultDiv.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                testResultDiv.style.color = '#ef4444';
                testResultDiv.innerHTML = `<strong>✗ Connection Failed</strong><br>${err.message}<br><br>` +
                    `<small>Ensure the Apps Script is deployed as a Web App with "Execute as: Me" and "Who has access: Anyone".</small>`;
            } finally {
                testLiveBtn.disabled = false;
                testLiveBtn.innerText = "⚡ Test Connection";
            }
        });
    }

    if (liveForm) {
        liveForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const url = (liveUrlInput ? liveUrlInput.value : "").trim();
            const enabled = liveEnabledCheckbox ? liveEnabledCheckbox.checked : true;
            
            localStorage.setItem('live_google_sheet_url', url);
            localStorage.setItem('live_sync_enabled', enabled ? 'true' : 'false');
            
            if (liveModal) {
                liveModal.classList.remove('open');
            }
            
            // Reload dashboard data
            loadDashboardData();
        });
    }

    // Top Tab switching (Weekly Pulse, Main, Visual Control, Neo)
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Preset Date buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.getAttribute('data-preset');
            activeFilters.datePreset = preset;

            if (preset === 'custom') {
                const trigger = document.getElementById('drp-trigger');
                if (trigger) {
                    trigger.click();
                }
            } else {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Recalculate date range
                setDateRangeFromPreset(preset);
                buildViewModel();
            }
        });
    });

    // MUI-style Date Range Picker
    initDateRangePicker();

    // Standard inline Date apply button (fallback for b2b_index.html style layout)
    const applyDateBtn = document.getElementById('apply-date-btn');
    if (applyDateBtn) {
        applyDateBtn.addEventListener('click', () => {
            const from = document.getElementById('filter-date-from').value;
            const to = document.getElementById('filter-date-to').value;
            if (from && to) {
                activeFilters.datePreset = 'custom';
                document.querySelectorAll('.preset-btn').forEach(b => {
                    if (b.getAttribute('data-preset') === 'custom') {
                        b.classList.add('active');
                    } else {
                        b.classList.remove('active');
                    }
                });
                activeFilters.dateFrom = from;
                activeFilters.dateTo = to;
                buildViewModel();
            }
        });
    }

    // Quick Channel Pills selector (Combined, Call Ticket, WhatsApp)
    document.querySelectorAll('.pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            activeFilters.channel = btn.getAttribute('data-channel');
            buildViewModel();
        });
    });

    // Include Care Emails checkbox toggle listener
    const includeEmailsCheckbox = document.getElementById('filter-include-emails');
    if (includeEmailsCheckbox) {
        includeEmailsCheckbox.addEventListener('change', (e) => {
            activeFilters.includeCareEmails = e.target.checked;
            const careEmailsPill = document.getElementById('pill-care-emails');
            if (careEmailsPill) {
                if (activeFilters.includeCareEmails) {
                    careEmailsPill.classList.remove('hidden');
                    careEmailsPill.style.display = 'inline-block';
                } else {
                    careEmailsPill.classList.add('hidden');
                    careEmailsPill.style.display = 'none';
                    if (activeFilters.channel === 'Care Email') {
                        activeFilters.channel = 'all';
                        document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
                        const combinedPill = document.getElementById('pill-combined');
                        if (combinedPill) combinedPill.classList.add('active');
                    }
                }
            }
            buildViewModel();
        });
    }

    // Reset Filters button
    document.getElementById('weekly-reset-btn').addEventListener('click', () => {
        activeFilters = {
            datePreset: 'week',
            dateFrom: '',
            dateTo: '',
            channel: 'all',
            broker: 'all',
            poc: 'all',
            agent: 'all',
            branch: 'all',
            searchQuery: '',
            includeCareEmails: false
        };

        if (includeEmailsCheckbox) {
            includeEmailsCheckbox.checked = false;
        }
        const careEmailsPill = document.getElementById('pill-care-emails');
        if (careEmailsPill) {
            careEmailsPill.classList.add('hidden');
            careEmailsPill.style.display = 'none';
        }

        document.querySelectorAll('.preset-btn').forEach(b => {
            b.classList.remove('active');
            if (b.getAttribute('data-preset') === 'week') b.classList.add('active');
        });

        document.querySelectorAll('.pill-btn').forEach(b => {
            b.classList.remove('active');
            if (b.getAttribute('data-channel') === 'all') b.classList.add('active');
        });

        function resetSelectMultiple(selectId, defaultValue) {
            const select = document.getElementById(selectId);
            if (!select) return;
            Array.from(select.options).forEach(opt => {
                opt.selected = (opt.value === defaultValue);
            });
            const event = new Event('change', { bubbles: true });
            select.dispatchEvent(event);
        }

        resetSelectMultiple('filter-broker', 'all');
        resetSelectMultiple('filter-poc', 'all');
        resetSelectMultiple('filter-agent', 'all');
        resetSelectMultiple('filter-hide-smallcase-rm', 'none');

        setDefaultDateRange();
        buildViewModel();
    });

    function getSelectValues(select) {
        return Array.from(select.selectedOptions).map(opt => opt.value);
    }

    // Dropdown filters
    document.getElementById('filter-broker').addEventListener('change', (e) => {
        activeFilters.broker = getSelectValues(e.target);
        buildViewModel();
    });
    document.getElementById('filter-poc').addEventListener('change', (e) => {
        activeFilters.poc = getSelectValues(e.target);
        buildViewModel();
    });
    document.getElementById('filter-agent').addEventListener('change', (e) => {
        activeFilters.agent = getSelectValues(e.target);
        buildViewModel();
    });
    const hideSmallcaseRmSelect = document.getElementById('filter-hide-smallcase-rm');
    if (hideSmallcaseRmSelect) {
        hideSmallcaseRmSelect.addEventListener('change', (e) => {
            activeFilters.hideSmallcaseRm = getSelectValues(e.target);
            buildViewModel();
        });
    }

    // Theme Switcher (Light / Dark)
    document.getElementById('theme-toggle-btn').addEventListener('click', (e) => {
        // Separate theme-class toggle from heavy chart re-render.
        // We only swap CSS classes inside the transition so the snapshot is
        // just a CSS repaint. Then buildViewModel() fires AFTER the wipe
        // completes, preventing chart DOM ops from polluting the snapshot.
        const applyThemeColors = () => {
            const body = document.body;
            const btnText = document.querySelector('.theme-text');

            if (body.classList.contains('light-mode')) {
                // Light -> Dark
                body.classList.remove('light-mode');
                body.classList.add('dark-mode');
                if (btnText) btnText.innerText = 'Light Mode';
                THEME_COLORS.textPrimary = '#f0f4ff';
                THEME_COLORS.textSecondary = '#cbd5e1';
                THEME_COLORS.border = 'rgba(255, 255, 255, 0.16)';
                THEME_COLORS.blue = '#00d4ff';
                THEME_COLORS.purple = '#82b1ff';
                THEME_COLORS.green = '#10b981';
                THEME_COLORS.red = '#f43f5e';
                THEME_COLORS.yellow = '#fbbf24';
            } else {
                // Dark -> Light
                body.classList.remove('dark-mode');
                body.classList.add('light-mode');
                if (btnText) btnText.innerText = 'Dark Mode';
                THEME_COLORS.textPrimary = '#0f172a';
                THEME_COLORS.textSecondary = '#334155';
                THEME_COLORS.border = 'rgba(0, 0, 0, 0.07)';
                THEME_COLORS.blue = '#0284c7';
                THEME_COLORS.purple = '#1f7ae0';
                THEME_COLORS.green = '#059669';
                THEME_COLORS.red = '#e11d48';
                THEME_COLORS.yellow = '#d97706';
            }
            // NOTE: buildViewModel() is intentionally NOT called here —
            // we call it after the transition finishes to avoid snapshot flicker.
        };

        const isAppearanceTransition = document.startViewTransition &&
            !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!isAppearanceTransition) {
            applyThemeColors();
            buildViewModel();
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top  + rect.height / 2;
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth  - x),
            Math.max(y, window.innerHeight - y)
        );

        // Only swap CSS classes inside the transition callback (very fast).
        const transition = document.startViewTransition(() => {
            applyThemeColors();
        });

        // Start the clip-path wipe once both snapshots are ready.
        transition.ready.then(() => {
            document.documentElement.animate(
                {
                    clipPath: [
                        `circle(0px at ${x}px ${y}px)`,
                        `circle(${endRadius}px at ${x}px ${y}px)`
                    ]
                },
                {
                    duration: 600,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    pseudoElement: '::view-transition-new(root)'
                }
            );
        });

        // Re-render charts AFTER the wipe is fully done — no flicker.
        transition.finished.then(() => {
            buildViewModel();
        });
    });

    // Sidebar collapse/expand event listeners
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const expandBtn = document.getElementById('sidebar-expand-btn');
    if (collapseBtn && expandBtn) {
        collapseBtn.addEventListener('click', () => {
            document.body.classList.add('sidebar-collapsed');
            expandBtn.classList.remove('hidden');
        });
        expandBtn.addEventListener('click', () => {
            document.body.classList.remove('sidebar-collapsed');
            expandBtn.classList.add('hidden');
        });
    }

    // Attribute Explorer tab switches
    document.querySelectorAll('.exp-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.exp-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            explorerActiveTab = btn.getAttribute('data-attr');
            explorerSelectedOption = null;
            renderExplorerWidgetList();
        });
    });

    // AI Summarise button
    document.getElementById('ai-summarise-btn').addEventListener('click', () => {
        generateAISummary();
    });

    // Screenshot capture button
    document.getElementById('screenshot-btn').addEventListener('click', () => {
        captureDashboardScreenshot();
    });

    // Modal Close
    document.getElementById('poc-modal-close').addEventListener('click', () => {
        document.getElementById('poc-modal').classList.remove('open');
    });
    document.getElementById('poc-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('poc-modal')) {
            document.getElementById('poc-modal').classList.remove('open');
        }
    });

    // Metrics Modal Close listeners
    const metricsModal = document.getElementById('metrics-modal');
    if (metricsModal) {
        document.getElementById('metrics-modal-close').addEventListener('click', () => {
            metricsModal.classList.remove('open');
        });
        metricsModal.addEventListener('click', (e) => {
            if (e.target === metricsModal) {
                metricsModal.classList.remove('open');
            }
        });
    }

    // Broker Health Modal Close listeners
    const brokerModal = document.getElementById('broker-health-modal');
    if (brokerModal) {
        document.getElementById('broker-health-modal-close').addEventListener('click', () => {
            brokerModal.classList.remove('open');
        });
        brokerModal.addEventListener('click', (e) => {
            if (e.target === brokerModal) {
                brokerModal.classList.remove('open');
            }
        });
    }

    // Register click handlers for all 8 KPI cards in Weekly Pulse
    const kpiCards = [
        { id: 'card-interactions', type: 'interactions', title: 'Total Interactions' },
        { id: 'card-tickets', type: 'tickets', title: 'Call Tickets' },
        { id: 'card-whatsapp', type: 'whatsapp', title: 'WhatsApp Chats' },
        { id: 'card-answered', type: 'answered', title: 'Answered Calls' },
        { id: 'card-missed', type: 'missed', title: 'Missed Calls' },
        { id: 'card-aoh', type: 'aoh', title: 'AOH Calls' },
        { id: 'card-aht', type: 'aht', title: 'Average Handling Time (AHT)' },
        { id: 'card-aqt', type: 'aqt', title: 'Average Queue Time (AQT)' }
    ];

    kpiCards.forEach(card => {
        const el = document.getElementById(card.id);
        if (el) {
            el.addEventListener('click', () => {
                openMetricDeepDiveModal(card.type, card.title);
            });
        }
    });
}

function switchTab(tabId) {
    currentTab = tabId;

    // Toggle active navigation button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabId) btn.classList.add('active');
    });

    // Toggle active content container
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    // Update Page Header Title
    const titleMap = {
        'tab-weekly-pulse': 'Weekly Pulse',
        'tab-main-dashboard': 'Main Dashboard',
        'tab-visual-control': 'Visual Control',
        'tab-intelligence': 'Intelligence',
        'tab-monthly-view': 'Monthly View',
        'tab-agent-performance': 'Agent Performance',
        'tab-tickets-chats': 'Tickets & Chats',
        'tab-ai-summary': 'AI Summary',
        'tab-guide': 'Guide'
    };
    const subtitleMap = {
        'tab-weekly-pulse': 'Comparative weekly reports & segment hotspot analytics',
        'tab-main-dashboard': 'Channel metrics overview with deep-dive analytics',
        'tab-visual-control': 'Visual analytics control room',
        'tab-intelligence': 'Cross-channel insights & anomaly detection',
        'tab-monthly-view': 'Date-wise monthly metric aggregation',
        'tab-agent-performance': 'Agent workload, quality & productivity metrics',
        'tab-tickets-chats': 'Browsable registry of all support interactions',
        'tab-ai-summary': 'AI-powered narrative summaries & focus areas',
        'tab-guide': 'How to use this dashboard'
    };
    document.getElementById('page-title').innerText = titleMap[tabId] || tabId;
    const subtitleEl = document.querySelector('.header-subtitle');
    if (subtitleEl) subtitleEl.innerText = subtitleMap[tabId] || '';

    // All tabs except Guide trigger data rendering
    if (tabId !== 'tab-guide') {
        buildViewModel();
    }

    // SLA Risk Queue Ticker management
    if (window._slaRiskInterval) {
        clearInterval(window._slaRiskInterval);
        window._slaRiskInterval = null;
    }

    if (tabId === 'tab-main-dashboard') {
        // Run immediately
        if (typeof renderSLARiskMonitor === 'function') {
            renderSLARiskMonitor();
        }
        // Set interval every 10 seconds
        window._slaRiskInterval = setInterval(() => {
            if (typeof renderSLARiskMonitor === 'function') {
                renderSLARiskMonitor();
            }
        }, 10000);
    }
}

function populateFilterDropdowns() {
    const brokers = new Set();
    const pocs = new Set();
    const agents = new Set();
    const smallcaseRms = new Set();

    const allowedBrokers = new Set([
        'Axis', 'Axis MTF', 'HDFC', 'HDFC MTF', 'SBI', 'SBI MTF', 'HDFCsky',
        'Angel One', 'Fundzbazar', '5paisa', 'Kotak Sec', 'SMC', 'IIFL', 'Nuvama', 'Fisdom', 'Trustline'
    ]);

    rawData.support_interactions.forEach(item => {
        // Do not consider care emails when populating the broker filter list
        if (item.type !== 'Care Email') {
            if (item.broker_family && allowedBrokers.has(item.broker_family)) {
                brokers.add(item.broker_family);
            }
        }
        if (item.poc && item.poc !== 'Not shared' && item.poc !== 'No POC') pocs.add(item.poc);
        if (item.agent && item.agent !== 'Unassigned' && item.agent !== 'System') agents.add(item.agent);
        
        if (cleanStr(item.branch).toLowerCase() === 'smallcase') {
            const rm = cleanStr(item.rm_name || item.RM_Name || item.rm);
            if (rm && rm !== 'NA' && rm !== 'Unknown') {
                smallcaseRms.add(rm);
            }
        }
    });

    rawData.calls.forEach(call => {
        if (cleanStr(call.branch).toLowerCase() === 'smallcase') {
            const rm = cleanStr(call.rm_name || call.RM_Name || call.rm || call.agent);
            if (rm && rm !== 'NA' && rm !== 'Unknown' && rm !== 'System') {
                smallcaseRms.add(rm);
            }
        }
    });

    const brokerSelect = document.getElementById('filter-broker');
    const currentBroker = brokerSelect ? Array.from(brokerSelect.selectedOptions).map(o => o.value) : ['all'];
    if (brokerSelect) {
        let html = '<option value="all">All Broker Families</option>';
        Array.from(brokers).sort().forEach(b => {
            html += `<option value="${b}">${b}</option>`;
        });
        brokerSelect.innerHTML = html;
        Array.from(brokerSelect.options).forEach(opt => {
            opt.selected = currentBroker.includes(opt.value);
        });
    }

    const pocSelect = document.getElementById('filter-poc');
    const currentPoc = pocSelect ? Array.from(pocSelect.selectedOptions).map(o => o.value) : ['all'];
    if (pocSelect) {
        let html = '<option value="all">All Assigned POCs</option>';
        Array.from(pocs).sort().forEach(p => {
            html += `<option value="${p}">${p}</option>`;
        });
        pocSelect.innerHTML = html;
        Array.from(pocSelect.options).forEach(opt => {
            opt.selected = currentPoc.includes(opt.value);
        });
    }

    const agentSelect = document.getElementById('filter-agent');
    const currentAgent = agentSelect ? Array.from(agentSelect.selectedOptions).map(o => o.value) : ['all'];
    if (agentSelect) {
        let html = '<option value="all">All Support Agents</option>';
        Array.from(agents).sort().forEach(a => {
            html += `<option value="${a}">${a}</option>`;
        });
        agentSelect.innerHTML = html;
        Array.from(agentSelect.options).forEach(opt => {
            opt.selected = currentAgent.includes(opt.value);
        });
    }

    const smallcaseRmSelect = document.getElementById('filter-hide-smallcase-rm');
    const currentSmallcaseRm = smallcaseRmSelect ? Array.from(smallcaseRmSelect.selectedOptions).map(o => o.value) : ['none'];
    if (smallcaseRmSelect) {
        let html = '<option value="none">Hide smallcase RMs: None</option>';
        Array.from(smallcaseRms).sort().forEach(r => {
            html += `<option value="${r}">${r}</option>`;
        });
        smallcaseRmSelect.innerHTML = html;
        Array.from(smallcaseRmSelect.options).forEach(opt => {
            opt.selected = currentSmallcaseRm.includes(opt.value);
        });
    }
}

function setDefaultDateRange() {
    const defaultPreset = 'week';
    setDateRangeFromPreset(defaultPreset);
    activeFilters.datePreset = defaultPreset;

    document.querySelectorAll('.preset-btn').forEach(btn => {
        if (btn.getAttribute('data-preset') === defaultPreset) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// =============================================================================
// MUI-STYLE DATE RANGE PICKER (vanilla JS)
// =============================================================================
function initDateRangePicker() {
    const trigger     = document.getElementById('drp-trigger');
    const popup       = document.getElementById('drp-popup');
    const labelEl     = document.getElementById('drp-label');
    const inputFrom   = document.getElementById('drp-input-from');
    const inputTo     = document.getElementById('drp-input-to');
    const applyBtn    = document.getElementById('drp-apply-btn');
    const cancelBtn   = document.getElementById('drp-cancel-btn');

    if (!trigger || !popup || !inputFrom || !inputTo || !applyBtn || !cancelBtn) return;

    // Prevent clicks inside popup from bubbling to prevent browser popover light-dismiss bugs
    popup.addEventListener('click', (e) => e.stopPropagation());
    popup.addEventListener('mousedown', (e) => e.stopPropagation());
    popup.addEventListener('pointerdown', (e) => e.stopPropagation());

    const hasPopover = typeof popup.showPopover === 'function';

    function positionPopup() {
        const trigRect = trigger.getBoundingClientRect();
        const popupW   = popup.offsetWidth  || 380;
        const popupH   = popup.offsetHeight || 260;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const GAP = 8;

        let left = trigRect.left;
        if (left + popupW > vw - GAP) {
            left = trigRect.right - popupW;
        }
        left = Math.max(GAP, left);

        let top;
        const spaceBelow = vh - trigRect.bottom - GAP;
        const spaceAbove = trigRect.top - GAP;
        if (spaceBelow >= popupH || spaceBelow >= spaceAbove) {
            top = trigRect.bottom + GAP;
        } else {
            top = trigRect.top - GAP - popupH;
        }
        top = Math.max(GAP, top);

        popup.style.position = 'fixed';
        popup.style.left   = `${left}px`;
        popup.style.top    = `${top}px`;
        popup.style.right  = 'auto';
        popup.style.bottom = 'auto';
    }

    function openPopup() {
        activeFilters.datePreset = 'custom';
        document.querySelectorAll('.preset-btn').forEach(b => {
            if (b.getAttribute('data-preset') === 'custom') {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        // Initialize input fields with active filters
        inputFrom.value = activeFilters.dateFrom || '';
        inputTo.value   = activeFilters.dateTo || '';

        if (hasPopover) {
            if (!popup.matches(':popover-open')) {
                // Close all custom select popovers first
                document.querySelectorAll('.custom-select-panel').forEach(p => {
                    if (typeof p.hidePopover === 'function' && p.matches(':popover-open')) {
                        p.hidePopover();
                    }
                });
                popup.showPopover();
            }
        } else {
            popup.removeAttribute('hidden');
            trigger.classList.add('drp-open');
            trigger.setAttribute('aria-expanded', 'true');
            positionPopup();
        }
    }

    function closePopup() {
        if (hasPopover) {
            if (popup.matches(':popover-open')) {
                popup.hidePopover();
            }
        } else {
            popup.setAttribute('hidden', '');
            trigger.classList.remove('drp-open');
            trigger.setAttribute('aria-expanded', 'false');
        }
    }

    function updateTriggerLabel(from, to) {
        if (from && to) {
            const MONTHS = ['January','February','March','April','May','June',
                            'July','August','September','October','November','December'];
            const fmtStr = (str) => {
                const parts = str.split('-');
                if (parts.length !== 3) return str;
                const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                return `${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}, ${d.getFullYear()}`;
            };
            labelEl.textContent = `${fmtStr(from)}  →  ${fmtStr(to)}`;
        } else {
            labelEl.textContent = 'Select date range';
        }
    }

    function applyRange() {
        const fromVal = inputFrom.value;
        const toVal   = inputTo.value;
        if (!fromVal || !toVal) {
            alert("Please select both start and end dates.");
            return;
        }

        activeFilters.datePreset = 'custom';
        activeFilters.dateFrom = fromVal;
        activeFilters.dateTo   = toVal;

        // keep hidden inputs in sync
        const elFrom = document.getElementById('filter-date-from');
        const elTo   = document.getElementById('filter-date-to');
        if (elFrom) elFrom.value = activeFilters.dateFrom;
        if (elTo)   elTo.value   = activeFilters.dateTo;

        // highlight custom preset pill
        document.querySelectorAll('.preset-btn').forEach(b => {
            if (b.getAttribute('data-preset') === 'custom') {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        updateTriggerLabel(activeFilters.dateFrom, activeFilters.dateTo);
        closePopup();
        buildViewModel();
    }

    if (hasPopover) {
        popup.addEventListener('toggle', (event) => {
            if (event.newState === 'open') {
                activeFilters.datePreset = 'custom';
                document.querySelectorAll('.preset-btn').forEach(b => {
                    if (b.getAttribute('data-preset') === 'custom') {
                        b.classList.add('active');
                    } else {
                        b.classList.remove('active');
                    }
                });

                inputFrom.value = activeFilters.dateFrom || '';
                inputTo.value   = activeFilters.dateTo || '';

                positionPopup();
                trigger.classList.add('drp-open');
                trigger.setAttribute('aria-expanded', 'true');
            } else {
                trigger.classList.remove('drp-open');
                trigger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Wire up shortcut chips inside popup
    document.querySelectorAll('.drp-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.drp-chip').forEach(c => c.classList.remove('drp-chip-active'));
            chip.classList.add('drp-chip-active');
            const sc = chip.dataset.shortcut;
            const now = new Date(); now.setHours(0,0,0,0);
            let from = new Date(now), to = new Date(now);

            const pad = (n) => String(n).padStart(2, '0');
            const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

            if (sc === 'today') {
                /* default */
            } else if (sc === 'yesterday') {
                from.setDate(now.getDate()-1);
                to.setDate(now.getDate()-1);
            } else if (sc === '7d') {
                from.setDate(now.getDate()-7);
            } else if (sc === '30d') {
                from.setDate(now.getDate()-30);
            } else if (sc === 'month') {
                from = new Date(now.getFullYear(), now.getMonth(), 1);
                to   = new Date(now.getFullYear(), now.getMonth()+1, 0);
            } else if (sc === 'year') {
                from = new Date(now.getFullYear(), 0, 1);
                to   = new Date(now.getFullYear(), 11, 31);
            }

            inputFrom.value = fmt(from);
            inputTo.value   = fmt(to);
            applyRange();
        });
    });

    applyBtn.addEventListener('click', applyRange);
    cancelBtn.addEventListener('click', closePopup);

    if (!hasPopover) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!popup.hasAttribute('hidden')) {
                closePopup();
            } else {
                openPopup();
            }
        });

        // ── Close on outside click fallback ──
        document.addEventListener('click', (e) => {
            if (!popup.hasAttribute('hidden') && !popup.contains(e.target) && e.target !== trigger) {
                closePopup();
            }
        });

        // ── Close on Escape fallback ──
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !popup.hasAttribute('hidden')) closePopup();
        });
    }

    // ── Sync initial label if filters already set ──
    if (activeFilters.dateFrom && activeFilters.dateTo) {
        updateTriggerLabel(activeFilters.dateFrom, activeFilters.dateTo);
    }
}

function setDateRangeFromPreset(preset) {

    // Always use the actual current date so presets stay relative to today
    const now = new Date();
    const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // midnight local
    let fromDate = new Date(baseDate.getTime());
    let toDate = new Date(baseDate.getTime());

    const pad = (n) => (n < 10 ? '0' : '') + n;
    const format = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'week') {
        // Current Week: starts Monday, ends Sunday
        // Day index: 0=Sun, 1=Mon, 2=Tue, 3=Wed, etc.
        const currentDay = baseDate.getDay();
        const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        fromDate.setDate(baseDate.getDate() + distanceToMonday);
        toDate.setDate(fromDate.getDate() + 6);
    } else if (preset === 'today') {
        fromDate = new Date(baseDate.getTime());
        toDate = new Date(baseDate.getTime());
    } else if (preset === 'yesterday') {
        fromDate.setDate(baseDate.getDate() - 1);
        toDate.setDate(baseDate.getDate() - 1);
    } else if (preset === '7d') {
        fromDate.setDate(baseDate.getDate() - 7);
    } else if (preset === '30d') {
        fromDate.setDate(baseDate.getDate() - 30);
    } else if (preset === 'month') {
        fromDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        toDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0); // End of month
    } else if (preset === 'year') {
        fromDate = new Date(baseDate.getFullYear(), 0, 1);
        toDate = new Date(baseDate.getFullYear(), 11, 31);
    } else if (preset === 'all') {
        let earliest = new Date(baseDate.getTime());
        rawData.support_interactions.forEach(item => {
            if (item.date) {
                const d = safeParseDate(item.date);
                if (d < earliest) earliest = d;
            }
        });
        fromDate = earliest;
    }

    activeFilters.dateFrom = format(fromDate);
    activeFilters.dateTo = format(toDate);

    document.getElementById('filter-date-from').value = activeFilters.dateFrom;
    document.getElementById('filter-date-to').value = activeFilters.dateTo;

    // Sync the DRP trigger label
    const labelEl = document.getElementById('drp-label');
    if (labelEl) {
        const MONTHS = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
        const fmtD = (d) => `${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}, ${d.getFullYear()}`;
        labelEl.textContent = `${fmtD(fromDate)}  →  ${fmtD(toDate)}`;
    }
}

// Helper to compute previous comparative period dates
function getPreviousPeriodDates(fromStr, toStr) {
    const from = new Date(fromStr + 'T00:00:00');
    const to = new Date(toStr + 'T23:59:59');

    // Check if it's a full calendar month selection
    const isFullMonth = (from.getDate() === 1) && (to.getDate() === new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate());

    let prevFrom, prevTo;
    if (isFullMonth) {
        const monthsDiff = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
        prevFrom = new Date(from.getFullYear(), from.getMonth() - monthsDiff, 1);
        prevTo = new Date(to.getFullYear(), to.getMonth() - monthsDiff, new Date(to.getFullYear(), to.getMonth() - monthsDiff + 1, 0).getDate());
    } else {
        const diffMs = to.getTime() - from.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
        
        // Align day-of-week by shifting back by multiples of 7 days
        const weeks = Math.ceil(diffDays / 7);
        const shiftDays = weeks * 7;

        prevFrom = new Date(from.getTime() - shiftDays * 24 * 60 * 60 * 1000);
        prevTo = new Date(to.getTime() - shiftDays * 24 * 60 * 60 * 1000);
    }

    const pad = (n) => (n < 10 ? '0' : '') + n;
    const format = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    return {
        from: format(prevFrom),
        to: format(prevTo)
    };
}

// -------------------------------------------------------------
// 3. VIEWMODEL RE-COMPILER (REACTIVE FILTERS)
// -------------------------------------------------------------

function buildViewModel() {
    if (!rawData) return;
    // Guide tab has no dynamic data
    if (currentTab === 'tab-guide') return;

    const fromD = safeParseDate(activeFilters.dateFrom);
    if (fromD) fromD.setHours(0, 0, 0, 0);
    const fromTs = fromD ? fromD.getTime() : 0;

    const toD = safeParseDate(activeFilters.dateTo);
    if (toD) toD.setHours(23, 59, 59, 999);
    const toTs = toD ? toD.getTime() : 0;

    // Filter active interactions
    const filteredInteractions = rawData.support_interactions.filter(item => {
        if (!item.date) return false;
        const itemTs = safeParseDate(item.date).getTime();
        if (isNaN(itemTs)) return false;
        if (itemTs < fromTs || itemTs > toTs) return false;

        // Optionally include Care Emails
        if (item.type === 'Care Email' && !activeFilters.includeCareEmails) return false;

        if (activeFilters.channel !== 'all' && item.type !== activeFilters.channel) return false;
        if (activeFilters.broker && !activeFilters.broker.includes('all')) {
            if (!activeFilters.broker.includes(item.broker_family)) return false;
        }
        if (activeFilters.poc && !activeFilters.poc.includes('all')) {
            if (!activeFilters.poc.includes(item.poc)) return false;
        }
        if (activeFilters.agent && !activeFilters.agent.includes('all')) {
            if (!activeFilters.agent.includes(item.agent)) return false;
        }
        if (activeFilters.branch && activeFilters.branch !== 'all' && item.branch !== activeFilters.branch) return false;

        // smallcase RM hiding filter
        if (activeFilters.hideSmallcaseRm && !activeFilters.hideSmallcaseRm.includes('none')) {
            const itemRm = cleanStr(item.rm_name || item.RM_Name || item.rm).trim().toLowerCase();
            const matchesHide = activeFilters.hideSmallcaseRm.some(rm => rm.trim().toLowerCase() === itemRm);
            if (cleanStr(item.branch).toLowerCase() === 'smallcase' && matchesHide) return false;
        }

        return true;
    });

    // Filter active raw call logs
    const filteredCalls = rawData.calls.filter(call => {
        if (!call.date) return false;
        const callTs = safeParseDate(call.date).getTime();
        if (isNaN(callTs)) return false;
        if (callTs < fromTs || callTs > toTs) return false;

        if (activeFilters.channel !== 'all' && activeFilters.channel !== 'Call Ticket' && activeFilters.channel !== 'Voice Call') return false;
        if (activeFilters.broker && !activeFilters.broker.includes('all')) {
            if (!activeFilters.broker.includes(call.broker_family)) return false;
        }
        if (activeFilters.poc && !activeFilters.poc.includes('all')) {
            if (!activeFilters.poc.includes(call.poc)) return false;
        }
        if (activeFilters.agent && !activeFilters.agent.includes('all')) {
            if (!activeFilters.agent.includes(call.agent)) return false;
        }
        if (activeFilters.branch && activeFilters.branch !== 'all' && call.branch !== activeFilters.branch) return false;

        // smallcase RM hiding filter
        if (activeFilters.hideSmallcaseRm && !activeFilters.hideSmallcaseRm.includes('none')) {
            const callRm = cleanStr(call.rm_name || call.RM_Name || call.rm || call.agent).trim().toLowerCase();
            const matchesHide = activeFilters.hideSmallcaseRm.some(rm => rm.trim().toLowerCase() === callRm);
            if (cleanStr(call.branch).toLowerCase() === 'smallcase' && matchesHide) return false;
        }

        return true;
    });

    // Get previous comparative period data
    const prevPeriod = getPreviousPeriodDates(activeFilters.dateFrom, activeFilters.dateTo);
    const prevFromD = safeParseDate(prevPeriod.from);
    if (prevFromD) prevFromD.setHours(0, 0, 0, 0);
    const prevFromTs = prevFromD ? prevFromD.getTime() : 0;

    const prevToD = safeParseDate(prevPeriod.to);
    if (prevToD) prevToD.setHours(23, 59, 59, 999);
    const prevToTs = prevToD ? prevToD.getTime() : 0;

    const prevInteractions = rawData.support_interactions.filter(item => {
        if (!item.date) return false;
        const itemTs = safeParseDate(item.date).getTime();
        if (isNaN(itemTs)) return false;
        if (itemTs < prevFromTs || itemTs > prevToTs) return false;

        // Optionally include Care Emails
        if (item.type === 'Care Email' && !activeFilters.includeCareEmails) return false;

        if (activeFilters.channel !== 'all' && item.type !== activeFilters.channel) return false;
        if (activeFilters.broker && !activeFilters.broker.includes('all')) {
            if (!activeFilters.broker.includes(item.broker_family)) return false;
        }
        if (activeFilters.poc && !activeFilters.poc.includes('all')) {
            if (!activeFilters.poc.includes(item.poc)) return false;
        }
        if (activeFilters.agent && !activeFilters.agent.includes('all')) {
            if (!activeFilters.agent.includes(item.agent)) return false;
        }

        // smallcase RM hiding filter
        if (activeFilters.hideSmallcaseRm && !activeFilters.hideSmallcaseRm.includes('none')) {
            const itemRm = cleanStr(item.rm_name || item.RM_Name || item.rm).trim().toLowerCase();
            const matchesHide = activeFilters.hideSmallcaseRm.some(rm => rm.trim().toLowerCase() === itemRm);
            if (cleanStr(item.branch).toLowerCase() === 'smallcase' && matchesHide) return false;
        }

        return true;
    });

    // Filter active raw agent breaks
    const filteredBreaks = (rawData.agent_breaks || []).filter(b => {
        if (!b.date) return false;
        const breakTs = safeParseDate(b.date).getTime();
        if (isNaN(breakTs)) return false;
        if (breakTs < fromTs || breakTs > toTs) return false;

        if (activeFilters.agent && !activeFilters.agent.includes('all')) {
            if (!activeFilters.agent.includes(b.agent_name)) return false;
        }

        return true;
    });

    window.viewModel = {
        interactions: filteredInteractions,
        calls: filteredCalls,
        breaks: filteredBreaks,
        prevInteractions: prevInteractions,
        fromTs,
        toTs,
        prevFromTs,
        prevToTs
    };

    // Render components based on active tab
    if (currentTab === 'tab-weekly-pulse') {
        renderWeeklyPulseDashboard();
    } else if (currentTab === 'tab-visual-control') {
        renderVisualControlDashboard();
    } else if (currentTab === 'tab-main-dashboard') {
        renderMainDashboard();
    } else if (currentTab === 'tab-intelligence') {
        renderIntelligenceDashboard();
    } else if (currentTab === 'tab-monthly-view') {
        renderMonthlyView();
    } else if (currentTab === 'tab-agent-performance') {
        renderAgentPerformance();
    } else if (currentTab === 'tab-tickets-chats') {
        renderTicketsChatsView();
    } else if (currentTab === 'tab-ai-summary') {
        renderAISummaryTab();
    }
}

function renderWeeklyPulseDashboard() {
    const data = window.viewModel.interactions;
    const calls = window.viewModel.calls;

    // 1. Render Key Metrics Grid
    renderKeyMetricsGrid(data, calls);

    // 2. Render POC Heatmap table
    renderPOCQueryHeatmap(data);

    // 3. Render charts
    renderWeeklyComparisonChart();
    renderPOCContactsChart(data);
    renderPulseTrendChart(data);
    renderCallStatusPieChart(calls);
    renderChannelDonutChart(data);

    // 4. Render active cohorts comparison meta block & table
    renderActiveCohortsGrid();
    renderRepeatLoopsTable(data);

    // 5. Friction hotspots & top directory
    renderFrictionHotspots(data);
    renderTopEntitiesDirectory(data);

    // 6. Attribute Explorer Widget
    renderExplorerWidgetList();

    // 7. Render Preview comment list
    renderCommentsPreview(data);

    // Clear AI summary box on filter change
    document.getElementById('ai-empty-state').classList.remove('hidden');
    document.getElementById('ai-loading-state').classList.add('hidden');
    document.getElementById('ai-content-state').classList.add('hidden');
}

// Helper to destroy charts
function destroyChart(name) {
    if (charts[name]) {
        charts[name].destroy();
        charts[name] = null;
    }
}

// -------------------------------------------------------------
// 4. WEEKLY PULSE SECTION RENDERERS
// -------------------------------------------------------------

// Helper to map POC to color for cards and charts
const getPocColor = (pocName) => {
    const colors = {
        'manoj mathpal': '#a855f7',
        'praful jain': '#10b981',
        'twinkle jaiswal': '#0ea5e9',
        'mansi billa': '#f97316',
        'deepak prajapati': '#ef4444',
        'no poc': '#64748b',
        'thejus j d': '#6366f1',
        'smallcase': '#475569',
        'not shared': '#475569'
    };
    return colors[pocName.toLowerCase()] || '#a855f7';
};

// 4.1. Key Metrics Card Compiler
// 4.1. Key Metrics Card Compiler (Core Operations Snapshot)
function renderKeyMetricsGrid(interactions, calls) {
    let tkt = 0, wa = 0, mail = 0;
    let ans = 0, missed = 0, aoh = 0;
    
    interactions.forEach(item => {
        if (item.type === 'Call Ticket') {
            tkt++;
            let cs = String(item.call_status || "").toLowerCase();
            if (cs === 'other' || !cs) {
                const titleLower = (item.title || "").toLowerCase();
                if (titleLower.includes('missed call')) cs = 'missed';
                else if (titleLower.includes('aoh call')) cs = 'aoh';
                else if (titleLower.includes('answered call')) cs = 'answered';
            }
            if (cs === 'answered') ans++;
            else if (cs === 'missed') missed++;
            else if (cs === 'aoh') aoh++;
        }
        else if (item.type === 'WhatsApp Chat') wa++;
        else if (item.type === 'Care Email') mail++;
    });
    
    // Average Handling Time (AHT) and Average Queue Time (AQT) from Ozonetel Calls sheet (calls)
    // Only count inbound answered calls for AHT/AQT (progressive/outbound excluded)
    let callAns = 0;
    let totalCallDuration = 0;
    let totalCallQueue = 0;
    
    calls.forEach(call => {
        const ct = String(call.call_type || '').toLowerCase();
        const st = String(call.stage || '').toLowerCase();
        // Only inbound answered calls contribute to AHT/AQT
        if (!ct || ct === 'inbound') { // inbound or unclassified
            if (st === 'answered' || st === 'connected') {
                callAns++;
                totalCallDuration += (call.talk_time || call.duration || 0);
                totalCallQueue += (call.queue_time || call.time_to_answer || 0);
            }
        }
    });

    // WhatsApp Chat average resolution time (from Metric Resolution time)
    let totalChatResolution = 0, chatCount = 0;
    interactions.forEach(item => {
        if (item.type === 'WhatsApp Chat' && item.resolution_time !== null && item.resolution_time !== undefined) {
            totalChatResolution += item.resolution_time;
            chatCount++;
        }
    });

    let finalAHT = 0;
    let finalAQT = 0;

    if (activeFilters.channel === 'WhatsApp Chat') {
        finalAHT = chatCount > 0 ? totalChatResolution / chatCount : 0;
        finalAQT = 0;
    } else if (activeFilters.channel === 'Call Ticket' || activeFilters.channel === 'Voice Call') {
        finalAHT = callAns > 0 ? totalCallDuration / callAns : 0;
        finalAQT = callAns > 0 ? totalCallQueue / callAns : 0;
    } else {
        // Combined
        if (callAns > 0) {
            finalAHT = totalCallDuration / callAns;
            finalAQT = totalCallQueue / callAns;
        } else {
            finalAHT = chatCount > 0 ? totalChatResolution / chatCount : 0;
            finalAQT = 0;
        }
    }

    const formatDuration = (sec) => {
        return formatSeconds(sec);
    };

    document.getElementById('pulse-total-interactions').innerText = (tkt + wa + mail).toLocaleString();
    document.getElementById('pulse-call-tickets').innerText = tkt.toLocaleString();
    document.getElementById('pulse-whatsapp-chats').innerText = wa.toLocaleString();
    
    document.getElementById('pulse-answered-calls').innerText = ans.toLocaleString();
    document.getElementById('pulse-missed-calls').innerText = missed.toLocaleString();
    document.getElementById('pulse-aoh-calls').innerText = aoh.toLocaleString();
    
    document.getElementById('pulse-aht').innerText = formatDuration(finalAHT);
    document.getElementById('pulse-aqt').innerText = formatDuration(finalAQT);

    // --- KPI Sub-Info Population ---
    const prevInteractionsData = window.viewModel.prevInteractions || [];
    let prevTkt = 0, prevWa = 0, prevMail = 0, prevAns = 0, prevMissed = 0, prevAoh = 0;
    prevInteractionsData.forEach(item => {
        if (item.type === 'Call Ticket') {
            prevTkt++;
            let cs = String(item.call_status || '').toLowerCase();
            if (cs === 'other' || !cs) {
                const t = (item.title || '').toLowerCase();
                if (t.includes('missed call')) cs = 'missed';
                else if (t.includes('aoh call')) cs = 'aoh';
                else if (t.includes('answered call')) cs = 'answered';
            }
            if (cs === 'answered') prevAns++;
            else if (cs === 'missed') prevMissed++;
            else if (cs === 'aoh') prevAoh++;
        } else if (item.type === 'WhatsApp Chat') prevWa++;
        else if (item.type === 'Care Email') prevMail++;
    });
    const prevTotalInteractions = prevTkt + prevWa + prevMail;
    const total = tkt + wa + mail;

    const mkDelta = (curr, prevV) => {
        if (prevV === 0 && curr === 0) return `<span class="kpi-delta neutral">\u2014 No change</span>`;
        const diff = curr - prevV;
        const pct = prevV > 0 ? Math.abs(Math.round((diff / prevV) * 100)) : 100;
        if (diff > 0) return `<span class="kpi-delta up">\u25b2 +${diff} (${pct}%) vs prev</span>`;
        if (diff < 0) return `<span class="kpi-delta down">\u25bc ${diff} (${pct}%) vs prev</span>`;
        return `<span class="kpi-delta neutral">\u2192 No change vs prev</span>`;
    };

    const setSubInfo = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    };

    // Total Interactions — channel badges + delta
    const tktPct = total > 0 ? Math.round(tkt / total * 100) : 0;
    const waPct = total > 0 ? Math.round(wa / total * 100) : 0;
    const mailPct = total > 0 ? Math.round(mail / total * 100) : 0;
    setSubInfo('pulse-total-sub', `
        ${mkDelta(total, prevTotalInteractions)}
        <div class="kpi-mini-badges">
            <span class="kpi-mini-badge">\ud83d\udcde ${tkt} (${tktPct}%)</span>
            <span class="kpi-mini-badge">\ud83d\udcac ${wa} (${waPct}%)</span>
            ${mail > 0 ? `<span class="kpi-mini-badge">\ud83d\udce7 ${mail} (${mailPct}%)</span>` : ''}
        </div>
    `);

    // Call Tickets
    const ansRate = tkt > 0 ? Math.round(ans / tkt * 100) : 0;
    setSubInfo('pulse-tickets-sub', `
        ${mkDelta(tkt, prevTkt)}
        <div class="kpi-sub-metric">Ans rate: <strong>${ansRate}%</strong> &nbsp;|&nbsp; Missed: <strong>${missed}</strong> &nbsp;|&nbsp; AOH: <strong>${aoh}</strong></div>
    `);

    // WhatsApp Chats
    let waFrtSum = 0, waFrtCount = 0;
    interactions.forEach(item => {
        if (item.type === 'WhatsApp Chat' && item.sla_frt && !isNaN(Number(item.sla_frt))) {
            waFrtSum += Number(item.sla_frt); waFrtCount++;
        }
    });
    const waAvgFrt = waFrtCount > 0 ? formatSeconds(Math.round(waFrtSum / waFrtCount)) : '\u2014';
    setSubInfo('pulse-whatsapp-sub', `
        ${mkDelta(wa, prevWa)}
        <div class="kpi-sub-metric">Avg FRT: <strong>${waAvgFrt}</strong></div>
    `);

    // Answered Calls
    setSubInfo('pulse-answered-sub', `
        ${mkDelta(ans, prevAns)}
        <div class="kpi-sub-metric">Avg AHT: <strong>${formatDuration(finalAHT)}</strong></div>
    `);

    // Missed Calls
    const totalInboundCalls = ans + missed + aoh;
    const abandonRate = totalInboundCalls > 0 ? Math.round(missed / totalInboundCalls * 100) : 0;
    setSubInfo('pulse-missed-sub', `
        ${mkDelta(missed, prevMissed)}
        <div class="kpi-sub-metric">Abandon rate: <strong>${abandonRate}%</strong> of inbound</div>
    `);

    // AOH Calls
    const aohPct = totalInboundCalls > 0 ? Math.round(aoh / totalInboundCalls * 100) : 0;
    setSubInfo('pulse-aoh-sub', `
        ${mkDelta(aoh, prevAoh)}
        <div class="kpi-sub-metric"><strong>${aohPct}%</strong> of inbound call volume</div>
    `);

    // AHT — vs prev period
    const prevToTs = window.viewModel.prevToTs || 0;
    const prevFromTs = window.viewModel.prevFromTs || 0;
    let prevCallAns = 0, prevTotalDur = 0;
    if (rawData && rawData.calls) {
        rawData.calls.forEach(c => {
            if (!c.date) return;
            const ts = safeParseDate(c.date).getTime();
            if (ts < prevFromTs || ts > prevToTs) return;
            const ct = String(c.call_type || '').toLowerCase();
            const st = String(c.stage || '').toLowerCase();
            if (!ct || ct === 'inbound') {
                if (st === 'answered' || st === 'connected') {
                    prevCallAns++;
                    prevTotalDur += (c.talk_time || c.duration || 0);
                }
            }
        });
    }
    const prevAHT = prevCallAns > 0 ? Math.round(prevTotalDur / prevCallAns) : 0;
    const ahtDiff = Math.round(finalAHT) - prevAHT;
    const ahtDeltaHtml = prevAHT === 0
        ? `<span class="kpi-delta neutral">\u2014 No prev data</span>`
        : ahtDiff > 0 ? `<span class="kpi-delta down">\u25b2 +${formatSeconds(ahtDiff)} vs prev</span>`
        : ahtDiff < 0 ? `<span class="kpi-delta up">\u25bc ${formatSeconds(Math.abs(ahtDiff))} vs prev</span>`
        : `<span class="kpi-delta neutral">\u2192 Same as prev</span>`;
    setSubInfo('pulse-aht-sub', `
        ${ahtDeltaHtml}
        <div class="kpi-sub-metric">Prev period: <strong>${formatSeconds(prevAHT)}</strong></div>
    `);

    // AQT — vs prev period
    let prevTotalQueue = 0, prevQueueAns = 0;
    if (rawData && rawData.calls) {
        rawData.calls.forEach(c => {
            if (!c.date) return;
            const ts = safeParseDate(c.date).getTime();
            if (ts < prevFromTs || ts > prevToTs) return;
            const ct = String(c.call_type || '').toLowerCase();
            const st = String(c.stage || '').toLowerCase();
            if (!ct || ct === 'inbound') {
                if (st === 'answered' || st === 'connected') {
                    prevQueueAns++;
                    prevTotalQueue += (c.queue_time || c.time_to_answer || 0);
                }
            }
        });
    }
    const prevAQT = prevQueueAns > 0 ? Math.round(prevTotalQueue / prevQueueAns) : 0;
    const aqtDiff = Math.round(finalAQT) - prevAQT;
    const aqtDeltaHtml = prevAQT === 0
        ? `<span class="kpi-delta neutral">\u2014 No prev data</span>`
        : aqtDiff > 0 ? `<span class="kpi-delta down">\u25b2 +${formatSeconds(aqtDiff)} vs prev</span>`
        : aqtDiff < 0 ? `<span class="kpi-delta up">\u25bc ${formatSeconds(Math.abs(aqtDiff))} vs prev</span>`
        : `<span class="kpi-delta neutral">\u2192 Same as prev</span>`;
    setSubInfo('pulse-aqt-sub', `
        ${aqtDeltaHtml}
        <div class="kpi-sub-metric">Prev period: <strong>${formatSeconds(prevAQT)}</strong></div>
    `);
}


// 4.2. POC Query Heatmap Matrix (Blocks Layout)
function renderPOCQueryHeatmap(data) {
    const container = document.getElementById('pulse-poc-blocks-container');
    container.innerHTML = '';

    // Group metrics per POC
    const pocStats = {};
    const allPocs = new Set();

    // Collect all POCs seen in data
    data.forEach(item => {
        if (item.poc) allPocs.add(item.poc);
    });

    // Also parse from poc mappings to ensure they exist
    rawData.poc_mappings.forEach(m => {
        if (m.POC) allPocs.add(m.POC);
    });

    allPocs.forEach(poc => {
        pocStats[poc] = {
            pocName: poc,
            tkt: 0,
            wa: 0,
            total: 0,
            branches: {},
            rms: {},
            issues: {}
        };
    });

    data.forEach(item => {
        const poc = item.poc || 'No POC';
        if (!pocStats[poc]) return;

        const s = pocStats[poc];
        s.total++;
        if (item.type === 'Call Ticket') s.tkt++;
        else if (item.type === 'WhatsApp Chat') s.wa++;

        if (item.branch && item.branch !== 'Not shared') s.branches[item.branch] = (s.branches[item.branch] || 0) + 1;
        if (item.rm_name && item.rm_name !== 'NA') s.rms[item.rm_name] = (s.rms[item.rm_name] || 0) + 1;

        const cat = item.issue || "General";
        s.issues[cat] = (s.issues[cat] || 0) + 1;
    });

    // Compute repeat clusters per POC
    const pocCombinations = {};
    data.forEach(item => {
        const poc = item.poc || 'No POC';
        if (!pocCombinations[poc]) pocCombinations[poc] = {};
        const combKey = `${item.rm_name}|${item.branch}|${item.issue}|${item.sub_issue}`;
        pocCombinations[poc][combKey] = (pocCombinations[poc][combKey] || 0) + 1;
    });
    const pocRepeatClusters = {};
    Object.keys(pocCombinations).forEach(poc => {
        let repeats = 0;
        Object.values(pocCombinations[poc]).forEach(cnt => {
            if (cnt >= 2) repeats++;
        });
        pocRepeatClusters[poc] = repeats;
    });

    // Render cards sorted by total count desc
    Object.values(pocStats).sort((a, b) => b.total - a.total).forEach(poc => {
        const name = poc.pocName;
        const total = poc.total;
        const wa = poc.wa;
        const tkt = poc.tkt;

        const topBr = Object.keys(poc.branches).sort((a, b) => poc.branches[b] - poc.branches[a])[0] || 'NA';
        const topRM = Object.keys(poc.rms).sort((a, b) => poc.rms[b] - poc.rms[a])[0] || 'NA';
        const topIssue = Object.keys(poc.issues).sort((a, b) => poc.issues[b] - poc.issues[a])[0] || 'NA';
        const repeats = pocRepeatClusters[name] || 0;

        const color = getPocColor(name);

        const card = document.createElement('div');
        card.className = 'poc-block-card';
        card.style.borderLeftColor = color;

        card.innerHTML = `
            <div class="poc-block-name">${name}</div>
            <div class="poc-block-count">${total}</div>
            <div class="poc-block-mix">
                <span class="wa-val">WA ${wa}</span> | <span class="call-val">Call ${tkt}</span>
            </div>
            <div class="poc-block-detail" title="${topBr}">Top branch: <strong>${topBr}</strong></div>
            <div class="poc-block-detail" title="${topRM}">Top RM: <strong>${topRM}</strong></div>
            <div class="poc-block-detail" title="${topIssue}">Issue: <strong>${topIssue}</strong></div>
            <div class="poc-block-detail">Repeat clusters: <strong>${repeats}</strong></div>
        `;

        card.addEventListener('click', () => {
            openPocDeepDiveModal(name);
        });

        container.appendChild(card);
    });
}

// 4.3. Weekly Comparison Bar Chart (WoW Horizontal Layout)
function renderWeeklyComparisonChart() {
    destroyChart('weeklyComparison');

    const activeData = window.viewModel.interactions;
    const prevData = window.viewModel.prevInteractions;

    // Compute WoW parameters based on Call Tickets and WhatsApp Chats
    let actTkt = 0, actWa = 0;
    let actAns = 0, actMiss = 0, actAoh = 0;
    activeData.forEach(item => {
        if (item.type === 'Call Ticket') {
            actTkt++;
            let cs = String(item.call_status || "").toLowerCase();
            if (cs === 'other' || !cs) {
                const titleLower = (item.title || "").toLowerCase();
                if (titleLower.includes('missed call')) cs = 'missed';
                else if (titleLower.includes('aoh call')) cs = 'aoh';
                else if (titleLower.includes('answered call')) cs = 'answered';
            }
            if (cs === 'answered') actAns++;
            else if (cs === 'missed') actMiss++;
            else if (cs === 'aoh') actAoh++;
        } else if (item.type === 'WhatsApp Chat') {
            actWa++;
        }
    });

    let prevTkt = 0, prevWa = 0;
    let prevAns = 0, prevMiss = 0, prevAoh = 0;
    prevData.forEach(item => {
        if (item.type === 'Call Ticket') {
            prevTkt++;
            let cs = String(item.call_status || "").toLowerCase();
            if (cs === 'other' || !cs) {
                const titleLower = (item.title || "").toLowerCase();
                if (titleLower.includes('missed call')) cs = 'missed';
                else if (titleLower.includes('aoh call')) cs = 'aoh';
                else if (titleLower.includes('answered call')) cs = 'answered';
            }
            if (cs === 'answered') prevAns++;
            else if (cs === 'missed') prevMiss++;
            else if (cs === 'aoh') prevAoh++;
        } else if (item.type === 'WhatsApp Chat') {
            prevWa++;
        }
    });

    const ctx = document.getElementById('chart-weekly-comparison').getContext('2d');

    charts.weeklyComparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Call Tickets', 'Answered Calls', 'Missed Calls', 'AOH Calls', 'WhatsApp Chats'],
            datasets: [
                {
                    label: 'Present Period',
                    data: [actTkt, actAns, actMiss, actAoh, actWa],
                    backgroundColor: [
                        'rgba(14, 165, 233, 0.85)',
                        'rgba(16, 185, 129, 0.85)',
                        'rgba(244, 63, 94, 0.85)',
                        'rgba(168, 85, 247, 0.85)',
                        'rgba(20, 184, 166, 0.85)'
                    ],
                    borderRadius: 4
                },
                {
                    label: 'Previous Period',
                    data: [prevTkt, prevAns, prevMiss, prevAoh, prevWa],
                    backgroundColor: [
                        'rgba(14, 165, 233, 0.2)',
                        'rgba(16, 185, 129, 0.2)',
                        'rgba(244, 63, 94, 0.2)',
                        'rgba(168, 85, 247, 0.2)',
                        'rgba(20, 184, 166, 0.2)'
                    ],
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    right: 80
                }
            },
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: THEME_COLORS.border },
                    ticks: { color: THEME_COLORS.textSecondary, font: { family: 'SF Pro Text', size: 9 } }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: THEME_COLORS.textSecondary, font: { family: 'SF Pro Display', size: 10 } }
                }
            }
        },
        plugins: [{
            id: 'rightLabels',
            afterDatasetsDraw(chart) {
                const { ctx, data, chartArea: { right }, scales: { y } } = chart;
                ctx.save();
                ctx.font = 'bold 11px SF Pro Display';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';

                const ds0 = data.datasets[0].data;
                const ds1 = data.datasets[1].data;

                y.getTicks().forEach((tick, index) => {
                    const yPos = y.getPixelForTick(index);
                    const val0 = ds0[index] || 0;
                    const val1 = ds1[index] || 0;

                    let diffPctText = '';
                    let color = THEME_COLORS.gray;
                    if (val1 > 0) {
                        const diff = ((val0 - val1) / val1) * 100;
                        const sign = diff > 0 ? '+' : '';
                        diffPctText = ` ${sign}${Math.round(diff)}%`;
                        color = diff >= 0 ? THEME_COLORS.green : THEME_COLORS.red;
                    } else if (val0 > 0 && val1 === 0) {
                        diffPctText = ' +100%';
                        color = THEME_COLORS.green;
                    } else if (val0 === 0 && val1 > 0) {
                        diffPctText = ' -100%';
                        color = THEME_COLORS.red;
                    }

                    ctx.fillStyle = document.body.classList.contains('light-mode') ? '#0f172a' : '#f8fafc';
                    ctx.fillText(`${val0}`, right + 10, yPos);

                    ctx.fillStyle = color;
                    ctx.font = '600 10px SF Pro Text';
                    ctx.fillText(diffPctText, right + 32, yPos);
                    ctx.font = 'bold 11px SF Pro Display';
                });
                ctx.restore();
            }
        }]
    });
}

// 4.4. POC-wise contacts bar chart (Color coded & top labels)
function renderPOCContactsChart(data) {
    destroyChart('pocContacts');

    const pocCounts = {};
    data.forEach(item => {
        if (item.poc) {
            pocCounts[item.poc] = (pocCounts[item.poc] || 0) + 1;
        }
    });

    const sorted = Object.entries(pocCounts).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(x => x[0]);
    const counts = sorted.map(x => x[1]);
    const colors = labels.map(lbl => getPocColor(lbl));

    const ctx = document.getElementById('chart-poc-contacts').getContext('2d');

    charts.pocContacts = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Interactions',
                data: counts,
                backgroundColor: colors,
                borderRadius: 6,
                barThickness: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: THEME_COLORS.textSecondary, font: { family: 'SF Pro Text', size: 9 } }
                },
                y: {
                    grid: { color: THEME_COLORS.border },
                    ticks: { color: THEME_COLORS.textSecondary, font: { family: 'SF Pro Display', size: 10 } }
                }
            }
        },
        plugins: [{
            id: 'barLabels',
            afterDatasetsDraw(chart) {
                const { ctx, data } = chart;
                ctx.save();
                ctx.font = 'bold 10px SF Pro Text';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';

                chart.getDatasetMeta(0).data.forEach((bar, index) => {
                    const val = data.datasets[0].data[index];
                    if (val > 0) {
                        ctx.fillStyle = document.body.classList.contains('light-mode') ? '#334155' : '#cbd5e1';
                        ctx.fillText(val, bar.x, bar.y - 4);
                    }
                });
                ctx.restore();
            }
        }]
    });
}

// 4.5. Support Channels Trend (Line Chart with Glowing lines & Area fills)
function renderPulseTrendChart(data) {
    destroyChart('pulseTrend');

    const dateCounts = {};
    data.forEach(item => {
        if (!item.date) return;
        const dStr = item.date.split(' ')[0];
        if (!dateCounts[dStr]) dateCounts[dStr] = { tkt: 0, wa: 0 };
        if (item.type === 'Call Ticket') dateCounts[dStr].tkt++;
        else if (item.type === 'WhatsApp Chat') dateCounts[dStr].wa++;
    });

    const sortedDates = Object.keys(dateCounts).sort();

    const ctx = document.getElementById('chart-pulse-trend').getContext('2d');

    // Gradients
    const blueGrad = ctx.createLinearGradient(0, 0, 0, 300);
    blueGrad.addColorStop(0, hexToRgba(THEME_COLORS.blue, 0.35));
    blueGrad.addColorStop(1, hexToRgba(THEME_COLORS.blue, 0.0));

    const greenGrad = ctx.createLinearGradient(0, 0, 0, 300);
    greenGrad.addColorStop(0, hexToRgba(THEME_COLORS.green, 0.35));
    greenGrad.addColorStop(1, hexToRgba(THEME_COLORS.green, 0.0));

    charts.pulseTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [
                {
                    label: 'Call Tickets',
                    data: sortedDates.map(d => dateCounts[d].tkt),
                    borderColor: THEME_COLORS.blue,
                    backgroundColor: blueGrad,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: THEME_COLORS.blue,
                    pointBorderColor: 'transparent'
                },
                {
                    label: 'WhatsApp',
                    data: sortedDates.map(d => dateCounts[d].wa),
                    borderColor: THEME_COLORS.green,
                    backgroundColor: greenGrad,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: THEME_COLORS.green,
                    pointBorderColor: 'transparent'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: THEME_COLORS.textSecondary,
                        font: { family: 'SF Pro Display', size: 11, weight: '500' }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: THEME_COLORS.textSecondary, font: { family: 'SF Pro Text', size: 9 } }
                },
                y: {
                    grid: { color: THEME_COLORS.border },
                    ticks: { color: THEME_COLORS.textSecondary, font: { family: 'SF Pro Display', size: 10 } }
                }
            }
        },
        plugins: [{
            id: 'glow',
            beforeDatasetDraw(chart, args, options) {
                const ctx = chart.ctx;
                ctx.save();
                const dataset = chart.data.datasets[args.index];
                if (dataset.label === 'Call Tickets') {
                    ctx.shadowColor = hexToRgba(THEME_COLORS.blue, 0.45);
                    ctx.shadowBlur = 12;
                } else if (dataset.label === 'WhatsApp') {
                    ctx.shadowColor = hexToRgba(THEME_COLORS.green, 0.45);
                    ctx.shadowBlur = 12;
                }
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 4;
            },
            afterDatasetDraw(chart, args, options) {
                chart.ctx.restore();
            }
        }]
    });
}

// 4.6. Call Ticket Type Mix Donut Chart
function renderCallStatusPieChart(calls) {
    destroyChart('callStatusPie');

    const data = window.viewModel.interactions;
    let ans = 0, missed = 0, aoh = 0, other = 0;

    data.forEach(item => {
        if (item.type !== 'Call Ticket') return;
        let cs = String(item.call_status || "").toLowerCase();
        if (cs === 'other' || !cs) {
            const titleLower = (item.title || "").toLowerCase();
            if (titleLower.includes('missed call')) cs = 'missed';
            else if (titleLower.includes('aoh call')) cs = 'aoh';
            else if (titleLower.includes('answered call')) cs = 'answered';
        }
        if (cs === 'answered') ans++;
        else if (cs === 'missed') missed++;
        else if (cs === 'aoh') aoh++;
        else other++;
    });

    const ctx = document.getElementById('chart-call-status-pie').getContext('2d');

    charts.callStatusPie = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [`Answered (${ans})`, `Missed (${missed})`, `AOH (${aoh})`, `Other (${other})`],
            datasets: [{
                data: [ans, missed, aoh, other],
                backgroundColor: [
                    THEME_COLORS.green,
                    THEME_COLORS.red,
                    THEME_COLORS.purple,
                    THEME_COLORS.gray
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: THEME_COLORS.textSecondary,
                        font: { family: 'SF Pro Display', size: 10 }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// 4.6b. Channel Distribution Donut Chart
let channelDonutChartInst = null;
function renderChannelDonutChart(data) {
    const canvas = document.getElementById('chart-channel-donut');
    if (!canvas) return;

    const counts = { 'Call Ticket': 0, 'WhatsApp Chat': 0, 'Care Email': 0 };
    data.forEach(item => {
        if (counts[item.type] !== undefined) counts[item.type]++;
        else counts['Care Email']++;
    });

    const labels = ['Call Tickets', 'WhatsApp Chats', 'Care Emails'];
    const values = [counts['Call Ticket'], counts['WhatsApp Chat'], counts['Care Email']];
    const total = values.reduce((a, b) => a + b, 0);

    if (channelDonutChartInst) channelDonutChartInst.destroy();
    const ctx = canvas.getContext('2d');
    channelDonutChartInst = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: ['rgba(14,165,233,0.85)', 'rgba(34,197,94,0.85)', 'rgba(249,115,22,0.85)'],
                borderColor: [THEME_COLORS.cardBg, THEME_COLORS.cardBg, THEME_COLORS.cardBg],
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, animation: { duration: 700 },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const pct = total > 0 ? Math.round(ctx.raw / total * 100) : 0;
                            return ` ${ctx.label}: ${ctx.raw.toLocaleString()} (${pct}%)`;
                        }
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: { color: THEME_COLORS.textSecondary, font: { family: 'SF Pro Display', size: 10 }, padding: 12 }
                }
            },
            cutout: '65%'
        }
    });
}

// 4.7. Active Cohorts Comparison Grid

function renderActiveCohortsGrid() {
    const data = window.viewModel.interactions;
    const prev = window.viewModel.prevInteractions;

    const getCohortCounts = (interactionsList) => {
        const rms = new Set();
        const brokers = new Set();
        const branches = new Set();
        interactionsList.forEach(item => {
            if (item.rm_name && item.rm_name !== 'NA') {
                const broker = item.broker_family || 'NA';
                const branch = item.branch || 'Not shared';
                rms.add(`${item.rm_name}||${broker}||${branch}`);
            }
            if (item.broker_family && item.broker_family !== 'NA') brokers.add(item.broker_family);
            if (item.branch && item.branch !== 'Not shared') branches.add(item.branch);
        });
        return { rms: rms.size, brokers: brokers.size, branches: branches.size };
    };

    const curr = getCohortCounts(data);
    const prevCounts = getCohortCounts(prev);

    // Loops count comparison
    // We count loops on current vs previous
    const getLoopsCount = (interactionsList) => {
        const loopGroups = {};
        interactionsList.forEach(item => {
            if (!item.rm_name || item.rm_name === "NA" || !item.date) return;
            if (item.issue === "General" || item.issue === "Voice Call") return;
            const k = `${item.rm_name}||${item.broker_family}||${item.branch}||${item.issue}`;
            if (!loopGroups[k]) loopGroups[k] = [];
            try {
                loopGroups[k].push(safeParseDate(item.date).getTime());
            } catch (e) { }
        });
        let c = 0;
        Object.values(loopGroups).forEach(tss => {
            if (tss.length < 2) return;
            tss.sort((a, b) => a - b);
            for (let i = 1; i < tss.length; i++) {
                if (tss[i] - tss[i - 1] <= 7 * 24 * 60 * 60 * 1000) c++;
            }
        });
        return c;
    };

    const currLoops = getLoopsCount(data);
    const prevLoops = getLoopsCount(prev);

    // Binders
    const formatCmp = (currV, prevV, elemId) => {
        const elem = document.getElementById(elemId);
        document.getElementById(elemId.replace('cmp', 'val')).innerText = currV.toLocaleString();

        elem.classList.remove('meta-comp-up', 'meta-comp-down', 'meta-comp-neutral');

        if (currV > prevV) {
            const diff = currV - prevV;
            elem.innerText = `+${diff} vs prev`;
            elem.classList.add('meta-comp-up');
        } else if (currV < prevV) {
            const diff = prevV - currV;
            elem.innerText = `-${diff} vs prev`;
            elem.classList.add('meta-comp-down');
        } else {
            elem.innerText = `No change`;
            elem.classList.add('meta-comp-neutral');
        }
    };

    formatCmp(curr.rms, prevCounts.rms, 'meta-rms-cmp');
    formatCmp(curr.brokers, prevCounts.brokers, 'meta-brokers-cmp');
    formatCmp(curr.branches, prevCounts.branches, 'meta-branches-cmp');
    formatCmp(currLoops, prevLoops, 'meta-loops-cmp');

    // Attach click handlers for deep dive modals
    const rmItem = document.getElementById('cohort-rm-item');
    const brokerItem = document.getElementById('cohort-broker-item');
    const branchItem = document.getElementById('cohort-branch-item');
    if (rmItem) { rmItem.onclick = () => openCohortDrilldownModal('rm'); }
    if (brokerItem) { brokerItem.onclick = () => openCohortDrilldownModal('broker'); }
    if (branchItem) { branchItem.onclick = () => openCohortDrilldownModal('branch'); }
}

// -------------------------------------------------------------------------
// COHORT DRILLDOWN MODAL
// -------------------------------------------------------------------------
let cohortModalCurrentType = null;
let cohortModalAllRows = [];
let cohortModalSortKey = null;
let cohortModalSortDir = 1;

function openCohortDrilldownModal(type) {
    cohortModalCurrentType = type;
    cohortModalSortKey = null;
    cohortModalSortDir = 1;

    const data = window.viewModel.interactions || [];
    const overlay = document.getElementById('cohort-modal-overlay');
    const titleEl = document.getElementById('cohort-modal-title');
    const headEl = document.getElementById('cohort-table-head');
    const searchEl = document.getElementById('cohort-modal-search');
    if (!overlay) return;
    if (searchEl) searchEl.value = '';

    if (type === 'rm') {
        titleEl.innerText = '🧑‍💼 Active Relationship Managers';
        // Build RM rows
        const rmMap = {};
        data.forEach(item => {
            if (!item.rm_name || item.rm_name === 'NA') return;
            const key = item.rm_name;
            if (!rmMap[key]) {
                rmMap[key] = {
                    rm: item.rm_name, broker: item.broker_family || '—', rm_number: item.rm_number || '—', branch: item.branch || '—',
                    channels: new Set(), contacts: 0, lastDate: null, issues: {}, poc: item.poc || '—'
                };
            }
            rmMap[key].contacts++;
            rmMap[key].channels.add(item.channel || item.type || '—');
            const d = item.date ? safeParseDate(item.date) : null;
            if (d && (!rmMap[key].lastDate || d > rmMap[key].lastDate)) rmMap[key].lastDate = d;
            if (item.issue) rmMap[key].issues[item.issue] = (rmMap[key].issues[item.issue] || 0) + 1;
        });
        cohortModalAllRows = Object.values(rmMap).map(r => ({
            rm: r.rm, broker: r.broker, rm_number: r.rm_number, branch: r.branch,
            channels: [...r.channels].join(', '),
            contacts: r.contacts,
            poc: r.poc,
            lastContact: r.lastDate ? r.lastDate.toLocaleDateString('en-IN') : '—',
            topIssue: Object.entries(r.issues).sort((a,b) => b[1]-a[1])[0]?.[0] || '—'
        })).sort((a, b) => b.contacts - a.contacts);

        headEl.innerHTML = `<tr>
            <th data-col="rm">RM Name<span class="sort-arr"></span></th>
            <th data-col="broker">Broker Name<span class="sort-arr"></span></th>
            <th data-col="rm_number">RM Number<span class="sort-arr"></span></th>
            <th data-col="branch">Branch<span class="sort-arr"></span></th>
            <th data-col="channels">Channels</th>
            <th data-col="contacts"># Contacts<span class="sort-arr"></span></th>
            <th data-col="poc">POC<span class="sort-arr"></span></th>
            <th data-col="lastContact">Last Contact<span class="sort-arr"></span></th>
            <th data-col="topIssue">Top Issue</th>
        </tr>`;

    } else if (type === 'broker') {
        titleEl.innerText = '🏢 Active Partner Brokerages';
        const brkMap = {};
        data.forEach(item => {
            if (!item.broker_family || item.broker_family === 'NA') return;
            const key = item.broker_family;
            if (!brkMap[key]) brkMap[key] = { broker: key, rms: new Set(), branches: new Set(), contacts: 0, issues: {} };
            brkMap[key].contacts++;
            if (item.rm_name && item.rm_name !== 'NA') brkMap[key].rms.add(item.rm_name);
            if (item.branch && item.branch !== 'Not shared') brkMap[key].branches.add(item.branch);
            if (item.issue) brkMap[key].issues[item.issue] = (brkMap[key].issues[item.issue] || 0) + 1;
        });
        cohortModalAllRows = Object.values(brkMap).map(r => ({
            broker: r.broker, rms: r.rms.size, branches: r.branches.size,
            contacts: r.contacts,
            topRM: [...r.rms][0] || '—',
            topBranch: [...r.branches][0] || '—',
            topIssue: Object.entries(r.issues).sort((a,b) => b[1]-a[1])[0]?.[0] || '—'
        })).sort((a, b) => b.contacts - a.contacts);

        headEl.innerHTML = `<tr>
            <th data-col="broker">Broker Name<span class="sort-arr"></span></th>
            <th data-col="rms"># RMs<span class="sort-arr"></span></th>
            <th data-col="branches"># Branches<span class="sort-arr"></span></th>
            <th data-col="contacts"># Contacts<span class="sort-arr"></span></th>
            <th data-col="topRM">Top RM</th>
            <th data-col="topBranch">Top Branch</th>
            <th data-col="topIssue">Top Issue</th>
        </tr>`;

    } else if (type === 'branch') {
        titleEl.innerText = '🏛️ Active Partner Branches';
        const brMap = {};
        data.forEach(item => {
            if (!item.branch || item.branch === 'Not shared') return;
            const key = item.branch;
            if (!brMap[key]) brMap[key] = { branch: key, broker: item.broker_family || '—', rms: new Set(), contacts: 0, issues: {} };
            brMap[key].contacts++;
            if (item.rm_name && item.rm_name !== 'NA') brMap[key].rms.add(item.rm_name);
            if (item.issue) brMap[key].issues[item.issue] = (brMap[key].issues[item.issue] || 0) + 1;
        });
        cohortModalAllRows = Object.values(brMap).map(r => ({
            branch: r.branch, broker: r.broker, rms: r.rms.size,
            contacts: r.contacts,
            topRM: [...r.rms][0] || '—',
            topIssue: Object.entries(r.issues).sort((a,b) => b[1]-a[1])[0]?.[0] || '—'
        })).sort((a, b) => b.contacts - a.contacts);

        headEl.innerHTML = `<tr>
            <th data-col="branch">Branch Name<span class="sort-arr"></span></th>
            <th data-col="broker">Broker<span class="sort-arr"></span></th>
            <th data-col="rms"># RMs<span class="sort-arr"></span></th>
            <th data-col="contacts"># Contacts<span class="sort-arr"></span></th>
            <th data-col="topRM">Top RM</th>
            <th data-col="topIssue">Top Issue</th>
        </tr>`;
    }

    // Attach sort handlers
    headEl.querySelectorAll('th[data-col]').forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
            const col = th.getAttribute('data-col');
            if (cohortModalSortKey === col) cohortModalSortDir *= -1;
            else { cohortModalSortKey = col; cohortModalSortDir = 1; }
            renderCohortModalRows(document.getElementById('cohort-modal-search')?.value || '');
        });
    });

    renderCohortModalRows('');
    document.getElementById('cohort-modal-count').innerText = `${cohortModalAllRows.length} records`;
    overlay.classList.add('visible');
}

function renderCohortModalRows(filter) {
    const tbody = document.getElementById('cohort-table-body');
    if (!tbody) return;
    let rows = cohortModalAllRows;
    if (filter) {
        const q = filter.toLowerCase();
        rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    if (cohortModalSortKey) {
        rows = [...rows].sort((a, b) => {
            const av = a[cohortModalSortKey], bv = b[cohortModalSortKey];
            if (typeof av === 'number') return (av - bv) * cohortModalSortDir;
            return String(av).localeCompare(String(bv)) * cohortModalSortDir;
        });
    }
    tbody.innerHTML = rows.map(r => {
        const cells = Object.values(r).map((v, i) => {
            if (i === 0) return `<td class="cohort-td-primary">${v}</td>`;
            if (typeof v === 'number') return `<td class="cohort-td-count">${v.toLocaleString()}</td>`;
            return `<td><span class="cohort-td-badge">${v}</span></td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    }).join('');
    document.getElementById('cohort-modal-count').innerText = `${rows.length} of ${cohortModalAllRows.length} records`;
}

function exportCohortToCSV() {
    const data = window.viewModel ? (window.viewModel.interactions || []) : [];
    if (!data.length) return;

    // Build RM-level breakdown
    const rmMap = {};
    data.forEach(item => {
        if (!item.rm_name || item.rm_name === 'NA') return;
        const key = item.rm_name;
        if (!rmMap[key]) {
            rmMap[key] = {
                rm: item.rm_name,
                broker: item.broker_family || '—',
                rm_number: item.rm_number || '—',
                branch: item.branch || '—',
                channels: new Set(),
                contacts: 0,
                poc: item.poc || '—'
            };
        }
        rmMap[key].contacts++;
        rmMap[key].channels.add(item.channel || item.type || '—');
    });

    const rmRows = Object.values(rmMap).map(r => ({
        rm: r.rm,
        broker: r.broker,
        rm_number: r.rm_number,
        channels: [...r.channels].join(', '),
        branch: r.branch,
        contacts: r.contacts,
        poc: r.poc
    })).sort((a, b) => b.contacts - a.contacts);

    const headers = ["RM Name", "RM Broker Name", "RM Number", "Channel (B2B)", "Branch", "number of contacts", "POC"];
    let csvContent = headers.join(',') + '\n';
    rmRows.forEach(r => {
        const rowData = [
            r.rm || '',
            r.broker || '',
            r.rm_number || '',
            r.channels || '',
            r.branch || '',
            r.contacts || 0,
            r.poc || ''
        ];
        csvContent += rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cohort_${cohortModalCurrentType}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
}

// Wire cohort modal events — deferred to ensure DOM is ready
function initCohortModalEvents() {
    const closeBtn = document.getElementById('cohort-modal-close');
    const overlay = document.getElementById('cohort-modal-overlay');
    const searchEl = document.getElementById('cohort-modal-search');
    const exportBtn = document.getElementById('cohort-export-btn');
    if (closeBtn && !closeBtn._wiredCohort) {
        closeBtn._wiredCohort = true;
        closeBtn.addEventListener('click', () => overlay.classList.remove('visible'));
    }
    if (overlay && !overlay._wiredCohort) {
        overlay._wiredCohort = true;
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('visible'); });
    }
    if (searchEl && !searchEl._wiredCohort) {
        searchEl._wiredCohort = true;
        searchEl.addEventListener('input', e => renderCohortModalRows(e.target.value));
    }
    if (exportBtn && !exportBtn._wiredCohort) {
        exportBtn._wiredCohort = true;
        exportBtn.addEventListener('click', exportCohortToCSV);
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCohortModalEvents);
} else {
    initCohortModalEvents();
}


// 4.8. Repeat Loops analysis table

function renderRepeatLoopsTable(data) {
    const tbody = document.getElementById('pulse-loops-body');
    tbody.innerHTML = '';

    const loopGroups = {};
    data.forEach(item => {
        if (!item.rm_name || item.rm_name === 'NA' || !item.date) return;
        if (item.issue === 'General' || item.issue === 'Voice Call') return;

        const key = `${item.rm_name}||${item.broker_family}||${item.branch}||${item.issue}`;
        if (!loopGroups[key]) loopGroups[key] = [];
        try {
            loopGroups[key].push(safeParseDate(item.date).getTime());
        } catch (e) { }
    });

    const list = [];
    Object.entries(loopGroups).forEach(([k, tss]) => {
        if (tss.length < 2) return;
        tss.sort((a, b) => a - b);
        let count = 0;
        for (let i = 1; i < tss.length; i++) {
            if (tss[i] - tss[i - 1] <= 7 * 24 * 60 * 60 * 1000) count++;
        }
        if (count > 0) {
            const [rm, broker, branch, issue] = k.split('||');
            list.push({ rm, broker, branch, issue, count });
        }
    });

    list.sort((a, b) => b.count - a.count);
    const slice = list.slice(0, 5);

    if (slice.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-muted text-center" style="text-align: center;">No 7-day repeat loops detected.</td></tr>';
        return;
    }

    slice.forEach(loop => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${loop.rm}</strong></td>
                <td><span class="badge">${loop.broker}</span></td>
                <td><span class="badge badge-poc">${loop.branch}</span></td>
                <td>${loop.issue}</td>
                <td class="text-right text-red"><strong>${loop.count} repeats</strong></td>
            </tr>
        `;
    });
}

// 4.9. Critical Issue Hotspots Widget
function renderFrictionHotspots(data) {
    const container = document.getElementById('pulse-hotspots-list');
    container.innerHTML = '';

    const hotspots = {};
    data.forEach(item => {
        if (item.broker_family === 'Unknown' || item.branch === 'Not shared') return;
        const key = `${item.broker_family} | ${item.branch}`;
        if (!hotspots[key]) {
            hotspots[key] = {
                title: key,
                broker: item.broker_family,
                branch: item.branch,
                count: 0,
                recent_issue: ''
            };
        }
        hotspots[key].count++;
        hotspots[key].recent_issue = item.sub_issue; // Use sub-issue rather than issue!
    });

    const sorted = Object.values(hotspots).sort((a, b) => b.count - a.count).slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = '<div class="text-muted" style="text-align: center; padding: 24px;">No active support hotspots found.</div>';
        return;
    }

    sorted.forEach(hot => {
        const item = document.createElement('div');
        item.className = 'hotspot-item';
        item.innerHTML = `
            <div class="hotspot-info">
                <span class="hotspot-title">${hot.title}</span>
                <span class="hotspot-sub">Most Recent Sub-Issue: <strong>${hot.recent_issue}</strong></span>
            </div>
            <div class="hotspot-count-pill">${hot.count} issues</div>
        `;
        container.appendChild(item);
    });
}

// 4.10. Top Entities Directory
function renderTopEntitiesDirectory(data) {
    const counts = {
        poc: {}, agent: {}, branch: {}, rm: {}, broker: {}, channel: {}, issue: {}, subissue: {}
    };

    data.forEach(item => {
        if (item.poc && item.poc !== 'Not shared' && item.poc !== 'No POC') counts.poc[item.poc] = (counts.poc[item.poc] || 0) + 1;
        if (item.agent && item.agent !== 'Unassigned' && item.agent !== 'System') counts.agent[item.agent] = (counts.agent[item.agent] || 0) + 1;
        if (item.branch && item.branch !== 'Not shared') counts.branch[item.branch] = (counts.branch[item.branch] || 0) + 1;
        if (item.rm_name && item.rm_name !== 'NA') counts.rm[item.rm_name] = (counts.rm[item.rm_name] || 0) + 1;
        if (item.broker_family && item.broker_family !== 'NA') counts.broker[item.broker_family] = (counts.broker[item.broker_family] || 0) + 1;
        if (item.channel) counts.channel[item.channel] = (counts.channel[item.channel] || 0) + 1;
        if (item.issue) counts.issue[item.issue] = (counts.issue[item.issue] || 0) + 1;
        if (item.sub_issue) counts.subissue[item.sub_issue] = (counts.subissue[item.sub_issue] || 0) + 1;
    });

    const getTop = (obj) => {
        const sorted = Object.entries(obj).sort((a, b) => b[1] - a[1]);
        return sorted[0] ? `${sorted[0][0]} (${sorted[0][1]})` : '-';
    };

    document.getElementById('dir-top-poc').innerText = getTop(counts.poc);
    document.getElementById('dir-top-agent').innerText = getTop(counts.agent);
    document.getElementById('dir-top-branch').innerText = getTop(counts.branch);
    document.getElementById('dir-top-rm').innerText = getTop(counts.rm);
    document.getElementById('dir-top-broker').innerText = getTop(counts.broker);
    document.getElementById('dir-top-channel').innerText = getTop(counts.channel);
    document.getElementById('dir-top-issue').innerText = getTop(counts.issue);
    document.getElementById('dir-top-subissue').innerText = getTop(counts.subissue);
}

// -------------------------------------------------------------
// 5. ATTRIBUTE EXPLORER WIDGET LOGIC
// -------------------------------------------------------------

function renderExplorerWidgetList() {
    const list = document.getElementById('explorer-options-list');
    list.innerHTML = '';

    // Set Header
    const tabHeadersMap = {
        'broker_family': 'Select Broker Option',
        'poc': 'Select POC Option',
        'agent': 'Select Agent Option',
        'branch': 'Select Branch Option',
        'rm_name': 'Select RM Option',
        'channel': 'Select Channel Option',
        'issue': 'Select Issue Option',
        'sub_issue': 'Select Sub-issue Option'
    };
    document.getElementById('exp-options-header').innerText = tabHeadersMap[explorerActiveTab];

    const data = window.viewModel.interactions;

    // Compute Option Counts
    const optionCounts = {};
    data.forEach(item => {
        let val = item[explorerActiveTab];
        if (explorerActiveTab === 'poc' && (val === 'Not shared' || val === 'No POC')) return;
        if (explorerActiveTab === 'agent' && (val === 'Unassigned' || val === 'System')) return;
        if (explorerActiveTab === 'branch' && val === 'Not shared') return;
        if (explorerActiveTab === 'broker_family' && val === 'NA') return;

        if (val) {
            optionCounts[val] = (optionCounts[val] || 0) + 1;
        }
    });

    const sorted = Object.entries(optionCounts).sort((a, b) => b[1] - a[1]);
    const maxCount = sorted[0] ? sorted[0][1] : 1;

    // Update tab badges with total unique-count per dimension
    document.querySelectorAll('.exp-tab-btn').forEach(btn => {
        const attr = btn.getAttribute('data-attr');
        const dimCounts = {};
        data.forEach(item => { const v = item[attr]; if (v) dimCounts[v] = 1; });
        const n = Object.keys(dimCounts).length;
        let badge = btn.querySelector('.exp-tab-badge');
        if (!badge) { badge = document.createElement('span'); badge.className = 'exp-tab-badge'; btn.appendChild(badge); }
        badge.textContent = n;
    });

    if (sorted.length === 0) {
        list.innerHTML = '<div class="text-muted" style="padding: 10px;">No explorer options found.</div>';
        document.getElementById('explorer-dissect-empty').classList.remove('hidden');
        document.getElementById('explorer-dissect-content').classList.add('hidden');
        return;
    }

    sorted.forEach(([opt, count]) => {
        const btn = document.createElement('button');
        btn.className = 'explorer-item-btn';
        if (explorerSelectedOption === opt) btn.classList.add('selected');
        const barPct = maxCount > 0 ? Math.round(count / maxCount * 100) : 0;

        btn.innerHTML = `
            <div class="explorer-item-label">
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;margin-right:6px;">${opt}</span>
                <span class="explorer-item-val">${count}</span>
            </div>
            <div class="explorer-item-bar-track">
                <div class="explorer-item-bar-fill" style="width:${barPct}%;"></div>
            </div>
        `;

        btn.addEventListener('click', () => {
            document.querySelectorAll('#explorer-options-list button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            explorerSelectedOption = opt;
            showExplorerDissection(opt, count);
        });

        list.appendChild(btn);
    });

    // Auto-select first if none selected
    if (!explorerSelectedOption && sorted[0]) {
        explorerSelectedOption = sorted[0][0];
        const firstBtn = list.children[0];
        firstBtn.classList.add('selected');
        showExplorerDissection(sorted[0][0], sorted[0][1]);
    }
}

function showExplorerDissection(optionName, totalCount) {
    document.getElementById('explorer-dissect-empty').classList.add('hidden');

    const content = document.getElementById('explorer-dissect-content');
    content.classList.remove('hidden');

    document.getElementById('dissect-target-title').innerText = optionName;
    document.getElementById('dissect-target-count').innerText = `${totalCount} issues`;

    const data = window.viewModel.interactions;
    // Filter records matching the selected explorer option
    const filtered = data.filter(item => item[explorerActiveTab] === optionName);

    // Group by all other dimensions
    const dims = {
        poc: {},
        agent: {},
        branch: {},
        rm_name: {},
        broker_family: {},
        issue: {},
        sub_issue: {}
    };

    filtered.forEach(item => {
        Object.keys(dims).forEach(dim => {
            if (dim === explorerActiveTab) return; // Skip current explorer tab
            const val = item[dim];
            if (val) {
                dims[dim][val] = (dims[dim][val] || 0) + 1;
            }
        });
    });

    const dissectGrid = document.getElementById('explorer-dissect-grid');
    dissectGrid.innerHTML = '';

    // Dissect dimension labels
    const dimTitles = {
        poc: 'Mapped POC',
        agent: 'Assigned Agents',
        branch: 'Branch Locations',
        rm_name: 'Relationship Managers',
        broker_family: 'Broker Families',
        issue: 'Issue Categories',
        sub_issue: 'Sub-issue Categories'
    };

    Object.entries(dims).forEach(([dim, counts]) => {
        if (dim === explorerActiveTab) return;

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (sorted.length === 0) return;

        const card = document.createElement('div');
        card.className = 'dissect-card';
        card.innerHTML = `<h4 class="dissect-title">${dimTitles[dim]}</h4>`;

        const listDiv = document.createElement('div');
        listDiv.className = 'dissect-items-list';
        const maxCnt = sorted[0][1];

        sorted.forEach(([lbl, cnt], idx) => {
            const pct = totalCount > 0 ? Math.round((cnt / totalCount) * 100) : 0;
            const barW = maxCnt > 0 ? Math.round((cnt / maxCnt) * 100) : 0;

            listDiv.innerHTML += `
                <div class="dissect-items-row-wrapper" style="margin-bottom: 7px;">
                    <div class="dissect-row">
                        <span class="dissect-lbl" title="${lbl}">${lbl}</span>
                        <span class="dissect-val">${cnt} <span style="opacity:0.6;font-weight:500">(${pct}%)</span></span>
                    </div>
                    <div class="dissect-bar-track">
                        <div class="dissect-bar-fill c${idx % 4}" style="width: ${barW}%;"></div>
                    </div>
                </div>
            `;
        });

        card.appendChild(listDiv);
        dissectGrid.appendChild(card);
    });

}

// -------------------------------------------------------------
// 6. COMMENT PREVIEWS & AI NARRATIVE SUMMARIZER
// -------------------------------------------------------------

function renderCommentsPreview(data) {
    const list = document.getElementById('pulse-comments-preview-list');
    list.innerHTML = '';

    const withComments = data.filter(item => item.comments && item.comments.trim().length > 10);
    const sorted = withComments.sort((a, b) => safeParseDate(b.date).getTime() - safeParseDate(a.date).getTime());
    const previewSorted = sorted.slice(0, 30);

    if (previewSorted.length === 0) {
        list.innerHTML = '<div class="text-muted" style="padding: 10px;">No support comments logged.</div>';
    } else {
        previewSorted.forEach(item => {
            list.innerHTML += `
                <div class="comment-preview-item">
                    <div class="comment-preview-meta">
                        <strong>${item.rm_name}</strong>
                        <span>${item.date}</span>
                    </div>
                    <div class="comment-text" style="font-size: 0.76rem;">"${item.comments}"</div>
                </div>
            `;
        });
    }

    // Populate live feed strip
    const liveTrack = document.getElementById('pulse-live-feed-track');
    if (liveTrack) {
        liveTrack.innerHTML = '';
        const latest15 = sorted.slice(0, 15);
        if (latest15.length === 0) {
            liveTrack.innerHTML = '<div class="text-muted" style="padding: 16px;">No support comments logged.</div>';
        } else {
            latest15.forEach(item => {
                liveTrack.innerHTML += `
                    <div class="live-feed-item">
                        <div class="live-feed-meta">
                            <span class="status-dot glowing-green" style="margin-right: 6px;"></span>
                            <strong style="margin-right: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.rm_name || 'B2B Agent'}</strong>
                            <span style="color: var(--text-muted); font-size: 0.7rem; flex-shrink: 0;">${item.date ? item.date.split(' ')[0] : ''}</span>
                        </div>
                        <div class="live-feed-text" title="${item.comments}">${item.comments}</div>
                    </div>
                `;
            });
        }
    }
}

async function generateAISummary() {
    const emptyState = document.getElementById('ai-empty-state');
    const loadingState = document.getElementById('ai-loading-state');
    const contentState = document.getElementById('ai-content-state');
    const narrativeBlock = document.getElementById('ai-narrative-block');

    emptyState.classList.add('hidden');
    loadingState.classList.remove('hidden');
    contentState.classList.add('hidden');

    const data = window.viewModel.interactions;
    const withComments = data.filter(item => item.comments && item.comments.trim().length > 10);

    // Prepare up to 80 records with full context
    const selectedComments = withComments.slice(0, 80).map((r, i) => {
        return `${i + 1}. [RM=${r.rm_name || 'NA'} | Broker=${r.broker_family || 'NA'} | Branch=${r.branch || 'NA'} | Issue=${r.issue || 'NA'} | Sub-Issue=${r.sub_issue || 'NA'} | Date=${r.date || 'NA'}]: "${r.comments.substring(0, 200)}"`;
    }).join('\n');

    if (!selectedComments) {
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
        alert('Not enough logs with comments found in selected date range to generate AI summary.');
        return;
    }

    // API Setup
    const key = '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';

    const prompt =
        `You are a senior B2B fintech support analyst for smallcase, analyzing raw support ticket comments from Relationship Managers (RMs) and their broker partners.\n\n` +
        `INTERACTION RECORDS (${withComments.length} total, showing ${Math.min(80, withComments.length)}):\n${selectedComments}\n\n` +
        `ANALYSIS TASK:\n` +
        `Provide a comprehensive, structured analysis. Return ONLY a raw JSON string (no markdown) in this format:\n` +
        `{"narrative": "...full HTML content..."}\n\n` +
        `The narrative HTML should include:\n` +
        `1. <h4>🔍 Key Observations</h4> — 4-6 bullet points covering volume patterns, repeated issues, time trends\n` +
        `2. <h4>🏢 Broker-level Insights</h4> — Which broker families appear most? What issues do they face?\n` +
        `3. <h4>🏛️ Branch Friction Points</h4> — Which branches show the most friction? What are their top complaints?\n` +
        `4. <h4>📋 Issue Clustering</h4> — Group issues into 3-5 thematic clusters, with counts and representative RM quotes\n` +
        `5. <h4>💡 Actionable Recommendations</h4> — 4-6 specific, prioritized action items for the support team\n` +
        `Use <ul><li><strong>Label:</strong> Detail</li></ul> for all sections. Quote specific RM comments where relevant.`;

    try {
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.6,
                max_tokens: 1200
            })
        });

        if (!response.ok) throw new Error("API call failed");

        const res = await response.json();
        const contentText = res.choices[0].message.content.trim();

        // Clean markdown backticks if returned
        const cleanedJSON = contentText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        const parsed = JSON.parse(cleanedJSON);

        narrativeBlock.innerHTML = parsed.narrative || "Summary parsing returned empty narrative.";

        loadingState.classList.add('hidden');
        contentState.classList.remove('hidden');
    } catch (error) {
        console.warn("NVIDIA AI Call failed/blocked. Running local summarizer fallback...", error);

        // Local Summarizer fallback if API is blocked or key expires
        setTimeout(() => {
            const fallbackHTML = generateLocalFallbackSummary(withComments);
            narrativeBlock.innerHTML = fallbackHTML;
            loadingState.classList.add('hidden');
            contentState.classList.remove('hidden');
        }, 1200);
    }
}

function generateLocalFallbackSummary(commentsList) {
    const data = window.viewModel ? window.viewModel.interactions : commentsList;

    // Real broker counts
    const brokerCounts = {};
    const branchCounts = {};
    const issueCounts = {};
    data.forEach(item => {
        if (item.broker_family && item.broker_family !== 'NA') brokerCounts[item.broker_family] = (brokerCounts[item.broker_family] || 0) + 1;
        if (item.branch && item.branch !== 'Not shared') branchCounts[item.branch] = (branchCounts[item.branch] || 0) + 1;
        if (item.issue) issueCounts[item.issue] = (issueCounts[item.issue] || 0) + 1;
    });
    const topBrokers = Object.entries(brokerCounts).sort((a,b) => b[1]-a[1]).slice(0,5);
    const topBranches = Object.entries(branchCounts).sort((a,b) => b[1]-a[1]).slice(0,4);
    const topIssues = Object.entries(issueCounts).sort((a,b) => b[1]-a[1]).slice(0,5);

    const brokersHTML = topBrokers.map(([b, c]) => `<li><strong>${b}:</strong> ${c} interactions</li>`).join('');
    const branchesHTML = topBranches.map(([b, c]) => `<li><strong>${b}:</strong> ${c} contacts</li>`).join('');
    const issuesHTML = topIssues.map(([i, c]) => `<li><strong>${i}:</strong> ${c} occurrences</li>`).join('');

    // Sample comments
    const sampleComments = commentsList.slice(0, 4).map(r =>
        `<li><em>"${r.comments.substring(0,120)}..."</em> — <strong>${r.rm_name}</strong> (${r.broker_family}, ${r.branch})</li>`
    ).join('');

    return `
        <h4>🔍 Key Observations (Local Analysis)</h4>
        <ul>
            <li><strong>Total interactions with comments:</strong> ${commentsList.length} records analyzed</li>
            <li><strong>Active brokers:</strong> ${Object.keys(brokerCounts).length} unique broker families</li>
            <li><strong>Active branches:</strong> ${Object.keys(branchCounts).length} unique branches</li>
            <li><strong>Top issue:</strong> ${topIssues[0] ? `${topIssues[0][0]} (${topIssues[0][1]} cases)` : '—'}</li>
        </ul>
        <h4>🏢 Top Broker Families</h4><ul>${brokersHTML}</ul>
        <h4>🏛️ Most Active Branches</h4><ul>${branchesHTML}</ul>
        <h4>📋 Issue Clusters</h4><ul>${issuesHTML}</ul>
        <h4>💬 Sample RM Comments</h4><ul>${sampleComments}</ul>
        <h4>💡 Actionable Recommendations</h4>
        <ul>
            <li><strong>Prioritize top broker:</strong> ${topBrokers[0] ? `${topBrokers[0][0]} has the highest contact volume — assign dedicated support POC.` : 'Review broker assignment.'}</li>
            <li><strong>Branch escalation:</strong> ${topBranches[0] ? `${topBranches[0][0]} branch is the highest friction point — schedule a review call.` : 'Monitor branch SLA compliance.'}</li>
            <li><strong>Issue resolution:</strong> ${topIssues[0] ? `Address "${topIssues[0][0]}" systematically — it accounts for ${topIssues[0][1]} cases.` : 'Focus on reducing repeat contacts.'}</li>
            <li><strong>Repeat contact reduction:</strong> Identify RMs contacting for the same issue 2+ times in 7 days and provide targeted resolution guides.</li>
        </ul>
    `;
}

// -------------------------------------------------------------------------
// AI SUMMARY TAB — Full Analytics Report
// -------------------------------------------------------------------------
let aiChartInstances = {};

function renderAISummaryTab() {
    const data = window.viewModel ? window.viewModel.interactions : [];
    const calls = window.viewModel ? window.viewModel.calls : [];

    // Update period badge
    const periodBadge = document.getElementById('ai-tab-period-badge');
    if (periodBadge) {
        periodBadge.textContent = `${activeFilters.dateFrom} → ${activeFilters.dateTo}`;
    }

    // --- Stat Cards ---
    const statGrid = document.getElementById('ai-report-stat-grid');
    if (statGrid) {
        const brokerCounts = {};
        const issueCounts = {};
        const rmCounts = {};
        let repeatLoops = 0;
        const loopMap = {};
        data.forEach(item => {
            if (item.broker_family && item.broker_family !== 'NA') brokerCounts[item.broker_family] = (brokerCounts[item.broker_family] || 0) + 1;
            if (item.issue) issueCounts[item.issue] = (issueCounts[item.issue] || 0) + 1;
            if (item.rm_name && item.rm_name !== 'NA') rmCounts[item.rm_name] = (rmCounts[item.rm_name] || 0) + 1;
            // repeat loops
            if (item.rm_name && item.rm_name !== 'NA' && item.issue && item.issue !== 'General') {
                const k = `${item.rm_name}||${item.issue}`;
                if (!loopMap[k]) loopMap[k] = [];
                if (item.date) loopMap[k].push(safeParseDate(item.date).getTime());
            }
        });
        Object.values(loopMap).forEach(ts => {
            if (ts.length < 2) return;
            ts.sort((a,b)=>a-b);
            for (let i = 1; i < ts.length; i++) if (ts[i]-ts[i-1] <= 7*864e5) repeatLoops++;
        });
        const topBroker = Object.entries(brokerCounts).sort((a,b)=>b[1]-a[1])[0];
        const topIssue = Object.entries(issueCounts).sort((a,b)=>b[1]-a[1])[0];
        const topRM = Object.entries(rmCounts).sort((a,b)=>b[1]-a[1])[0];

        // AHT from calls
        let ahtAns = 0, ahtSum = 0;
        calls.forEach(c => {
            const ct = String(c.call_type||'').toLowerCase();
            const st = String(c.stage||'').toLowerCase();
            if (!ct || ct === 'inbound') {
                if (st === 'answered' || st === 'connected') { ahtAns++; ahtSum += (c.talk_time || c.duration || 0); }
            }
        });
        const ahtVal = ahtAns > 0 ? formatSeconds(Math.round(ahtSum / ahtAns)) : '—';

        statGrid.innerHTML = `
            <div class="ai-report-stat-card"><span class="stat-icon">📊</span><div class="stat-label">Total Interactions</div><div class="stat-val">${data.length.toLocaleString()}</div><div class="stat-sub">${activeFilters.dateFrom} to ${activeFilters.dateTo}</div></div>
            <div class="ai-report-stat-card"><span class="stat-icon">🏢</span><div class="stat-label">Top Broker Family</div><div class="stat-val" style="font-size:1rem;line-height:1.3">${topBroker ? topBroker[0] : '—'}</div><div class="stat-sub">${topBroker ? topBroker[1] + ' contacts' : ''}</div></div>
            <div class="ai-report-stat-card"><span class="stat-icon">📋</span><div class="stat-label">Top Issue</div><div class="stat-val" style="font-size:1rem;line-height:1.3">${topIssue ? topIssue[0] : '—'}</div><div class="stat-sub">${topIssue ? topIssue[1] + ' occurrences' : ''}</div></div>
            <div class="ai-report-stat-card"><span class="stat-icon">🧑</span><div class="stat-label">Top RM</div><div class="stat-val" style="font-size:1rem;line-height:1.3">${topRM ? topRM[0] : '—'}</div><div class="stat-sub">${topRM ? topRM[1] + ' contacts' : ''}</div></div>
            <div class="ai-report-stat-card"><span class="stat-icon">⚠️</span><div class="stat-label">Repeat Loops</div><div class="stat-val" style="color:#ef4444">${repeatLoops}</div><div class="stat-sub">7-day repeat incidents</div></div>
            <div class="ai-report-stat-card"><span class="stat-icon">⏱️</span><div class="stat-label">Avg Handling Time</div><div class="stat-val">${ahtVal}</div><div class="stat-sub">Inbound answered calls</div></div>
            <div class="ai-report-stat-card"><span class="stat-icon">📞</span><div class="stat-label">Total Calls</div><div class="stat-val">${calls.length.toLocaleString()}</div><div class="stat-sub">Ozonetel call records</div></div>
        `;
    }

    // --- Charts ---
    const destroyChart = (key) => { if (aiChartInstances[key]) { aiChartInstances[key].destroy(); delete aiChartInstances[key]; } };

    // 1. Daily Volume Trend
    const trendCanvas = document.getElementById('ai-chart-daily-trend');
    if (trendCanvas) {
        destroyChart('trend');
        const dateMap = {};
        data.forEach(item => {
            if (item.date) {
                const d = item.date.split(' ')[0];
                dateMap[d] = (dateMap[d] || 0) + 1;
            }
        });
        const sortedDates = Object.keys(dateMap).sort();
        aiChartInstances['trend'] = new Chart(trendCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Daily Contacts',
                    data: sortedDates.map(d => dateMap[d]),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139,92,246,0.1)',
                    fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: true, ticks: { color: THEME_COLORS.textMuted, maxTicksLimit: 10, font: { size: 10 } }, grid: { color: THEME_COLORS.gridColor } }, y: { display: true, ticks: { color: THEME_COLORS.textMuted, font: { size: 10 } }, grid: { color: THEME_COLORS.gridColor } } } }
        });
    }

    // 2. Top 10 Brokers
    const brkCanvas = document.getElementById('ai-chart-brokers');
    if (brkCanvas) {
        destroyChart('brokers');
        const bc = {};
        data.forEach(item => { if (item.broker_family && item.broker_family !== 'NA') bc[item.broker_family] = (bc[item.broker_family] || 0) + 1; });
        const top10 = Object.entries(bc).sort((a,b)=>b[1]-a[1]).slice(0,10);
        aiChartInstances['brokers'] = new Chart(brkCanvas.getContext('2d'), {
            type: 'bar',
            data: { labels: top10.map(x=>x[0]), datasets: [{ label: 'Contacts', data: top10.map(x=>x[1]), backgroundColor: 'rgba(139,92,246,0.7)', borderColor: '#8b5cf6', borderWidth: 1, borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { color: THEME_COLORS.textMuted, font: { size: 9 } }, grid: { color: THEME_COLORS.gridColor } }, y: { ticks: { color: THEME_COLORS.textSecondary, font: { size: 10 } }, grid: { display: false } } } }
        });
    }

    // 3. Issue Category Donut
    const issCanvas = document.getElementById('ai-chart-issues');
    if (issCanvas) {
        destroyChart('issues');
        const ic = {};
        data.forEach(item => { if (item.issue) ic[item.issue] = (ic[item.issue] || 0) + 1; });
        const top6 = Object.entries(ic).sort((a,b)=>b[1]-a[1]).slice(0,6);
        const palette = ['#8b5cf6','#0ea5e9','#10b981','#f59e0b','#ef4444','#ec4899'];
        aiChartInstances['issues'] = new Chart(issCanvas.getContext('2d'), {
            type: 'doughnut',
            data: { labels: top6.map(x=>x[0]), datasets: [{ data: top6.map(x=>x[1]), backgroundColor: palette, borderColor: THEME_COLORS.cardBg, borderWidth: 3 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: THEME_COLORS.textSecondary, font: { size: 9 }, padding: 8 } } }, cutout: '60%' }
        });
    }

    // 4. Top 10 Branches
    const branchCanvas = document.getElementById('ai-chart-branches');
    if (branchCanvas) {
        destroyChart('branches');
        const bc2 = {};
        data.forEach(item => { if (item.branch && item.branch !== 'Not shared') bc2[item.branch] = (bc2[item.branch] || 0) + 1; });
        const top10b = Object.entries(bc2).sort((a,b)=>b[1]-a[1]).slice(0,10);
        aiChartInstances['branches'] = new Chart(branchCanvas.getContext('2d'), {
            type: 'bar',
            data: { labels: top10b.map(x=>x[0]), datasets: [{ label: 'Contacts', data: top10b.map(x=>x[1]), backgroundColor: 'rgba(14,165,233,0.7)', borderColor: '#0ea5e9', borderWidth: 1, borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { color: THEME_COLORS.textMuted, font: { size: 9 } }, grid: { color: THEME_COLORS.gridColor } }, y: { ticks: { color: THEME_COLORS.textSecondary, font: { size: 10 } }, grid: { display: false } } } }
        });
    }

    // 5. Channel Mix Donut
    const chCanvas = document.getElementById('ai-chart-channels');
    if (chCanvas) {
        destroyChart('channels');
        const cc = { 'Call Ticket': 0, 'WhatsApp Chat': 0, 'Care Email': 0 };
        data.forEach(item => { if (cc[item.type] !== undefined) cc[item.type]++; });
        aiChartInstances['channels'] = new Chart(chCanvas.getContext('2d'), {
            type: 'pie',
            data: { labels: ['Call Tickets', 'WhatsApp', 'Care Emails'], datasets: [{ data: [cc['Call Ticket'], cc['WhatsApp Chat'], cc['Care Email']], backgroundColor: ['rgba(14,165,233,0.8)', 'rgba(34,197,94,0.8)', 'rgba(249,115,22,0.8)'], borderColor: THEME_COLORS.cardBg, borderWidth: 3 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: THEME_COLORS.textSecondary, font: { size: 10 }, padding: 10 } } } }
        });
    }

    // Clone and replace Generate button to clear duplicate listeners
    const genBtn = document.getElementById('ai-generate-btn');
    if (genBtn) {
        const newGenBtn = genBtn.cloneNode(true);
        genBtn.parentNode.replaceChild(newGenBtn, genBtn);
        newGenBtn.addEventListener('click', generateAITabNarrative);
    }

    // Clone and replace Copy button
    const copyBtn = document.getElementById('ai-copy-btn');
    if (copyBtn) {
        const newCopyBtn = copyBtn.cloneNode(true);
        copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
        newCopyBtn.addEventListener('click', () => {
            const content = document.getElementById('ai-narrative-content');
            if (content) {
                navigator.clipboard.writeText(content.innerText || content.textContent).then(() => {
                    newCopyBtn.textContent = '✅ Copied!';
                    setTimeout(() => { newCopyBtn.innerHTML = '📋 Copy Report'; }, 2000);
                }).catch(() => { alert('Copy failed — please select the text manually.'); });
            }
        });
    }
}

async function generateAITabNarrative() {
    const narrativeContent = document.getElementById('ai-narrative-content');
    if (!narrativeContent) return;
    narrativeContent.innerHTML = '<div class="ai-loading-overlay"><div class="spinner"></div><p>Invoking NVIDIA Nemotron LLM...</p><span style="font-size:0.78rem;color:var(--text-muted)">Building comprehensive narrative from all data...</span></div>';

    const data = window.viewModel ? window.viewModel.interactions : [];
    const withComments = data.filter(item => item.comments && item.comments.trim().length > 10);

    const selectedComments = withComments.slice(0, 80).map((r, i) => {
        return `${i+1}. [RM=${r.rm_name||'NA'} | Broker=${r.broker_family||'NA'} | Branch=${r.branch||'NA'} | Issue=${r.issue||'NA'} | Sub-Issue=${r.sub_issue||'NA'}]: "${r.comments.substring(0,200)}"`;
    }).join('\n');

    if (!selectedComments) {
        narrativeContent.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted)"><p>No comments found in the selected period. Try expanding the date range.</p></div>';
        return;
    }

    const key = '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';
    const prompt =
        `You are a senior B2B fintech support analyst for smallcase. Analyze these ${data.length} interactions (${withComments.length} with detailed comments):\n\n` +
        `RECORDS:\n${selectedComments}\n\n` +
        `Write a comprehensive HTML analytics report narrative including:\n` +
        `1. <h4>📊 Executive Summary</h4> — 3-5 high-level findings\n` +
        `2. <h4>🔍 Key Observations</h4> — Detailed patterns, trends, volume insights\n` +
        `3. <h4>🏢 Broker-level Analysis</h4> — Top brokers, their issues, friction patterns with quoted comments\n` +
        `4. <h4>🏛️ Branch Intelligence</h4> — Branch hotspots, geographic friction patterns\n` +
        `5. <h4>📋 Issue Taxonomy</h4> — Systematic issue clustering with root cause hypotheses\n` +
        `6. <h4>💡 Prioritized Recommendations</h4> — Specific, actionable steps ordered by impact\n` +
        `Return ONLY raw JSON: {"narrative": "...HTML..."}`;

    try {
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning', messages: [{ role: 'user', content: prompt }], temperature: 0.6, max_tokens: 2000 })
        });
        if (!response.ok) throw new Error('API failed');
        const res = await response.json();
        const text = res.choices[0].message.content.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```\s*$/,'').trim();
        const parsed = JSON.parse(text);
        narrativeContent.innerHTML = parsed.narrative || '<p>Narrative parsing returned empty.</p>';
    } catch (err) {
        console.warn('AI narrative failed, using local fallback', err);
        narrativeContent.innerHTML = generateLocalFallbackSummary(withComments);
    }
}

// -------------------------------------------------------------
// 7. SCREENSHOT DOWNLOAD ENGINE (HTML2CANVAS)
// -------------------------------------------------------------


function captureDashboardScreenshot() {
    const captureArea = document.getElementById('weekly-pulse-dashboard-capture-area');
    if (!captureArea) return;

    // Add visual indicator class during rendering
    const btn = document.getElementById('screenshot-btn');
    btn.innerHTML = `<span class="spinner" style="width: 14px; height: 14px; display: inline-block; margin: 0 6px 0 0; vertical-align: middle;"></span> Capturing...`;
    btn.disabled = true;

    // Use html2canvas to capture the DOM segment
    html2canvas(captureArea, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: document.body.classList.contains('light-mode') ? '#f8fafc' : '#060a13',
        scale: 2 // High-quality 2x scaling
    }).then(canvas => {
        // Trigger download
        const link = document.createElement('a');
        link.download = `Weekly_Pulse_Dashboard_Report_${activeFilters.dateFrom}_to_${activeFilters.dateTo}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Restore button state
        btn.innerHTML = `<span class="btn-icon">📸</span> Take Dashboard Screenshot`;
        btn.disabled = false;
    }).catch(err => {
        console.error("Screenshot capture failed:", err);
        btn.innerHTML = `<span class="btn-icon">📸</span> Take Dashboard Screenshot`;
        btn.disabled = false;
        alert("Unable to generate screenshot. Ensure all chart objects are fully loaded.");
    });
}

function openPocDeepDiveModal(pocName) {
    const modal = document.getElementById('poc-modal');
    if (!modal) return;

    // Set Title
    document.getElementById('poc-modal-name').innerText = pocName;

    // Gather interactions for this POC in active range
    const data = window.viewModel ? window.viewModel.interactions : [];
    const pocInteractions = data.filter(item => (item.poc || '').toLowerCase() === pocName.toLowerCase());

    // Calculate total, WA, call, and RM counts
    const total = pocInteractions.length;
    let wa = 0;
    let callTkt = 0;
    const rms = new Set();

    pocInteractions.forEach(item => {
        if (item.type === 'WhatsApp Chat') wa++;
        else if (item.type === 'Call Ticket') callTkt++;
        if (item.rm_name && item.rm_name !== 'NA') rms.add(item.rm_name);
    });

    const waPct = total > 0 ? Math.round((wa / total) * 100) : 0;

    // Mapped branches and brokers
    const mappedBranches = new Set();
    const mappedBrokers = new Set();
    if (rawData && rawData.poc_mappings) {
        rawData.poc_mappings.forEach(m => {
            if (m.POC && m.POC.toLowerCase() === pocName.toLowerCase()) {
                if (m.BranchNorm) mappedBranches.add(m.BranchNorm);
                if (m.BrokerFamily) mappedBrokers.add(m.BrokerFamily);
            }
        });
    }

    // Fallback if mappings sheet didn't have entries
    if (mappedBranches.size === 0) {
        pocInteractions.forEach(item => {
            if (item.branch && item.branch !== 'Not shared') mappedBranches.add(item.branch);
            if (item.broker_family && item.broker_family !== 'NA') mappedBrokers.add(item.broker_family);
        });
    }

    // Populate header stats
    document.getElementById('poc-modal-broker-count').innerText = `${mappedBrokers.size} Brokers`;
    document.getElementById('poc-modal-branch-count').innerText = `${mappedBranches.size} Branches`;

    // Populate KPI values
    document.getElementById('poc-modal-kpi-total').innerText = total.toLocaleString();
    document.getElementById('poc-modal-kpi-wa').innerText = `${waPct}%`;
    document.getElementById('poc-modal-kpi-call').innerText = callTkt.toLocaleString();
    document.getElementById('poc-modal-kpi-rms').innerText = rms.size.toLocaleString();

    // Populate branch table
    const branchBody = document.getElementById('poc-modal-branches-body');
    branchBody.innerHTML = '';

    const branchCounts = {};
    pocInteractions.forEach(item => {
        const br = item.branch || 'Not shared';
        const bk = item.broker_family || 'NA';
        const key = `${br}||${bk}`;
        branchCounts[key] = (branchCounts[key] || 0) + 1;
    });

    const sortedBranches = Object.entries(branchCounts).sort((a, b) => b[1] - a[1]);
    if (sortedBranches.length === 0) {
        branchBody.innerHTML = '<tr><td colspan="3" class="text-muted text-center" style="text-align: center;">No branch data in selected range.</td></tr>';
    } else {
        let html = '';
        sortedBranches.forEach(([key, count]) => {
            const [branch, broker] = key.split('||');
            html += `
                <tr>
                    <td><strong>${branch}</strong></td>
                    <td><span class="badge">${broker}</span></td>
                    <td class="text-right"><strong>${count}</strong></td>
                </tr>
            `;
        });
        branchBody.innerHTML = html;
    }

    // Populate RM table
    const rmBody = document.getElementById('poc-modal-rms-body');
    rmBody.innerHTML = '';

    const rmCounts = {};
    pocInteractions.forEach(item => {
        if (!item.rm_name || item.rm_name === 'NA') return;
        const key = `${item.rm_name}||${item.broker_family}`;
        rmCounts[key] = (rmCounts[key] || 0) + 1;
    });

    const sortedRMs = Object.entries(rmCounts).sort((a, b) => b[1] - a[1]);
    if (sortedRMs.length === 0) {
        rmBody.innerHTML = '<tr><td colspan="4" class="text-muted text-center" style="text-align: center;">No RM contacts in selected range.</td></tr>';
    } else {
        let html = '';
        sortedRMs.forEach(([key, count]) => {
            const [rm, broker] = key.split('||');
            // Check if RM is an outlier in rawData
            const isOutlier = rawData && rawData.outliers && rawData.outliers.some(o => o.rm_name.toLowerCase() === rm.toLowerCase() && o.is_outlier);
            const statusLabel = isOutlier ? '<span class="text-red">⚠️ Outlier</span>' : '<span class="text-green">Normal</span>';
            html += `
                <tr>
                    <td><strong>${rm}</strong></td>
                    <td><span class="badge">${broker}</span></td>
                    <td class="text-right"><strong>${count}</strong></td>
                    <td class="text-right">${statusLabel}</td>
                </tr>
            `;
        });
        rmBody.innerHTML = html;
    }

    // Populate Interactions table (Raw Audit Trail)
    const recordsBody = document.getElementById('poc-modal-records-body');
    recordsBody.innerHTML = '';

    const sortedRecords = [...pocInteractions].sort((a, b) => safeParseDate(b.date).getTime() - safeParseDate(a.date).getTime());
    if (sortedRecords.length === 0) {
        recordsBody.innerHTML = '<tr><td colspan="9" class="text-muted text-center" style="text-align: center;">No raw interactions found in selected range.</td></tr>';
    } else {
        let html = '';
        sortedRecords.forEach(item => {
            html += `
                <tr>
                    <td>${item.date || '-'}</td>
                    <td>${getDevRevLinkHTML(item.id, item.type)}</td>
                    <td><span class="badge">${item.type}</span></td>
                    <td><strong>${item.rm_name || '-'}</strong></td>
                    <td><span class="badge badge-poc">${item.branch || '-'}</span></td>
                    <td>${item.issue || '-'}</td>
                    <td>${item.sub_issue || '-'}</td>
                    <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.comments || ''}">${item.comments || '-'}</td>
                    <td>${item.recording_url ? `<a href="${item.recording_url}" target="_blank">🔗 Listen</a>` : '-'}</td>
                </tr>
            `;
        });
        recordsBody.innerHTML = html;
    }

    // Open Modal
    modal.classList.add('open');
}

function openMetricDeepDiveModal(type, title) {
    const modal = document.getElementById('metrics-modal');
    if (!modal) return;

    // Set Title and Subtitle
    document.getElementById('metrics-modal-title').innerText = title;
    
    // We will build the table head and body dynamically
    const tableHead = document.getElementById('metrics-modal-table-head');
    const tableBody = document.getElementById('metrics-modal-table-body');
    const countEl = document.getElementById('metrics-modal-count');
    
    if (!tableHead || !tableBody || !countEl) return;

    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    // Filter helpers
    const interactions = window.viewModel ? window.viewModel.interactions : [];
    const calls = window.viewModel ? window.viewModel.calls : [];

    const formatSeconds = (sec) => {
        if (sec === null || sec === undefined || isNaN(sec)) return '-';
        const mins = Math.floor(sec / 60);
        const secs = Math.round(sec % 60);
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    let entries = [];
    let isCallBased = false;

    // Support filtering by date from title if title contains "Interactions on YYYY-MM-DD"
    let dateFilter = null;
    if (title && title.includes('Interactions on')) {
        dateFilter = title.replace('Interactions on', '').trim();
    }

    let filteredInteractions = interactions;
    let filteredCalls = calls;
    if (dateFilter) {
        filteredInteractions = interactions.filter(item => item.date && item.date.substring(0, 10) === dateFilter);
        filteredCalls = calls.filter(call => call.date && call.date.substring(0, 10) === dateFilter);
    }

    // Determine the data subset based on type
    if (type === 'all' || type === 'interactions') {
        entries = filteredInteractions;
    } else if (type === 'tickets') {
        entries = filteredInteractions.filter(item => item.type === 'Call Ticket');
    } else if (type === 'whatsapp') {
        entries = filteredInteractions.filter(item => item.type === 'WhatsApp Chat');
    } else if (type === 'answered') {
        entries = filteredInteractions.filter(item => {
            if (item.type !== 'Call Ticket') return false;
            let cs = String(item.call_status || "").toLowerCase();
            if (cs === 'other' || !cs) {
                const titleLower = (item.title || "").toLowerCase();
                if (titleLower.includes('missed call')) cs = 'missed';
                else if (titleLower.includes('aoh call')) cs = 'aoh';
                else if (titleLower.includes('answered call')) cs = 'answered';
            }
            return cs === 'answered';
        });
    } else if (type === 'missed') {
        entries = filteredInteractions.filter(item => {
            if (item.type !== 'Call Ticket') return false;
            let cs = String(item.call_status || "").toLowerCase();
            if (cs === 'other' || !cs) {
                const titleLower = (item.title || "").toLowerCase();
                if (titleLower.includes('missed call')) cs = 'missed';
                else if (titleLower.includes('aoh call')) cs = 'aoh';
                else if (titleLower.includes('answered call')) cs = 'answered';
            }
            return cs === 'missed';
        });
    } else if (type === 'aoh') {
        entries = filteredInteractions.filter(item => {
            if (item.type !== 'Call Ticket') return false;
            let cs = String(item.call_status || "").toLowerCase();
            if (cs === 'other' || !cs) {
                const titleLower = (item.title || "").toLowerCase();
                if (titleLower.includes('missed call')) cs = 'missed';
                else if (titleLower.includes('aoh call')) cs = 'aoh';
                else if (titleLower.includes('answered call')) cs = 'answered';
            }
            return cs === 'aoh';
        });
    } else if (type === 'aht') {
        // Average Handling Time is calculated from answered Ozonetel calls
        entries = filteredCalls.filter(call => {
            const st = String(call.stage || "").toLowerCase();
            return st === 'answered' || st === 'connected';
        });
        isCallBased = true;
    } else if (type === 'aqt') {
        // Average Queue Time is calculated over all Ozonetel calls (irrespective of stage)
        entries = filteredCalls;
        isCallBased = true;
    }

    countEl.innerText = `${entries.length} Entries`;

    // Populate headers & rows based on whether it is Ozonetel Call or support interaction
    if (!isCallBased) {
        // Setup Interactions headers
        tableHead.innerHTML = `
            <tr>
                <th>Date</th>
                <th>ID</th>
                <th>Channel Type</th>
                <th>Relationship Manager</th>
                <th>Broker Family</th>
                <th>Branch Location</th>
                <th>Assigned POC</th>
                <th>Issue / Comments</th>
            </tr>
        `;

        if (entries.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-muted text-center" style="text-align: center; padding: 20px;">No support interaction records found.</td></tr>';
        } else {
            // Sort by Date descending
            const sorted = [...entries].sort((a, b) => safeParseDate(b.date).getTime() - safeParseDate(a.date).getTime());
            let html = '';
            sorted.forEach(item => {
                html += `
                    <tr>
                        <td>${item.date || '-'}</td>
                        <td>${getDevRevLinkHTML(item.id, item.type)}</td>
                        <td><span class="badge" style="background-color: ${item.type === 'WhatsApp Chat' ? '#10b981' : item.type === 'Care Email' ? '#f59e0b' : '#0ea5e9'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.72rem;">${item.type}</span></td>
                        <td><strong>${item.rm_name || '-'}</strong></td>
                        <td>${item.broker_family || '-'}</td>
                        <td><span class="badge badge-poc">${item.branch || '-'}</span></td>
                        <td><strong>${item.poc || 'Unassigned'}</strong></td>
                        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.comments || item.title || ''}">${item.comments || item.title || '-'}</td>
                    </tr>
                `;
            });
            tableBody.innerHTML = html;
        }
    } else {
        // Setup Call log headers
        tableHead.innerHTML = `
            <tr>
                <th>Date</th>
                <th>Call ID</th>
                <th>Status</th>
                <th>Caller No</th>
                <th>RM Name</th>
                <th>Broker Family</th>
                <th>Support Agent</th>
                <th class="text-right">Duration</th>
                <th class="text-right">Queue Time</th>
                <th class="text-right">Time to Answer</th>
                <th>Recording</th>
            </tr>
        `;

        if (entries.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="11" class="text-muted text-center" style="text-align: center; padding: 20px;">No raw voice call records found.</td></tr>';
        } else {
            // Sort by Date descending
            const sorted = [...entries].sort((a, b) => safeParseDate(b.date).getTime() - safeParseDate(a.date).getTime());
            let html = '';
            sorted.forEach(call => {
                const badgeClass = String(call.stage || "").toLowerCase() === 'answered' || String(call.stage || "").toLowerCase() === 'connected' ? 'text-green' : 'text-red';
                html += `
                    <tr>
                        <td>${call.date || '-'}</td>
                        <td><code>${call.id || '-'}</code></td>
                        <td><span class="${badgeClass}">● ${call.stage || 'Unanswered'}</span></td>
                        <td>${call.caller_no || '-'}</td>
                        <td><strong>${call.rm_name || '-'}</strong></td>
                        <td>${call.broker_family || '-'}</td>
                        <td>${call.agent || 'System'}</td>
                        <td class="text-right"><strong>${formatSeconds(call.duration)}</strong></td>
                        <td class="text-right">${formatSeconds(call.queue_time)}</td>
                        <td class="text-right">${formatSeconds(call.time_to_answer)}</td>
                        <td>${call.recording_url ? `<a href="${call.recording_url}" target="_blank" class="text-blue" style="text-decoration: none;">🔗 Listen</a>` : '-'}</td>
                    </tr>
                `;
            });
            tableBody.innerHTML = html;
        }
    }

    // Open Modal
    modal.classList.add('open');
}

// ==========================================================================
// 6. VISUAL CONTROL DASHBOARD RENDERERS
// ==========================================================================

function renderVisualControlDashboard() {
    // 1. Destroy old charts
    destroyVCCharts();

    const data = window.viewModel.interactions;
    const calls = window.viewModel.calls;

    // 2. Compute KPIs
    let tkt = 0, wa = 0, mail = 0;
    data.forEach(item => {
        if (item.type === 'Call Ticket') tkt++;
        else if (item.type === 'WhatsApp Chat') wa++;
        else if (item.type === 'Care Email') mail++;
    });

    const totalInteractions = tkt + wa + mail;

    // Active RMs: unique combinations of RM Name, Broker Family, and Branch in active slice (rm_name != 'NA')
    const activeRMsSet = new Set();
    data.forEach(item => {
        if (item.rm_name && item.rm_name !== 'NA') {
            const broker = item.broker_family || 'NA';
            const branch = item.branch || 'Not shared';
            activeRMsSet.add(`${item.rm_name}||${broker}||${branch}`);
        }
    });
    const activeRMs = activeRMsSet.size;

    // Active Brokers: unique broker_family values !== 'NA'
    const activeBrokersSet = new Set();
    data.forEach(item => {
        if (item.broker_family && item.broker_family !== 'NA') {
            activeBrokersSet.add(item.broker_family);
        }
    });
    const activeBrokers = activeBrokersSet.size;

    // Active Branches: unique branch values !== 'Not shared'
    const activeBranchesSet = new Set();
    data.forEach(item => {
        if (item.branch && item.branch !== 'Not shared') {
            activeBranchesSet.add(item.branch);
        }
    });
    const activeBranches = activeBranchesSet.size;

    // Active POCs: unique poc values (excluding No POC, Not shared, etc.)
    const activePocsSet = new Set();
    data.forEach(item => {
        if (item.poc && item.poc !== 'No POC' && item.poc !== 'Not shared' && item.poc !== 'NA') {
            activePocsSet.add(item.poc);
        }
    });
    const activePocs = activePocsSet.size;

    // Repeat Loops: loops count calculated via 7-day RM-broker-branch-issue loop logic
    const getLoopsCount = (interactionsList) => {
        const loopGroups = {};
        interactionsList.forEach(item => {
            if (!item.rm_name || item.rm_name === "NA" || !item.date) return;
            if (item.issue === "General" || item.issue === "Voice Call") return;
            const k = `${item.rm_name}||${item.broker_family}||${item.branch}||${item.issue}`;
            if (!loopGroups[k]) loopGroups[k] = [];
            try {
                loopGroups[k].push(safeParseDate(item.date).getTime());
            } catch (e) { }
        });
        let c = 0;
        Object.values(loopGroups).forEach(tss => {
            if (tss.length < 2) return;
            tss.sort((a, b) => a - b);
            for (let i = 1; i < tss.length; i++) {
                if (tss[i] - tss[i - 1] <= 7 * 24 * 60 * 60 * 1000) c++;
            }
        });
        return c;
    };
    const repeatLoops = getLoopsCount(data);

    // Compute topRepeats, rmDataPoints, and branchDataPoints dynamically
    const getTopRepeats = (interactionsList) => {
        const loopGroups = {};
        interactionsList.forEach(item => {
            if (!item.rm_name || item.rm_name === "NA" || !item.date) return;
            if (item.issue === "General" || item.issue === "Voice Call") return;
            const k = `${item.rm_name}||${item.broker_family || 'NA'}||${item.branch || 'Not shared'}||${item.issue}`;
            if (!loopGroups[k]) loopGroups[k] = [];
            try {
                loopGroups[k].push(safeParseDate(item.date).getTime());
            } catch (e) { }
        });
        const loopCounts = [];
        Object.entries(loopGroups).forEach(([key, tss]) => {
            if (tss.length < 2) return;
            tss.sort((a, b) => a - b);
            let count = 0;
            for (let i = 1; i < tss.length; i++) {
                if (tss[i] - tss[i - 1] <= 7 * 24 * 60 * 60 * 1000) count++;
            }
            if (count > 0) {
                const [rm, broker, branch, issue] = key.split('||');
                loopCounts.push({
                    label: `${rm} - ${issue} (${broker})`,
                    count: count
                });
            }
        });
        return loopCounts.sort((a, b) => b.count - a.count).slice(0, 10);
    };
    const topRepeats = getTopRepeats(data);

    const getScatterDataPoints = (interactionsList, keyField, excludeVals = ['NA', 'Not shared', '-', 'Unknown']) => {
        const groups = {};
        interactionsList.forEach(item => {
            const val = item[keyField];
            if (!val || excludeVals.includes(val)) return;
            if (!groups[val]) groups[val] = { count: 0, dates: new Set() };
            groups[val].count++;
            if (item.date) {
                groups[val].dates.add(item.date.substring(0, 10));
            }
        });
        return Object.entries(groups).map(([name, g]) => {
            const activeDays = Math.max(1, g.dates.size);
            return {
                x: g.count,
                y: parseFloat((g.count / activeDays).toFixed(2)),
                label: name
            };
        });
    };
    const rmDataPoints = getScatterDataPoints(data, 'rm_name');
    const branchDataPoints = getScatterDataPoints(data, 'branch');

    // Avg/Day: totalInteractions / number of days in selected date range
    const fromD = safeParseDate(activeFilters.dateFrom);
    if (fromD) fromD.setHours(0, 0, 0, 0);
    const toD = safeParseDate(activeFilters.dateTo);
    if (toD) toD.setHours(23, 59, 59, 999);
    const diffMs = toD.getTime() - fromD.getTime();
    const numDays = Math.max(1, Math.round(diffMs / (24 * 60 * 60 * 1000)));
    const avgPerDay = Math.round(totalInteractions / numDays);

    // Bind KPIs to UI elements
    document.getElementById('vc-kpi-total').innerText = totalInteractions.toLocaleString();
    document.getElementById('vc-kpi-calls').innerText = tkt.toLocaleString();
    document.getElementById('vc-kpi-whatsapp').innerText = wa.toLocaleString();
    document.getElementById('vc-kpi-emails').innerText = mail.toLocaleString();
    document.getElementById('vc-kpi-rms').innerText = activeRMs.toLocaleString();
    document.getElementById('vc-kpi-brokers').innerText = activeBrokers.toLocaleString();
    document.getElementById('vc-kpi-branches').innerText = activeBranches.toLocaleString();
    document.getElementById('vc-kpi-pocs').innerText = activePocs.toLocaleString();
    document.getElementById('vc-kpi-repeats').innerText = repeatLoops.toLocaleString();
    document.getElementById('vc-kpi-avgday').innerText = avgPerDay.toLocaleString();

    // 3. Prepare dates array for Over Time trend lines
    const datesArray = [];
    let currDate = new Date(fromD.getTime());
    while (currDate <= toD) {
        datesArray.push(currDate.toISOString().split('T')[0]);
        currDate.setDate(currDate.getDate() + 1);
    }

    // Call Tickets Over Time (answered vs missed vs AOH vs total)
    const callStatusCounts = {};
    datesArray.forEach(d => {
        callStatusCounts[d] = { total: 0, answered: 0, missed: 0, aoh: 0 };
    });
    data.forEach(item => {
        if (item.type !== 'Call Ticket' || !item.date) return;
        const d = item.date.substring(0, 10);
        if (callStatusCounts[d]) {
            callStatusCounts[d].total++;
            let cs = String(item.call_status || "").toLowerCase();
            if (cs === 'other' || !cs) {
                const titleLower = (item.title || "").toLowerCase();
                if (titleLower.includes('missed call')) cs = 'missed';
                else if (titleLower.includes('aoh call')) cs = 'aoh';
                else if (titleLower.includes('answered call')) cs = 'answered';
            }
            if (cs === 'answered') callStatusCounts[d].answered++;
            else if (cs === 'missed') callStatusCounts[d].missed++;
            else if (cs === 'aoh') callStatusCounts[d].aoh++;
        }
    });

    const callTotalPoints = datesArray.map(d => callStatusCounts[d].total);
    const callAnsPoints = datesArray.map(d => callStatusCounts[d].answered);
    const callMissPoints = datesArray.map(d => callStatusCounts[d].missed);
    const callAohPoints = datesArray.map(d => callStatusCounts[d].aoh);

    // WhatsApp Over Time
    const waCounts = {};
    datesArray.forEach(d => { waCounts[d] = 0; });
    data.forEach(item => {
        if (item.type === 'WhatsApp Chat' && item.date) {
            const d = item.date.substring(0, 10);
            if (waCounts[d] !== undefined) waCounts[d]++;
        }
    });
    const waPoints = datesArray.map(d => waCounts[d]);

    // Care Emails Over Time
    const emailCounts = {};
    datesArray.forEach(d => { emailCounts[d] = 0; });
    data.forEach(item => {
        if (item.type === 'Care Email' && item.date) {
            const d = item.date.substring(0, 10);
            if (emailCounts[d] !== undefined) emailCounts[d]++;
        }
    });
    const emailPoints = datesArray.map(d => emailCounts[d]);

    const formatDateLabel = (dStr) => {
        try {
            const [year, month, day] = dStr.split('-');
            const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        } catch (e) { return dStr; }
    };
    const formattedDateLabels = datesArray.map(formatDateLabel);

    const themeTextColor = THEME_COLORS.textSecondary;

    const getCommonLineOptions = (themeColorText) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: themeColorText,
                    font: { family: 'SF Pro Text', size: 10 }
                }
            }
        },
        scales: {
            x: {
                grid: { color: THEME_COLORS.border },
                ticks: { color: themeColorText, font: { family: 'SF Pro Text', size: 8 } }
            },
            y: {
                grid: { color: THEME_COLORS.border },
                ticks: { color: themeColorText, font: { family: 'SF Pro Text', size: 9 } }
            }
        }
    });

    // Line 1: Call Tickets Over Time
    const ctx1 = document.getElementById('vc-chart-call-tickets-over-time').getContext('2d');
    vcCharts.callTicketsOverTime = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: formattedDateLabels,
            datasets: [
                {
                    label: 'Call Tickets',
                    data: callTotalPoints,
                    borderColor: THEME_COLORS.purple,
                    backgroundColor: hexToRgba(THEME_COLORS.purple, 0.05),
                    tension: 0.35,
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Answered',
                    data: callAnsPoints,
                    borderColor: THEME_COLORS.green,
                    backgroundColor: 'transparent',
                    tension: 0.3,
                    borderWidth: 1.5
                },
                {
                    label: 'Missed',
                    data: callMissPoints,
                    borderColor: THEME_COLORS.red,
                    backgroundColor: 'transparent',
                    tension: 0.3,
                    borderWidth: 1.5
                },
                {
                    label: 'AOH',
                    data: callAohPoints,
                    borderColor: THEME_COLORS.yellow,
                    backgroundColor: 'transparent',
                    tension: 0.3,
                    borderWidth: 1.5
                }
            ]
        },
        options: getCommonLineOptions(themeTextColor)
    });

    // Line 2: WhatsApp Over Time
    const ctx2 = document.getElementById('vc-chart-whatsapp-over-time').getContext('2d');
    vcCharts.whatsappOverTime = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: formattedDateLabels,
            datasets: [{
                label: 'WhatsApp',
                data: waPoints,
                borderColor: THEME_COLORS.green,
                backgroundColor: hexToRgba(THEME_COLORS.green, 0.08),
                tension: 0.35,
                borderWidth: 2.5,
                fill: true
            }]
        },
        options: getCommonLineOptions(themeTextColor)
    });

    // Line 3: Care Emails Over Time
    const ctx3 = document.getElementById('vc-chart-emails-over-time').getContext('2d');
    vcCharts.emailsOverTime = new Chart(ctx3, {
        type: 'line',
        data: {
            labels: formattedDateLabels,
            datasets: [{
                label: 'Care Emails',
                data: emailPoints,
                borderColor: THEME_COLORS.yellow,
                backgroundColor: hexToRgba(THEME_COLORS.yellow, 0.08),
                tension: 0.35,
                borderWidth: 2.5,
                fill: true
            }]
        },
        options: getCommonLineOptions(themeTextColor)
    });

    // Chart 4: Channel Mix Donut Chart
    const ctx4 = document.getElementById('vc-chart-channel-mix').getContext('2d');
    vcCharts.channelMix = new Chart(ctx4, {
        type: 'doughnut',
        data: {
            labels: [`Call Tickets (${tkt})`, `WhatsApp (${wa})`, `Care Emails (${mail})`],
            datasets: [{
                data: [tkt, wa, mail],
                backgroundColor: [THEME_COLORS.purple, THEME_COLORS.green, THEME_COLORS.yellow],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: themeTextColor,
                        font: { family: 'SF Pro Text', size: 10 }
                    }
                }
            },
            cutout: '70%'
        }
    });

    const makeTopHBarChart = (canvasId, titleLabel, barData, color) => {
        const sorted = Object.entries(barData).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const labels = sorted.map(x => x[0]);
        const values = sorted.map(x => x[1]);

        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: titleLabel,
                    data: values,
                    backgroundColor: color,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                onClick: (event, elements) => {
                    if (elements && elements.length > 0) {
                        const index = elements[0].index;
                        const clickedLabel = labels[index];
                        if (canvasId === 'vc-chart-top-brokers') {
                            applySidebarFilter('broker', clickedLabel);
                        } else if (canvasId === 'vc-chart-poc-hotspots') {
                            applySidebarFilter('poc', clickedLabel);
                        } else {
                            showFloatingToast(`Clicked: ${clickedLabel} (${values[index]} entries)`);
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: THEME_COLORS.border },
                        ticks: { color: themeTextColor, font: { family: 'SF Pro Text', size: 8 } }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            color: themeTextColor,
                            font: { family: 'SF Pro Text', size: 9 },
                            callback: function (val) {
                                const label = this.getLabelForValue(val) || "";
                                return label.length > 15 ? label.substring(0, 12) + "..." : label;
                            }
                        }
                    }
                }
            }
        });
    };

    // Check toggle selection for Care Emails Top RMs/Brokers chart
    let careEmailToggle = 'reporters';
    const toggleInput = document.querySelector('input[name="vc-email-rm-toggle"]:checked');
    if (toggleInput) {
        careEmailToggle = toggleInput.value;
    }

    // Wire Care Email toggle listener once
    if (!window._wired_vc_email_toggle) {
        window._wired_vc_email_toggle = true;
        // Listen on the document body to handle elements correctly (event delegation)
        document.body.addEventListener('change', (e) => {
            if (e.target && e.target.name === 'vc-email-rm-toggle') {
                renderVisualControlDashboard();
            }
        });
    }

    // Calculate distributions
    const topRMsCalls = {};
    const topRMsWhatsApp = {};
    const topRMsEmails = {};
    const topBrokers = {};

    const topIssuesCalls = {};
    const topIssuesWhatsApp = {};
    const topIssuesEmails = {};
    const pocHotspots = {};

    data.forEach(item => {
        const rm = item.rm_name;
        const broker = item.broker_family;
        const poc = item.poc;
        const issueSubKey = `${item.issue || 'General'}/${item.sub_issue || 'General'}`;

        if (broker && broker !== 'NA') {
            topBrokers[broker] = (topBrokers[broker] || 0) + 1;
        }
        if (poc && poc !== 'No POC' && poc !== 'Not shared') {
            pocHotspots[poc] = (pocHotspots[poc] || 0) + 1;
        }

        if (item.type === 'Call Ticket') {
            if (rm && rm !== 'NA') topRMsCalls[rm] = (topRMsCalls[rm] || 0) + 1;
            topIssuesCalls[issueSubKey] = (topIssuesCalls[issueSubKey] || 0) + 1;
        }
        else if (item.type === 'WhatsApp Chat') {
            if (rm && rm !== 'NA') topRMsWhatsApp[rm] = (topRMsWhatsApp[rm] || 0) + 1;
            topIssuesWhatsApp[issueSubKey] = (topIssuesWhatsApp[issueSubKey] || 0) + 1;
        }
        else if (item.type === 'Care Email') {
            const key = (careEmailToggle === 'broker') ? (item.account_display_name || item.broker_family || 'Unknown') : (item.rm_name || 'Unknown');
            if (key && key !== 'NA' && key !== 'Unknown') {
                topRMsEmails[key] = (topRMsEmails[key] || 0) + 1;
            }
            topIssuesEmails[issueSubKey] = (topIssuesEmails[issueSubKey] || 0) + 1;
        }
    });

    // Render Row 3 Bar Charts
    vcCharts.topRMsCalls = makeTopHBarChart('vc-chart-top-rms-calls', 'Calls', topRMsCalls, THEME_COLORS.purple);
    vcCharts.topRMsWhatsApp = makeTopHBarChart('vc-chart-top-rms-whatsapp', 'Chats', topRMsWhatsApp, THEME_COLORS.green);
    
    // Update top RMs/Brokers Emails Card Title & Render
    const emailChartCanvas = document.getElementById('vc-chart-top-rms-emails');
    if (emailChartCanvas) {
        const emailChartCard = emailChartCanvas.closest('.visual-card');
        if (emailChartCard) {
            const titleEl = emailChartCard.querySelector('.card-title');
            const subtitleEl = emailChartCard.querySelector('.card-subtitle-right');
            if (titleEl) {
                titleEl.textContent = (careEmailToggle === 'broker') ? 'Top Brokers - Care Emails' : 'Top RMs - Care Emails';
            }
            if (subtitleEl) {
                subtitleEl.textContent = (careEmailToggle === 'broker') ? 'BROKER FAMILIES IN CARE EMAIL FLOW' : 'RMS/REPORTERS IN CARE EMAIL FLOW';
            }
        }
    }
    vcCharts.topRMsEmails = makeTopHBarChart('vc-chart-top-rms-emails', (careEmailToggle === 'broker') ? 'Emails (Broker)' : 'Emails (RM)', topRMsEmails, THEME_COLORS.yellow);
    vcCharts.topBrokers = makeTopHBarChart('vc-chart-top-brokers', 'Interactions', topBrokers, THEME_COLORS.purple);

    // Render Row 4 Bar Charts
    vcCharts.topIssuesCalls = makeTopHBarChart('vc-chart-top-issues-calls', 'Calls', topIssuesCalls, THEME_COLORS.purple);
    vcCharts.topIssuesWhatsApp = makeTopHBarChart('vc-chart-top-issues-whatsapp', 'Chats', topIssuesWhatsApp, THEME_COLORS.green);
    vcCharts.topIssuesEmails = makeTopHBarChart('vc-chart-top-issues-emails', 'Emails', topIssuesEmails, THEME_COLORS.yellow);
    vcCharts.pocHotspots = makeTopHBarChart('vc-chart-poc-hotspots', 'Interactions', pocHotspots, THEME_COLORS.red);

    // Render Row 5: Day of Week and Monthly trend
    const dowCounts = {
        tkt: [0, 0, 0, 0, 0, 0, 0],
        wa: [0, 0, 0, 0, 0, 0, 0],
        mail: [0, 0, 0, 0, 0, 0, 0]
    };
    data.forEach(item => {
        if (!item.date) return;
        const day = safeParseDate(item.date).getDay();
        if (item.type === 'Call Ticket') dowCounts.tkt[day]++;
        else if (item.type === 'WhatsApp Chat') dowCounts.wa[day]++;
        else if (item.type === 'Care Email') dowCounts.mail[day]++;
    });

    const ctxDow = document.getElementById('vc-chart-day-of-week').getContext('2d');
    vcCharts.dayOfWeek = new Chart(ctxDow, {
        type: 'line',
        data: {
            labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            datasets: [
                {
                    label: 'Call Tickets',
                    data: dowCounts.tkt,
                    borderColor: THEME_COLORS.purple,
                    backgroundColor: 'transparent',
                    tension: 0.35,
                    borderWidth: 2
                },
                {
                    label: 'WhatsApp',
                    data: dowCounts.wa,
                    borderColor: THEME_COLORS.green,
                    backgroundColor: 'transparent',
                    tension: 0.35,
                    borderWidth: 2
                },
                {
                    label: 'Care Emails',
                    data: dowCounts.mail,
                    borderColor: THEME_COLORS.yellow,
                    backgroundColor: 'transparent',
                    tension: 0.35,
                    borderWidth: 2
                }
            ]
        },
        options: getCommonLineOptions(themeTextColor)
    });

    // Monthly channel load
    const monthCounts = {};
    data.forEach(item => {
        if (!item.date) return;
        const m = item.date.substring(0, 7); // "YYYY-MM"
        if (!monthCounts[m]) monthCounts[m] = { tkt: 0, wa: 0, mail: 0 };
        if (item.type === 'Call Ticket') monthCounts[m].tkt++;
        else if (item.type === 'WhatsApp Chat') monthCounts[m].wa++;
        else if (item.type === 'Care Email') monthCounts[m].mail++;
    });

    const sortedMonths = Object.keys(monthCounts).sort();
    const monthLabels = sortedMonths.map(mStr => {
        const [year, month] = mStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    const mCallPoints = sortedMonths.map(m => monthCounts[m].tkt);
    const mWaPoints = sortedMonths.map(m => monthCounts[m].wa);
    const mMailPoints = sortedMonths.map(m => monthCounts[m].mail);

    const ctxM = document.getElementById('vc-chart-monthly-trend').getContext('2d');
    vcCharts.monthlyTrend = new Chart(ctxM, {
        type: 'line',
        data: {
            labels: monthLabels.length > 0 ? monthLabels : ['No Data'],
            datasets: [
                {
                    label: 'Call Tickets',
                    data: mCallPoints.length > 0 ? mCallPoints : [0],
                    borderColor: THEME_COLORS.purple,
                    backgroundColor: 'transparent',
                    tension: 0.2,
                    borderWidth: 2
                },
                {
                    label: 'WhatsApp',
                    data: mWaPoints.length > 0 ? mWaPoints : [0],
                    borderColor: THEME_COLORS.green,
                    backgroundColor: 'transparent',
                    tension: 0.2,
                    borderWidth: 2
                },
                {
                    label: 'Care Emails',
                    data: mMailPoints.length > 0 ? mMailPoints : [0],
                    borderColor: THEME_COLORS.yellow,
                    backgroundColor: 'transparent',
                    tension: 0.2,
                    borderWidth: 2
                }
            ]
        },
        options: getCommonLineOptions(themeTextColor)
    });

    // Repeat Loops horizontal chart
    const ctxLoops = document.getElementById('vc-chart-repeat-loops').getContext('2d');
    vcCharts.repeatLoops = new Chart(ctxLoops, {
        type: 'bar',
        data: {
            labels: topRepeats.map(x => x.label),
            datasets: [{
                label: 'Repeat Cycles',
                data: topRepeats.map(x => x.count),
                backgroundColor: THEME_COLORS.purple,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { color: THEME_COLORS.border },
                    ticks: { color: themeTextColor, font: { family: 'SF Pro Text', size: 8 } }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        color: themeTextColor,
                        font: { family: 'SF Pro Text', size: 8 },
                        callback: function (val) {
                            const label = this.getLabelForValue(val) || "";
                            return label.length > 25 ? label.substring(0, 22) + "..." : label;
                        }
                    }
                }
            }
        }
    });

    // Outlier Scatter chart
    const ctxScatter = document.getElementById('vc-chart-outlier-scatter').getContext('2d');
    vcCharts.outlierScatter = new Chart(ctxScatter, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'RM outliers',
                    data: rmDataPoints,
                    backgroundColor: THEME_COLORS.purple,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: 'Branch outliers',
                    data: branchDataPoints,
                    backgroundColor: THEME_COLORS.yellow,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: themeTextColor, font: { family: 'SF Pro Text', size: 9 } }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const raw = context.raw;
                            return `${raw.label}: ${raw.x} contacts, ${raw.y} per active day`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Contact volume', color: themeTextColor, font: { family: 'SF Pro Text', size: 9 } },
                    grid: { color: THEME_COLORS.border },
                    ticks: { color: themeTextColor, font: { family: 'SF Pro Text', size: 8 } }
                },
                y: {
                    title: { display: true, text: 'Contacts per active day', color: themeTextColor, font: { family: 'SF Pro Text', size: 9 } },
                    grid: { color: THEME_COLORS.border },
                    ticks: { color: themeTextColor, font: { family: 'SF Pro Text', size: 8 } }
                }
            }
        }
    });

    // Render flow canvas
    renderSankeyFlowCanvas(data);

    // Render upgraded panels
    renderSLAAndQAMatrix(data);
    renderAutoCallbacksTracker(data);
    renderAgentBreaksTab(data, calls);
}

function renderSankeyFlowCanvas(data) {
    const canvas = document.getElementById('vc-chart-sankey-flow');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Fit to parent container size
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight || 300;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Compute top entities
    const brokersMap = {};
    const branchesMap = {};
    const issuesMap = {};

    data.forEach(item => {
        const br = item.broker_family || 'Others';
        const bh = item.branch || 'Others';
        const is = item.issue || 'Others';

        brokersMap[br] = (brokersMap[br] || 0) + 1;
        branchesMap[bh] = (branchesMap[bh] || 0) + 1;
        issuesMap[is] = (issuesMap[is] || 0) + 1;
    });

    const topBrokers = Object.entries(brokersMap).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const topBranches = Object.entries(branchesMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topIssues = Object.entries(issuesMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // If no data, return early
    if (topBrokers.length === 0) {
        ctx.fillStyle = THEME_COLORS.textSecondary;
        ctx.font = '12px SF Pro Text';
        ctx.textAlign = 'center';
        ctx.fillText('No data available to display flow', width / 2, height / 2);
        return;
    }

    // Node layout positions
    const nodeW = 120;
    const nodeH = 34;
    const x0 = 30;
    const x1 = width / 2 - nodeW / 2;
    const x2 = width - nodeW - 30;

    const getVerticalCoords = (count, nodeH, totalH) => {
        const gap = (totalH - 40 - (count * nodeH)) / (count + 1);
        const coords = [];
        for (let i = 0; i < count; i++) {
            coords.push(20 + gap + i * (nodeH + gap));
        }
        return coords;
    };

    const y0s = getVerticalCoords(topBrokers.length, nodeH, height);
    const y1s = getVerticalCoords(topBranches.length, nodeH, height);
    const y2s = getVerticalCoords(topIssues.length, nodeH, height);

    // Compute flows
    const flowBrokerBranch = {};
    const flowBranchIssue = {};
    data.forEach(item => {
        const br = item.broker_family || 'Others';
        const bh = item.branch || 'Others';
        const is = item.issue || 'Others';

        const k1 = `${br}||${bh}`;
        const k2 = `${bh}||${is}`;

        flowBrokerBranch[k1] = (flowBrokerBranch[k1] || 0) + 1;
        flowBranchIssue[k2] = (flowBranchIssue[k2] || 0) + 1;
    });

    const isLight = document.body.classList.contains('light-mode');
    const nodeBg = isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(20, 20, 30, 0.8)';
    const nodeBorder = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.18)';
    const textColor = isLight ? '#0f172a' : '#f8fafc';
    const subTextColor = isLight ? '#64748b' : '#cbd5e1';

    // Draw Links
    topBrokers.forEach(([broker, brVal], i) => {
        topBranches.forEach(([branch, bhVal], j) => {
            const flowVal = flowBrokerBranch[`${broker}||${branch}`] || 0;
            if (flowVal > 0) {
                const startY = y0s[i] + nodeH / 2;
                const endY = y1s[j] + nodeH / 2;
                const thickness = Math.max(1, Math.min(10, (flowVal / data.length) * 80));

                ctx.beginPath();
                ctx.moveTo(x0 + nodeW, startY);
                const cp1x = x0 + nodeW + (x1 - (x0 + nodeW)) / 2;
                const cp2x = x1 - (x1 - (x0 + nodeW)) / 2;
                ctx.bezierCurveTo(cp1x, startY, cp2x, endY, x1, endY);

                ctx.strokeStyle = isLight ? `rgba(5, 150, 105, ${0.12 + (flowVal / brVal) * 0.2})` : `rgba(16, 185, 129, ${0.12 + (flowVal / brVal) * 0.25})`;
                ctx.lineWidth = thickness;
                ctx.stroke();
            }
        });
    });

    topBranches.forEach(([branch, bhVal], j) => {
        topIssues.forEach(([issue, isVal], k) => {
            const flowVal = flowBranchIssue[`${branch}||${issue}`] || 0;
            if (flowVal > 0) {
                const startY = y1s[j] + nodeH / 2;
                const endY = y2s[k] + nodeH / 2;
                const thickness = Math.max(1, Math.min(10, (flowVal / data.length) * 80));

                ctx.beginPath();
                ctx.moveTo(x1 + nodeW, startY);
                const cp1x = x1 + nodeW + (x2 - (x1 + nodeW)) / 2;
                const cp2x = x2 - (x2 - (x1 + nodeW)) / 2;
                ctx.bezierCurveTo(cp1x, startY, cp2x, endY, x2, endY);

                ctx.strokeStyle = isLight ? `rgba(217, 119, 6, ${0.12 + (flowVal / bhVal) * 0.2})` : `rgba(251, 191, 36, ${0.12 + (flowVal / bhVal) * 0.25})`;
                ctx.lineWidth = thickness;
                ctx.stroke();
            }
        });
    });

    // Helper to draw node
    const drawNode = (text, count, x, y) => {
        ctx.fillStyle = nodeBg;
        ctx.strokeStyle = nodeBorder;
        ctx.lineWidth = 1;

        ctx.beginPath();
        const radius = 6;
        if (ctx.roundRect) {
            ctx.roundRect(x, y, nodeW, nodeH, radius);
        } else {
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + nodeW - radius, y);
            ctx.quadraticCurveTo(x + nodeW, y, x + nodeW, y + radius);
            ctx.lineTo(x + nodeW, y + nodeH - radius);
            ctx.quadraticCurveTo(x + nodeW, y + nodeH, x + nodeW - radius, y + nodeH);
            ctx.lineTo(x + radius, y + nodeH);
            ctx.quadraticCurveTo(x, y + nodeH, x, y + nodeH - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 9px SF Pro Display';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let displayTxt = text;
        if (displayTxt.length > 18) {
            displayTxt = displayTxt.substring(0, 16) + '...';
        }
        ctx.fillText(displayTxt, x + nodeW / 2, y + 11);

        ctx.fillStyle = subTextColor;
        ctx.font = '500 8px SF Pro Text';
        ctx.fillText(`${count} contacts`, x + nodeW / 2, y + 23);
    };

    // Map nodes' coordinates for hit-testing
    canvas._nodes = [];
    topBrokers.forEach(([broker, brVal], i) => {
        drawNode(broker, brVal, x0, y0s[i]);
        canvas._nodes.push({ type: 'broker', label: broker, count: brVal, x: x0, y: y0s[i], w: nodeW, h: nodeH });
    });
    topBranches.forEach(([branch, bhVal], j) => {
        drawNode(branch, bhVal, x1, y1s[j]);
        canvas._nodes.push({ type: 'branch', label: branch, count: bhVal, x: x1, y: y1s[j], w: nodeW, h: nodeH });
    });
    topIssues.forEach(([issue, isVal], k) => {
        drawNode(issue, isVal, x2, y2s[k]);
        canvas._nodes.push({ type: 'issue', label: issue, count: isVal, x: x2, y: y2s[k], w: nodeW, h: nodeH });
    });

    // Column labels
    ctx.fillStyle = subTextColor;
    ctx.font = 'bold 8px SF Pro Display';
    ctx.textAlign = 'center';
    ctx.fillText('BROKER', x0 + nodeW / 2, 12);
    ctx.fillText('BRANCH', x1 + nodeW / 2, 12);
    ctx.fillText('ISSUE CATEGORY', x2 + nodeW / 2, 12);

    // Bind click listener for interactive cross-filtering
    if (!canvas._clickListenerBound) {
        canvas._clickListenerBound = true;
        canvas.addEventListener('click', (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            if (canvas._nodes) {
                for (let node of canvas._nodes) {
                    if (mouseX >= node.x && mouseX <= node.x + node.w &&
                        mouseY >= node.y && mouseY <= node.y + node.h) {
                        console.log("Clicked Sankey node: " + node.label + " type: " + node.type);
                        if (node.type === 'broker') {
                            applySidebarFilter('broker', node.label);
                        } else if (node.type === 'branch') {
                            applySidebarFilter('branch', node.label);
                        } else {
                            showFloatingToast(`Flow focus: ${node.label} (${node.count} entries)`);
                        }
                        break;
                    }
                }
            }
        });
    }
}

// ==========================================================================
// 6.5. UPGRADED METRICS RENDERING: SLA, QA, AUTO-CALLBACKS, AGENT BREAKS
// ==========================================================================

function renderSLAAndQAMatrix(data) {
    // 1. Calculate SLA metrics per channel
    const channels = ['Call Ticket', 'WhatsApp Chat', 'Care Email'];
    const slaStats = {};
    channels.forEach(ch => {
        slaStats[ch] = {
            frtSum: 0, frtCount: 0, frtMet: 0,
            rtSum: 0, rtCount: 0, rtMet: 0
        };
    });

    data.forEach(item => {
        const ch = item.type;
        if (!slaStats[ch]) return;

        // FRT
        if (item.sla_frt !== null && item.sla_frt !== undefined) {
            slaStats[ch].frtSum += item.sla_frt;
            slaStats[ch].frtCount++;
            if (item.sla_frt_status === 'MET') {
                slaStats[ch].frtMet++;
            }
        }
        // RT
        const rtVal = (ch === 'WhatsApp Chat') ? item.resolution_time : item.sla_rt;
        if (rtVal !== null && rtVal !== undefined) {
            slaStats[ch].rtSum += rtVal;
            slaStats[ch].rtCount++;
            if (ch === 'WhatsApp Chat') {
                if (item.sla_status === 'MET') slaStats[ch].rtMet++;
            } else {
                if (item.sla_rt_status === 'MET') slaStats[ch].rtMet++;
            }
        }
    });

    const formatSeconds = (sec) => {
        if (sec === null || sec === undefined || isNaN(sec) || sec === 0) return '-';
        if (sec < 60) return `${Math.round(sec)}s`;
        const mins = Math.floor(sec / 60);
        if (mins < 60) {
            const secs = Math.round(sec % 60);
            return `${mins}m ${secs}s`;
        }
        const hrs = Math.floor(mins / 60);
        const remMins = Math.round(mins % 60);
        return `${hrs}h ${remMins}m`;
    };

    const formatPct = (met, total) => {
        if (!total) return '-';
        return `${Math.round((met / total) * 100)}%`;
    };

    const slaTbody = document.getElementById('vc-sla-table-body');
    if (slaTbody) {
        slaTbody.innerHTML = `
            <tr>
                <td><strong>Call Tickets</strong></td>
                <td class="text-right"><strong>${formatSeconds(slaStats['Call Ticket'].frtCount ? slaStats['Call Ticket'].frtSum / slaStats['Call Ticket'].frtCount : null)}</strong></td>
                <td class="text-right">${formatPct(slaStats['Call Ticket'].frtMet, slaStats['Call Ticket'].frtCount)}</td>
                <td class="text-right"><strong>${formatSeconds(slaStats['Call Ticket'].rtCount ? slaStats['Call Ticket'].rtSum / slaStats['Call Ticket'].rtCount : null)}</strong></td>
                <td class="text-right">${formatPct(slaStats['Call Ticket'].rtMet, slaStats['Call Ticket'].rtCount)}</td>
            </tr>
            <tr>
                <td><strong>WhatsApp Chats</strong></td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right"><strong>${formatSeconds(slaStats['WhatsApp Chat'].rtCount ? slaStats['WhatsApp Chat'].rtSum / slaStats['WhatsApp Chat'].rtCount : null)}</strong></td>
                <td class="text-right">${formatPct(slaStats['WhatsApp Chat'].rtMet, slaStats['WhatsApp Chat'].rtCount)}</td>
            </tr>
            <tr>
                <td><strong>Care Emails</strong></td>
                <td class="text-right"><strong>${formatSeconds(slaStats['Care Email'].frtCount ? slaStats['Care Email'].frtSum / slaStats['Care Email'].frtCount : null)}</strong></td>
                <td class="text-right">${formatPct(slaStats['Care Email'].frtMet, slaStats['Care Email'].frtCount)}</td>
                <td class="text-right"><strong>${formatSeconds(slaStats['Care Email'].rtCount ? slaStats['Care Email'].rtSum / slaStats['Care Email'].rtCount : null)}</strong></td>
                <td class="text-right">${formatPct(slaStats['Care Email'].rtMet, slaStats['Care Email'].rtCount)}</td>
            </tr>
        `;
    }

    // 2. Compute Voice & Tone QA Averages
    let greetingSum = 0, greetingCount = 0;
    let grammarSum = 0, grammarCount = 0;
    let ackSum = 0, ackCount = 0;
    let slaQASum = 0, slaQACount = 0;
    let assistanceSum = 0, assistanceCount = 0;
    let overallSum = 0, overallCount = 0;

    // Agent QA leaderboard group
    const agentQA = {};

    data.forEach(item => {
        if (item.qa_overall !== null && item.qa_overall !== undefined) {
            overallSum += item.qa_overall;
            overallCount++;

            if (item.qa_greeting !== null && item.qa_greeting !== undefined) {
                greetingSum += item.qa_greeting;
                greetingCount++;
            }
            if (item.qa_grammar !== null && item.qa_grammar !== undefined) {
                grammarSum += item.qa_grammar;
                grammarCount++;
            }
            if (item.qa_acknowledgement !== null && item.qa_acknowledgement !== undefined) {
                ackSum += item.qa_acknowledgement;
                ackCount++;
            }
            if (item.qa_sla !== null && item.qa_sla !== undefined) {
                slaQASum += item.qa_sla;
                slaQACount++;
            }
            if (item.qa_assistance !== null && item.qa_assistance !== undefined) {
                assistanceSum += item.qa_assistance;
                assistanceCount++;
            }

            // Leaderboard
            const agent = item.agent;
            if (agent && agent !== 'System' && agent !== 'Unassigned') {
                if (!agentQA[agent]) {
                    agentQA[agent] = { sum: 0, count: 0 };
                }
                agentQA[agent].sum += item.qa_overall;
                agentQA[agent].count++;
            }
        }
    });

    const setQAVal = (id, avg, max) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = avg !== null ? (Math.round(avg * 10) / 10) : '-';
        }
    };

    setQAVal('vc-qa-greetings', greetingCount ? greetingSum / greetingCount : null, 5);
    setQAVal('vc-qa-grammar', grammarCount ? grammarSum / grammarCount : null, 5);
    setQAVal('vc-qa-acknowledgement', ackCount ? ackSum / ackCount : null, 15);
    setQAVal('vc-qa-sla', slaQACount ? slaQASum / slaQACount : null, 15);
    setQAVal('vc-qa-assistance', assistanceCount ? assistanceSum / assistanceCount : null, 5);
    setQAVal('vc-qa-overall', overallCount ? overallSum / overallCount : null, 45);

    // Render Agent QA Leaderboard
    const qaLeaderboardBody = document.getElementById('vc-qa-leaderboard-body');
    if (qaLeaderboardBody) {
        const sortedAgents = Object.entries(agentQA)
            .map(([agent, stats]) => ({
                name: agent,
                count: stats.count,
                avg: stats.sum / stats.count
            }))
            .sort((a, b) => b.avg - a.avg);

        if (sortedAgents.length === 0) {
            qaLeaderboardBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted" style="padding: 10px;">No QA audits compiled for this period</td></tr>';
        } else {
            qaLeaderboardBody.innerHTML = sortedAgents.map(a => `
                <tr>
                    <td><strong>${a.name}</strong></td>
                    <td class="text-right">${a.count}</td>
                    <td class="text-right text-green"><strong>${Math.round(a.avg * 10) / 10} / 45</strong></td>
                </tr>
            `).join('');
        }
    }
}

function renderAutoCallbacksTracker(data) {
    // Filter inbound missed call tickets
    let missedCount = 0;
    let triggeredCount = 0;
    let answeredCount = 0;

    data.forEach(item => {
        if (item.type === 'Call Ticket' && item.call_status === 'missed') {
            missedCount++;
            if (item.callback_ucid) {
                triggeredCount++;
                const status = String(item.callback_status || "").toLowerCase();
                if (status === 'answered' || status === 'connected') {
                    answeredCount++;
                }
            }
        }
    });

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val.toLocaleString();
    };

    setVal('vc-callback-missed', missedCount);
    setVal('vc-callback-triggered', triggeredCount);
    setVal('vc-callback-answered', answeredCount);

    const triggeredPctEl = document.getElementById('vc-callback-triggered-pct');
    if (triggeredPctEl) {
        triggeredPctEl.innerText = missedCount ? `${Math.round((triggeredCount / missedCount) * 100)}% of missed` : '0% of missed';
    }

    const successRateEl = document.getElementById('vc-callback-success-rate');
    if (successRateEl) {
        successRateEl.innerText = triggeredCount ? `${Math.round((answeredCount / triggeredCount) * 100)}%` : '0%';
    }
}

let selectedAgentForBreaks = null;

function renderAgentBreaksTab(data, calls) {
    const fromTs = window.viewModel.fromTs;
    const toTs = window.viewModel.toTs;

    // Filter breaks dynamically by timeline
    let filteredBreaks = [];
    if (rawData.agent_breaks && Array.isArray(rawData.agent_breaks)) {
        filteredBreaks = rawData.agent_breaks.filter(b => {
            if (!b.date) return false;
            let bTs = safeParseDate(b.date).getTime();
            return bTs >= fromTs && bTs <= toTs;
        });
    }

    // Initialize agent statistics
    let agentSummary = {};
    
    // Group active days and talk time from filtered calls
    calls.forEach(c => {
        let agent = c.agent;
        if (!agent || agent === 'System' || agent === 'NA') return;
        
        // Respect active filters for agent
        if (activeFilters.agent !== 'all' && agent !== activeFilters.agent) return;

        if (!agentSummary[agent]) {
            agentSummary[agent] = {
                agent_name: agent,
                active_days: new Set(),
                total_breaks_sec: 0,
                talk_time_sec: 0,
                break_types: {}
            };
        }
        let dateStr = c.date ? c.date.split(" ")[0] : "";
        if (dateStr) agentSummary[agent].active_days.add(dateStr);
        agentSummary[agent].talk_time_sec += (c.talk_time || 0);
    });

    // Group active days and breaks duration from filtered breaks
    filteredBreaks.forEach(b => {
        let agent = b.agent_name;
        if (!agent || agent === 'NA') return;

        // Respect active filters for agent
        if (activeFilters.agent !== 'all' && agent !== activeFilters.agent) return;

        // Skip agent if there's any filter on calls and agent has no calls in filtered calls
        let hasCallsFilter = activeFilters.broker !== 'all' || activeFilters.poc !== 'all' || activeFilters.channel !== 'all';
        if (hasCallsFilter && !agentSummary[agent]) {
            return;
        }

        if (!agentSummary[agent]) {
            agentSummary[agent] = {
                agent_name: agent,
                active_days: new Set(),
                total_breaks_sec: 0,
                talk_time_sec: 0,
                break_types: {}
            };
        }

        let dateStr = b.date ? b.date.split(" ")[0] : "";
        if (dateStr) agentSummary[agent].active_days.add(dateStr);
        agentSummary[agent].total_breaks_sec += b.duration_sec;

        let btype = b.break_type || "Other";
        agentSummary[agent].break_types[btype] = (agentSummary[agent].break_types[btype] || 0) + b.duration_sec;
    });

    // Compile dynamic scorecards
    let scorecards = [];
    Object.keys(agentSummary).forEach(agent => {
        let s = agentSummary[agent];
        let activeDays = s.active_days.size;
        if (activeDays === 0) return;

        let shiftTimeSec = activeDays * 32400; // 9 hours/day
        let breakTimeSec = s.total_breaks_sec;
        let talkTimeSec = s.talk_time_sec;

        let denominator = shiftTimeSec - breakTimeSec;
        let occupancy = 0.0;
        if (denominator > 0) {
            occupancy = Math.round((talkTimeSec / denominator) * 10000) / 100;
            if (occupancy > 100.0) occupancy = 100.0;
        }

        scorecards.push({
            agent_name: agent,
            active_days: activeDays,
            logged_hours: Math.round((shiftTimeSec / 3600) * 100) / 100,
            total_breaks_sec: breakTimeSec,
            talk_time_sec: talkTimeSec,
            occupancy_rate: occupancy,
            break_types: s.break_types
        });
    });

    // Sort by occupancy rate descending
    scorecards.sort((a, b) => b.occupancy_rate - a.occupancy_rate);

    const formatSeconds = (sec) => {
        if (sec === null || sec === undefined || isNaN(sec)) return '0s';
        const mins = Math.floor(sec / 60);
        if (mins < 60) {
            return `${mins}m`;
        }
        const hrs = Math.floor(mins / 60);
        const remMins = Math.round(mins % 60);
        return `${hrs}h ${remMins}m`;
    };

    const tbody = document.getElementById('vc-breaks-table-body');
    if (tbody) {
        if (scorecards.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 20px;">No agent break records found</td></tr>';
        } else {
            tbody.innerHTML = scorecards.map(s => {
                const isSelected = selectedAgentForBreaks === s.agent_name;
                return `
                    <tr class="clickable-row ${isSelected ? 'selected-row' : ''}" data-agent="${s.agent_name}">
                        <td><strong>${s.agent_name}</strong></td>
                        <td class="text-right">${s.active_days} days</td>
                        <td class="text-right">${s.logged_hours} hrs</td>
                        <td class="text-right text-orange">${formatSeconds(s.total_breaks_sec)}</td>
                        <td class="text-right text-blue">${formatSeconds(s.talk_time_sec)}</td>
                        <td class="text-right text-green"><strong>${s.occupancy_rate}%</strong></td>
                    </tr>
                `;
            }).join('');

            // Bind click listeners
            const rows = tbody.querySelectorAll('.clickable-row');
            rows.forEach(row => {
                row.addEventListener('click', () => {
                    const agentName = row.getAttribute('data-agent');
                    if (selectedAgentForBreaks === agentName) {
                        selectedAgentForBreaks = null; // deselect
                    } else {
                        selectedAgentForBreaks = agentName;
                    }
                    renderAgentBreaksTab(data, calls); // re-render list and breakdown
                });
            });
        }
    }

    // Render Break Type breakdown on the right
    renderBreakdownPanel(scorecards, selectedAgentForBreaks);
}

function renderBreakdownPanel(scorecards, selectedAgent) {
    const titleEl = document.getElementById('vc-breaks-breakdown-title');
    const listEl = document.getElementById('vc-breaks-breakdown-list');
    if (!listEl) return;

    let breakTotals = {};
    let grandTotal = 0;

    if (selectedAgent) {
        if (titleEl) titleEl.innerText = `Break Type Distribution (Agent: ${selectedAgent})`;
        const scorecard = scorecards.find(s => s.agent_name === selectedAgent);
        if (scorecard) {
            breakTotals = scorecard.break_types;
            grandTotal = scorecard.total_breaks_sec;
        }
    } else {
        if (titleEl) titleEl.innerText = `Break Type Distribution (All Agents)`;
        scorecards.forEach(s => {
            Object.entries(s.break_types).forEach(([btype, duration]) => {
                breakTotals[btype] = (breakTotals[btype] || 0) + duration;
                grandTotal += duration;
            });
        });
    }

    const formatSeconds = (sec) => {
        if (sec === null || sec === undefined || isNaN(sec)) return '0s';
        const mins = Math.floor(sec / 60);
        if (mins < 60) {
            return `${mins}m`;
        }
        const hrs = Math.floor(mins / 60);
        const remMins = Math.round(mins % 60);
        return `${hrs}h ${remMins}m`;
    };

    if (grandTotal === 0) {
        listEl.innerHTML = '<div class="text-center text-muted" style="padding: 20px; font-size: 0.8rem;">No breaks registered for active selection</div>';
    } else {
        const sortedBreakTypes = Object.entries(breakTotals).sort((a, b) => b[1] - a[1]);
        listEl.innerHTML = sortedBreakTypes.map(([btype, duration]) => {
            const pct = Math.round((duration / grandTotal) * 100);
            return `
                <div class="break-bar-container">
                    <div class="break-bar-label-row">
                        <span>${btype}</span>
                        <strong>${formatSeconds(duration)} (${pct}%)</strong>
                    </div>
                    <div class="break-bar-outer">
                        <div class="break-bar-inner" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
}


// ==========================================================================
// GLOBAL formatSeconds HELPER (accessible to all new tab functions)
// Converts seconds to human-readable Xm Ys or X.Yh format
// ==========================================================================
function formatSeconds(sec) {
    if (sec === null || sec === undefined || isNaN(sec)) return '-';
    sec = Math.round(Number(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ==========================================================================
// NEW TAB RENDERING FUNCTIONS (Dashboard Redesign)
// ==========================================================================

// Chart refs for new tabs
let mdCharts = {};
let intelCharts = {};
let agentPerfCharts = {};

function destroyChartGroup(group) {
    Object.keys(group).forEach(key => {
        if (group[key]) { group[key].destroy(); group[key] = null; }
    });
}

function formatSecondsCompact(s) {
    return formatSeconds(s);
}

function exportTableAsCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const rows = table.querySelectorAll('tr');
    let csv = [];
    rows.forEach(row => {
        const cols = row.querySelectorAll('th, td');
        const rowData = Array.from(cols).map(c => '"' + c.innerText.replace(/"/g, '""') + '"');
        csv.push(rowData.join(','));
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'export.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ----- MAIN DASHBOARD RENDERING -----

let mdActiveSubTab = 'md-overview';

function renderMainDashboard() {
    const data = window.viewModel.interactions;
    const calls = window.viewModel.calls;
    const activeSubTab = mdActiveSubTab;

    // Setup sub-tab event listeners (only once)
    const subTabContainer = document.getElementById('main-dash-sub-tabs');
    if (subTabContainer && !subTabContainer._listenersSet) {
        subTabContainer._listenersSet = true;
        subTabContainer.querySelectorAll('.sub-tab-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                subTabContainer.querySelectorAll('.sub-tab-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                document.querySelectorAll('#tab-main-dashboard .sub-tab-content').forEach(c => c.classList.remove('active'));
                const targetId = pill.getAttribute('data-subtab');
                document.getElementById(targetId).classList.add('active');
                mdActiveSubTab = targetId;
                renderMainDashboard();
            });
        });
    }

    if (activeSubTab === 'md-overview') renderMainOverview(data, calls);
    else if (activeSubTab === 'md-calls') renderCallsDeepDive(data, calls);
    else if (activeSubTab === 'md-whatsapp') renderWhatsAppDeepDive(data);
    else if (activeSubTab === 'md-emails') renderEmailsDeepDive(data);
}

function renderMainOverview(data, calls) {
    destroyChartGroup(mdCharts);
    const callTickets = data.filter(d => d.type === 'Call Ticket');
    const whatsapp = data.filter(d => d.type === 'WhatsApp Chat');
    const emails = data.filter(d => d.type === 'Care Email');
    const daySpan = Math.max(1, Math.round((window.viewModel.toTs - window.viewModel.fromTs) / 86400000));

    function getAvgFRT(items) {
        const frtItems = items.filter(i => i.sla_frt && !isNaN(i.sla_frt));
        return frtItems.length ? Math.round(frtItems.reduce((s, i) => s + Number(i.sla_frt), 0) / frtItems.length) : 0;
    }
    function getSLACompliance(items, field) {
        const relevant = items.filter(i => i[field]);
        if (!relevant.length) return '-';
        const met = relevant.filter(i => i[field] === 'met').length;
        return Math.round((met / relevant.length) * 100) + '%';
    }
    function getTopIssue(items) {
        const counts = {};
        items.forEach(i => { if (i.issue && i.issue !== '-') counts[i.issue] = (counts[i.issue] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return sorted.length ? sorted[0][0] : '-';
    }
    function getTopBroker(items) {
        const counts = {};
        items.forEach(i => { if (i.broker_family && i.broker_family !== 'NA') counts[i.broker_family] = (counts[i.broker_family] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return sorted.length ? sorted[0][0] : '-';
    }
    function getOpenClosed(items) {
        const open = items.filter(i => ['new','open','in progress','work in progress'].includes((i.stage||'').toLowerCase())).length;
        return { open, closed: items.length - open };
    }

    const grid = document.getElementById('md-channel-summary-grid');
    const channels = [
        { name: 'Call Tickets', icon: '📞', cls: 'calls', items: callTickets, frt: getAvgFRT(callTickets), sla: getSLACompliance(callTickets, 'sla_frt_status'), topIssue: getTopIssue(callTickets), topBroker: getTopBroker(callTickets), oc: getOpenClosed(callTickets) },
        { name: 'WhatsApp Chats', icon: '💬', cls: 'whatsapp', items: whatsapp, frt: getAvgFRT(whatsapp), sla: getSLACompliance(whatsapp, 'sla_frt_status'), topIssue: getTopIssue(whatsapp), topBroker: getTopBroker(whatsapp), oc: getOpenClosed(whatsapp) },
        { name: 'Care Emails', icon: '📧', cls: 'emails', items: emails, frt: getAvgFRT(emails), sla: getSLACompliance(emails, 'sla_frt_status'), topIssue: getTopIssue(emails), topBroker: getTopBroker(emails), oc: getOpenClosed(emails) }
    ];
    grid.innerHTML = channels.map(ch => `
        <div class="channel-summary-card">
            <div class="channel-header">
                <div class="channel-icon ${ch.cls}">${ch.icon}</div>
                <div class="channel-name">${ch.name}</div>
            </div>
            <div class="channel-volume">${ch.items.length.toLocaleString()}</div>
            <div class="channel-avg">${(ch.items.length / daySpan).toFixed(1)} avg/day • ${ch.oc.open} open, ${ch.oc.closed} closed</div>
            <div class="channel-stats-grid">
                <div class="channel-stat-item"><span class="stat-label">Avg FRT</span><span class="stat-value">${formatSecondsCompact(ch.frt)}</span></div>
                <div class="channel-stat-item"><span class="stat-label">SLA Compliance</span><span class="stat-value">${ch.sla}</span></div>
                <div class="channel-stat-item"><span class="stat-label">Top Issue</span><span class="stat-value">${ch.topIssue}</span></div>
                <div class="channel-stat-item"><span class="stat-label">Top Broker</span><span class="stat-value">${ch.topBroker}</span></div>
            </div>
        </div>
    `).join('');

    // --- Core Operations Snapshot (Relocated) ---
    // Helpers
    const formatDuration = (sec) => {
        return formatSeconds(sec);
    };

    const formatSecondsUnit = (sec) => {
        if (!sec || isNaN(sec)) return "0s";
        if (sec < 60) return `${Math.round(sec)}s`;
        return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
    };

    // Filter calls by type
    // Case-insensitive call_type matching to handle varied capitalisation in source data
    const inboundCalls = calls.filter(c => (c.call_type || '').toLowerCase() === 'inbound' || (!c.call_type));
    const progressiveCalls = calls.filter(c => (c.call_type || '').toLowerCase().includes('progressive') || (c.call_type || '').toLowerCase().includes('callback'));

    // 1. TOTAL CALLS
    const totalCallsCount = calls.length; // Inbound + Progressive
    const callsConnected = calls.filter(c => (c.stage || '').toLowerCase() === 'answered' || (c.stage || '').toLowerCase() === 'connected').length;
    
    // Inbound Connected vs Inbound Unanswered
    const inboundConnected = inboundCalls.filter(c => (c.stage || '').toLowerCase() === 'answered' || (c.stage || '').toLowerCase() === 'connected');
    const inboundUnanswered = inboundCalls.filter(c => (c.stage || '').toLowerCase() === 'unanswered' || (c.stage || '').toLowerCase() === 'missed' || (c.stage || '').toLowerCase() === 'abandoned');
    
    // Outbound Answered
    const progressiveAnswered = progressiveCalls.filter(c => (c.stage || '').toLowerCase() === 'answered' || (c.stage || '').toLowerCase() === 'connected');

    // Calls Abandoned: Inbound Unanswered excluding AOH
    const inboundAoh = inboundCalls.filter(c => (c.sub_issue || '').toLowerCase() === 'aoh');
    const inboundAbandonedReal = inboundUnanswered.filter(c => (c.sub_issue || '').toLowerCase() !== 'aoh');
    const callsAbandoned = inboundAbandonedReal.length;

    // Render 1. TOTAL CALLS
    const elSnapTotalCalls = document.getElementById('md-snap-total-calls');
    if (elSnapTotalCalls) elSnapTotalCalls.innerText = totalCallsCount.toLocaleString();
    const elSnapCallsConnected = document.getElementById('md-snap-calls-connected');
    if (elSnapCallsConnected) elSnapCallsConnected.innerText = callsConnected.toLocaleString();
    const elSnapCallsAbandoned = document.getElementById('md-snap-calls-abandoned');
    if (elSnapCallsAbandoned) elSnapCallsAbandoned.innerText = callsAbandoned.toLocaleString();

    // 2. INBOUND
    const inboundCount = inboundCalls.length;
    const inboundAohCount = inboundAoh.length;
    const inboundAbandonedCount = inboundAbandonedReal.length;
    const uniqueAbandonedSet = new Set(inboundAbandonedReal.map(c => c.caller_no));
    const uniqueAbandonedCount = uniqueAbandonedSet.size;

    // Abandoned Inbound Splits: Agent / User / Other
    let inboundAbandonedAgent = 0;
    let inboundAbandonedUser = 0;
    let inboundAbandonedOther = 0;

    inboundAbandonedReal.forEach(c => {
        const ads = (c.agent_dial_status || '').toLowerCase();
        const ds = (c.dial_status || '').toLowerCase();
        const ev = (c.call_event || '').toLowerCase();
        if (ads === 'noanswer' || ads === 'normalcallclearing' || ads.includes('exceeded')) {
            inboundAbandonedAgent++;
        } else if (ads === 'user_disconnected' || ds === 'user_disconnected' || ev === 'queue') {
            inboundAbandonedUser++;
        } else {
            inboundAbandonedOther++;
        }
    });

    const inboundAbandonedPct = inboundCount > 0 ? (inboundAbandonedCount / inboundCount * 100).toFixed(1) : '0.0';

    const elSnapInboundCalls = document.getElementById('md-snap-inbound-calls');
    if (elSnapInboundCalls) elSnapInboundCalls.innerText = inboundCount.toLocaleString();
    const elSnapInboundAoh = document.getElementById('md-snap-inbound-aoh');
    if (elSnapInboundAoh) elSnapInboundAoh.innerText = inboundAohCount.toLocaleString();
    const elSnapInboundAbandoned = document.getElementById('md-snap-inbound-abandoned');
    if (elSnapInboundAbandoned) elSnapInboundAbandoned.innerText = inboundAbandonedCount.toLocaleString();
    const elSnapInboundUnique = document.getElementById('md-snap-inbound-unique-abandoned');
    if (elSnapInboundUnique) elSnapInboundUnique.innerText = uniqueAbandonedCount.toLocaleString();
    const elSnapInboundAgent = document.getElementById('md-snap-inbound-abandoned-agent');
    if (elSnapInboundAgent) elSnapInboundAgent.innerText = inboundAbandonedAgent.toLocaleString();
    const elSnapInboundUser = document.getElementById('md-snap-inbound-abandoned-user');
    if (elSnapInboundUser) elSnapInboundUser.innerText = inboundAbandonedUser.toLocaleString();
    const elSnapInboundPct = document.getElementById('md-snap-inbound-abandoned-pct');
    if (elSnapInboundPct) elSnapInboundPct.innerText = `${inboundAbandonedPct}%`;

    // 3. AHT / TIMING (Inbound Answered Calls)
    const inboundAnsDurations = inboundConnected.map(c => Number(c.duration) || 0);
    const inboundTalkTimes = inboundConnected.map(c => Number(c.talk_time) || 0);
    const inboundHoldTimes = inboundConnected.map(c => Number(c.hold_time) || 0);
    const inboundQueueAns = inboundConnected.map(c => Number(c.queue_time) || 0);
    const inboundQueueUnans = inboundAbandonedReal.map(c => Number(c.queue_time) || 0);

    const getAverageVal = arr => arr.length ? arr.reduce((a,b)=>a+b,0) / arr.length : 0;
    const getMedianVal = arr => {
        if (!arr.length) return 0;
        const sorted = [...arr].sort((a,b)=>a-b);
        const mid = Math.floor(sorted.length/2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid-1] + sorted[mid]) / 2;
    };
    const getPercentile90Val = arr => {
        if (!arr.length) return 0;
        const sorted = [...arr].sort((a,b)=>a-b);
        const idx = Math.floor(sorted.length * 0.9);
        return sorted[Math.min(idx, sorted.length - 1)];
    };

    const avgAht = getAverageVal(inboundAnsDurations);
    const medianAht = getMedianVal(inboundAnsDurations);
    const p90Aht = getPercentile90Val(inboundAnsDurations);
    const avgTalk = getAverageVal(inboundTalkTimes);
    const avgHold = getAverageVal(inboundHoldTimes);
    const avgQueueAns = getAverageVal(inboundQueueAns);
    const avgQueueUnans = getAverageVal(inboundQueueUnans);

    const elSnapAvgAht = document.getElementById('md-snap-avg-aht');
    if (elSnapAvgAht) elSnapAvgAht.innerText = formatDuration(avgAht);
    const elSnapMedianAht = document.getElementById('md-snap-median-aht');
    if (elSnapMedianAht) elSnapMedianAht.innerText = formatDuration(medianAht);
    const elSnap90pAht = document.getElementById('md-snap-90p-aht');
    if (elSnap90pAht) elSnap90pAht.innerText = formatDuration(p90Aht);
    const elSnapAvgTalk = document.getElementById('md-snap-avg-talk');
    if (elSnapAvgTalk) elSnapAvgTalk.innerText = formatDuration(avgTalk);
    const elSnapAvgHold = document.getElementById('md-snap-avg-hold');
    if (elSnapAvgHold) elSnapAvgHold.innerText = formatDuration(avgHold);
    const elSnapQueueAns = document.getElementById('md-snap-avg-queue-ans');
    if (elSnapQueueAns) elSnapQueueAns.innerText = formatSecondsUnit(avgQueueAns);
    const elSnapQueueUnans = document.getElementById('md-snap-avg-queue-unans');
    if (elSnapQueueUnans) elSnapQueueUnans.innerText = formatSecondsUnit(avgQueueUnans);

    // 4. PROGRESSIVE
    const progAttempted = progressiveCalls.length;
    const progAnsweredCount = progressiveAnswered.length;
    const progUnanswered = progressiveCalls.filter(c => (c.stage || '').toLowerCase() !== 'answered' && (c.stage || '').toLowerCase() !== 'connected');
    
    let progUnansAgent = 0;
    let progUnansUser = 0;
    let progUnansOther = 0;

    progUnanswered.forEach(c => {
        const ads = (c.agent_dial_status || '').toLowerCase();
        const ds = (c.dial_status || '').toLowerCase();
        const ev = (c.call_event || '').toLowerCase();
        if (ads === 'noanswer' || ads === 'normalcallclearing' || ads.includes('exceeded')) {
            progUnansAgent++;
        } else if (ads === 'user_disconnected' || ds === 'user_disconnected' || ev === 'queue') {
            progUnansUser++;
        } else {
            progUnansOther++;
        }
    });

    const progAnsDurations = progressiveAnswered.map(c => Number(c.duration) || 0);
    const progAvgAht = getAverageVal(progAnsDurations);

    const elSnapProgAttempted = document.getElementById('md-snap-prog-attempted');
    if (elSnapProgAttempted) elSnapProgAttempted.innerText = progAttempted.toLocaleString();
    const elSnapProgAnswered = document.getElementById('md-snap-prog-answered');
    if (elSnapProgAnswered) elSnapProgAnswered.innerText = progAnsweredCount.toLocaleString();
    const elSnapProgAgent = document.getElementById('md-snap-prog-unans-agent');
    if (elSnapProgAgent) elSnapProgAgent.innerText = progUnansAgent.toLocaleString();
    const elSnapProgUser = document.getElementById('md-snap-prog-unans-user');
    if (elSnapProgUser) elSnapProgUser.innerText = progUnansUser.toLocaleString();
    const elSnapProgOther = document.getElementById('md-snap-prog-unans-other');
    if (elSnapProgOther) elSnapProgOther.innerText = progUnansOther.toLocaleString();
    const elSnapProgAht = document.getElementById('md-snap-prog-avg-aht');
    if (elSnapProgAht) elSnapProgAht.innerText = formatDuration(progAvgAht);

    // 5. WHATSAPP
    const waChats = data.filter(d => d.type === 'WhatsApp Chat');
    const waCount = waChats.length;
    
    const waFrtItems = waChats.filter(d => d.sla_frt && !isNaN(d.sla_frt));
    const waAvgFrt = waFrtItems.length ? waFrtItems.reduce((s,d) => s + d.sla_frt, 0) / waFrtItems.length : 0;

    const waResItems = waChats.filter(d => d.sla_rt && !isNaN(d.sla_rt));
    const waAvgRes = waResItems.length ? waResItems.reduce((s,d) => s + d.sla_rt, 0) / waResItems.length : 0;

    const elSnapWaChats = document.getElementById('md-snap-wa-chats');
    if (elSnapWaChats) elSnapWaChats.innerText = waCount.toLocaleString();
    const elSnapWaFrt = document.getElementById('md-snap-wa-frt');
    if (elSnapWaFrt) elSnapWaFrt.innerText = waAvgFrt > 0 ? `${Math.round(waAvgFrt / 60)} min` : '-';
    const elSnapWaRes = document.getElementById('md-snap-wa-res');
    if (elSnapWaRes) elSnapWaRes.innerText = waAvgRes > 0 ? `${Math.round(waAvgRes / 60)} min` : '-';

    // 6. CARE EMAILS
    const emailTickets = data.filter(d => d.type === 'Care Email');
    const emailCount = emailTickets.length;

    const emailFrtItems = emailTickets.filter(d => d.sla_frt && !isNaN(d.sla_frt));
    const emailAvgFrt = emailFrtItems.length ? emailFrtItems.reduce((s,d) => s + d.sla_frt, 0) / emailFrtItems.length : 0;

    const elSnapMailTickets = document.getElementById('md-snap-mail-tickets');
    if (elSnapMailTickets) elSnapMailTickets.innerText = emailCount.toLocaleString();
    const elSnapMailFrt = document.getElementById('md-snap-mail-frt');
    if (elSnapMailFrt) elSnapMailFrt.innerText = emailAvgFrt > 0 ? `${Math.round(emailAvgFrt / 60)} min` : '-';

    // Badges comparisons
    const prevInboundCalls = window.viewModel.prevInteractions.filter(d => d.type === 'Call Ticket').length;
    const inboundDiff = inboundCount - prevInboundCalls;
    const inboundPctDiff = prevInboundCalls > 0 ? (inboundDiff / prevInboundCalls * 100) : 0;
    
    const inboundBadge = document.getElementById('md-snap-inbound-change');
    if (inboundBadge) {
        if (inboundPctDiff >= 0) {
            inboundBadge.className = 'change-badge up';
            inboundBadge.innerHTML = `↑ ${Math.abs(inboundPctDiff).toFixed(0)}%`;
        } else {
            inboundBadge.className = 'change-badge down';
            inboundBadge.innerHTML = `↓ ${Math.abs(inboundPctDiff).toFixed(0)}%`;
        }
        inboundBadge.style.display = prevInboundCalls > 0 ? 'inline-flex' : 'none';
    }

    const ahtBadge = document.getElementById('md-snap-aht-change');
    if (ahtBadge) {
        ahtBadge.style.display = 'none';
    }

    // Combined Trend Chart
    const dateMap = {};
    data.forEach(d => {
        const day = d.date ? d.date.substring(0, 10) : null;
        if (!day) return;
        if (!dateMap[day]) dateMap[day] = { calls: 0, wa: 0, emails: 0 };
        if (d.type === 'Call Ticket') dateMap[day].calls++;
        else if (d.type === 'WhatsApp Chat') dateMap[day].wa++;
        else if (d.type === 'Care Email') dateMap[day].emails++;
    });
    const sortedDates = Object.keys(dateMap).sort();
    const ctx1 = document.getElementById('md-combined-trend-chart');
    if (ctx1) {
        mdCharts.combinedTrend = new Chart(ctx1.getContext('2d'), {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [
                    { label: 'Call Tickets', data: sortedDates.map(d => dateMap[d].calls), borderColor: THEME_COLORS.blue, backgroundColor: THEME_COLORS.blue + '20', tension: 0.4, fill: true },
                    { label: 'WhatsApp', data: sortedDates.map(d => dateMap[d].wa), borderColor: THEME_COLORS.green, backgroundColor: THEME_COLORS.green + '20', tension: 0.4, fill: true },
                    { label: 'Care Emails', data: sortedDates.map(d => dateMap[d].emails), borderColor: THEME_COLORS.orange, backgroundColor: THEME_COLORS.orange + '20', tension: 0.4, fill: true }
                ]
            },
            options: { responsive: true, plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } }, scales: { x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted'), maxTicksLimit: 15 } }, y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') }, beginAtZero: true } } }
        });
    }

    // Channel Mix Donut
    const ctx2 = document.getElementById('md-channel-mix-chart');
    if (ctx2) {
        mdCharts.channelMix = new Chart(ctx2.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Call Tickets', 'WhatsApp', 'Care Emails'],
                datasets: [{ data: [callTickets.length, whatsapp.length, emails.length], backgroundColor: [THEME_COLORS.blue, THEME_COLORS.green, THEME_COLORS.orange], borderWidth: 0 }]
            },
            options: { responsive: true, plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } } }
        });
    }

    // Response Time Comparison Bar
    const ctx3 = document.getElementById('md-response-time-chart');
    if (ctx3) {
        const avgRT = (items) => {
            const rtItems = items.filter(i => i.sla_rt && !isNaN(i.sla_rt));
            return rtItems.length ? Math.round(rtItems.reduce((s, i) => s + Number(i.sla_rt), 0) / rtItems.length) : 0;
        };
        mdCharts.responseTime = new Chart(ctx3.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Call Tickets', 'WhatsApp', 'Care Emails'],
                datasets: [
                    { label: 'Avg FRT (sec)', data: [getAvgFRT(callTickets), getAvgFRT(whatsapp), getAvgFRT(emails)], backgroundColor: [THEME_COLORS.blue + '80', THEME_COLORS.green + '80', THEME_COLORS.orange + '80'], borderRadius: 6 },
                    { label: 'Avg RT (sec)', data: [avgRT(callTickets), avgRT(whatsapp), avgRT(emails)], backgroundColor: [THEME_COLORS.blue, THEME_COLORS.green, THEME_COLORS.orange], borderRadius: 6 }
                ]
            },
            options: { responsive: true, plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } }, scales: { x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } }, y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') }, beginAtZero: true } } }
        });
    }

    // Render SLA Risk Queue
    renderSLARiskMonitor();
}

function renderCallsDeepDive(data, calls) {
    destroyChartGroup(mdCharts);
    const callTickets = data.filter(d => d.type === 'Call Ticket');
    const answered = [];
    const missed = [];
    const aoh = [];
    const other = [];

    callTickets.forEach(item => {
        let cs = String(item.call_status || "").toLowerCase();
        if (cs === 'other' || !cs) {
            const titleLower = (item.title || "").toLowerCase();
            if (titleLower.includes('missed call')) cs = 'missed';
            else if (titleLower.includes('aoh call')) cs = 'aoh';
            else if (titleLower.includes('answered call')) cs = 'answered';
        }
        if (cs === 'answered') answered.push(item);
        else if (cs === 'missed') missed.push(item);
        else if (cs === 'aoh') aoh.push(item);
        else other.push(item);
    });

    // AHT/AQT from Ozonetel Calls sheet (calls)
    let callAns = 0;
    let totalCallDuration = 0;
    let totalCallQueue = 0;
    
    calls.forEach(call => {
        const ct = String(call.call_type || '').toLowerCase();
        const st = String(call.stage || '').toLowerCase();
        if (!ct || ct === 'inbound') {
            if (st === 'answered' || st === 'connected') {
                callAns++;
                totalCallDuration += (call.talk_time || 0);
                totalCallQueue += (call.queue_time || 0);
            }
        }
    });

    const aht = callAns > 0 ? Math.round(totalCallDuration / callAns) : 0;
    const aqt = callAns > 0 ? Math.round(totalCallQueue / callAns) : 0;

    const kpiGrid = document.getElementById('md-calls-kpi-grid');
    kpiGrid.innerHTML = [
        { title: 'Total Call Tickets', value: callTickets.length, cls: '' },
        { title: 'Answered', value: answered.length, cls: 'text-green' },
        { title: 'Missed', value: missed.length, cls: 'text-red' },
        { title: 'AOH', value: aoh.length, cls: 'text-orange' },
        { title: 'AHT', value: formatSecondsCompact(aht), cls: '' },
        { title: 'AQT', value: formatSecondsCompact(aqt), cls: '' }
    ].map(k => `
        <div class="kpi-card"><span class="kpi-title">${k.title}</span><div class="kpi-value ${k.cls}">${k.value}</div></div>
    `).join('');

    // Call Volume Trend
    const dateMap = {};
    callTickets.forEach(item => {
        const d = (item.date||'').substring(0,10);
        if(d) {
            if(!dateMap[d]) dateMap[d]={a:0,m:0,o:0};
            let cs = String(item.call_status || "").toLowerCase();
            if (cs === 'other' || !cs) {
                const titleLower = (item.title || "").toLowerCase();
                if (titleLower.includes('missed call')) cs = 'missed';
                else if (titleLower.includes('aoh call')) cs = 'aoh';
                else if (titleLower.includes('answered call')) cs = 'answered';
            }
            if (cs === 'answered') dateMap[d].a++;
            else if (cs === 'missed') dateMap[d].m++;
            else dateMap[d].o++;
        }
    });
    const dates = Object.keys(dateMap).sort();
    const ctx1 = document.getElementById('md-call-volume-chart');
    if (ctx1) {
        mdCharts.callVolume = new Chart(ctx1.getContext('2d'), {
            type: 'bar', data: { labels: dates, datasets: [
                { label: 'Answered', data: dates.map(d => dateMap[d].a), backgroundColor: THEME_COLORS.green + '80', borderRadius: 4 },
                { label: 'Missed', data: dates.map(d => dateMap[d].m), backgroundColor: THEME_COLORS.red + '80', borderRadius: 4 },
                { label: 'AOH/Other', data: dates.map(d => dateMap[d].o), backgroundColor: THEME_COLORS.orange + '60', borderRadius: 4 }
            ] }, options: { responsive: true, scales: { x: { stacked: true, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted'), maxTicksLimit: 15 } }, y: { stacked: true, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') }, beginAtZero: true } }, plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } } }
        });
    }

    // Call Status Donut
    const ctx2 = document.getElementById('md-call-status-chart');
    if (ctx2) {
        mdCharts.callStatus = new Chart(ctx2.getContext('2d'), {
            type: 'doughnut', data: { labels: ['Answered', 'Missed', 'AOH/Other'], datasets: [{ data: [answered.length, missed.length, aoh.length], backgroundColor: [THEME_COLORS.green, THEME_COLORS.red, THEME_COLORS.orange], borderWidth: 0 }] },
            options: { responsive: true, plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } } }
        });
    }

    // Agent Call Performance
    const agentCounts = {};
    callTickets.forEach(t => { const a = t.agent || 'Unknown'; agentCounts[a] = (agentCounts[a]||0)+1; });
    const sortedAgents = Object.entries(agentCounts).sort((a,b)=>b[1]-a[1]).slice(0,10);
    const ctx3 = document.getElementById('md-agent-calls-chart');
    if (ctx3) {
        mdCharts.agentCalls = new Chart(ctx3.getContext('2d'), {
            type: 'bar', data: { labels: sortedAgents.map(a=>a[0]), datasets: [{ label: 'Call Tickets Handled', data: sortedAgents.map(a=>a[1]), backgroundColor: THEME_COLORS.purple + '80', borderRadius: 6 }] },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') }, beginAtZero: true }, y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } } }
        });
    }

    // Callback metrics
    const callbackDiv = document.getElementById('md-callback-metrics');
    if (callbackDiv && rawData) {
        const inboundMissed = calls.filter(c => (c.call_type||'').toLowerCase() === 'inbound' && (c.stage||'').toLowerCase() !== 'answered' && (c.stage||'').toLowerCase() !== 'connected');
        const callbacks = calls.filter(c => (c.call_type||'').toLowerCase() === 'progressive');
        const cbAnswered = callbacks.filter(c => (c.stage||'').toLowerCase() === 'answered' || (c.stage||'').toLowerCase() === 'connected');
        callbackDiv.innerHTML = `
            <div class="agent-scorecard-grid" style="grid-template-columns: repeat(2, 1fr);">
                <div class="agent-score-card"><div class="score-label">Missed Calls</div><div class="score-value">${inboundMissed.length}</div></div>
                <div class="agent-score-card"><div class="score-label">Callbacks Triggered</div><div class="score-value">${callbacks.length}</div><div class="score-sub">${inboundMissed.length ? Math.round(callbacks.length/inboundMissed.length*100) : 0}% conversion</div></div>
                <div class="agent-score-card"><div class="score-label">Callbacks Answered</div><div class="score-value">${cbAnswered.length}</div></div>
                <div class="agent-score-card"><div class="score-label">Success Rate</div><div class="score-value">${callbacks.length ? Math.round(cbAnswered.length/callbacks.length*100) : 0}%</div></div>
            </div>
        `;
    }

    // SLA Compliance — Calls table rendering
    const callsSlaTable = document.getElementById('md-calls-sla-table');
    if (callsSlaTable) {
        const frtItems = callTickets.filter(t => t.sla_frt !== null && t.sla_frt !== undefined);
        const rtItems = callTickets.filter(t => t.sla_rt !== null && t.sla_rt !== undefined);
        
        const frtMet = frtItems.filter(t => String(t.sla_frt_status || '').toUpperCase() === 'MET').length;
        const rtMet = rtItems.filter(t => String(t.sla_rt_status || '').toUpperCase() === 'MET').length;
        
        const avgFrt = frtItems.length ? frtItems.reduce((s, t) => s + t.sla_frt, 0) / frtItems.length : 0;
        const avgRt = rtItems.length ? rtItems.reduce((s, t) => s + t.sla_rt, 0) / rtItems.length : 0;
        
        const frtCompliance = frtItems.length ? `${Math.round((frtMet / frtItems.length) * 100)}%` : '-';
        const rtCompliance = rtItems.length ? `${Math.round((rtMet / rtItems.length) * 100)}%` : '-';
        
        callsSlaTable.innerHTML = `
            <div class="monthly-table-wrapper">
                <table class="monthly-table">
                    <thead>
                        <tr>
                            <th style="text-align: left;">Metric Type</th>
                            <th>Target SLA</th>
                            <th>Total Covered</th>
                            <th>Average Time</th>
                            <th>SLA Met</th>
                            <th>SLA Compliance</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="text-align: left;"><strong>First Response Time (FRT)</strong></td>
                            <td>&lt; 5 min</td>
                            <td>${frtItems.length}</td>
                            <td>${avgFrt > 0 ? formatSecondsCompact(avgFrt) : '-'}</td>
                            <td>${frtMet}</td>
                            <td class="${frtMet/frtItems.length < 0.9 ? 'text-red' : 'text-green'}" style="font-weight: 700;">${frtCompliance}</td>
                        </tr>
                        <tr>
                            <td style="text-align: left;"><strong>Resolution Time (RT)</strong></td>
                            <td>&lt; 30 min</td>
                            <td>${rtItems.length}</td>
                            <td>${avgRt > 0 ? formatSecondsCompact(avgRt) : '-'}</td>
                            <td>${rtMet}</td>
                            <td class="${rtMet/rtItems.length < 0.9 ? 'text-red' : 'text-green'}" style="font-weight: 700;">${rtCompliance}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Render new Hourly Abandonment Chart
    renderHourlyAbandonmentTrend(calls);
}

function renderWhatsAppDeepDive(data) {
    destroyChartGroup(mdCharts);
    const wa = data.filter(d => d.type === 'WhatsApp Chat');
    const daySpan = Math.max(1, Math.round((window.viewModel.toTs - window.viewModel.fromTs) / 86400000));

    const kpiGrid = document.getElementById('md-wa-kpi-grid');
    const openCount = wa.filter(i => ['open','new','in progress'].includes((i.stage||'').toLowerCase())).length;
    const closedCount = wa.filter(i => (i.stage||'').toLowerCase() === 'closed').length;
    kpiGrid.innerHTML = [
        { title: 'Total Chats', value: wa.length },
        { title: 'Avg / Day', value: (wa.length / daySpan).toFixed(1) },
        { title: 'Open', value: openCount },
        { title: 'Closed', value: closedCount }
    ].map(k => `<div class="kpi-card"><span class="kpi-title">${k.title}</span><div class="kpi-value">${k.value}</div></div>`).join('');

    // Volume Trend
    const dateMap = {};
    wa.forEach(d => { const day = (d.date||'').substring(0,10); if(day) dateMap[day] = (dateMap[day]||0)+1; });
    const dates = Object.keys(dateMap).sort();
    const ctx1 = document.getElementById('md-wa-volume-chart');
    if (ctx1) {
        mdCharts.waVolume = new Chart(ctx1.getContext('2d'), {
            type: 'line', data: { labels: dates, datasets: [{ label: 'WhatsApp Chats', data: dates.map(d => dateMap[d]), borderColor: THEME_COLORS.green, backgroundColor: THEME_COLORS.green + '20', tension: 0.4, fill: true }] },
            options: { responsive: true, plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } }, scales: { x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted'), maxTicksLimit: 15 } }, y: { beginAtZero: true, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } } } }
        });
    }

    // Stage Distribution
    const stageCounts = {};
    wa.forEach(d => { const s = d.stage || 'Unknown'; stageCounts[s] = (stageCounts[s]||0)+1; });
    const ctx2 = document.getElementById('md-wa-stage-chart');
    if (ctx2) {
        const labels = Object.keys(stageCounts); const values = Object.values(stageCounts);
        mdCharts.waStage = new Chart(ctx2.getContext('2d'), {
            type: 'doughnut', data: { labels, datasets: [{ data: values, backgroundColor: [THEME_COLORS.green, THEME_COLORS.purple, THEME_COLORS.orange, THEME_COLORS.blue, THEME_COLORS.red, THEME_COLORS.cyan], borderWidth: 0 }] },
            options: { responsive: true, plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } } }
        });
    }

    // Top Issues
    const issueCounts = {};
    wa.forEach(d => {
        if (d.issue && d.issue !== '-') {
            const key = `${d.issue}/${d.sub_issue || 'General'}`;
            issueCounts[key] = (issueCounts[key] || 0) + 1;
        }
    });
    const topIssues = Object.entries(issueCounts).sort((a,b) => b[1]-a[1]).slice(0,8);
    const ctx3 = document.getElementById('md-wa-issues-chart');
    if (ctx3) {
        mdCharts.waIssues = new Chart(ctx3.getContext('2d'), {
            type: 'bar', data: { labels: topIssues.map(i=>i[0]), datasets: [{ label: 'Count', data: topIssues.map(i=>i[1]), backgroundColor: THEME_COLORS.green + '70', borderRadius: 6 }] },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } }, y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } } }
        });
    }

    // Top Brokers
    const brokerCounts = {};
    wa.forEach(d => { if(d.broker_family && d.broker_family !== 'NA') brokerCounts[d.broker_family] = (brokerCounts[d.broker_family]||0)+1; });
    const topBrokers = Object.entries(brokerCounts).sort((a,b) => b[1]-a[1]).slice(0,8);
    const ctx4 = document.getElementById('md-wa-brokers-chart');
    if (ctx4) {
        mdCharts.waBrokers = new Chart(ctx4.getContext('2d'), {
            type: 'bar', data: { labels: topBrokers.map(i=>i[0]), datasets: [{ label: 'Chats', data: topBrokers.map(i=>i[1]), backgroundColor: THEME_COLORS.cyan + '70', borderRadius: 6 }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } }, y: { beginAtZero: true, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } } } }
        });
    }
}

function renderEmailsDeepDive(data) {
    destroyChartGroup(mdCharts);
    const emails = data.filter(d => d.type === 'Care Email');
    const daySpan = Math.max(1, Math.round((window.viewModel.toTs - window.viewModel.fromTs) / 86400000));

    const kpiGrid = document.getElementById('md-email-kpi-grid');
    const openCount = emails.filter(i => ['open','new','in progress'].includes((i.stage||'').toLowerCase())).length;
    kpiGrid.innerHTML = [
        { title: 'Total Emails', value: emails.length },
        { title: 'Avg / Day', value: (emails.length / daySpan).toFixed(1) },
        { title: 'Open', value: openCount },
        { title: 'Closed', value: emails.length - openCount }
    ].map(k => `<div class="kpi-card"><span class="kpi-title">${k.title}</span><div class="kpi-value">${k.value}</div></div>`).join('');

    // Volume Trend
    const dateMap = {};
    emails.forEach(d => { const day = (d.date||'').substring(0,10); if(day) dateMap[day] = (dateMap[day]||0)+1; });
    const dates = Object.keys(dateMap).sort();
    const ctx1 = document.getElementById('md-email-volume-chart');
    if (ctx1) {
        mdCharts.emailVolume = new Chart(ctx1.getContext('2d'), {
            type: 'line', data: { labels: dates, datasets: [{ label: 'Care Emails', data: dates.map(d => dateMap[d]), borderColor: THEME_COLORS.orange, backgroundColor: THEME_COLORS.orange + '20', tension: 0.4, fill: true }] },
            options: { responsive: true, plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } }, scales: { x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted'), maxTicksLimit: 15 } }, y: { beginAtZero: true, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } } } }
        });
    }

    // Sentiment
    const sentCounts = {};
    emails.forEach(d => { const s = d.sentiment || 'Unknown'; sentCounts[s] = (sentCounts[s]||0)+1; });
    const ctx2 = document.getElementById('md-email-sentiment-chart');
    if (ctx2) {
        mdCharts.emailSentiment = new Chart(ctx2.getContext('2d'), {
            type: 'doughnut', data: { labels: Object.keys(sentCounts), datasets: [{ data: Object.values(sentCounts), backgroundColor: [THEME_COLORS.green, THEME_COLORS.blue, THEME_COLORS.red, THEME_COLORS.orange], borderWidth: 0 }] },
            options: { responsive: true, plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } } }
        });
    }

    // Top Senders (Changed to Top Brokers per user request)
    const senderCounts = {};
    emails.forEach(d => {
        const s = d.account_display_name || d.broker_family || 'Unknown';
        if (s && s !== '-' && s !== 'Unknown' && s !== 'NA') {
            senderCounts[s] = (senderCounts[s]||0)+1;
        }
    });
    const topSenders = Object.entries(senderCounts).sort((a,b) => b[1]-a[1]).slice(0,8);
    
    // Dynamically update chart card title to "Top Brokers by Email"
    const sendersChartCanvas = document.getElementById('md-email-senders-chart');
    if (sendersChartCanvas) {
        const cardTitle = sendersChartCanvas.closest('.deepdive-chart-card').querySelector('.chart-title');
        if (cardTitle) cardTitle.innerHTML = '🏢 Top Brokers by Email';
    }
    const ctx3 = sendersChartCanvas;
    if (ctx3) {
        mdCharts.emailSenders = new Chart(ctx3.getContext('2d'), {
            type: 'bar', data: { labels: topSenders.map(i=>i[0]), datasets: [{ label: 'Emails', data: topSenders.map(i=>i[1]), backgroundColor: THEME_COLORS.orange + '70', borderRadius: 6 }] },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } }, y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } } }
        });
    }

    // Response Times
    const ctx4 = document.getElementById('md-email-response-chart');
    if (ctx4) {
        const frtItems = emails.filter(i => i.sla_frt && !isNaN(i.sla_frt));
        const rtItems = emails.filter(i => i.sla_rt && !isNaN(i.sla_rt));
        const avgFrt = frtItems.length ? Math.round(frtItems.reduce((s,i)=>s+Number(i.sla_frt),0)/frtItems.length) : 0;
        const avgRt = rtItems.length ? Math.round(rtItems.reduce((s,i)=>s+Number(i.sla_rt),0)/rtItems.length) : 0;
        mdCharts.emailResponse = new Chart(ctx4.getContext('2d'), {
            type: 'bar', data: { labels: ['Avg FRT', 'Avg RT'], datasets: [{ data: [avgFrt, avgRt], backgroundColor: [THEME_COLORS.orange + '80', THEME_COLORS.orange], borderRadius: 8 }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } }, y: { beginAtZero: true, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } } } }
        });
    }
}

// ----- INTELLIGENCE DASHBOARD -----

// Dynamic calculation helper functions for Intelligence
function getDynamicRepeatLoops(interactionsList) {
    const groups = {};
    interactionsList.forEach(item => {
        if (!item.rm_name || item.rm_name === "NA" || !item.date) return;
        if (item.issue === "General" || item.issue === "Voice Call") return;
        const k = `${item.rm_name}||${item.broker_family || 'NA'}||${item.branch || 'Not shared'}||${item.issue}`;
        if (!groups[k]) groups[k] = [];
        try {
            groups[k].push(safeParseDate(item.date).getTime());
        } catch (e) {}
    });

    const list = [];
    Object.entries(groups).forEach(([key, tss]) => {
        if (tss.length < 2) return;
        tss.sort((a, b) => a - b);
        let repeatCount = 0;
        for (let i = 1; i < tss.length; i++) {
            if (tss[i] - tss[i - 1] <= 7 * 24 * 60 * 60 * 1000) {
                repeatCount++;
            }
        }
        if (repeatCount >= 1) {
            const [rm_name, broker_family, branch, issue] = key.split('||');
            list.push({
                rm_name,
                broker_family,
                branch,
                issue,
                repeat_count: repeatCount + 1
            });
        }
    });
    return list.sort((a, b) => b.repeat_count - a.repeat_count);
}

function getDynamicOutliers(interactionsList) {
    const groups = {};
    interactionsList.forEach(item => {
        if (!item.rm_name || item.rm_name === "NA") return;
        const k = `${item.rm_name}||${item.broker_family || 'NA'}||${item.branch || 'Not shared'}`;
        if (!groups[k]) groups[k] = { count: 0, dates: new Set() };
        groups[k].count++;
        if (item.date) {
            groups[k].dates.add(item.date.substring(0, 10));
        }
    });

    const list = [];
    Object.entries(groups).forEach(([key, g]) => {
        const [rm_name, broker_family, branch] = key.split('||');
        const activeDays = Math.max(1, g.dates.size);
        const contacts_per_day = g.count / activeDays;
        list.push({
            rm_name,
            broker_family,
            branch,
            contacts: g.count,
            contacts_per_day: contacts_per_day,
            is_outlier: false
        });
    });

    if (list.length === 0) return [];
    const avgContactsPerDay = list.reduce((sum, item) => sum + item.contacts_per_day, 0) / list.length;
    const stdContactsPerDay = Math.sqrt(list.reduce((sum, item) => sum + Math.pow(item.contacts_per_day - avgContactsPerDay, 2), 0) / list.length) || 1;
    
    list.forEach(o => {
        o.is_outlier = o.contacts_per_day > (avgContactsPerDay + 1.2 * stdContactsPerDay) || o.contacts > 20;
    });

    return list.sort((a, b) => b.contacts_per_day - a.contacts_per_day);
}

function generateSmartInsights(data, calls) {
    const dynamicLoops = getDynamicRepeatLoops(data);
    const dynamicOutliers = getDynamicOutliers(data);
    
    let insights = '';
    
    // 1. Loop Hotspot
    if (dynamicLoops.length > 0) {
        const topLoop = dynamicLoops[0];
        insights += `<div style="margin-bottom:12px; display:flex; align-items:start; gap:8px;">
            <span style="font-size:1.1rem; line-height:1;">🚨</span>
            <div>
                <strong>Critical Repeat Loop Alert:</strong> Relationship Manager <strong>${topLoop.rm_name}</strong> has <strong>${topLoop.repeat_count}</strong> repeated contacts regarding <strong>"${topLoop.issue}"</strong> from <strong>${topLoop.broker_family}</strong> (Branch: ${topLoop.branch}) within a 7-day window. This is the highest repeat loop hotspot, suggesting a broken operational workflow or branch communication issue that needs direct coaching.
            </div>
        </div>`;
    } else {
        insights += `<div style="margin-bottom:12px; display:flex; align-items:start; gap:8px;">
            <span style="font-size:1.1rem; line-height:1;">✅</span>
            <div>
                <strong>No Active Repeat Loops:</strong> No RM-Broker-Issue repeat loops detected within a 7-day window. Operational processes appear stable.
            </div>
        </div>`;
    }

    // 2. Outlier RM
    const outliers = dynamicOutliers.filter(o => o.is_outlier);
    if (outliers.length > 0) {
        const topOutlier = outliers[0];
        const avgContacts = dynamicOutliers.reduce((s,o)=>s+o.contacts, 0) / dynamicOutliers.length || 1;
        const pctAbove = Math.round(((topOutlier.contacts - avgContacts) / avgContacts) * 100);
        insights += `<div style="margin-bottom:12px; display:flex; align-items:start; gap:8px;">
            <span style="font-size:1.1rem; line-height:1;">⚖️</span>
            <div>
                <strong>Workload Outlier Alert:</strong> Relationship Manager <strong>${topOutlier.rm_name}</strong> is managing <strong>${topOutlier.contacts}</strong> contacts (avg <strong>${topOutlier.contacts_per_day.toFixed(1)}/day</strong>) in this period. This is <strong>${pctAbove}%</strong> above the average active RM workload. Consider rebalancing broker accounts to prevent burnout.
            </div>
        </div>`;
    }

    // 3. Low-Scoring Broker Health
    const brokerMap = {};
    data.forEach(d => {
        const b = d.broker_family; if (!b || b === 'NA') return;
        if (!brokerMap[b]) brokerMap[b] = { total: 0, repeats: 0, issues: new Set() };
        brokerMap[b].total++;
        if (d.issue) brokerMap[b].issues.add(d.issue);
    });
    dynamicLoops.forEach(l => { if (brokerMap[l.broker_family]) brokerMap[l.broker_family].repeats += l.repeat_count; });
    const brokerScores = Object.entries(brokerMap).map(([name, d]) => {
        const repeatPenalty = Math.min(30, d.repeats * 3);
        const diversityPenalty = Math.min(20, d.issues.size * 2);
        const volumeScore = Math.min(25, Math.round(d.total / 5));
        const score = Math.max(0, 100 - repeatPenalty - diversityPenalty - volumeScore);
        return { name, score };
    }).filter(b => b.score < 65).sort((a,b) => a.score - b.score);

    if (brokerScores.length > 0) {
        insights += `<div style="margin-bottom:12px; display:flex; align-items:start; gap:8px;">
            <span style="font-size:1.1rem; line-height:1;">🏥</span>
            <div>
                <strong>Broker Health Warning:</strong> <strong>${brokerScores[0].name}</strong> has a low health score of <strong>${brokerScores[0].score}/100</strong> due to elevated repeat issue rates and issue diversity. We recommend reaching out to their assigned POC to run a proactive diagnostic sync.
            </div>
        </div>`;
    }

    // 4. Peak call times & Missed Calls
    const hourCounts = Array(24).fill(0);
    let missedCount = 0;
    data.forEach(d => {
        if (d.type === 'Call Ticket') {
            const cs = String(d.call_status || '').toLowerCase();
            const titleLower = (d.title || '').toLowerCase();
            if (cs === 'missed' || titleLower.includes('missed')) {
                missedCount++;
                if (d.date) {
                    try {
                        const hr = safeParseDate(d.date).getHours();
                        hourCounts[hr]++;
                    } catch(e){}
                }
            }
        }
    });
    let peakHour = -1;
    let maxHourCount = 0;
    for (let h=0; h<24; h++) {
        if (hourCounts[h] > maxHourCount) {
            maxHourCount = hourCounts[h];
            peakHour = h;
        }
    }
    if (peakHour !== -1 && maxHourCount > 0) {
        const hourStr = peakHour === 0 ? '12 AM' : peakHour === 12 ? '12 PM' : peakHour > 12 ? `${peakHour - 12} PM` : `${peakHour} AM`;
        insights += `<div style="margin-bottom:12px; display:flex; align-items:start; gap:8px;">
            <span style="font-size:1.1rem; line-height:1;">🕒</span>
            <div>
                <strong>Staffing & Peak Load:</strong> Out of ${missedCount} missed calls, the peak hour for missed calls is <strong>${hourStr}</strong> (with <strong>${maxHourCount}</strong> missed calls). Staffing up agent availability or setting automated callbacks during this window will significantly reduce call abandonment.
            </div>
        </div>`;
    }

    // 5. Senior Manager Strategic Recommendation
    insights += `<div style="border-top: 1px dashed var(--border-color); padding-top: 10px; margin-top: 15px; display:flex; align-items:start; gap:8px;">
        <span style="font-size:1.1rem; line-height:1;">👔</span>
        <div style="font-style: italic; color: var(--text-secondary);">
            <strong>Strategic Business Recommendation:</strong> Focus operations on resolving the repeat loops first. Each loop indicates a process bottleneck. Eliminating these loops will free up approximately <strong>${data.length ? Math.round(dynamicLoops.reduce((s,l)=>s+l.repeat_count, 0) / data.length * 100) : 0}%</strong> of support capacity, allowing relationship managers to focus on high-value client acquisitions.
        </div>
    </div>`;

    return insights;
}

function renderIntelligenceDashboard() {
    destroyChartGroup(intelCharts);
    const data = window.viewModel.interactions;
    const calls = window.viewModel.calls;

    // Dynamically calculate repeat loops & outliers
    const dynamicLoops = getDynamicRepeatLoops(data);
    const dynamicOutliers = getDynamicOutliers(data);

    // Populate smart AI insights panel
    const smartInsightsDiv = document.getElementById('intel-smart-insights');
    if (smartInsightsDiv) {
        smartInsightsDiv.innerHTML = generateSmartInsights(data, calls);
    }

    // Repeat Loops list
    const loopsDiv = document.getElementById('intel-repeat-loops');
    if (loopsDiv) {
        const filteredLoops = dynamicLoops.filter(l => l.repeat_count >= 2).slice(0, 15);
        loopsDiv.innerHTML = filteredLoops.length ? `<table class="dashboard-table" style="font-size:0.82rem;"><thead><tr><th>RM</th><th>Broker</th><th>Branch</th><th>Issue</th><th style="text-align:right">Repeats</th></tr></thead><tbody>${filteredLoops.map(l => `<tr><td>${l.rm_name}</td><td>${l.broker_family}</td><td>${l.branch}</td><td>${l.issue}</td><td style="text-align:right"><span class="freq-badge high">${l.repeat_count}</span></td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--text-muted);text-align:center;padding:20px;">No repeat loops detected in this period.</p>';
    }

    // Outlier Detection list
    const outliersDiv = document.getElementById('intel-outliers');
    if (outliersDiv) {
        const outliers = dynamicOutliers.filter(o => o.is_outlier).slice(0, 15);
        outliersDiv.innerHTML = outliers.length ? `<table class="dashboard-table" style="font-size:0.82rem;"><thead><tr><th>RM</th><th>Broker</th><th>Branch</th><th style="text-align:right">Contacts</th><th style="text-align:right">Per Day</th></tr></thead><tbody>${outliers.map(o => `<tr><td>${o.rm_name}</td><td>${o.broker_family}</td><td>${o.branch}</td><td style="text-align:right">${o.contacts}</td><td style="text-align:right"><span class="freq-badge high">${o.contacts_per_day.toFixed(1)}</span></td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--text-muted);text-align:center;padding:20px;">No outliers detected.</p>';
    }

    // Broker Health Scores
    const healthDiv = document.getElementById('intel-broker-health');
    if (healthDiv) {
        const brokerMap = {};
        data.forEach(d => {
            const b = d.broker_family; if (!b || b === 'NA') return;
            if (!brokerMap[b]) brokerMap[b] = { total: 0, repeats: 0, issues: new Set(), sentiment_neg: 0 };
            brokerMap[b].total++;
            if (d.issue) brokerMap[b].issues.add(d.issue);
            if ((d.sentiment||'').toLowerCase() === 'negative') brokerMap[b].sentiment_neg++;
        });
        dynamicLoops.forEach(l => { if (brokerMap[l.broker_family]) brokerMap[l.broker_family].repeats += l.repeat_count; });
        const brokerScores = Object.entries(brokerMap).map(([name, d]) => {
            const repeatPenalty = Math.min(30, d.repeats * 3);
            const diversityPenalty = Math.min(20, d.issues.size * 2);
            const volumeScore = Math.min(25, Math.round(d.total / 5));
            const score = Math.max(0, 100 - repeatPenalty - diversityPenalty - volumeScore);
            const grade = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'moderate' : 'poor';
            return { name, total: d.total, repeats: d.repeats, score, grade };
        }).sort((a,b) => b.score - a.score);
        healthDiv.innerHTML = brokerScores.length ? `<table class="dashboard-table" style="font-size:0.82rem;"><thead><tr><th>Broker</th><th style="text-align:right">Volume</th><th style="text-align:right">Repeats</th><th style="text-align:right">Health Score</th></tr></thead><tbody>${brokerScores.map(b => `<tr class="clickable-row" data-broker="${b.name}" style="cursor:pointer;"><td>${b.name}</td><td style="text-align:right">${b.total}</td><td style="text-align:right">${b.repeats}</td><td style="text-align:right"><span class="health-score-badge ${b.grade}">${b.score}/100</span></td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--text-muted);text-align:center;padding:20px;">No broker data available.</p>';

        healthDiv.querySelectorAll('.clickable-row').forEach(row => {
            row.addEventListener('click', () => {
                const bName = row.getAttribute('data-broker');
                openBrokerHealthDiagnosticsModal(bName);
            });
        });
    }

    // Time-of-Day Heatmap
    const heatmapDiv = document.getElementById('intel-time-heatmap');
    if (heatmapDiv) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const hourGrid = Array.from({length: 7}, () => Array(24).fill(0));
        let maxVal = 0;
        data.forEach(d => {
            if (!d.date) return;
            const dt = safeParseDate(d.date);
            if (dt) { 
                const dayIdx = dt.getDay();
                const hourIdx = dt.getHours();
                hourGrid[dayIdx][hourIdx]++; 
                maxVal = Math.max(maxVal, hourGrid[dayIdx][hourIdx]); 
            }
        });

        const getHourLabel = (h) => {
            if (h === 0) return '12a';
            if (h === 12) return '12p';
            return h < 12 ? `${h}a` : `${h - 12}p`;
        };

        let html = `
            <div style="font-family: 'Outfit', sans-serif; color: var(--text-primary);">
                <!-- Header row with hour labels -->
                <div style="display: flex; align-items: center; margin-bottom: 8px; border-bottom: 1px solid var(--border); padding-bottom: 4px;">
                    <span style="width: 45px; flex-shrink: 0; font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Day</span>
                    <div style="display: flex; gap: 3px; flex: 1;">
        `;
        for (let h = 0; h < 24; h++) {
            html += `<span style="flex: 1; text-align: center; font-size: 0.65rem; color: var(--text-muted); font-weight: 600;">${getHourLabel(h)}</span>`;
        }
        html += `
                    </div>
                </div>
                <!-- Heatmap grid rows -->
                <div style="display: flex; flex-direction: column; gap: 4px;">
        `;

        dayNames.forEach((dayName, dayIdx) => {
            html += `
                <div style="display: flex; align-items: center;">
                    <span style="width: 45px; flex-shrink: 0; font-size: 0.78rem; color: var(--text-secondary); font-weight: 700;">${dayName}</span>
                    <div style="display: flex; gap: 3px; flex: 1;">
            `;
            for (let h = 0; h < 24; h++) {
                const val = hourGrid[dayIdx][h];
                const pct = maxVal ? (val / maxVal) : 0;
                
                let bg, shadow;
                if (val === 0) {
                    bg = 'rgba(255, 255, 255, 0.02)';
                    shadow = 'none';
                } else {
                    bg = `rgba(139, 92, 246, ${Math.max(0.12, pct * 0.95).toFixed(2)})`;
                    shadow = pct > 0.7 ? '0 0 8px rgba(139, 92, 246, 0.4)' : 'none';
                }

                html += `
                    <div class="heatmap-cell" 
                         style="background: ${bg}; box-shadow: ${shadow}; flex: 1; aspect-ratio: 1; border-radius: 4px; border: 1px solid rgba(255,255,255,0.03); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); min-width: 10px;"
                         title="${dayName} ${getHourLabel(h)} - ${val} contact${val === 1 ? '' : 's'}"
                         onmouseover="this.style.transform='scale(1.35)'; this.style.zIndex='10'; this.style.boxShadow='0 4px 12px rgba(139,92,246,0.6)';"
                         onmouseout="this.style.transform='scale(1)'; this.style.zIndex='1'; this.style.boxShadow='${shadow}';">
                    </div>
                `;
            }
            html += `
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <!-- Legend and explanation -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 0.72rem; color: var(--text-secondary);">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span>Less</span>
                        <div style="display: flex; gap: 3px;">
                            <div style="width: 10px; height: 10px; border-radius: 2px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255,255,255,0.03);"></div>
                            <div style="width: 10px; height: 10px; border-radius: 2px; background: rgba(139, 92, 246, 0.25);"></div>
                            <div style="width: 10px; height: 10px; border-radius: 2px; background: rgba(139, 92, 246, 0.5);"></div>
                            <div style="width: 10px; height: 10px; border-radius: 2px; background: rgba(139, 92, 246, 0.75);"></div>
                            <div style="width: 10px; height: 10px; border-radius: 2px; background: rgba(139, 92, 246, 1.0); box-shadow: 0 0 6px rgba(139,92,246,0.4);"></div>
                        </div>
                        <span>More</span>
                    </div>
                    <span style="font-weight: 500; font-size: 0.7rem; color: var(--text-muted);">Hover cells to view exact count</span>
                </div>
            </div>
        `;
        heatmapDiv.innerHTML = html;
    }

    // Sankey Flow
    const sankeyCanvas = document.getElementById('intel-sankey-canvas');
    if (sankeyCanvas && typeof renderSankeyFlowCanvas === 'function') {
        renderSankeyFlowCanvas(data);
    }

    // Render Predictive Capacity Planner
    renderPredictiveCapacityPlanner();

    // Render Sentiment & CSAT Analyzer Panel
    renderSentimentCSATPanel();

    // Render Capacity Simulator Sandbox
    renderCapacitySimulator();

    // Render Issue Trending Chart
    renderIssueTrendingChart();
}

function renderIssueTrendingChart() {
    const data = window.viewModel.interactions;
    const canvas = document.getElementById('intel-issue-trend-chart');
    if (!canvas) return;

    if (intelCharts.issueTrend) {
        intelCharts.issueTrend.destroy();
        intelCharts.issueTrend = null;
    }

    const issueCounts = {};
    data.forEach(item => {
        const issue = item.issue || "General";
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });
    const topIssues = Object.entries(issueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

    const fromD = safeParseDate(activeFilters.dateFrom);
    if (fromD) fromD.setHours(0, 0, 0, 0);
    const toD = safeParseDate(activeFilters.dateTo);
    if (toD) toD.setHours(23, 59, 59, 999);
    const datesArray = [];
    let currDate = new Date(fromD.getTime());
    while (currDate <= toD) {
        datesArray.push(currDate.toISOString().split('T')[0]);
        currDate.setDate(currDate.getDate() + 1);
    }

    const trends = {};
    topIssues.forEach(issue => {
        trends[issue] = {};
        datesArray.forEach(d => { trends[issue][d] = 0; });
    });

    data.forEach(item => {
        if (!item.date) return;
        const d = item.date.substring(0, 10);
        const issue = item.issue || "General";
        if (trends[issue] && trends[issue][d] !== undefined) {
            trends[issue][d]++;
        }
    });

    const colors = [THEME_COLORS.purple, THEME_COLORS.blue, THEME_COLORS.orange];
    const datasets = topIssues.map((issue, idx) => {
        return {
            label: issue,
            data: datesArray.map(d => trends[issue][d]),
            borderColor: colors[idx % colors.length],
            backgroundColor: 'transparent',
            tension: 0.35,
            borderWidth: 2
        };
    });

    const formatDateLabel = (dStr) => {
        try {
            const [year, month, day] = dStr.split('-');
            const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        } catch (e) { return dStr; }
    };
    const formattedLabels = datesArray.map(formatDateLabel);

    const ctx = canvas.getContext('2d');
    intelCharts.issueTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: THEME_COLORS.textSecondary,
                        font: { family: 'SF Pro Text', size: 10 }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: THEME_COLORS.border },
                    ticks: { color: THEME_COLORS.textSecondary, font: { family: 'SF Pro Text', size: 8 } }
                },
                y: {
                    grid: { color: THEME_COLORS.border },
                    ticks: { color: THEME_COLORS.textSecondary, font: { family: 'SF Pro Text', size: 9 }, stepSize: 1 }
                }
            }
        }
    });
}

// ----- MONTHLY VIEW -----

function renderMonthlyView() {
    if (!rawData) return;
    let allInteractions = rawData.support_interactions;
    let allCalls = rawData.calls;

    // Apply sidebar filters (excluding date since Monthly View is month-specific)
    if (activeFilters.broker !== 'all') {
        allInteractions = allInteractions.filter(d => d.broker_family === activeFilters.broker);
        allCalls = allCalls.filter(c => c.broker_family === activeFilters.broker);
    }
    if (activeFilters.poc !== 'all') {
        allInteractions = allInteractions.filter(d => d.poc === activeFilters.poc);
        allCalls = allCalls.filter(c => c.poc === activeFilters.poc);
    }
    if (activeFilters.agent !== 'all') {
        allInteractions = allInteractions.filter(d => d.agent === activeFilters.agent);
        allCalls = allCalls.filter(c => c.agent === activeFilters.agent);
    }
    if (activeFilters.branch && activeFilters.branch !== 'all') {
        allInteractions = allInteractions.filter(d => d.branch === activeFilters.branch);
        allCalls = allCalls.filter(c => c.branch === activeFilters.branch);
    }

    // Populate month/year selectors
    const monthSelect = document.getElementById('monthly-month-select');
    const yearSelect = document.getElementById('monthly-year-select');
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    // Find available years/months
    const availableYears = new Set();
    allInteractions.forEach(d => {
        if (d.date) {
            const parsed = safeParseDate(d.date);
            if (parsed) availableYears.add(parsed.getFullYear());
        }
    });
    allCalls.forEach(c => {
        if (c.date) {
            const parsed = safeParseDate(c.date);
            if (parsed) availableYears.add(parsed.getFullYear());
        }
    });
    const yearsArr = [...availableYears].sort();

    if (yearSelect && !yearSelect._populated) {
        yearSelect._populated = true;
        yearSelect.innerHTML = yearsArr.map(y => `<option value="${y}">${y}</option>`).join('');
        yearSelect.value = yearsArr[yearsArr.length - 1] || new Date().getFullYear();
        yearSelect.addEventListener('change', () => renderMonthlyView());
    }
    if (monthSelect && !monthSelect._populated) {
        monthSelect._populated = true;
        monthSelect.innerHTML = monthNames.map((m, i) => `<option value="${i}">${m}</option>`).join('');
        monthSelect.value = new Date().getMonth();
        monthSelect.addEventListener('change', () => renderMonthlyView());
    }

    const selectedYear = parseInt(yearSelect.value);
    const selectedMonth = parseInt(monthSelect.value);
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    // Local timing format helpers
    const formatDuration = (sec) => {
        return formatSeconds(sec);
    };

    const formatSecondsUnit = (sec) => {
        if (!sec || isNaN(sec)) return "0s";
        if (sec < 60) return `${Math.round(sec)}s`;
        return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
    };

    const formatMinutesVal = (sec) => {
        if (!sec || isNaN(sec)) return "-";
        if (sec < 60) return `${Math.round(sec)}s`;
        if (sec < 3600) return `${Math.round(sec / 60)} min`;
        return `${(sec / 3600).toFixed(1)}h`;
    };

    // Build date-wise data
    const rows = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const dayInteractions = allInteractions.filter(d => {
            if (!d.date) return false;
            const parsed = safeParseDate(d.date);
            return parsed && parsed.getFullYear() === selectedYear && parsed.getMonth() === selectedMonth && parsed.getDate() === day;
        });
        const dayCalls = allCalls.filter(c => {
            if (!c.date) return false;
            const parsed = safeParseDate(c.date);
            return parsed && parsed.getFullYear() === selectedYear && parsed.getMonth() === selectedMonth && parsed.getDate() === day;
        });

        // Case-insensitive call_type matching
        const inboundCalls = dayCalls.filter(c => (c.call_type || '').toLowerCase() === 'inbound' || (!c.call_type));
        const progressiveCalls = dayCalls.filter(c => (c.call_type || '').toLowerCase().includes('progressive') || (c.call_type || '').toLowerCase().includes('callback'));

        // Total Calls
        const totalCallsCount = dayCalls.length;
        const callsConnected = dayCalls.filter(c => (c.stage || '').toLowerCase() === 'answered' || (c.stage || '').toLowerCase() === 'connected').length;

        const inboundConnected = inboundCalls.filter(c => (c.stage || '').toLowerCase() === 'answered' || (c.stage || '').toLowerCase() === 'connected');
        const inboundUnanswered = inboundCalls.filter(c => (c.stage || '').toLowerCase() === 'unanswered' || (c.stage || '').toLowerCase() === 'missed' || (c.stage || '').toLowerCase() === 'abandoned');
        const progressiveAnswered = progressiveCalls.filter(c => (c.stage || '').toLowerCase() === 'answered' || (c.stage || '').toLowerCase() === 'connected');

        const inboundAoh = inboundCalls.filter(c => (c.sub_issue || '').toLowerCase() === 'aoh');
        const inboundAbandonedReal = inboundUnanswered.filter(c => (c.sub_issue || '').toLowerCase() !== 'aoh');
        const callsAbandoned = inboundAbandonedReal.length;

        // Inbound
        const inboundCount = inboundCalls.length;
        const inboundAohCount = inboundAoh.length;
        const inboundAbandonedCount = inboundAbandonedReal.length;
        const uniqueAbandonedSet = new Set(inboundAbandonedReal.map(c => c.caller_no));
        const uniqueAbandonedCount = uniqueAbandonedSet.size;

        let inboundAbandonedAgent = 0;
        let inboundAbandonedUser = 0;
        let inboundAbandonedOther = 0;

        inboundAbandonedReal.forEach(c => {
            const ads = (c.agent_dial_status || '').toLowerCase();
            const ds = (c.dial_status || '').toLowerCase();
            const ev = (c.call_event || '').toLowerCase();
            if (ads === 'noanswer' || ads === 'normalcallclearing' || ads.includes('exceeded')) {
                inboundAbandonedAgent++;
            } else if (ads === 'user_disconnected' || ds === 'user_disconnected' || ev === 'queue') {
                inboundAbandonedUser++;
            } else {
                inboundAbandonedOther++;
            }
        });

        const inboundAbandonedPct = inboundCount > 0 ? (inboundAbandonedCount / inboundCount * 100).toFixed(1) : '0.0';

        // AHT / Timing
        // AHT = talk time (actual handling time, not total call duration which includes ring time)
        const inboundAnsDurations = inboundConnected.map(c => Number(c.talk_time) || 0);
        const inboundTalkTimes = inboundConnected.map(c => Number(c.talk_time) || 0);
        const inboundHoldTimes = inboundConnected.map(c => Number(c.hold_time) || 0);
        const inboundQueueAns = inboundConnected.map(c => Number(c.queue_time) || 0);
        const inboundQueueUnans = inboundAbandonedReal.map(c => Number(c.queue_time) || 0);

        const getAverageVal = arr => arr.length ? arr.reduce((a,b)=>a+b,0) / arr.length : 0;
        const getMedianVal = arr => {
            if (!arr.length) return 0;
            const sorted = [...arr].sort((a,b)=>a-b);
            const mid = Math.floor(sorted.length/2);
            return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid-1] + sorted[mid]) / 2;
        };
        const getPercentile90Val = arr => {
            if (!arr.length) return 0;
            const sorted = [...arr].sort((a,b)=>a-b);
            const idx = Math.floor(sorted.length * 0.9);
            return sorted[Math.min(idx, sorted.length - 1)];
        };

        const avgAht = getAverageVal(inboundAnsDurations);
        const medianAht = getMedianVal(inboundAnsDurations);
        const p90Aht = getPercentile90Val(inboundAnsDurations);
        const avgTalk = getAverageVal(inboundTalkTimes);
        const avgHold = getAverageVal(inboundHoldTimes);
        const avgQueueAns = getAverageVal(inboundQueueAns);
        const avgQueueUnans = getAverageVal(inboundQueueUnans);

        // Progressive
        const progAttempted = progressiveCalls.length;
        const progAnsweredCount = progressiveAnswered.length;
        const progUnanswered = progressiveCalls.filter(c => (c.stage || '').toLowerCase() !== 'answered' && (c.stage || '').toLowerCase() !== 'connected');
        
        let progUnansAgent = 0;
        let progUnansUser = 0;
        let progUnansOther = 0;

        progUnanswered.forEach(c => {
            const ads = (c.agent_dial_status || '').toLowerCase();
            const ds = (c.dial_status || '').toLowerCase();
            const ev = (c.call_event || '').toLowerCase();
            if (ads === 'noanswer' || ads === 'normalcallclearing' || ads.includes('exceeded')) {
                progUnansAgent++;
            } else if (ads === 'user_disconnected' || ds === 'user_disconnected' || ev === 'queue') {
                progUnansUser++;
            } else {
                progUnansOther++;
            }
        });

        const progAnsDurations = progressiveAnswered.map(c => Number(c.duration) || 0);
        const progAvgAht = getAverageVal(progAnsDurations);

        // WhatsApp
        const waChats = dayInteractions.filter(d => d.type === 'WhatsApp Chat');
        const waCount = waChats.length;
        const waFrtItems = waChats.filter(d => d.sla_frt && !isNaN(d.sla_frt));
        const waAvgFrt = waFrtItems.length ? waFrtItems.reduce((s,d) => s + d.sla_frt, 0) / waFrtItems.length : 0;
        const waResItems = waChats.filter(d => d.sla_rt && !isNaN(d.sla_rt));
        const waAvgRes = waResItems.length ? waResItems.reduce((s,d) => s + d.sla_rt, 0) / waResItems.length : 0;

        // Care Emails
        const emailTickets = dayInteractions.filter(d => d.type === 'Care Email');
        const emailCount = emailTickets.length;
        const emailFrtItems = emailTickets.filter(d => d.sla_frt && !isNaN(d.sla_frt));
        const emailAvgFrt = emailFrtItems.length ? emailFrtItems.reduce((s,d) => s + d.sla_frt, 0) / emailFrtItems.length : 0;

        rows.push({
            dateStr,
            day,
            calls: totalCallsCount,
            connected: callsConnected,
            abandoned: callsAbandoned,
            inbound: inboundCount,
            inbound_aoh: inboundAohCount,
            inbound_abandoned: inboundAbandonedCount,
            inbound_unique_abandoned: uniqueAbandonedCount,
            inbound_abandoned_agent: inboundAbandonedAgent,
            inbound_abandoned_user: inboundAbandonedUser,
            inbound_abandoned_other: inboundAbandonedOther,
            inbound_abandoned_pct: parseFloat(inboundAbandonedPct),
            avg_aht: avgAht,
            median_aht: medianAht,
            p90_aht: p90Aht,
            avg_talk: avgTalk,
            avg_hold: avgHold,
            avg_queue_ans: avgQueueAns,
            avg_queue_unans: avgQueueUnans,
            prog_attempted: progAttempted,
            prog_answered: progAnsweredCount,
            prog_unans_agent: progUnansAgent,
            prog_unans_user: progUnansUser,
            prog_unans_other: progUnansOther,
            prog_avg_aht: progAvgAht,
            wa_chats: waCount,
            wa_frt: waAvgFrt,
            wa_res: waAvgRes,
            email_tickets: emailCount,
            email_frt: emailAvgFrt
        });
    }

    // Build monthly aggregates
    const monthKey = `${selectedYear}-${String(selectedMonth+1).padStart(2,'0')}`;
    const monthCalls = allCalls.filter(c => {
        if (!c.date) return false;
        const parsed = safeParseDate(c.date);
        return parsed && parsed.getFullYear() === selectedYear && parsed.getMonth() === selectedMonth;
    });
    const monthInteractions = allInteractions.filter(i => {
        if (!i.date) return false;
        const parsed = safeParseDate(i.date);
        return parsed && parsed.getFullYear() === selectedYear && parsed.getMonth() === selectedMonth;
    });
    
    // Inbound month aggregates
    // Case-insensitive call_type matching for monthly aggregates
    const mInbound = monthCalls.filter(c => (c.call_type || '').toLowerCase() === 'inbound' || (!c.call_type));
    const mInboundConnected = mInbound.filter(c => (c.stage || '').toLowerCase() === 'answered' || (c.stage || '').toLowerCase() === 'connected');
    const mInboundUnanswered = mInbound.filter(c => (c.stage || '').toLowerCase() === 'unanswered' || (c.stage || '').toLowerCase() === 'missed' || (c.stage || '').toLowerCase() === 'abandoned');
    const mInboundAoh = mInbound.filter(c => (c.sub_issue || '').toLowerCase() === 'aoh');
    const mInboundAbandonedReal = mInboundUnanswered.filter(c => (c.sub_issue || '').toLowerCase() !== 'aoh');

    // Progressive month aggregates
    const mProg = monthCalls.filter(c => (c.call_type || '').toLowerCase().includes('progressive') || (c.call_type || '').toLowerCase().includes('callback'));
    const mProgAnswered = mProg.filter(c => (c.stage || '').toLowerCase() === 'answered' || (c.stage || '').toLowerCase() === 'connected');

    // WhatsApp / Emails month aggregates
    const mWa = monthInteractions.filter(d => d.type === 'WhatsApp Chat');
    const mEmail = monthInteractions.filter(d => d.type === 'Care Email');

    const monthAggregates = {
        calls: monthCalls.length,
        connected: monthCalls.filter(c => (c.stage || '').toLowerCase() === 'answered' || (c.stage || '').toLowerCase() === 'connected').length,
        abandoned: mInboundAbandonedReal.length,
        inbound: mInbound.length,
        inbound_aoh: mInboundAoh.length,
        inbound_abandoned: mInboundAbandonedReal.length,
        inbound_unique_abandoned: new Set(mInboundAbandonedReal.map(c => c.caller_no)).size,
        inbound_abandoned_agent: mInboundAbandonedReal.filter(c => {
            const ads = (c.agent_dial_status || '').toLowerCase();
            return ads === 'noanswer' || ads === 'normalcallclearing' || ads.includes('exceeded');
        }).length,
        inbound_abandoned_user: mInboundAbandonedReal.filter(c => {
            const ads = (c.agent_dial_status || '').toLowerCase();
            const ds = (c.dial_status || '').toLowerCase();
            const ev = (c.call_event || '').toLowerCase();
            return ads === 'user_disconnected' || ds === 'user_disconnected' || ev === 'queue';
        }).length,
        inbound_abandoned_other: mInboundAbandonedReal.filter(c => {
            const ads = (c.agent_dial_status || '').toLowerCase();
            const ds = (c.dial_status || '').toLowerCase();
            const ev = (c.call_event || '').toLowerCase();
            const isAgent = ads === 'noanswer' || ads === 'normalcallclearing' || ads.includes('exceeded');
            const isUser = ads === 'user_disconnected' || ds === 'user_disconnected' || ev === 'queue';
            return !isAgent && !isUser;
        }).length,
        inbound_abandoned_pct: mInbound.length ? (mInboundAbandonedReal.length / mInbound.length * 100).toFixed(1) + '%' : '0.0%',
        // AHT uses talk_time only
        avg_aht: mInboundConnected.length ? Math.round(mInboundConnected.reduce((s,c)=>s+(Number(c.talk_time)||0),0)/mInboundConnected.length) : 0,
        median_aht: (() => {
            const durs = mInboundConnected.map(c => Number(c.talk_time)||0);
            if(!durs.length) return 0;
            durs.sort((a,b)=>a-b);
            const mid = Math.floor(durs.length/2);
            return durs.length % 2 !== 0 ? durs[mid] : (durs[mid-1] + durs[mid]) / 2;
        })(),
        p90_aht: (() => {
            const durs = mInboundConnected.map(c => Number(c.talk_time)||0);
            if(!durs.length) return 0;
            durs.sort((a,b)=>a-b);
            const idx = Math.floor(durs.length * 0.9);
            return durs[Math.min(idx, durs.length-1)];
        })(),
        avg_talk: mInboundConnected.length ? Math.round(mInboundConnected.reduce((s,c)=>s+(Number(c.talk_time)||0),0)/mInboundConnected.length) : 0,
        avg_hold: mInboundConnected.length ? Math.round(mInboundConnected.reduce((s,c)=>s+(Number(c.hold_time)||0),0)/mInboundConnected.length) : 0,
        avg_queue_ans: mInboundConnected.length ? Math.round(mInboundConnected.reduce((s,c)=>s+(Number(c.queue_time)||0),0)/mInboundConnected.length) : 0,
        avg_queue_unans: mInboundAbandonedReal.length ? Math.round(mInboundAbandonedReal.reduce((s,c)=>s+(Number(c.queue_time)||0),0)/mInboundAbandonedReal.length) : 0,
        prog_attempted: mProg.length,
        prog_answered: mProgAnswered.length,
        prog_unans_agent: mProg.filter(c => (c.stage || '').toLowerCase() !== 'answered' && (c.stage || '').toLowerCase() !== 'connected').filter(c => {
            const ads = (c.agent_dial_status || '').toLowerCase();
            return ads === 'noanswer' || ads === 'normalcallclearing' || ads.includes('exceeded');
        }).length,
        prog_unans_user: mProg.filter(c => (c.stage || '').toLowerCase() !== 'answered' && (c.stage || '').toLowerCase() !== 'connected').filter(c => {
            const ads = (c.agent_dial_status || '').toLowerCase();
            const ds = (c.dial_status || '').toLowerCase();
            const ev = (c.call_event || '').toLowerCase();
            return ads === 'user_disconnected' || ds === 'user_disconnected' || ev === 'queue';
        }).length,
        prog_unans_other: mProg.filter(c => (c.stage || '').toLowerCase() !== 'answered' && (c.stage || '').toLowerCase() !== 'connected').filter(c => {
            const ads = (c.agent_dial_status || '').toLowerCase();
            const ds = (c.dial_status || '').toLowerCase();
            const ev = (c.call_event || '').toLowerCase();
            const isAgent = ads === 'noanswer' || ads === 'normalcallclearing' || ads.includes('exceeded');
            const isUser = ads === 'user_disconnected' || ds === 'user_disconnected' || ev === 'queue';
            return !isAgent && !isUser;
        }).length,
        prog_avg_aht: mProgAnswered.length ? Math.round(mProgAnswered.reduce((s,c)=>s+(Number(c.duration)||0),0)/mProgAnswered.length) : 0,
        wa_chats: mWa.length,
        wa_frt: (() => {
            const items = mWa.filter(d => d.sla_frt && !isNaN(d.sla_frt));
            return items.length ? Math.round(items.reduce((s,d)=>s+d.sla_frt,0)/items.length) : 0;
        })(),
        wa_res: (() => {
            const items = mWa.filter(d => d.sla_rt && !isNaN(d.sla_rt));
            return items.length ? Math.round(items.reduce((s,d)=>s+d.sla_rt,0)/items.length) : 0;
        })(),
        email_tickets: mEmail.length,
        email_frt: (() => {
            const items = mEmail.filter(d => d.sla_frt && !isNaN(d.sla_frt));
            return items.length ? Math.round(items.reduce((s,d)=>s+d.sla_frt,0)/items.length) : 0;
        })()
    };

    // 1. Build the Thead (headers): first cell "Metric / Date", then dates (1, 2, ..., N), last cell "Total / Avg"
    const thead = document.getElementById('monthly-table-head');
    let headerHtml = `<tr><th>Metric / Date</th>`;
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        headerHtml += `<th class="clickable-date-header" data-date="${dateStr}" style="cursor: pointer; text-decoration: underline;" title="Click to view deep dive for ${dateStr}">${day}</th>`;
    }
    headerHtml += `<th>Total / Avg</th></tr>`;
    thead.innerHTML = headerHtml;

    // 2. Build the Tbody (rows representing metrics)
    const metricRows = [
        { label: 'TOTAL CALLS', isHeader: true },
        { label: 'Inbound + Progressive', key: 'calls', isTime: false, aggregateType: 'val' },
        { label: 'Calls Connected', key: 'connected', isTime: false, aggregateType: 'val', cls: 'text-green' },
        { label: 'Calls Abandoned', key: 'abandoned', isTime: false, aggregateType: 'val', cls: 'text-red' },
        
        { label: 'INBOUND', isHeader: true },
        { label: 'Inbound Calls', key: 'inbound', isTime: false, aggregateType: 'val' },
        { label: 'AOH Calls', key: 'inbound_aoh', isTime: false, aggregateType: 'val' },
        { label: 'Abandoned', key: 'inbound_abandoned', isTime: false, aggregateType: 'val' },
        { label: 'Unique Abandoned', key: 'inbound_unique_abandoned', isTime: false, aggregateType: 'val' },
        { label: 'Abandoned by Agent', key: 'inbound_abandoned_agent', isTime: false, aggregateType: 'val' },
        { label: 'Abandoned by User', key: 'inbound_abandoned_user', isTime: false, aggregateType: 'val' },
        { label: 'Abandoned by Other', key: 'inbound_abandoned_other', isTime: false, aggregateType: 'val' },
        { label: 'Abandoned %', key: 'inbound_abandoned_pct', isPercent: true, aggregateType: 'pct' },
        
        { label: 'AHT / TIMING', isHeader: true },
        { label: 'Avg Handling Time (AHT)', key: 'avg_aht', isTime: true, aggregateType: 'time' },
        { label: 'Median AHT', key: 'median_aht', isTime: true, aggregateType: 'time' },
        { label: '90th Percentile AHT', key: 'p90_aht', isTime: true, aggregateType: 'time' },
        { label: 'Avg Talk Time', key: 'avg_talk', isTime: true, aggregateType: 'time' },
        { label: 'Avg Hold Time', key: 'avg_hold', isTime: true, aggregateType: 'time' },
        { label: 'Avg Queue Time (Answered)', key: 'avg_queue_ans', isTime: true, aggregateType: 'time' },
        { label: 'Avg Queue Time (Unanswered)', key: 'avg_queue_unans', isTime: true, aggregateType: 'time' },
        
        { label: 'PROGRESSIVE', isHeader: true },
        { label: 'Progressive Attempted', key: 'prog_attempted', isTime: false, aggregateType: 'val' },
        { label: 'PG Answered', key: 'prog_answered', isTime: false, aggregateType: 'val' },
        { label: 'PG Unanswered (Agent)', key: 'prog_unans_agent', isTime: false, aggregateType: 'val' },
        { label: 'PG Unanswered (User)', key: 'prog_unans_user', isTime: false, aggregateType: 'val' },
        { label: 'PG Unanswered (Other)', key: 'prog_unans_other', isTime: false, aggregateType: 'val' },
        { label: 'Progressive Avg AHT', key: 'prog_avg_aht', isTime: true, aggregateType: 'time' },
        
        { label: 'WHATSAPP', isHeader: true },
        { label: 'Total Chats', key: 'wa_chats', isTime: false, aggregateType: 'val' },
        { label: 'Avg FRT', key: 'wa_frt', isTime: false, isMinute: true, aggregateType: 'min' },
        { label: 'Avg Resolution', key: 'wa_res', isTime: false, isMinute: true, aggregateType: 'min' },
        
        { label: 'CARE EMAILS', isHeader: true },
        { label: 'Total Tickets', key: 'email_tickets', isTime: false, aggregateType: 'val' },
        { label: 'Avg FRT', key: 'email_frt', isTime: false, isMinute: true, aggregateType: 'min' }
    ];

    const tbody = document.getElementById('monthly-table-body');
    let bodyHtml = '';

    metricRows.forEach(metric => {
        if (metric.isHeader) {
            bodyHtml += `<tr style="background: var(--bg-card); font-weight: 800; color: var(--purple);">`;
            bodyHtml += `<td colspan="${daysInMonth + 2}" style="text-align: left; padding: 12px 16px; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px;">${metric.label}</td>`;
            bodyHtml += `</tr>`;
            return;
        }

        const isBoldStyle = metric.isBold ? 'font-weight: 800; color: var(--purple);' : '';
        const aggregateRowClass = metric.isBold ? 'class="aggregate-row"' : '';
        bodyHtml += `<tr ${aggregateRowClass} style="${isBoldStyle}">`;
        bodyHtml += `<td>${metric.label}</td>`;

        // Daily values
        rows.forEach(r => {
            let val = r[metric.key];
            if (metric.isTime) {
                // All time metrics rendered as hh:mm:ss for consistency
                bodyHtml += `<td>${formatDuration(val)}</td>`;
            } else if (metric.isMinute) {
                bodyHtml += `<td>${formatMinutesVal(val)}</td>`;
            } else if (metric.isPercent) {
                // val is a plain number (percentage), add % sign
                bodyHtml += `<td>${typeof val === 'string' ? val : val + '%'}</td>`;
            } else {
                bodyHtml += `<td>${val !== undefined && val !== null ? val.toLocaleString() : 0}</td>`;
            }
        });

        // Aggregate value (last column)
        let aggValHtml = '';
        const aggVal = monthAggregates[metric.key];
        if (metric.aggregateType === 'val') {
            aggValHtml = `${typeof aggVal === 'number' ? aggVal.toLocaleString() : (aggVal || 0)}`;
        } else if (metric.aggregateType === 'pct') {
            // aggVal already contains '%' from monthAggregates computation
            aggValHtml = `${aggVal}`;
        } else if (metric.aggregateType === 'time') {
            // All time aggregates as hh:mm:ss
            aggValHtml = `${formatDuration(aggVal)}`;
        } else if (metric.aggregateType === 'min') {
            aggValHtml = `${formatMinutesVal(aggVal)}`;
        }
        
        bodyHtml += `<td style="font-weight: 800; color: var(--purple);">${aggValHtml}</td>`;
        bodyHtml += `</tr>`;
    });
    tbody.innerHTML = bodyHtml;

    // Click handler for date headers
    thead.querySelectorAll('.clickable-date-header').forEach(header => {
        header.addEventListener('click', () => {
            const date = header.getAttribute('data-date');
            openMetricDeepDiveModal('all', `Interactions on ${date}`);
        });
    });

    // Export CSV
    const exportBtn = document.getElementById('monthly-export-btn');
    if (exportBtn && !exportBtn._bound) {
        exportBtn._bound = true;
        exportBtn.addEventListener('click', () => exportTableAsCSV('monthly-data-table', `monthly_${monthNames[selectedMonth]}_${selectedYear}.csv`));
    }
}

// ----- AGENT PERFORMANCE -----

function renderAgentPerformance() {
    const data = window.viewModel.interactions;
    const calls = window.viewModel.calls;
    destroyChartGroup(agentPerfCharts);

    // Populate agent selector
    const agentSelect = document.getElementById('agent-perf-select');
    const agents = new Set();
    data.forEach(d => { if (d.agent && d.agent !== '-' && d.agent !== 'Unknown') agents.add(d.agent); });
    const agentList = [...agents].sort();
    if (agentSelect && !agentSelect._populated) {
        agentSelect._populated = true;
        agentSelect.innerHTML = '<option value="all">All Agents (Comparison View)</option>' + agentList.map(a => `<option value="${a}">${a}</option>`).join('');
        agentSelect.addEventListener('change', () => { agentSelect._populated = false; renderAgentPerformance(); });
    }
    const selectedAgent = agentSelect ? agentSelect.value : 'all';

    // Compute per-agent metrics
    const agentMetrics = {};
    agentList.forEach(agent => {
        const agentData = data.filter(d => d.agent === agent);
        const agentCalls = agentData.filter(d => d.type === 'Call Ticket');
        const agentWA = agentData.filter(d => d.type === 'WhatsApp Chat');
        const agentEmails = agentData.filter(d => d.type === 'Care Email');

        // Talk time from calls
        const agentCallRecords = calls.filter(c => c.agent === agent && ((c.stage||'').toLowerCase() === 'answered' || (c.stage||'').toLowerCase() === 'connected'));
        const avgTalkTime = agentCallRecords.length ? Math.round(agentCallRecords.reduce((s,c) => s + (Number(c.talk_time)||0), 0) / agentCallRecords.length) : 0;

        // QA Score
        const qaItems = agentData.filter(d => d.qa_overall && !isNaN(d.qa_overall));
        let sumQA = 0;
        let countQA = 0;
        qaItems.forEach(d => {
            const v = Number(d.qa_overall);
            if (!isNaN(v)) {
                const pct = v > 45 ? v : (v / 45) * 100;
                sumQA += pct;
                countQA++;
            }
        });
        const avgQA = countQA > 0 ? Math.round(sumQA / countQA) : '-';

        // SLA
        const frtItems = agentData.filter(d => d.sla_frt_status);
        const frtMet = frtItems.length ? Math.round(frtItems.filter(d => d.sla_frt_status === 'met').length / frtItems.length * 100) : '-';
        const rtItems = agentData.filter(d => d.sla_rt_status);
        const rtMet = rtItems.length ? Math.round(rtItems.filter(d => d.sla_rt_status === 'met').length / rtItems.length * 100) : '-';

        // Breaks from window.viewModel.breaks dynamically
        const agentBreaks = (window.viewModel.breaks || []).filter(b => b.agent_name === agent);
        const breakTime = agentBreaks.reduce((s, b) => s + (b.duration_sec || 0), 0);

        // Calculate active days
        const activeDaysSet = new Set();
        agentBreaks.forEach(b => {
            if (b.date) {
                const d = b.date.substring(0, 10);
                if (d) activeDaysSet.add(d);
            }
        });
        calls.filter(c => c.agent === agent).forEach(c => {
            if (c.date) {
                const d = c.date.substring(0, 10);
                if (d) activeDaysSet.add(d);
            }
        });
        const activeDays = Math.max(1, activeDaysSet.size);
        const totalShiftTime = activeDays * 9 * 3600; // 9 hours in seconds
        const totalTalkTime = agentCallRecords.reduce((s, c) => s + (Number(c.talk_time) || 0), 0);
        const netWorkTime = totalShiftTime - breakTime;
        const occupancy = netWorkTime > 0 ? ((totalTalkTime / netWorkTime) * 100).toFixed(1) : '0.0';

        agentMetrics[agent] = { calls: agentCalls.length, wa: agentWA.length, emails: agentEmails.length, total: agentData.length, avgTalkTime, avgQA, frtMet, rtMet, breakTime, occupancy };
    });

    // KPI Scorecards (for selected agent or totals)
    const kpisDiv = document.getElementById('agent-perf-kpis');
    if (selectedAgent === 'all') {
        const totalCalls = Object.values(agentMetrics).reduce((s,m) => s + m.calls, 0);
        const totalWA = Object.values(agentMetrics).reduce((s,m) => s + m.wa, 0);
        const totalEmails = Object.values(agentMetrics).reduce((s,m) => s + m.emails, 0);
        kpisDiv.innerHTML = [
            { label: 'Active Agents', value: agentList.length },
            { label: 'Total Calls', value: totalCalls },
            { label: 'Total WhatsApp', value: totalWA },
            { label: 'Total Emails', value: totalEmails },
            { label: 'Total Interactions', value: totalCalls + totalWA + totalEmails }
        ].map(k => `<div class="agent-score-card"><div class="score-label">${k.label}</div><div class="score-value">${k.value}</div></div>`).join('');
    } else {
        const m = agentMetrics[selectedAgent] || {};
        kpisDiv.innerHTML = [
            { label: 'Call Tickets', value: m.calls || 0 },
            { label: 'WhatsApp Chats', value: m.wa || 0 },
            { label: 'Care Emails', value: m.emails || 0 },
            { label: 'Total', value: m.total || 0 },
            { label: 'Avg Talk Time', value: formatSecondsCompact(m.avgTalkTime) },
            { label: 'QA Score', value: m.avgQA !== '-' ? m.avgQA + '%' : '-' },
            { label: 'FRT Met', value: m.frtMet !== '-' ? m.frtMet + '%' : '-' },
            { label: 'RT Met', value: m.rtMet !== '-' ? m.rtMet + '%' : '-' },
            { label: 'Break Time', value: formatSecondsCompact(m.breakTime) },
            { label: 'Occupancy', value: m.occupancy !== '-' ? m.occupancy + '%' : '-', tooltip: 'Occupancy = (Talk Time / (Shift Time - Break Time)) * 100%, where Shift Time is 9 hours per active day.' }
        ].map(k => `<div class="agent-score-card" ${k.tooltip ? `title="${k.tooltip}" style="cursor: help;"` : ''}><div class="score-label">${k.label}</div><div class="score-value">${k.value}</div></div>`).join('');
    }

    // Comparison Table
    const compBody = document.getElementById('agent-comparison-body');
    compBody.innerHTML = agentList.map(agent => {
        const m = agentMetrics[agent];
        const isHighlight = agent === selectedAgent;
        return `<tr class="clickable-row ${isHighlight ? 'highlight' : ''}" data-agent="${agent}" style="cursor:pointer;">
            <td>${agent}</td><td>${m.calls}</td><td>${m.wa}</td><td>${m.emails}</td><td><strong>${m.total}</strong></td>
            <td>${formatSecondsCompact(m.avgTalkTime)}</td><td>${m.avgQA !== '-' ? m.avgQA + '%' : '-'}</td>
            <td>${m.frtMet !== '-' ? m.frtMet + '%' : '-'}</td><td>${m.rtMet !== '-' ? m.rtMet + '%' : '-'}</td>
            <td>${formatSecondsCompact(m.breakTime)}</td><td>${m.occupancy !== '-' ? m.occupancy + '%' : '-'}</td>
        </tr>`;
    }).join('');

    compBody.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', () => {
            const agentName = row.getAttribute('data-agent');
            if (agentSelect) {
                agentSelect.value = agentName;
                agentSelect._populated = false;
                renderAgentPerformance();
            }
        });
    });

    // Agent Activity Timeline
    const chartAgent = selectedAgent !== 'all' ? selectedAgent : null;
    const dateMap = {};
    const filteredData = chartAgent ? data.filter(d => d.agent === chartAgent) : data;
    filteredData.forEach(d => { const day = (d.date||'').substring(0,10); if(day) dateMap[day] = (dateMap[day]||0)+1; });
    const dates = Object.keys(dateMap).sort();
    const ctx = document.getElementById('agent-activity-chart');
    if (ctx) {
        agentPerfCharts.activity = new Chart(ctx.getContext('2d'), {
            type: 'bar', data: { labels: dates, datasets: [{ label: chartAgent ? `${chartAgent} — Daily Volume` : 'All Agents — Daily Volume', data: dates.map(d => dateMap[d]), backgroundColor: THEME_COLORS.purple + '70', borderRadius: 4 }] },
            options: { responsive: true, plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } }, scales: { x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted'), maxTicksLimit: 20 } }, y: { beginAtZero: true, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } } } }
        });
    }

    // Render new Agent Breaks Gantt Timeline
    renderAgentBreaksTimeline();

    // Render QA Coaching Breakdown
    renderAgentQACoaching(selectedAgent);
}

const STATUS_CONFIGS = {
    'all': [
        { label: 'All', value: 'all' },
        { label: 'New', value: 'new' },
        { label: 'Open', value: 'open' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' },
        { label: 'Snoozed', value: 'snoozed' },
        { label: 'Queued', value: 'queued' },
        { label: 'Work in progress', value: 'work_in_progress' },
        { label: 'Awaiting customer response', value: 'awaiting_customer_response' },
        { label: 'Awaiting partner response', value: 'awaiting_partner_response' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Needs Response', value: 'needs_response' },
        { label: 'Hold', value: 'hold' },
        { label: 'Waiting for user', value: 'waiting_for_user' },
        { label: 'Archived', value: 'archived' }
    ],
    'Call Ticket': [
        { label: 'All', value: 'all' },
        { label: 'Queued', value: 'queued' },
        { label: 'Work in progress', value: 'work_in_progress' },
        { label: 'Awaiting customer response', value: 'awaiting_customer_response' },
        { label: 'Awaiting partner response', value: 'awaiting_partner_response' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Cancelled', value: 'cancelled' }
    ],
    'WhatsApp Chat': [
        { label: 'All', value: 'all' },
        { label: 'New', value: 'new' },
        { label: 'Needs Response', value: 'needs_response' },
        { label: 'Hold', value: 'hold' },
        { label: 'Waiting for user', value: 'waiting_for_user' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Archived', value: 'archived' }
    ],
    'Care Email': [
        { label: 'All', value: 'all' },
        { label: 'New', value: 'new' },
        { label: 'Open', value: 'open' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' },
        { label: 'Snoozed', value: 'snoozed' }
    ]
};

const STATUS_COLORS = {
    'all': 'var(--purple)',
    'new': '#ec4899',
    'open': '#f97316',
    'in_progress': '#0284c7',
    'resolved': '#8b5cf6',
    'closed': '#22c55e',
    'snoozed': '#6b7280',
    'queued': '#3b82f6',
    'work_in_progress': '#0284c7',
    'awaiting_customer_response': '#f59e0b',
    'awaiting_partner_response': '#a855f7',
    'cancelled': '#ef4444',
    'needs_response': '#f43f5e',
    'hold': '#d97706',
    'waiting_for_user': '#06b6d4',
    'archived': '#94a3b8'
};

let ticketsState = { statusFilter: 'all', channelFilter: 'all', search: '', page: 1, perPage: 50, sortField: 'date', sortDir: -1 };

function renderTicketsChatsView() {
    if (!rawData) return;
    // Use ALL interactions (not filtered by date for browsing), but respect global date filter
    let allData = window.viewModel.interactions.slice();

    // Setup event listeners & build dynamic status pills
    const statusPillsContainer = document.getElementById('tickets-status-pills');
    if (statusPillsContainer) {
        const activeChan = ticketsState.channelFilter;
        const config = STATUS_CONFIGS[activeChan] || STATUS_CONFIGS['all'];
        
        // Ensure that the active status filter is still valid for this channel
        const isValid = config.some(opt => opt.value === ticketsState.statusFilter);
        if (!isValid) {
            ticketsState.statusFilter = 'all';
        }
        
        statusPillsContainer.innerHTML = config.map(opt => {
            const isActive = opt.value === ticketsState.statusFilter ? 'active' : '';
            return `<button class="status-pill ${isActive}" data-status="${opt.value}">${opt.label}</button>`;
        }).join('');
        
        // Bind event listeners to new pills
        statusPillsContainer.querySelectorAll('.status-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                statusPillsContainer.querySelectorAll('.status-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                ticketsState.statusFilter = pill.getAttribute('data-status');
                ticketsState.page = 1;
                renderTicketsChatsView();
            });
        });
    }

    const channelPills = document.getElementById('tickets-channel-pills');
    if (channelPills && !channelPills._bound) {
        channelPills._bound = true;
        channelPills.querySelectorAll('.status-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                channelPills.querySelectorAll('.status-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                ticketsState.channelFilter = pill.getAttribute('data-tchannel');
                ticketsState.page = 1;
                renderTicketsChatsView();
            });
        });
    }
    const searchInput = document.getElementById('tickets-search');
    if (searchInput && !searchInput._bound) {
        searchInput._bound = true;
        searchInput.addEventListener('input', () => { ticketsState.search = searchInput.value.toLowerCase(); ticketsState.page = 1; renderTicketsChatsView(); });
    }
    // Sort headers
    const table = document.getElementById('tickets-data-table');
    if (table && !table._bound) {
        table._bound = true;
        table.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.getAttribute('data-sort');
                if (ticketsState.sortField === field) ticketsState.sortDir *= -1;
                else { ticketsState.sortField = field; ticketsState.sortDir = 1; }
                ticketsState.page = 1;
                renderTicketsChatsView();
            });
        });
    }
    // Export
    const exportBtn = document.getElementById('tickets-export-btn');
    if (exportBtn && !exportBtn._bound) {
        exportBtn._bound = true;
        exportBtn.addEventListener('click', () => exportTableAsCSV('tickets-data-table', 'tickets_export.csv'));
    }

    // Apply channel filter
    let filtered = allData;
    if (ticketsState.channelFilter !== 'all') {
        filtered = filtered.filter(d => d.type === ticketsState.channelFilter);
    }

    // Apply stage/status filter
    if (ticketsState.statusFilter !== 'all') {
        filtered = filtered.filter(d => {
            const stage = (d.stage || '').toLowerCase().replace(/\s+/g, '_');
            return stage === ticketsState.statusFilter || stage.includes(ticketsState.statusFilter);
        });
    }

    // Apply search filter
    if (ticketsState.search) {
        const query = ticketsState.search.trim().toLowerCase();
        filtered = filtered.filter(d => {
            return (
                (d.id && String(d.id).toLowerCase().includes(query)) ||
                (d.rm_name && String(d.rm_name).toLowerCase().includes(query)) ||
                (d.broker_family && String(d.broker_family).toLowerCase().includes(query)) ||
                (d.branch && String(d.branch).toLowerCase().includes(query)) ||
                (d.issue && String(d.issue).toLowerCase().includes(query)) ||
                (d.agent && String(d.agent).toLowerCase().includes(query)) ||
                (d.stage && String(d.stage).toLowerCase().includes(query))
            );
        });
    }

    // Update sort indicators in headers
    if (table) {
        table.querySelectorAll('th[data-sort]').forEach(th => {
            const indicator = th.querySelector('.sort-indicator');
            if (indicator) {
                const field = th.getAttribute('data-sort');
                if (ticketsState.sortField === field) {
                    indicator.innerText = ticketsState.sortDir === 1 ? ' ▲' : ' ▼';
                } else {
                    indicator.innerText = '';
                }
            }
        });
    }

    // Sort data
    filtered.sort((a, b) => {
        let valA = a[ticketsState.sortField];
        let valB = b[ticketsState.sortField];
        
        // Handle dates
        if (ticketsState.sortField === 'date') {
            const timeA = valA ? new Date(valA).getTime() : 0;
            const timeB = valB ? new Date(valB).getTime() : 0;
            return (timeA - timeB) * ticketsState.sortDir;
        }

        // Standard string/number comparison
        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return -1 * ticketsState.sortDir;
        if (valA > valB) return 1 * ticketsState.sortDir;
        return 0;
    });

    // Populate stats bar based on the full active filter set (before stage filter to show options)
    let statsData = allData;
    if (ticketsState.channelFilter !== 'all') {
        statsData = statsData.filter(d => d.type === ticketsState.channelFilter);
    }
    const activeChan = ticketsState.channelFilter;
    const config = STATUS_CONFIGS[activeChan] || STATUS_CONFIGS['all'];

    const counts = { all: statsData.length };
    config.forEach(opt => {
        if (opt.value !== 'all') counts[opt.value] = 0;
    });

    statsData.forEach(d => {
        const stage = (d.stage || '').toLowerCase().replace(/\s+/g, '_');
        let matchedKey = null;
        config.forEach(opt => {
            if (opt.value === 'all') return;
            if (stage === opt.value || stage.replace('-', '_') === opt.value) {
                matchedKey = opt.value;
            } else if (stage.includes(opt.value) || opt.value.includes(stage)) {
                matchedKey = opt.value;
            }
        });
        if (matchedKey && counts[matchedKey] !== undefined) {
            counts[matchedKey]++;
        }
    });

    const statsBar = document.getElementById('tickets-stats-bar');
    if (statsBar) {
        let barHtml = `<span class="tickets-stat-badge">Total: ${counts.all}</span>`;
        config.forEach(opt => {
            if (opt.value === 'all') return;
            const color = STATUS_COLORS[opt.value] || '#6b7280';
            barHtml += `<span class="tickets-stat-badge" style="border-left: 3px solid ${color};">${opt.label}: ${counts[opt.value] || 0}</span>`;
        });
        statsBar.innerHTML = barHtml;
    }

    // Pagination
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / ticketsState.perPage) || 1;
    if (ticketsState.page > totalPages) ticketsState.page = totalPages;
    const startIndex = (ticketsState.page - 1) * ticketsState.perPage;
    const endIndex = Math.min(startIndex + ticketsState.perPage, totalItems);
    const pageData = filtered.slice(startIndex, endIndex);

    // Render table body rows
    const tbody = document.getElementById('tickets-table-body');
    if (tbody) {
        if (pageData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 30px;">No matching records found.</td></tr>`;
        } else {
            tbody.innerHTML = pageData.map(d => {
                const typeIcon = d.type === 'Call Ticket' ? '📞' : (d.type === 'WhatsApp Chat' ? '💬' : '📧');
                const cleanStage = d.stage || 'New';
                const cleanSeverity = d.severity || 'Medium';
                
                // Dynamic style for status badge
                const stageKey = cleanStage.toLowerCase().replace(/\s+/g, '_');
                const badgeColor = STATUS_COLORS[stageKey] || '#6b7280';
                const badgeBg = badgeColor + '1a'; // 10% opacity

                // severity dot class
                let sevCls = 'medium';
                const sevLower = cleanSeverity.toLowerCase();
                if (sevLower === 'blocker') sevCls = 'blocker';
                else if (sevLower === 'high') sevCls = 'high';
                else if (sevLower === 'low') sevCls = 'low';

                return `
                    <tr class="clickable-ticket-row" data-id="${d.id}">
                        <td>${getDevRevLinkHTML(d.id, d.type)}</td>
                        <td>${typeIcon} ${d.type}</td>
                        <td>${d.date ? d.date.substring(0, 16) : '-'}</td>
                        <td>${d.rm_name || '-'}</td>
                        <td>${d.broker_family || '-'}</td>
                        <td>${d.branch || '-'}</td>
                        <td>${d.issue || '-'}</td>
                        <td>${d.agent || '-'}</td>
                        <td><span class="stage-badge" style="background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor}33; padding: 3px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; display: inline-block;">${cleanStage}</span></td>
                        <td><span class="severity-dot ${sevCls}"></span>${cleanSeverity}</td>
                    </tr>
                    <tr class="ticket-detail-row" id="detail-row-${d.id}" style="display: none; background: rgba(255,255,255,0.01);">
                        <td colspan="10" style="padding: 0;">
                            <div class="ticket-detail-panel">
                                <div class="detail-grid">
                                    <div class="detail-item"><span class="detail-label">Sub-Issue</span><span class="detail-value">${d.sub_issue || '-'}</span></div>
                                    <div class="detail-item"><span class="detail-label">SLA Status</span><span class="detail-value">${d.sla_status || 'MET'}</span></div>
                                    <div class="detail-item"><span class="detail-label">Sentiment</span><span class="detail-value">${d.sentiment || 'Neutral'}</span></div>
                                    <div class="detail-item"><span class="detail-label">CSAT</span><span class="detail-value">${d.csat ? '⭐'.repeat(Math.round(d.csat)) : '-'}</span></div>
                                    ${d.recording_url ? `<div class="detail-item"><span class="detail-label">Call Recording</span><span class="detail-value"><a href="${d.recording_url}" target="_blank" style="color: var(--accent-primary); font-weight:700;">Listen Call 🎧</a></span></div>` : ''}
                                    ${d.resolution_time ? `<div class="detail-item"><span class="detail-label">Resolution Time</span><span class="detail-value">${formatSecondsCompact(d.resolution_time)}</span></div>` : ''}
                                </div>
                                <div style="margin-top: 15px; border-top: 1px solid var(--border-color); padding-top: 12px;">
                                    <span class="detail-label">Comments / Conversation Summary</span>
                                    <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); margin: 6px 0 0 0;">${d.comments || 'No details shared.'}</p>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Click handler to toggle details
            tbody.querySelectorAll('.clickable-ticket-row').forEach(row => {
                row.addEventListener('click', () => {
                    const id = row.getAttribute('data-id');
                    const detailRow = document.getElementById(`detail-row-${id}`);
                    if (detailRow) {
                        const isVisible = detailRow.style.display !== 'none';
                        detailRow.style.display = isVisible ? 'none' : 'table-row';
                    }
                });
            });
        }
    }

    // Render pagination controls
    const pagination = document.getElementById('tickets-pagination');
    if (pagination) {
        pagination.innerHTML = `
            <button id="tickets-prev-btn" ${ticketsState.page === 1 ? 'disabled' : ''}>Previous</button>
            <span class="pagination-info">Page ${ticketsState.page} of ${totalPages} (Showing ${startIndex + 1} - ${endIndex} of ${totalItems})</span>
            <button id="tickets-next-btn" ${ticketsState.page === totalPages ? 'disabled' : ''}>Next</button>
        `;
        
        const prevBtn = document.getElementById('tickets-prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (ticketsState.page > 1) {
                    ticketsState.page--;
                    renderTicketsChatsView();
                }
            });
        }

        const nextBtn = document.getElementById('tickets-next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (ticketsState.page < totalPages) {
                    ticketsState.page++;
                    renderTicketsChatsView();
                }
            });
        }
    }
}

// ==========================================================================
// REDESIGN UPGRADES: CROSS-FILTERING, TOASTS, FORECASTING, AND TIMELINES
// ==========================================================================

function applySidebarFilter(filterKey, value) {
    console.log(`Applying sidebar filter: ${filterKey} = ${value}`);
    if (filterKey === 'broker') {
        const select = document.getElementById('filter-broker');
        if (select) {
            select.value = value;
            activeFilters.broker = value;
        }
    } else if (filterKey === 'poc') {
        const select = document.getElementById('filter-poc');
        if (select) {
            select.value = value;
            activeFilters.poc = value;
        }
    } else if (filterKey === 'agent') {
        const select = document.getElementById('filter-agent');
        if (select) {
            select.value = value;
            activeFilters.agent = value;
        }
    } else if (filterKey === 'branch') {
        activeFilters.branch = value;
    } else if (filterKey === 'channel') {
        const select = document.getElementById('filter-channel');
        if (select) {
            select.value = value;
            activeFilters.channel = value;
        }
    }
    
    showFloatingToast(`Filter applied: ${filterKey} = ${value}`);
    buildViewModel();
}

function showFloatingToast(message) {
    let toast = document.getElementById('floating-filter-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'floating-filter-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.right = '30px';
        toast.style.background = 'linear-gradient(135deg, var(--purple), var(--blue))';
        toast.style.color = '#fff';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '12px';
        toast.style.boxShadow = '0 8px 30px rgba(139, 92, 246, 0.4)';
        toast.style.fontFamily = "'Outfit', sans-serif";
        toast.style.fontSize = '0.82rem';
        toast.style.fontWeight = '600';
        toast.style.zIndex = '9999';
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '8px';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>✨</span> ${message}`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
    }, 2500);
}

function renderPredictiveCapacityPlanner() {
    const plannerContainer = document.getElementById('intel-predictive-planner');
    if (!plannerContainer) return;
    
    const allInteractions = rawData.support_interactions || [];
    const allCalls = rawData.calls || [];
    const dailyCounts = {};
    
    allInteractions.forEach(item => {
        if (!item.date) return;
        const dateStr = item.date.substring(0, 10);
        if (!dailyCounts[dateStr]) dailyCounts[dateStr] = { calls: 0, wa: 0, emails: 0 };
        if (item.type === 'Call Ticket') dailyCounts[dateStr].calls++;
        else if (item.type === 'WhatsApp Chat') dailyCounts[dateStr].wa++;
        else if (item.type === 'Care Email') dailyCounts[dateStr].emails++;
    });
    
    const dowSum = {
        calls: Array(7).fill(0),
        wa: Array(7).fill(0),
        emails: Array(7).fill(0),
        counts: Array(7).fill(0)
    };
    
    Object.entries(dailyCounts).forEach(([dateStr, counts]) => {
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return;
        const day = d.getDay();
        dowSum.calls[day] += counts.calls;
        dowSum.wa[day] += counts.wa;
        dowSum.emails[day] += counts.emails;
        dowSum.counts[day]++;
    });
    
    const forecasted = { calls: 0, wa: 0, emails: 0 };
    for (let day = 0; day < 7; day++) {
        const callsAvg = dowSum.counts[day] ? (dowSum.calls[day] / dowSum.counts[day]) : 1;
        const waAvg = dowSum.counts[day] ? (dowSum.wa[day] / dowSum.counts[day]) : 1;
        const emailsAvg = dowSum.counts[day] ? (dowSum.emails[day] / dowSum.counts[day]) : 1;
        
        forecasted.calls += Math.ceil(callsAvg);
        forecasted.wa += Math.ceil(waAvg);
        forecasted.emails += Math.ceil(emailsAvg);
    }
    
    if (forecasted.calls === 0) forecasted.calls = 145;
    if (forecasted.wa === 0) forecasted.wa = 280;
    if (forecasted.emails === 0) forecasted.emails = 95;
    
    const callsHours = (forecasted.calls * 180) / 3600;
    const waHours = (forecasted.wa * 600) / 3600;
    const emailsHours = (forecasted.emails * 900) / 3600;
    const totalRequiredHours = callsHours + waHours + emailsHours;
    
    const activeAgentsCount = (rawData.agent_scorecards && rawData.agent_scorecards.length) || 4;
    const totalAvailableHours = activeAgentsCount * 45;
    
    const utilizationPct = totalAvailableHours ? Math.round((totalRequiredHours / totalAvailableHours) * 100) : 0;
    let statusText = "Optimal Staffing";
    let statusClass = "good";
    if (utilizationPct > 95) {
        statusText = "⚠️ Understaffed Peak Load Warning";
        statusClass = "poor";
    } else if (utilizationPct < 50) {
        statusText = "Surplus Staffing Capacity";
        statusClass = "excellent";
    }
    
    plannerContainer.innerHTML = `
        <div class="agent-score-card" style="text-align: left; padding: 20px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 14px;">
            <div class="score-label">🔮 Predicted Volume (Next 7d)</div>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 500;">
                    <span>📞 Voice Calls:</span>
                    <strong style="color: var(--purple);">${forecasted.calls} calls</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 500;">
                    <span>💬 WhatsApp Chats:</span>
                    <strong style="color: var(--green);">${forecasted.wa} chats</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 500;">
                    <span>✉️ Care Emails:</span>
                    <strong style="color: var(--orange);">${forecasted.emails} emails</strong>
                </div>
            </div>
        </div>
        <div class="agent-score-card" style="text-align: left; padding: 20px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 14px;">
            <div class="score-label">⚡ Workload Capacity Planner</div>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 500;">
                    <span>Required Effort:</span>
                    <strong>${Math.round(totalRequiredHours)} Hours</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 500;">
                    <span>Available Capacity:</span>
                    <strong>${totalAvailableHours} Hours</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 500;">
                    <span>Active Team size:</span>
                    <strong>${activeAgentsCount} Agents</strong>
                </div>
            </div>
        </div>
        <div class="agent-score-card" style="text-align: left; padding: 20px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 14px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <div class="score-label">📊 Expected Utilization</div>
                <div class="score-value" style="font-size: 2.2rem; color: var(--purple); margin: 8px 0 4px; font-weight:800;">${utilizationPct}%</div>
            </div>
            <span class="health-score-badge ${statusClass}" style="align-self: flex-start; margin-top: auto; font-size: 0.72rem; padding: 4px 10px; font-weight:700;">${statusText}</span>
        </div>
    `;
}

function renderHourlyAbandonmentTrend(calls) {
    const ctx = document.getElementById('md-hourly-abandonment-chart');
    if (!ctx) return;
    
    const hours = Array.from({length: 10}, (_, i) => i + 9);
    const answeredCounts = Array(10).fill(0);
    const missedCounts = Array(10).fill(0);
    
    calls.forEach(c => {
        if (!c.date) return;
        const dt = safeParseDate(c.date);
        if (!dt) return;
        const h = dt.getHours();
        const hourIdx = hours.indexOf(h);
        if (hourIdx !== -1) {
            const status = (c.stage || '').toLowerCase();
            if (status === 'answered' || status === 'connected') {
                answeredCounts[hourIdx]++;
            } else {
                missedCounts[hourIdx]++;
            }
        }
    });
    
    if (calls.length === 0) {
        const mockAns = [2, 5, 12, 18, 9, 8, 14, 15, 11, 4];
        const mockMis = [1, 0, 3,  6,  4, 2, 5,  3,  2,  0];
        mockAns.forEach((v, i) => answeredCounts[i] = v);
        mockMis.forEach((v, i) => missedCounts[i] = v);
    }
    
    const labels = hours.map(h => `${h}:00`);
    
    if (mdCharts.hourlyAbandonment) {
        mdCharts.hourlyAbandonment.destroy();
    }
    
    mdCharts.hourlyAbandonment = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Answered Calls', data: answeredCounts, backgroundColor: THEME_COLORS.green + 'a0', borderRadius: 4 },
                { label: 'Missed / Abandoned', data: missedCounts, backgroundColor: THEME_COLORS.red + 'a0', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } },
                y: { stacked: true, beginAtZero: true, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } }
            },
            plugins: {
                legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } }
            }
        }
    });
}

function renderAgentBreaksTimeline() {
    const canvas = document.getElementById('agent-breaks-timeline');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const container = canvas.parentElement;
    canvas.width = Math.max(800, container.clientWidth);
    
    const breaks = rawData.agent_breaks || [];
    const agents = new Set();
    breaks.forEach(b => { if (b.agent_name && b.agent_name !== 'NA') agents.add(b.agent_name); });
    const agentList = [...agents].sort();
    
    if (agentList.length === 0) {
        agentList.push('Arup', 'Mansi Billa', 'Deepak Prajapati', 'Tushar Khetan');
    }
    
    const laneH = 40;
    const headerH = 40;
    const footerH = 30;
    canvas.height = headerH + (agentList.length * laneH) + footerH;
    
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    
    const marginL = 140;
    const timelineW = width - marginL - 40;
    
    const isLight = document.body.classList.contains('light-mode');
    const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
    const textColor = isLight ? '#0f172a' : '#f8fafc';
    const mutedColor = isLight ? '#64748b' : '#cbd5e1';
    
    // Draw Hour Grid Lines
    ctx.fillStyle = mutedColor;
    ctx.font = 'bold 9px SF Pro Text';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    for (let h = 0; h <= 9; h++) {
        const hourLabel = `${h + 9}:00`;
        const x = marginL + (h / 9) * timelineW;
        
        ctx.beginPath();
        ctx.moveTo(x, headerH - 5);
        ctx.lineTo(x, height - footerH);
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = h === 0 || h === 9 ? 1.5 : 1;
        ctx.stroke();
        
        ctx.fillText(hourLabel, x, headerH - 8);
    }
    
    function timeToMinutesSince9(timeStr) {
        if (!timeStr) return null;
        const parts = timeStr.split(':');
        if (parts.length < 2) return null;
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) - 540;
    }
    
    agentList.forEach((agent, i) => {
        const y = headerH + (i * laneH);
        
        ctx.beginPath();
        ctx.moveTo(0, y + laneH);
        ctx.lineTo(width, y + laneH);
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = textColor;
        ctx.font = 'bold 10px SF Pro Text';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(agent, 15, y + laneH / 2);
        
        ctx.fillStyle = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)';
        ctx.fillRect(marginL, y + 8, timelineW, laneH - 16);
        
        let agentBreaks = breaks.filter(b => b.agent_name === agent);
        
        if (agentBreaks.length === 0) {
            if (agent === 'Arup') {
                agentBreaks = [
                    { break_type: 'Tea', start: '11:00:00', end: '11:15:00' },
                    { break_type: 'Lunch', start: '13:00:00', end: '13:45:00' },
                    { break_type: 'Tea', start: '16:00:00', end: '16:15:00' }
                ];
            } else if (agent === 'Mansi Billa') {
                agentBreaks = [
                    { break_type: 'Lunch', start: '13:30:00', end: '14:15:00' },
                    { break_type: 'Briefing', start: '15:30:00', end: '16:00:00' }
                ];
            } else if (agent === 'Deepak Prajapati') {
                agentBreaks = [
                    { break_type: 'Tea', start: '10:30:00', end: '10:45:00' },
                    { break_type: 'Lunch', start: '12:45:00', end: '13:30:00' },
                    { break_type: 'Training', start: '15:00:00', end: '16:00:00' }
                ];
            } else {
                agentBreaks = [
                    { break_type: 'Lunch', start: '13:15:00', end: '14:00:00' },
                    { break_type: 'Tea', start: '16:30:00', end: '16:45:00' }
                ];
            }
        }
        
        agentBreaks.forEach(b => {
            const startStr = b.Break_Start_Time || b.start || '';
            const endStr = b.Break_End_Time || b.end || '';
            
            const startMin = timeToMinutesSince9(startStr);
            const endMin = timeToMinutesSince9(endStr);
            
            if (startMin !== null && endMin !== null) {
                const s = Math.max(0, Math.min(540, startMin));
                const e = Math.max(0, Math.min(540, endMin));
                
                if (e > s) {
                    const x = marginL + (s / 540) * timelineW;
                    const w = ((e - s) / 540) * timelineW;
                    
                    let breakColor = THEME_COLORS.blue;
                    const btype = (b.break_type || b.Breaks || '').toLowerCase();
                    if (btype.includes('tea') || btype.includes('coffee')) {
                        breakColor = THEME_COLORS.orange;
                    } else if (btype.includes('train') || btype.includes('brief') || btype.includes('coaching')) {
                        breakColor = THEME_COLORS.purple;
                    } else if (btype.includes('person') || btype.includes('emergency')) {
                        breakColor = THEME_COLORS.red;
                    } else if (btype.includes('meet')) {
                        breakColor = THEME_COLORS.green;
                    }
                    
                    ctx.fillStyle = breakColor + 'd0';
                    ctx.strokeStyle = breakColor;
                    ctx.lineWidth = 1;
                    
                    const barY = y + 8;
                    const barW = w;
                    const barH = laneH - 16;
                    const radius = 4;
                    
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(x, barY, barW, barH, radius);
                    } else {
                        ctx.rect(x, barY, barW, barH);
                    }
                    ctx.fill();
                    ctx.stroke();
                    
                    if (barW > 40) {
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 8px SF Pro Display';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(b.break_type || 'Away', x + barW / 2, barY + barH / 2);
                    }
                }
            }
        });
    });
    
    // Draw Legend
    const legendY = height - 12;
    const legendItems = [
        { label: 'Lunch', color: THEME_COLORS.blue },
        { label: 'Tea / Coffee', color: THEME_COLORS.orange },
        { label: 'Training / Briefing', color: THEME_COLORS.purple },
        { label: 'Personal / Other', color: THEME_COLORS.red }
    ];
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    let legendX = marginL;
    
    legendItems.forEach(item => {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(legendX, legendY, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = mutedColor;
        ctx.font = '500 8px SF Pro Text';
        ctx.fillText(item.label, legendX + 8, legendY);
        
        legendX += 130;
    });
}

// ==========================================================================
// NEW FEATURES: Sentiment, CSAT, Workload Simulator, SLA Risk Queue, QA Coaching
// ==========================================================================

let intelSentimentDonutChart = null;

function renderSentimentCSATPanel() {
    const data = window.viewModel.interactions || [];
    const total = data.length;

    let pos = 0, neu = 0, neg = 0;
    let csatSum = 0, csatCount = 0;
    const rmNegCounts = {};

    data.forEach(d => {
        const s = (d.sentiment || 'Neutral').toLowerCase();
        if (s === 'positive') pos++;
        else if (s === 'negative') {
            neg++;
            if (d.rm_name && d.rm_name !== 'NA' && d.rm_name !== '-') {
                rmNegCounts[d.rm_name] = (rmNegCounts[d.rm_name] || 0) + 1;
            }
        }
        else neu++;

        if (d.csat && !isNaN(d.csat)) {
            csatSum += d.csat;
            csatCount++;
        }
    });

    const sentimentIndex = total > 0 ? Math.round(((pos + 0.5 * neu) / total) * 100) : 100;
    const avgCSAT = csatCount > 0 ? (csatSum / csatCount) : 4.0;

    const indexEl = document.getElementById('intel-sentiment-index');
    if (indexEl) {
        indexEl.innerText = `${sentimentIndex}%`;
        indexEl.style.color = sentimentIndex >= 80 ? 'var(--green)' : sentimentIndex >= 60 ? 'var(--orange)' : 'var(--red)';
    }

    const starsEl = document.getElementById('intel-csat-stars');
    if (starsEl) {
        const fullStars = Math.round(avgCSAT);
        starsEl.innerText = '⭐'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
    }

    const csatValEl = document.getElementById('intel-csat-val');
    if (csatValEl) {
        csatValEl.innerText = `${avgCSAT.toFixed(2)} / 5.0 (${csatCount} rated)`;
    }

    const alertsEl = document.getElementById('intel-sentiment-alerts');
    if (alertsEl) {
        const sortedRMs = Object.entries(rmNegCounts).sort((a,b) => b[1] - a[1]);
        alertsEl.innerHTML = sortedRMs.length ? sortedRMs.slice(0, 5).map(([rm, count]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:rgba(239,68,68,0.06);border-left:3px solid var(--red);border-radius:4px;margin-bottom:4px;">
                <span style="font-weight:600;color:var(--text-primary);">${rm}</span>
                <span class="freq-badge high" style="padding:1px 6px;font-size:0.7rem;line-height:1;">${count} alerts</span>
            </div>
        `).join('') : '<p style="color:var(--text-muted);text-align:center;padding:10px 0;">No negative sentiment flags detected.</p>';
    }

    const canvas = document.getElementById('intel-sentiment-donut');
    if (canvas) {
        if (intelSentimentDonutChart) {
            intelSentimentDonutChart.destroy();
        }
        intelSentimentDonutChart = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: [{
                    data: [pos, neu, neg],
                    backgroundColor: [THEME_COLORS.green, THEME_COLORS.blue, THEME_COLORS.red],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                cutout: '70%'
            }
        });
    }
}

function runSimulatorUpdate() {
    const calls = parseFloat(document.getElementById('sim-calls-slider').value);
    const chats = parseFloat(document.getElementById('sim-chats-slider').value);
    const agents = parseFloat(document.getElementById('sim-agents-slider').value);

    document.getElementById('sim-calls-val').innerText = `${calls} calls`;
    document.getElementById('sim-chats-val').innerText = `${chats} chats`;
    document.getElementById('sim-agents-val').innerText = `${agents} agents`;

    const shiftSec = 32400; // 9 hours
    let callAHT = 240; // Default 4 mins
    let chatAHT = 600; // Default 10 mins

    const activeCalls = window.viewModel.calls || [];
    const answeredCalls = activeCalls.filter(c => c.duration && !isNaN(c.duration));
    if (answeredCalls.length) {
        callAHT = answeredCalls.reduce((s, c) => s + c.duration, 0) / answeredCalls.length;
    }

    const lambdaCalls = calls / shiftSec;
    const lambdaChats = chats / shiftSec;
    const lambda = lambdaCalls + lambdaChats;

    const totalVolume = calls + chats;
    const weightedAHT = totalVolume > 0 ? (calls * callAHT + chats * chatAHT) / totalVolume : 240;

    const A = lambda * weightedAHT;

    let aqt = 0;
    let sla = 100;
    let status = 'excellent';
    let bannerText = 'Optimal Staffing Level';

    if (A >= agents) {
        aqt = 999;
        sla = 0;
        status = 'poor';
        bannerText = 'Critical Shortage - Queue Overload';
    } else {
        function factorial(n) {
            let f = 1;
            for (let i = 2; i <= n; i++) f *= i;
            return f;
        }
        let sum = 0.0;
        for (let k = 0; k < agents; k++) {
            sum += Math.pow(A, k) / factorial(k);
        }
        let term = Math.pow(A, agents) / (factorial(agents) * (1 - A / agents));
        let Pq = term / (sum + term);

        aqt = Math.round(Pq * (weightedAHT / (agents - A)));

        const targetSec = 15;
        const exponent = - (agents - A) * targetSec / weightedAHT;
        sla = Math.round((1 - Pq * Math.exp(exponent)) * 100);
        if (sla < 0) sla = 0;
        if (sla > 100) sla = 100;

        const utilization = A / agents;
        if (utilization > 0.85) {
            status = 'moderate';
            bannerText = 'High Occupancy - Risk of Wait Spike';
        } else if (utilization < 0.4) {
            status = 'good';
            bannerText = 'Excess Capacity - Low Agent Occupancy';
        } else {
            status = 'excellent';
            bannerText = 'Optimal Staffing - Service Levels Met';
        }
    }

    const aqtEl = document.getElementById('sim-aqt-display');
    const slaEl = document.getElementById('sim-sla-display');
    const bannerEl = document.getElementById('sim-status-banner');

    if (aqtEl) aqtEl.innerText = aqt >= 999 ? '∞' : `${aqt}s`;
    if (slaEl) {
        slaEl.innerText = `${sla}%`;
        slaEl.style.color = sla >= 85 ? 'var(--green)' : sla >= 70 ? 'var(--orange)' : 'var(--red)';
    }
    if (bannerEl) {
        bannerEl.className = `status-banner ${status}`;
        bannerEl.innerText = bannerText;
    }
}

function renderCapacitySimulator() {
    const callsSlider = document.getElementById('sim-calls-slider');
    const chatsSlider = document.getElementById('sim-chats-slider');
    const agentsSlider = document.getElementById('sim-agents-slider');

    if (callsSlider && !callsSlider._listenerSet) {
        callsSlider._listenerSet = true;
        const updateFn = () => runSimulatorUpdate();
        callsSlider.addEventListener('input', updateFn);
        chatsSlider.addEventListener('input', updateFn);
        agentsSlider.addEventListener('input', updateFn);
    }

    runSimulatorUpdate();
}

function openBrokerHealthDiagnosticsModal(brokerName) {
    const modal = document.getElementById('broker-health-modal');
    if (!modal) return;

    // Filter interactions specifically for selected broker
    const allInts = window.viewModel.interactions || [];
    const bData = allInts.filter(d => d.broker_family === brokerName);
    const calls = bData.filter(d => d.type === 'Call Ticket');
    const chats = bData.filter(d => d.type === 'WhatsApp Chat');
    const emails = bData.filter(d => d.type === 'Care Email');

    const total = bData.length;

    // SLA met %
    const slaItems = bData.filter(d => d.sla_frt_status);
    const slaMet = slaItems.filter(d => (d.sla_frt_status || '').toLowerCase() === 'met').length;
    const slaPct = slaItems.length ? Math.round((slaMet / slaItems.length) * 100) : 100;

    // Branches count
    const branches = new Set();
    bData.forEach(d => { if (d.branch && d.branch !== 'Not shared') branches.add(d.branch); });

    // Average CSAT
    const csatItems = bData.filter(d => d.csat && !isNaN(d.csat));
    const avgCSAT = csatItems.length ? (csatItems.reduce((s,d) => s + d.csat, 0) / csatItems.length) : 4.0;

    // Update Header
    document.getElementById('broker-health-modal-title').innerText = `${brokerName} Diagnostics Report`;
    
    // Broker Score Calculation
    let score = 100;
    let repeatsCount = 0;
    if (rawData.repeat_loops) {
        rawData.repeat_loops.forEach(l => {
            if (l.broker_family === brokerName) {
                repeatsCount += l.repeat_count;
            }
        });
    }
    const repeatPenalty = Math.min(30, repeatsCount * 3);
    const volumeScore = Math.min(25, Math.round(total / 5));
    const calculatedScore = Math.max(0, 100 - repeatPenalty - volumeScore - Math.round((100 - slaPct) * 0.5));
    
    const scoreBadge = document.getElementById('broker-health-modal-score');
    if (scoreBadge) {
        scoreBadge.innerText = `${calculatedScore}/100`;
        const grade = calculatedScore >= 80 ? 'excellent' : calculatedScore >= 60 ? 'good' : calculatedScore >= 40 ? 'moderate' : 'poor';
        scoreBadge.className = `health-score-badge ${grade}`;
    }

    // KPI Grid
    const kpiGrid = document.getElementById('broker-health-kpi-grid');
    if (kpiGrid) {
        kpiGrid.innerHTML = `
            <div class="kpi-card" style="padding:12px;margin:0;text-align:center;">
                <span class="kpi-title" style="font-size:0.7rem;">Total Contacts</span>
                <div style="font-size:1.4rem;font-weight:800;color:var(--text-primary);">${total}</div>
                <span style="font-size:0.65rem;color:var(--text-muted);">${calls.length} Calls • ${chats.length} Chats • ${emails.length} Emails</span>
            </div>
            <div class="kpi-card" style="padding:12px;margin:0;text-align:center;">
                <span class="kpi-title" style="font-size:0.7rem;">SLA Met Rate</span>
                <div style="font-size:1.4rem;font-weight:800;color:${slaPct >= 85 ? 'var(--green)' : 'var(--orange)'};">${slaPct}%</div>
                <span style="font-size:0.65rem;color:var(--text-muted);">${slaMet} of ${slaItems.length} met</span>
            </div>
            <div class="kpi-card" style="padding:12px;margin:0;text-align:center;">
                <span class="kpi-title" style="font-size:0.7rem;">Active Branches</span>
                <div style="font-size:1.4rem;font-weight:800;color:var(--text-primary);">${branches.size}</div>
                <span style="font-size:0.65rem;color:var(--text-muted);">Unique locations</span>
            </div>
            <div class="kpi-card" style="padding:12px;margin:0;text-align:center;">
                <span class="kpi-title" style="font-size:0.7rem;">Avg CSAT Index</span>
                <div style="font-size:1.4rem;font-weight:800;color:#facc15;">${avgCSAT.toFixed(1)} ★</div>
                <span style="font-size:0.65rem;color:var(--text-muted);">${csatItems.length} audited ratings</span>
            </div>
        `;
    }

    // Prescription Engine
    const prescEl = document.getElementById('broker-health-prescription');
    if (prescEl) {
        // Find top issues for prescription
        const issueCounts = {};
        bData.forEach(d => { if (d.issue) issueCounts[d.issue] = (issueCounts[d.issue] || 0) + 1; });
        const sortedIssues = Object.entries(issueCounts).sort((a,b) => b[1] - a[1]);
        const topIssue = sortedIssues.length ? sortedIssues[0] : null;
        
        let adviceText = '';
        if (calculatedScore < 60) {
            adviceText = `<strong>Urgent Action Required</strong>: Health score has dropped to ${calculatedScore}/100. `;
        } else {
            adviceText = `<strong>Operational Assessment</strong>: Broker maintains stable relations. `;
        }

        if (repeatsCount > 3) {
            adviceText += `Friction loops are highly active (${repeatsCount} recurrences). Recommend scheduling a technical sync with branch network managers. `;
        }
        if (topIssue) {
            adviceText += `Primary friction area is <strong>"${topIssue[0]}"</strong> which accounts for ${Math.round((topIssue[1]/total)*100)}% of issues. Suggest RM training audits for this category. `;
        }
        if (slaPct < 85) {
            adviceText += `SLA response times are lagging. Recommend assigning a dedicated senior POC to partner support channels. `;
        }
        if (repeatsCount <= 3 && slaPct >= 85 && (!topIssue || topIssue[1] < 5)) {
            adviceText += `Operation metrics look excellent. Continue current support SLA mapping.`;
        }

        prescEl.innerHTML = adviceText;
    }

    // Hotspots branch list
    const branchEl = document.getElementById('broker-health-branches');
    if (branchEl) {
        const branchCounts = {};
        bData.forEach(d => { if (d.branch) branchCounts[d.branch] = (branchCounts[d.branch] || 0) + 1; });
        const sortedBranches = Object.entries(branchCounts).sort((a,b) => b[1] - a[1]);

        branchEl.innerHTML = sortedBranches.length ? sortedBranches.map(([br, count]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid var(--divider-color);font-size:0.8rem;">
                <span style="font-weight:600;color:var(--text-primary);">${br}</span>
                <span style="color:var(--text-secondary);font-weight:700;">${count} contacts</span>
            </div>
        `).join('') : '<p style="color:var(--text-muted);font-style:italic;text-align:center;padding:20px;">No branch locations recorded.</p>';
    }

    modal.classList.add('open');
}

function renderSLARiskMonitor() {
    const queueEl = document.getElementById('sla-risk-queue-card');
    if (!queueEl) return;

    const allInts = window.viewModel.interactions || [];
    
    // Filter open/new/in progress items
    const openItems = allInts.filter(d => {
        const stage = (d.stage || '').toLowerCase();
        return ['new', 'open', 'in progress', 'work in progress'].includes(stage);
    });

    const now = Date.now();
    const riskList = [];

    openItems.forEach(item => {
        if (!item.date) return;
        const created = safeParseDate(item.date).getTime();
        const elapsedSec = (now - created) / 1000;

        let limitSec = 900; // 15 mins default for Calls/WhatsApp
        if (item.type === 'Care Email') {
            limitSec = 14400; // 4 hours
        }

        const remainingSec = limitSec - elapsedSec;
        riskList.push({ item, remainingSec });
    });

    // Sort by remainingSec (ascending, most urgent first)
    riskList.sort((a,b) => a.remainingSec - b.remainingSec);

    const displayList = riskList.slice(0, 5);

    if (displayList.length === 0) {
        queueEl.innerHTML = `
            <div style="text-align:center;padding:30px;color:var(--text-muted);font-size:0.85rem;font-weight:500;">
                ✅ All SLAs are secure. No critical at-risk tickets pending.
            </div>
        `;
        return;
    }

    queueEl.innerHTML = displayList.map(r => {
        const rem = r.remainingSec;
        const isBreached = rem < 0;
        const absSec = Math.abs(rem);
        
        let timeStr = '';
        if (absSec < 60) timeStr = `${Math.round(absSec)}s`;
        else if (absSec < 3600) timeStr = `${Math.floor(absSec / 60)}m ${Math.round(absSec % 60)}s`;
        else timeStr = `${(absSec / 3600).toFixed(1)}h`;

        if (isBreached) timeStr = `BREACHED by ${timeStr}`;
        else timeStr = `${timeStr} remaining`;

        let riskClass = 'low';
        let borderLeft = '4px solid var(--green)';
        
        if (isBreached) {
            riskClass = 'high';
            borderLeft = '4px solid var(--red)';
        } else if (rem < 300) { // < 5 mins
            riskClass = 'medium';
            borderLeft = '4px solid var(--orange)';
        }

        return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.015);border:1px solid var(--border-color);border-radius:8px;border-left:${borderLeft};margin-bottom:2px;cursor:pointer;" 
                 onclick="applySidebarFilter('broker', '${r.item.broker_family}')">
                <div>
                    <span style="font-weight:700;font-size:0.8rem;color:var(--purple);">${r.item.id}</span>
                    <span style="font-size:0.7rem;color:var(--text-muted);margin-left:8px;">${r.item.type} • ${r.item.broker_family}</span>
                    <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px;font-weight:500;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;max-width:450px;">${r.item.title || r.item.issue}</div>
                </div>
                <div style="text-align:right;">
                    <span class="freq-badge ${riskClass}" style="padding:4px 8px;font-size:0.72rem;font-weight:700;">${timeStr}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderAgentQACoaching(selectedAgent) {
    const widget = document.getElementById('agent-qa-coaching-widget');
    if (!widget) return;

    if (selectedAgent === 'all') {
        widget.style.display = 'none';
        return;
    }

    widget.style.display = 'block';

    const data = window.viewModel.interactions || [];
    const agentData = data.filter(d => d.agent === selectedAgent);

    // Filter audits
    const audited = agentData.filter(d => d.qa_overall !== null && !isNaN(d.qa_overall));

    const dimensions = {
        greeting: { sum: 0, count: 0, max: 5, label: 'Opening & Greetings' },
        grammar: { sum: 0, count: 0, max: 5, label: 'Grammar & Accuracy' },
        acknowledgement: { sum: 0, count: 0, max: 15, label: 'Acknowledgement & Assurance' },
        sla: { sum: 0, count: 0, max: 15, label: 'Maintaining SLA' },
        assistance: { sum: 0, count: 0, max: 5, label: 'Assistance & Closing' }
    };

    audited.forEach(d => {
        if (d.qa_greeting !== null && !isNaN(d.qa_greeting)) {
            dimensions.greeting.sum += d.qa_greeting;
            dimensions.greeting.count++;
        }
        if (d.qa_grammar !== null && !isNaN(d.qa_grammar)) {
            dimensions.grammar.sum += d.qa_grammar;
            dimensions.grammar.count++;
        }
        if (d.qa_acknowledgement !== null && !isNaN(d.qa_acknowledgement)) {
            dimensions.acknowledgement.sum += d.qa_acknowledgement;
            dimensions.acknowledgement.count++;
        }
        if (d.qa_sla !== null && !isNaN(d.qa_sla)) {
            dimensions.sla.sum += d.qa_sla;
            dimensions.sla.count++;
        }
        if (d.qa_assistance !== null && !isNaN(d.qa_assistance)) {
            dimensions.assistance.sum += d.qa_assistance;
            dimensions.assistance.count++;
        }
    });

    const listContainer = document.getElementById('agent-qa-dimensions-list');
    const adviceTextEl = document.getElementById('agent-qa-coaching-text');
    const auditedTbody = document.getElementById('agent-qa-audited-tbody');
    const agentTitleName = document.getElementById('qa-agent-title-name');

    if (agentTitleName) agentTitleName.innerText = selectedAgent;
    if (auditedTbody) {
        auditedTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); font-style:italic; padding:20px;">No audited tickets for ${selectedAgent} in this period.</td></tr>`;
    }

    if (!listContainer) return;

    if (audited.length === 0) {
        listContainer.innerHTML = `<p style="color:var(--text-muted);font-style:italic;padding:20px 0;text-align:center;">No QA audits recorded for ${selectedAgent} in this period.</p>`;
        if (adviceTextEl) adviceTextEl.innerText = `No QA audits are available for ${selectedAgent} yet. Keep auditing tickets in DevRev to populate coaching parameters.`;
        return;
    }

    let lowestScore = 1.0;
    let lowestKey = 'none';

    let html = '';
    Object.entries(dimensions).forEach(([key, dim]) => {
        const avg = dim.count > 0 ? (dim.sum / dim.count) : dim.max;
        const ratio = avg / dim.max;

        if (ratio < lowestScore) {
            lowestScore = ratio;
            lowestKey = key;
        }

        const pct = Math.round(ratio * 100);
        let progressColor = 'var(--purple)';
        if (pct < 70) progressColor = 'var(--red)';
        else if (pct < 85) progressColor = 'var(--orange)';
        else progressColor = 'var(--green)';

        html += `
            <div class="coaching-bar-group" style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;font-size:0.78rem;font-weight:600;margin-bottom:4px;">
                    <span style="color:var(--text-primary);">${dim.label}</span>
                    <span style="color:var(--text-secondary);">${avg.toFixed(1)} / ${dim.max} (${pct}%)</span>
                </div>
                <div class="progress-bar-bg" style="background:rgba(255,255,255,0.03);height:8px;border-radius:4px;overflow:hidden;border:1px solid var(--border-color);">
                    <div style="background:${progressColor};height:100%;width:${pct}%;border-radius:4px;transition:width 0.5s ease-out;"></div>
                </div>
            </div>
        `;
    });
    listContainer.innerHTML = html;

    const advices = {
        greeting: `Greetings average is at ${Math.round(lowestScore*100)}%. Suggest refresher training on the customer greeting template. Emphasize warm open and closing scripts.`,
        grammar: `Grammar and Accuracy score is low (${Math.round(lowestScore*100)}%). Recommend grammar checks or email preview plugins prior to sending customer replies.`,
        acknowledgement: `Acknowledgement and assurance score is underperforming. Train agent to explicitly acknowledge the specific problem and state ownership actions early in the interaction.`,
        sla: `SLA Maintenance is lagging. Provide agent coaching on keyboard shortcuts, template response macros, and prompt handovers to reduce customer wait times.`,
        assistance: `Opening and closing statements score indicates gaps. Suggest standardizing final check loops (e.g. "Is there anything else I can help you with today?") on all chats.`,
        none: `Outstanding performance! Agent maintains top scores across all QA metrics. Recommend for mentoring peer agents.`
    };
    if (adviceTextEl) {
        adviceTextEl.innerHTML = advices[lowestKey] || advices.none;
    }

    // Populate audited tickets list
    if (auditedTbody && audited.length > 0) {
        auditedTbody.innerHTML = audited.map(d => {
            const v = Number(d.qa_overall);
            const qaPct = Math.round(v > 45 ? v : (v / 45) * 100);
            const csatStars = d.csat ? '★'.repeat(Math.round(d.csat)) + '☆'.repeat(5 - Math.round(d.csat)) : '-';
            const commentsEscaped = (d.comments || '').replace(/"/g, '&quot;');
            return `<tr>
                <td>${getDevRevLinkHTML(d.id, d.type)}</td>
                <td>${d.date ? d.date.substring(0, 10) : '-'}</td>
                <td>${d.issue || '-'} (${d.sub_issue || '-'})</td>
                <td style="text-align:center; font-weight:700; color:var(--purple);">${qaPct}%</td>
                <td style="text-align:center; color:#facc15;">${csatStars}</td>
                <td style="text-align:left; font-size:0.78rem; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${commentsEscaped}">${d.comments || '-'}</td>
            </tr>`;
        }).join('');
    }
}

// ==========================================================================
// CUSTOM POPOVER DROPDOWNS (SHADCN/UI STYLE)
// ==========================================================================

function convertSelectToCustomDropdown(select) {
    if (select.dataset.customDropdownInitialized) return;
    select.dataset.customDropdownInitialized = 'true';

    const isMultiple = select.multiple;

    // Hide native select
    select.style.display = 'none';

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    // Create trigger button
    const trigger = document.createElement('button');
    trigger.className = 'custom-select-trigger';
    trigger.type = 'button';
    
    const valueSpan = document.createElement('span');
    valueSpan.className = 'custom-select-value';
    trigger.appendChild(valueSpan);

    const chevron = document.createElement('span');
    chevron.className = 'custom-select-chevron';
    chevron.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    `;
    trigger.appendChild(chevron);
    wrapper.appendChild(trigger);

    // Create panel
    const panel = document.createElement('div');
    panel.className = 'custom-select-panel';
    wrapper.appendChild(panel);

    // Sync when native select fires change event (for programmatic changes like resets)
    select.addEventListener('change', () => {
        syncValue();
    });

    // Setup native popover support if available
    const hasPopover = typeof panel.showPopover === 'function';
    if (hasPopover) {
        panel.setAttribute('popover', 'auto');
        
        // Listen to toggle events to sync trigger active class
        panel.addEventListener('toggle', (event) => {
            if (event.newState === 'open') {
                trigger.classList.add('active');
            } else {
                trigger.classList.remove('active');
            }
        });
    }

    // Position panel relative to the trigger
    function positionPanel() {
        const rect = trigger.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.left = `${rect.left}px`;
        panel.style.top = `${rect.bottom + 6}px`;
        panel.style.width = `${rect.width}px`;
    }

    // Sync selected value text and highlight options
    function syncValue() {
        const selectedOptions = Array.from(select.options).filter(opt => opt.selected);
        
        if (isMultiple) {
            // Highlight selected options in custom options panel
            panel.querySelectorAll('.custom-select-option').forEach(opt => {
                const isSel = selectedOptions.some(o => o.value === opt.dataset.value);
                const chk = opt.querySelector('.custom-select-check');
                if (isSel) {
                    opt.classList.add('selected');
                    if (chk) chk.style.opacity = '1';
                } else {
                    opt.classList.remove('selected');
                    if (chk) chk.style.opacity = '0';
                }
            });

            // Update trigger text
            if (selectedOptions.length === 0) {
                valueSpan.textContent = select.options[0] ? select.options[0].textContent : '';
            } else {
                const hasAll = selectedOptions.some(o => o.value === 'all' || o.value === 'none');
                if (hasAll) {
                    const allOpt = selectedOptions.find(o => o.value === 'all' || o.value === 'none');
                    valueSpan.textContent = allOpt.textContent;
                } else {
                    if (selectedOptions.length <= 2) {
                        valueSpan.textContent = selectedOptions.map(o => o.textContent).join(', ');
                    } else {
                        valueSpan.textContent = `${selectedOptions.length} Selected`;
                    }
                }
            }
        } else {
            const selectedOption = select.options[select.selectedIndex];
            valueSpan.textContent = selectedOption ? selectedOption.textContent : '';
            
            const val = select.value;
            panel.querySelectorAll('.custom-select-option').forEach(opt => {
                if (opt.dataset.value === val) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });
        }
    }

    // Rebuild option list
    function rebuildOptions() {
        panel.innerHTML = '';
        Array.from(select.options).forEach(option => {
            const optDiv = document.createElement('div');
            optDiv.className = 'custom-select-option';
            optDiv.textContent = option.textContent;
            optDiv.dataset.value = option.value;
            
            if (isMultiple) {
                optDiv.style.display = 'flex';
                optDiv.style.alignItems = 'center';
                optDiv.style.justifyContent = 'space-between';
                
                const checkIcon = document.createElement('span');
                checkIcon.className = 'custom-select-check';
                checkIcon.innerHTML = '✓';
                checkIcon.style.marginLeft = '8px';
                checkIcon.style.opacity = option.selected ? '1' : '0';
                optDiv.appendChild(checkIcon);
                
                if (option.selected) {
                    optDiv.classList.add('selected');
                }
            } else {
                if (option.value === select.value) {
                    optDiv.classList.add('selected');
                }
            }
            
            optDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (isMultiple) {
                    const clickedVal = option.value;
                    const isAllOrNone = clickedVal === 'all' || clickedVal === 'none';
                    
                    if (isAllOrNone) {
                        // Deselect everything else, select this
                        Array.from(select.options).forEach(opt => {
                            opt.selected = (opt.value === clickedVal);
                        });
                    } else {
                        // Toggle this option
                        option.selected = !option.selected;
                        
                        // Deselect 'all' or 'none' if it was selected
                        Array.from(select.options).forEach(opt => {
                            if (opt.value === 'all' || opt.value === 'none') {
                                opt.selected = false;
                            }
                        });
                        
                        // If nothing remains selected, select 'all' or 'none' default option
                        const anySelected = Array.from(select.options).some(opt => opt.selected);
                        if (!anySelected) {
                            const defaultOpt = Array.from(select.options).find(opt => opt.value === 'all' || opt.value === 'none');
                            if (defaultOpt) defaultOpt.selected = true;
                        }
                    }
                    
                    syncValue();
                    
                    // Dispatch change event to trigger filters
                    const event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                } else {
                    select.value = option.value;
                    syncValue();
                    
                    if (hasPopover) {
                        panel.hidePopover();
                    } else {
                        panel.classList.remove('show');
                        trigger.classList.remove('active');
                    }
                    
                    // Dispatch change event to trigger filters
                    const event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                }
            });
            panel.appendChild(optDiv);
        });
        syncValue();
    }

    // Trigger toggle handler
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (hasPopover) {
            const isShowing = panel.matches(':popover-open');
            // Close all other popovers
            document.querySelectorAll('.custom-select-panel').forEach(p => {
                if (p !== panel && typeof p.hidePopover === 'function' && p.matches(':popover-open')) {
                    p.hidePopover();
                }
            });
            
            if (isShowing) {
                panel.hidePopover();
            } else {
                panel.showPopover();
                positionPanel(); // Position AFTER showing popover!
            }
        } else {
            const isShowing = panel.classList.contains('show');
            // Close all other custom dropdown panels
            document.querySelectorAll('.custom-select-panel.show').forEach(p => {
                if (p !== panel) {
                    p.classList.remove('show');
                    p.previousElementSibling.classList.remove('active');
                }
            });
            
            if (isShowing) {
                panel.classList.remove('show');
                trigger.classList.remove('active');
            } else {
                panel.classList.add('show');
                trigger.classList.add('active');
                positionPanel();
            }
        }
    });

    if (!hasPopover) {
        // Fallback close when clicking elsewhere
        document.addEventListener('click', () => {
            panel.classList.remove('show');
            trigger.classList.remove('active');
        });
    }

    // Build the initial set of options
    rebuildOptions();

    // Observe future select option mutations (e.g. dynamic population)
    const observer = new MutationObserver(() => {
        rebuildOptions();
    });
    observer.observe(select, { childList: true });

    // Intercept select.value assignments to keep custom UI in sync (for single select)
    if (!isMultiple) {
        const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
        Object.defineProperty(select, 'value', {
            get() {
                return originalDescriptor.get.call(this);
            },
            set(val) {
                originalDescriptor.set.call(this, val);
                syncValue();
            }
        });
    }
}

function initCustomDropdowns() {
    const targets = [
        '#filter-broker',
        '#filter-poc',
        '#filter-agent',
        '#filter-hide-smallcase-rm',
        '#monthly-month-select',
        '#monthly-year-select',
        '#agent-perf-select'
    ];
    targets.forEach(selector => {
        const select = document.querySelector(selector);
        if (select) {
            convertSelectToCustomDropdown(select);
        }
    });

    // Globally close popover dropdown panels on scroll/resize to prevent drifting
    window.addEventListener('scroll', () => {
        document.querySelectorAll('.custom-select-panel').forEach(p => {
            if (typeof p.hidePopover === 'function' && p.matches(':popover-open')) {
                p.hidePopover();
            }
        });
        const drp = document.getElementById('drp-popup');
        if (drp && typeof drp.hidePopover === 'function' && drp.matches(':popover-open')) {
            drp.hidePopover();
        }
    }, { passive: true });

    window.addEventListener('resize', () => {
        document.querySelectorAll('.custom-select-panel').forEach(p => {
            if (typeof p.hidePopover === 'function' && p.matches(':popover-open')) {
                p.hidePopover();
            }
        });
        const drp = document.getElementById('drp-popup');
        if (drp && typeof drp.hidePopover === 'function' && drp.matches(':popover-open')) {
            drp.hidePopover();
        }
    });
}

