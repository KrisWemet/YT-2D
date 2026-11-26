#!/usr/bin/env python3
"""Record Chapter Three using Chapter One's approved KIE/Gemini recipe (as Chapter Two did).

Usage: record_voice.py [--key-file /path/to/local.env] [--takes 2] [--workers 4]
No credentials are stored in the project. Completed tasks and accepted WAVs are resumable.
Each take is transcribed before acceptance; exact-script words are aligned after assembly.
"""
import argparse,ast,concurrent.futures as cf,difflib,json,os,re,subprocess,sys,time
from pathlib import Path
P=argparse.ArgumentParser();P.add_argument('--key-file');P.add_argument('--takes',type=int,default=2)
P.add_argument('--workers',type=int,default=4);P.add_argument('--build-only',action='store_true')
P.add_argument('--only');args=P.parse_args()
HERE=Path(__file__).resolve().parent;MALL=HERE.parent;ROOT=HERE.parents[2];VO=MALL/'vo/ch3'
if args.key_file:
 raw=Path(args.key_file).expanduser().read_text().strip()
 m=re.search(r'(?:^|\n)\s*(?:export\s+)?KIE_API_KEY\s*=\s*[\'\"]?([^\s\'\"#]+)',raw)
 key=m.group(1) if m else raw if re.fullmatch(r'[A-Za-z0-9_-]{16,}',raw) else None
 if not key:raise SystemExit('The selected file does not contain KIE_API_KEY.')
 os.environ['KIE_API_KEY']=key
if not os.environ.get('KIE_API_KEY'):raise SystemExit('KIE.ai access is missing. Supply --key-file or KIE_API_KEY. No voice was generated.')
# Reuse the original audited recording, loudness, radio, tempo and pause processing functions.
source=ast.parse((MALL/'voice_gemini.py').read_text())
stop=next(i for i,n in enumerate(source.body) if isinstance(n,ast.If) and isinstance(n.test,ast.Compare) and isinstance(n.test.left,ast.Constant) and n.test.left.value=='--check')
ns={'__file__':str(MALL/'voice_gemini.py'),'__name__':'chapter3_voice_helpers'}
oldargs=sys.argv;sys.argv=[str(MALL/'voice_gemini.py'),str(VO/'plan.json'),str(VO),'--build-only']
exec(compile(ast.Module(body=source.body[:stop],type_ignores=[]),str(MALL/'voice_gemini.py'),'exec'),ns)
sys.argv=oldargs
import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel
cache=HERE/'models';cache.mkdir(exist_ok=True)
model=WhisperModel('small.en',device='cpu',compute_type='int8',download_root=str(cache))
plan=json.loads((VO/'plan.json').read_text());takes=VO/'takes';takes.mkdir(exist_ok=True)
ns['plan']=plan;ns['takes']=takes;ns['out']=VO
journal=VO/'recording.json';record=json.loads(journal.read_text()) if journal.exists() else {}
selected=json.loads((VO/'selected.json').read_text()) if (VO/'selected.json').exists() else {};alignments={}

def request(c,index):
 cid=f"{c['id']}-{index}";dst=takes/f'{cid}.wav';meta=takes/f'{cid}.json'
 if dst.exists() and meta.exists():return dst,json.loads(meta.read_text())
 v=plan['voices'][c['who']]
 inp={'speakers':[{'speaker_id':'Speaker 1','voice_name':v['voice_name'],
       'audio_profile':v.get('audio_profile',''),'style':c.get('style','Deadpan'),
       'pace':'Natural','accent':'American (Gen)'}],
      'dialogue_turns':[{'speaker_id':'Speaker 1','text':c.get('synthesis_text',c['text'])}],
      'scene':c.get('delivery_scene') or (plan['scene'] if c['who']=='danny' else
       'A wary teenage boy and a night guard speak plainly in a dark mall.' if c['who']=='theo' else
       'A woman talks over a security walkie-talkie at night, unhurried and amused.'),
      'sample_context':plan['sample_context'],'temperature':1}
 kie=ns['kie'];task=meta.with_suffix('.task.json')
 if task.exists():
  tid=json.loads(task.read_text())['taskId']
 else:
  out=kie.post_json(f'{kie.API}/jobs/createTask',{'model':'google/gemini-3-1-flash-tts','input':inp})
  if out.get('code')!=200:raise RuntimeError(f"Voice service returned {out.get('code')}: {out.get('msg')}")
  tid=out['data']['taskId'];task.write_text(json.dumps({'taskId':tid,'chunk':c['id'],'take':index}))
 began=time.monotonic()
 while True:
  info=json.loads(kie.req(f'{kie.API}/jobs/recordInfo?taskId={tid}'));d=info.get('data') or {}
  if d.get('state')=='success':break
  if d.get('state')=='fail':raise RuntimeError(f"Voice task failed: {d.get('failMsg')}")
  if time.monotonic()-began>900:raise RuntimeError('Voice task remains pending; resume without submitting another task.')
  time.sleep(5)
 url=json.loads(d['resultJson'])['resultUrls'][0];kie.download(url,dst)
 safe={k:d.get(k) for k in ['taskId','creditsConsumed','consumeCredits','costTime']}
 meta.write_text(json.dumps(safe,indent=2));return dst,safe

