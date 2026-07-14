import pandas as pd
import json
import re
import math
from datetime import datetime

excel_path = "/Users/chanduprasad/Documents/B2b DB new/Vercel B2B - Master Dashboard.xlsx"
output_json_path = "/Users/chanduprasad/Documents/B2b DB new/dashboard_data.json"

print("Starting B2B Growth & Support Dashboard preprocessing pipeline...")

# -------------------------------------------------------------
# 1. HELPER FUNCTIONS FOR NORMALIZATION
# -------------------------------------------------------------

def clean_str(val):
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return ""
    return str(val).strip()

def canonical_broker(broker_str):
    s = clean_str(broker_str).strip().lower()
    if not s:
        return "NA"
    
    norm = re.sub(r'[^a-z0-9]', '', s)
    if norm.isdigit():
        return "NA"
        
    if 'sbi' in s:
        if 'mtf' in s:
            return "SBI MTF"
        return "SBI"
    elif 'hdfc' in s:
        if 'mtf' in s:
            return "HDFC MTF"
        elif 'sky' in s:
            return "HDFCsky"
        return "HDFC"
    elif 'axis' in s:
        if 'mtf' in s:
            return "Axis MTF"
        return "Axis"
    elif 'angel' in s:
        return "Angel One"
    elif 'fundz' in s:
        return "Fundzbazar"
    elif '5paisa' in s:
        return "5paisa"
    elif 'kotak' in s:
        return "Kotak Sec"
    elif 'smc' in s:
        return "SMC"
    elif 'iifl' in s or 'iiifl' in s:
        return "IIFL"
    elif 'nuvama' in s:
        return "Nuvama"
    elif 'fisdom' in s:
        return "Fisdom"
    elif 'trustline' in s:
        return "Trustline"
    elif 'kite' in s:
        return "Kite"
        
    invalid_keywords = ['test', 'others', 'unknown', 'not shared', 'reported', 'gmail', 'yahoo', 'mail', 'kumar', 'arista', 'ap-south-1', 'shubham', 'wright', 'investorai', 'mutualfundpartner', 'itchotels']
    if any(kw in s for kw in invalid_keywords):
        return "NA"
        
    if norm.isalpha() and len(norm) < 20 and len(norm) > 2:
        return broker_str.strip().title()
        
    return "NA"

def normalize_branch(branch_str):
    s = clean_str(branch_str)
    if not s:
        return "Not shared"
    
    # 1. Convert to lowercase and replace non-breaking spaces with standard spaces
    s = s.lower().replace('\xa0', ' ').replace('\u200b', ' ')
    
    # 2. Extract substring after last pipe if pipe present
    if '|' in s:
        s = s.split('|')[-1]
        
    # 3. Remove anything inside parentheses, including parentheses
    s = re.sub(r'\([^)]*\)', '', s)
    
    # 4. Remove words like branch, main branch, barnch, main
    s = re.sub(r'\b(main branch|branch|barnch|main)\b', ' ', s)
    
    # 5. Replace all non-alphanumeric character sequences with a single space
    s = re.sub(r'[^a-z0-9]', ' ', s)
    
    # 6. Compress spaces (remove spaces to group single letters or merge spaces)
    # E.g. "j p nagar" -> "jpnagar", "ahmedabad pbg" -> "ahmedabadpbg" or similar
    # Let's compress multiple spaces and strip spaces to standard alphanumeric representation.
    # In b2b_dashboard_essence_prompt.md: "Compress spaces (e.g. j p nagar -> jpnagar or strip spaces between single letters)"
    # Let's do: if it's multiple letters separated by spaces like "j p nagar", strip spaces.
    # To keep matching robust, let's remove ALL spaces for mapping keys, but we can also store a normalized string with compressed spaces.
    # Let's compress multiple spaces to single spaces, and also keep a stripped version (no spaces) for mapping checks.
    s = re.sub(r'\s+', ' ', s).strip()
    
    # Let's check if the branch is missing, invalid or placeholder
    placeholders = {'not shared', 'not clear', 'blank call', 'no response', 'none', 'na', 'n a', 'null', 'nan'}
    if not s or s in placeholders:
        return "Not shared"
        
    return s

def clean_phone(phone_str):
    s = clean_str(phone_str)
    # Extract only digits
    s = re.sub(r'\D', '', s)
    # If it ends with 10 digits, get the last 10 digits
    if len(s) >= 10:
        return s[-10:]
    return s

import datetime as dt
def parse_hms_to_seconds(val):
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return 0
    if isinstance(val, (int, float)):
        # Excel stores time-only values as a fraction of a 24-hour day.
        # Whole/larger numeric values are already elapsed seconds.
        if -1 < val < 1:
            return int(round(val * 86400))
        return int(round(val))
    if isinstance(val, dt.timedelta):
        return int(round(val.total_seconds()))
    if isinstance(val, dt.time):
        return val.hour * 3600 + val.minute * 60 + val.second
    if isinstance(val, dt.datetime):
        return val.hour * 3600 + val.minute * 60 + val.second
    
    s = str(val).strip()
    if not s:
        return 0
    if ':' in s:
        parts = s.split(':')
        try:
            if len(parts) == 3:
                return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
            elif len(parts) == 2:
                return int(parts[0]) * 60 + int(parts[1])
        except:
            pass
    try:
        return int(float(s))
    except:
        return 0

def clean_score(val):
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    try:
        return float(val)
    except:
        return None

# -------------------------------------------------------------
# 2. PARSE POC-BRANCH MAPPING
# -------------------------------------------------------------
print("Parsing POC-Branch sheet...")
poc_df = pd.read_excel(excel_path, sheet_name="POC-Branch")

