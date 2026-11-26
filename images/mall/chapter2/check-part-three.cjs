const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const repo=path.resolve(__dirname,'../../..'),local=createRequire(path.join(repo,'package.json'));
const plan=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/illustrated-part-three.json')));
const edit=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/retention-edit.json')));
const ch2=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/ch2.json')));
const byAsset={},byContent={},files={},shots=[];let cursor=0;
assert.equal(plan.frames,13633);assert.equal(plan.fps,30);
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
const previous=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/illustrated-part-two.json')));
assert.equal(plan.retentionStartFrame,previous.retentionStoryEndFrame-plan.overlapFrames,'Finale must include the planned Part Two lead-in');
assert.equal(plan.overlapFrames,181);assert.equal(plan.retentionStoryEndFrame,edit.frames,'Finish the original complete Chapter Two edit');
for(let f=0;f<plan.overlapFrames;f++){
 const a=plan.shots.find(s=>f>=s.start&&f<s.start+s.frames);
 const old=plan.retentionStartFrame+f-previous.retentionStartFrame;
 const b=previous.shots.find(s=>old>=s.start&&old<s.start+s.frames);
 assert.equal(a.asset,b.asset,'Opening reprise must match the preceding picture track');
}
const combined={...byContent};
for(const name of ['illustrated-part-one.json','illustrated-part-two.json']){
 const earlier=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2',name)));
 for(const s of earlier.shots){const bytes=fs.readFileSync(path.join(repo,'public/mall/ch2/story-art',s.asset+'.png'));const hash=crypto.createHash('sha256').update(bytes).digest('hex');combined[hash]=(combined[hash]||0)+1;}
}
assert(Math.max(...Object.values(combined))<=3,'Combined Chapter Two source-image reuse exceeds three');
const choice=edit.clips.find(c=>c.kind==='return-choice');assert(choice);
assert.equal(plan.shots.find(s=>s.note.startsWith('Visual choice begins')).start,choice.start-plan.retentionStartFrame);
const ts=local('typescript');for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true,target:ts.ScriptTarget.ES2020,resolveJsonModule:true}}).outputText,f);
const React=local('react'),{Img}=local('remotion'),{IllustratedPartThreePicture}=require(path.join(repo,'src/mall/chapter2/illustrated-part-three.tsx'));
// Inspect the actual picture renderer at every cut and both ends: one painting,
// zero native SVG character layers. An uncovered frame throws rather than falls back.
for(const s of plan.shots)for(const frame of [s.start,s.start+Math.floor(s.frames/2),s.start+s.frames-1]){
 const images=[];const visit=node=>{if(!React.isValidElement(node))return;if(node.type===Img)images.push(node.props.src);else{assert(typeof node.type==='string'||node.type===local('remotion').AbsoluteFill,'Unexpected picture layer');assert.notEqual(node.type,'svg');}React.Children.forEach(node.props.children,visit);};
 visit(IllustratedPartThreePicture({frame}));assert.equal(images.length,1);assert(images[0].includes(s.asset+'.png'));
}
const endingClip=edit.clips.find(c=>c.kind==='source'&&c.start<plan.retentionStoryEndFrame&&c.start+c.frames>=plan.retentionStoryEndFrame);
// Count actual rendered light layers, not just the signal timing helper. Each
// group must switch fully off between its three pulses, at its recorded cue.
const signalRanges={soloWindow:[182,184.2],soloFlashlight:[184.2,185.8],lily:[330,332],danny:[333,335],vera:[345.5,348]};
const renderedSignals={};
for(const [id,[start,end]]of Object.entries(signalRanges)){
 const events=[];let wasOn=false;
 for(let f=Math.floor(start*30);f<=Math.ceil(end*30);f++){
  let count=0;const visit=n=>{if(!React.isValidElement(n))return;if(n.props['data-signal']===id)count++;React.Children.forEach(n.props.children,visit);};visit(IllustratedPartThreePicture({frame:f}));
  assert(count<=1);const on=count===1;if(on&&!wasOn)events.push({startFrame:f,frames:0});if(on)events.at(-1).frames++;wasOn=on;
 }
 assert.equal(events.length,3,`${id} must have three visible pulses`);assert(events.every(e=>e.frames===6),`${id} pulse duration`);renderedSignals[id]=events;
}
assert(endingClip);const endingSourceFrame=endingClip.source+plan.retentionStoryEndFrame-endingClip.start;
const lastSourceWord=ch2.cwords.filter(w=>w.e<=endingSourceFrame/30).at(-1);assert.equal(lastSourceWord.n,'door');
const allWords=shots.map(s=>s.transcript).join(' ');assert(allWords.includes('What did she think was behind that door?'));assert(shots[0].transcript.startsWith('One-thirty.'));
const report={version:1,frames:cursor,seconds:cursor/30,shots:shots.length,distinctImages:Object.keys(byAsset).length,maxUses:Math.max(...Object.values(byAsset)),maxIdenticalContentUses:Math.max(...Object.values(byContent)),nativeFigureLayers:0,coverage:'every frame; no gaps or overlaps',ending:plan.ending,retentionStartFrame:plan.retentionStartFrame,retentionStoryEndFrame:plan.retentionStoryEndFrame,tailFrames:plan.tailFrames,endingSourceFrame,lastSpokenSourceWordEnd:lastSourceWord.e,combinedChapter2MaxContentUses:Math.max(...Object.values(combined)),overlapFrames:plan.overlapFrames,renderedSignals,scope:'Six-second reprise plus all remaining Chapter Two story and original end-card timing',usage:byAsset,files,shotList:shots};
const out=path.join(repo,'out/chapter2-part-three-v1');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'shot-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({frames:cursor,seconds:cursor/30,shots:shots.length,distinctImages:report.distinctImages,maxUses:report.maxUses,nativeFigureLayers:0,ending:plan.ending}));
module.exports=report;
