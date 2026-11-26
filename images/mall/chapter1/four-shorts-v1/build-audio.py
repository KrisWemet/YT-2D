"""Recut original mixed audio at sample-accurate video-frame boundaries.

No voice synthesis, speed changes, or remixing. 5ms fades at new edit edges
sit inside the original inter-sentence handles. The final tail lasts 2.2s.
"""
import json, pathlib, subprocess, os, hashlib
import numpy as np

REPO=pathlib.Path(__file__).resolve().parents[4]
WORK=REPO/'out/chapter1-four-shorts-v1'
SOURCE=pathlib.Path(os.environ.get('NIGHT_GUARD_AUDIO_REFERENCE',str(REPO.parent.parent/'outputs/night-guard-chapter-1-painted-v1.mp4')))
WORK.mkdir(parents=True,exist_ok=True)
raw=WORK/'source.f32'
if not raw.exists():subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',str(SOURCE),'-vn','-ac','2','-ar','48000','-f','f32le',str(raw)],check=True)
source=np.memmap(raw,dtype='<f4',mode='r').reshape(-1,2)
plan=json.loads((REPO/'src/mall/chapter1/four-shorts.json').read_text())
public=REPO/'public/mall/ch1/four-shorts-v1'; public.mkdir(parents=True,exist_ok=True)
report=[]
for part in plan['parts']:
 pieces=[]; cores=[]
 for cut in part['cuts']:
  a=cut['source']*1600;b=a+cut['frames']*1600
  original=np.array(source[a:b]); data=original.copy()
  fade=240
  data[:fade]*=np.linspace(0,1,fade,dtype=np.float32)[:,None]
  data[-fade:]*=np.linspace(1,0,fade,dtype=np.float32)[:,None]
  assert np.array_equal(data[fade:-fade],original[fade:-fade])
  cores.append(hashlib.sha256(original[fade:-fade].tobytes()).hexdigest());pieces.append(data)
 pieces.append(np.zeros((part['tailFrames']*1600,2),np.float32))
 mix=np.concatenate(pieces)
 assert len(mix)==part['frames']*1600
 dest=WORK/f"part-{part['part']}.f32";mix.tofile(dest)
 audio=public/f"part-{part['part']}.m4a"
 subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-f','f32le','-ar','48000','-ac','2','-i',str(dest),'-c:a','aac','-b:a','192k','-movflags','+faststart',str(audio)],check=True)
 report.append(dict(part=part['part'],frames=part['frames'],samples=len(mix),pcmSHA256=hashlib.sha256(mix.tobytes()).hexdigest(),sourceCoreHashes=cores,originalPCM='identical outside 5ms edit-edge fades',audio=str(audio.relative_to(REPO))))
 print('Original audio recut:',part['part'],len(mix)/48000,'seconds')
(WORK/'audio-verification.json').write_text(json.dumps(report,indent=2)+'\n')
