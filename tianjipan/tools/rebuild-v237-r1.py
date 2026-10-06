#!/usr/bin/env python3
"""Rebuild the standalone revision from the exact uploaded V237 baseline. No network required."""
import re,json,hashlib,pathlib,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
src=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'sources/天机盘_v237_原始版.html'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='84e0ca60b3a7163231be3fda6412b087ab06db60337b45cfb716dd7bd34a34c1', 'Unexpected baseline: inspect source before rebuilding'
html=src.read_text(); matches=list(re.finditer(r'(<script\b[^>]*>)([\s\S]*?)(</script\s*>)',html,re.I)); scripts=[m[2] for m in matches]
def rep(i,a,b):
 assert scripts[i].count(a)==1,(i,a[:90],scripts[i].count(a))
 scripts[i]=scripts[i].replace(a,b)
def function(i,name,new):
 s=scripts[i];start=s.index('function '+name+'(');end=s.index('\n}',start)+2;scripts[i]=s[:start]+new+s[end:]
# One canonical build established before all legacy modules.
rep(2,"version:'v219',","version:'v237.1',")
rep(2,"display:'V219 · 融合工程版',","display:'V237.1 · 四余三历元链 / 安全稳定修订版',")
rep(2,"build:'v219-fusion · 2026-10-06 19:29 +08:00',","build:'v237.1-stability-r1 · 2026-10-06',")
rep(2,"baseline:'v219-engineering',","baseline:'v237',edition:'stability',")
# Digest checked both for downloaded source and executable local cache.
helper="""
window.TianjiVendorIntegrity=Object.freeze({async verify(code,expected){
 if(typeof code!=='string'||!code||code.length>2000000||!globalThis.crypto?.subtle)return false;
 const bytes=new TextEncoder().encode(code),digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')===expected;
}});
"""
rep(2,'window.TianjiBuild=BUILD;','window.TianjiBuild=BUILD;\n'+helper)
# Registry contract + prevent prototype keys entering config merge.
rep(48,'const licenses=new Map();','const licenses=new Map();\nconst rules=new Map();\nfunction registerRule(x){if(!x||typeof x.id!==\'string\'||!x.id)throw new Error(\'TianjiCore.registerRule: id required\');rules.set(x.id,Object.freeze({...x}));return x.id}')
rep(48,'registerEngine,registerSource,registerLicense,runEngine','registerRule,listRules:()=>[...rules.values()],registerEngine,registerSource,registerLicense,runEngine')
scripts[48]=scripts[48].replace('sources:[...sources.values()],licenses:','sources:[...sources.values()],rules:[...rules.values()],licenses:')
rep(48,'for(const [k,v] of Object.entries(b||{})){','for(const [k,v] of Object.entries(b||{})){if([\'__proto__\',\'prototype\',\'constructor\'].includes(k))continue;')
rep(2,"edition:'V219 融合工程版'","edition:BUILD.display")
# Shared birth adapter rather than reaching into another module's lexical scope.
rep(73,'function zChart(){','window.TianjiZiweiInput=Object.freeze({fromResult:zBirth});\nfunction zChart(){')
for i in [136,137]:scripts[i]=scripts[i].replace('zBirth(R0)','window.TianjiZiweiInput.fromResult(R0)')
# Date shape validation must reject impossible civil dates, fractional date parts and NaN.
function(49,'validateCivil',"""function validateCivil(c){
 if(!c||![c.y,c.m,c.d].every(Number.isInteger))throw new TypeError('TimeContext: y/m/d must be integers');
 const {y,m,d}=c,h=c.h??0,mi=c.mi??0,sec=c.s??0;
 const leap=y%4===0&&(y%100!==0||y%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 if(y<1800||y>2200||m<1||m>12||d<1||d>days[m-1]||!Number.isInteger(h)||h<0||h>23||!Number.isInteger(mi)||mi<0||mi>59||!Number.isFinite(sec)||sec<0||sec>=60)throw new RangeError('TimeContext: invalid civil date or time');
 return {y,m,d,h,mi,s:sec};
}""")
rep(5,'const o=readOpts();isDay=nwSun(jdUT,o.lon,o.lat).alt>0;','const o=R.opt||{};isDay=nwSun(jdUT,Number.isFinite(o.lon)?o.lon:120,Number.isFinite(o.lat)?o.lat:24.5).alt>0;')
# Civil parsing in the people store and the visible form shares the same strict validation.
old=re.search(r'const pplParse=s=>[^\n]+',scripts[5]).group(0)
rep(5,old,r"""function pplValidCivil(c){const leap=c.y%4===0&&(c.y%100!==0||c.y%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];return c.y>=1901&&c.y<=2099&&c.m>=1&&c.m<=12&&c.d>=1&&c.d<=days[c.m-1]&&c.h>=0&&c.h<=23&&c.mi>=0&&c.mi<=59&&c.s>=0&&c.s<60;}
const pplParse=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s||'');if(!m)return null;const c={y:+m[1],m:+m[2],d:+m[3],h:+m[4],mi:+m[5],s:m[6]?+m[6]:0};return pplValidCivil(c)?c:null;};""")
old=re.search(r'function parseDt\(\)\{[\s\S]*?return c;\}',scripts[5]).group(0)
rep(5,old,"function parseDt(){return pplParse($('#dt').value||'');}")
old=re.search(r'function readOpts\(\)\{[^\n]+',scripts[5]).group(0)
rep(5,old,"function readOpts(){const lon=parseFloat($('#lon').value),lat=parseFloat($('#lat').value);return {gender:$('#gender').value==='1'?'M':'F',solar:$('#solarChk').checked,lon:Number.isFinite(lon)?Math.max(-180,Math.min(180,lon)):120,lat:Number.isFinite(lat)?Math.max(-66,Math.min(66,lat)):24.5};}")
# Safe IDs, stable relationship remapping, and committed snapshot for rollback.
rep(5,'function pplNormRel(a,b,role){',"function pplSanHm(h){if(!h||typeof h!=='object')return null;const pct=Number(h.pct);if(!Number.isFinite(pct)||pct<0||pct>100)return null;return {mode:h.mode==='marry'||Object.hasOwn(HH_KIND,h.mode)?h.mode:'marry',pct,score:Number.isFinite(Number(h.score))?Number(h.score):0,lv:String(h.lv||'').slice(0,80),t:Number.isFinite(Number(h.t))&&Math.abs(Number(h.t))<8.64e15?Number(h.t):0};}\nfunction pplNormRel(a,b,role){")
scripts[5]=scripts[5].replace('hm:raw.hm||null','hm:pplSanHm(raw.hm)').replace('${r.hm.pct}','${esc(r.hm.pct)}').replace('${r.hm.lv}','${esc(r.hm.lv)}').replace('${rel.hm.pct}','${esc(rel.hm.pct)}').replace('${rel.hm.lv}','${esc(rel.hm.lv)}')
rep(5,'function pplLoad(){','function pplLoad(){\n  pplCommitted=pplCheckpoint();')
rep(5,"const pplParse=s=>", "const pplSafeId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,96}$/.test(id)&&!['__proto__','prototype','constructor'].includes(id);\nlet pplCommitted=null;\nfunction pplCheckpoint(){return JSON.parse(JSON.stringify({people:PPL.people,rels:PPL.rels,meId:PPL.meId,pos:PPL.pos,cur:PPL.cur}));}\nfunction pplRestore(){if(pplCommitted)Object.assign(PPL,JSON.parse(JSON.stringify(pplCommitted)),{cache:{}});}\nconst pplParse=s=>")
rep(5,'    return true;\n  };\n  try{if(hydrate','    pplRepairData(false);pplCommitted=pplCheckpoint();return true;\n  };\n  try{if(hydrate')
function(5,'pplSave',"""function pplSave(){
 try{
  const now=Date.now();PPL.people.forEach(p=>{if(!p.createdAt)p.createdAt=now;if(!p.updatedAt)p.updatedAt=p.createdAt;if(!p.source)p.source='legacy';});
  const data={schema:5,api:'TJPeople/1.2',updatedAt:now,...pplCheckpoint()};
  localStorage.setItem(PPLK,JSON.stringify(data));pplCommitted=pplCheckpoint();
  // The authoritative master is committed; a failing legacy mirror cannot invalidate it.
  try{localStorage.setItem('tianjipan.people.v3',JSON.stringify(pplCommitted));}catch(e){console.warn('[人物主库] 主库已保存，旧版镜像写入失败',e.name);}
  return true;
 }catch(e){pplRestore();toast('保存失败：本地存储不可用或空间不足；本次更改未保存，请先导出备份。');return false;}
}""")
rep(5,'const now=Date.now(),seen=new Set(),out=[];','const now=Date.now(),seen=new Set(),out=[],remap=new Map();')
rep(5,"if(!id||seen.has(id)){id=pplId();rep.fixed++;if(p.id)rep.duplicateIds++;}","const old=id;if(!pplSafeId(id)||seen.has(id)){do{id=pplId()}while(seen.has(id));rep.fixed++;if(seen.has(old))rep.duplicateIds++;}if(!remap.has(old))remap.set(old,id);")
rep(5,"let a=String(raw.a||''),b=String(raw.b||'');","let a=remap.get(String(raw.a||''))||String(raw.a||''),b=remap.get(String(raw.b||''))||String(raw.b||'');")
rep(5,'  const pos={};Object.entries(PPL.pos||{}).forEach(([id,q])=>{','  PPL.cur=remap.get(PPL.cur)||PPL.cur;PPL.meId=remap.get(PPL.meId)||PPL.meId;\n  const pos={};Object.entries(PPL.pos||{}).forEach(([oldId,q])=>{const id=remap.get(oldId)||oldId;')
rep(5,"id:String(raw.id||('r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6))),", "id:pplSafeId(raw.id)&&!rels.some(r=>r.id===raw.id)?raw.id:('r'+pplId()),")
# Import IDs remapped; duplicate references rejected before mutation; count bound.
rep(5,"if(!o||!Array.isArray(o.people))throw new Error('bad');","if(!o||!Array.isArray(o.people)||o.people.length>2000)throw new Error('人物格式无效，或超过2000人导入上限');\n  const inputIds=new Set();for(const p of o.people){if(!p||typeof p!=='object')throw new Error('人物记录格式无效');const id=String(p.id||'');if(id&&inputIds.has(id))throw new Error('导入文件存在重复人物ID');if(id)inputIds.add(id);}")
rep(5,'map={},used=new Set(PPL.people.map(p=>p.id));','map=new Map(),used=new Set(PPL.people.map(p=>p.id));')
rep(5,"id=old;if(!id||used.has(id))id=pplId();used.add(id);map[old]=id;","id=old;if(!pplSafeId(id)||used.has(id)){do{id=pplId()}while(used.has(id));}used.add(id);map.set(old,id);")
rep(5,'const a=map[raw.a]||raw.a,b=map[raw.b]||raw.b;','const a=map.get(String(raw.a)),b=map.get(String(raw.b));')
rep(5,'const rr=pplRepairData(false);pplSave();pplAfterChange();','const rr=pplRepairData(false);if(!pplSave())throw new Error(\'导入未保存：本地存储不可用或空间不足\');pplAfterChange();')
# Wrap every caller of boolean save to prevent success after an unsuccessful commit.
for i in [5,20,21,25,28]:
 # Existing callers in these blocks are statements, not function declarations.
 scripts[i]=re.sub(r'(?<!function )\bpplSave\(\);',"if(!pplSave())return false;",scripts[i])
