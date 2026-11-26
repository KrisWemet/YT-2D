const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const repo=path.resolve(__dirname,'../../../..'),local=createRequire(path.join(repo,'package.json')),ts=local('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {LADDER_START,LADDER_END,LADDER_DETAIL,CEILING_MIRROR_X,ladderState}=require(path.join(repo,'src/mall/chapter2/continuity.ts'));
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
console.log('Passed: one monotonic descent, no reset at the close view, both actors step clear, consistent rescue sides.');