known_pocs = {
    "deepak prajapati", "manoj mathpal", "mansi billa", "praful jain",
    "thejus j d", "twinkle jaiswal", "arup", "tushar khetan"
}

def is_poc_name(val):
    return clean_str(val).lower() in known_pocs

poc_mappings = []
current_channel = ""
current_broker = ""
column_pocs = {}

# Replicate the Apps Script line-by-line scanning logic
for idx, row in poc_df.iterrows():
    # Convert row elements to clean strings
    row_vals = [clean_str(cell) for cell in row]
    non_empty = [v for v in row_vals if v]
    if not non_empty:
        continue
        
    # Check if this row is a header row
    lows = [v.lower() for v in row_vals]
    is_header = any(v in ["branch", "branch/location"] for v in lows) and \
                any(v in ["poc", "poc name", "channel", "broker", "broker name", "rm broker name"] for v in lows)
    if is_header:
        # Skip labels row
        continue
        
    # Check if this row lists POC names across columns
    poc_count = sum(1 for cell in row_vals[2:] if is_poc_name(cell))
    if poc_count >= 2:
        column_pocs = {}
        for c_idx, cell in enumerate(row_vals):
            if is_poc_name(cell):
                column_pocs[c_idx] = cell.strip()
        continue
        
    # Check for inline label values like Channel: XXX or Broker: XXX
    val0 = row_vals[0]
    val1 = row_vals[1]
    
    if val0.lower().startswith("channel:"):
        current_channel = val0.split(":", 1)[1].strip()
    elif val0.lower() == "channel" and len(non_empty) > 1:
        pass # Label header indicator row
        
    if val1.lower().startswith("broker:"):
        current_broker = val1.split(":", 1)[1].strip().replace("/POC", "").strip()
    elif val1.lower() == "broker" and len(non_empty) > 1:
        pass # Label header indicator row
        
    # Process POC columns if column_pocs is active
    if column_pocs and not val0.lower().startswith("channel:") and not val1.lower().startswith("broker:"):
        added = False
        for c_idx, cell in enumerate(row_vals):
            poc = column_pocs.get(c_idx)
            if not poc or not cell:
                continue
            # Skip if the cell is a label or represents the channel value
            if cell.lower() in ["channel", "broker", "dealing", "sales"] or cell.lower().startswith("channel:") or cell.lower().startswith("broker:"):
                continue
            
            # Map this branch
            norm_b = normalize_branch(cell)
            canon_b = canonical_broker(current_broker)
            poc_mappings.append({
                "POC": poc,
                "BranchRaw": cell,
                "BranchNorm": norm_b,
                "BranchKey": norm_b.replace(" ", ""),
                "Channel": current_channel,
                "BrokerRaw": current_broker,
                "BrokerFamily": canon_b
            })
            added = True
        if added:
            continue
            
    # Fallback to single value rows
    if len(non_empty) == 1 and not val0.lower().startswith("channel:") and not val1.lower().startswith("broker:"):
        # Could be setting current POC
        if is_poc_name(non_empty[0]):
            column_pocs = {} # Reset columns if a single POC header is encountered
            current_poc = non_empty[0]
            continue
            
# Deduplicate POC mappings
deduped_poc_mappings = {}
for m in poc_mappings:
    # Key is POC + BranchNorm + BrokerFamily
    key = (m["POC"].lower(), m["BranchNorm"].lower(), m["BrokerFamily"].lower())
    deduped_poc_mappings[key] = m
poc_mappings = list(deduped_poc_mappings.values())

print(f"Parsed {len(poc_mappings)} unique POC-Branch mappings.")

# Save POC mapping for check
print("Sample POC mappings:")
for m in poc_mappings[:5]:
    print(f"  POC: {m['POC']} | BranchNorm: {m['BranchNorm']} | BrokerFamily: {m['BrokerFamily']} | Channel: {m['Channel']}")

# -------------------------------------------------------------
# 3. DYNAMIC POC / ZONE ASSIGNMENT ENGINE
# -------------------------------------------------------------

def match_poc(broker_family, normalized_branch):
    if normalized_branch == "Not shared":
        return "Not shared"
    if normalized_branch == "smallcase":
        return "smallcase"
        
    branch_key = normalized_branch.replace(" ", "")
    
    # Step 1: Direct Broker-Branch Pair Match
    for m in poc_mappings:
        if m["BrokerFamily"] == broker_family and m["BranchKey"] == branch_key:
            return m["POC"]
            
    # Step 2: Exact Branch Match
    for m in poc_mappings:
        if m["BranchKey"] == branch_key:
            return m["POC"]
            
    # Step 3: Substring Match
    for m in poc_mappings:
        # Check if normalized branch name exists inside mapping branch name, or vice-versa
        m_bkey = m["BranchKey"]
        if branch_key in m_bkey or m_bkey in branch_key:
            return m["POC"]
            
    # Step 4: Fuzzy Token-Overlap Match
    ticket_tokens = normalized_branch.split(" ")
    best_poc = None
    best_score = 0
    best_overlap = 0
    
    for m in poc_mappings:
        cand_tokens = m["BranchNorm"].split(" ")
        overlap_tokens = set(ticket_tokens) & set(cand_tokens)
        overlap = len(overlap_tokens)
        if overlap >= 2:
            score = overlap / max(1, min(len(cand_tokens), len(ticket_tokens)))
            if score >= 0.75 and score > best_score:
                best_score = score
                best_overlap = overlap
                best_poc = m["POC"]
                
    if best_poc:
        return best_poc
        
    # Step 5: Fallback
    return "No POC"

# -------------------------------------------------------------
# 4. LOAD AND NORMALIZE TICKETS, CHATS, CARE EMAILS
# -------------------------------------------------------------

rm_contacts_map = {} # Store phone number to RM details mapping for calls lookup

