"""Archive selected built-in imagegen outputs without editing their artwork."""
from pathlib import Path
import json,shutil,hashlib
repo=Path(__file__).resolve().parents[4]
folder=Path(__file__).parent
items=json.loads((folder/'generated-sources.json').read_text())
public=repo/'public/mall/ch3/story-art/part-one-v1';public.mkdir(parents=True,exist_ok=True)
for item in items:
 source=Path(item['source']);target=public/(item['id']+'.png')
 if target.exists() and target.read_bytes()!=source.read_bytes():raise RuntimeError(f'Existing different asset: {target}')
 if not target.exists():shutil.copy2(source,target)
 item['file']=str(target.relative_to(repo/'public'))
 item['sha256']=hashlib.sha256(target.read_bytes()).hexdigest()
 item['bytes']=target.stat().st_size
(folder/'asset-manifest.json').write_text(json.dumps(items,indent=2)+'\n')
print('Saved',len(items),'original paintings into repository public assets.')
