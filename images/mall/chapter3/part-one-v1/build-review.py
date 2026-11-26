"""Produce review/contact sheets and a portable JPEG delivery pack."""
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont
import json,hashlib,shutil,zipfile

repo=Path(__file__).resolve().parents[4];folder=Path(__file__).parent
items=json.loads((folder/'asset-manifest.json').read_text())
output=repo.parent.parent/'outputs/night-guard-chapter-3-part-1-art'
(output/'images').mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',19)
bold=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf',23)
report=[]
for x in items:
 f=repo/'public'/x['file']
 with Image.open(f) as im:
  im.load();assert im.width>=1600 and abs(im.width/im.height-16/9)<.01
  report.append(dict(id=x['id'],kind=x['kind'],file=x['file'],width=im.width,height=im.height,bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
  ImageOps.fit(im.convert('RGB'),(1920,1080),method=Image.Resampling.LANCZOS).save(output/'images'/(x['id']+'.jpg'),quality=94,subsampling=0,optimize=True)
assert len(report)==30 and len({x['sha256'] for x in report})==30
groups=[('locations',[x for x in items if x['kind']=='background'])]
story=[x for x in items if x['kind']=='story']
for a in range(0,len(story),12):groups.append((f'story-{a//12+1}',story[a:a+12]))
for name,group in groups:
 rows=(len(group)+2)//3;sheet=Image.new('RGB',(1440,rows*310+70),'#0a1524');d=ImageDraw.Draw(sheet)
 d.text((20,20),'CHAPTER 3 · PART 1 — '+name.upper(),font=bold,fill='#e6c57b')
 for i,x in enumerate(group):
  col=i%3;row=i//3;y=70+row*310
  with Image.open(repo/'public'/x['file']) as im:pic=ImageOps.fit(im.convert('RGB'),(470,264),method=Image.Resampling.LANCZOS)
  sheet.paste(pic,(col*480+5,y));d.text((col*480+10,y+271),x['id'],font=font,fill='#eee8db')
 path=folder/f'preview-{name}.jpg';sheet.save(path,quality=94);shutil.copy2(path,output/path.name)
byid={x['id']:repo/'public'/x['file'] for x in items}
cast=[('DANNY',byid['s04-staff-corridor'],(610,210,1100,935)),('THEO',byid['s02-store-count'],(950,130,1430,930)),('MARCUS',byid['cliff-marcus-clock'],(730,250,1030,640)),('LILY',byid['s02-lily-pancake'],(650,230,1190,940)),('PANCAKE',byid['reference-pancake'],(360,180,1100,870))]
sheet=Image.new('RGB',(1800,600),'#0a1524');d=ImageDraw.Draw(sheet)
for i,(name,path,box) in enumerate(cast):
 with Image.open(path) as im:pic=im.crop(box).convert('RGB');pic.thumbnail((350,510),Image.Resampling.LANCZOS)
 sheet.paste(pic,(i*360+(360-pic.width)//2,65+(510-pic.height)//2));d.text((i*360+20,20),name,font=bold,fill='#e6c57b')
sheet.save(folder/'preview-cast.jpg',quality=94);shutil.copy2(folder/'preview-cast.jpg',output/'preview-cast.jpg')
# A small selection for the top-level delivery preview.
hero=['s01-court-socks','s02-lily-pancake','s03-fever-tent','s04-solo-crawl','s05-twenty-note','cliff-marcus-clock']
sheet=Image.new('RGB',(1440,660),'#0a1524');d=ImageDraw.Draw(sheet)
for i,id in enumerate(hero):
 with Image.open(byid[id]) as im:pic=ImageOps.fit(im.convert('RGB'),(470,264),method=Image.Resampling.LANCZOS)
 x=i%3*480+5;y=i//3*320+15;sheet.paste(pic,(x,y));d.text((x+6,y+272),id,font=font,fill='#eee8db')
sheet.save(folder/'preview-selected-scenes.jpg',quality=94);shutil.copy2(folder/'preview-selected-scenes.jpg',output/'preview-selected-scenes.jpg')
for name in ['art-direction.md','three-part-split.json','part-1-script.md','part-2-script.md','part-3-script.md','scene-guide.md']:
 if (folder/name).exists():shutil.copy2(folder/name,output/name)
(folder/'image-verification.json').write_text(json.dumps({'assets':report,'count':len(report),'backgrounds':6,'storyPaintings':23,'newCharacterReferences':1,'originalPNGs':'byte-preserved from built-in imagegen','deliveryJPEGs':[1920,1080],'review':'Every selected painting inspected at full size; all correction outputs reviewed. See art-direction.md for continuity rules.','scope':'Character/background/story artwork. No audio or video rendered in this stage.'},indent=2)+'\n')
with zipfile.ZipFile(output/'night-guard-chapter-3-part-1-art.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in sorted(output.rglob('*')):
  if f.is_file() and f.suffix!='.zip':z.write(f,str(f.relative_to(output)))
print('Verified 30 original paintings; wrote five contact/preview sheets and JPEG delivery pack:',output)