def clean_date(val):
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d %H:%M:%S")
    # Parse string
    s = str(val).strip()
    if not s:
        return None
    try:
        # If timestamp includes T and Z, parse as ISO
        if 'T' in s:
            s_clean = s.replace('Z', '').split('.')[0] # Strip timezone
            dt = datetime.strptime(s_clean, "%Y-%m-%dT%H:%M:%S")
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        else:
            dt = pd.to_datetime(s)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return s

# 4.1. Ozonetel DevRev Tickets (Call Tickets)
print("Processing DevRev Call Tickets...")
tk_df = pd.read_excel(excel_path, sheet_name="Ozonetel DevRev Tickets")
# Filter Criteria: subtype is dealer_support. Note: in Excel, column name might be 'Subtype'
subtype_col = 'Subtype' if 'Subtype' in tk_df.columns else 'subtype'
tickets = []

if subtype_col in tk_df.columns:
    tk_df = tk_df[tk_df[subtype_col].astype(str).str.strip().str.lower() == 'dealer_support']
else:
    print("Warning: Subtype column not found in Tickets sheet! Processing all rows.")

for idx, row in tk_df.iterrows():
    # Columns to read
    work_id = clean_str(row.get('Work ID'))
    title = clean_str(row.get('Title'))
    created_date = clean_date(row.get('Created date'))
    close_date = clean_date(row.get('Close date'))
    owner = clean_str(row.get('Owner[0]'))
    rm_name = clean_str(row.get('RM Name'))
    rm_num = clean_str(row.get('RM Number'))
    stage = clean_str(row.get('Stage'))
    severity = clean_str(row.get('Severity.label'))
    sla_status = clean_str(row.get('SLA Name.status'))
    qa_score = clean_str(row.get('Overall Score (45)'))
    
    broker_name = clean_str(row.get('Broker Name[0]')) or clean_str(row.get('RM Broker Name')) or clean_str(row.get('Broker ID (B2B)'))
    branch_loc = clean_str(row.get('Branch/Location'))
    comments = clean_str(row.get('Comments')) or title
    rec_url = clean_str(row.get('Recording URL'))
    
    broker_fam = canonical_broker(broker_name)
    norm_branch = normalize_branch(branch_loc)
    poc = match_poc(broker_fam, norm_branch)
    
    # Classify call status based on Title
    title_lower = title.lower()
    call_status = "other"
    if "missed call" in title_lower:
        call_status = "missed"
    elif "aoh call" in title_lower:
        call_status = "aoh"
    elif "answered call" in title_lower:
        call_status = "answered"
        
    # Parse SLA response and resolution times
    sla_frt = None
    sla_rt = None
    sla_frt_status = None
    sla_rt_status = None
    for i in range(5):
        metric_col = f'Metric Name[{i}]'
        comp_col = f'Completed In[{i}]'
        status_col = f'Metric Status[{i}]'
        if metric_col in row and comp_col in row:
            m_name = str(row.get(metric_col) or "").strip().lower()
            comp_val = row.get(comp_col)
            m_status = str(row.get(status_col) or "").strip() if status_col in row else None
            if m_status:
                m_status = m_status.strip().upper()
                
            if m_name in ['first response time', 'first_response_time']:
                try:
                    val = float(comp_val)
                    if not math.isnan(val):
                        sla_frt = int(val * 60)
                        sla_frt_status = m_status
                except:
                    pass
            elif m_name in ['resolution time', 'resolution_time']:
                try:
                    val = float(comp_val)
                    if not math.isnan(val):
                        sla_rt = int(val * 60)
                        sla_rt_status = m_status
                except:
                    pass

    # Store RM number for Calls matching
    cleaned_num = clean_phone(rm_num)
    if cleaned_num and rm_name:
        rm_contacts_map[cleaned_num] = {
            "rm_name": rm_name,
            "broker_family": broker_fam,
            "branch": norm_branch,
            "poc": poc
        }
        
    tickets.append({
        "id": work_id,
        "type": "Call Ticket",
        "date": created_date,
        "close_date": close_date,
        "title": title,
        "rm_name": rm_name or "NA",
        "broker_family": broker_fam,
        "branch": norm_branch,
        "poc": poc,
        "channel": "Voice Call",
        "issue": clean_str(row.get('Issue Type (B2B)')) or "General",
        "sub_issue": clean_str(row.get('Sub Issue Type (B2B)')) or "General",
        "agent": owner or "Unassigned",
        "stage": stage or "New",
        "comments": comments,
        "severity": severity or "Medium",
        "sla_status": sla_status or "MET",
        "qa_score": qa_score,
        "recording_url": rec_url,
        "call_status": call_status,
        "resolution_time": sla_rt, # Keep for backwards compatibility
        "qa_greeting": clean_score(row.get('Opening & Greetings (5)')),
        "qa_grammar": clean_score(row.get('Grammar (5)')),
        "qa_acknowledgement": clean_score(row.get('Acknowledgement and Assurance (15)')),
        "qa_sla": clean_score(row.get('Maintaining SLA (15)')),
        "qa_assistance": clean_score(row.get('Offer further assistance & Closing statement (5)')),
        "qa_overall": clean_score(row.get('Overall Score (45)')),
        "sla_frt": sla_frt,
        "sla_rt": sla_rt,
        "sla_frt_status": sla_frt_status,
        "sla_rt_status": sla_rt_status
    })

print(f"Processed {len(tickets)} Call Tickets.")

# 4.2. WhatsApp Chats
print("Processing WhatsApp Chats...")
wa_df = pd.read_excel(excel_path, sheet_name="WhatsApp Chats")
# Filter: Subtype is dealer_support
wa_sub_col = 'Subtype' if 'Subtype' in wa_df.columns else 'subtype'
if wa_sub_col in wa_df.columns:
    wa_df = wa_df[wa_df[wa_sub_col].astype(str).str.strip().str.lower() == 'dealer_support']
