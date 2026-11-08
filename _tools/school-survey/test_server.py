import unittest,subprocess,tempfile,os,json,urllib.request,urllib.error,time,sqlite3
from pathlib import Path
class SurveyTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.tmp=tempfile.TemporaryDirectory();cls.db=Path(cls.tmp.name)/'answers.sqlite3'
  cls.proc=subprocess.Popen(['python3',str(Path(__file__).with_name('server.py'))],env={**os.environ,'SURVEY_TOKEN':'test-token-only-'+'x'*32,'SURVEY_DB':str(cls.db),'SURVEY_PORT':'18098'})
  for _ in range(50):
   try: urllib.request.urlopen('http://127.0.0.1:18098/school-api/health');break
   except OSError: time.sleep(.05)
 @classmethod
 def tearDownClass(cls): cls.proc.terminate();cls.proc.wait();cls.tmp.cleanup()
 def req(self,data=None,origin='https://dolgovalex.com',token='test-token-only-'+'x'*32,path='/school-api/survey',method='POST'):
  request=urllib.request.Request('http://127.0.0.1:18098'+path,data=json.dumps(data).encode() if data is not None else None,method=method,headers={'Origin':origin,'Authorization':'Bearer '+token,'Content-Type':'application/json'})
  try:
   with urllib.request.urlopen(request) as r:return r.status,dict(r.headers),json.loads(r.read() or '{}')
  except urllib.error.HTTPError as e:return e.code,dict(e.headers),json.loads(e.read() or '{}')
 def payload(self,ident='test-'+'a'*32):
  return {'id':ident,'event':'komanda-2026-11','answers':{**dict.fromkeys(['name','company','contact','frequency','level','task','effort','result','os','setup','backup'],'Синтетический тест'),'consent':'yes'}}
 def test_auth_and_origin(self):
  self.assertEqual(self.req(self.payload(),token='wrong')[0],401)
  self.assertEqual(self.req(self.payload(),origin='https://evil.example')[0],403)
 def test_no_public_read(self):self.assertEqual(self.req(path='/school-api/export',method='GET')[0],404)
 def test_cors(self):
  code,headers,_=self.req(method='OPTIONS');self.assertEqual(code,204);self.assertEqual(headers['Access-Control-Allow-Origin'],'https://dolgovalex.com')
 def test_validation(self):
  for value in [[],{},self.payload()|{'event':'other'}]:self.assertEqual(self.req(value)[0],400)
  data=self.payload();data['answers']['consent']='no';self.assertEqual(self.req(data)[0],400)
 def test_persist_and_retry(self):
  data=self.payload();self.assertTrue(self.req(data)[2]['ok']);self.assertTrue(self.req(data)[2]['ok'])
  with sqlite3.connect(self.db) as db:self.assertEqual(db.execute('select count(*) from responses where id=?',(data['id'],)).fetchone()[0],1)
  data['answers']['name']='Changed';self.assertEqual(self.req(data)[0],409)
 def test_payload_limit(self):self.assertEqual(self.req({'large':'a'*33000})[0],413)
if __name__=='__main__':unittest.main()
