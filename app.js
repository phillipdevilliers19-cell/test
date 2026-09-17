
const STORAGE_KEY = "ava_internal_applications_v1";
const INDUSTRIES_KEY = "ava_internal_industries_v1";
const DEFAULT_INDUSTRIES = ["Agriculture","Construction","Forestry","Hydraulics","Industrial","Marine","Mining","Pumps","Renewable Energy","Transport","Water & Wastewater","Valves","Other"];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const num = id => parseFloat($(id)?.value) || 0;
const fmt = (v,d=2) => Number.isFinite(v) ? v.toLocaleString(undefined,{maximumFractionDigits:d}) : "—";
const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));

function getApps(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{return[]} }
function saveApps(a){localStorage.setItem(STORAGE_KEY,JSON.stringify(a)); updateStats(); renderLibrary();}
function getIndustries(){try{return JSON.parse(localStorage.getItem(INDUSTRIES_KEY)||"null")||DEFAULT_INDUSTRIES}catch{return DEFAULT_INDUSTRIES}}
function saveIndustries(a){localStorage.setItem(INDUSTRIES_KEY,JSON.stringify([...new Set(a)].sort()));}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function showPage(id){
  $$(".page").forEach(p=>p.classList.toggle("active",p.id===id));
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===id || (id==="calculator-view"&&b.dataset.page==="calculators") || (id==="freezer"&&b.dataset.page==="calculators") || (id==="app-detail"&&b.dataset.page==="library")));
  window.scrollTo({top:0,behavior:"smooth"});
}
document.addEventListener("click",e=>{
  const p=e.target.closest("[data-page]"); if(p){showPage(p.dataset.page); return}
  const c=e.target.closest("[data-calc]"); if(c){openCalc(c.dataset.calc); return}
  const item=e.target.closest("[data-app-id]"); if(item){openDetail(item.dataset.appId)}
});
$("#backupBtn").onclick=()=>showPage("backup");

function updateStats(){
  const apps=getApps(); $("#appCount").textContent=apps.length;
  $("#industryCount").textContent=new Set(apps.map(a=>a.industry)).size;
  $("#photoCount").textContent=apps.filter(a=>a.photo).length;
}
function fillIndustrySelects(){
  const inds=getIndustries();
  $("#industryFilter").innerHTML='<option value="">All industries</option>'+inds.map(i=>`<option>${esc(i)}</option>`).join("");
  $("#appIndustry").innerHTML=inds.map(i=>`<option>${esc(i)}</option>`).join("");
}
function renderLibrary(){
  const q=($("#librarySearch")?.value||"").toLowerCase(), f=$("#industryFilter")?.value||"";
  const apps=getApps().filter(a=>(!f||a.industry===f)&&(!q||JSON.stringify(a).toLowerCase().includes(q)));
  const box=$("#libraryList"); if(!box)return;
  if(!apps.length){box.innerHTML='<div class="empty">No applications yet. Add the first one from the field.</div>';return}
  box.innerHTML='<div class="app-list">'+apps.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(a=>`
    <div class="app-item" data-app-id="${esc(a.id)}">
      <div class="app-thumb">${a.photo?`<img src="${a.photo}" alt="">`:"▣"}</div>
      <div><h3>${esc(a.name)}</h3><p>${esc(a.description).slice(0,150)}</p><span class="tag">${esc(a.industry)}</span></div><b>→</b>
    </div>`).join("")+'</div>';
}
$("#librarySearch").oninput=renderLibrary; $("#industryFilter").onchange=renderLibrary;