else:
    print("Warning: Subtype column not found in WhatsApp sheet! Processing all rows.")
chats = []

for idx, row in wa_df.iterrows():
    conv_id = clean_str(row.get('ID'))
    last_msg = clean_str(row.get('Last Message'))
    created_date = clean_date(row.get('Created date'))
    owner = clean_str(row.get('Owners[0]'))
    rm_name = clean_str(row.get('RM Name'))
    rm_num = clean_str(row.get('RM Number'))
    stage = clean_str(row.get('Stage'))
    
    broker_name = clean_str(row.get('RM Broker Name')) or clean_str(row.get('Broker ID (B2B)'))
    branch_loc = clean_str(row.get('Branch/Location'))
    comments = clean_str(row.get('Comments')) or last_msg
    
    broker_fam = canonical_broker(broker_name)
    norm_branch = normalize_branch(branch_loc)
    poc = match_poc(broker_fam, norm_branch)
    
    # Parse SLA response and resolution times (in hours, convert to seconds)
    sla_frt = None
    sla_rt = None
    for i in range(3):
        metric_col = f'Metric Name[{i}]'
        comp_col = f'Completed In[{i}]'
        if metric_col in row and comp_col in row:
            m_name = str(row.get(metric_col) or "").strip().lower()
            comp_val = row.get(comp_col)
            if m_name in ['first response time', 'first_response_time']:
                try:
                    val = float(comp_val)
                    if not math.isnan(val):
                        sla_frt = int(val * 3600)
                except:
                    pass
            elif m_name in ['resolution time', 'resolution_time']:
                try:
                    val = float(comp_val)
                    if not math.isnan(val):
                        sla_rt = int(val * 3600)
                except:
                    pass

    # Store RM number for Calls matching
    cleaned_num = clean_phone(rm_num)
    if cleaned_num and rm_name:
        rm_contacts_map[cleaned_num] = {
            "rm_name": rm_name,
            "broker_family": broker_fam,
            "branch": norm_branch,
            "poc": poc
        }
        
    chats.append({
        "id": conv_id,
        "type": "WhatsApp Chat",
        "date": created_date,
        "close_date": None,
        "title": f"Chat with {rm_name or 'RM'}",
        "rm_name": rm_name or "NA",
        "broker_family": broker_fam,
        "branch": norm_branch,
        "poc": poc,
        "channel": "WhatsApp",
        "issue": clean_str(row.get('Issue Type (B2B)')) or "General",
        "sub_issue": clean_str(row.get('Sub Issue Type (B2B)')) or "General",
        "agent": owner or "Unassigned",
        "stage": stage or "Closed",
        "comments": comments,
        "severity": "Medium",
        "sla_status": "MET",
        "qa_score": "",
        "recording_url": "",
        "resolution_time": sla_rt, # Keep for backwards compatibility
        "qa_greeting": None,
        "qa_grammar": None,
        "qa_acknowledgement": None,
        "qa_sla": None,
        "qa_assistance": None,
        "qa_overall": None,
        "sla_frt": sla_frt,
        "sla_rt": sla_rt,
        "sla_frt_status": None,
        "sla_rt_status": None
    })

print(f"Processed {len(chats)} WhatsApp Chats.")

# 4.3. Care Emails
print("Processing Care Emails...")
email_df = pd.read_excel(excel_path, sheet_name="Care Emails")
# Note: tags include care@smallcase.com or caresc@smallcase.com OR Group === "Care Emails"
# We can check if these fields exist. In Excel columns, we have Tags[0]..Tags[4], Group, etc.
group_col = 'Group' if 'Group' in email_df.columns else 'group'
emails = []

# Filtering emails
has_tags = any(f'Tags[{i}]' in email_df.columns for i in range(5))
if group_col in email_df.columns:
    filtered_df = email_df[email_df[group_col].astype(str).str.lower().str.strip() == 'care emails']
    print(f"Filtered {len(filtered_df)} rows based on Group='Care Emails'")
else:
    filtered_df = email_df

