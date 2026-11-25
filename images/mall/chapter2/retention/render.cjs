/* Portable full render. The checked-in audio master needs no generation credentials. */
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../../../..'),work=path.join(repo,'out/chapter2-retention'),local=createRequire(path.join(repo,'package.json'));
const {bundle}=local('@remotion/bundler'),{openBrowser,selectComposition,renderMedia}=local('@remotion/renderer');
const edit=JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/retention-edit.json')));
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE;
(async()=>{
 if(!edit.audioReady||edit.recap!==false)throw Error('Run the edit and audio builders first.');
 fs.mkdirSync(work,{recursive:true});
 const outDir=path.join(work,'bundle'),publicLink=path.join(outDir,'public');
 if(fs.existsSync(publicLink)&&fs.lstatSync(publicLink).isSymbolicLink())fs.unlinkSync(publicLink);
 const serveUrl=await bundle({entryPoint:path.join(repo,'src/index.ts'),rootDir:repo,outDir,enableCaching:false,symlinkPublicDir:true});
 const browser=await openBrowser('chrome',{browserExecutable});
 try{
  const common={serveUrl,puppeteerInstance:browser,browserExecutable};const composition=await selectComposition({...common,id:'MallChapter2'});
  if(composition.durationInFrames!==edit.frames)throw Error('Composition length differs from the edit.');
  let old=-1;await renderMedia({...common,composition,outputLocation:path.join(work,'picture.mp4'),muted:true,codec:'h264',crf:19,pixelFormat:'yuv420p',imageFormat:'jpeg',jpegQuality:94,concurrency:6,x264Preset:'fast',onProgress:p=>{const n=Math.floor(p.progress*100);if(n!==old){old=n;console.log(n+'%');}}});
 }finally{await browser.close({silent:true});}
 const file=path.join(work,'night-guard-chapter-2-v7.mp4');
 const args=['-nostdin','-v','error','-y','-i',path.join(work,'picture.mp4'),'-i',path.join(repo,'public/mall/ch2/retention.mp3'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-ar','48000','-ac','2','-t',String(edit.frames/30),'-movflags','+faststart',file];
 if(spawnSync('ffmpeg',args,{stdio:'inherit'}).status)throw Error('Mux failed');
 if(spawnSync('ffmpeg',['-nostdin','-v','error','-xerror','-i',file,'-f','null','-'],{stdio:'inherit'}).status)throw Error('Decode check failed');
 const info=JSON.parse(spawnSync('ffprobe',['-v','error','-show_streams','-of','json',file],{encoding:'utf8'}).stdout);
 const v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');
 if(Number(v.nb_frames)!==edit.frames||v.width!==1920||v.height!==1080||v.r_frame_rate!=='30/1'||a.channels!==2||a.sample_rate!=='48000')throw Error('Media properties differ from delivery contract');
 console.log('Verified',file);
})().catch(e=>{console.error(e);process.exitCode=1});
