const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../../../..'),work=path.join(repo,'out/chapter1-four-shorts-v1');
const edit=require('../../../../src/mall/chapter1/four-shorts.json');
const {bundle}=require('@remotion/bundler'),{openBrowser,selectComposition,renderMedia,renderStill}=require('@remotion/renderer');
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE;
const stills=process.argv.includes('--stills');
const run=(bin,args)=>{const p=spawnSync(bin,args,{encoding:'utf8',maxBuffer:16e6});if(p.status)throw Error(p.stderr||p.error);return p.stdout;};
const ff=args=>run('ffmpeg',['-nostdin','-v','error','-y',...args]);
const probe=file=>JSON.parse(run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file]));
(async()=>{
 fs.mkdirSync(work,{recursive:true});
 const outDir=path.join(work,stills?'qc-bundle':'bundle'),pub=path.join(outDir,'public');
 if(fs.existsSync(pub)&&fs.lstatSync(pub).isSymbolicLink())fs.unlinkSync(pub);
 const serveUrl=await bundle({entryPoint:path.join(repo,'src/index.ts'),rootDir:repo,outDir,enableCaching:false,symlinkPublicDir:true});
 const browser=await openBrowser('chrome',{browserExecutable});
 const reports=[];
 try {
  const common={serveUrl,puppeteerInstance:browser,browserExecutable};
  for(const plan of edit.parts){
   const composition=await selectComposition({...common,id:`NightGuardChapter1FourShort${String(plan.part).padStart(2,'0')}`});
   if(composition.durationInFrames!==plan.frames||plan.frames>5400)throw Error('Invalid Short duration');
   const dir=path.join(work,`part-${plan.part}`);fs.mkdirSync(dir,{recursive:true});
   if(stills){
    const samples=plan.shots.map((s,i)=>({frame:s.start+Math.floor(s.frames/2),name:`shot-${String(i+1).padStart(3,'0')}`}));
    samples.push({frame:30,name:'opening'},{frame:plan.storyFrames+30,name:'ending'});
    if(plan.part===4){const c=plan.cuts.find(c=>c.firstSegment===169);for(const t of [846.4,846.6,846.77,846.9,847.07,847.2])samples.push({frame:c.start+Math.round(t*30)-c.source,name:`signal-${t}`});}
    fs.writeFileSync(path.join(dir,'qc-samples.json'),JSON.stringify(samples,null,2));
    for(let i=0;i<samples.length;i+=4){await Promise.all(samples.slice(i,i+4).map(s=>renderStill({...common,composition,frame:s.frame,imageFormat:'jpeg',scale:1/3,jpegQuality:93,output:path.join(dir,`${s.name}.jpg`)})));}
    console.log(`Part ${plan.part}: ${samples.length} QC stills saved`);continue;
   }
   const digest=crypto.createHash('sha256');
   for(const f of ['src/Root.tsx','src/mall/chapter1/FourShorts.tsx','src/mall/chapter1/four-shorts.json','src/mall/chapter1/painted.tsx'])digest.update(fs.readFileSync(path.join(repo,f)));
   const hash=digest.digest('hex').slice(0,12),pieces=[];
   for(let start=0;start<plan.frames;start+=1500){
    const frames=Math.min(1500,plan.frames-start),file=path.join(dir,`picture-${hash}-${start}.mp4`);
    if(!fs.existsSync(file)||Number(probe(file).streams[0].nb_frames)!==frames){
     let previous=-1;
     await renderMedia({...common,composition,frameRange:[start,start+frames-1],outputLocation:file,muted:true,codec:'h264',crf:18,pixelFormat:'yuv420p',imageFormat:'jpeg',jpegQuality:94,concurrency:6,x264Preset:'fast',onProgress:q=>{const n=Math.floor(q.progress*5)*20;if(n!==previous){previous=n;console.log(`Short ${plan.part}, frames ${start}-${start+frames-1}: ${n}%`);}}});
    }else console.log(`Resumed Short ${plan.part}, frame ${start}`);
    const normal=path.join(dir,`normalized-${start}.mp4`);ff(['-i',file,'-map','0:v:0','-an','-c:v','copy','-video_track_timescale','90000',normal]);pieces.push({file:normal,frames});
   }
   const concat=path.join(dir,'picture.ffconcat');fs.writeFileSync(concat,'ffconcat version 1.0\n'+pieces.map(p=>`file '${p.file}'\nduration ${(p.frames/30).toFixed(9)}\n`).join(''));
   const file=path.join(work,`night-guard-chapter-1-short-${String(plan.part).padStart(2,'0')}.mp4`),audio=path.join(repo,`public/mall/ch1/four-shorts-v1/part-${plan.part}.m4a`);
   ff(['-f','concat','-safe','0','-i',concat,'-i',audio,'-map','0:v:0','-map','1:a:0','-t',String(plan.frames/30),'-c','copy','-bsf:v','setts=pts=round(PTS/3000)*3000:dts=round(DTS/3000)*3000:duration=3000','-video_track_timescale','90000','-movflags','+faststart',file]);
   ff(['-xerror','-i',file,'-f','null','-']);
   const media=probe(file),v=media.streams.find(s=>s.codec_type==='video'),a=media.streams.find(s=>s.codec_type==='audio');
   if(Number(v.nb_frames)!==plan.frames||v.width!==1080||v.height!==1920||v.r_frame_rate!=='30/1'||a.sample_rate!=='48000'||a.channels!==2)throw Error('Media validation failed');
   const pts=run('ffprobe',['-v','error','-select_streams','v','-show_entries','packet=pts','-of','csv=p=0',file]).trim().split('\n').map(Number).sort((a,b)=>a-b);
   if(pts.length!==plan.frames||pts.some((p,i)=>p!==i*3000))throw Error('Non-contiguous frames');
   reports.push({part:plan.part,file:path.basename(file),title:plan.title,frames:plan.frames,seconds:plan.frames/30,width:1080,height:1920,fps:30,sampleRate:48000,channels:2,fullDecode:'passed',timestamps:'continuous',bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
   console.log('VERIFIED',plan.part,plan.frames/30,file);
  }
 }finally{await browser.close({silent:true});}
 if(!stills)fs.writeFileSync(path.join(work,'media-verification.json'),JSON.stringify(reports,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
