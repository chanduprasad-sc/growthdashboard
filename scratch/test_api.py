import urllib.request
import json
import ssl

url = "https://script.google.com/macros/s/AKfycbzXb1cgZwP2RdEM8xvf9xaNk_ZHkoBAcAdUgZ1cxLWJ-naMBi5ABMvtHJ6s4RUEHsOj/exec?action=getData"
try:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx) as response:
        data = json.loads(response.read().decode('utf-8'))
        
        care_emails = data.get('careEmails', [])
        if care_emails:
            print("\nFound raw careEmails!")
            print("Number of careEmails:", len(care_emails))
            print("First raw careEmail keys:", sorted(care_emails[0].keys()))
            print("First raw careEmail sample:")
            for k, v in care_emails[0].items():
                if v is not None and v != "":
                    print(f"  {k}: {repr(v)}")
        else:
            print("No careEmails found in raw data.")
except Exception as e:
    print("Error:", e)