for idx, row in filtered_df.iterrows():
    work_id = clean_str(row.get('Work ID'))
    title = clean_str(row.get('Title'))
    created_date = clean_date(row.get('Created date'))
    close_date = clean_date(row.get('Close date'))
    owner = clean_str(row.get('Owner[0]'))
    reported_by = clean_str(row.get('Reported by[0]'))
    stage = clean_str(row.get('Stage'))
    sentiment = clean_str(row.get('Sentiment.label'))
    
    # We can check if Account.display_name or Broker Name[0] represents the broker
    broker_name = clean_str(row.get('Broker Name[0]')) or clean_str(row.get('Account.display_name'))
            
    body = clean_str(row.get('Body')) or title
    
    broker_fam = canonical_broker(broker_name)
    # Care emails generally do not have Branch/Location fields.
    norm_branch = "Not shared"
    poc = match_poc(broker_fam, norm_branch)
    
    # Parse SLA response and resolution times (in minutes, convert to seconds)
    sla_frt = None
    sla_rt = None
    sla_frt_status = None
    sla_rt_status = None
    for i in range(3):
        metric_col = f'Metric Name[{i}]'
        comp_col = f'Completed In[{i}]'
        status_col = f'Metric Status[{i}]'
        if metric_col in row and comp_col in row:
            m_name = str(row.get(metric_col) or "").strip().lower()
            comp_val = row.get(comp_col)
            m_status = str(row.get(status_col) or "").strip() if status_col in row else None
            if m_status:
                m_status = m_status.strip().upper()
                
            if m_name in ['first response time', 'first_response_time']:
                try:
                    val = float(comp_val)
                    if not math.isnan(val):
                        sla_frt = int(val * 60)
                        sla_frt_status = m_status
                except:
                    pass
            elif m_name in ['resolution time', 'resolution_time']:
                try:
                    val = float(comp_val)
                    if not math.isnan(val):
                        sla_rt = int(val * 60)
                        sla_rt_status = m_status
                except:
                    pass

    emails.append({
        "id": work_id,
        "type": "Care Email",
        "date": created_date,
        "close_date": close_date,
        "title": title,
        "rm_name": reported_by or "NA", # Use sender name/email
        "broker_family": broker_fam,
        "branch": norm_branch,
        "poc": poc,
        "channel": "Email",
        # Note: Care Emails sheet columns are named "Issue" and "Sub-Issue"
        "issue": clean_str(row.get('Issue')) or "General",
        "sub_issue": clean_str(row.get('Sub-Issue')) or "General",
        "agent": owner or "Unassigned",
        "stage": stage or "Closed",
        "comments": body,
        "severity": "Medium",
        "sla_status": sla_status or "MET",
        "qa_score": clean_str(row.get('Overall Score (45)')),
        "recording_url": "",
        "sentiment": sentiment or "Neutral",
        "qa_greeting": clean_score(row.get('Opening & Greetings (5)')),
        "qa_grammar": clean_score(row.get('Grammar (5)')),
        "qa_acknowledgement": clean_score(row.get('Acknowledgement and Assurance (15)')),
        "qa_sla": clean_score(row.get('Maintaining SLA (15)')),
        "qa_assistance": clean_score(row.get('Offer further assistance & Closing statement (5)')),
        "qa_overall": clean_score(row.get('Overall Score (45)')),
        "sla_frt": sla_frt,
        "sla_rt": sla_rt,
        "sla_frt_status": sla_frt_status,
        "sla_rt_status": sla_rt_status
    })

print(f"Processed {len(emails)} Care Emails.")

# -------------------------------------------------------------
# 5. OZONETEL VOICE CALLS & CALL-RM MATCHING
# -------------------------------------------------------------
print("Processing Ozonetel Voice Calls...")
calls_df = pd.read_excel(excel_path, sheet_name="Ozonetel Calls")
calls = []
matched_calls_count = 0

for idx, row in calls_df.iterrows():
    ucid = clean_str(row.get('UCID'))
    call_id = clean_str(row.get('Call ID'))
    call_type = clean_str(row.get('Call Type'))
    caller_no = clean_str(row.get('Caller No'))
    # Combine Call Date and Start Time for exact timestamp
    call_date_val = clean_str(row.get('Call Date')).split(' ')[0]
    start_time_val = clean_str(row.get('Start Time'))
    if call_date_val and start_time_val:
        call_date = f"{call_date_val} {start_time_val}"
    else:
        call_date = clean_date(row.get('Call Date'))
        
    agent = clean_str(row.get('Agent'))
    status = clean_str(row.get('Status'))
    duration = parse_hms_to_seconds(row.get('Duration', 0))
        
    rec_url = clean_str(row.get('Recording URL'))
    disposition = clean_str(row.get('Disposition'))
    call_event = clean_str(row.get('Call Event'))
    
    # Try to match caller number to RM
    cleaned_caller = clean_phone(caller_no)
    rm_info = rm_contacts_map.get(cleaned_caller)
    
    if rm_info:
        rm_name = rm_info["rm_name"]
        broker_fam = rm_info["broker_family"]
        branch = rm_info["branch"]
        poc = rm_info["poc"]
        matched_calls_count += 1
    else:
        rm_name = "Unknown"
        broker_fam = "Unknown"
        branch = "Not shared"
        poc = "No POC"
        
    talk_time = parse_hms_to_seconds(row.get('Talk Time', 0))
    hold_time = parse_hms_to_seconds(row.get('Hold Time', 0))
    queue_time = parse_hms_to_seconds(row.get('Queue Time', 0))
    time_to_answer = parse_hms_to_seconds(row.get('Time to Answer', 0))

    calls.append({
        "id": call_id or ucid,
        "type": "Voice Call",
        "date": call_date,
        "caller_no": caller_no,
        "rm_name": rm_name,
        "broker_family": broker_fam,
        "branch": branch,
        "poc": poc,
        "channel": "Voice Call",
        "issue": "Voice Call",
        "sub_issue": disposition or call_event or "General",
        "agent": agent or "System",
        "stage": status or "Answered",
        "comments": f"Voice call log: {disposition} / {call_event}",
        "duration": duration,
        "recording_url": rec_url,
        "talk_time": talk_time,
        "hold_time": hold_time,
        "queue_time": queue_time,
        "time_to_answer": time_to_answer,
        "call_type": call_type
    })

print(f"Processed {len(calls)} raw calls. Matched {matched_calls_count} calls to known RMs.")

# -------------------------------------------------------------
# 6. OZONETEL AGENT BREAKS
# -------------------------------------------------------------
print("Processing Agent Breaks...")
breaks_df = pd.read_excel(excel_path, sheet_name="Ozonetel Agent breaks")
agent_breaks = []

for idx, row in breaks_df.iterrows():
    date_val = clean_date(row.get('Date'))
    agent_name = clean_str(row.get('Agent Name'))
    break_type = clean_str(row.get('Breaks'))
    total_break = clean_str(row.get('Total Break Time'))
    
    # Convert HH:MM:SS string to seconds if needed
    seconds = 0
    if total_break and ':' in total_break:
        parts = total_break.split(':')
        try:
            if len(parts) == 3:
                seconds = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
            elif len(parts) == 2:
                seconds = int(parts[0]) * 60 + int(parts[1])
        except:
            pass
            
    agent_breaks.append({
        "date": date_val,
        "agent_name": agent_name,
        "break_type": break_type,
        "duration_str": total_break,
        "duration_sec": seconds
    })

