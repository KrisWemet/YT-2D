"""Retimestamp recorded word cues through the existing retention edit."""
import json, re, textwrap
from pathlib import Path

ROOT=Path(__file__).resolve().parents[4]
HERE=Path(__file__).resolve().parent
plan=json.loads((ROOT/'src/mall/chapter2/illustrated-part-two.json').read_text())
edit=json.loads((ROOT/'src/mall/chapter2/retention-edit.json').read_text())
data=json.loads((ROOT/'src/mall/chapter2/ch2.json').read_text())
previous=json.loads((ROOT/'src/mall/chapter2/illustrated-part-one.json').read_text())
assert plan['retentionStartFrame']==previous['frames']
lo,hi=plan['retentionStartFrame']/30,plan['retentionStoryEndFrame']/30
words=[]
for clip in edit['clips']:
 if clip['kind']!='source':continue
 source,final,duration=clip['source']/30,clip['start']/30,clip['frames']/30
 for w in data['cwords']:
  if not source<=(w['s']+w['e'])/2<source+duration:continue
  a=max(w['s'],source)-source+final
  b=min(w['e'],source+duration)-source+final
  if lo<=(a+b)/2<hi:
   words.append(dict(w=w['w'],s=max(0,a-lo),e=min(hi-lo,b-lo)))
words.sort(key=lambda w:w['s'])
assert ' '.join(w['w'] for w in words[:2])=='The fountain,'
assert ' '.join(w['w'] for w in words[-6:]).lower()=='they were cutting through the wall,'

groups=[];current=[]
for w in words:
 if current and (len(' '.join(x['w'] for x in current))+len(w['w'])>76 or w['s']-current[0]['s']>5.5 or w['s']-current[-1]['e']>.8):
  groups.append(current);current=[]
 current.append(w)
 if re.search(r'[.!?]$',w['w']) and w['e']-current[0]['s']>=1.1:
  groups.append(current);current=[]
if current:groups.append(current)
def stamp(t):
 n=round(t*1000);h,n=divmod(n,3600000);m,n=divmod(n,60000);s,n=divmod(n,1000)
 return f'{h:02}:{m:02}:{s:02},{n:03}'
cues=[]
for i,g in enumerate(groups):
 a=g[0]['s'];b=min(hi-lo,max(g[-1]['e']+.08,a+.7))
 if i+1<len(groups):b=min(b,groups[i+1][0]['s']-.02)
 assert 0<=a<b<=plan['frames']/30
 txt=' '.join(w['w'] for w in g)
 if i==len(groups)-1:txt=txt.rstrip(',')+'.'
 lines=textwrap.wrap(txt,width=42,break_long_words=False,break_on_hyphens=False)
 assert len(lines)<=2,(i,txt)
 cues.append(f'{i+1}\n{stamp(a)} --> {stamp(b)}\n'+ '\n'.join(lines))
(HERE/'part-two.srt').write_text('\n\n'.join(cues)+'\n')
(HERE/'word-cues.json').write_text(json.dumps(words,indent=2)+'\n')
print(json.dumps(dict(cues=len(cues),words=len(words),first=words[0],last=words[-1])))
