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
    datePreset: 'week', // default is Current Week
    dateFrom: '',
    dateTo: '',
    channel: 'all', // Combined, Call Ticket, WhatsApp Chat
    broker: 'all',
    poc: 'all',
    agent: 'all',
    searchQuery: ''
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

// Colors Matching CSS variables
const THEME_COLORS = {
    purple: '#a78bfa',     // Soft Violet
    blue: '#00d4ff',       // Electric Cyan
    green: '#10b981',      // Emerald
    red: '#f43f5e',        // Coral Red
    yellow: '#fbbf24',     // Warm Amber
    gray: '#64748b',
    border: 'rgba(255, 255, 255, 0.16)', // dark mode border
    textPrimary: '#f0f4ff', // dark mode primary text
    textSecondary: '#cbd5e1' // dark mode secondary text
};

// Hex to RGBA Utility for gradients & glow effects
function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// -------------------------------------------------------------
// 1. DATA INITIALIZATION & ENTRY
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    setupEventListeners();
});

async function loadDashboardData() {
    try {
        console.log("No live data loaded. Initializing empty skeleton data structure.");
        rawData = {
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
        
        // Show generation timestamp
        document.getElementById('data-gen-time').innerText = rawData.generated_at || 'Recently';
        
        // Populate filter dropdown choices
        populateFilterDropdowns();
        
        // Establish default date range (Current Week)
        setDefaultDateRange();
        
        // Run reactive view model compiler
        buildViewModel();
    } catch (error) {
        console.error("Dashboard Load Error:", error);
        alert("Error loading B2B data file. Please ensure preprocess.py has run successfully.");
    }
}

// -------------------------------------------------------------
// 2. FILTER MANAGEMENT & EVENT LISTENERS
// -------------------------------------------------------------

function setupEventListeners() {
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
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const fromEl = document.getElementById('filter-date-from');
                if (fromEl) {
                    if (typeof fromEl.showPicker === 'function') {
                        try {
                            fromEl.showPicker();
                        } catch (e) {
                            fromEl.focus();
                        }
                    } else {
                        fromEl.focus();
                    }
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

    // Custom date apply
    document.getElementById('apply-date-btn').addEventListener('click', () => {
        const from = document.getElementById('filter-date-from').value;
        const to = document.getElementById('filter-date-to').value;
        if (!from || !to) {
            alert("Please select both start and end dates.");
            return;
        }
        activeFilters.datePreset = 'custom';
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        activeFilters.dateFrom = from;
        activeFilters.dateTo = to;
        buildViewModel();
    });

    // Quick Channel Pills selector (Combined, Call Ticket, WhatsApp)
    document.querySelectorAll('.pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            activeFilters.channel = btn.getAttribute('data-channel');
            buildViewModel();
        });
    });

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
            searchQuery: ''
        };
        
        document.querySelectorAll('.preset-btn').forEach(b => {
            b.classList.remove('active');
            if (b.getAttribute('data-preset') === 'week') b.classList.add('active');
        });
        
        document.querySelectorAll('.pill-btn').forEach(b => {
            b.classList.remove('active');
            if (b.getAttribute('data-channel') === 'all') b.classList.add('active');
        });
        
        document.getElementById('filter-broker').value = 'all';
        document.getElementById('filter-poc').value = 'all';
        document.getElementById('filter-agent').value = 'all';
        
        setDefaultDateRange();
        buildViewModel();
    });

    // Dropdown filters
    document.getElementById('filter-broker').addEventListener('change', (e) => {
        activeFilters.broker = e.target.value;
        buildViewModel();
    });
    document.getElementById('filter-poc').addEventListener('change', (e) => {
        activeFilters.poc = e.target.value;
        buildViewModel();
    });
    document.getElementById('filter-agent').addEventListener('change', (e) => {
        activeFilters.agent = e.target.value;
        buildViewModel();
    });

    // Theme Switcher (Light/Dark)
    document.getElementById('theme-toggle-btn').addEventListener('click', (e) => {
        const toggleTheme = () => {
            const body = document.body;
            const btnText = document.querySelector('.theme-text');
            
            if (body.classList.contains('dark-mode')) {
                body.classList.remove('dark-mode');
                body.classList.add('light-mode');
                if (btnText) btnText.innerText = 'Dark Mode';
                THEME_COLORS.textPrimary = '#0f172a';
                THEME_COLORS.textSecondary = '#334155';
                THEME_COLORS.border = 'rgba(0, 0, 0, 0.12)';
                THEME_COLORS.blue = '#0284c7';       // Sky Blue
                THEME_COLORS.purple = '#8b5cf6';     // Bright Violet
                THEME_COLORS.green = '#059669';      // Forest Green
                THEME_COLORS.red = '#e11d48';        // Rose Red
                THEME_COLORS.yellow = '#d97706';     // Amber Yellow
            } else {
                body.classList.remove('light-mode');
                body.classList.add('dark-mode');
                if (btnText) btnText.innerText = 'Light Mode';
                THEME_COLORS.textPrimary = '#f0f4ff';
                THEME_COLORS.textSecondary = '#cbd5e1';
                THEME_COLORS.border = 'rgba(255, 255, 255, 0.16)';
                THEME_COLORS.blue = '#00d4ff';       // Electric Cyan
                THEME_COLORS.purple = '#a78bfa';     // Soft Violet
                THEME_COLORS.green = '#10b981';      // Emerald
                THEME_COLORS.red = '#f43f5e';        // Coral Red
                THEME_COLORS.yellow = '#fbbf24';     // Warm Amber
            }
            
            buildViewModel();
        };

        const isAppearanceTransition = document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (!isAppearanceTransition) {
            toggleTheme();
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = document.startViewTransition(() => {
            toggleTheme();
        });

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`
            ];
            document.documentElement.animate(
                {
                    clipPath: clipPath
                },
                {
                    duration: 500,
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    pseudoElement: '::view-transition-new(root)'
                }
            );
        });
    });

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
        'tab-neo': 'B2B Neo'
    };
    document.getElementById('page-title').innerText = titleMap[tabId];
    
    if (tabId === 'tab-weekly-pulse') {
        buildViewModel();
    }
}

function populateFilterDropdowns() {
    const brokers = new Set();
    const pocs = new Set();
    const agents = new Set();
    
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
    });
    
    const brokerSelect = document.getElementById('filter-broker');
    brokerSelect.innerHTML = '<option value="all">All Broker Families</option>';
    Array.from(brokers).sort().forEach(b => {
        brokerSelect.innerHTML += `<option value="${b}">${b}</option>`;
    });
    
    const pocSelect = document.getElementById('filter-poc');
    pocSelect.innerHTML = '<option value="all">All Assigned POCs</option>';
    Array.from(pocs).sort().forEach(p => {
        pocSelect.innerHTML += `<option value="${p}">${p}</option>`;
    });
    
    const agentSelect = document.getElementById('filter-agent');
    agentSelect.innerHTML = '<option value="all">All Support Agents</option>';
    Array.from(agents).sort().forEach(a => {
        agentSelect.innerHTML += `<option value="${a}">${a}</option>`;
    });
}

function setDefaultDateRange() {
    setDateRangeFromPreset('week');
}

function setDateRangeFromPreset(preset) {
    // Current local time inside context is June 3, 2026 (Wednesday)
    const baseDate = new Date("2026-06-03T12:00:00");
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
        // June 3, 2026
        fromDate = baseDate;
        toDate = baseDate;
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
                const d = new Date(item.date);
                if (d < earliest) earliest = d;
            }
        });
        fromDate = earliest;
    }
    
    activeFilters.dateFrom = format(fromDate);
    activeFilters.dateTo = format(toDate);
    
    document.getElementById('filter-date-from').value = activeFilters.dateFrom;
    document.getElementById('filter-date-to').value = activeFilters.dateTo;
}

// Helper to compute previous comparative period dates
function getPreviousPeriodDates(fromStr, toStr) {
    const from = new Date(fromStr + 'T00:00:00');
    const to = new Date(toStr + 'T23:59:59');
    const diff = to.getTime() - from.getTime(); // duration of current period
    
    const prevTo = new Date(from.getTime() - 1000); // 1 sec before current from
    const prevFrom = new Date(prevTo.getTime() - diff);
    
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
    if (!rawData || currentTab !== 'tab-weekly-pulse') return;
    
    const fromTs = new Date(activeFilters.dateFrom + 'T00:00:00').getTime();
    const toTs = new Date(activeFilters.dateTo + 'T23:59:59').getTime();
    
    // Filter active interactions
    const filteredInteractions = rawData.support_interactions.filter(item => {
        if (!item.date) return false;
        const itemTs = new Date(item.date).getTime();
        if (itemTs < fromTs || itemTs > toTs) return false;
        
        if (activeFilters.channel !== 'all' && item.type !== activeFilters.channel) return false;
        if (activeFilters.broker !== 'all' && item.broker_family !== activeFilters.broker) return false;
        if (activeFilters.poc !== 'all' && item.poc !== activeFilters.poc) return false;
        if (activeFilters.agent !== 'all' && item.agent !== activeFilters.agent) return false;
        
        return true;
    });

    // Filter active raw call logs
    const filteredCalls = rawData.calls.filter(call => {
        if (!call.date) return false;
        const callTs = new Date(call.date).getTime();
        if (callTs < fromTs || callTs > toTs) return false;
        
        if (activeFilters.channel !== 'all' && activeFilters.channel !== 'Call Ticket' && activeFilters.channel !== 'Voice Call') return false;
        if (activeFilters.broker !== 'all' && call.broker_family !== activeFilters.broker) return false;
        if (activeFilters.poc !== 'all' && call.poc !== activeFilters.poc) return false;
        if (activeFilters.agent !== 'all' && call.agent !== activeFilters.agent) return false;
        
        return true;
    });

    // Get previous comparative period data
    const prevPeriod = getPreviousPeriodDates(activeFilters.dateFrom, activeFilters.dateTo);
    const prevFromTs = new Date(prevPeriod.from + 'T00:00:00').getTime();
    const prevToTs = new Date(prevPeriod.to + 'T23:59:59').getTime();
    
    const prevInteractions = rawData.support_interactions.filter(item => {
        if (!item.date) return false;
        const itemTs = new Date(item.date).getTime();
        if (itemTs < prevFromTs || itemTs > prevToTs) return false;
        
        if (activeFilters.channel !== 'all' && item.type !== activeFilters.channel) return false;
        if (activeFilters.broker !== 'all' && item.broker_family !== activeFilters.broker) return false;
        if (activeFilters.poc !== 'all' && item.poc !== activeFilters.poc) return false;
        if (activeFilters.agent !== 'all' && item.agent !== activeFilters.agent) return false;
        
        return true;
    });

    window.viewModel = {
        interactions: filteredInteractions,
        calls: filteredCalls,
        prevInteractions: prevInteractions,
        fromTs,
        toTs,
        prevFromTs,
        prevToTs
    };

    // Render components
    renderWeeklyPulseDashboard();
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
    let callAns = 0;
    let totalCallDuration = 0;
    let totalCallQueue = 0;
    
    calls.forEach(call => {
        const st = String(call.stage || "").toLowerCase();
        if (st === 'answered' || st === 'connected') {
            callAns++;
            totalCallDuration += (call.talk_time || call.duration || 0);
            totalCallQueue += (call.queue_time || call.time_to_answer || 0);
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
        if (!sec || isNaN(sec)) return "-";
        if (sec > 3600) {
            const hrs = (sec / 3600).toFixed(1);
            return `${hrs} hrs`;
        }
        const m = Math.floor(sec / 60);
        const s = Math.round(sec % 60);
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    document.getElementById('pulse-total-interactions').innerText = (tkt + wa + mail).toLocaleString();
    document.getElementById('pulse-call-tickets').innerText = tkt.toLocaleString();
    document.getElementById('pulse-whatsapp-chats').innerText = wa.toLocaleString();
    
    document.getElementById('pulse-answered-calls').innerText = ans.toLocaleString();
    document.getElementById('pulse-missed-calls').innerText = missed.toLocaleString();
    document.getElementById('pulse-aoh-calls').innerText = aoh.toLocaleString();
    
    document.getElementById('pulse-aht').innerText = formatDuration(finalAHT);
    document.getElementById('pulse-aqt').innerText = formatDuration(finalAQT);
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
    Object.values(pocStats).sort((a,b) => b.total - a.total).forEach(poc => {
        const name = poc.pocName;
        const total = poc.total;
        const wa = poc.wa;
        const tkt = poc.tkt;
        
        const topBr = Object.keys(poc.branches).sort((a,b) => poc.branches[b] - poc.branches[a])[0] || 'NA';
        const topRM = Object.keys(poc.rms).sort((a,b) => poc.rms[b] - poc.rms[a])[0] || 'NA';
        const topIssue = Object.keys(poc.issues).sort((a,b) => poc.issues[b] - poc.issues[a])[0] || 'NA';
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
    
    const sorted = Object.entries(pocCounts).sort((a,b) => b[1] - a[1]);
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
                loopGroups[k].push(new Date(item.date).getTime());
            } catch(e){}
        });
        let c = 0;
        Object.values(loopGroups).forEach(tss => {
            if (tss.length < 2) return;
            tss.sort((a,b) => a - b);
            for (let i = 1; i < tss.length; i++) {
                if (tss[i] - tss[i-1] <= 7 * 24 * 60 * 60 * 1000) c++;
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
            loopGroups[key].push(new Date(item.date).getTime());
        } catch(e){}
    });

    const list = [];
    Object.entries(loopGroups).forEach(([k, tss]) => {
        if (tss.length < 2) return;
        tss.sort((a,b) => a - b);
        let count = 0;
        for (let i = 1; i < tss.length; i++) {
            if (tss[i] - tss[i-1] <= 7 * 24 * 60 * 60 * 1000) count++;
        }
        if (count > 0) {
            const [rm, broker, branch, issue] = k.split('||');
            list.push({ rm, broker, branch, issue, count });
        }
    });

    list.sort((a,b) => b.count - a.count);
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

    const sorted = Object.values(hotspots).sort((a,b) => b.count - a.count).slice(0, 5);
    
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
        const sorted = Object.entries(obj).sort((a,b) => b[1] - a[1]);
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

    const sorted = Object.entries(optionCounts).sort((a,b) => b[1] - a[1]);
    
    if (sorted.length === 0) {
        list.innerHTML = '<div class="text-muted" style="padding: 10px;">No explorer options found.</div>';
        document.getElementById('explorer-dissect-empty').classList.remove('hidden');
        document.getElementById('explorer-dissect-content').classList.add('hidden');
        const leftPane = document.querySelector('.explorer-left-pane');
        if (leftPane) {
            leftPane.style.maxHeight = 'none';
            leftPane.style.height = 'auto';
        }
        return;
    }

    sorted.forEach(([opt, count]) => {
        const btn = document.createElement('button');
        btn.className = 'explorer-item-btn';
        if (explorerSelectedOption === opt) btn.classList.add('selected');
        
        btn.innerHTML = `
            <span>${opt}</span>
            <span class="explorer-item-val">${count}</span>
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
        
        const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 4);
        if (sorted.length === 0) return;
        
        const card = document.createElement('div');
        card.className = 'dissect-card';
        card.innerHTML = `<h4 class="dissect-title">${dimTitles[dim]}</h4>`;
        
        const listDiv = document.createElement('div');
        listDiv.className = 'dissect-items-list';
        
        sorted.forEach(([lbl, cnt]) => {
            const pct = totalCount > 0 ? Math.round((cnt / totalCount) * 100) : 0;
            
            listDiv.innerHTML += `
                <div class="dissect-items-row-wrapper" style="margin-bottom: 6px;">
                    <div class="dissect-row">
                        <span class="dissect-lbl">${lbl}</span>
                        <span class="dissect-val">${cnt} (${pct}%)</span>
                    </div>
                    <div class="dissect-bar-container">
                        <div class="dissect-bar-track">
                            <div class="dissect-bar-fill" style="width: ${pct}%;"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        card.appendChild(listDiv);
        dissectGrid.appendChild(card);
    });

    // Match the vertical scroll height of the left option pane with the right dissection pane
    setTimeout(() => {
        const leftPane = document.querySelector('.explorer-left-pane');
        const rightPane = document.querySelector('.explorer-right-pane');
        if (leftPane && rightPane) {
            leftPane.style.maxHeight = 'none';
            leftPane.style.height = 'auto';
            
            const rightHeight = rightPane.offsetHeight;
            if (rightHeight > 100) {
                leftPane.style.maxHeight = `${rightHeight}px`;
                leftPane.style.height = `${rightHeight}px`;
            }
        }
    }, 100);
}

// -------------------------------------------------------------
// 6. COMMENT PREVIEWS & AI NARRATIVE SUMMARIZER
// -------------------------------------------------------------

function renderCommentsPreview(data) {
    const list = document.getElementById('pulse-comments-preview-list');
    list.innerHTML = '';
    
    const withComments = data.filter(item => item.comments && item.comments.trim().length > 10);
    const sorted = withComments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    
    // Prepare first 60 comments to build prompt payload
    const selectedComments = withComments.slice(0, 60).map((r, i) => {
        return `${i + 1}. [RM=${r.rm_name} | Branch=${r.branch} | Broker=${r.broker_family} | Issue=${r.issue}]: ${r.comments.substring(0, 150)}`;
    }).join("\n");
    
    if (!selectedComments) {
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
        alert("Not enough logs with comments found in selected date range to generate AI summary.");
        return;
    }

    // API Setup
    // Key imported directly from Code.gs
    const key = "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";
    
    const prompt = 
        `You are analyzing B2B fintech support ticket logs for smallcase dashboard. Here is a list of raw interaction comments:\n\n` +
        `RECORDS:\n${selectedComments}\n\n` +
        `TASK:\n` +
        `Provide a premium summary including key findings, observations, and recommendations. Group the records into clusters.\n` +
        `Return ONLY a raw JSON string matching this structure:\n` +
        `{"narrative": "<h4>🔍 Key Observations</h4><ul><li><strong>Hotspot:</strong> Describe friction...</li></ul><h4>💡 Actionable Recommendations</h4><ul><li>Initiate...</li></ul>"}`;

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
    // Basic Keyword grouping for offline text summaries
    const clusters = {
        "SIP & Order Failures": 0,
        "Login & Credentials": 0,
        "Payout & Settlements": 0,
        "API Integration Issues": 0
    };
    
    commentsList.forEach(item => {
        const comm = item.comments.toLowerCase();
        if (comm.includes('sip') || comm.includes('order') || comm.includes('execute')) clusters["SIP & Order Failures"]++;
        else if (comm.includes('login') || comm.includes('password') || comm.includes('otp')) clusters["Login & Credentials"]++;
        else if (comm.includes('payout') || comm.includes('settle') || comm.includes('payouts')) clusters["Payout & Settlements"]++;
        else if (comm.includes('api') || comm.includes('feed') || comm.includes('integration')) clusters["API Integration Issues"]++;
    });

    let clustersHTML = '<h4>🔍 Friction Themes & Keyword Clusterting (Local Rules Engine)</h4><ul>';
    Object.entries(clusters).forEach(([theme, count]) => {
        if (count > 0) {
            clustersHTML += `<li><strong>${theme}:</strong> Detected in ${count} support interaction transcripts.</li>`;
        }
    });
    clustersHTML += '</ul>';

    // Build recommendations
    const recomHTML = `
        <h4>💡 Actionable Recommendations</h4>
        <ul>
            <li><strong>Partner Portal Update:</strong> Investigate SIP execution delays reported by RMs at top branches.</li>
            <li><strong>Broker sync:</strong> Resolve feed integration failures for partners experiencing order rejection.</li>
            <li><strong>Staff training:</strong> Prioritize onboarding guides to reduce repeat query login requests.</li>
        </ul>
    `;
    
    return clustersHTML + recomHTML;
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
    
    const sortedBranches = Object.entries(branchCounts).sort((a,b) => b[1] - a[1]);
    if (sortedBranches.length === 0) {
        branchBody.innerHTML = '<tr><td colspan="3" class="text-muted text-center" style="text-align: center;">No branch data in selected range.</td></tr>';
    } else {
        sortedBranches.forEach(([key, count]) => {
            const [branch, broker] = key.split('||');
            branchBody.innerHTML += `
                <tr>
                    <td><strong>${branch}</strong></td>
                    <td><span class="badge">${broker}</span></td>
                    <td class="text-right"><strong>${count}</strong></td>
                </tr>
            `;
        });
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
    
    const sortedRMs = Object.entries(rmCounts).sort((a,b) => b[1] - a[1]);
    if (sortedRMs.length === 0) {
        rmBody.innerHTML = '<tr><td colspan="4" class="text-muted text-center" style="text-align: center;">No RM contacts in selected range.</td></tr>';
    } else {
        sortedRMs.forEach(([key, count]) => {
            const [rm, broker] = key.split('||');
            // Check if RM is an outlier in rawData
            const isOutlier = rawData && rawData.outliers && rawData.outliers.some(o => o.rm_name.toLowerCase() === rm.toLowerCase() && o.is_outlier);
            const statusLabel = isOutlier ? '<span class="text-red">⚠️ Outlier</span>' : '<span class="text-green">Normal</span>';
            rmBody.innerHTML += `
                <tr>
                    <td><strong>${rm}</strong></td>
                    <td><span class="badge">${broker}</span></td>
                    <td class="text-right"><strong>${count}</strong></td>
                    <td class="text-right">${statusLabel}</td>
                </tr>
            `;
        });
    }
    
    // Populate Interactions table (Raw Audit Trail)
    const recordsBody = document.getElementById('poc-modal-records-body');
    recordsBody.innerHTML = '';
    
    const sortedRecords = [...pocInteractions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sortedRecords.length === 0) {
        recordsBody.innerHTML = '<tr><td colspan="9" class="text-muted text-center" style="text-align: center;">No raw interactions found in selected range.</td></tr>';
    } else {
        sortedRecords.forEach(item => {
            recordsBody.innerHTML += `
                <tr>
                    <td>${item.date || '-'}</td>
                    <td><code>${item.id || '-'}</code></td>
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
    }
    
    // Open Modal
    modal.classList.add('open');
}

