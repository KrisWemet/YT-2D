#!/usr/bin/env python3
"""Chapter Two production source. Run again after recording to replace estimated timings.
The approved manuscript stays authoritative. Estimated timing is for visual development only.
"""
from pathlib import Path
import json,re
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
VO=HERE.parent/'vo/ch2'
VO.mkdir(parents=True,exist_ok=True)
# Quoted dialogue in manuscript order. d = Danny, t = Theo, v = Vera.
SPEAKERS={
 1:'tt',2:'vvdvdvvdvdvvdv',3:'vdvdv',4:'',5:'dtdtttdtdt',
 6:'dtdtddtdttdtttddtdt',7:'tttddtdtdtvvddtd',8:'tttdtdtt',9:'tt',10:'ttttttt',
 11:'dtdttdttdttdttttdt',12:'dtdtdtdtddtt',13:'dtdtddtdtddvvdvdvt',14:'tdtdttt'
}
# Every part has its own timeline anchor. Scene notes drive the same Chapter One renderer.
parts=re.split(r'(?m)^### ',(HERE/'script.md').read_text())[1:]
paragraphs=[]
chunks=[]
for part in parts:
 lines=part.splitlines(); number=int(lines[0].split('.')[0]); title=lines[0].split('. ',1)[1]
 tag=next(l.strip('*') for l in lines[1:] if l.startswith('*'))
 body='\n'.join(l for l in lines[1:] if not l.startswith('*')).strip()
 quoted=re.findall('“([^”]+)”',body)
 assert len(quoted)==len(SPEAKERS[number]),(number,len(quoted),len(SPEAKERS[number]))
 speaker_iter=iter(SPEAKERS[number]); chunk_idx=0
 for pi,paragraph in enumerate(re.split(r'\n\s*\n',body),1):
  pid=f'c2_{number:02d}_{pi:03d}'
  paragraphs.append({'id':pid,'section':number,'title':title,'tag':tag,'text':paragraph})
  pieces=re.split(r'“([^”]+)”',paragraph)
  for j,piece in enumerate(pieces):
   text=piece.strip()
   if not text:continue
   who=next(speaker_iter) if j%2 else 'd'
   who={'d':'danny','t':'theo','v':'vera'}[who]
   # Spoken narration includes the author's attribution without the quotation marks.
   text=text.lstrip(', ').replace('’',"'")
   if not re.search('[A-Za-z0-9]',text):continue
   can_merge=(chunks and chunks[-1]['section']==number and chunks[-1]['who']==who and
              len((chunks[-1]['text']+' '+text).split())<=62 and not chunks[-1].get('section_end'))
   if can_merge:
    chunks[-1]['text']+=' '+text
    chunks[-1]['paragraphs'].append(pid)
   else:
    chunk_idx+=1
    chunks.append({'id':f'c2_{number:02d}_v{chunk_idx:03d}','who':who,'text':text,'section':number,
                   'paragraphs':[pid],'style':'Deadpan',
                   'pace':'Natural','gap':0.20,'lufs':-20.5 if number in [1,9,10] else -18.0,
                   **({'radio':'vera','lufs':-19.5} if who=='vera' else {})})
  paragraphs[-1]['chunks']=[c['id'] for c in chunks if pid in c['paragraphs']]
 chunks[-1]['section_end']=True
 chunks[-1]['gap']=4.0 if number==1 else 1.1
for chunk in chunks:
 if chunk['id']=='c2_11_v009':
  chunk['synthesis_text']='He said. You know ONE?'
  chunk['delivery_scene']='Danny asks Theo if he knows a different route through the mall. The question ends with the number one.'
base=json.loads((HERE.parent/'vo/ch1/plan.json').read_text())
voices={k:base['voices'][k] for k in ['danny','vera']}
voices['theo']={'voice_name':'Puck','accent':'American (Gen)',
 'audio_profile':'Theo, a fifteen-year-old boy. His voice is youthful and natural, wary of adults, understated and observant. He speaks plainly without theatrical emotion. Never a cartoon voice.'}
plan={'voices':voices,'scene':base['scene'],'sample_context':base['sample_context'],'temperature':1,
      'level':'fixed','tempo':1.08,'max_pause':0.22,'min_sim':0.9,'chunks':chunks}
(VO/'plan.json').write_text(json.dumps(plan,indent=2))
(HERE/'paragraphs.json').write_text(json.dumps(paragraphs,indent=2))
# Use actual per-chunk audio spans when available; never present this estimate as final narration.
actual=VO/'segments.json'
recorded=json.loads(actual.read_text()) if actual.exists() else None
by_chunk={s['chunk']:s for s in recorded['segments']} if recorded else {}
t=.3;segs=[];cwords=[]
for c in chunks:
 tokens=c['text'].split()
 if recorded:
  g=by_chunk[c['id']];start=g['s'];end=g['e']
 else:
  start=t;end=t+len(tokens)/3.32
 seg={'kind':'radio' if c.get('radio') else 'narr','text':c['text'],'s':round(start,3),
      'e':round(end,3),'chunk':c['id'],'who':c['who'],'section':c['section'],
      **({'id':'vera'} if c.get('radio') else {})}
 idx=len(segs);segs.append(seg)
 # Word-level estimates are replaced by forced alignment in record_voice.py.
 for wi,w in enumerate(tokens):
  ws=start+(end-start)*wi/len(tokens);we=start+(end-start)*(wi+1)/len(tokens)
  cwords.append({'w':w,'n':re.sub(r"[^a-z0-9']",'',w.lower().replace('-','')),
    's':round(ws,3),'e':round(we,3),'seg':idx,'kind':seg['kind'],'id':seg.get('id')})
 t=end+c['gap']
D=recorded['duration'] if recorded else t+1.2
out={'duration':round(D,3),'timing':'recorded' if recorded else 'estimate','voiceReady':False,
     'segments':segs,'cwords':cwords,'parts':[],'paragraphs':[]}
for n in range(1,15):
 ps=[p for p in paragraphs if p['section']==n]
 ss=[g for g in segs if g['section']==n]
 out['parts'].append({'n':n,'title':ps[0]['title'],'tag':ps[0]['tag'],
                      's':ss[0]['s'],'e':ss[-1]['e']})
for p in paragraphs:
 related=[g for g in segs if g['chunk'] in p['chunks']]
 # Divide shared narration chunks by their manuscript word offsets.
 first=related[0];last=related[-1]
 before=[]
 for prev in paragraphs:
  if prev['id']==p['id']:break
  if first['chunk'] in prev['chunks']:before.append(prev['text'])
 offset=len(' '.join(before).split())
 start=first['s']+(first['e']-first['s'])*min(.95,offset/max(1,len(first['text'].split())))
 out['paragraphs'].append({**p,'s':round(start,3),'e':last['e']})
# Storyboard and renderer use chunk starts for robust, precisely replaceable timing anchors.
(ROOT/'src/mall/chapter2/ch2.json').write_text(json.dumps(out,indent=1))
print(len(chunks),'voice chunks;',len(paragraphs),'paragraphs;',len(cwords),'spoken words')
print('Timeline:',out['timing'],round(D/60,2),'minutes')