# Restore API error contract where a caller needs a thrown failure and event handling.
rep(20,'  if(!pplSave())return false;try{pplBook();','  if(!pplSave())throw new Error(\'本次更改未保存，请检查本地存储空间\');try{pplBook();')
rep(20,"id:d.id||pplId(),", "id:pplSafeId(d.id)&&!PPL.people.some(p=>p.id===d.id)?d.id:pplId(),")
# guard all people page property event handlers after binding, including promise errors.
rep(20,"fi.value='';};\n}","fi.value='';};\n  for(const el of [pane,...pane.querySelectorAll('*')])for(const key of ['onclick','onchange']){const fn=el[key];if(typeof fn==='function')el[key]=function(...args){try{const v=fn.apply(this,args);if(v?.catch)v.catch(e=>toast(String(e.message||e)));return v}catch(e){toast(String(e.message||e));}}}\n}")
# file-size upper bound and preserve explanatory import failure.
for i in [5,20]:
 scripts[i]=scripts[i].replace('if(!f)return;try{pplImport','if(!f)return;if(f.size>8*1024*1024){toast(\'导入文件超过8MB，请拆分后导入\');return;}try{pplImport')
 scripts[i]=scripts[i].replace("toast('无法识别该人物关系册文件');","toast('导入失败：'+String(e.message||e));")
 scripts[i]=scripts[i].replace("toast('文件无法识别,请选择本页导出的 .json');","toast('导入失败：'+String(e.message||e));")
