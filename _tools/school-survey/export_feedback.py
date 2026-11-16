"""Private feedback summary. Run over SSH; no HTTP read endpoint."""
import argparse,json,sqlite3
from collections import Counter

def summarize(rows):
    answers=[json.loads(row[0]) for row in rows]
    scores=[int(a['nps']) for a in answers if a.get('nps') in {str(i) for i in range(11)}]
    n=len(scores); promoters=sum(x>=9 for x in scores); detractors=sum(x<=6 for x in scores)
    return {'responses':len(answers),'nps_answers':n,'promoters':promoters,'passives':n-promoters-detractors,'detractors':detractors,'nps':round(100*(promoters-detractors)/n,2) if n else None,'distribution':{str(i):scores.count(i) for i in range(11)},'result_stages':dict(Counter(a['result_stage'] for a in answers if a.get('result_stage')))}

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--db',default='/var/lib/dolgov-school-survey/answers.sqlite3')
    args=parser.parse_args()
    with sqlite3.connect('file:'+args.db+'?mode=ro',uri=True) as db:
        rows=db.execute('SELECT answers FROM responses WHERE event=? ORDER BY created_at',('komanda-2026-11-feedback',)).fetchall()
    print(json.dumps(summarize(rows),ensure_ascii=False,indent=2))
