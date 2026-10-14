create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=clock_timestamp(); return new; end $$;
create table tenders (
 id uuid primary key default gen_random_uuid(), reference text unique not null, name text not null,
 owner text not null, currency text not null check(currency ~ '^[A-Z]{3}$'), closes_on date not null,
 status text not null default 'draft' check(status in ('draft','open','evaluation','awarded')),
 jurisdiction text not null default 'NZ' check(jurisdiction in ('NZ','AU','Other')),
 source_key text unique, source_hash text, source_rows jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table suppliers (
 id uuid primary key default gen_random_uuid(), reference text unique not null, name text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table lots (
 id uuid primary key default gen_random_uuid(), tender_id uuid not null references tenders,
 reference text not null, name text not null, quantity numeric(14,3) not null check(quantity>0), unit text not null default 'each',
 unique(tender_id,reference), unique(tender_id,id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table participants (
 id uuid primary key default gen_random_uuid(), tender_id uuid not null references tenders, supplier_id uuid not null references suppliers,
 status text not null default 'active' check(status in ('active','withdrawn')), withdrawal_reason text,
 unique(tender_id,supplier_id), check(status='active' or length(trim(withdrawal_reason))>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table criteria (
 id uuid primary key default gen_random_uuid(), tender_id uuid not null references tenders,
 name text not null, weight numeric(6,2) not null check(weight>0 and weight<=100),
 unique(tender_id,name), unique(tender_id,id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table panel (
 id uuid primary key default gen_random_uuid(), tender_id uuid not null references tenders, name text not null,
 declaration text not null default 'pending' check(declaration in ('pending','clear','managed','conflicted')), evidence text,
 unique(tender_id,id), check(declaration='pending' or length(trim(evidence))>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index panel_name_idx on panel(tender_id,lower(name));
create table bids (
 id uuid primary key default gen_random_uuid(), tender_id uuid not null references tenders,
 supplier_id uuid not null references suppliers, lot_id uuid not null,
 unit_price numeric(16,4) not null check(unit_price>=0), lead_days integer check(lead_days>=0),
 evidence text not null check(length(trim(evidence))>0), received_on date,
 unique(tender_id,supplier_id,lot_id), unique(tender_id,id),
 foreign key(tender_id,lot_id) references lots(tender_id,id),
 foreign key(tender_id,supplier_id) references participants(tender_id,supplier_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table scores (
 id uuid primary key default gen_random_uuid(), tender_id uuid not null references tenders,
 supplier_id uuid not null references suppliers, criterion_id uuid not null, panel_id uuid not null,
 value numeric(4,2) not null check(value>=0 and value<=5), rationale text not null check(length(trim(rationale))>0),
 foreign key(tender_id,supplier_id) references participants(tender_id,supplier_id),
 foreign key(tender_id,criterion_id) references criteria(tender_id,id),
 foreign key(tender_id,panel_id) references panel(tender_id,id),
 unique(tender_id,supplier_id,criterion_id,panel_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table clarifications (
 id uuid primary key default gen_random_uuid(), tender_id uuid not null references tenders,
 reference text not null unique, supplier_id uuid not null references suppliers,
 question text not null, owner text not null, due_on date not null, answer text, evidence text,
 foreign key(tender_id,supplier_id) references participants(tender_id,supplier_id),
 check(answer is null or (length(trim(answer))>0 and length(trim(evidence))>0)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table decisions (
 id uuid primary key default gen_random_uuid(), tender_id uuid not null unique references tenders,
 supplier_id uuid not null references suppliers, approved_by text not null, rationale text not null,
 evidence text not null, snapshot jsonb not null,
 foreign key(tender_id,supplier_id) references participants(tender_id,supplier_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity (
 id uuid primary key default gen_random_uuid(), tender_id uuid references tenders, actor text not null,
 action text not null, detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function immutable_record() returns trigger language plpgsql as $$ begin raise exception 'Decision and activity records are immutable'; end $$;
create trigger decisions_immutable before update or delete on decisions for each row execute function immutable_record();
create trigger activity_immutable before update or delete on activity for each row execute function immutable_record();
create index participants_supplier_idx on participants(supplier_id);
create index bids_supplier_idx on bids(supplier_id);
create index bids_lot_idx on bids(lot_id);
create index scores_supplier_idx on scores(supplier_id);
create index scores_criterion_idx on scores(criterion_id);
create index scores_panel_idx on scores(panel_id);
create index clarifications_tender_idx on clarifications(tender_id);
create index clarifications_supplier_idx on clarifications(supplier_id);
create index decisions_supplier_idx on decisions(supplier_id);
create index activity_tender_idx on activity(tender_id,created_at);
create index tenders_closing_idx on tenders(closes_on) where status in ('draft','open','evaluation');
do $$ declare t text; begin
 foreach t in array array['tenders','suppliers','lots','participants','criteria','panel','bids','scores','clarifications','decisions','activity'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;
end $$;
create view bid_coverage as
select t.id tender_id,t.reference,t.name tender,t.status,t.currency,s.id supplier_id,s.name supplier,
 p.status participation,count(l.id)::int expected_lots,count(b.id)::int quoted_lots,
 (count(l.id)-count(b.id))::int missing_lots,
 case when count(l.id)>0 and count(l.id)=count(b.id) then round(sum(l.quantity*b.unit_price),2) end total,
 max(b.lead_days) max_lead_days,count(b.id) filter(where b.received_on>t.closes_on)::int late_bids
from tenders t join participants p on p.tender_id=t.id join suppliers s on s.id=p.supplier_id
left join lots l on l.tender_id=t.id left join bids b on b.lot_id=l.id and b.supplier_id=s.id
 group by t.id,s.id,p.status;
create view scoring_gaps as
select t.id tender_id,t.reference,s.id supplier_id,s.name supplier,c.id criterion_id,c.name criterion,e.id panel_id,e.name reviewer
from tenders t join participants p on p.tender_id=t.id and p.status='active' join suppliers s on s.id=p.supplier_id
join criteria c on c.tender_id=t.id join panel e on e.tender_id=t.id
left join scores sc on sc.tender_id=t.id and sc.supplier_id=s.id and sc.criterion_id=c.id and sc.panel_id=e.id
where t.status='evaluation' and sc.id is null;
create view comparison as
select b.*,case when (select count(*) from criteria c where c.tender_id=b.tender_id)>0
 and (select count(*) from panel e where e.tender_id=b.tender_id)>0
 and (select sum(weight) from criteria c where c.tender_id=b.tender_id)=100
 and (select count(*) from scores sc where sc.tender_id=b.tender_id and sc.supplier_id=b.supplier_id)
 = (select count(*) from criteria c where c.tender_id=b.tender_id)*(select count(*) from panel e where e.tender_id=b.tender_id)
 then (select round(sum(sc.value*c.weight/5)/(select count(*) from panel e where e.tender_id=b.tender_id),2)
 from scores sc join criteria c on c.id=sc.criterion_id where sc.tender_id=b.tender_id and sc.supplier_id=b.supplier_id) end weighted_score,
 (select count(*)::int from clarifications q where q.tender_id=b.tender_id and q.supplier_id=b.supplier_id and q.answer is null) open_questions
from bid_coverage b where participation='active';
create view tender_week as
select t.id,t.reference,t.name,t.owner,t.currency,t.status,t.closes_on,t.closes_on-current_date days_to_close,
 (select count(*)::int from participants p where p.tender_id=t.id and p.status='active') suppliers,
 (select count(*)::int from scoring_gaps g where g.tender_id=t.id) scores_missing,
 (select count(*)::int from clarifications q where q.tender_id=t.id and q.answer is null and q.due_on<current_date) overdue_questions,
 current_date-coalesce((select max(a.created_at)::date from activity a where a.tender_id=t.id),t.updated_at::date) quiet_days
from tenders t;
create view compliance_checks as
select id tender_id,reference,'LOCAL-WEIGHTS' rule,'Evaluation weights must total 100 before opening' issue from tenders t where status<>'draft' and coalesce((select sum(weight) from criteria where tender_id=t.id),0)<>100
union all select t.id,t.reference,'NZ-PROBITY','Panel declaration pending or unresolved: '||e.name from tenders t join panel e on e.tender_id=t.id where t.status<>'awarded' and e.declaration in ('pending','conflicted')
union all select t.id,t.reference,'LOCAL-PANEL','No evaluation panel recorded' from tenders t where status<>'draft' and not exists(select 1 from panel where tender_id=t.id)
union all select tender_id,reference,'LOCAL-COVERAGE','Missing lot prices from '||supplier from bid_coverage where participation='active' and missing_lots>0 and status='evaluation'
union all select tender_id,reference,'LOCAL-LATE-BID','Late receipt needs review: '||supplier from bid_coverage where participation='active' and late_bids>0 and status='evaluation'
union all select distinct tender_id,reference,'NZ-EVALUATION','Incomplete scoring for '||supplier from scoring_gaps
union all select t.id,t.reference,'LOCAL-CLARIFICATION','Overdue clarification: '||q.reference from tenders t join clarifications q on q.tender_id=t.id where q.answer is null and q.due_on<current_date
union all select t.id,t.reference,'LOCAL-IMPORT-BID','Unknown receipt date or lead time: '||s.name from bids b join tenders t on t.id=b.tender_id join suppliers s on s.id=b.supplier_id where b.received_on is null or b.lead_days is null
union all select id,reference,'LOCAL-IMPORT','Imported tender needs weights, panel and source reconciliation' from tenders where source_key is not null and status='draft';
revoke all on bid_coverage,scoring_gaps,comparison,tender_week,compliance_checks from public;
