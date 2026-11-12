const test=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
// This test writes fixtures: opt in only against a disposable database.
test('PostgreSQL runtime: persistence across processes, races, audit rollback and photo', {skip:process.env.RUN_PERSISTENCE_TESTS!=='1'},async()=>{
 const {pool}=require('../src/backend/config/db');
 const service=require('../src/backend/services/pgTicketService');
 const customers=require('../src/backend/repositories/pgCustomerRepository');
 const photos=require('../src/backend/repositories/pgHandoverPhotoStore');
 const repo=require('../src/backend/repositories/pgTicketRepository');
 const db=(await pool.query('SELECT current_database() AS name')).rows[0].name;
 assert.match(db,/test/i,'Persistence integration tests require an explicitly named test database');
 const suffix=Date.now().toString();
 const customer=await customers.addCustomer({full_name:'Đặng Kiểm Thử '+suffix,phone:'09'+suffix.slice(-8)});
 const payload={customer_id:customer.customer_id,customer_name:customer.full_name,customer_phone:customer.phone,serial_no:'REPRO'+suffix,
  product_name:'Test device',center_id:1,category_id:1,issue_description:'Thiết bị kiểm thử lưu bền vững',warranty_verified:false,is_warranty:false,created_by:'persistence-test'};
 try{
  const ticket=await service.createTicket(payload);
  assert.equal((await service.getTickets({q:customer.phone})).total,1);
  assert.equal((await service.getTickets({q:'dang kiem thu '+suffix})).total,1);
  const script=`const s=require('./src/backend/services/pgTicketService');const c=require('./src/backend/repositories/pgCustomerRepository');const {pool}=require('./src/backend/config/db');(async()=>{const t=await s.getTicketById(${JSON.stringify(ticket.id)});const customer=await c.findCustomerByPhone(${JSON.stringify(customer.phone)});if(!t||!customer||t.status_history.length!==1)process.exitCode=1;})().catch(()=>process.exitCode=1).finally(()=>pool.end());`;
  const child=spawnSync(process.execPath,['-e',script],{cwd:require('node:path').resolve(__dirname,'..'),env:process.env,encoding:'utf8'});
  assert.equal(child.status,0,'Independent process must find the committed ticket, customer and audit');
  await assert.rejects(service.recordServiceConsent(ticket.id,'x'.repeat(101),'Test rollback'));
  assert.equal((await service.getTicketById(ticket.id)).service_consent,false,'Audit failure must roll back consent');
  const race=await Promise.allSettled([service.createTicket({...payload,serial_no:payload.serial_no+'R'}),service.createTicket({...payload,serial_no:payload.serial_no+'R'})]);
  assert.equal(race.filter(x=>x.status==='fulfilled').length,1);
  assert.equal(race.find(x=>x.status==='rejected').reason.code,'PHIEU_DANG_MO');
  await service.recordServiceConsent(ticket.id,'test','Đồng ý');
  for(const status of ['DA_PHAN_CONG','DANG_XU_LY','HOAN_TAT'])await service.updateStatus(ticket.id,{status,updated_by:'test'});
  const latest=await service.getTicketById(ticket.id);
  await repo.transaction(()=>photos.set(latest,{bytes:Buffer.from([255,216,255]),type:'image/jpeg'}));
  assert.equal(await photos.has(await service.getTicketById(ticket.id)),true);
  await service.updateStatus(ticket.id,{status:'DA_BAN_GIAO',updated_by:'test'});
  assert.equal((await service.getTicketById(ticket.id)).status,'DA_BAN_GIAO');
 }finally{
  await pool.query('DELETE FROM ticket WHERE customer_id=$1',[customer.customer_id]);
  await pool.query('DELETE FROM device WHERE customer_id=$1',[customer.customer_id]);
  await pool.query('DELETE FROM customer WHERE customer_id=$1',[customer.customer_id]);
  await pool.end();
 }
});
