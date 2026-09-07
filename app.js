import { supabase } from './supabase.js';
const $=s=>document.querySelector(s);
const state={drivers:[],areas:[],cars:[],services:[],selectedService:'taxi',favorites:new Set(JSON.parse(localStorage.getItem('sharqatna_favorites')||'[]'))};
const toast=m=>{const e=$('#toast');e.textContent=m;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),3200)};
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const saveFavorites=()=>localStorage.setItem('sharqatna_favorites',JSON.stringify([...state.favorites]));
const normalizePhone=v=>String(v||'').replace(/[^0-9+]/g,'');
const makeCode=()=>`SHQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
async function load(){
 const [d,a,c,s]=await Promise.all([
  supabase.from('drivers').select('id,name,phone,whatsapp,car_model,plate_number,out_trips,status,verified,rating,rating_count,notes,area_id,car_type_id,areas(name),car_types(name)').order('rating',{ascending:false}).limit(500),
  supabase.from('areas').select('id,name').eq('is_active',true).order('name'),
  supabase.from('car_types').select('id,name').eq('is_active',true).order('name'),
  supabase.from('services').select('id,code,name,description,icon').eq('is_active',true).order('sort_order')
 ]);
 if(d.error||a.error||c.error||s.error){console.error(d.error||a.error||c.error||s.error);toast('تعذر الاتصال بقاعدة البيانات.');$('#splash').classList.add('hide');return}
 state.drivers=d.data||[];state.areas=a.data||[];state.cars=c.data||[];state.services=s.data||[];fillSelects();renderServices();render();
 $('#driverCount').textContent=state.drivers.length;$('#areaCount').textContent=state.areas.length;$('#carCount').textContent=state.cars.length;$('#splash').classList.add('hide');
}
function fillSelects(){
 const areaOpts=state.areas.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');const carOpts=state.cars.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
 $('#areaFilter').insertAdjacentHTML('beforeend',areaOpts);$('#carFilter').insertAdjacentHTML('beforeend',carOpts);$('#requestArea').insertAdjacentHTML('beforeend',areaOpts);$('#requestCar').insertAdjacentHTML('beforeend',carOpts);
}
function renderServices(){const wrap=$('#services');if(!wrap)return;wrap.innerHTML=state.services.map(s=>`<button type="button" class="service ${s.code===state.selectedService?'active':''}" data-service="${esc(s.code)}"><span>${esc(s.icon||'🚕')}</span><span>${esc(s.name)}</span></button>`).join('');wrap.querySelectorAll('[data-service]').forEach(b=>b.onclick=()=>{state.selectedService=b.dataset.service;renderServices();});}
function render(){
 const q=$('#search').value.trim().toLowerCase(),area=$('#areaFilter').value,car=$('#carFilter').value,status=$('#statusFilter').value,out=$('#outTrips').checked,fav=$('#favoritesOnly').checked;
 const rows=state.drivers.filter(d=>(!q||[d.name,d.phone,d.car_model,d.areas?.name,d.car_types?.name].some(v=>String(v||'').toLowerCase().includes(q)))&&(!area||d.area_id===area)&&(!car||d.car_type_id===car)&&(!status||d.status===status)&&(!out||d.out_trips)&&(!fav||state.favorites.has(d.id)));
 $('#resultCount').textContent=rows.length;$('#drivers').innerHTML=rows.length?rows.map(card).join(''):'<div class="empty">لا توجد نتائج مطابقة.</div>';
 document.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>rate(b.dataset.rate));document.querySelectorAll('[data-favorite]').forEach(b=>b.onclick=()=>toggleFavorite(b.dataset.favorite));
}
function card(d){
 const stateText={active:'متاح',busy:'مشغول',inactive:'غير متاح',suspended:'موقوف'}[d.status]||d.status,phone=normalizePhone(d.phone),wa=String(d.whatsapp||d.phone||'').replace(/\D/g,''),favorite=state.favorites.has(d.id);
 return `<article class="driver"><div class="driver-head"><h3>${esc(d.name)} ${d.verified?'<span class="badge">موثق</span>':''}</h3><span class="badge ${d.status==='busy'?'busy':''}">${esc(stateText)}</span></div><div class="meta"><span>📍 ${esc(d.areas?.name||'غير محدد')}</span><span>🚗 ${esc(d.car_types?.name||'غير محدد')} ${d.car_model?esc(d.car_model):''}</span><span>⭐ ${Number(d.rating||0).toFixed(1)} (${d.rating_count||0})</span>${d.out_trips?'<span>🛣️ سفر خارج الشرقاط</span>':''}</div><div class="actions"><a class="call" href="tel:${encodeURIComponent(phone)}">اتصال</a>${wa?`<a class="wa" href="https://wa.me/${encodeURIComponent(wa)}" target="_blank" rel="noopener noreferrer">واتساب</a>`:''}<button class="rate" data-rate="${esc(d.id)}">تقييم</button><button class="favorite" data-favorite="${esc(d.id)}">${favorite?'★ محفوظ':'☆ حفظ'}</button></div></article>`;
}
function toggleFavorite(id){if(state.favorites.has(id))state.favorites.delete(id);else state.favorites.add(id);saveFavorites();render();toast(state.favorites.has(id)?'تمت إضافة السائق للمفضلة.':'تمت إزالة السائق من المفضلة.');}
async function rate(id){
 const device=localStorage.getItem('sharqatna_device')||crypto.randomUUID();localStorage.setItem('sharqatna_device',device);const score=Number(prompt('اختر تقييمك من 1 إلى 5'));if(!Number.isInteger(score)||score<1||score>5)return;
 const {error}=await supabase.from('ratings').insert({driver_id:id,device_id:device,score});if(error?.code==='23505')return toast('سبق أن قيّمت هذا السائق من هذا الجهاز.');if(error)return toast('تعذر حفظ التقييم.');toast('تم حفظ تقييمك، شكراً لك.');await load();
}
async function submitTrip(e){
 e.preventDefault();const f=new FormData(e.currentTarget),name=String(f.get('customer_name')||'').trim(),phone=normalizePhone(f.get('customer_phone')),pickup=String(f.get('pickup_text')||'').trim(),destination=String(f.get('destination_text')||'').trim();
 if(phone.replace(/\D/g,'').length<7)return toast('يرجى إدخال رقم هاتف صحيح.');if(!pickup)return toast('اكتب موقع الانطلاق.');
 const service=state.services.find(s=>s.code===state.selectedService);if(!service)return toast('اختر نوع الخدمة.');
 const publicCode=makeCode(),scheduled=f.get('scheduled_at')?new Date(f.get('scheduled_at')).toISOString():null;
 const payload={public_code:publicCode,service_id:service.id,customer_name:name,customer_phone:phone,pickup_text:pickup,destination_text:destination||null,scheduled_at:scheduled,notes:String(f.get('notes')||'').trim()||null,status:'pending'};
 const {error}=await supabase.from('trip_requests').insert(payload);if(error){console.error(error);toast('تعذر إرسال طلب الرحلة. حاول مرة أخرى.');return}
 localStorage.setItem('sharqatna_last_trip',JSON.stringify({public_code:publicCode,service:service.name,pickup,destination,status:'pending'}));
 e.currentTarget.reset();showTripResult({publicCode,service:service.name,pickup,destination});toast('تم إرسال طلبك بنجاح.');
}
function showTripResult(x){const box=$('#tripResult');box.hidden=false;box.innerHTML=`<div class="success-icon">✓</div><div><strong>تم إنشاء طلبك</strong><p>رقم الطلب <b>${esc(x.publicCode)}</b></p><small>الخدمة: ${esc(x.service)} · الحالة: بانتظار تعيين سائق</small></div><button type="button" class="rate" id="newTrip">طلب رحلة جديدة</button>`;$('#newTrip').onclick=()=>{box.hidden=true;$('#tripForm').scrollIntoView({behavior:'smooth',block:'center'});};}
$('#search').oninput=render;$('#areaFilter').onchange=render;$('#carFilter').onchange=render;$('#statusFilter').onchange=render;$('#outTrips').onchange=render;$('#favoritesOnly').onchange=render;$('#tripForm').onsubmit=submitTrip;
$('#requestForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),phone=normalizePhone(f.get('phone'));if(phone.replace(/\D/g,'').length<7)return toast('يرجى إدخال رقم هاتف صحيح.');const wa=normalizePhone(f.get('whatsapp'));const payload={name:f.get('name')?.trim(),phone,whatsapp:wa||null,area_id:f.get('area_id'),car_type_id:f.get('car_type_id'),car_model:f.get('car_model')?.trim()||null,plate_number:f.get('plate_number')?.trim()||null,out_trips:f.get('out_trips')==='on',notes:f.get('notes')?.trim()||null};const {error}=await supabase.from('driver_requests').insert(payload);if(error){console.error(error);toast('تعذر إرسال الطلب. حاول مرة أخرى.');return}e.currentTarget.reset();toast('تم إرسال الطلب للمراجعة بنجاح.');};
load().then(()=>{const last=JSON.parse(localStorage.getItem('sharqatna_last_trip')||'null');if(last)showTripResult({publicCode:last.public_code,service:last.service,pickup:last.pickup,destination:last.destination});}).catch(err=>{console.error(err);$('#splash').classList.add('hide');toast('حدث خطأ غير متوقع.');});