def assess(c,path):
 ok,sim,dur,expected,transcript=ns['validate'](model,c,path)
 # One-word replies are allowed here; the complete scripted dialogue includes them.
 pcm=ns['load16'](path);segments,_=model.transcribe(pcm,language='en',beam_size=5,word_timestamps=True)
 words=[{'w':w.word.strip(),'s':w.start,'e':w.end} for seg in segments for w in seg.words]
 voiced=np.abs(pcm);voiced=voiced[voiced>.01]
 pitch=0
 try:
  import parselmouth
  f=parselmouth.Sound(pcm.astype(np.float64),sampling_frequency=16000).to_pitch_ac(pitch_floor=60,pitch_ceiling=350).selected_array['frequency'];f=f[f>0]
  pitch=float(np.median(f)) if len(f) else 0
 except Exception:pass
 return {'ok':ok,'similarity':sim,'duration':dur,'pitch':pitch,'transcript':transcript,'words':words}

chunks=[c for c in plan['chunks'] if not args.only or c['id'] in args.only.split(',')]
if not args.build_only:
 pending=[]
 for c in chunks:
  for index in range(1,args.takes+1):
   if not (takes/f"{c['id']}-{index}.assessment.json").exists():pending.append((c,index))
 print(f'{len(pending)} takes to record; existing takes are reused.',flush=True)
 with cf.ThreadPoolExecutor(max_workers=args.workers) as pool:
  futs={pool.submit(request,c,index):(c,index) for c,index in pending}
  for fut in cf.as_completed(futs):
   c,index=futs[fut]
   try:
    path,meta=fut.result();a=assess(c,path)
    (takes/f"{c['id']}-{index}.assessment.json").write_text(json.dumps(a,indent=1))
    record[f"{c['id']}-{index}"]={**meta,**{k:v for k,v in a.items() if k!='words'}}
    journal.write_text(json.dumps(record,indent=1))
    print(c['id'],index,'accepted' if a['ok'] else 'needs retake',f"similarity {a['similarity']:.2f}, {a['duration']:.1f}s",flush=True)
   except BaseException as e:
    print(c['id'],index,type(e).__name__,str(e)[:180],flush=True)
# Retry only chunks whose first candidates both failed, never the entire chapter.
if not args.build_only:
 for retry in range(args.takes+1,args.takes+3):
  failures=[]
  for c in chunks:
   assessments=[json.loads(p.read_text()) for p in takes.glob(c['id']+'-*.assessment.json')]
   if not any(a.get('ok') for a in assessments):failures.append(c)
  if not failures:break
  print('Targeted retakes:',len(failures),'candidate',retry,flush=True)
  with cf.ThreadPoolExecutor(max_workers=args.workers) as pool:
   futures={pool.submit(request,c,retry):c for c in failures}
   for future in cf.as_completed(futures):
    c=futures[future]
    try:
     path,meta=future.result();assessment=assess(c,path)
     (takes/f"{c['id']}-{retry}.assessment.json").write_text(json.dumps(assessment,indent=1))
     print(c['id'],'retry',retry,'accepted' if assessment['ok'] else 'failed validation',flush=True)
    except BaseException as error:print(c['id'],'retry failed',str(error)[:150],flush=True)