let pendingPhoto="";
$("#appPhoto").onchange=e=>{
  const file=e.target.files?.[0]; if(!file)return;
  const r=new FileReader(); r.onload=()=>{pendingPhoto=r.result;$("#photoPreview").classList.remove("hidden");$("#photoPreview").innerHTML=`<img src="${pendingPhoto}" alt="Application photo">`};r.readAsDataURL(file);
};
$("#appForm").onsubmit=e=>{
  e.preventDefault();
  const newInd=$("#newIndustry").value.trim(), ind=newInd||$("#appIndustry").value;
  if(newInd){saveIndustries([...getIndustries(),newInd]);fillIndustrySelects();$("#appIndustry").value=newInd}
  const app={id:crypto.randomUUID(),date:new Date().toISOString(),name:$("#appName").value.trim(),industry:ind,product:$("#appProduct").value.trim(),description:$("#appDescription").value.trim(),original:$("#qOriginal").value.trim(),why:$("#qWhy").value.trim(),environment:$("#qEnvironment").value.trim(),load:$("#qLoad").value.trim(),temperature:$("#qTemp").value.trim(),lubrication:$("#qLubrication").value.trim(),machine:$("#qMachine").value.trim(),outcome:$("#qOutcome").value.trim(),author:$("#appAuthor").value.trim(),photo:pendingPhoto};
  const apps=getApps();apps.push(app);saveApps(apps);e.target.reset();pendingPhoto="";$("#photoPreview").classList.add("hidden");showPage("library");
};
function openDetail(id){
  const a=getApps().find(x=>x.id===id);if(!a)return;
  $("#appDetail").innerHTML=`
  <div class="detail-hero"><div class="detail-photo">${a.photo?`<img src="${a.photo}" alt="">`:'<div class="empty">No photo recorded</div>'}</div>
  <div class="detail-copy"><span class="tag">${esc(a.industry)}</span><h1>${esc(a.name)}</h1><p>${esc(a.description)}</p><p><strong>Product:</strong> ${esc(a.product||"Not recorded")}</p><p><strong>Recorded:</strong> ${new Date(a.date).toLocaleString()}${a.author?" · "+esc(a.author):""}</p><button class="danger" onclick="deleteApp('${a.id}')">Delete record</button></div></div>
  <div class="detail-grid">
   ${detailBox("Original material",a.original)}${detailBox("Why Vesconite?",a.why)}${detailBox("Environment",a.environment)}${detailBox("Load / movement / speed",a.load)}${detailBox("Temperature",a.temperature)}${detailBox("Lubrication",a.lubrication)}${detailBox("Machine / OEM",a.machine)}${detailBox("Outcome / evidence",a.outcome)}
  </div>`;
  showPage("app-detail");
}
function detailBox(t,v){return `<div class="detail-box"><strong>${t}</strong><p>${esc(v||"Not recorded")}</p></div>`}
window.deleteApp=id=>{if(confirm("Delete this application record?")){saveApps(getApps().filter(a=>a.id!==id));showPage("library")}};
fillIndustrySelects();updateStats();renderLibrary();

function openCalc(type){
  showPage("calculator-view");
  const templates={
    general:{title:"General Bearing Calculator",sub:"Preliminary bearing sizing, load, speed, PV and fit calculations.",form:generalForm},
    pump:{title:"Pump Bearing Calculator",sub:"General bearing design with pump wear-ring option.",form:generalForm},
    marine:{title:"Marine Bearing Calculator",sub:"Stern tube / rudder dimensional design inputs.",form:marineForm},
    motion:{title:"Motion & PV Calculator",sub:"Calculate bearing pressure, sliding speed and PV.",form:motionForm}
  };
  if(type==="freezer"){showPage("freezer");renderFreezer();return}
  const t=templates[type]||templates.general;
  $("#calcContent").innerHTML=`<div class="page-title"><p class="eyebrow">AVA CALCULATOR</p><h1>${t.title}</h1><p>${t.sub}</p></div>${t.form(type)}`;
  bindCalc(type);
}
function generalForm(type){return `<form class="form-card calc-form" id="bearingForm">
  <div class="two-col"><label>Housing diameter (mm)<input id="gHousing" type="number" step="0.01" required></label><label>Shaft diameter (mm)<input id="gShaft" type="number" step="0.01" required></label></div>
  <div class="two-col"><label>Bearing length (mm)<input id="gLength" type="number" step="0.01" required></label><label>Press fit?<select id="gPress"><option value="yes">Yes</option><option value="no">No</option></select></label></div>
  <div class="two-col"><label>Maximum operating temperature (°C)<input id="gTmax" type="number" value="40"></label><label>Minimum operating temperature (°C)<input id="gTmin" type="number" value="5"></label></div>
  <div class="two-col"><label>Total mass supported (kg)<input id="gMass" type="number" step="0.1" value="0"></label><label>Number of bearings<input id="gN" type="number" step="1" value="1" min="1"></label></div>
  <div class="question-block"><div class="eyebrow">MOVEMENT — ENTER ONLY WHAT APPLIES</div>
  <div class="three-col"><label>Rotation RPM<input id="gRpm" type="number" step="0.1" value="0"></label><label>Oscillation degrees<input id="gDeg" type="number" step="0.1" value="0"></label><label>Oscillation cycles/min<input id="gOscF" type="number" step="0.1" value="0"></label></div>
  <div class="two-col"><label>Linear travel per stroke (mm)<input id="gTravel" type="number" step="0.1" value="0"></label><label>Linear cycles/min<input id="gLinF" type="number" step="0.1" value="0"></label></div></div>
  ${type==="pump"?'<label>Wear ring?<select id="gWear"><option>No</option><option>Yes</option></select></label>':""}
  <button class="primary wide" type="submit">Calculate design</button></form><div id="bearingResults"></div>`}
