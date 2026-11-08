"""Run via SSH; writes CSV to stdout. No public export endpoint."""
import csv,json,sqlite3,sys
connection=sqlite3.connect('file:/var/lib/dolgov-school-survey/answers.sqlite3?mode=ro',uri=True)
rows=connection.execute('SELECT id,created_at,answers FROM responses WHERE event=? ORDER BY created_at',('komanda-2026-11',)).fetchall()
fields=['name','company','contact','frequency','tools','level','task','effort','result','tried','os','setup','backup','help','consent']
def safe(value):
    value=str(value)
    return "'"+value if value.lstrip().startswith(('=','+','-','@')) or value.startswith(('\t','\r','\n')) else value
out=csv.writer(sys.stdout);out.writerow(['id','created_at']+fields)
for ident,date,raw in rows:
    answers=json.loads(raw);out.writerow([ident,date]+[safe(answers.get(f,'')) for f in fields])
