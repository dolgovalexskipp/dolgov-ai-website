"""Private event survey. Submission only; exports are local SSH operations."""
import hmac,json,os,re,sqlite3,time,threading
from collections import defaultdict,deque
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path

ORIGINS={'https://dolgovalex.com','https://dolgov.ai','https://www.dolgovalex.com'}
REQUIRED={'name','company','contact','frequency','level','task','effort','result','os','setup','backup','consent'}
ALLOWED=REQUIRED|{'tools','tried','help'}
DB=Path(os.environ.get('SURVEY_DB','/var/lib/dolgov-school-survey/answers.sqlite3'))
TOKEN=os.environ['SURVEY_TOKEN']
if len(TOKEN)<32: raise RuntimeError('Submission token too short')
rates=defaultdict(deque)
lock=threading.Lock()

def connect():
    db=sqlite3.connect(DB,timeout=10)
    db.execute('CREATE TABLE IF NOT EXISTS responses (id TEXT PRIMARY KEY, event TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, answers TEXT NOT NULL)')
    return db

class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass  # No contacts, tokens or answers in logs.
    def setup(self):
        super().setup(); self.connection.settimeout(15)
    def reply(self,code,data):
        raw=json.dumps(data).encode()
        self.send_response(code)
        origin=self.headers.get('Origin','')
        if origin in ORIGINS: self.send_header('Access-Control-Allow-Origin',origin)
        self.send_header('Vary','Origin')
        self.send_header('Cache-Control','no-store')
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(raw)))
        self.end_headers();self.wfile.write(raw)
    def do_OPTIONS(self):
        if self.path!='/school-api/survey' or self.headers.get('Origin') not in ORIGINS:
            return self.reply(403,{'ok':False})
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin',self.headers['Origin'])
        self.send_header('Access-Control-Allow-Methods','POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers','Authorization, Content-Type')
        self.send_header('Access-Control-Max-Age','600')
        self.send_header('Vary','Origin');self.end_headers()
    def do_GET(self):
        if self.path=='/school-api/health': return self.reply(200,{'ok':True})
        return self.reply(404,{'ok':False})
    def do_POST(self):
        if self.path!='/school-api/survey': return self.reply(404,{'ok':False})
        if self.headers.get('Origin','') not in ORIGINS: return self.reply(403,{'ok':False})
        if not hmac.compare_digest(self.headers.get('Authorization',''),'Bearer '+TOKEN):
            return self.reply(401,{'ok':False})
        if self.headers.get_content_type()!='application/json': return self.reply(415,{'ok':False})
        try: size=int(self.headers.get('Content-Length','0'))
        except ValueError: return self.reply(400,{'ok':False})
        if not 0<size<=32768: return self.reply(413,{'ok':False})
        # nginx supplies a trusted client address; shared event Wi-Fi needs headroom.
        ip=self.headers.get('X-Real-IP',self.client_address[0]); now=time.monotonic()
        with lock:
            for key in list(rates):
                while rates[key] and rates[key][0]<now-60: rates[key].popleft()
                if not rates[key]: del rates[key]
            if len(rates[ip])>=100: return self.reply(429,{'ok':False})
            rates[ip].append(now)
        try:
            data=json.loads(self.rfile.read(size))
            if not isinstance(data,dict): raise ValueError()
            ident=data.get('id',''); answers=data.get('answers')
            if not isinstance(ident,str) or not re.fullmatch(r'[a-zA-Z0-9_-]{12,80}',ident): raise ValueError()
            if data.get('event')!='komanda-2026-11' or not isinstance(answers,dict): raise ValueError()
            if not REQUIRED.issubset(answers) or set(answers)-ALLOWED: raise ValueError()
            if any(not isinstance(v,str) or len(v)>2500 for v in answers.values()): raise ValueError()
            if any(not answers[k].strip() for k in REQUIRED) or answers['consent']!='yes': raise ValueError()
            packed=json.dumps(answers,ensure_ascii=False,sort_keys=True)
        except (ValueError,TypeError,UnicodeError): return self.reply(400,{'ok':False})
        try:
            with connect() as db:
                db.execute('BEGIN IMMEDIATE')
                prior=db.execute('SELECT answers FROM responses WHERE id=?',(ident,)).fetchone()
                if prior and prior[0]!=packed: return self.reply(409,{'ok':False})
                db.execute('INSERT OR IGNORE INTO responses(id,event,answers) VALUES(?,?,?)',(ident,data['event'],packed))
            return self.reply(200,{'ok':True,'receipt':ident})
        except sqlite3.Error: return self.reply(503,{'ok':False})

if __name__=='__main__':
    os.umask(0o077);DB.parent.mkdir(parents=True,exist_ok=True)
    with connect(): pass
    ThreadingHTTPServer(('127.0.0.1',int(os.environ.get('SURVEY_PORT','8098'))),Handler).serve_forever()