function marineForm(){return `<form class="form-card calc-form" id="bearingForm">
  <div class="two-col"><label>Maximum housing diameter (mm)<input id="gHousing" type="number" step="0.01" required></label><label>Minimum housing diameter (mm)<input id="gHousingMin" type="number" step="0.01" required></label></div>
  <div class="two-col"><label>Shaft diameter (mm)<input id="gShaft" type="number" step="0.01" required></label><label>Bearing length (mm)<input id="gLength" type="number" step="0.01" required></label></div>
  <div class="two-col"><label>Press fit?<select id="gPress"><option value="yes">Yes</option><option value="no">No</option></select></label><label>Maximum operating temperature (°C)<input id="gTmax" type="number" value="40"></label></div>
  <label>Minimum operating temperature (°C)<input id="gTmin" type="number" value="5"></label>
  <button class="primary wide" type="submit">Calculate design</button></form><div id="bearingResults"></div>`}
function motionForm(){return `<form class="form-card calc-form" id="motionForm">
 <div class="two-col"><label>Mass supported per bearing (kg)<input id="mMass" type="number" step="0.1"></label><label>Shaft / bearing diameter (mm)<input id="mDia" type="number" step="0.01"></label></div>
 <label>Bearing length (mm)<input id="mLength" type="number" step="0.01"></label>
 <div class="three-col"><label>RPM<input id="mRpm" type="number" value="0"></label><label>Oscillation degrees<input id="mDeg" type="number" value="0"></label><label>Oscillation cycles/min<input id="mOscF" type="number" value="0"></label></div>
 <div class="two-col"><label>Linear travel per stroke (mm)<input id="mTravel" type="number" value="0"></label><label>Linear cycles/min<input id="mLinF" type="number" value="0"></label></div>
 <button class="primary wide" type="submit">Calculate</button></form><div id="motionResults"></div>`}