# Defense in depth: IDs escaped even though canonical values are now validated.
for i,s in enumerate(scripts):
 for expr in ['p.id','r.id','r.a','r.b','A.id','B.id']:
  s=s.replace('${'+expr+'}', '${esc('+expr+')}') if i in [5,20,21,22,25,28] else s
 s=s.replace('PPL_ROLE[raw.role]?raw.role',"Object.hasOwn(PPL_ROLE,raw.role)?raw.role").replace("role=PPL_ROLE[role]?role:'other'","role=Object.hasOwn(PPL_ROLE,role)?role:'other'").replace('if(PPL_NORM[role])','if(Object.hasOwn(PPL_NORM,role))')
 scripts[i]=s
# Per-input calibration. Keep manual semantics; do not automatically adopt a research mapping.
rep(180,"const CAL_KEY='tianjipan.qizheng.tonglimit.v235';","const CAL_KEY='tianjipan.qizheng.tonglimit.v237.by-input';")
start=scripts[180].index('function loadCal()');end=scripts[180].index('function degreeRates()',start)
scripts[180]=scripts[180][:start]+"""function calIdentity(r=currentR()){
 if(!r?.t?.civ)return null;
 return JSON.stringify({rule:'liangtianchi-manual-v1',civ:r.t.civ,opt:r.opt||{},jd:r.t.jdUT??r.t.jd});
}
function calStore(){try{const x=JSON.parse(localStorage.getItem(CAL_KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch(_){return {}}}
function loadCal(r=currentR()){
 const key=calIdentity(r),x=key&&calStore()[key];
 return x&&Number.isInteger(x.startAge)&&x.startAge>=11&&x.startAge<=20?{...x,inputKey:key}:{startAge:null,source:'unresolved',note:'本次输入尚未校准',inputKey:key};
}
const CAL=new Proxy({}, {get:(_,k)=>loadCal()[k],ownKeys:()=>Object.keys(loadCal()),getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})});
let TARGET_YEAR=(()=>{try{return nowBJ().y}catch(_){return new Date().getFullYear()}})();
function saveCal(x){
 const key=calIdentity();if(!key)throw new Error('请先排盘，再校准当前人物');
 if(!Number.isInteger(x?.startAge)||x.startAge<11||x.startAge>20)throw new RangeError('童限校准必须为11至20的整数');
 const store=calStore();store[key]={startAge:x.startAge,source:x.source||'manual',note:String(x.note||'').slice(0,300)};
 localStorage.setItem(CAL_KEY,JSON.stringify(store));return loadCal();
}
function clearCal(){const key=calIdentity(),store=calStore();if(key){delete store[key];localStorage.setItem(CAL_KEY,JSON.stringify(store));}return loadCal();}
"""+scripts[180][end:]
rep(180,'function currentMingDegree(){\n const q=currentQ();','function currentMingDegree(q=currentQ()){')
rep(180,'function hintFromDegree(){\n const d=currentMingDegree();','function hintFromDegree(q=currentQ()){\n const d=currentMingDegree(q);')
rep(180,"const sui=(()=>{try{return TARGET_YEAR-Number(R0?.t?.civ?.y)+1}catch(_){return null}})(),seg=limitAtSui(sui);","const cal=loadCal(R0),sui=(()=>{try{return TARGET_YEAR-Number(R0?.t?.civ?.y)+1}catch(_){return null}})(),seg=limitAtSui(sui,cal.startAge);")
rep(180,"q.dongweiV235={calibration:clone(CAL),targetYear:TARGET_YEAR,sui,segment:clone(seg),hint:hintFromDegree(),","q.dongweiV235={calibration:clone(cal),targetYear:TARGET_YEAR,sui,segment:clone(seg),hint:hintFromDegree(q),")
# null/blank must not become degree zero. Preserve modular angular convention.
rep(182,'const mod30=x=>{const n=Number(x);','const mod30=x=>{if(x==null||typeof x===\'boolean\'||(typeof x===\'string\'&&!x.trim()))return null;const n=Number(x);')
rep(182,'Math.floor((d+1e-10)/3)','Math.floor(d/3)')
rep(182,'((n%30)+30)%30','(n%30<0?n%30+30:n%30)')
# Source phase constants are rounded to 0.0001 day: the pair has at most 0.0001 day quantization uncertainty.
rep(184,"S.nodeOppositionEpochErrorTraditional<1e-6,String(S.nodeOppositionEpochErrorTraditional)", "S.nodeOppositionEpochErrorTraditional<=0.0001/DAY_PER_DU.罗睺,`error=${S.nodeOppositionEpochErrorTraditional}; tolerance=${0.0001/DAY_PER_DU.罗睺} traditional degrees (4-decimal phase rounding)`")
# Stale expected calendar date only; preserve historical model.
rep(166,"ANCHOR.prolepticGregorian==='1578-01-08'","ANCHOR.prolepticGregorian==='1578-01-18'")
# Vendor loader concurrency + bounded retry + integrity.
for i,tag in [(50,'lunar-javascript'),(54,'iztro')]:
 sha={'iztro':'effb3fa5123125ebc564ba7d80d61d6763e0d6ba96e82fc8a1790f2c156b7d9f','lunar-javascript':'9750324bfe1aa63c146f8c72b1143df924466c11c8a5277d7d9225c541a18aaa'}[tag]
 scripts[i]=scripts[i].replace("const VENDOR={", "const VENDOR={\n  sha256:'"+sha+"',",1)
 scripts[i]=scripts[i].replace('async function loadVendor(', 'async function loadVendorOnce(',1)
 sig='force=false' if i==54 else 'force=false'
 wrapper="""let vendorPending=null;
function loadVendor(force=false){
 if(vendorPending)return vendorPending;
 if(state.status==='unavailable'&&!force)return Promise.resolve(state);
 vendorPending=loadVendorOnce(force).finally(()=>{vendorPending=null});return vendorPending;
}
"""
 scripts[i]=scripts[i].replace('async function loadVendorOnce(',wrapper+'async function loadVendorOnce(',1)
 scripts[i]=scripts[i].replace('cached&&evalVendor(cached)','cached&&await TianjiVendorIntegrity.verify(cached,VENDOR.sha256)&&evalVendor(cached)')
 scripts[i]=scripts[i].replace('const code=await fetchVendorText(url);if(!evalVendor(code))',"const code=await fetchVendorText(url);if(!await TianjiVendorIntegrity.verify(code,VENDOR.sha256))throw new Error('第三方脚本完整性校验失败');if(!evalVendor(code))")