# Prefer accepted takes close to Danny's established 80–91 Hz median, using the original profile.
missing=[]
for c in chunks:
 choices=[]
 for index in range(1,args.takes+3):
  assessment=takes/f"{c['id']}-{index}.assessment.json"
  if not assessment.exists():continue
  a=json.loads(assessment.read_text())
  if a['ok']:
   score=(a['similarity'], -abs(a['pitch']-86) if c['who']=='danny' and a['pitch'] else 0)
   choices.append((score,index,a))
 if not choices:missing.append(c['id']);continue
 _,index,a=max(choices,key=lambda x:x[0]);src=takes/f"{c['id']}-{index}.wav";dst=takes/f"{c['id']}.wav"
 import shutil
 shutil.copyfile(src,dst);selected[c['id']]={'take':index,**a}
(VO/'selected.json').write_text(json.dumps(selected,indent=1))
if missing:raise SystemExit('Unaccepted or missing chunks; resume and retake these before final rendering: '+','.join(missing))
if args.only:raise SystemExit('Selected chunks recorded. Run --build-only without --only to assemble the chapter.')
ns['build']()
# Chapter Three keeps its natural length (about 33 minutes); no tempo fitting.
(ROOT/'public/mall/ch3').mkdir(parents=True,exist_ok=True)
subprocess.run([sys.executable,str(HERE/'make_plan.py')],check=True)
subprocess.run(['bash',str(MALL/'vo_export.sh'),str(VO/'vo.wav'),str(ROOT/'public/mall/ch3/vo.mp3')],check=True)
# Align each assembled spoken chunk independently to prevent drift over the half-hour narration.
data_path=ROOT/'src/mall/chapter3/ch3.json';data=json.loads(data_path.read_text());pcm=ns['load16'](VO/'vo.wav');cw=[];actual_words=[]
for si,seg in enumerate(data['segments']):
 audio=pcm[int(seg['s']*16000):int(seg['e']*16000)]
 got,_=model.transcribe(audio,language='en',word_timestamps=True,beam_size=5,initial_prompt='Maplecrest Mall. Danny. Theo. Vera. Marcus. Pancake. Kip. Boone. Walt. Lily. Cephalexin. B3.')
 heard=[w for g in got for w in g.words];tokens=seg['text'].split();normal=lambda x:re.sub(r"[^a-z0-9']",'',x.lower().replace('-',''))
 matches=difflib.SequenceMatcher(None,[normal(w) for w in tokens],[normal(w.word) for w in heard],autojunk=False)
 anchors={}
 for block in matches.get_matching_blocks():
  for k in range(block.size):anchors[block.a+k]=heard[block.b+k]
 for wi,w in enumerate(tokens):
  match=anchors.get(wi)
  if match:start=seg['s']+match.start;end=seg['s']+match.end
  else:
   left=max((j for j in anchors if j<wi),default=-1);right=min((j for j in anchors if j>wi),default=len(tokens))
   a=seg['s']+anchors[left].end if left>=0 else seg['s'];b=seg['s']+anchors[right].start if right<len(tokens) else seg['e']
   step=max(.02,(b-a)/(right-left));start=a+(wi-left-1)*step;end=start+step
  cw.append({'w':w,'n':normal(w),'s':round(start,3),'e':round(end,3),'seg':si,'kind':seg['kind'],'id':seg.get('id')})
 print('Aligned',si+1,'/',len(data['segments']),flush=True)
data['cwords']=cw;data['timing']='recorded';data_path.write_text(json.dumps(data,indent=1))
subprocess.run([sys.executable,str(MALL/'make_srt.py'),str(data_path),str(ROOT/'publish/night-guard-chapter-3.srt')],check=True)
data['voiceReady']=True;data_path.write_text(json.dumps(data,indent=1))
(VO/'complete.json').write_text(json.dumps({'words':len(cw),'duration':data['duration'],'accepted_chunks':len(selected)},indent=2))
print('Chapter Three voice and captions ready.',flush=True)
