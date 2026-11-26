/* Opening ten-minute review only. No generation API key is needed. */
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'../../..'),work=path.join(repo,'out/chapter2-style-review'),local=createRequire(path.join(repo,'package.json'));
const {bundle}=local('@remotion/bundler'),{openBrowser,selectComposition,renderMedia}=local('@remotion/renderer');
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE;
const run=args=>{const p=spawnSync('ffmpeg',['-nostdin','-v','error','-y',...args],{stdio:'inherit'});if(p.status)throw Error('ffmpeg failed');};
(async()=>{
 fs.mkdirSync(work,{recursive:true});const outDir=path.join(work,'bundle'),pub=path.join(outDir,'public');
 if(fs.existsSync(pub)&&fs.lstatSync(pub).isSymbolicLink())fs.unlinkSync(pub);
 const serveUrl=await bundle({entryPoint:path.join(repo,'src/index.ts'),rootDir:repo,outDir,enableCaching:false,symlinkPublicDir:true});
 const browser=await openBrowser('chrome',{browserExecutable});
 try{
  const common={serveUrl,puppeteerInstance:browser,browserExecutable};const composition=await selectComposition({...common,id:'MallChapter2StyleReview10Min'});
  if(composition.durationInFrames!==18000)throw Error('Review must be exactly ten minutes');
  let previous=-1;await renderMedia({...common,composition,outputLocation:path.join(work,'picture.mp4'),muted:true,codec:'h264',crf:18,pixelFormat:'yuv420p',imageFormat:'jpeg',jpegQuality:94,concurrency:6,x264Preset:'fast',onProgress:q=>{const p=Math.floor(q.progress*100);if(p!==previous){previous=p;console.log(p+'%');}}});
 }finally{await browser.close({silent:true});}
 const audio=process.env.NIGHT_GUARD_AUDIO_REFERENCE??path.join(repo,'public/mall/ch2/retention.mp3');
 const out=path.join(work,'night-guard-chapter-2-v9-first-10-minutes.mp4');
 const audioArgs=process.env.NIGHT_GUARD_AUDIO_REFERENCE?['-c:a','copy']:['-c:a','aac','-b:a','256k','-ar','48000','-ac','2'];
 run(['-i',path.join(work,'picture.mp4'),'-i',audio,'-map','0:v:0','-map','1:a:0','-t','600','-c:v','copy',...audioArgs,'-video_track_timescale','90000','-movflags','+faststart',out]);
 run(['-xerror','-i',out,'-f','null','-']);
 const info=JSON.parse(spawnSync('ffprobe',['-v','error','-show_streams','-of','json',out],{encoding:'utf8'}).stdout),v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');
 if(Number(v.nb_frames)!==18000||v.width!==1920||v.height!==1080||v.r_frame_rate!=='30/1'||a.sample_rate!=='48000'||a.channels!==2)throw Error('Review media verification failed');
 console.log('Verified',out);
})().catch(e=>{console.error(e);process.exitCode=1});