rep(50,"'https://cdnjs.cloudflare.com/ajax/libs/lunar-javascript/1.7.7/lunar.min.js',\n    'https://cdn.jsdelivr.net/npm/lunar-javascript@1.7.7/lunar.min.js'","'https://cdn.jsdelivr.net/npm/lunar-javascript@1.7.7/lunar.js',\n    'https://unpkg.com/lunar-javascript@1.7.7/lunar.js'")
rep(54,"'https://unpkg.com/iztro@2.6.1/dist/iztro-v2.6.1.min.js',\n    'https://cdn.jsdelivr.net/npm/iztro@2.6.1/dist/iztro.min.js'","'https://unpkg.com/iztro@2.6.1/dist/iztro-v2.6.1.min.js'")
# Canonical footer text in all old writers; authority modules all share the runtime build.
for i,s in enumerate(scripts):
 if i>=151:s=re.sub(r"const B=Object\.freeze\(\{[\s\S]*?\}\);",'const B=window.TianjiBuild;',s,count=1)
 s=re.sub(r"('版本 · '\s*\+\s*)([A-Za-z_]\w*)(?![\w.])",r'\1window.TianjiBuild.display',s)
 s=s.replace("'版本 · V219 · 融合工程版'", "('版本 · '+window.TianjiBuild.display)").replace("'版本 · V198'", "('版本 · '+window.TianjiBuild.display)")
 scripts[i]=s