function bearingMath({housing,shaft,length,tmax,tmin,mass,n,rpm,deg,oscf,travel,linf,press=true}){
  const wall=Math.max(0,(housing-shaft)/2);
  const p=mass&&length&&shaft?n?mass/n*9.8/(shaft*length):0:0;
  let v=0, mode="None";
  if(rpm>0){v=Math.PI*shaft*rpm/1000;mode="Rotation"}
  else if(deg>0&&oscf>0){v=deg*2*Math.PI*shaft*oscf/(360*1000);mode="Oscillation"}
  else if(travel>0&&linf>0){v=travel*2*linf/1000;mode="Linear"}
  const pv=p*v;
  const interference=press?0.05+0.002*housing:0;
  const boreClosure=press?interference*(housing/shaft):0;
  const assemblyClearance=0.05+0.02*wall;
  const additionalClearance=tmax>50?((housing*housing-shaft*shaft)/shaft)*(tmax-50)*6e-5:0;
  const lowTempFit=tmin<0?(0-tmin)*5.4e-5*housing:0;
  const totalFit=interference+lowTempFit;
  const od=housing+totalFit;
  const id=shaft+boreClosure+assemblyClearance+additionalClearance;
  const expansion=tmax>70?0.5+(housing*Math.PI*(tmax-20)*6e-5):0;
  const dryIceOD=od*(1-6e-5*(-78)); // indicative contraction relative to 20C, not an exact replica
  return {wall,p,v,pv,mode,interference,boreClosure,assemblyClearance,additionalClearance,lowTempFit,totalFit,od,id,expansion,dryIceOD};
}
function bindCalc(type){
  if(type==="motion"){$("#motionForm").onsubmit=e=>{e.preventDefault();const m=bearingMath({shaft:num("#mDia"),length:num("#mLength"),mass:num("#mMass"),n:1,rpm:num("#mRpm"),deg:num("#mDeg"),oscf:num("#mOscF"),travel:num("#mTravel"),linf:num("#mLinF"),housing:num("#mDia"),tmax:20,tmin:20,press:false});$("#motionResults").innerHTML=motionHTML(m)};return}
  $("#bearingForm").onsubmit=e=>{e.preventDefault();const x=bearingMath({housing:num("#gHousing"),shaft:num("#gShaft"),length:num("#gLength"),tmax:num("#gTmax"),tmin:num("#gTmin"),mass:num("#gMass"),n:num("#gN")||1,rpm:num("#gRpm"),deg:num("#gDeg"),oscf:num("#gOscF"),travel:num("#gTravel"),linf:num("#gLinF"),press:$("#gPress")?.value==="yes"});$("#bearingResults").innerHTML=bearingHTML(x,type)}
}
function card(label,value,cls=""){return `<div class="result ${cls}"><small>${label}</small><strong>${value}</strong></div>`}
function bearingHTML(x,type){let loadClass=x.p>30?"bad":x.p>20?"warn":"good";let pvClass=x.pv>40?"warn":"good";return `<div class="subhead">Design results</div><div class="result-grid">
 ${card("Outside diameter",fmt(x.od)+" mm")}${card("Free-standing inside diameter",fmt(x.id)+" mm")}${card("Wall thickness",fmt(x.wall)+" mm")}${card("Bearing pressure",fmt(x.p)+" MPa",loadClass)}${card("Surface speed",fmt(x.v)+" m/min")}${card("PV",fmt(x.pv)+" MPa·m/min",pvClass)}${card("Interference fit",fmt(x.totalFit)+" mm")}${card("Bore closure",fmt(x.boreClosure)+" mm")}${card("Assembly clearance",fmt(x.assemblyClearance)+" mm")}${card("Additional clearance",fmt(x.additionalClearance)+" mm")}${card("Expansion gap",x.expansion?fmt(x.expansion)+" mm":"Not triggered")}${card("Dry-ice OD* ",fmt(x.dryIceOD)+" mm")}
 </div><div class="form-card"><div class="success"><strong>Movement:</strong> ${x.mode}</div><p class="math">Press fit = 0.05 + (0.002 × housing diameter)
<br>Bore closure = press fit × (housing ÷ shaft)
<br>Assembly clearance = 0.05 + (0.02 × wall thickness)</p><div class="warning">* Dry-ice OD is an indicative thermal contraction estimate. Exact Vesconite calculator output for dry-ice cooling should be validated against the official calculator before using it as a production instruction.</div>${x.p>30?'<div class="warning">Bearing pressure exceeds the published 30 MPa Vesconite design load. Do not treat this as an approval.</div>':""}${x.expansion?'<div class="warning">Maximum temperature exceeds 70°C. The published design guidance calls for an expansion-gap approach rather than relying on a press fit.</div>':""}</div>`}
function motionHTML(x){return `<div class="result-grid">${card("Pressure",fmt(x.p)+" MPa")}${card("Surface speed",fmt(x.v)+" m/min")}${card("PV",fmt(x.pv)+" MPa·m/min")}</div><div class="form-card"><p class="math">Pressure = mass × 9.8 ÷ (shaft diameter × bearing length)
<br>Rotation V = π × shaft diameter × RPM ÷ 1000
<br>Oscillation V = angle × 2π × diameter × cycles ÷ (360 × 1000)
<br>Linear V = travel × 2 × cycles ÷ 1000
<br>PV = pressure × surface speed</p></div>`}

