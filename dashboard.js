// ==========================================================================
// B2B GROWTH & SUPPORT ANALYTICS DASHBOARD - FRONTEND ENGINE
// ==========================================================================

// Global State
let rawData = null;
let currentTab = 'tab-weekly-pulse';
let activeFilters = {
    datePreset: '30d', // default is Last 30 Days to match screenshot data
    dateFrom: '',
    dateTo: '',
    channel: 'all', // Combined, Call Ticket, WhatsApp Chat
    broker: 'all',
    poc: 'all',
    agent: 'all',
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
    if (dStr.includes('T')) return new Date(dStr);
    return new Date(dStr.replace(' ', 'T'));
}

function getDevRevLinkHTML(id, type) {
    if (!id || id === '-') return '-';
    const cleanId = String(id).trim();
    if (type === 'WhatsApp Chat' || cleanId.startsWith('CONV-')) {
        return `<a href="https://app.devrev.ai/smallcasebp/inbox/${cleanId}" target="_blank" class="devrev-id-link"><code>${cleanId}</code></a>`;
    } else if (type === 'Call Ticket' || type === 'Care Email' || cleanId.startsWith('TKT-') || cleanId.startsWith('REV-')) {
        return `<a href="https://app.devrev.ai/smallcasebp/works/${cleanId}" target="_blank" class="devrev-id-link"><code>${cleanId}</code></a>`;
    }
    return `<code>${cleanId}</code>`;
}

