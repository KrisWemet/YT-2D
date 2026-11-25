from pathlib import Path
import json,re
REPO=Path(__file__).resolve().parents[4]
WORK=REPO/'out/chapter2-retention'
WORK.mkdir(parents=True,exist_ok=True)
DATA=REPO/'src/mall/chapter2'
d=json.loads((DATA/'ch2.json').read_text())
FPS=30
F=lambda s:round(s*FPS)
# v10 is the still-screen cut: no story pause longer than three seconds.
VERSION,NAME,RETURN_SECONDS=10,'v10',2.3
# Cut only between complete spoken clauses, with short handles around their words.
removals=[
 (338.80,343.30,'Remove advance footprints reveal'),
 (453.27,458.76,'Let the boy appear before describing him'),
 (576.12,581.70,'Discover the four months in conversation'),
 (702.78,707.46,'Remove repeated water premise'),
 (710.80,723.58,'Tighten fountain tangent'),
 (777.42,784.74,'Condense duplicate container selection'),
 (786.77,792.64,'Remove repeated container lifting'),
 (834.94,842.98,'Remove repeated nightly signal explanation'),
 (867.36,873.00,'Remove advance doorway summary'),
 (906.333,911.10,'Keep first support lesson, remove second practice'),
 (1238.21,1244.87,'Protect water and drill discoveries'),
 (1370.03,1376.23,'Remove drill summary before reaction'),
 (1522.91,1527.60,'Let pick-a-tent moment play first'),
 (1644.30,1650.05,'Protect copied signal reveal'),
 (1683.25,1688.88,'Reveal second light visually before narration'),
]
clips=[];cursor=0

def source(a,b,label='Story'):
 global cursor
 a,b=F(a),F(b)
 if b<=a:return
 clips.append(dict(kind='source',start=cursor,frames=b-a,source=a,label=label))
 cursor+=b-a

def insert(kind,seconds,label):
 global cursor
 frames=F(seconds)
 clips.append(dict(kind=kind,start=cursor,frames=frames,label=label));cursor+=frames

source(0,7.28,'Danger hook')
source(72.00,76.08,'Stop moving')
source(84.15,86.28,'Chapter title')
# Story pauses stay at three seconds or less: the title card is a beat shorter, and the story
# starts a little closer to its first word.
pos=86.43
for a,b,label in removals+[(1800,1800,'end')]:
 if pos<1471.15<a:
  source(pos,1471.15)
  insert('return-choice',RETURN_SECONDS,'Danny chooses Theo over water')
  pos=1471.15
 source(pos,min(a,1800))
 pos=b
 if a==1800:break
# Keep precisely the source composition end, with no accidental repeated frame.
baseframes=round((d['duration']+10)*FPS)
excess=clips[-1]['source']+clips[-1]['frames']-baseframes
clips[-1]['frames']-=excess;cursor-=excess

words=[]
for clip in clips:
 if clip['kind']!='source':continue
 a=clip['source']/FPS;b=(clip['source']+clip['frames'])/FPS;offset=clip['start']/FPS-a
 for w in d['cwords']:
  if a<=w['s']<b:
   if w['e']>b+.025:raise ValueError(f'Cut clips a word: {w}')
   words.append({**w,'s':round(w['s']+offset,3),'e':round(min(b,w['e'])+offset,3),'who':d['segments'][w['seg']]['who'],'source':w['s']})
# New artwork is used only by this revision, so earlier compositions stay reproducible.
cutaways=[
 (0,4.9,'ceiling-up'),(4.9,7.28,'ceiling-down'),
 (418.15,422.5,'prints-wall'),
 (1033.0,1043.8,'ceiling-down'),
 (1080.0,1085.0,'ceiling-up'),
 (1120.1,1126.9,'ceiling-up'),
 (1154.6,1161.6,'grip'),
 (1206.0,1214.7,'ceiling-down'),
 (1688.88,1697.4,'second-light'),
 (1711.3,1718.0,'freeze'),
]
chapters=[]
for part in d['parts']:
 ww=[w for w in words if d['segments'][w['seg']]['section']==part['n']]
 if ww:chapters.append(dict(n=part['n'],title=part['title'],time=0 if part['n']==1 else max(0,ww[0]['s']-.1)))
manifest=dict(version=VERSION,fps=FPS,frames=cursor,seconds=cursor/FPS,recap=False,audioReady=False,clips=clips,
 cutaways=[dict(sourceStart=F(a),sourceEnd=F(b),view=v) for a,b,v in cutaways],chapters=chapters,
 editorialCuts=[dict(start=a,end=b,reason=r) for a,b,r in removals],words=words)
(DATA/'retention-edit.json').write_text(json.dumps(manifest,indent=1)+'\n')

out=WORK/'delivery'
out.mkdir(parents=True,exist_ok=True)
def ts(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
subs=[];group=[]
for w in words:
 if group and (len(group)>=10 or w['s']-group[0]['s']>3.8 or w['seg']!=group[-1]['seg'] or w['s']-group[-1]['e']>.7):
  subs.append((group[0]['s'],group[-1]['e'],' '.join(x['w'] for x in group)));group=[]
 group.append(w)
if group:subs.append((group[0]['s'],group[-1]['e'],' '.join(x['w'] for x in group)))
insertclip=next(c for c in clips if c['kind']=='return-choice')
for a,b,t in [(.2,2.2,'[metal strains, water spills]')]:
 subs.append((insertclip['start']/FPS+a,insertclip['start']/FPS+b,t))
subs.sort()
srt='\n'.join(f'{i+1}\n{ts(a)} --> {ts(b)}\n{t}\n' for i,(a,b,t) in enumerate(subs))
(out/f'night-guard-chapter-2-{NAME}.srt').write_text(srt)
(REPO/f'publish/night-guard-chapter-2-{NAME}.srt').write_text(srt)
markers='\n'.join(f"{int(c['time'])//60}:{int(c['time'])%60:02} {c['title']}" for c in chapters)+'\n'
(out/f'night-guard-chapter-2-{NAME}-chapters.txt').write_text(markers)
(REPO/f'publish/night-guard-chapter-2-{NAME}-chapters.txt').write_text(markers)
script=['# The Night Guard — Chapter Two, retention cut','', 'No recap. Original recorded performances are retained. The return-trip choice is told visually.','']
last=None
for c in clips:
 if c['kind']=='return-choice':
  script+=['[2.3-second still: Theo’s injured leg buckles on the steel support. Danny holds him while one jug slides off the edge and spills its water.]','']
  continue
 ww=[w for w in words if c['start']/FPS-.001<=w['s']<(c['start']+c['frames'])/FPS]
 group=[]
 for w in ww:
  if group and w['seg']!=group[-1]['seg']:
   script+= [f"**{group[0]['who'].title()}:** "+' '.join(x['w'] for x in group),''];group=[]
  group.append(w)
 if group:script+=[f"**{group[0]['who'].title()}:** "+' '.join(x['w'] for x in group),'']
(REPO/'images/mall/chapter2/retention-script.md').write_text('\n'.join(script))
(out/f'night-guard-chapter-2-{NAME}-script.md').write_text('\n'.join(script))
print(json.dumps(dict(frames=cursor,seconds=cursor/FPS,words=len(words),edits=len(removals),clips=len(clips),newActionAt=insertclip['start']/FPS),indent=2))