function renderFreezer(){
 $("#freezerContent").innerHTML=`<div class="page-title"><p class="eyebrow">INSTALLATION TOOL</p><h1>Freezer Fit</h1><p>Estimate the time needed to cool a Vesconite bush enough to clear the housing, plus the approximate warm-up time after removal.</p></div>
 <form class="form-card calc-form" id="freezerForm">
 <div class="two-col"><label>Bush OD (mm)<input id="fOD" type="number" step="0.01" required></label><label>Housing size (mm)<input id="fHousing" type="number" step="0.01" required></label></div>
 <div class="two-col"><label>Press fit (mm)<input id="fPress" type="number" step="0.001" required></label><label>Bush ID (mm)<input id="fID" type="number" step="0.01" required></label></div>
 <div class="two-col"><label>Bush length (mm)<input id="fLength" type="number" step="0.01" required></label><label>Freezer temperature (°C)<input id="fFreezer" type="number" value="-20" required></label></div>
 <div class="two-col"><label>Starting / ambient temperature (°C)<input id="fAmbient" type="number" value="20" required></label><label>Target safety clearance (mm)<input id="fClearance" type="number" step="0.01" value="0.20"></label></div>
 <button class="primary wide" type="submit">Estimate cooling & warm-up time</button></form><div id="freezerResults"></div>`;
 $("#freezerForm").onsubmit=e=>{e.preventDefault();calculateFreezer()};
}
function calculateFreezer(){
 const OD=num("#fOD"), H=num("#fHousing"), PF=num("#fPress"), ID=num("#fID"), L=num("#fLength"), Tf=num("#fFreezer"), Ta=num("#fAmbient"), safety=num("#fClearance");
 const alpha=6e-5, rho=1380, cp=1500, hCool=8, hWarm=10, k=0.35;
 const requiredDelta=Math.max(0,(OD-H+safety)/(alpha*OD));
 const target=Ta-requiredDelta;
 const volume=Math.PI/4*(OD*OD-ID*ID)*L/1e9;
 const area=Math.PI*(OD+ID)*L/1e6 + 2*Math.PI*((OD/2)**2-(ID/2)**2)/1e6;
 const characteristic=volume/(area||1);
 const Bi=hCool*characteristic/k;
 const tau=(rho*volume*cp)/(hCool*area);
 const effectiveTau=tau*(1+Math.max(0,Bi-0.1)*0.35);
 let coolMin=0;
 if(Tf<target && Ta>target) coolMin=Math.max(0,effectiveTau/60*Math.log((Ta-Tf)/(target-Tf)));
 const coolSafe=coolMin*1.25;
 const warmTarget=Ta-1;
 const warmStart=Math.min(target,Tf);
 let warmMin=0;
 if(Ta>warmStart && warmTarget>warmStart) warmMin=effectiveTau/60*Math.log((Ta-warmStart)/(Ta-warmTarget));
 const fitOD=H-safety;
 $("#freezerResults").innerHTML=`<div class="subhead">Estimate</div><div class="result-grid">
 ${card("Required temperature",fmt(target,1)+" °C",target>Tf?"good":"warn")}
 ${card("Estimated cooling",formatTime(coolSafe),"good")}
 ${card("Estimated warm-up",formatTime(warmMin),"good")}
 ${card("Clearance at target",fmt(safety,2)+" mm")}
 ${card("Estimated Biot number",fmt(Bi,2))}
 ${card("Model basis","Lumped thermal estimate")}
 </div>
 <div class="form-card"><div class="${target>Tf?'success':'warning'}">${target>Tf?`The freezer is colder than the estimated target. Allow approximately <strong>${formatTime(coolSafe)}</strong>, then verify the bush can slide into the housing before removing it from the freezer.`:`The selected freezer temperature is not cold enough to achieve the requested clearance under this model. Use a colder freezer or reduce the required clearance.`}</div>
 <p class="math">Thermal estimate uses t ≈ (ρVcₚ / hA) ln[(T₀−Tfreezer)/(Ttarget−Tfreezer)]
<br>Target temperature is based on thermal contraction α = 6×10⁻⁵ /°C.
<br>Warm-up is estimated to within 1°C of ambient.</p>
 <div class="warning"><strong>Important:</strong> This is an engineering estimate, not a validated installation time. Actual cooling depends on freezer airflow, contact with shelves, bush geometry, material batch, packaging and whether the bush has reached a uniform core temperature. Verify the fit physically before installation.</div></div>`;
}
function formatTime(min){if(!Number.isFinite(min)||min<=0)return"Not achievable";if(min<60)return `${Math.ceil(min)} min`;const h=Math.floor(min/60),m=Math.ceil(min%60);return `${h} h ${m?m+" min":""}`}

$("#exportData").onclick=()=>{
 const blob=new Blob([JSON.stringify({version:1,exported:new Date().toISOString(),industries:getIndustries(),applications:getApps()},null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="ava-internal-backup.json";a.click();URL.revokeObjectURL(a.href);
};
$("#importData").onchange=e=>{
 const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.applications))throw Error();saveApps(d.applications);if(Array.isArray(d.industries))saveIndustries(d.industries);fillIndustrySelects();alert("Library restored.");}catch{alert("That file is not a valid AVA backup.")}};r.readAsText(file)
};
$("#clearData").onclick=()=>{if(confirm("Delete ALL locally stored application records? This cannot be undone unless you have a backup.")){localStorage.removeItem(STORAGE_KEY);updateStats();renderLibrary()}};

showPage("home");
