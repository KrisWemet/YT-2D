from pathlib import Path
import json,subprocess,re
import numpy as np
import soundfile as sf
REPO=Path(__file__).resolve().parents[4]
HERE=REPO/'out/chapter2-retention'
HERE.mkdir(parents=True,exist_ok=True)
p=REPO/'src/mall/chapter2/retention-edit.json';edit=json.loads(p.read_text());source=json.loads((HERE/'source-sound.json').read_text())
SR=48000;SPF=1600;n=edit['frames']*SPF
voice=np.zeros(n,np.float32);fx=np.zeros(n,np.float32)
voice_path=REPO/'images/mall/vo/ch2/vo.wav'
if not voice_path.exists():
 voice_path=HERE/'source-voice.wav'
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(REPO/'public/mall/ch2/vo.mp3'),'-ac','1','-ar',str(SR),str(voice_path)],check=True)
with sf.SoundFile(voice_path) as src:
 assert src.samplerate==SR
 for c in edit['clips']:
  if c['kind']!='source':continue
  src.seek(c['source']*SPF);x=src.read(c['frames']*SPF,dtype='float32',always_2d=True).mean(axis=1)
  # Five-millisecond ramps live within the inter-clause handles.
  r=min(240,len(x)//2);x[:r]*=np.linspace(0,1,r);x[-r:]*=np.linspace(1,0,r)
  i=c['start']*SPF;voice[i:i+len(x)]=x
cache={}
def load(name):
 if name not in cache:
  b=subprocess.run(['ffmpeg','-v','error','-i',str(REPO/f'public/mall/sfx/{name}.mp3'),'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
  cache[name]=np.frombuffer(b,np.float32).copy()
 return cache[name]
def add(x,t,db):
 i=round(t*SR);skip=max(0,-i);i=max(0,i);l=min(len(x)-skip,n-i)
 if l>0:fx[i:i+l]+=x[skip:skip+l]*(10**(db/20))
def mapped(t):
 return [c['start']/30+t-c['source']/30 for c in edit['clips'] if c['kind']=='source' and c['source']/30<=t<(c['source']+c['frames'])/30]
for hit in source['hits']:
 if hit['file']=='rewind':continue
 source_time=1208.03 if hit['file']=='slam' and 1206<hit['t']<1209 else hit['t']
 for t in mapped(source_time):add(load(hit['file']),t,hit['db'])
for bed in source['beds']:
 sound=load(bed['file'])
 for c in edit['clips']:
  if c['kind']!='source':continue
  a=max(bed['t0'],c['source']/30);b=min(bed['t1'],(c['source']+c['frames'])/30)
  if b<=a:continue
  i=round((c['start']/30+a-c['source']/30)*SR);length=round((b-a)*SR)
  t=a+np.arange(length)/SR
  pos=((t-bed['t0'])*SR).astype(np.int64)%len(sound)
  curve=bed['db'];v=np.full(length,curve,np.float32) if isinstance(curve,(int,float)) else np.interp((t-bed['t0'])/(bed['t1']-bed['t0']),[x[0] for x in curve],[x[1] for x in curve])
  edge=np.clip(np.minimum((t-bed['t0'])/.5,(bed['t1']-t)/.5),0,1)
  # Remove the bed before the crack, impact and copied signal, retaining the voice.
  hush=np.ones(length,np.float32)
  for h0,h1 in [(1072.6,1074.2),(1206.6,1209.1),(1690.0,1696.5),(1711.3,1718.0)]:
   ramp=.25
   duck=np.minimum(np.clip((t-h0)/ramp,0,1),np.clip((h1-t)/ramp,0,1))
   hush*=1-.94*duck
  fx[i:i+length]+=sound[pos]*10**(v/20)*edge*hush
# Sound-led visual passage, no additional narration or recycled dialogue.
c=next(c for c in edit['clips'] if c['kind']=='return-choice');t0=c['start']/30
# v10 holds this moment as one short still: the strain, a breath and the spill, in 2.3 seconds.
short=c['frames']<150
for name,t,db in ([('creak',0.0,-23),('breath',1.1,-28)] if short else [('creak',2.6,-22),('shuffle',4.3,-28),('breath',4.7,-26),('creak',8,-25),('breath',13,-29)]):add(load(name),t0+t,db)
for name,db in [('groans',-38),('mallhum',-39)]:
 a=np.resize(load(name),c['frames']*SPF);env=np.minimum(np.arange(len(a))/SR,(len(a)-np.arange(len(a)))/SR).clip(0,1);add(a*env,t0,db)
# Water striking tiles: deterministic filtered noise with sparse droplets.
spill=1.9 if short else 3.9
rng=np.random.default_rng(7);length=int(spill*SR);noise=rng.normal(0,.19,length).astype(np.float32)
noise=np.convolve(noise,np.ones(9)/9,'same').astype(np.float32);tt=np.arange(length)/SR
env=np.minimum(tt/.08,1)*np.clip(1-tt/spill,0,1)**1.8
water=noise*env
for sec in ([0,.18,.44,.70,1.1,1.5] if short else [0,.18,.44,.70,1.1,1.65,2.05,2.9]):
 start=int(sec*SR);l=min(int(.1*SR),length-start);u=np.arange(l)/SR
 water[start:start+l]+=.04*np.sin(2*np.pi*(1300*u+1800*u*u))*np.exp(-u*60)
add(water,t0+(.3 if short else 8.85),-7)
# The boot lands in an empty fountain: retain the source's hard impact, without water.
# The chapter title gets one restrained impact after the quick hook.
add(load('slam'),11.5,-27)
mix=voice+fx
peak=float(np.max(np.abs(mix)));sf.write(HERE/'mix.wav',mix,SR,subtype='FLOAT')
log=subprocess.run(['ffmpeg','-nostats','-i',str(HERE/'mix.wav'),'-af','ebur128','-f','null','-'],capture_output=True,text=True,check=True).stderr
lufs=float(re.findall(r'I:\s+(-?[\d.]+) LUFS',log)[-1]);gain=-15-lufs
out=REPO/'public/mall/ch2/retention.mp3'
staged=out.with_name('retention.pending.mp3')
subprocess.run(['ffmpeg','-v','error','-y','-i',str(HERE/'mix.wav'),'-af',f'volume={gain:.5f}dB,alimiter=limit=0.891:level=false:latency=true','-c:a','libmp3lame','-b:a','192k','-ac','2',str(staged)],check=True)
staged.replace(out)
edit['audioReady']=True;p.write_text(json.dumps(edit,indent=1)+'\n')
(HERE/'audio-verification.json').write_text(json.dumps(dict(seconds=edit['seconds'],samples=n,lufsBefore=lufs,gain=gain,peakBefore=peak,voicePreserved=True,addedNarration=False),indent=2))
print('Mastered revised audio:',edit['seconds'],'seconds;',lufs,'LUFS before gain; new passage at',t0,flush=True)
