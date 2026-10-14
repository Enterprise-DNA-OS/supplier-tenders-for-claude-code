insert into tenders (id,reference,name,owner,currency,closes_on,status,updated_at) values
('10000000-0000-0000-0000-000000000001','TEN-001','Packaging supply renewal','Aroha','NZD',current_date-7,'evaluation',now()-interval '35 days'),
('10000000-0000-0000-0000-000000000002','TEN-002','Warehouse cleaning contract','Hana','NZD',current_date+5,'open',now()-interval '20 days'),
('10000000-0000-0000-0000-000000000003','TEN-003','Office equipment supply','James','AUD',current_date+15,'draft',now()-interval '40 days')
on conflict do nothing;
insert into suppliers (id,reference,name) values
('10000000-0000-0000-0000-000000000010','SUP-001','Harbour Packaging'),
('10000000-0000-0000-0000-000000000011','SUP-002','Southern Packaging'),
('10000000-0000-0000-0000-000000000012','SUP-003','Clear Site Services')
on conflict do nothing;
insert into lots (id,tender_id,reference,name,quantity,unit) values
('10000000-0000-0000-0000-000000000020','10000000-0000-0000-0000-000000000001','LOT-1','Transit cartons',1000,'carton'),
('10000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','LOT-2','Paper inserts',2000,'insert'),
('10000000-0000-0000-0000-000000000022','10000000-0000-0000-0000-000000000002','LOT-1','Weekly warehouse clean',52,'visit'),
('10000000-0000-0000-0000-000000000023','10000000-0000-0000-0000-000000000003','LOT-1','Office monitors',12,'unit')
on conflict do nothing;
insert into participants (id,tender_id,supplier_id) values
('10000000-0000-0000-0000-000000000030','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000010'),
('10000000-0000-0000-0000-000000000031','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000011'),
('10000000-0000-0000-0000-000000000032','10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000012')
on conflict do nothing;
insert into criteria (id,tender_id,name,weight) values
('10000000-0000-0000-0000-000000000040','10000000-0000-0000-0000-000000000001','Service reliability',60),
('10000000-0000-0000-0000-000000000041','10000000-0000-0000-0000-000000000001','Material quality',40),
('10000000-0000-0000-0000-000000000042','10000000-0000-0000-0000-000000000002','Service quality',100)
on conflict do nothing;
insert into panel (id,tender_id,name,declaration,evidence) values
('10000000-0000-0000-0000-000000000050','10000000-0000-0000-0000-000000000001','Aroha','clear','demo/declaration-aroha'),
('10000000-0000-0000-0000-000000000051','10000000-0000-0000-0000-000000000001','Hana','pending',null),
('10000000-0000-0000-0000-000000000052','10000000-0000-0000-0000-000000000002','James','clear','demo/declaration-james')
on conflict do nothing;
insert into bids (id,tender_id,supplier_id,lot_id,unit_price,lead_days,evidence,received_on) values
('10000000-0000-0000-0000-000000000060','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000020',1.25,10,'demo/harbour-cartons',current_date-10),
('10000000-0000-0000-0000-000000000061','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000021',0.25,10,'demo/harbour-inserts',current_date-10),
('10000000-0000-0000-0000-000000000062','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000020',1.1,20,'demo/southern-cartons',current_date-9)
on conflict do nothing;
insert into scores (id,tender_id,supplier_id,criterion_id,panel_id,value,rationale) values
('10000000-0000-0000-0000-000000000070','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000040','10000000-0000-0000-0000-000000000050',4,'Delivery evidence supports ten-day lead time'),
('10000000-0000-0000-0000-000000000071','10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000041','10000000-0000-0000-0000-000000000050',5,'Sample meets the agreed material specification')
on conflict do nothing;
insert into clarifications (id,tender_id,reference,supplier_id,question,owner,due_on) values
('10000000-0000-0000-0000-000000000080','10000000-0000-0000-0000-000000000001','Q-001','10000000-0000-0000-0000-000000000011','Confirm insert pricing and freight inclusion','Hana',current_date-3)
on conflict do nothing;
insert into activity (id,tender_id,actor,action,detail,created_at) values
('10000000-0000-0000-0000-000000000090','10000000-0000-0000-0000-000000000001','Demo operator','seed','{"note":"Fictional evaluation records only"}',now()-interval '35 days')
on conflict do nothing;