# QA contracts and load ordering; static claims must not pretend an unrun check passed.
rep(148,"['TianjiConsumerReport',['report','textReport']]","['TianjiConsumerReport',['build','toText']]")
rep(148,"['TianjiLiuyaoDepth',['selfTest']]","['TianjiLiuyaoDepth',['build']]")
rep(148,"/V215/.test(title)&&/V215/.test(bv)","document.documentElement.dataset.tjBuild===window.TianjiBuild.version&&bv.includes(window.TianjiBuild.display)")
rep(148,"missing.length?'fail':'pass',missing.length?`缺少", "missing.length?(!obj&&deferred&&!['TianjiCore','TianjiPerformance','TianjiLayoutGuard'].includes(name)?'warn':'fail'):'pass',missing.length?`缺少")
rep(148,'function quickChecks(){','function quickChecks(deferred=true){')
rep(148,'  const checks=quickChecks();\n  try{if(window.TianjiPerformance?.load)', '  const checks=[];\n  try{if(window.TianjiPerformance?.load)')
rep(148,'  SELFTESTS.forEach(([name,label])=>','  checks.push(...quickChecks(false));\n  SELFTESTS.forEach(([name,label])=>')
rep(148,"['TianjiFormalEvidenceReport','正式 Evidence 报告']","['TianjiFormalEvidenceReport','正式 Evidence 报告'],\n ['TianjiQizhengResidualV228','四余基础'],['TianjiQizhengLiangtianchiV235','人物校准'],['TianjiQizhengLiangtianchiV236','量天尺图格'],['TianjiQizhengResidualDriftV237','长期漂移']")
rep(148,'ok=r?.ok!==false','ok=r?.ok===true')
rep(148,"source_baseline:'v214'","source_baseline:'v237.1-verified-html'")
# update visible QA identity, keep CSS/API IDs stable.
scripts[148]=scripts[148].replace('V215 RC1','V237.1').replace('天机盘_V215_RC1_QA_','天机盘_V237.1_QA_')
# Overflow behind an explicit scroll/clip ancestor is contained, not a page overflow.
rep(148,"const horizontal=el.scrollWidth-el.clientWidth,pageRight=rect.right-viewportW;", "let contained=false;for(let a=el.parentElement;a&&a!==document.body;a=a.parentElement){if(getComputedStyle(a).position==='fixed'||/auto|scroll|hidden|clip/.test(getComputedStyle(a).overflowX)){contained=true;break;}}\n    const horizontal=el.scrollWidth-el.clientWidth,pageRight=rect.right-viewportW;")
rep(148,"if(pageRight>4&&cs.position!=='fixed'&&!scrollSafe)","if(pageRight>4&&cs.position!=='fixed'&&!scrollSafe&&!contained)")
# A rotating dial clipped by its own overflow:hidden is contained, just like an ancestor clip.
rep(148,'const scrollSafe=/auto|scroll/.test(cs.overflowX)','const scrollSafe=/auto|scroll|hidden|clip/.test(cs.overflowX)')
# Write changed bodies without disturbing CSS, assets or event order.
for m,s in reversed(list(zip(matches,scripts))):html=html[:m.start(2)]+s+html[m.end(2):]
html=html.replace('inset:auto -40px -70px auto;width:240px','inset:auto 50px -70px auto;width:240px').replace('.v126-avrm{position:absolute;right:-5px;top:-5px;', '.v126-avrm{position:absolute;right:0;top:0;')
html=re.sub(r'<title>[\s\S]*?</title>','<title>天机盘 V237.1 · 安全稳定修订版</title>',html,count=1)
out=ROOT/'releases/天机盘_v237_安全稳定修订版.html';out.write_text(html)
print(json.dumps({'bytes':out.stat().st_size,'changedScripts':[i for i,m in enumerate(matches) if m[2]!=scripts[i]],'sha256':hashlib.sha256(out.read_bytes()).hexdigest()},ensure_ascii=False))
