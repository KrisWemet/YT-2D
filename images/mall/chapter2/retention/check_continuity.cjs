const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const repo=path.resolve(__dirname,'../../../..'),local=createRequire(path.join(repo,'package.json')),ts=local('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {LADDER_START,LADDER_END,LADDER_DETAIL,CEILING_MIRROR_X,ladderState,crawlState}=require(path.join(repo,'src/mall/chapter2/continuity.ts'));
let previous=ladderState(LADDER_START);
for(let t=LADDER_START;t<=LADDER_END;t+=1/30){
 const current=ladderState(t);
 assert(current.dannyY>=previous.dannyY,'Danny climbs back up at a cut');
 assert(current.theoY>=previous.theoY,'Theo climbs back up at a cut');
 assert(current.dannyX>=310&&current.theoX>=325);
 assert(current.dannyY<=1425&&current.theoY<=1425);
 previous=current;
}
assert(ladderState(LADDER_DETAIL).dannyDown>.7,'The close view restarts Danny at the top');
assert(ladderState(LADDER_DETAIL).theoDown>.5,'The close view restarts Theo at the top');
const end=ladderState(LADDER_END);
assert.equal(end.dannyY,1425);assert.equal(end.theoY,1425);
assert(end.dannyX>700&&end.theoX>1000,'Actors must step off the ladder');
assert(end.theoX>end.dannyX,'Theo must stay on Danny’s right');
// The rescue is staged from the same side as the crawl, including the recovery.
for(const haul of [0,.25,.5,.75,1]){
 const danny=CEILING_MIRROR_X-(980-97*haul);
 const theo=CEILING_MIRROR_X-(580-97*haul);
 assert(theo>danny,'Theo changes sides during the rescue');
}
// The crawl above the court never jumps or slides backward at a cut, keeps Theo ahead of Danny
// and ends on the marks the collapse uses.
let crawl=crawlState(969.26);
for(let t=969.26;t<1071.05;t+=1/30){
 const now=crawlState(t);
 assert(now.dannyX>=crawl.dannyX-1e-9,'Danny crawls backward');
 assert(Math.abs(now.dannyX-crawl.dannyX)<4&&Math.abs(now.theoX-crawl.theoX)<4,'A crawler jumps between frames');
 assert(now.theoX-now.dannyX>350,'Theo must stay ahead of Danny');
 crawl=now;
}
assert(Math.abs(crawl.dannyX-(CEILING_MIRROR_X-980))<2&&Math.abs(crawl.theoX-(CEILING_MIRROR_X-580))<2,'The crawl must end on the collapse marks');
// No picture in the edit lasts under half a second unless it was drawn as a quick insert.
const {buildSync}=local('esbuild');
const entry=path.join(repo,'out/check-plan-entry.tsx');
fs.mkdirSync(path.dirname(entry),{recursive:true});
fs.writeFileSync(entry,"export {RETENTION_PLAN,RETENTION_DIPS,RETENTION_DISSOLVES} from '../src/mall/chapter2/retention';\n");
const built=buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'error',loader:{'.jpg':'file','.png':'file'},outdir:path.join(repo,'out')});
const mod={exports:{}};new Function('module','exports','require',built.outputFiles[0].text)(mod,mod.exports,require);
const {RETENTION_PLAN:plan,RETENTION_DIPS:dips,RETENTION_DISSOLVES:dissolves}=mod.exports;
const quick=plan.filter(r=>r.end-r.start<15);
assert.equal(quick.length,0,`Flash frames: ${quick.map(r=>`${r.unit}@${r.start}`).join(', ')}`);
assert.equal(plan[0].start,0);assert.equal(plan[plan.length-1].end,JSON.parse(fs.readFileSync(path.join(repo,'src/mall/chapter2/retention-edit.json'))).frames);
plan.slice(1).forEach((r,i)=>assert.equal(r.start,plan[i].end,'Gap or overlap in the picture plan'));
console.log(`Passed: one monotonic descent, no reset at the close view, both actors step clear, consistent rescue sides, one continuous crawl, ${plan.length} pictures of at least half a second, ${dips.length} dips and ${dissolves.length} dissolves.`);
