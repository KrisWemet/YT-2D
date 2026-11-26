/* Illustrated Part Three, 7:34.433. No generation API key needed. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{createRequire}=require('node:module'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../../..'),work=process.env.NIGHT_GUARD_REVIEW_WORK??path.join(repo,'out/chapter2-part-three-v1'),local=createRequire(path.join(repo,'package.json'));
const audit=require('./check-part-three.cjs');
const plan=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/illustrated-part-three.json'))),FRAMES=plan.frames;
const {bundle}=local('@remotion/bundler'),{openBrowser,selectComposition,renderMedia,renderStill}=local('@remotion/renderer');
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE;
const run=args=>{const p=spawnSync('ffmpeg',['-nostdin','-v','error','-y',...args],{encoding:'utf8',maxBuffer:8e6});if(p.status)throw Error(p.stderr);return p.stdout;};
const probe=file=>JSON.parse(spawnSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8',maxBuffer:8e6}).stdout);
(async()=>{
 fs.mkdirSync(work,{recursive:true});const outDir=path.join(work,process.argv.includes('--stills')?'qc-bundle':'bundle'),pub=path.join(outDir,'public');
 if(fs.existsSync(pub)&&fs.lstatSync(pub).isSymbolicLink())fs.unlinkSync(pub);
 const serveUrl=await bundle({entryPoint:path.join(repo,'src/index.ts'),rootDir:repo,outDir,enableCaching:false,symlinkPublicDir:true});
 const browser=await openBrowser('chrome',{browserExecutable});
 try{
  const common={serveUrl,puppeteerInstance:browser,browserExecutable};const composition=await selectComposition({...common,id:'MallChapter2IllustratedPartThree'});
  if(composition.durationInFrames!==FRAMES)throw Error('Incorrect Part Three duration');
  if(process.argv.includes('--stills')){
   const dir=path.join(work,'stills');fs.mkdirSync(dir,{recursive:true});
   for(let offset=0;offset<plan.shots.length;offset+=4){
    await Promise.all(plan.shots.slice(offset,offset+4).map((s,j)=>renderStill({...common,composition,frame:s.start+Math.floor(s.frames/2),imageFormat:'jpeg',scale:1/3,jpegQuality:93,output:path.join(dir,`shot-${String(offset+j+1).padStart(3,'0')}.jpg`)})));
    if(offset%20===0)console.log('QC stills',Math.min(offset+4,plan.shots.length),'/',plan.shots.length);
   }
   const signals=Object.entries(audit.renderedSignals).flatMap(([name,events])=>events.flatMap((e,i)=>[{name:`${name}-${i+1}-on`,frame:e.startFrame+2},{name:`${name}-${i+1}-off`,frame:e.startFrame-2}]));
   for(let i=0;i<signals.length;i+=4)await Promise.all(signals.slice(i,i+4).map(s=>renderStill({...common,composition,frame:s.frame,imageFormat:'jpeg',scale:1/3,jpegQuality:95,output:path.join(dir,`${s.name}.jpg`)})));
   fs.writeFileSync(path.join(work,'signal-review.json'),JSON.stringify(signals,null,2)+'\n');
   console.log('All shot midpoint stills saved');return;
  }
  const digest=crypto.createHash('sha256');for(const name of ['Root.tsx','mall/chapter2/retention-edit.json','mall/chapter2/illustrated-part-three.tsx','mall/chapter2/illustrated-part-three.json'])digest.update(fs.readFileSync(path.join(repo,'src',name)));
  for(const name of Object.keys(audit.files).sort())digest.update(fs.readFileSync(path.join(repo,'public/mall/ch2/story-art',name+'.png')));
  const hash=digest.digest('hex').slice(0,12),parts=[];
  for(let start=0;start<FRAMES;start+=1800)parts.push({start,frames:Math.min(1800,FRAMES-start),file:path.join(work,`picture-${hash}-${start}.mp4`)});
  fs.writeFileSync(path.join(work,'render-plan.json'),JSON.stringify(parts,null,2));
  for(const [i,p]of parts.entries()){
   if(fs.existsSync(p.file)&&Number(probe(p.file).streams[0].nb_frames)===p.frames){console.log('Resumed picture part',i+1);continue;}
   let previous=-1;await renderMedia({...common,composition,frameRange:[p.start,p.start+p.frames-1],outputLocation:p.file,muted:true,codec:'h264',crf:18,pixelFormat:'yuv420p',imageFormat:'jpeg',jpegQuality:94,concurrency:6,x264Preset:'fast',onProgress:q=>{const n=Math.floor(q.progress*10)*10;if(n!==previous){previous=n;console.log(`Part ${i+1}/${parts.length}: ${n}%`);}}});
   if(Number(probe(p.file).streams[0].nb_frames)!==p.frames)throw Error('Incorrect rendered frame count');
  }
 }finally{await browser.close({silent:true});}
 if(process.argv.includes('--picture-only')){console.log('Picture parts ready');return;}
 const parts=JSON.parse(fs.readFileSync(path.join(work,'render-plan.json'))),normalized=[];
 for(const [i,p]of parts.entries()){
  const file=path.join(work,`normalized-${i}.mp4`);run(['-i',p.file,'-map','0:v:0','-an','-c:v','copy','-video_track_timescale','90000',file]);normalized.push({file,frames:p.frames});
 }
 const concat=path.join(work,'picture.ffconcat');fs.writeFileSync(concat,'ffconcat version 1.0\n'+normalized.map(p=>`file '${p.file}'\nduration ${(p.frames/30).toFixed(9)}\n`).join(''));
 const sourceAudio=path.join(repo,'public/mall/ch2/retention.mp3');
 const audio=path.join(work,'part-three-original-mix.wav');
 const startSample=plan.retentionStartFrame*1600,endSample=plan.retentionStoryEndFrame*1600,storySamples=endSample-startSample;
 const trim=`atrim=start_sample=${startSample}:end_sample=${endSample},asetpts=PTS-STARTPTS`;
 run(['-i',sourceAudio,'-af',trim+`,apad=pad_len=${plan.tailFrames*1600}`,'-ar','48000','-ac','2','-c:a','pcm_s16le',audio]);
 const sourceHash=run(['-i',sourceAudio,'-af',trim,'-ar','48000','-ac','2','-c:a','pcm_s16le','-f','hash','-hash','sha256','-']).trim();
 const sliceHash=run(['-i',audio,'-af',`atrim=end_sample=${storySamples}`,'-c:a','pcm_s16le','-f','hash','-hash','sha256','-']).trim();
 if(sourceHash!==sliceHash)throw Error('Original mix sample slice changed');
 const out=path.join(work,'night-guard-chapter-2-part-three-painted-v1.mp4');
 run(['-safe','0','-f','concat','-i',concat,'-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',String(FRAMES/30),'-bsf:v','setts=pts=round(PTS/3000)*3000:dts=round(DTS/3000)*3000:duration=3000','-video_track_timescale','90000','-movflags','+faststart',out]);
 run(['-xerror','-i',out,'-f','null','-']);
 const info=probe(out),v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');
 if(Number(v.nb_frames)!==FRAMES||v.width!==1920||v.height!==1080||v.r_frame_rate!=='30/1'||a.sample_rate!=='48000'||a.channels!==2)throw Error('Review media verification failed');
 const pts=spawnSync('ffprobe',['-v','error','-select_streams','v','-show_entries','packet=pts','-of','csv=p=0',out],{encoding:'utf8',maxBuffer:8e6}).stdout.trim().split('\n').map(Number).sort((a,b)=>a-b);
 if(pts.length!==FRAMES||pts.some((p,i)=>p!==i*3000))throw Error('Non-contiguous frame timestamps');
 fs.writeFileSync(path.join(work,'media-verification.json'),JSON.stringify({frames:FRAMES,seconds:FRAMES/30,width:1920,height:1080,fps:30,fullDecode:'passed',frameTimestamps:'every frame continuous',audio:'sample-exact decoded slice of original retention mix, AAC export',sourceAudioPCMHash:sourceHash,retentionStartFrame:plan.retentionStartFrame,retentionStoryEndFrame:plan.retentionStoryEndFrame,audioChannels:2,sampleRate:48000,distinctImages:audit.distinctImages,shots:audit.shots,maxImageUses:audit.maxUses,nativeFigureLayers:0,ending:plan.ending},null,2)+'\n');
 console.log('Verified',out);
})().catch(e=>{console.error(e);process.exitCode=1});