print(f"Processed {len(agent_breaks)} Agent break logs.")

# -------------------------------------------------------------
# 7. CONSOLIDATING DATA & COMPUTING METRICS
# -------------------------------------------------------------

# List of support interactions: Call Tickets + WhatsApp Chats + Care Emails
support_interactions = tickets + chats + emails

# -------------------------------------------------------------
# 6.5. POST-PROCESSING: TIME-WINDOWED JOINS & METRICS COMPILATION
# -------------------------------------------------------------
print("Running post-processing time-windowed joins & metrics compilation...")

# Group calls by cleaned phone number
calls_by_phone = {}
for call in calls:
    phone = clean_phone(call["caller_no"])
    if phone:
        if phone not in calls_by_phone:
            calls_by_phone[phone] = []
        calls_by_phone[phone].append(call)

# Sort calls for each phone by date
for phone in calls_by_phone:
    calls_by_phone[phone].sort(key=lambda x: x["date"])

# Match Ozonetel Call to DevRev Ticket
for tkt in tickets:
    phone = clean_phone(tkt.get("rm_num") or tkt.get("rm_number") or "")
    if not phone:
        phone = clean_phone(tkt.get("rm_name"))
        if not phone:
            continue
            
    tkt_dt = None
    if tkt["date"]:
        try:
            tkt_dt = datetime.strptime(tkt["date"], "%Y-%m-%d %H:%M:%S")
        except:
            pass
            
    if not tkt_dt:
        continue
        
    candidate_calls = calls_by_phone.get(phone, [])
    if not candidate_calls:
        continue
        
    best_call = None
    min_diff = 9999999
    
    for call in candidate_calls:
        call_dt = None
        if call["date"]:
            try:
                call_dt = datetime.strptime(call["date"], "%Y-%m-%d %H:%M:%S")
            except:
                pass
        if not call_dt:
            continue
        diff = abs((tkt_dt - call_dt).total_seconds())
        # Window of 20 seconds
        if diff <= 20 and diff < min_diff:
            min_diff = diff
            best_call = call
            
    if best_call:
        tkt["call_ucid"] = best_call["id"]
        tkt["call_duration"] = best_call["duration"]
        tkt["call_talk_time"] = best_call["talk_time"]
        tkt["call_hold_time"] = best_call["hold_time"]
        tkt["call_queue_time"] = best_call["queue_time"]
        tkt["call_time_to_answer"] = best_call["time_to_answer"]
        tkt["call_agent"] = best_call["agent"]
        tkt["call_status"] = best_call["stage"]
        # Link recording URL to ticket
        tkt["recording_url"] = best_call["recording_url"]
        
        # Missed Call Callback Matching
        is_missed = "missed" in tkt["title"].lower() or best_call["stage"].lower() in ["missed", "unanswered"]
        if is_missed:
            best_callback = None
            initial_call_dt = None
            try:
                initial_call_dt = datetime.strptime(best_call["date"], "%Y-%m-%d %H:%M:%S")
            except:
                pass
            if initial_call_dt:
                for call in candidate_calls:
                    ctype = str(call.get("call_type") or "").lower()
                    if "progressive" in ctype or "callback" in ctype:
                        call_dt = None
                        try:
                            call_dt = datetime.strptime(call["date"], "%Y-%m-%d %H:%M:%S")
                        except:
                            pass
                        if call_dt:
                            diff = (call_dt - initial_call_dt).total_seconds()
                            if 0 < diff <= 900: # Callback within 15 minutes
                                best_callback = call
                                break
                                
            if best_callback:
                tkt["recording_url"] = best_callback["recording_url"] # Fetch callback recording!
                tkt["callback_ucid"] = best_callback["id"]
                tkt["callback_duration"] = best_callback["duration"]
                tkt["callback_talk_time"] = best_callback["talk_time"]
                tkt["callback_agent"] = best_callback["agent"]
                tkt["callback_status"] = best_callback["stage"]

# Aggregate Agent breaks and Occupancy
agent_summary_map = {}
for b in agent_breaks:
    agent = b["agent_name"]
    if not agent or agent == "NA":
        continue
    date_str = b["date"].split(" ")[0] if b["date"] else ""
    if not date_str:
        continue
        
    if agent not in agent_summary_map:
        agent_summary_map[agent] = {
            "agent_name": agent,
            "active_days": set(),
            "total_breaks_sec": 0,
            "break_types": {}
        }
    summary = agent_summary_map[agent]
    summary["active_days"].add(date_str)
    summary["total_breaks_sec"] += b["duration_sec"]
    
    btype = b["break_type"]
    summary["break_types"][btype] = summary["break_types"].get(btype, 0) + b["duration_sec"]

for call in calls:
    agent = call["agent"]
    if not agent or agent == "System" or agent == "NA":
        continue
    date_str = call["date"].split(" ")[0] if call["date"] else ""
    if not date_str:
        continue
        
    if agent not in agent_summary_map:
        agent_summary_map[agent] = {
            "agent_name": agent,
            "active_days": set(),
            "total_breaks_sec": 0,
            "break_types": {}
        }
    agent_summary_map[agent]["active_days"].add(date_str)

agent_talk_time = {}
for call in calls:
    agent = call["agent"]
    if agent and agent != "System":
        agent_talk_time[agent] = agent_talk_time.get(agent, 0) + call.get("talk_time", 0)

