const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const repo=path.resolve(__dirname,'../../..'),local=createRequire(path.join(repo,'package.json'));
const plan=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter1/painted-edit.json')));
const script=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter1/ch1.json')));
const byAsset={},byContent={},files={},shots=[];let cursor=0;
assert.equal(plan.frames,26465);assert.equal(plan.fps,30);assert.equal(plan.voiceSeconds,script.duration);
const assetPath=asset=>asset.startsWith('ch2/')?'mall/ch2/story-art/'+asset.slice(4)+'.png':'mall/ch1/story-art/painted-v1/'+asset+'.png';
for(const [i,s]of plan.shots.entries()){
 assert.equal(s.start,cursor,`Gap/overlap at shot ${i}`);assert(s.frames>0&&s.frames<=300,`Shot ${i} exceeds ten seconds`);cursor+=s.frames;
 assert(/^[a-z0-9/-]+$/.test(s.asset));const file=assetPath(s.asset),bytes=fs.readFileSync(path.join(repo,'public',file));
 assert(bytes.subarray(1,4).equals(Buffer.from('PNG')));const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);assert(width>=1280&&height>=720,`Low-resolution ${s.asset}`);
 const hash=crypto.createHash('sha256').update(bytes).digest('hex');files[s.asset]={path:file,sha256:hash,width,height};
 byAsset[s.asset]=(byAsset[s.asset]||0)+1;byContent[hash]=(byContent[hash]||0)+1;
 const words=script.cwords.filter(w=>w.s<cursor/30&&w.e>s.start/30).map(w=>w.w);
 shots.push({...s,index:i+1,seconds:s.frames/30,transcript:words.join(' ')});
}
assert.equal(cursor,plan.frames);const maxUses=Math.max(...Object.values(byAsset));assert(maxUses<=3,'Image used more than three times');assert(Math.max(...Object.values(byContent))<=3,'Identical content aliased to exceed reuse cap');
const ts=local('typescript');for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true,target:ts.ScriptTarget.ES2020,resolveJsonModule:true}}).outputText,f);
const React=local('react'),{Img,AbsoluteFill}=local('remotion'),{PaintedChapter1Picture}=require(path.join(repo,'src/mall/chapter1/painted.tsx'));
for(const s of plan.shots)for(const frame of [s.start,s.start+Math.floor(s.frames/2),s.start+s.frames-1]){
 const images=[];const visit=node=>{if(!React.isValidElement(node))return;if(node.type===Img)images.push(node.props.src);else assert(node.type===AbsoluteFill||['div','br','strong'].includes(node.type),'Unexpected figure/visual layer');React.Children.forEach(node.props.children,visit);};
 visit(PaintedChapter1Picture({frame}));assert.equal(images.length,1);assert(images[0].includes(assetPath(s.asset)));
}
assert.throws(()=>PaintedChapter1Picture({frame:-1}));assert.throws(()=>PaintedChapter1Picture({frame:plan.frames}));
let pulses=0,previous=false;
for(let frame=Math.floor(846.3*30);frame<Math.ceil(847.5*30);frame++){
 let on=false;const visit=n=>{if(!React.isValidElement(n))return;if(n.props.style?.mixBlendMode==='screen')on=true;React.Children.forEach(n.props.children,visit);};visit(PaintedChapter1Picture({frame}));
 if(on&&!previous)pulses++;previous=on;
}
assert.equal(pulses,3,'Lily must signal three distinct flashes on the spoken count');
assert.equal(plan.shots.at(-1).overlay,'end');assert(plan.shots.at(-1).start>=Math.ceil(script.duration*30));
const report={version:1,frames:cursor,seconds:cursor/30,shots:shots.length,distinctImages:Object.keys(byAsset).length,maxUses,maxIdenticalContentUses:Math.max(...Object.values(byContent)),nativeFigureLayers:0,signalFlashes:pulses,coverage:'Every frame, without gaps or overlaps',audioPolicy:'Copy original Chapter One encoded stereo AAC unchanged',scope:'Full Chapter One; original composition remains available',usage:byAsset,files,shotList:shots};
const out=path.join(repo,'out/chapter1-painted-v1');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'shot-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({frames:cursor,seconds:cursor/30,shots:shots.length,distinctImages:report.distinctImages,maxUses,nativeFigureLayers:0}));module.exports=report;