// Colors Matching CSS variables (Light Mode default)
const THEME_COLORS = {
    purple: '#8b5cf6',     // Bright Violet
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
        let d = new Date(s);
        if (!isNaN(d.getTime())) {
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

            tickets.push({
                "id": work_id,
                "type": "Call Ticket",
                "date": created_date,
                "close_date": close_date,
                "title": title,
                "rm_name": rm_name || "NA",
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
                "sla_rt_status": sla_rt_status
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
            let stage = cleanStr(row["Stage"]);

            let broker_name = cleanStr(row["RM Broker Name"]) || cleanStr(row["Broker ID (B2B)"]);
            let branch_loc = cleanStr(row["Branch/Location"]);
            let comments = cleanStr(row["Comments"]) || last_msg;

            let broker_fam = canonicalBroker(broker_name);
            let norm_branch = normalizeBranch(branch_loc);
            let poc = matchPoc(broker_fam, norm_branch);

            let resolution_time = null;
            for (let i = 0; i < 3; i++) {
                let metric_col = `Metric Name[${i}]`;
                let comp_col = `Completed In[${i}]`;
                if (row[metric_col] !== undefined && row[comp_col] !== undefined) {
                    if (String(row[metric_col]).trim() === 'Resolution time') {
                        try {
                            let val = parseFloat(row[comp_col]);
                            if (!isNaN(val)) {
                                resolution_time = Math.round(val * 3600); // hours to seconds
                            }
                        } catch (e) { }
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

            chats.push({
                "id": conv_id,
                "type": "WhatsApp Chat",
                "date": created_date,
                "close_date": null,
                "title": `Chat with ${rm_name || 'RM'}`,
                "rm_name": rm_name || "NA",
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
                "sla_status": "MET",
                "qa_score": "",
                "recording_url": "",
                "resolution_time": resolution_time
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

            emails.push({
                "id": work_id,
                "type": "Care Email",
                "date": created_date,
                "close_date": close_date,
                "title": title,
                "rm_name": reported_by || "NA",
                "broker_family": broker_fam,
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
                "sentiment": sentiment || "Neutral",
                "qa_greeting": cleanScore(row["Opening & Greetings (5)"]),
                "qa_grammar": cleanScore(row["Grammar (5)"]),
                "qa_acknowledgement": cleanScore(row["Acknowledgement and Assurance (15)"]),
                "qa_sla": cleanScore(row["Maintaining SLA (15)"]),
                "qa_assistance": cleanScore(row["Offer further assistance & Closing statement (5)"]),
                "qa_overall": cleanScore(row["Overall Score (45)"]),
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
                call_date = `${call_date_val} ${start_time_val}`;
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
                "sub_issue": disposition || call_event || "General",
                "agent": agent || "System",
                "stage": status || "Answered",
                "comments": `Voice call log: ${disposition} / ${call_event}`,
                "duration": duration,
                "recording_url": rec_url,
                "talk_time": talk_time,
                "hold_time": hold_time,
                "queue_time": queue_time,
                "time_to_answer": time_to_answer,
                "call_type": call_type
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
    loadDashboardData();
    setupEventListeners();
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
                } else {
                    console.warn(`Live fetch returned status ${response.status}. Falling back to local cache.`);
                    connectionError = true;
                }
            } catch (err) {
                console.warn("Network or CORS issue fetching from Google Sheets API, falling back to local cache file. Details:", err);
                connectionError = true;
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
            updateStatusUI('error', 'Sync Failed', 'Local Fallback');
        } else {
            updateStatusUI('offline', 'Local Fallback', rawData.generated_at || 'Local');
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

        // Establish default date range (Last 30 days)
        setDefaultDateRange();

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
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const preset = btn.getAttribute('data-preset');
            activeFilters.datePreset = preset;

            // Recalculate date range
            setDateRangeFromPreset(preset);
            buildViewModel();
        });
    });

    // Custom date apply
    document.getElementById('apply-date-btn').addEventListener('click', () => {
        const from = document.getElementById('filter-date-from').value;
        const to = document.getElementById('filter-date-to').value;
        if (from && to) {
            activeFilters.datePreset = 'custom';
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            activeFilters.dateFrom = from;
            activeFilters.dateTo = to;
            buildViewModel();
        }
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

    // Theme Switcher (Light / Dark / Black)
    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
        const body = document.body;
        const btnText = document.querySelector('.theme-text');

        if (body.classList.contains('light-mode')) {
            // Light -> Dark
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            btnText.innerText = 'Black Mode';
            THEME_COLORS.textPrimary = '#f0f4ff';
            THEME_COLORS.textSecondary = '#cbd5e1';
            THEME_COLORS.border = 'rgba(255, 255, 255, 0.16)';
            THEME_COLORS.blue = '#00d4ff';       // Electric Cyan
            THEME_COLORS.purple = '#a78bfa';     // Soft Violet
            THEME_COLORS.green = '#10b981';      // Emerald
            THEME_COLORS.red = '#f43f5e';        // Coral Red
            THEME_COLORS.yellow = '#fbbf24';     // Warm Amber
        } else if (body.classList.contains('dark-mode')) {
            // Dark -> Black
            body.classList.remove('dark-mode');
            body.classList.add('black-mode');
            btnText.innerText = 'Light Mode';
            THEME_COLORS.textPrimary = '#f8fafc';
            THEME_COLORS.textSecondary = '#cbd5e1';
            THEME_COLORS.border = 'rgba(255, 255, 255, 0.1)';
            THEME_COLORS.blue = '#38bdf8';       // Bright Cyan
            THEME_COLORS.purple = '#c084fc';     // Light Violet
            THEME_COLORS.green = '#34d399';      // Mint
            THEME_COLORS.red = '#fb7185';        // Rose
            THEME_COLORS.yellow = '#fcd34d';     // Amber
        } else {
            // Black -> Light
            body.classList.remove('black-mode');
            body.classList.add('light-mode');
            btnText.innerText = 'Dark Mode';
            THEME_COLORS.textPrimary = '#0f172a';
            THEME_COLORS.textSecondary = '#334155';
            THEME_COLORS.border = 'rgba(0, 0, 0, 0.07)';
            THEME_COLORS.blue = '#0284c7';       // Sky Blue
            THEME_COLORS.purple = '#8b5cf6';     // Bright Violet
            THEME_COLORS.green = '#059669';      // Forest Green
            THEME_COLORS.red = '#e11d48';        // Rose Red
            THEME_COLORS.yellow = '#d97706';     // Amber Yellow
        }

        buildViewModel();
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
    if (!rawData) return;
    // Guide tab has no dynamic data
    if (currentTab === 'tab-guide') return;

    const fromTs = new Date(activeFilters.dateFrom + 'T00:00:00').getTime();
    const toTs = new Date(activeFilters.dateTo + 'T23:59:59').getTime();

    // Filter active interactions
    const filteredInteractions = rawData.support_interactions.filter(item => {
        if (!item.date) return false;
        const itemTs = safeParseDate(item.date).getTime();
        if (itemTs < fromTs || itemTs > toTs) return false;

        // Optionally include Care Emails
        if (item.type === 'Care Email' && !activeFilters.includeCareEmails) return false;

        if (activeFilters.channel !== 'all' && item.type !== activeFilters.channel) return false;
        if (activeFilters.broker !== 'all' && item.broker_family !== activeFilters.broker) return false;
        if (activeFilters.poc !== 'all' && item.poc !== activeFilters.poc) return false;
        if (activeFilters.agent !== 'all' && item.agent !== activeFilters.agent) return false;

        return true;
    });

    // Filter active raw call logs
    const filteredCalls = rawData.calls.filter(call => {
        if (!call.date) return false;
        const callTs = safeParseDate(call.date).getTime();
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
        const itemTs = safeParseDate(item.date).getTime();
        if (itemTs < prevFromTs || itemTs > prevToTs) return false;

        // Optionally include Care Emails
        if (item.type === 'Care Email' && !activeFilters.includeCareEmails) return false;

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
            totalCallDuration += (call.duration || 0);
        }
        totalCallQueue += (call.queue_time || 0);
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
        finalAQT = calls.length > 0 ? totalCallQueue / calls.length : 0;
    } else {
        // Combined
        if (callAns > 0) {
            finalAHT = totalCallDuration / callAns;
        } else {
            finalAHT = chatCount > 0 ? totalChatResolution / chatCount : 0;
        }
        finalAQT = calls.length > 0 ? totalCallQueue / calls.length : 0;
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

    const totalDescEl = document.getElementById('pulse-total-desc');
    if (totalDescEl) {
        totalDescEl.innerText = activeFilters.includeCareEmails
            ? 'WhatsApp Chats + Call Tickets + Care Emails'
            : 'WhatsApp Chats + Call Tickets';
    }

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

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
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

    const sortedBranches = Object.entries(branchCounts).sort((a, b) => b[1] - a[1]);
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

    const sortedRMs = Object.entries(rmCounts).sort((a, b) => b[1] - a[1]);
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

    const sortedRecords = [...pocInteractions].sort((a, b) => safeParseDate(b.date).getTime() - safeParseDate(a.date).getTime());
    if (sortedRecords.length === 0) {
        recordsBody.innerHTML = '<tr><td colspan="9" class="text-muted text-center" style="text-align: center;">No raw interactions found in selected range.</td></tr>';
    } else {
        sortedRecords.forEach(item => {
            recordsBody.innerHTML += `
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

    // Determine the data subset based on type
    if (type === 'interactions') {
        entries = interactions;
    } else if (type === 'tickets') {
        entries = interactions.filter(item => item.type === 'Call Ticket');
    } else if (type === 'whatsapp') {
        entries = interactions.filter(item => item.type === 'WhatsApp Chat');
    } else if (type === 'answered') {
        entries = interactions.filter(item => {
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
        entries = interactions.filter(item => {
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
        entries = interactions.filter(item => {
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
        entries = calls.filter(call => {
            const st = String(call.stage || "").toLowerCase();
            return st === 'answered' || st === 'connected';
        });
        isCallBased = true;
    } else if (type === 'aqt') {
        // Average Queue Time is calculated over all Ozonetel calls (irrespective of stage)
        entries = calls;
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
            sorted.forEach(item => {
                tableBody.innerHTML += `
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
            sorted.forEach(call => {
                const badgeClass = String(call.stage || "").toLowerCase() === 'answered' || String(call.stage || "").toLowerCase() === 'connected' ? 'text-green' : 'text-red';
                tableBody.innerHTML += `
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

    // Avg/Day: totalInteractions / number of days in selected date range
    const fromD = new Date(activeFilters.dateFrom + 'T00:00:00');
    const toD = new Date(activeFilters.dateTo + 'T23:59:59');
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
        const d = item.date.split('T')[0];
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
            const d = item.date.split('T')[0];
            if (waCounts[d] !== undefined) waCounts[d]++;
        }
    });
    const waPoints = datesArray.map(d => waCounts[d]);

    // Care Emails Over Time
    const emailCounts = {};
    datesArray.forEach(d => { emailCounts[d] = 0; });
    data.forEach(item => {
        if (item.type === 'Care Email' && item.date) {
            const d = item.date.split('T')[0];
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
        const sub = item.sub_issue || "General";
        const poc = item.poc;

        if (broker && broker !== 'NA') {
            topBrokers[broker] = (topBrokers[broker] || 0) + 1;
        }
        if (poc && poc !== 'No POC' && poc !== 'Not shared') {
            pocHotspots[poc] = (pocHotspots[poc] || 0) + 1;
        }

        if (item.type === 'Call Ticket') {
            if (rm && rm !== 'NA') topRMsCalls[rm] = (topRMsCalls[rm] || 0) + 1;
            if (sub) topIssuesCalls[sub] = (topIssuesCalls[sub] || 0) + 1;
        }
        else if (item.type === 'WhatsApp Chat') {
            if (rm && rm !== 'NA') topRMsWhatsApp[rm] = (topRMsWhatsApp[rm] || 0) + 1;
            if (sub) topIssuesWhatsApp[sub] = (topIssuesWhatsApp[sub] || 0) + 1;
        }
        else if (item.type === 'Care Email') {
            if (rm && rm !== 'NA') topRMsEmails[rm] = (topRMsEmails[rm] || 0) + 1;
            if (sub) topIssuesEmails[sub] = (topIssuesEmails[sub] || 0) + 1;
        }
    });

    // Render Row 3 Bar Charts
    vcCharts.topRMsCalls = makeTopHBarChart('vc-chart-top-rms-calls', 'Calls', topRMsCalls, THEME_COLORS.purple);
    vcCharts.topRMsWhatsApp = makeTopHBarChart('vc-chart-top-rms-whatsapp', 'Chats', topRMsWhatsApp, THEME_COLORS.green);
    vcCharts.topRMsEmails = makeTopHBarChart('vc-chart-top-rms-emails', 'Emails', topRMsEmails, THEME_COLORS.yellow);
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

    // Draw nodes
    topBrokers.forEach(([broker, brVal], i) => {
        drawNode(broker, brVal, x0, y0s[i]);
    });
    topBranches.forEach(([branch, bhVal], j) => {
        drawNode(branch, bhVal, x1, y1s[j]);
    });
    topIssues.forEach(([issue, isVal], k) => {
        drawNode(issue, isVal, x2, y2s[k]);
    });

    // Column labels
    ctx.fillStyle = subTextColor;
    ctx.font = 'bold 8px SF Pro Display';
    ctx.textAlign = 'center';
    ctx.fillText('BROKER', x0 + nodeW / 2, 12);
    ctx.fillText('BRANCH', x1 + nodeW / 2, 12);
    ctx.fillText('ISSUE CATEGORY', x2 + nodeW / 2, 12);
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
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
    return `${(sec / 3600).toFixed(1)}h`;
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
    if (!s || isNaN(s)) return '-';
    s = Math.round(s);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s/60)}m ${s%60}s`;
    return `${(s/3600).toFixed(1)}h`;
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
}

function renderCallsDeepDive(data, calls) {
    destroyChartGroup(mdCharts);
    const callTickets = data.filter(d => d.type === 'Call Ticket');
    const answered = callTickets.filter(t => (t.call_status||'').toLowerCase().includes('answered'));
    const missed = callTickets.filter(t => (t.call_status||'').toLowerCase().includes('missed'));
    const aoh = callTickets.filter(t => (t.call_status||'').toLowerCase().includes('aoh'));

    // AHT/AQT from calls
    const answeredCalls = calls.filter(c => (c.stage||'').toLowerCase() === 'answered' || (c.stage||'').toLowerCase() === 'connected');
    const totalDuration = answeredCalls.reduce((s, c) => s + (Number(c.duration) || 0), 0);
    const aht = answeredCalls.length ? Math.round(totalDuration / answeredCalls.length) : 0;
    const totalQueue = calls.reduce((s, c) => s + (Number(c.queue_time) || 0), 0);
    const aqt = calls.length ? Math.round(totalQueue / calls.length) : 0;

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
    callTickets.forEach(t => { const d = (t.date||'').substring(0,10); if(d) { if(!dateMap[d]) dateMap[d]={a:0,m:0,o:0}; if((t.call_status||'').toLowerCase().includes('answered')) dateMap[d].a++; else if((t.call_status||'').toLowerCase().includes('missed')) dateMap[d].m++; else dateMap[d].o++; } });
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
    wa.forEach(d => { if(d.issue && d.issue !== '-') issueCounts[d.issue] = (issueCounts[d.issue]||0)+1; });
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

    // Top Senders
    const senderCounts = {};
    emails.forEach(d => { const s = d.rm_name || 'Unknown'; if (s !== '-') senderCounts[s] = (senderCounts[s]||0)+1; });
    const topSenders = Object.entries(senderCounts).sort((a,b) => b[1]-a[1]).slice(0,8);
    const ctx3 = document.getElementById('md-email-senders-chart');
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

function renderIntelligenceDashboard() {
    const data = window.viewModel.interactions;

    // Repeat Loops
    const loopsDiv = document.getElementById('intel-repeat-loops');
    if (loopsDiv && rawData.repeat_loops) {
        const filteredLoops = rawData.repeat_loops.filter(l => l.repeat_count >= 2).sort((a,b) => b.repeat_count - a.repeat_count).slice(0, 15);
        loopsDiv.innerHTML = filteredLoops.length ? `<table class="dashboard-table" style="font-size:0.82rem;"><thead><tr><th>RM</th><th>Broker</th><th>Branch</th><th>Issue</th><th style="text-align:right">Repeats</th></tr></thead><tbody>${filteredLoops.map(l => `<tr><td>${l.rm_name}</td><td>${l.broker_family}</td><td>${l.branch}</td><td>${l.issue}</td><td style="text-align:right"><span class="freq-badge high">${l.repeat_count}</span></td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--text-muted);text-align:center;padding:20px;">No repeat loops detected in this period.</p>';
    }

    // Outlier Detection
    const outliersDiv = document.getElementById('intel-outliers');
    if (outliersDiv && rawData.outliers) {
        const outliers = rawData.outliers.filter(o => o.is_outlier).sort((a,b) => b.contacts_per_day - a.contacts_per_day).slice(0, 15);
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
        if (rawData.repeat_loops) {
            rawData.repeat_loops.forEach(l => { if (brokerMap[l.broker_family]) brokerMap[l.broker_family].repeats += l.repeat_count; });
        }
        const brokerScores = Object.entries(brokerMap).map(([name, d]) => {
            const repeatPenalty = Math.min(30, d.repeats * 3);
            const diversityPenalty = Math.min(20, d.issues.size * 2);
            const volumeScore = Math.min(25, Math.round(d.total / 5));
            const score = Math.max(0, 100 - repeatPenalty - diversityPenalty - volumeScore);
            const grade = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'moderate' : 'poor';
            return { name, total: d.total, repeats: d.repeats, score, grade };
        }).sort((a,b) => b.score - a.score);
        healthDiv.innerHTML = brokerScores.length ? `<table class="dashboard-table" style="font-size:0.82rem;"><thead><tr><th>Broker</th><th style="text-align:right">Volume</th><th style="text-align:right">Repeats</th><th style="text-align:right">Health Score</th></tr></thead><tbody>${brokerScores.map(b => `<tr><td>${b.name}</td><td style="text-align:right">${b.total}</td><td style="text-align:right">${b.repeats}</td><td style="text-align:right"><span class="health-score-badge ${b.grade}">${b.score}/100</span></td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--text-muted);text-align:center;padding:20px;">No broker data available.</p>';
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
            if (dt) { hourGrid[dt.getDay()][dt.getHours()]++; maxVal = Math.max(maxVal, hourGrid[dt.getDay()][dt.getHours()]); }
        });
        let html = '<div style="display:flex;gap:4px;flex-direction:column;">';
        dayNames.forEach((dayName, dayIdx) => {
            html += `<div style="display:flex;align-items:center;gap:4px;"><span style="width:32px;font-size:0.72rem;color:var(--text-muted);font-weight:600;">${dayName}</span><div style="display:flex;gap:2px;flex:1;">`;
            for (let h = 0; h < 24; h++) {
                const val = hourGrid[dayIdx][h];
                const intensity = maxVal ? Math.round((val / maxVal) * 255) : 0;
                const bg = val === 0 ? 'var(--bg-card)' : `rgba(139, 92, 246, ${(intensity/255).toFixed(2)})`;
                html += `<div class="heatmap-cell" style="background:${bg};flex:1;height:24px;border-radius:3px;" title="${dayName} ${h}:00 - ${val} contacts"></div>`;
            }
            html += '</div></div>';
        });
        html += '<div style="display:flex;align-items:center;gap:4px;margin-top:4px;"><span style="width:32px;"></span><div style="display:flex;justify-content:space-between;flex:1;"><span style="font-size:0.65rem;color:var(--text-muted);">12am</span><span style="font-size:0.65rem;color:var(--text-muted);">6am</span><span style="font-size:0.65rem;color:var(--text-muted);">12pm</span><span style="font-size:0.65rem;color:var(--text-muted);">6pm</span><span style="font-size:0.65rem;color:var(--text-muted);">11pm</span></div></div>';
        html += '</div>';
        heatmapDiv.innerHTML = html;
    }

    // Sankey Flow
    const sankeyCanvas = document.getElementById('intel-sankey-canvas');
    if (sankeyCanvas && typeof renderSankeyFlowCanvas === 'function') {
        renderSankeyFlowCanvas(data);
    }
}

// ----- MONTHLY VIEW -----

function renderMonthlyView() {
    if (!rawData) return;
    const allInteractions = rawData.support_interactions;
    const allCalls = rawData.calls;

    // Populate month/year selectors
    const monthSelect = document.getElementById('monthly-month-select');
    const yearSelect = document.getElementById('monthly-year-select');
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    // Find available years/months
    const availableYears = new Set();
    allInteractions.forEach(d => { if (d.date) availableYears.add(safeParseDate(d.date).getFullYear()); });
    const yearsArr = [...availableYears].sort();

    if (yearSelect && !yearSelect._populated) {
        yearSelect._populated = true;
        yearSelect.innerHTML = yearsArr.map(y => `<option value="${y}">${y}</option>`).join('');
        yearSelect.value = yearsArr[yearsArr.length - 1];
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

    // Build date-wise data
    const rows = [];
    const totals = { calls: 0, wa: 0, emails: 0, total: 0, answered: 0, missed: 0, aoh: 0, ahtSum: 0, ahtCount: 0, aqtSum: 0, aqtCount: 0, rms: new Set(), brokers: new Set(), open: 0, closed: 0 };

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const dayInteractions = allInteractions.filter(d => d.date && d.date.substring(0,10) === dateStr);
        const dayCalls = allCalls.filter(c => c.date && c.date.substring(0,10) === dateStr);

        const callTix = dayInteractions.filter(d => d.type === 'Call Ticket');
        const wa = dayInteractions.filter(d => d.type === 'WhatsApp Chat');
        const em = dayInteractions.filter(d => d.type === 'Care Email');
        const answered = callTix.filter(t => (t.call_status||'').toLowerCase().includes('answered')).length;
        const missed = callTix.filter(t => (t.call_status||'').toLowerCase().includes('missed')).length;
        const aoh = callTix.filter(t => (t.call_status||'').toLowerCase().includes('aoh')).length;

        const answeredCalls = dayCalls.filter(c => (c.stage||'').toLowerCase() === 'answered' || (c.stage||'').toLowerCase() === 'connected');
        const aht = answeredCalls.length ? Math.round(answeredCalls.reduce((s,c) => s + (Number(c.duration)||0), 0) / answeredCalls.length) : 0;
        const aqt = dayCalls.length ? Math.round(dayCalls.reduce((s,c) => s + (Number(c.queue_time)||0), 0) / dayCalls.length) : 0;

        const uniqueRMs = new Set(); const uniqueBrokers = new Set();
        dayInteractions.forEach(d => { if (d.rm_name && d.rm_name !== '-') uniqueRMs.add(d.rm_name); if (d.broker_family && d.broker_family !== 'NA') uniqueBrokers.add(d.broker_family); });

        const openCount = dayInteractions.filter(d => ['new','open','in progress'].includes((d.stage||'').toLowerCase())).length;
        const closedCount = dayInteractions.filter(d => (d.stage||'').toLowerCase() === 'closed').length;

        const total = callTix.length + wa.length + em.length;
        rows.push({ dateStr, calls: callTix.length, wa: wa.length, emails: em.length, total, answered, missed, aoh, aht, aqt, rms: uniqueRMs.size, brokers: uniqueBrokers.size, open: openCount, closed: closedCount });

        totals.calls += callTix.length; totals.wa += wa.length; totals.emails += em.length; totals.total += total;
        totals.answered += answered; totals.missed += missed; totals.aoh += aoh;
        if (aht > 0) { totals.ahtSum += aht * answeredCalls.length; totals.ahtCount += answeredCalls.length; }
        if (aqt > 0) { totals.aqtSum += aqt * dayCalls.length; totals.aqtCount += dayCalls.length; }
        uniqueRMs.forEach(r => totals.rms.add(r)); uniqueBrokers.forEach(b => totals.brokers.add(b));
        totals.open += openCount; totals.closed += closedCount;
    }

    const tbody = document.getElementById('monthly-table-body');
    tbody.innerHTML = rows.map(r => `
        <tr class="clickable-row" data-date="${r.dateStr}">
            <td>${r.dateStr}</td><td>${r.calls}</td><td>${r.wa}</td><td>${r.emails}</td><td><strong>${r.total}</strong></td>
            <td>${r.answered}</td><td>${r.missed}</td><td>${r.aoh}</td>
            <td>${formatSecondsCompact(r.aht)}</td><td>${formatSecondsCompact(r.aqt)}</td>
            <td>${r.rms}</td><td>${r.brokers}</td><td>${r.open}</td><td>${r.closed}</td>
        </tr>
    `).join('') + `
        <tr class="aggregate-row">
            <td>TOTAL / AVG</td><td>${totals.calls}</td><td>${totals.wa}</td><td>${totals.emails}</td><td><strong>${totals.total}</strong></td>
            <td>${totals.answered}</td><td>${totals.missed}</td><td>${totals.aoh}</td>
            <td>${formatSecondsCompact(totals.ahtCount ? Math.round(totals.ahtSum/totals.ahtCount) : 0)}</td>
            <td>${formatSecondsCompact(totals.aqtCount ? Math.round(totals.aqtSum/totals.aqtCount) : 0)}</td>
            <td>${totals.rms.size}</td><td>${totals.brokers.size}</td><td>${totals.open}</td><td>${totals.closed}</td>
        </tr>
    `;

    // Click handler for date rows
    tbody.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', () => {
            const date = row.getAttribute('data-date');
            const dayData = rawData.support_interactions.filter(d => d.date && d.date.substring(0,10) === date);
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
        const avgQA = qaItems.length ? (qaItems.reduce((s,d) => s + Number(d.qa_overall), 0) / qaItems.length).toFixed(1) : '-';

        // SLA
        const frtItems = agentData.filter(d => d.sla_frt_status);
        const frtMet = frtItems.length ? Math.round(frtItems.filter(d => d.sla_frt_status === 'met').length / frtItems.length * 100) : '-';
        const rtItems = agentData.filter(d => d.sla_rt_status);
        const rtMet = rtItems.length ? Math.round(rtItems.filter(d => d.sla_rt_status === 'met').length / rtItems.length * 100) : '-';

        // Breaks from scorecards
        const scorecard = (rawData.agent_scorecards || []).find(s => s.agent_name === agent);
        const breakTime = scorecard ? scorecard.total_breaks_sec : 0;
        const occupancy = scorecard ? (scorecard.occupancy_rate * 100).toFixed(1) : '-';

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
            { label: 'QA Score', value: m.avgQA + '/45' },
            { label: 'FRT Met', value: m.frtMet + '%' },
            { label: 'RT Met', value: m.rtMet + '%' },
            { label: 'Break Time', value: formatSecondsCompact(m.breakTime) },
            { label: 'Occupancy', value: m.occupancy + '%' }
        ].map(k => `<div class="agent-score-card"><div class="score-label">${k.label}</div><div class="score-value">${k.value}</div></div>`).join('');
    }

    // Comparison Table
    const compBody = document.getElementById('agent-comparison-body');
    compBody.innerHTML = agentList.map(agent => {
        const m = agentMetrics[agent];
        const isHighlight = agent === selectedAgent;
        return `<tr class="${isHighlight ? 'highlight' : ''}">
            <td>${agent}</td><td>${m.calls}</td><td>${m.wa}</td><td>${m.emails}</td><td><strong>${m.total}</strong></td>
            <td>${formatSecondsCompact(m.avgTalkTime)}</td><td>${m.avgQA}/45</td>
            <td>${m.frtMet}%</td><td>${m.rtMet}%</td>
            <td>${formatSecondsCompact(m.breakTime)}</td><td>${m.occupancy}%</td>
        </tr>`;
    }).join('');

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
}

// ----- TICKETS & CHATS VIEW -----

let ticketsState = { statusFilter: 'all', channelFilter: 'all', search: '', page: 1, perPage: 50, sortField: 'date', sortDir: -1 };

function renderTicketsChatsView() {
    if (!rawData) return;
    // Use ALL interactions (not filtered by date for browsing), but respect global date filter
    let allData = window.viewModel.interactions.slice();

    // Setup event listeners once
    const statusPills = document.getElementById('tickets-status-pills');
    if (statusPills && !statusPills._bound) {
        statusPills._bound = true;
        statusPills.querySelectorAll('.status-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                statusPills.querySelectorAll('.status-pill').forEach(p => p.classList.remove('active'));
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

    // Apply filters
    let filtered = allData;
    if (ticketsState.statusFilter !== 'all') {
        filtered = filtered.filter(d => {
            const stage = (d.stage || '').toLowerCase().replace(/\s+/g, '_');
            return stage === ticketsState.statusFilter || stage.includes(ticketsState.statusFilter);
        });
    }
    if (ticketsState.channelFilter !== 'all') {
        filtered = filtered.filter(d => d.type === ticketsState.channelFilter);
    }
    // NOTE: renderTicketsChatsView continues in next append block (search, sort, pagination, table render)
}
