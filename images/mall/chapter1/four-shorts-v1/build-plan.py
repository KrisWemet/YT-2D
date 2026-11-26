"""Frame-aligned, reversible four-part edit of the painted Chapter One master."""
import json, math, pathlib, collections

REPO = pathlib.Path(__file__).resolve().parents[4]
SOURCE = json.loads((REPO/'src/mall/chapter1/ch1.json').read_text())
PAINT = json.loads((REPO/'src/mall/chapter1/painted-edit.json').read_text())
OUT = REPO/'out/chapter1-four-shorts-v1'
OUT.mkdir(parents=True, exist_ok=True)
SPECS = [
 dict(title='Forty-Two Keys', opening='MY DEAD BEST FRIEND\nWAS AT THE GATE.', closing='WHICH DOOR\nWOULD YOU CHOOSE?', next='PART 2 · I HAD THE KEY', groups=[[0,4],[5,8],[11,23],[29,35],[38,43],[46,47],[49,49]]),
 dict(title='I Had the Key', opening='4 MINUTES.\nWHICH STORE?', closing='HE STOPPED BREATHING.\nTHEN HE STOOD UP.', next='PART 3 · THE RADIO', groups=[[51,51],[53,57],[60,63],[65,66],[68,68],[70,70],[72,87],[89,98]]),
 dict(title='The Radio', opening='40 OF THEM.\nONE GATE.', closing='HOW DID SHE\nGET INSIDE?', next='PART 4 · THE WINDOW', groups=[[106,106],[99,99],[101,105],[107,131]]),
 dict(title='Three Blinks', opening='30 DAYS FOR RESCUE.\n10 DAYS OF INSULIN.', closing='WHO’S IN\nTHE WINDOW?', next='CONTINUE IN CHAPTER 2', groups=[[159,160],[137,142],[145,147],[149,150],[152,152],[163,163],[165,165],[169,188]]),
]

def stamp(t):
 ms=round(t*1000); return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'

parts=[]
for p,spec in enumerate(SPECS,1):
 cuts=[]; words=[]; shots=[]; cursor=0
 for a,b in spec['groups']:
  segs=SOURCE['segments']; ww=[w for w in SOURCE['cwords'] if a<=w['seg']<=b]
  # Segment boundaries are the original concatenated takes; aligned word cues
  # add handles where the recognizer places a leading/trailing word outside one.
  start=min(segs[a]['s'],min(w['s'] for w in ww))-.07
  end=max(segs[b]['e'],max(w['e'] for w in ww))+.10
  if a: start=max(start,segs[a-1]['e']+.035)
  if b+1<len(segs): end=min(end,segs[b+1]['s']-.035)
  lo=max(0,math.floor(start*30)); hi=math.ceil(end*30)
  cut=dict(start=cursor,source=lo,frames=hi-lo,firstSegment=a,lastSegment=b)
  if p==3 and a==106: cut['assetOverride']='hall-crowd'
  if p==3 and a==99: cut['tag']='MOMENTS EARLIER'
  if p==4 and a==137: cut['tag']='EARLIER THAT MORNING'
  if p==4 and a==163: cut['tag']='THAT AFTERNOON'
  cuts.append(cut)
  for w in ww:
   ws=max(0,w['s']-lo/30)+cursor/30; we=min((hi-lo)/30,w['e']-lo/30)+cursor/30
   if we>ws: words.append(dict(w=w['w'],s=round(ws,4),e=round(we,4),seg=w['seg'],kind=w['kind'],id=w.get('id')))
  for sh in PAINT['shots']:
   l=max(lo,sh['start']); h=min(hi,sh['start']+sh['frames'])
   if h>l:
    asset=cut.get('assetOverride',sh['asset'])
    shots.append(dict(start=cursor+l-lo,source=l,frames=h-l,asset=asset,sourceAsset=sh['asset'],view=sh['view'],cue=sh['cue']))
  cursor+=hi-lo
 # Fold sub-half-second picture remnants into the adjacent intended shot.
 # The audio clock stays untouched; this prevents flash frames at new edits.
 for cut in cuts:
  group=[s for s in shots if cut['start']<=s['start']<cut['start']+cut['frames']]
  for i,sh in enumerate(group):
   if sh['frames']<15 and len(group)>1:
    neighbor=group[i+1] if i+1<len(group) else group[i-1]
    sh['asset']=neighbor['asset']
 cleaned=[]
 for sh in shots:
  if cleaned and cleaned[-1]['asset']==sh['asset'] and cleaned[-1]['start']+cleaned[-1]['frames']==sh['start']:
   cleaned[-1]['frames']+=sh['frames']
  else:cleaned.append(sh)
 shots=cleaned
 # Short captions: at most six words, wrap near 25 characters, and never
 # bridge a discontinuous edit or speaker change.
 captions=[]; chunk=[]
 def flush():
  if not chunk:return
  lines=['']
  for w in chunk:
   if len(lines[-1])+len(w['w'])+1>25 and lines[-1]: lines.append('')
   lines[-1]+=(' ' if lines[-1] else '')+w['w']
  captions.append(dict(s=chunk[0]['s'],e=chunk[-1]['e'],text='\n'.join(lines),words=list(chunk)))
  chunk.clear()
 for w in words:
  if chunk and (len(chunk)>=5 or len(' '.join(x['w'] for x in chunk))+len(w['w'])>42 or w['s']-chunk[-1]['e']>.42 or w['kind']!=chunk[-1]['kind'] or w['seg']!=chunk[-1]['seg']):flush()
  chunk.append(w)
 flush()
 part=dict(part=p,title=spec['title'],openingHook=spec['opening'],closingHook=spec['closing'],nextLabel=spec['next'],fps=30,storyFrames=cursor,tailFrames=66,frames=cursor+66,cuts=cuts,shots=shots,words=words,captions=captions)
 # A use is one continuous shot of an asset; split edit fragments count again.
 uses=collections.Counter(sh['asset'] for sh in shots)
 part['imageUses']=dict(uses)
 assert part['frames']<5400,(p,part['frames']/30)
 assert max(uses.values())<=3,(p,uses)
 srt='\n\n'.join(f"{i+1}\n{stamp(c['s'])} --> {stamp(c['e'])}\n{c['text']}" for i,c in enumerate(captions))+'\n'
 (OUT/f'night-guard-chapter-1-short-{p:02}.srt').write_text(srt)
 parts.append(part)
 print(p,spec['title'],round(part['frames']/30,3),'seconds',len(shots),'shots',max(uses.values()),'max uses')

(REPO/'src/mall/chapter1/four-shorts.json').write_text(json.dumps(dict(version=1,source='night-guard-chapter-1-painted-v1.mp4',parts=parts),indent=2)+'\n')
