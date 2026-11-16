import json,sqlite3,unittest
from test_server import SurveyTest
from export_feedback import summarize
class FeedbackTest(SurveyTest):
 def feedback(self,ident='feedback-'+'b'*32):
  return {'id':ident,'event':'komanda-2026-11-feedback','answers':{'nps':'0','clarity_stop':'na','consent':'yes'}}
 def test_feedback_separate_retry(self):
  data=self.feedback();self.assertEqual(self.req(data)[0],200);self.assertEqual(self.req(data)[0],200)
  with sqlite3.connect(self.db) as db:
   self.assertEqual(db.execute('SELECT count(*) FROM responses WHERE event=? AND id=?',(data['event'],data['id'])).fetchone()[0],1)
  data['answers']['nps']='10';self.assertEqual(self.req(data)[0],409)
 def test_feedback_validation(self):
  for a in [{'nps':'11'},{'nps':0},{'nps':'-1'},{'nps':'9.5'},{'clarity_run':'6'},{'result_stage':'invented'},{'name':'not collected'},{'comment':'x'*2501},{}]:
   d=self.feedback();d['answers']={**a,'consent':'yes'};self.assertEqual(self.req(d)[0],400)
  d=self.feedback();d['answers']['consent']='no';self.assertEqual(self.req(d)[0],400)
 def test_partial_feedback(self):
  d=self.feedback('partial-'+'c'*32);d['answers']={'comment':'Не успел проверить','consent':'yes'};self.assertEqual(self.req(d)[0],200)
 def test_no_cross_event_id(self):
  d=self.feedback('collision-'+'d'*32);self.assertEqual(self.req(d)[0],200)
  self.assertEqual(self.req(self.payload(d['id']))[0],409)
 def test_nps_summary(self):
  self.assertIsNone(summarize([])['nps'])
  rows=[(json.dumps({'nps':str(x)}),) for x in [0,6,7,8,9,10]]+[(json.dumps({'comment':'text'}),)]
  r=summarize(rows);self.assertEqual(r['nps'],0);self.assertEqual(r['nps_answers'],6);self.assertEqual(r['responses'],7);self.assertEqual(r['passives'],2)
  self.assertEqual(summarize([(json.dumps({'nps':'9'}),)])['nps'],100)
if __name__=='__main__':unittest.main()
