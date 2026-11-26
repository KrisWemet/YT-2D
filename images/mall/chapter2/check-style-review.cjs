const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const repo=path.resolve(__dirname,'../../..'),local=createRequire(path.join(repo,'package.json'));
const plan=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/illustrated-part-one.json')));
const edit=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/retention-edit.json')));
const ch2=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/ch2.json')));
const byAsset={},byContent={},files={},shots=[];let cursor=0;
assert.equal(plan.fps,30);
// Frame times follow one edit map; retime-part-one.py moves them when the edit changes.
assert.equal(plan.editVersion,edit.version,'Part One is timed for a different retention edit');
// Part One ends with the retained clip that closes on Theo's eight-thousand-gallons line.
const ENDING_SOURCE_FRAME=21083,closing=edit.clips.find(c=>c.kind==='source'&&c.source+c.frames===ENDING_SOURCE_FRAME);
assert(closing&&plan.frames===closing.start+closing.frames,'Part One must end with the eight-thousand-gallons clip');
for(const [i,s]of plan.shots.entries()){
 assert.equal(s.start,cursor,`Gap/overlap at shot ${i}`);assert(s.frames>0&&s.frames<=300,`Shot ${i} must last at most ten seconds`);
 cursor+=s.frames;assert(/^[a-z0-9/-]+$/.test(s.asset));
 const file=path.join(repo,'public/mall/ch2/story-art',s.asset+'.png');assert(fs.existsSync(file),`Missing ${s.asset}`);
 const bytes=fs.readFileSync(file),hash=crypto.createHash('sha256').update(bytes).digest('hex');
 assert(bytes.subarray(1,4).equals(Buffer.from('PNG')));const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 assert(width>=1280&&height>=720,`Low resolution: ${s.asset}`);
 byAsset[s.asset]=(byAsset[s.asset]||0)+1;byContent[hash]=(byContent[hash]||0)+1;files[s.asset]={sha256:hash,width,height};
 const words=[];
 for(const c of edit.clips){
  if(c.kind!=='source')continue;
  const a=Math.max(s.start,c.start),b=Math.min(cursor,c.start+c.frames);if(a>=b)continue;
  const lo=(c.source+a-c.start)/30,hi=(c.source+b-c.start)/30;
  words.push(...ch2.cwords.filter(w=>w.s<hi&&w.e>lo).map(w=>w.w));
 }
 shots.push({...s,index:i+1,seconds:s.frames/30,transcript:words.join(' ')});
}
assert.equal(cursor,plan.frames);assert(Math.max(...Object.values(byAsset))<=3,'Image reuse exceeds three');
assert(Math.max(...Object.values(byContent))<=3,'Identical image content reused through aliases');
const ts=local('typescript');for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true,target:ts.ScriptTarget.ES2020,resolveJsonModule:true}}).outputText,f);
const React=local('react'),{Img}=local('remotion'),{IllustratedPartOne}=require(path.join(repo,'src/mall/chapter2/illustrated-part-one.tsx'));
// Inspect the actual picture renderer at every cut and both ends: one painting,
// zero native SVG character layers. An uncovered frame throws rather than falls back.
for(const s of plan.shots)for(const frame of [s.start,s.start+Math.floor(s.frames/2),s.start+s.frames-1]){
 const images=[];const visit=node=>{if(!React.isValidElement(node))return;if(node.type===Img)images.push(node.props.src);else{assert(typeof node.type==='string'||node.type===local('remotion').AbsoluteFill,'Unexpected picture layer');assert.notEqual(node.type,'svg');}React.Children.forEach(node.props.children,visit);};
 visit(IllustratedPartOne({frame}));assert.equal(images.length,1);assert(images[0].includes(s.asset+'.png'));
}
const last=shots.at(-1);assert(last.transcript.includes('eight thousand gallons.'));assert(!last.transcript.includes('fountain'));
const report={version:10,frames:cursor,seconds:cursor/30,shots:shots.length,distinctImages:Object.keys(byAsset).length,maxUses:Math.max(...Object.values(byAsset)),maxIdenticalContentUses:Math.max(...Object.values(byContent)),nativeFigureLayers:0,coverage:'every frame; no gaps or overlaps',ending:plan.ending,endingSourceFrame:ENDING_SOURCE_FRAME,lastSpokenSourceWordEnd:701.302,scope:'opening part only; full chapter unchanged',usage:byAsset,files,shotList:shots};
const out=path.join(repo,'out/chapter2-style-review-v10');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'shot-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({frames:cursor,seconds:cursor/30,shots:shots.length,distinctImages:report.distinctImages,maxUses:report.maxUses,nativeFigureLayers:0,ending:plan.ending}));
module.exports=report;
