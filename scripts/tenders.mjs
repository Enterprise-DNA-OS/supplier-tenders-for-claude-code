import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const spec={
 help:[],tenders:[],tender:['tender'],'tenders-due':[], 'bid-coverage':['tender'], 'scoring-gaps':['tender'],comparison:['tender'],
 'clarifications-due':[],attention:[],compliance:[],'supplier-load':[],'award-register':[],history:['tender'],'weekly-review':[],
 add:['reference','name','owner','currency','closes','jurisdiction'], 'add-supplier':['reference','name'],
 'add-lot':['tender','reference','name','quantity','unit'], invite:['tender','supplier'],
 criterion:['tender','name','weight'],'add-reviewer':['tender','name'],declare:['tender','reviewer','declaration','evidence'],
 'set-owner':['tender','owner','reason'],'reconcile-bid':['tender','supplier','lot','lead-days','received','evidence'],open:['tender'],bid:['tender','supplier','lot','price','lead-days','evidence','received'],evaluate:['tender'],
 score:['tender','supplier','criterion','reviewer','value','rationale'],withdraw:['tender','supplier','reason'],
 clarify:['tender','supplier','reference','question','owner','due'],answer:['clarification','answer','evidence'],
 award:['tender','supplier','rationale','evidence'],log:['tender','note'],import:['file','map','dry-run'],export:['file'],'draft-review':[]
};
export const commands=Object.keys(spec);
const read=new Set(['help','tenders','tender','tenders-due','bid-coverage','scoring-gaps','comparison','clarifications-due','attention','compliance','supplier-load','award-register','history','weekly-review','export','draft-review']);
const tables=['tenders','suppliers','lots','participants','criteria','panel','bids','scores','clarifications','decisions','activity'];
const required=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Missing --${k}`);return o[k].trim();};
export function date(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error('Use a real YYYY-MM-DD date');return s;}
const number=(s,min,max=1e12)=>{if(typeof s!=='string'||!/^\d+(\.\d+)?$/.test(s)||!Number.isFinite(Number(s))||Number(s)<min||Number(s)>max)throw Error(`Number must be between ${min} and ${max}`);return Number(s);};
const decimal=(s,min,places,max=1e12)=>{number(s,min,max);if((s.split('.')[1]||'').length>places)throw Error(`Use at most ${places} decimal places`);return s;};
export async function resolve(db,t,key,tenderId){
 if(!['tenders','suppliers','lots','criteria','panel','clarifications'].includes(t))throw Error('Invalid record type');
 if(!key||!key.trim())throw Error('A record reference is required');
 const named=t==='clarifications'?'reference':'name';const hasRef=!['criteria','panel'].includes(t);
 const rows=await db.query(`select * from ${t} where ($2::uuid is null or ${['tenders','suppliers'].includes(t)?'id is not null':'tender_id=$2'}) and (starts_with(id::text,lower($1)) or lower(${named})=lower($1) ${hasRef?'or lower(reference)=lower($1)':''}) order by ${named}`,[key,tenderId||null]);
 if(rows.length!==1)throw Error(rows.length?`Ambiguous ${t}:\n${rows.map(r=>`${r.reference||r.name} ${r.name||''} ${r.id}`).join('\n')}`:`No matching ${t}: ${key}`);
 return rows[0];
}
export function human(data){
 if(Array.isArray(data)){if(!data.length)return '(none)';return table(data,Object.keys(data[0]).map(key=>({key,label:key.replaceAll('_',' '),format:v=>v instanceof Date?v.toISOString():typeof v==='object'?JSON.stringify(v):v})));}
 return Object.entries(data).map(([k,v])=>`\n${k}\n${human(Array.isArray(v)?v:[v])}`).join('\n');
}
const today=()=>new Date().toISOString().slice(0,10);
async function append(db,t,actor,action,detail){await db.query('insert into activity(tender_id,actor,action,detail) values($1,$2,$3,$4)',[t?.id||null,actor,action,JSON.stringify(detail)]);}
async function change(db,cmd,o){
 const actor=required(o,'actor');let t=o.tender?await resolve(db,'tenders',o.tender):null;
 if(t){t=(await db.query('select * from tenders where id=$1 for update',[t.id]))[0];if(t.status==='awarded')throw Error('Awarded tender is locked');}
 const stage=(...states)=>{if(!t||!states.includes(t.status))throw Error(`Requires tender stage: ${states.join(', ')}`);};
 const sup=async()=>{const s=await resolve(db,'suppliers',required(o,'supplier'));if(t){const p=(await db.query('select * from participants where tender_id=$1 and supplier_id=$2',[t.id,s.id]))[0];if(!p||p.status!=='active')throw Error('Supplier is not an active participant');}return s;};
 let result;
 if(cmd==='add'){
  const currency=required(o,'currency').toUpperCase();if(!/^[A-Z]{3}$/.test(currency))throw Error('Currency needs three letters');
  result=await db.query('insert into tenders(reference,name,owner,currency,closes_on,jurisdiction) values($1,$2,$3,$4,$5,$6) returning *',[required(o,'reference'),required(o,'name'),required(o,'owner'),currency,date(required(o,'closes')),o.jurisdiction||'NZ']);t=result[0];
 }else if(cmd==='add-supplier')result=await db.query('insert into suppliers(reference,name) values($1,$2) returning *',[required(o,'reference'),required(o,'name')]);
 else if(cmd==='add-lot'){stage('draft');result=await db.query('insert into lots(tender_id,reference,name,quantity,unit) values($1,$2,$3,$4,$5) returning *',[t.id,required(o,'reference'),required(o,'name'),decimal(required(o,'quantity'),.001,3),o.unit||'each']);}
 else if(cmd==='invite'){stage('draft','open');const s=await resolve(db,'suppliers',required(o,'supplier'));result=await db.query('insert into participants(tender_id,supplier_id) values($1,$2) returning *',[t.id,s.id]);}
 else if(cmd==='criterion'){stage('draft');result=await db.query('insert into criteria(tender_id,name,weight) values($1,$2,$3) returning *',[t.id,required(o,'name'),decimal(required(o,'weight'),.01,2,100)]);}
 else if(cmd==='add-reviewer'){stage('draft','open');result=await db.query('insert into panel(tender_id,name) values($1,$2) returning *',[t.id,required(o,'name')]);}
 else if(cmd==='declare'){
  stage('draft','open','evaluation');const e=await resolve(db,'panel',required(o,'reviewer'),t.id);const d=required(o,'declaration');
  if(!['clear','managed','conflicted'].includes(d))throw Error('Declaration must be clear, managed or conflicted');
  result=await db.query('update panel set declaration=$2,evidence=$3 where id=$1 returning *',[e.id,d,required(o,'evidence')]);
 }else if(cmd==='open'){
  stage('draft');const checks=(await db.query('select (select count(*) from lots where tender_id=$1)::int lots,(select sum(weight) from criteria where tender_id=$1) weights,(select count(*) from panel where tender_id=$1)::int panel,(select count(*) from participants where tender_id=$1)::int suppliers',[t.id]))[0];
  if(!checks.lots||Number(checks.weights)!==100||!checks.panel||!checks.suppliers)throw Error('Need lots, suppliers, a panel and weights totalling 100');
  if(t.closes_on<today()&&!t.source_key)throw Error('Closing date has passed');
  if(t.source_key){if(t.owner==='Import reconciliation required'||(await db.query('select id from bids where tender_id=$1 and (received_on is null or lead_days is null)',[t.id])).length)throw Error('Reconcile imported bid dates, lead times and owner first');}
  result=await db.query("update tenders set status='open' where id=$1 returning *",[t.id]);
 }else if(cmd==='set-owner'){
  stage('draft');required(o,'reason');result=await db.query('update tenders set owner=$2 where id=$1 returning *',[t.id,required(o,'owner')]);
 }else if(cmd==='reconcile-bid'){
  stage('draft');if(!t.source_key)throw Error('Only imported drafts can be reconciled');const s=await sup();const l=await resolve(db,'lots',required(o,'lot'),t.id);const received=date(required(o,'received'));if(received>today())throw Error('Future receipt date');const lead=number(required(o,'lead-days'),0,3650);if(!Number.isInteger(lead))throw Error('Lead days must be an integer');
  result=await db.query('update bids set received_on=$4,lead_days=$5,evidence=$6 where tender_id=$1 and supplier_id=$2 and lot_id=$3 returning *',[t.id,s.id,l.id,received,lead,required(o,'evidence')]);if(!result.length)throw Error('No imported bid for that lot');
 }else if(cmd==='bid'){
  stage('open');const s=await sup();const l=await resolve(db,'lots',required(o,'lot'),t.id);const received=date(required(o,'received'));
  if(received>today()||received>t.closes_on)throw Error('Receipt must not be future-dated or after the closing date');
  const lead=number(required(o,'lead-days'),0,3650);if(!Number.isInteger(lead))throw Error('Lead days must be an integer');
  result=await db.query('insert into bids(tender_id,supplier_id,lot_id,unit_price,lead_days,evidence,received_on) values($1,$2,$3,$4,$5,$6,$7) returning *',[t.id,s.id,l.id,decimal(required(o,'price'),0,4),lead,required(o,'evidence'),received]);
 }else if(cmd==='evaluate'){
  stage('open');if(t.closes_on>=today())throw Error('Evaluation starts after the closing day (UTC)');
  result=await db.query("update tenders set status='evaluation' where id=$1 returning *",[t.id]);
 }else if(cmd==='score'){
  stage('evaluation');const s=await sup();const c=await resolve(db,'criteria',required(o,'criterion'),t.id);const e=await resolve(db,'panel',required(o,'reviewer'),t.id);
  if(!['clear','managed'].includes(e.declaration))throw Error('Reviewer declaration must be clear or managed with evidence');
  if(actor.toLowerCase()!==e.name.toLowerCase())throw Error('Score actor must match the reviewer');
  result=await db.query('insert into scores(tender_id,supplier_id,criterion_id,panel_id,value,rationale) values($1,$2,$3,$4,$5,$6) returning *',[t.id,s.id,c.id,e.id,decimal(required(o,'value'),0,2,5),required(o,'rationale')]);
 }else if(cmd==='withdraw'){
  stage('open','evaluation');const s=await sup();result=await db.query("update participants set status='withdrawn',withdrawal_reason=$3 where tender_id=$1 and supplier_id=$2 returning *",[t.id,s.id,required(o,'reason')]);
 }else if(cmd==='clarify'){
  stage('open','evaluation');const s=await sup();result=await db.query('insert into clarifications(tender_id,supplier_id,reference,question,owner,due_on) values($1,$2,$3,$4,$5,$6) returning *',[t.id,s.id,required(o,'reference'),required(o,'question'),required(o,'owner'),date(required(o,'due'))]);
 }else if(cmd==='answer'){
  const q=await resolve(db,'clarifications',required(o,'clarification'));t=(await db.query('select * from tenders where id=$1 for update',[q.tender_id]))[0];stage('open','evaluation');
  result=await db.query('update clarifications set answer=$2,evidence=$3 where id=$1 and answer is null returning *',[q.id,required(o,'answer'),required(o,'evidence')]);if(!result.length)throw Error('Clarification already answered');
 }else if(cmd==='award'){
  stage('evaluation');const s=await sup();const panel=await db.query('select * from panel where tender_id=$1',[t.id]);
  if(panel.some(e=>e.name.toLowerCase()===actor.toLowerCase())||t.owner.toLowerCase()===actor.toLowerCase())throw Error('Award needs an independent approver, separate from owner and panel');
  const issues=await db.query('select * from compliance_checks where tender_id=$1',[t.id]);
  const comparisons=await db.query('select * from comparison where tender_id=$1 order by supplier',[t.id]);
  if(issues.length||!comparisons.length||comparisons.some(r=>r.weighted_score===null||r.total===null||r.open_questions>0))throw Error('Award blocked by incomplete bids, scoring, declarations or clarifications');
  result=await db.query('insert into decisions(tender_id,supplier_id,approved_by,rationale,evidence,snapshot) values($1,$2,$3,$4,$5,$6) returning *',[t.id,s.id,actor,required(o,'rationale'),required(o,'evidence'),JSON.stringify({comparisons,panel,criteria:await db.query('select * from criteria where tender_id=$1',[t.id]),scores:await db.query('select * from scores where tender_id=$1',[t.id]),bids:await db.query('select * from bids where tender_id=$1',[t.id])})]);
  await db.query("update tenders set status='awarded' where id=$1",[t.id]);
 }else if(cmd==='log'){stage('draft','open','evaluation');result=[{note:required(o,'note')}];}
 else throw Error('Unknown write command');
 await append(db,t,actor,cmd,{input:o,result});return result;
}

const headers={event_id:'Event ID',event_name:'Event Name',supplier_id:'Supplier ID',supplier_name:'Supplier Name',lot_id:'Lot ID',lot_name:'Lot Name',quantity:'Quantity',unit_price:'Unit Price',currency:'Currency',closes:'Closing Date'};
async function importCsv(db,o,pos){
 if(pos.join(' ')!=='market-dojo')throw Error('Use import market-dojo');const actor=required(o,'actor');
 const file=required(o,'file');const mapping=o.map?JSON.parse(fs.readFileSync(o.map,'utf8')):{};
 for(const k of Object.keys(mapping))if(!Object.hasOwn(headers,k)||typeof mapping[k]!=='string')throw Error('Unknown or invalid mapping key: '+k);
 const map={...headers,...mapping};const rows=parseCsv(fs.readFileSync(file,'utf8'));if(!rows.length)throw Error('Import contains no data rows');
 const groups=new Map();const seen=new Set();
 for(const raw of rows){
  const r={};for(const [k,h] of Object.entries(map)){if(!Object.hasOwn(raw,h)||!String(raw[h]).trim())throw Error('Missing CSV field: '+h);r[k]=String(raw[h]).trim();}
  date(r.closes);decimal(r.quantity,.001,3);decimal(r.unit_price,0,4);if(!/^[A-Z]{3}$/.test(r.currency))throw Error('Currency must be an uppercase three-letter code');
  const key=JSON.stringify([r.event_id,r.supplier_id,r.lot_id]);if(seen.has(key))throw Error('Duplicate event/supplier/lot row');seen.add(key);
  if(!groups.has(r.event_id))groups.set(r.event_id,[]);groups.get(r.event_id).push({r,raw});
 }
 let inserted=0,unchanged=0;
 for(const [id,group] of groups){
  const first=group[0].r;const lotDefs=new Map(),supplierDefs=new Map();
  for(const {r} of group){
   for(const k of ['event_name','currency','closes'])if(r[k]!==first[k])throw Error('Inconsistent event metadata: '+id);
   const lot=JSON.stringify([r.lot_name,Number(r.quantity)]);if(lotDefs.has(r.lot_id)&&lotDefs.get(r.lot_id)!==lot)throw Error('Inconsistent lot metadata');lotDefs.set(r.lot_id,lot);
   if(supplierDefs.has(r.supplier_id)&&supplierDefs.get(r.supplier_id)!==r.supplier_name)throw Error('Inconsistent supplier metadata');supplierDefs.set(r.supplier_id,r.supplier_name);
  }
  const canonical=group.map(({raw})=>Object.fromEntries(Object.entries(raw).sort(([a],[b])=>a.localeCompare(b)))).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const hash=crypto.createHash('sha256').update(JSON.stringify({map,rows:canonical})).digest('hex');const source='market-dojo:'+id;
  const old=(await db.query('select * from tenders where source_key=$1',[source]))[0];
  if(old){if(old.source_hash!==hash)throw Error('Changed import refused; reconcile against the preserved source: '+id);unchanged++;continue;}
  const t=(await db.query('insert into tenders(reference,name,owner,currency,closes_on,source_key,source_hash,source_rows) values($1,$2,$3,$4,$5,$6,$7,$8) returning *',['MD-'+id,first.event_name,'Import reconciliation required',first.currency,first.closes,source,hash,JSON.stringify(group.map(x=>x.raw))]))[0];
  for(const {r} of group){
   const s=(await db.query('select * from suppliers where reference=$1',['MD-'+r.supplier_id]))[0]||(await db.query('insert into suppliers(reference,name) values($1,$2) returning *',['MD-'+r.supplier_id,r.supplier_name]))[0];
   if(s.name!==r.supplier_name)throw Error('Imported supplier name changed: '+r.supplier_id);
   await db.query('insert into participants(tender_id,supplier_id) values($1,$2) on conflict do nothing',[t.id,s.id]);
   const l=(await db.query('select * from lots where tender_id=$1 and reference=$2',[t.id,r.lot_id]))[0]||(await db.query('insert into lots(tender_id,reference,name,quantity) values($1,$2,$3,$4) returning *',[t.id,r.lot_id,r.lot_name,r.quantity]))[0];
   await db.query('insert into bids(tender_id,supplier_id,lot_id,unit_price,lead_days,evidence,received_on) values($1,$2,$3,$4,null,$5,null)',[t.id,s.id,l.id,r.unit_price,'Imported source row; receipt and lead time require reconciliation']);
  }
  await append(db,t,actor,'import',{source,hash,rows:group.length,note:'Draft only; receipt dates and lead times remain unknown. Reconcile before use.'});inserted++;
 }
 return [{inserted,unchanged,rows:rows.length,dry_run:Boolean(o['dry-run']),warning:'Draft import only. Receipt dates and lead times need reconciliation. Scores and awards are not imported.'}];
}
export async function run(db,args){
 const pos=[],o={};for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i);if(Object.hasOwn(o,k))throw Error('Repeated option: '+k);o[k]=i<0?true:a.slice(i+1);}else pos.push(a);}
 const cmd=pos.shift()||'help';if(!Object.hasOwn(spec,cmd))throw Error('Unknown command. Use help');
 for(const k of Object.keys(o))if(!['json',...spec[cmd],...(!read.has(cmd)?['actor']:[])].includes(k))throw Error('Unknown option --'+k);
 for(const k of ['json','dry-run'])if(k in o&&o[k]!==true)throw Error('--'+k+' is a flag');
 if(cmd!=='import'&&pos.length)throw Error('Unexpected positional argument');
 if(!read.has(cmd)){
  await db.exec('BEGIN');try{const result=cmd==='import'?await importCsv(db,o,pos):await change(db,cmd,o);await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}
 }
 const t=o.tender?await resolve(db,'tenders',required(o,'tender')):null;
 if(cmd==='help')return Object.entries(spec).map(([command,options])=>({command,options:options.map(x=>'--'+x+'=').join(' ')+(!read.has(command)?' --actor=':'')}));
 if(cmd==='tenders')return db.query('select * from tender_week order by closes_on,reference');
 if(cmd==='tender'){
  const tender=t||await resolve(db,'tenders',required(o,'tender'));const out={tender};for(const k of tables.filter(k=>!['tenders','suppliers'].includes(k)))out[k]=await db.query(`select * from ${k} where tender_id=$1 order by created_at,id`,[tender.id]);return out;
 }
 if(cmd==='tenders-due')return db.query("select reference,name,owner,status,closes_on,days_to_close from tender_week where status<>'awarded' and days_to_close<=30 order by closes_on,reference");
 if(['bid-coverage','scoring-gaps','comparison'].includes(cmd)){
  const view=cmd.replaceAll('-','_');const columns=cmd==='scoring-gaps'?'reference,supplier,criterion,reviewer':cmd==='comparison'?'reference,supplier,currency,expected_lots,quoted_lots,total,max_lead_days,weighted_score,open_questions':'reference,supplier,expected_lots,quoted_lots,missing_lots,late_bids';
  return db.query(`select ${columns} from ${view} where ($1::uuid is null or tender_id=$1) order by reference,supplier`,[t?.id||null]);
 }
 if(cmd==='clarifications-due')return db.query('select t.reference tender,q.reference,q.question,q.owner,q.due_on,s.name supplier from clarifications q join tenders t on t.id=q.tender_id join suppliers s on s.id=q.supplier_id where q.answer is null order by due_on,q.reference');
 if(cmd==='attention')return db.query("select reference,name,status,days_to_close,scores_missing,overdue_questions,quiet_days from tender_week where status<>'awarded' and (days_to_close<0 or scores_missing>0 or overdue_questions>0 or quiet_days>=14) order by reference");
 if(cmd==='compliance')return db.query('select reference,rule,issue from compliance_checks order by reference,rule,issue');
 if(cmd==='supplier-load')return db.query("select s.reference,s.name,count(*)::int active_tenders from participants p join suppliers s on s.id=p.supplier_id join tenders t on t.id=p.tender_id where p.status='active' and t.status<>'awarded' group by s.id order by active_tenders desc,s.name");
 if(cmd==='award-register')return db.query('select t.reference,t.name,s.name supplier,d.approved_by,d.rationale,d.evidence,d.created_at from decisions d join tenders t on t.id=d.tender_id join suppliers s on s.id=d.supplier_id order by d.created_at');
 if(cmd==='history')return db.query('select a.* from activity a where ($1::uuid is null or tender_id=$1) order by created_at,id',[t?.id||null]);
 if(cmd==='weekly-review'){const out={};for(const c of ['tenders-due','scoring-gaps','clarifications-due'])out[c]=await run(db,[c]);return out;}
 if(cmd==='export'){
  const out={format:'supplier-tenders-v1',exported_at:new Date().toISOString()};await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ');try{for(const k of tables)out[k]=await db.query(`select * from ${k} order by id`);await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
  const file=path.resolve(required(o,'file'));fs.writeFileSync(file,JSON.stringify(out,null,2)+'\n',{flag:'wx'});return [{file,record_sets:tables.length}];
 }
 if(cmd==='draft-review'){
  const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'weekly-review-'+crypto.randomUUID()+'.md');
  fs.writeFileSync(file,'# Supplier tender review\n\nDraft only. Nothing sent.\n'+human(await run(db,['weekly-review']))+'\n',{flag:'wx'});return [{file}];
 }
 throw Error('Command not implemented');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const data=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(data,null,2):human(data));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
