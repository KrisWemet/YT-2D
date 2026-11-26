const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const repo=path.resolve(__dirname,'../../..'),local=createRequire(path.join(repo,'package.json'));
const plan=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/illustrated-part-two.json')));
const edit=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/retention-edit.json')));
const ch2=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/ch2.json')));
const byAsset={},byContent={},files={},shots=[];let cursor=0;
assert.equal(plan.frames,17904);assert.equal(plan.fps,30);
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
  const a=Math.max(s.start+plan.retentionStartFrame,c.start),b=Math.min(cursor+plan.retentionStartFrame,plan.retentionStoryEndFrame,c.start+c.frames);if(a>=b)continue;
  const lo=(c.source+a-c.start)/30,hi=(c.source+b-c.start)/30;
  words.push(...ch2.cwords.filter(w=>w.s<hi&&w.e>lo).map(w=>w.w));
 }
 shots.push({...s,index:i+1,seconds:s.frames/30,transcript:words.join(' ')});
}
assert.equal(cursor,plan.frames);assert(Math.max(...Object.values(byAsset))<=3,'Image reuse exceeds three');
assert(Math.max(...Object.values(byContent))<=3,'Identical image content reused through aliases');
const previous=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/illustrated-part-one.json')));
assert.equal(plan.retentionStartFrame,previous.frames,'Part Two must continue at Part One audio boundary');
assert(plan.frames>=8*60*30&&plan.frames<=10*60*30,'Part Two must run eight to ten minutes');
const combined={...byContent};
for(const s of previous.shots){const bytes=fs.readFileSync(path.join(repo,'public/mall/ch2/story-art',s.asset+'.png'));const hash=crypto.createHash('sha256').update(bytes).digest('hex');combined[hash]=(combined[hash]||0)+1;}
assert(Math.max(...Object.values(combined))<=3,'Combined Part One and Two image reuse exceeds three');
const ts=local('typescript');for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true,target:ts.ScriptTarget.ES2020,resolveJsonModule:true}}).outputText,f);
const React=local('react'),{Img}=local('remotion'),{IllustratedPartTwoPicture}=require(path.join(repo,'src/mall/chapter2/illustrated-part-two.tsx'));
// Inspect the actual picture renderer at every cut and both ends: one painting,
// zero native SVG character layers. An uncovered frame throws rather than falls back.
for(const s of plan.shots)for(const frame of [s.start,s.start+Math.floor(s.frames/2),s.start+s.frames-1]){
 const images=[];const visit=node=>{if(!React.isValidElement(node))return;if(node.type===Img)images.push(node.props.src);else{assert(typeof node.type==='string'||node.type===local('remotion').AbsoluteFill,'Unexpected picture layer');assert.notEqual(node.type,'svg');}React.Children.forEach(node.props.children,visit);};
 visit(IllustratedPartTwoPicture({frame}));assert.equal(images.length,1);assert(images[0].includes(s.asset+'.png'));
}
const endingClip=edit.clips.find(c=>c.kind==='source'&&c.start<plan.retentionStoryEndFrame&&c.start+c.frames>=plan.retentionStoryEndFrame);
assert(endingClip);const endingSourceFrame=endingClip.source+plan.retentionStoryEndFrame-endingClip.start;
const lastSourceWord=ch2.cwords.filter(w=>w.e<=endingSourceFrame/30).at(-1);assert.equal(lastSourceWord.n,'wall');
const last=shots.at(-1);assert(last.transcript.includes('They were cutting through the wall,'));assert(!last.transcript.includes('Loud'));assert(shots[0].transcript.startsWith('The fountain,'));
const report={version:1,frames:cursor,seconds:cursor/30,shots:shots.length,distinctImages:Object.keys(byAsset).length,maxUses:Math.max(...Object.values(byAsset)),maxIdenticalContentUses:Math.max(...Object.values(byContent)),nativeFigureLayers:0,coverage:'every frame; no gaps or overlaps',ending:plan.ending,retentionStartFrame:plan.retentionStartFrame,retentionStoryEndFrame:plan.retentionStoryEndFrame,tailFrames:plan.tailFrames,endingSourceFrame,lastSpokenSourceWordEnd:lastSourceWord.e,combinedPartOneAndTwoMaxContentUses:Math.max(...Object.values(combined)),scope:'Part Two begins immediately after Part One; existing compositions unchanged',usage:byAsset,files,shotList:shots};
const out=path.join(repo,'out/chapter2-part-two-v1');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'shot-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({frames:cursor,seconds:cursor/30,shots:shots.length,distinctImages:report.distinctImages,maxUses:report.maxUses,nativeFigureLayers:0,ending:plan.ending}));
module.exports=report;