agent_scorecards = []
for agent, summary in agent_summary_map.items():
    active_days_count = len(summary["active_days"])
    shift_time_sec = active_days_count * 32400 # 9 hours
    talk_time_sec = agent_talk_time.get(agent, 0)
    break_time_sec = summary["total_breaks_sec"]
    
    denominator = shift_time_sec - break_time_sec
    occupancy_pct = 0.0
    if denominator > 0:
        occupancy_pct = round((talk_time_sec / denominator) * 100, 2)
        if occupancy_pct > 100.0:
            occupancy_pct = 100.0
            
    agent_scorecards.append({
        "agent_name": agent,
        "active_days": active_days_count,
        "logged_hours": round(shift_time_sec / 3600, 2),
        "total_breaks_sec": break_time_sec,
        "talk_time_sec": talk_time_sec,
        "occupancy_rate": occupancy_pct,
        "break_types": summary["break_types"]
    })


# 7.1. Outliers
print("Computing RM Outlier Contact Frequencies...")
# For each RM, compute contacts, active days, contacts per day
rm_stats = {}
for item in support_interactions:
    rm = item["rm_name"]
    if rm == "NA" or not rm:
        continue
    date_str = item["date"].split(" ")[0] if item["date"] else ""
    if not date_str:
        continue
        
    if rm not in rm_stats:
        rm_stats[rm] = {
            "rm_name": rm,
            "contacts": 0,
            "active_days": set(),
            "broker_family": item["broker_family"],
            "branch": item["branch"],
            "top_issue_counts": {}
        }
    stats = rm_stats[rm]
    stats["contacts"] += 1
    stats["active_days"].add(date_str)
    
    issue = f"{item['issue']} / {item['sub_issue']}"
    stats["top_issue_counts"][issue] = stats["top_issue_counts"].get(issue, 0) + 1

outliers = []
for rm, stats in rm_stats.items():
    active_days_count = len(stats["active_days"])
    if active_days_count == 0:
        continue
    contacts_per_day = round(stats["contacts"] / active_days_count, 2)
    
    # Sort top issues
    sorted_issues = sorted(stats["top_issue_counts"].items(), key=lambda x: x[1], reverse=True)
    top_issue = sorted_issues[0][0] if sorted_issues else "NA"
    
    is_outlier = contacts_per_day > 3.0 and stats["contacts"] >= 5
    
    outliers.append({
        "rm_name": rm,
        "contacts": stats["contacts"],
        "active_days": active_days_count,
        "contacts_per_day": contacts_per_day,
        "broker_family": stats["broker_family"],
        "branch": stats["branch"],
        "top_issue": top_issue,
        "is_outlier": is_outlier
    })

# 7.2. Repeat 7-Day Loops
print("Computing Repeat 7-Day Loops...")
# Group by RM Name + Broker Family + Branch + Issue (exclude generic "General/General" or "General / General")
loop_groups = {}
for item in support_interactions:
    rm = item["rm_name"]
    broker = item["broker_family"]
    branch = item["branch"]
    issue = item["issue"]
    sub_issue = item["sub_issue"]
    
    if rm == "NA" or not rm:
        continue
    if issue.lower() == "general" and sub_issue.lower() == "general":
        continue
    if not item["date"]:
        continue
        
    group_key = (rm, broker, branch, issue)
    if group_key not in loop_groups:
        loop_groups[group_key] = []
    
    # Parse date to timestamp
    try:
        dt = datetime.strptime(item["date"], "%Y-%m-%d %H:%M:%S")
        loop_groups[group_key].append(dt.timestamp() * 1000) # ms
    except:
        pass

repeat_loops = []
for (rm, broker, branch, issue), tss in loop_groups.items():
    if len(tss) < 2:
        continue
    tss.sort()
    repeat_count = 0
    for i in range(1, len(tss)):
        diff = tss[i] - tss[i-1]
        if diff <= 7 * 24 * 60 * 60 * 1000: # 7 days in ms
            repeat_count += 1
            
    if repeat_count > 0:
        repeat_loops.append({
            "rm_name": rm,
            "broker_family": broker,
            "branch": branch,
            "issue": issue,
            "repeat_count": repeat_count
        })

repeat_loops = sorted(repeat_loops, key=lambda x: x["repeat_count"], reverse=True)

# 7.3. Unstructured Comments Theme Extraction
print("Extracting keywords and themes...")
stopwords = {
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
}

domain_keywords = {
    "login", "password", "settlement", "payout", "otc", "onboarding", "broker", "feed",
    "sip", "order", "error", "delay", "execution", "pending", "account", "fund", "transfer",
    "api", "integration", "dashboard", "portal", "report", "failure", "success", "reject",
    "kyc", "clientid", "symbol", "stock", "portfolio", "rebalance", "subscription"
}

word_freq = {}
recent_comments = []

# Collect recent comments (sorted by date desc)
sorted_interactions = sorted([item for item in support_interactions if item["date"]], key=lambda x: x["date"], reverse=True)
for item in sorted_interactions:
    comm = item["comments"]
    if comm and len(recent_comments) < 4:
        recent_comments.append({
            "id": item["id"],
            "type": item["type"],
            "date": item["date"],
            "rm_name": item["rm_name"],
            "comment": comm[:200] + ("..." if len(comm) > 200 else "")
        })
        
    if comm:
        # Tokenize and clean
        words = re.findall(r'\b[a-zA-Z]{3,15}\b', comm.lower())
        for w in words:
            if w not in stopwords:
                word_freq[w] = word_freq.get(w, 0) + 1

# Filter top keywords (prioritize domain keywords or just overall frequency)
sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
top_themes = []
for w, f in sorted_words:
    if w in domain_keywords or f >= 5: # Filter criteria
        top_themes.append({"word": w, "count": f})
    if len(top_themes) >= 25:
        break

# -------------------------------------------------------------
# 8. SAVE PREPROCESSED DATA TO JSON FILE
# -------------------------------------------------------------

print("Compiling final JSON dashboard data structure...")

