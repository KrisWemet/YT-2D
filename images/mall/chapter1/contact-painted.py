"""Build inspection sheets with a companion index; never modifies production artwork."""
import json,subprocess,sys
from pathlib import Path
repo=Path(__file__).resolve().parents[3]
plan=json.loads((repo/'src/mall/chapter1/painted-edit.json').read_text())
assets=list(dict.fromkeys(s['asset'] for s in plan['shots']))
lo=int(sys.argv[1]) if len(sys.argv)>1 else 0
hi=int(sys.argv[2]) if len(sys.argv)>2 else len(assets)
out=repo/'out/chapter1-painted-v1/art-contact'/f'{lo}-{hi}';out.mkdir(parents=True,exist_ok=True)
selected=[]
for i,a in enumerate(assets[lo:hi],lo):
 p=repo/'public'/('mall/ch2/story-art/'+a[4:]+'.png' if a.startswith('ch2/') else 'mall/ch1/story-art/painted-v1/'+a+'.png')
 if not p.exists():continue
 selected.append((i,a,p))
for j,(i,a,p) in enumerate(selected,1):
 vf='scale=480:270'
 subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',str(p),'-vf',vf,'-frames:v','1',str(out/f'asset-{j:03}.jpg')],check=True)
subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-framerate','1','-i',str(out/'asset-%03d.jpg'),'-frames:v',str((len(selected)+11)//12),'-vf','tile=3x4','-fps_mode','passthrough',str(out/f'contact-{lo}-%02d.jpg')],check=True)
(out/'index.json').write_text(json.dumps([dict(index=i+1,asset=a) for i,a,p in selected],indent=2))
print(out, len(selected),'assets')
