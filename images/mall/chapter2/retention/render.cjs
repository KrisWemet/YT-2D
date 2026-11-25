/* Portable full render. The checked-in audio master needs no generation credentials.
 * Renders the picture in chunks (CHUNKS, default 4) so an interrupted export resumes where it
 * stopped; finished chunks are kept and verified by frame count. CONCURRENCY sets parallel tabs. */
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../../../..'),work=path.join(repo,'out/chapter2-retention'),local=createRequire(path.join(repo,'package.json'));
const {bundle}=local('@remotion/bundler'),{openBrowser,selectComposition,renderMedia}=local('@remotion/renderer');
const edit=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/retention-edit.json')));
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE;
const VERSION='v9',CHUNKS=Math.max(1,Number(process.env.CHUNKS||4)),CONCURRENCY=Math.max(1,Number(process.env.CONCURRENCY||6));
const frames=file=>{
 const r=spawnSync('ffprobe',['-v','error','-count_packets','-select_streams','v:0','-show_entries','stream=nb_read_packets','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8'});
 return r.status?-1:parseInt(r.stdout,10);
};
(async()=>{
 if(!edit.audioReady||edit.recap!==false)throw Error('Run the edit and audio builders first.');
 fs.mkdirSync(work,{recursive:true});
 const outDir=path.join(work,'bundle'),publicLink=path.join(outDir,'public');
 if(fs.existsSync(publicLink)&&fs.lstatSync(publicLink).isSymbolicLink())fs.unlinkSync(publicLink);
 const serveUrl=await bundle({entryPoint:path.join(repo,'src/index.ts'),rootDir:repo,outDir,enableCaching:false,symlinkPublicDir:true});
 const browser=await openBrowser('chrome',{browserExecutable});
 const parts=[];
 try{
  const common={serveUrl,puppeteerInstance:browser,browserExecutable};const composition=await selectComposition({...common,id:'MallChapter2'});
  if(composition.durationInFrames!==edit.frames)throw Error('Composition length differs from the edit.');
  const size=Math.ceil(edit.frames/CHUNKS);
  for(let k=0;k<CHUNKS;k++){
   const a=k*size,b=Math.min(edit.frames,(k+1)*size)-1,file=path.join(work,`picture-${VERSION}-${k+1}of${CHUNKS}.mp4`);
   parts.push(file);
   if(fs.existsSync(file)&&frames(file)===b-a+1){console.log(`chunk ${k+1}/${CHUNKS} already rendered`);continue;}
   let old=-1;const started=Date.now();
   await renderMedia({...common,composition,frameRange:[a,b],outputLocation:file,muted:true,codec:'h264',crf:19,pixelFormat:'yuv420p',imageFormat:'jpeg',jpegQuality:94,concurrency:CONCURRENCY,x264Preset:'fast',
    onProgress:p=>{const n=Math.floor(p.progress*100);if(n!==old&&n%5===0){old=n;console.log(`chunk ${k+1}/${CHUNKS} ${n}% (${((Date.now()-started)/60000).toFixed(1)} min)`);}}});
   if(frames(file)!==b-a+1)throw Error(`Chunk ${k+1} is missing frames`);
  }
 }finally{await browser.close({silent:true});}
 const list=path.join(work,'parts.txt');
 fs.writeFileSync(list,parts.map(p=>`file '${p.replace(/'/g,"'\\''")}'`).join('\n')+'\n');
 const file=path.join(work,`night-guard-chapter-2-${VERSION}.mp4`);
 const args=['-nostdin','-v','error','-y','-f','concat','-safe','0','-i',list,'-i',path.join(repo,'public/mall/ch2/retention.mp3'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-ar','48000','-ac','2','-t',String(edit.frames/30),'-movflags','+faststart',file];
 if(spawnSync('ffmpeg',args,{stdio:'inherit'}).status)throw Error('Mux failed');
 if(spawnSync('ffmpeg',['-nostdin','-v','error','-xerror','-i',file,'-f','null','-'],{stdio:'inherit'}).status)throw Error('Decode check failed');
 const info=JSON.parse(spawnSync('ffprobe',['-v','error','-show_streams','-of','json',file],{encoding:'utf8'}).stdout);
 const v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');
 if(Number(v.nb_frames)!==edit.frames||v.width!==1920||v.height!==1080||v.r_frame_rate!=='30/1'||a.channels!==2||a.sample_rate!=='48000')throw Error('Media properties differ from delivery contract');
 console.log('Verified',file);
})().catch(e=>{console.error(e);process.exitCode=1});