# Create compact versions of records to keep file sizes optimal
compact_interactions = []
for item in support_interactions:
    compact_interactions.append({
        "id": item["id"],
        "type": item["type"],
        "date": item["date"],
        "rm_name": item["rm_name"],
        "broker_family": item["broker_family"],
        "branch": item["branch"],
        "poc": item["poc"],
        "channel": item["channel"],
        "issue": item["issue"],
        "sub_issue": item["sub_issue"],
        "agent": item["agent"],
        "stage": item["stage"],
        "comments": item["comments"][:300] if item["comments"] else "",
        "severity": item["severity"],
        "sla_status": item["sla_status"],
        "qa_score": item["qa_score"],
        "recording_url": item["recording_url"],
        "sentiment": item.get("sentiment", ""),
        "call_status": item.get("call_status", "other"),
        "resolution_time": item.get("resolution_time", None),
        # QA Scores
        "qa_greeting": item.get("qa_greeting", None),
        "qa_grammar": item.get("qa_grammar", None),
        "qa_acknowledgement": item.get("qa_acknowledgement", None),
        "qa_sla": item.get("qa_sla", None),
        "qa_assistance": item.get("qa_assistance", None),
        "qa_overall": item.get("qa_overall", None),
        # SLA Metrics
        "sla_frt": item.get("sla_frt", None),
        "sla_rt": item.get("sla_rt", None),
        "sla_frt_status": item.get("sla_frt_status", None),
        "sla_rt_status": item.get("sla_rt_status", None),
        # Matched Call Metrics
        "call_ucid": item.get("call_ucid", None),
        "call_duration": item.get("call_duration", None),
        "call_talk_time": item.get("call_talk_time", None),
        "call_hold_time": item.get("call_hold_time", None),
        "call_queue_time": item.get("call_queue_time", None),
        "call_time_to_answer": item.get("call_time_to_answer", None),
        "call_agent": item.get("call_agent", None),
        "call_status_raw": item.get("call_status", None),
        # Callback Metrics
        "callback_ucid": item.get("callback_ucid", None),
        "callback_duration": item.get("callback_duration", None),
        "callback_talk_time": item.get("callback_talk_time", None),
        "callback_agent": item.get("callback_agent", None),
        "callback_status": item.get("callback_status", None)
    })

compact_calls = []
for call in calls:
    compact_calls.append({
        "id": call["id"],
        "type": call["type"],
        "date": call["date"],
        "caller_no": call["caller_no"],
        "rm_name": call["rm_name"],
        "broker_family": call["broker_family"],
        "branch": call["branch"],
        "poc": call["poc"],
        "channel": call["channel"],
        "issue": call["issue"],
        "sub_issue": call["sub_issue"],
        "agent": call["agent"],
        "stage": call["stage"],
        "duration": call["duration"],
        "recording_url": call["recording_url"],
        "talk_time": call.get("talk_time", 0),
        "hold_time": call.get("hold_time", 0),
        "queue_time": call.get("queue_time", 0),
        "time_to_answer": call.get("time_to_answer", 0),
        "call_type": call.get("call_type", "")
    })

# -------------------------------------------------------------
# DAILY TOOLS — SHEET-BACKED LINKS
# -------------------------------------------------------------
def read_named_url_pairs(sheet_name, label_index, url_index):
    try:
        df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)
    except Exception as exc:
        print(f"Warning: unable to read {sheet_name}: {exc}")
        return []

    items = []
    seen = set()
    for row in df.itertuples(index=False, name=None):
        if len(row) <= max(label_index, url_index):
            continue
        label = clean_str(row[label_index])
        url = clean_str(row[url_index])
        if not label or not re.match(r'^https?://', url, re.IGNORECASE):
            continue
        key = (label.lower(), url.lower())
        if key in seen:
            continue
        seen.add(key)
        items.append({"name": label, "url": url})
    return items

important_links = read_named_url_pairs("Important links", 0, 1)
important_sheets = read_named_url_pairs("Important links", 6, 7)

redash_queries = []
try:
    redash_df = pd.read_excel(excel_path, sheet_name="Redash")
    redash_columns = {str(col).strip().lower().replace(" ", ""): col for col in redash_df.columns}
    for _, row in redash_df.iterrows():
        def redash_value(key):
            column = redash_columns.get(key)
            return clean_str(row.get(column)) if column is not None else ""
        query_id = redash_value("queryid")
        name = redash_value("name")
        url = redash_value("querylink")
        if not name and not query_id:
            continue
        redash_queries.append({
            "id": query_id,
            "name": name,
            "description": redash_value("description"),
            "url": url,
            "created_at": redash_value("createdat"),
            "updated_at": redash_value("updatedat"),
            "author": redash_value("author")
        })
except Exception as exc:
    print(f"Warning: unable to read Redash: {exc}")

# Structure the output file
dashboard_data = {
    "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "support_interactions": compact_interactions,
    "calls": compact_calls,
    "agent_breaks": agent_breaks,
    "outliers": outliers,
    "repeat_loops": repeat_loops,
    "top_themes": top_themes,
    "recent_comments": recent_comments,
    "poc_mappings": poc_mappings,
    "agent_scorecards": agent_scorecards,
    "redashQueries": redash_queries,
    "importantLinks": important_links,
    "importantSheets": important_sheets
}

with open(output_json_path, 'w', encoding='utf-8') as f:
    json.dump(dashboard_data, f, ensure_ascii=False, indent=2)

print(f"Preprocessing pipeline completed successfully!")
print(f"Data saved to: {output_json_path}")
print(f"Total compiled support interactions: {len(compact_interactions)}")
print(f"Total compiled voice call records: {len(compact_calls)}")
print(f"Total outliers: {len(outliers)}")
print(f"Total repeat loops detected: {len(repeat_loops)}")
