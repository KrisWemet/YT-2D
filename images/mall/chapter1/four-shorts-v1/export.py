"""Copy verified deliverables into the project outputs and the user's Downloads."""
import pathlib, json, hashlib, shutil, subprocess

repo=pathlib.Path(__file__).resolve().parents[4]
work=repo/'out/chapter1-four-shorts-v1'
reports=json.loads((work/'media-verification.json').read_text())
assert len(reports)==4 and [r['part'] for r in reports]==[1,2,3,4]
destinations=[repo.parent.parent/'outputs/night-guard-chapter-1-four-shorts',pathlib.Path.home()/'Downloads/night-guard-chapter-1-four-shorts']
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
files=[]
for r in reports:
 video=work/r['file'];assert sha(video)==r['sha256'];files.extend([video,video.with_suffix('.srt')])
 encoded=lambda f:subprocess.run(['ffmpeg','-v','error','-i',str(f),'-map','0:a:0','-c','copy','-f','hash','-hash','sha256','-'],capture_output=True,text=True,check=True).stdout.strip()
 assert encoded(video)==encoded(repo/f"public/mall/ch1/four-shorts-v1/part-{r['part']}.m4a")
files.append(work/'four-shorts-preview.jpg')
notes='THE NIGHT GUARD — CHAPTER 1, FOUR SHORTS\n\nPost in numbered order:\n'
for r in reports:
 seconds=round(r['seconds']);notes+=f"{r['part']}. {r['title']} — {seconds//60}:{seconds%60:02}\n   {r['file']}\n"
notes+='\n1080 x 1920 vertical MP4, 30 fps, original voices and effects.\nCaptions are already visible in the videos; the SRT files are optional.\nEach Short opens and closes with a hook.\nThese four connected parts condense Chapter 1. The full chapter keeps all scenes.\n'
note=work/'READ-ME.txt';note.write_text(notes);files.append(note)
for dest in destinations:
 dest.mkdir(parents=True,exist_ok=True)
 for f in files:
  target=dest/f.name
  if target.exists() and sha(target)!=sha(f):raise RuntimeError(f'Refusing to overwrite a different existing file: {target}')
  if not target.exists():shutil.copy2(f,target)
  assert sha(f)==sha(target)
 print('Verified copies:',dest)
(work/'delivery-verification.json').write_text(json.dumps({'destinations':[str(d) for d in destinations],'files':[{'name':f.name,'bytes':f.stat().st_size,'sha256':sha(f)} for f in files],'encodedAudio':'mux identical to the four checked-in recut AAC mixes'},indent=2)+'\n')
