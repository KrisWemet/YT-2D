#!/usr/bin/env python3
"""Chapter Three production source. Run again after recording to replace estimated timings.
The approved manuscript (script.md) stays authoritative. Estimated timing is for visual development only.
"""
from pathlib import Path
import json,re
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
import os
# A listening draft (for example the Kokoro voices) can use its own voice folder and timing file.
VO=HERE.parent/os.environ.get('CH3_VO','vo/ch3')
VO.mkdir(parents=True,exist_ok=True)
OUT_JSON=Path(os.environ['CH3_JSON']) if os.environ.get('CH3_JSON') else ROOT/'src/mall/chapter3/ch3.json'
# Quoted dialogue in manuscript order. d = Danny, t = Theo, v = Vera.
SPEAKERS={
 1:'',2:'ttdt',3:'t',4:'dttdt',5:'',6:'',7:'ddtdtdt',8:'',9:'',10:'d',11:'',
 12:'vvvvdvvdttdtd',13:'vvvvvvdvvvdvvvdvv',14:'ttdtdtdt'
}
TENSE={1,8,11}          # among the dead: Danny a little under the story level
FEVER={3,4,7,12}        # Theo is sick in these sections
RADIO={12}              # Vera on the walkie-talkie; in section 13 she is face to face
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
  pid=f'c3_{number:02d}_{pi:03d}'
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
    chunk={'id':f'c3_{number:02d}_v{chunk_idx:03d}','who':who,'text':text,'section':number,
           'paragraphs':[pid],'style':'Deadpan','pace':'Natural','gap':0.20,
           'lufs':-20.5 if number in TENSE else -18.0}
    if who=='vera' and number in RADIO:chunk.update(radio='vera',lufs=-19.5)
    elif who=='vera':
     chunk.update(lufs=-18.5,delivery_scene='A woman in her forties talks face to face across a rooftop fence '
                  'in daylight, warm, unhurried and amused.')
    if who=='theo' and number in FEVER:
     chunk['delivery_scene']=('A sick, feverish fifteen-year-old boy answers from a tent in a dark store. '
                              'Tired and plain, in his own normal voice.')
    chunks.append(chunk)
  paragraphs[-1]['chunks']=[c['id'] for c in chunks if pid in c['paragraphs']]
 chunks[-1]['section_end']=True
 # The chapter title sits after the cold open; story pauses stay under three seconds.
 chunks[-1]['gap']=2.5 if number==1 else 1.1
for chunk in chunks:
 # Signs and notes are written in capitals; read them as words, and S-O-S as letters.
 spoken=re.sub(r"\bS-?O-?S\b",'S. O. S',chunk['text'])
 spoken=re.sub(r"\b[A-Z]{2,}(?:[ ,]+[A-Z]{2,})*\b",lambda m:m.group(0).lower(),spoken)
 if spoken!=chunk['text']:chunk['synthesis_text']=spoken
 # The transcriber may write "212" or "mid-40s"; allow the one extra word that makes.
 if 'two-twelve' in chunk['text'] or 'Mid-forties' in chunk['text']:chunk['allow_extra']=1
base=json.loads((HERE.parent/'vo/ch1/plan.json').read_text())
ch2=json.loads((HERE.parent/'vo/ch2/plan.json').read_text())
voices={k:base['voices'][k] for k in ['danny','vera']}
voices['theo']=ch2['voices']['theo']
plan={'voices':voices,'scene':base['scene'],'sample_context':base['sample_context'],'temperature':1,
      'level':'fixed','tempo':1.08,'max_pause':0.22,'min_sim':0.9,'chunks':chunks}
if not os.environ.get('CH3_VO'):
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
OUT_JSON.parent.mkdir(parents=True,exist_ok=True)
OUT_JSON.write_text(json.dumps(out,indent=1))
print(len(chunks),'voice chunks;',len(paragraphs),'paragraphs;',len(cwords),'spoken words')
print('Timeline:',out['timing'],round(D/60,2),'minutes')
