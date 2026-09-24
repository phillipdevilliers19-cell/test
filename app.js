
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

function photosOf(a){
  if(Array.isArray(a.photos)) return a.photos.filter(p=>p && p.src);
  return a.photo ? [{src:a.photo,caption:""}] : [];
}
function updateStats(){
  const apps=getApps(); $("#appCount").textContent=apps.length;
  $("#industryCount").textContent=new Set(apps.map(a=>a.industry)).size;
  $("#photoCount").textContent=apps.reduce((n,a)=>n+photosOf(a).length,0);
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
      <div class="app-thumb">${photosOf(a)[0]?`<img src="${photosOf(a)[0].src}" alt="">`:"▣"}</div>
      <div><h3>${esc(a.name)}</h3><p>${esc(a.description).slice(0,150)}</p><span class="tag">${esc(a.industry)}</span></div><b>→</b>
    </div>`).join("")+'</div>';
}
$("#librarySearch").oninput=renderLibrary; $("#industryFilter").onchange=renderLibrary;

let pendingPhotos=[];
function compressImage(file,maxSide=1800,quality=.82){
  return new Promise((resolve,reject)=>{
    const r=new FileReader(); r.onerror=reject; r.onload=()=>{
      const img=new Image(); img.onerror=reject; img.onload=()=>{
        const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
        const c=document.createElement("canvas"); c.width=Math.round(img.naturalWidth*scale); c.height=Math.round(img.naturalHeight*scale);
        c.getContext("2d").drawImage(img,0,0,c.width,c.height); resolve(c.toDataURL("image/jpeg",quality));
      }; img.src=r.result;
    }; r.readAsDataURL(file);
  });
}
function renderPendingPhotos(){
  const box=$("#photoPreview");
  if(!pendingPhotos.length){box.classList.add("hidden");box.innerHTML="";return}
  box.classList.remove("hidden");
  box.innerHTML=pendingPhotos.map((p,i)=>`<div class="photo-edit-card"><img src="${p.src}" alt=""><div class="photo-edit-controls"><input data-photo-caption="${i}" value="${esc(p.caption)}" placeholder="Caption — e.g. Installed bearing after 18 months"><button type="button" class="danger small-btn" data-photo-remove="${i}">Remove</button></div></div>`).join("");
  $$("[data-photo-caption]").forEach(x=>x.oninput=()=>{pendingPhotos[+x.dataset.photoCaption].caption=x.value});
  $$("[data-photo-remove]").forEach(x=>x.onclick=()=>{pendingPhotos.splice(+x.dataset.photoRemove,1);renderPendingPhotos()});
}
$("#appPhoto").onchange=async e=>{
  const files=[...e.target.files||[]];
  for(const file of files.slice(0,Math.max(0,10-pendingPhotos.length))){
    try{pendingPhotos.push({src:await compressImage(file),caption:""})}catch(err){alert(`Could not process ${file.name}.`)}
  }
  e.target.value=""; renderPendingPhotos();
};
$("#appForm").onsubmit=e=>{
  e.preventDefault();
  const newInd=$("#newIndustry").value.trim(), ind=newInd||$("#appIndustry").value;
  if(newInd){saveIndustries([...getIndustries(),newInd]);fillIndustrySelects();$("#appIndustry").value=newInd}
  const app={id:crypto.randomUUID(),date:new Date().toISOString(),name:$("#appName").value.trim(),industry:ind,product:$("#appProduct").value.trim(),description:$("#appDescription").value.trim(),original:$("#qOriginal").value.trim(),why:$("#qWhy").value.trim(),environment:$("#qEnvironment").value.trim(),load:$("#qLoad").value.trim(),temperature:$("#qTemp").value.trim(),lubrication:$("#qLubrication").value.trim(),machine:$("#qMachine").value.trim(),outcome:$("#qOutcome").value.trim(),author:$("#appAuthor").value.trim(),photos:pendingPhotos,photo:pendingPhotos[0]?.src||""};
  const apps=getApps();apps.push(app);saveApps(apps);e.target.reset();pendingPhotos=[];renderPendingPhotos();showPage("library");
};
function openDetail(id){
  const a=getApps().find(x=>x.id===id);if(!a)return;
  const photos=photosOf(a);
  const gallery=photos.length?`<div class="application-gallery">${photos.map((p,i)=>`<figure><img src="${p.src}" alt="${esc(p.caption||a.name)}"><figcaption><span>PHOTO ${i+1}</span>${esc(p.caption||"No caption recorded")}</figcaption></figure>`).join("")}</div>`:'<div class="empty">No photos recorded</div>';
  $("#appDetail").innerHTML=`
  <div class="detail-hero"><div class="detail-photo-wrap">${gallery}</div>
  <div class="detail-copy"><span class="tag">${esc(a.industry)}</span><h1>${esc(a.name)}</h1><p>${esc(a.description)}</p><p><strong>Product:</strong> ${esc(a.product||"Not recorded")}</p><p><strong>Recorded:</strong> ${new Date(a.date).toLocaleString()}${a.author?" · "+esc(a.author):""}</p>
  <div class="export-callout"><div><strong>Client-ready portfolio</strong><p>Select this application plus any other relevant applications and export a polished PDF. Your selection is temporary and will not permanently link the records.</p></div><button class="primary" onclick="openLinkModal('${a.id}')">Export PDF</button></div>
  <button class="danger" onclick="deleteApp('${a.id}')">Delete record</button></div></div>
  <div class="detail-grid">
   ${detailBox("Original material",a.original)}${detailBox("Why Vesconite?",a.why)}${detailBox("Environment",a.environment)}${detailBox("Load / movement / speed",a.load)}${detailBox("Temperature",a.temperature)}${detailBox("Lubrication",a.lubrication)}${detailBox("Machine / OEM",a.machine)}${detailBox("Outcome / evidence",a.outcome)}
  </div>`;
  showPage("app-detail");
}

let linkBaseId=null;
let linkSelection=new Set();
let portfolioDraft={baseId:null,ids:[],html:""};

window.openLinkModal=function(id){
  linkBaseId=id;
  linkSelection=new Set([id]);
  $("#linkSearch").value="";
  fillPortfolioIndustryFilter();
  $("#linkIndustryFilter").value="";
  renderLinkList();
  $("#linkModal").classList.remove("hidden");
};
function closeLinkModal(){ $("#linkModal").classList.add("hidden"); linkBaseId=null; linkSelection=new Set(); }
function fillPortfolioIndustryFilter(){
  const industries=[...new Set(getApps().map(a=>a.industry).filter(Boolean))].sort();
  $("#linkIndustryFilter").innerHTML='<option value="">All categories</option>'+industries.map(i=>`<option value="${esc(i)}">${esc(i)}</option>`).join("");
}
function renderLinkList(){
  const q=($("#linkSearch").value||"").toLowerCase();
  const f=$("#linkIndustryFilter").value||"";
  const apps=getApps().filter(a=>(!f||a.industry===f)&&(!q||JSON.stringify(a).toLowerCase().includes(q)));
  $("#linkList").innerHTML=apps.length?apps.map(a=>`
    <label class="link-row"><input type="checkbox" data-link-id="${esc(a.id)}" ${linkSelection.has(a.id)?"checked":""}>
      <span class="link-thumb">${photosOf(a)[0]?`<img src="${photosOf(a)[0].src}" alt="">`:"▣"}</span>
      <span class="link-copy"><strong>${esc(a.name)}</strong><small><span class="category-pill">${esc(a.industry)}</span>${a.product?" · "+esc(a.product):""}</small></span>
    </label>`).join(""):'<div class="empty">No applications found in this category.</div>';
  $("#linkCount").textContent=`${linkSelection.size} selected`;
  $$("#linkList input[data-link-id]").forEach(cb=>cb.onchange=()=>{
    cb.checked?linkSelection.add(cb.dataset.linkId):linkSelection.delete(cb.dataset.linkId);
    $("#linkCount").textContent=`${linkSelection.size} selected`;
  });
}
$("#linkSearch").oninput=renderLinkList;
$("#linkIndustryFilter").onchange=renderLinkList;
$("#closeLinkModal").onclick=closeLinkModal;
$("#cancelPortfolio").onclick=closeLinkModal;
$("#linkModal").addEventListener("click",e=>{if(e.target.id==="linkModal")closeLinkModal()});
$("#saveLinks").onclick=()=>{
  if(!linkBaseId)return;
  const selected=[...linkSelection];
  if(!selected.length){alert("Select at least one application.");return;}
  portfolioDraft={baseId:linkBaseId,ids:selected,html:buildPortfolioBody(linkBaseId,selected)};
  closeLinkModal();
  openPortfolioEditor();
};

function buildPortfolioBody(id, selectedIds=[]){
 const apps=getApps(), primary=apps.find(x=>x.id===id); if(!primary)return "";
 const ids=[id,...selectedIds.filter(x=>x!==id)];
 const portfolio=ids.map(x=>apps.find(y=>y.id===x)).filter(Boolean);
 const count=portfolio.length;
 const sectionHtml=(a,index)=>{
   const sections=[["Product / material",a.product],["Original material",a.original],["Why Vesconite was selected",a.why],["Operating environment",a.environment],["Load / movement / speed",a.load],["Temperature",a.temperature],["Lubrication",a.lubrication],["Machine / OEM",a.machine],["Outcome / evidence",a.outcome]];
   const photos=photosOf(a);
   return `<article class="application"><div class="app-head"><div><div class="app-num">APPLICATION ${index+1} OF ${count}</div><h2 contenteditable="true" data-editable="title">${esc(a.name)}</h2><div class="meta"><span contenteditable="true" data-editable="industry">${esc(a.industry)}</span> · <span contenteditable="true" data-editable="product">${esc(a.product||"Product not recorded")}</span> · Recorded ${new Date(a.date).toLocaleDateString()}${a.author?" · "+esc(a.author):""}</div></div><div class="tag">${esc(a.industry)}</div></div><p class="lead" contenteditable="true" data-editable="description">${esc(a.description||"")}</p>${photos.map((p,i)=>`<figure class="report-photo"><img class="photo" src="${p.src}" alt="Application photo ${i+1}"><figcaption><strong>Photo ${i+1}</strong><span contenteditable="true" data-editable="caption">${esc(p.caption||"Add a caption")}</span></figcaption></figure>`).join("")}<div class="grid">${sections.map(([t,v])=>`<div class="box"><strong>${esc(t)}</strong><p contenteditable="true" data-editable="field">${esc(v||"Not recorded")}</p></div>`).join("")}</div></article>`;
 };
 const coverPhotos=photosOf(primary);
 const coverImage=coverPhotos[0]?`<img class="cover-image" src="${coverPhotos[0].src}" alt="">`:"";
 return `<section class="cover"><div class="eyebrow">AVA INTERNAL · VESCONITE ENGINEERING</div><div class="cover-rule"></div><div class="cover-kicker">APPLICATION ENGINEERING PORTFOLIO</div><h1 contenteditable="true" data-editable="portfolio-title">${esc(primary.name)}</h1><p class="cover-intro" contenteditable="true" data-editable="portfolio-intro">Selected real-world applications from the AVA Internal Application Database.</p>${coverImage}<div class="summary"><div class="box"><strong>Primary application</strong><p contenteditable="true" data-editable="summary">${esc(primary.name)}</p></div><div class="box"><strong>Industry</strong><p>${esc(primary.industry)}</p></div><div class="box"><strong>Applications included</strong><p>${count}</p></div><div class="box"><strong>Prepared</strong><p>${new Date().toLocaleDateString()}</p></div></div><div class="cover-note">This portfolio is prepared from application records held in AVA Internal. It is intended to communicate application experience and should be read together with project-specific engineering verification.</div></section>${portfolio.map(sectionHtml).join("")}`;
}
function openPortfolioEditor(){
  $("#portfolioEditor").innerHTML=portfolioDraft.html;
  $("#portfolioEditorModal").classList.remove("hidden");
  $("#portfolioEditor").scrollTop=0;
}
function closePortfolioEditor(){ $("#portfolioEditorModal").classList.add("hidden"); }
$("#closeEditorModal").onclick=closePortfolioEditor;
$("#backToPortfolio").onclick=()=>{closePortfolioEditor();fillPortfolioIndustryFilter();$("#linkModal").classList.remove("hidden");renderLinkList()};
$("#portfolioEditorModal").addEventListener("click",e=>{if(e.target.id==="portfolioEditorModal")closePortfolioEditor()});
$("#generatePortfolioPdf").onclick=()=>{
  portfolioDraft.html=$("#portfolioEditor").innerHTML;
  exportEditedPortfolio(portfolioDraft.html);
};

function portfolioPrintDocument(body){
 return `<!doctype html><html><head><meta charset="utf-8"><title>AVA Application Portfolio</title><style>
@page{size:A4;margin:16mm 15mm 17mm}*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;color:#18262d;background:#fff;font-size:10pt;line-height:1.45}.report-page,.cover,.application{width:100%;max-width:180mm;margin:0 auto}h1{font-size:38px;line-height:1.03;margin:8px 0 12px;letter-spacing:-.8px}h2{font-size:21px;line-height:1.15;margin:5px 0 8px}p{margin:5px 0;font-size:10pt;line-height:1.5}.eyebrow,.app-num{font-size:8px;color:#087a67;font-weight:800;letter-spacing:1.8px}.cover{min-height:260mm;padding:7mm 0 12mm;display:flex;flex-direction:column;justify-content:center;position:relative}.cover-rule{width:62mm;height:4px;background:#159477;margin:9px 0 24px}.cover-kicker{font-size:9px;letter-spacing:2px;color:#607179;font-weight:800}.cover-intro{font-size:13px;color:#53636b;max-width:150mm;margin:4px 0 18px}.cover-image{display:block;width:100%;max-height:90mm;object-fit:cover;border-radius:12px;margin:8px 0 18px;border:1px solid #d9e1e4}.summary{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:8px}.box{border:1px solid #d7e0e3;border-radius:9px;padding:10px;background:#fff;break-inside:avoid}.summary .box{background:#f3f8f6}.box strong{display:block;font-size:8px;color:#087a67;text-transform:uppercase;letter-spacing:.9px;margin-bottom:4px}.box p{font-size:9.3pt;color:#26373e}.cover-note{margin-top:20px;padding:11px 13px;border-left:4px solid #159477;background:#f4f7f7;color:#5d6b72;font-size:8.5pt}.application{break-before:page;padding-top:2mm}.application:first-of-type{break-before:auto}.app-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border-bottom:2px solid #159477;padding-bottom:10px;margin-bottom:13px}.meta{color:#65747b;font-size:8.5pt}.tag{display:inline-block;padding:5px 9px;border-radius:999px;background:#e5f5f1;color:#116d5d;font-size:8px;font-weight:800;white-space:nowrap}.lead{font-size:11pt;line-height:1.55;margin-bottom:13px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.photo{width:100%;max-height:92mm;object-fit:contain;display:block;border:1px solid #d9e1e4;border-radius:9px;background:#f5f7f7}.report-photo{margin:0 0 13px;break-inside:avoid}.report-photo figcaption{font-size:8.5pt;color:#68777e;margin-top:4px}.report-photo figcaption strong{color:#087a67;margin-right:6px}.report-photo figcaption span{outline:none}.footer{margin-top:24px;padding-top:8px;border-top:1px solid #d9e1e4;color:#7b888d;font-size:7.5pt}@media print{.application{break-before:page}.application:first-of-type{break-before:auto}.box,.report-photo{break-inside:avoid}}
</style></head><body>${body}</body></html>`;
}
function exportEditedPortfolio(body){
 const html=portfolioPrintDocument(body);
 const blob=new Blob([html],{type:"text/html;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 const win=window.open(url,"_blank");
 if(!win){URL.revokeObjectURL(url);alert("Please allow pop-ups for AVA Internal to generate the PDF.");return;}
 const print=()=>setTimeout(()=>{try{win.focus();win.print()}catch{}},500);
 try{win.addEventListener("load",print,{once:true})}catch{}
 setTimeout(print,1800);
 setTimeout(()=>URL.revokeObjectURL(url),120000);
}

function detailBox(t,v){return `<div class="detail-box"><strong>${t}</strong><p>${esc(v||"Not recorded")}</p></div>`}
window.deleteApp=id=>{if(confirm("Delete this application record?")){saveApps(getApps().filter(a=>a.id!==id));showPage("library")}};
fillIndustrySelects();updateStats();renderLibrary();

function openCalc(type){
  return;
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
 ${card("Outside diameter",fmt(x.od)+" mm")}${card("Free-standing inside diameter",fmt(x.id)+" mm")}${card("Wall thickness",fmt(x.wall)+" mm")}${card("Bearing pressure",fmt(x.p)+" MPa",loadClass)}${card("Surface speed",fmt(x.v)+" m/min")}${card("PV",fmt(x.pv)+" MPa·m/min",pvClass)}${card("Interference fit",fmt(x.totalFit)+" mm")}${card("Bore closure",fmt(x.boreClosure)+" mm")}${card("Assembly clearance",fmt(x.assemblyClearance)+" mm")}${card("Additional clearance",fmt(x.additionalClearance)+" mm")}${card("Expansion gap",x.expansion?fmt(x.expansion)+" mm":"Not triggered")}
 </div><div class="model-actions"><button class="primary" onclick='show3DModel(${JSON.stringify({od:x.od,id:x.id,length:num("#gLength")||0,wall:x.wall})})'>◇ View 3D Model</button><button class="secondary" onclick='openISODrawing(${JSON.stringify({od:x.od,id:x.id,length:num("#gLength")||0,wall:x.wall})})'>▧ ISO Drawing</button></div><div id="bearing3D" class="model-panel"></div>
 <div class="form-card"><div class="success"><strong>Movement:</strong> ${x.mode}</div><p class="math">Press fit = 0.05 + (0.002 × housing diameter)<br>Bore closure = press fit × (housing ÷ shaft)<br>Assembly clearance = 0.05 + (0.02 × wall thickness)</p>${x.p>30?'<div class="warning">Bearing pressure exceeds the published 30 MPa Vesconite design load. Do not treat this as an approval.</div>':""}${x.expansion?'<div class="warning">Maximum temperature exceeds 70°C. The published design guidance calls for an expansion-gap approach rather than relying on a press fit.</div>':""}</div>`}

function motionHTML(x){return `<div class="result-grid">${card("Pressure",fmt(x.p)+" MPa")}${card("Surface speed",fmt(x.v)+" m/min")}${card("PV",fmt(x.pv)+" MPa·m/min")}</div><div class="form-card"><p class="math">Pressure = mass × 9.8 ÷ (shaft diameter × bearing length)
<br>Rotation V = π × shaft diameter × RPM ÷ 1000
<br>Oscillation V = angle × 2π × diameter × cycles ÷ (360 × 1000)
<br>Linear V = travel × 2 × cycles ÷ 1000
<br>PV = pressure × surface speed</p></div>`}


let threeModulePromise=null;
async function loadThree(){
 if(!threeModulePromise){threeModulePromise=Promise.all([import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"),import("https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js")]);}
 return await threeModulePromise;
}
window.show3DModel=async function(d){
 const host=$("#bearing3D"); if(!host)return;
 host.innerHTML='<div class="model-loading">Loading interactive 3D model…</div>';
 try{
  const [THREE,ControlsMod]=await loadThree(); const OrbitControls=ControlsMod.OrbitControls;
  host.innerHTML=`<div class="model-toolbar"><div><strong>3D Bearing Model</strong><small>Drag to rotate · scroll/pinch to zoom</small></div><span>${fmt(d.od)} × ${fmt(d.id)} × ${fmt(d.length)} mm</span></div><div id="threeCanvas" class="three-canvas"></div>`;
  const mount=$("#threeCanvas"), scene=new THREE.Scene(); scene.background=new THREE.Color(0x08131b);
  const camera=new THREE.PerspectiveCamera(35,mount.clientWidth/mount.clientHeight,.1,5000);
  const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(mount.clientWidth,mount.clientHeight); mount.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xcfe8ff,0x17232b,2.2)); const light=new THREE.DirectionalLight(0xffffff,2.5);light.position.set(3,4,5);scene.add(light);
  const outer=d.od/2, inner=d.id/2, len=d.length; const shape=new THREE.Shape(); shape.absarc(0,0,outer,0,Math.PI*2,false); const hole=new THREE.Path(); hole.absarc(0,0,inner,0,Math.PI*2,true); shape.holes.push(hole);
  const geom=new THREE.ExtrudeGeometry(shape,{depth:len,bevelEnabled:true,bevelSegments:2,steps:1,curveSegments:64,bevelSize:Math.min(0.5,outer*.01),bevelThickness:Math.min(0.5,outer*.01)}); geom.center(); geom.rotateX(Math.PI/2);
  const mat=new THREE.MeshStandardMaterial({color:0x54e1bd,metalness:.18,roughness:.3}); const mesh=new THREE.Mesh(geom,mat);scene.add(mesh);
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geom,18),new THREE.LineBasicMaterial({color:0x7fa6ad,transparent:true,opacity:.35}));scene.add(edges);
  const maxDim=Math.max(d.od,d.length);camera.position.set(maxDim*1.45,maxDim*1.15,maxDim*1.65);camera.lookAt(0,0,0);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,0,0);controls.minDistance=maxDim*.55;controls.maxDistance=maxDim*5;
  const resize=()=>{const w=mount.clientWidth,h=Math.max(300,mount.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)};new ResizeObserver(resize).observe(mount);resize();
  const animate=()=>{if(!mount.isConnected)return;controls.update();renderer.render(scene,camera);requestAnimationFrame(animate)};animate();
 }catch(err){host.innerHTML=`<div class="warning"><strong>3D model could not load.</strong> Your browser may be blocking the Three.js CDN. The calculator and ISO drawing still work. (${esc(err.message||err)})</div>`}
};
window.openISODrawing=function(d){
 const W=1000,H=700, sx=460, sy=250, cx=260, cy=260, ox=720, oy=260; const od=Math.max(d.od,1), id=Math.max(d.id,0), L=Math.max(d.length,1); const scale=Math.min(360/od,330/L); const ro=od/2*scale, ri=id/2*scale, halfL=L/2*scale;
 const dimY=cy+ro+85, x1=cx-halfL, x2=cx+halfL; const endR=ro;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="white"/><style>text{font-family:Arial,Helvetica,sans-serif;fill:#111}.thick{stroke:#111;stroke-width:3;fill:none}.thin{stroke:#111;stroke-width:1.2;fill:none}.center{stroke:#777;stroke-width:1;stroke-dasharray:8 5}.dim{stroke:#111;stroke-width:1;fill:none;marker-start:url(#a);marker-end:url(#a)}.small{font-size:15px}.label{font-size:18px;font-weight:bold}</style><defs><marker id="a" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M8,0 L0,4 L8,8" fill="#111"/></marker></defs>
 <text x="45" y="48" font-size="28" font-weight="bold">AVA INTERNAL — BEARING DRAWING</text><text x="45" y="76" class="small">ISO-style preliminary manufacturing drawing · UNITS: mm · NOT TO SCALE</text>
 <text x="${cx}" y="${cy-ro-28}" text-anchor="middle" class="label">SIDE VIEW</text><path d="M${x1},${cy-ro} L${x2},${cy-ro} L${x2},${cy+ro} L${x1},${cy+ro} Z" class="thick"/><path d="M${x1},${cy-ri} L${x2},${cy-ri} M${x1},${cy+ri} L${x2},${cy+ri}" class="thin"/><path d="M${cx},${cy-ro-35} L${cx},${cy+ro+35} M${x1-25},${cy} L${x2+25},${cy}" class="center"/>
 <line x1="${x1}" y1="${dimY}" x2="${x2}" y2="${dimY}" class="dim"/><text x="${cx}" y="${dimY+27}" text-anchor="middle" class="label">L = ${fmt(L)}</text>
 <line x1="${x2+55}" y1="${cy-ro}" x2="${x2+55}" y2="${cy+ro}" class="dim"/><text x="${x2+75}" y="${cy+6}" class="label">OD = ${fmt(od)}</text>
 <line x1="${x1-55}" y1="${cy-ri}" x2="${x1-55}" y2="${cy+ri}" class="dim"/><text x="${x1-85}" y="${cy+6}" text-anchor="end" class="label">ID = ${fmt(id)}</text>
 <text x="${ox}" y="${oy-ro-28}" text-anchor="middle" class="label">END VIEW</text><circle cx="${ox}" cy="${oy}" r="${endR}" class="thick"/><circle cx="${ox}" cy="${oy}" r="${ri}" class="thin"/><path d="M${ox-endR-20},${oy} L${ox+endR+20},${oy} M${ox},${oy-endR-20} L${ox},${oy+endR+20}" class="center"/><text x="${ox}" y="${oy+endR+45}" text-anchor="middle" class="small">Ø${fmt(od)} / Ø${fmt(id)}</text>
 <rect x="620" y="500" width="330" height="145" class="thin"/><line x1="620" y1="535" x2="950" y2="535" class="thin"/><line x1="620" y1="575" x2="950" y2="575" class="thin"/><line x1="620" y1="610" x2="950" y2="610" class="thin"/><text x="630" y="523" class="small">TITLE: BEARING / BUSH</text><text x="630" y="558" class="small">MATERIAL: VESCONITE (VERIFY SPEC.)</text><text x="630" y="598" class="small">DRAWING: AVA-${Date.now().toString().slice(-6)}</text><text x="630" y="632" class="small">REV: A · SCALE: NTS · SHEET 1/1</text></svg>`;
 const win=window.open('','_blank','noopener,noreferrer'); if(!win){alert('Please allow pop-ups for AVA Internal.');return} win.document.write(`<html><head><title>AVA ISO Drawing</title><style>body{margin:0;background:#eee;display:grid;place-items:center;min-height:100vh}svg{max-width:96vw;max-height:96vh;box-shadow:0 10px 40px #aaa}@media print{@page{size:A4 landscape;margin:8mm}body{background:#fff}svg{box-shadow:none;max-width:none;max-height:none;width:100%}}</style></head><body>${svg}<script>window.onload=()=>setTimeout(()=>window.print(),500)<\/script></body></html>`);win.document.close();
};

function renderFreezer(){
  const el = document.getElementById("freezerContent");
  el.innerHTML=`<div class="page-title"><p class="eyebrow">INSTALLATION TOOL</p><h1>Freezer Fit</h1><p>Physics-based estimate of the time required for a Vesconite bush to contract enough to enter its housing without pressing, plus estimated recovery to ambient.</p></div>
  <form class="form-card calc-form" id="freezerForm">
   <div class="two-col"><label>Bush OD (mm)<input id="fOD" type="number" step="0.01" required></label><label>Housing size (mm)<input id="fHousing" type="number" step="0.01" required></label></div>
   <div class="two-col"><label>Press fit / interference (mm)<input id="fPress" type="number" step="0.001" required></label><label>Bush ID (mm)<input id="fID" type="number" step="0.01" required></label></div>
   <div class="two-col"><label>Bush length (mm)<input id="fLength" type="number" step="0.01" required></label><label>Freezer temperature (°C)<input id="fFreezer" type="number" value="-20" required></label></div>
   <div class="two-col"><label>Starting / ambient temperature (°C)<input id="fAmbient" type="number" value="20" required></label><label>Required installation clearance (mm)<input id="fClearance" type="number" step="0.01" value="0.20"></label></div>
   <details class="advanced"><summary>Advanced freezer conditions</summary><div class="two-col" style="margin-top:15px"><label>Airflow / heat-transfer condition<select id="fAir"><option value="8">Still / lightly circulating air</option><option value="12" selected>Normal freezer circulation</option><option value="20">Strong forced airflow</option></select></label><label>Safety factor<select id="fSF"><option value="1.15">1.15 — controlled freezer</option><option value="1.30" selected>1.30 — normal engineering allowance</option><option value="1.50">1.50 — conservative</option></select></label></div></details>
   <button class="primary wide" type="submit">Calculate cooling & warm-up</button></form><div id="freezerResults"></div>`;
  $("#freezerForm").onsubmit=e=>{e.preventDefault();calculateFreezer()};
}

/*
  Freezer model
  -------------
  Vesconite publishes density = 1380 kg/m3, thermal conductivity = 0.3 W/m.K
  and CTE = 6e-5 /K. Specific heat is not published in the current Vesconite
  property sheets, so this model uses an explicit engineering assumption of
  1500 J/kg.K. That assumption is shown to the user rather than hidden.

  The model uses a transient conduction estimate with a geometry-dependent
  characteristic length, a convection boundary condition and a safety factor.
  It is intentionally conservative and is NOT represented as an official
  Vesconite installation-time formula. The official guidance says to use a
  freezer around -40 C for freeze fitting but does not publish a universal
  time. Vesconite also reports a 300 mm long bush fitted by hand after two
  hours in dry ice; this is used only as a practical sanity reference.
*/
function calculateFreezer(){
 const OD=num("#fOD"), H=num("#fHousing"), PF=num("#fPress"), ID=num("#fID"), L=num("#fLength"), Tf=num("#fFreezer"), Ta=num("#fAmbient"), clearance=num("#fClearance"), h=num("#fAir"), sf=num("#fSF");
 if(!(OD>0&&H>0&&ID>=0&&L>0&&Tf<Ta)){alert("Please enter valid dimensions and a freezer temperature below ambient.");return}
 const rho=1380, k=0.30, cp=1500, cte=6e-5;
 const Ro=OD/2000, Ri=Math.max(0,ID/2000), length=L/1000;
 const volume=Math.PI*(Ro*Ro-Ri*Ri)*length;
 const areaOuter=2*Math.PI*Ro*length, areaInner=Ri>0?2*Math.PI*Ri*length:0, areaEnds=2*Math.PI*(Ro*Ro-Ri*Ri);
 const area=areaOuter+areaInner+areaEnds;
 const Lc=volume/area;
 const alpha=k/(rho*cp);
 const Bi=h*Lc/k;
 // Required OD contraction is calculated from the actual OD at ambient.
 // Target OD = housing minus installation clearance.
 const targetOD=Math.max(0,H-clearance);
 const requiredContraction=Math.max(0,OD-targetOD);
 const targetT=Ta-requiredContraction/(cte*OD);
 const attainable=Tf<=targetT;
 // For Bi <= 0.1, lumped capacitance is appropriate. Above that, apply
 // a geometry-dependent transient correction based on Bi and the safety factor.
 const tau=rho*cp*volume/(h*area);
 const correction=Bi<=0.1?1:(1+2.2*Math.min(2,Bi));
 let baseMinutes=0;
 if(attainable){
   const ratio=(Ta-Tf)/(targetT-Tf);
   if(ratio>1) baseMinutes=tau/60*Math.log(ratio)*correction;
 }
 const coolMinutes=baseMinutes*sf;
 const wall= (OD-ID)/2;
 const officialLN2Hours=Math.max(0,(wall/25)+(L/500));
 // Warm-up: target is 1 C below ambient. Start from freezer temperature.
 const warmTarget=Ta-1;
 const warmRatio=(Ta-Tf)/(Ta-warmTarget);
 let warmMinutes=warmRatio>1?tau/60*Math.log(warmRatio)*correction*1.10:0;
 // Add a modest core-temperature allowance for thick/long bushes.
 warmMinutes*=sf;
 const finalOD=OD*(1-cte*(Ta-targetT));
 const safetyOD=targetOD;
 const modelNote=Bi<=0.1?"Lumped-capacitance regime":"Internal temperature gradients included by Biot correction";
 const attainableClass=attainable?"success":"warning";
 $("#freezerResults").innerHTML=`<div class="subhead">Engineering estimate</div><div class="result-grid">
 ${card("Target bush temperature",attainable?fmt(targetT,1)+" °C":"Not reachable","" )}
 ${card("Estimated freezer time",attainable?formatTime(coolMinutes):"Not achievable",attainable?"good":"bad")}
 ${card("Estimated warm-up",formatTime(warmMinutes),"good")}
 ${card("OD required at insertion",fmt(safetyOD,2)+" mm")}
 ${card("Estimated OD at target",fmt(finalOD,2)+" mm")}
 ${card("Biot number",fmt(Bi,3))}${card("Vesconite LN₂ reference",fmt(officialLN2Hours,1)+" h")}
 </div>
 <div class="form-card"><div class="${attainableClass}">${attainable?`Estimated cooling time: <strong>${formatTime(coolMinutes)}</strong>. Keep the bush insulated and verify the OD with a calibrated measuring instrument immediately before fitting.`:`The selected freezer temperature is not cold enough to achieve the requested contraction. The model requires approximately <strong>${fmt(targetT,1)} °C</strong> at the bush.`}</div>
 <p class="math">Required contraction = OD − (housing − installation clearance)
<br>Target temperature = ambient − required contraction ÷ (CTE × OD)
<br>Thermal diffusivity α = k ÷ (ρ × cₚ)
<br>Characteristic length Lc = volume ÷ exposed surface area
<br>Bi = h × Lc ÷ k
<br>Transient time ≈ (ρVcₚ ÷ hA) × ln[(T₀−Tf)/(Ttarget−Tf)] × correction × safety factor
<br>Official LN₂ reference = wall ÷ 25 + length ÷ 500 hours</p>
 <div class="notice"><span>i</span><div><strong>Model basis: ${modelNote}</strong><p>Vesconite publishes density 1.38 g/ml, thermal conductivity 0.3 W/m·K and thermal expansion coefficient 6×10⁻⁵/K. Vesconite’s current shrink-fitting instruction publishes an LN₂-vapour reference of cooling time = wall thickness ÷ 25 + length ÷ 500 hours. Its pump guidance recommends a freezer around −40°C for freeze fitting, but does not publish a freezer-time equation. AVA therefore uses the physics model for freezer time and shows the official LN₂ formula as a benchmark.</p></div></div>
 <div class="warning"><strong>Validation status:</strong> The material properties are sourced from Vesconite. Specific heat is an explicit 1500 J/kg·K engineering assumption because it is not published in the current Vesconite property sheet. The model is cross-checked against Vesconite’s published LN₂ cooling-time equation, but a freezer has different heat-transfer conditions, so the freezer estimate is not an empirically validated installation time. For production use, run one controlled test with a representative bush, record the time to achieve hand-fit clearance, and use that result to calibrate the safety factor.</div>
 <div class="formula-note"><strong>Practical Vesconite reference</strong><p>Vesconite reports a 300 mm long Hilube bush that was fitted by hand after two hours in dry ice. That is a dry-ice field reference, not a freezer calibration point.</p></div></div>`;
}


/* AVA signature pull-down pump assembly animation */
(function initPumpEasterEgg(){
  const fx=document.getElementById("avaPumpFx");
  if(!fx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const svg=document.getElementById("pumpSvg");
  const shaft=document.getElementById("shaftGroup");
  const arrow=document.getElementById("launchArrow");
  const bowl=document.getElementById("bowlGroup");
  const left=document.getElementById("bowlLeft");
  const right=document.getElementById("bowlRight");
  const shaftFinal=document.getElementById("shaftFinal");
  const top=document.getElementById("topView");
  const glow=document.getElementById("fxGlow");
  const labels=document.getElementById("assemblyLabels");
  const hint=document.getElementById("fxHint");
  const bar=document.getElementById("fxProgressBar");
  const topHighlight=document.getElementById("topShaftHighlight");
  const topGrooves=document.getElementById("topGrooves");
  const topKey=document.getElementById("topKey");

  let startY=0,pull=0,holding=false,armed=false,holdTimer=null,running=false,raf=0;
  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const lerp=(a,b,t)=>a+(b-a)*t;

  function setPull(v){
    pull=clamp(v,0,190);
    fx.classList.add("active");
    const p=pull/190;
    shaft.setAttribute("transform",`translate(0 ${lerp(-285,-18,p)})`);
    arrow.setAttribute("opacity",String(Math.max(0,(p-.18)/.48)));
    bar.style.width=`${Math.round(p*100)}%`;
    hint.textContent=p>.65?"HOLD… RELEASE":"PULL DOWN & HOLD";
  }

  function setBowlPositions(x){
    // Left half enters from left. Right half mirrors the exact same geometry from right.
    left.setAttribute("transform",`translate(${x} 0)`);
    right.setAttribute("transform",`translate(${-x} 0)`);
  }

  function reset(){
    cancelAnimationFrame(raf); clearTimeout(holdTimer);
    running=false; holding=false; armed=false; pull=0;
    fx.classList.remove("active","launching");
    hint.textContent="PULL DOWN & HOLD";
    shaft.setAttribute("transform","translate(0 -285)");
    arrow.setAttribute("opacity","0");
    bowl.setAttribute("opacity","0");
    bowl.setAttribute("transform","translate(0 45)");
    setBowlPositions(-190);
    shaftFinal.setAttribute("opacity","1");
    labels.setAttribute("opacity","0");
    top.setAttribute("opacity","0");
    top.setAttribute("transform","translate(195 390) scale(.62)");
    glow.setAttribute("opacity","0");
    bar.style.width="0%";
    topHighlight.setAttribute("transform","rotate(0)");
    topGrooves.setAttribute("transform","rotate(0)");
    topKey.setAttribute("transform","rotate(0)");
  }

  function animate(ms,fn,done){
    const t0=performance.now();
    const frame=now=>{
      const p=Math.min(1,(now-t0)/ms);
      fn(p);
      if(p<1) raf=requestAnimationFrame(frame); else if(done) done();
    };
    raf=requestAnimationFrame(frame);
  }

  function launch(){
    if(running)return;
    running=true; holding=false; armed=false; fx.classList.add("launching");
    hint.textContent="RELEASE";

    // 1 — shaft shoots into the centre, rotating as it travels.
    animate(1050,p=>{
      const e=ease(p), y=lerp(-18,112,e), spin=p*420;
      shaft.setAttribute("transform",`translate(0 ${y}) rotate(${spin} 195 300)`);
      arrow.setAttribute("opacity",String(1-e));
      glow.setAttribute("opacity",String(.12+.25*e));
      bar.style.width=`${70+Math.round(p*8)}%`;
    },()=>{
      shaft.setAttribute("opacity","0");
      bowl.setAttribute("opacity","1");
      bowl.setAttribute("transform","translate(0 45)");
      setBowlPositions(-190);

      // 2 — split pump bowl travels in from both sides and closes around the shaft.
      animate(1250,p=>{
        const e=ease(p), x=lerp(-190,0,e);
        setBowlPositions(x);
        bar.style.width=`${78+Math.round(p*8)}%`;
      },()=>{
        labels.setAttribute("opacity","1");
        glow.setAttribute("opacity",".42");

        // 3 — the assembled pump settles into position with a slight mechanical compression.
        animate(520,p=>{
          const e=ease(p), sy=1-.035*Math.sin(e*Math.PI);
          bowl.setAttribute("transform",`translate(0 ${45-7*e}) scale(1 ${sy})`);
        },()=>{
          // 4 — camera tips from the side assembly into a top inspection view.
          animate(1350,p=>{
            const e=ease(p);
            const sy=lerp(1,.09,e);
            const oy=lerp(38,-12,e);
            const tilt=-7*e;
            bowl.setAttribute("transform",`translate(195 ${310+oy}) rotate(${tilt}) scale(1 ${sy}) translate(-195 -310)`);
            bowl.setAttribute("opacity",String(1-e*.9));
            top.setAttribute("opacity",String(e));
            top.setAttribute("transform",`translate(195 ${388-2*e}) scale(${lerp(.58,1,e)})`);
            bar.style.width=`${86+Math.round(p*7)}%`;
          },()=>{
            // 5 — top view: shaft spins slowly inside the grooved Vesconite bush.
            hint.textContent="BEARING INTERFACE";
            animate(2700,p=>{
              const e=ease(p), rot=e*720;
              topHighlight.setAttribute("transform",`rotate(${rot})`);
              topGrooves.setAttribute("transform",`rotate(${-rot*.12})`);
              topKey.setAttribute("transform",`rotate(${rot})`);
              top.setAttribute("transform",`translate(195 388) scale(${1+.012*Math.sin(e*Math.PI)})`);
              glow.setAttribute("opacity",String(.34+.08*Math.sin(e*Math.PI)));
              bar.style.width=`${93+Math.round(p*5)}%`;
            },()=>{
              // 6 — fade the engineering view back into AVA.
              animate(1050,p=>{
                const e=ease(p), inv=1-e;
                top.setAttribute("opacity",String(inv));
                labels.setAttribute("opacity",String(inv));
                glow.setAttribute("opacity",String(inv*.35));
                bar.style.width=`${98-Math.round(e*98)}%`;
              },reset);
            });
          });
        });
      });
    });
  }

  const canStart=()=>document.querySelector("#home.page.active") && window.scrollY<=3 && !running;

  window.addEventListener("touchstart",e=>{
    if(!canStart())return;
    const t=e.touches[0];
    if(!t || t.clientY>120)return;
    startY=t.clientY; holding=true; armed=false; pull=0;
    clearTimeout(holdTimer);
  },{passive:true});

  window.addEventListener("touchmove",e=>{
    if(!holding || running)return;
    const t=e.touches[0]; if(!t)return;
    const dy=t.clientY-startY;
    if(dy>4){
      if(e.cancelable)e.preventDefault();
      setPull(dy);
      if(dy>78 && !holdTimer){
        holdTimer=setTimeout(()=>{
          if(holding && pull>78){armed=true;fx.classList.add("launching");hint.textContent="RELEASE";}
        },520);
      }
    }
  },{passive:false});

  window.addEventListener("touchend",()=>{
    if(!holding || running)return;
    clearTimeout(holdTimer);
    if(pull>78 && armed)launch(); else reset();
  },{passive:true});

  // Desktop testing fallback.
  let mouseMove;
  window.addEventListener("pointerdown",e=>{
    if(e.pointerType!=="mouse" || !canStart() || e.clientY>90)return;
    startY=e.clientY;holding=true;armed=false;pull=0;
    mouseMove=e2=>{if(!holding||running)return;const dy=e2.clientY-startY;if(dy>4)setPull(dy)};
    window.addEventListener("pointermove",mouseMove);
    holdTimer=setTimeout(()=>{if(holding&&pull>78){armed=true;fx.classList.add("launching");hint.textContent="RELEASE"}},520);
  });
  window.addEventListener("pointerup",()=>{
    if(!holding || running)return;
    clearTimeout(holdTimer);
    if(mouseMove)window.removeEventListener("pointermove",mouseMove);
    if(pull>78&&armed)launch();else reset();
  });

  reset();
  if(new URLSearchParams(location.search).has("pumpTest")) setTimeout(launch,300);
})();

function formatTime(min){if(!Number.isFinite(min)||min<=0)return"Not achievable";if(min<60)return `${Math.ceil(min)} min`;const h=Math.floor(min/60),m=Math.ceil(min%60);return `${h} h ${m?m+" min":""}`}

function exportApplicationReport(id, selectedIds=[]){
 const apps=getApps(), primary=apps.find(x=>x.id===id); if(!primary)return;
 const ids=[id,...selectedIds.filter(x=>x!==id)];
 const portfolio=ids.map(x=>apps.find(y=>y.id===x)).filter(Boolean);
 const escR=esc, portfolioCount=portfolio.length;
 const sectionHtml=(a,index)=>{
   const sections=[["Product / material",a.product],["Original material",a.original],["Why Vesconite was selected",a.why],["Operating environment",a.environment],["Load / movement / speed",a.load],["Temperature",a.temperature],["Lubrication",a.lubrication],["Machine / OEM",a.machine],["Outcome / evidence",a.outcome]];
   const photos=photosOf(a);
   return `<article class="application"><div class="app-head"><div><div class="app-num">APPLICATION ${index+1} OF ${portfolioCount}</div><h2>${escR(a.name)}</h2><div class="meta">${escR(a.industry)} · ${escR(a.product||"Product not recorded")} · Recorded ${new Date(a.date).toLocaleDateString()}${a.author?" · "+escR(a.author):""}</div></div><div class="tag">${escR(a.industry)}</div></div><p class="lead">${escR(a.description||"")}</p>${photos.map((p,i)=>`<figure class="report-photo"><img class="photo" src="${p.src}" alt="Application photo ${i+1}"><figcaption><strong>Photo ${i+1}</strong>${escR(p.caption||"")}</figcaption></figure>`).join("")}<div class="grid">${sections.map(([t,v])=>`<div class="box"><strong>${escR(t)}</strong><p>${escR(v||"Not recorded")}</p></div>`).join("")}</div></article>`;
 };
 const coverPhotos=photosOf(primary);
 const coverImage=coverPhotos[0]?`<img class="cover-image" src="${coverPhotos[0].src}" alt="">`:"";
 const html=`<!doctype html><html><head><meta charset="utf-8"><title>AVA Application Portfolio - ${escR(primary.name)}</title><style>
 @page{size:A4;margin:13mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#17242b;margin:0}h1{font-size:38px;line-height:1.05;margin:7px 0}h2{font-size:21px;margin:4px 0 6px}p{font-size:10.5pt;line-height:1.5;margin:5px 0}.eyebrow,.app-num{font-size:8.5pt;color:#167d6b;font-weight:bold;letter-spacing:1.6px}.meta{color:#5d6b72;font-size:9.5pt}.tag{display:inline-block;padding:5px 9px;border-radius:20px;background:#e5f5f1;color:#146d5e;font-size:8.5pt;font-weight:bold}.cover{padding:8mm 0 15mm;min-height:245mm;display:flex;flex-direction:column;justify-content:center}.cover p{font-size:13pt;color:#5d6b72;max-width:155mm}.cover-image{display:block;width:100%;max-height:95mm;object-fit:cover;border-radius:9px;margin:18px 0}.summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:22px}.summary .box{background:#f3f8f7}.box{border:1px solid #d7e0e3;border-radius:8px;padding:10px;break-inside:avoid}.box strong{display:block;font-size:8.5pt;color:#167d6b;text-transform:uppercase;margin-bottom:4px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.photo{width:100%;max-height:270px;object-fit:contain;border:1px solid #ddd;border-radius:8px;margin:9px 0 4px;background:#f7f9f9}.report-photo{margin:12px 0 16px;break-inside:avoid}.report-photo figcaption{font-size:9pt;color:#5d6b72;margin-top:3px}.report-photo figcaption strong{color:#167d6b;margin-right:7px}.application{break-before:page}.application:first-of-type{break-before:auto}.app-head{display:flex;justify-content:space-between;gap:15px;border-bottom:1px solid #d7e0e3;padding-bottom:12px;margin-bottom:14px}.lead{font-size:11pt}.footer{margin-top:26px;padding-top:10px;border-top:1px solid #ddd;color:#7b888d;font-size:8pt}@media print{.application{break-before:page}}
 </style></head><body><section class="cover"><div class="eyebrow">AVA INTERNAL · VESCONITE ENGINEERING</div><h1>Application Portfolio</h1><h2>${escR(primary.name)}</h2><p>A selected portfolio of real-world applications from the AVA Internal Application Database.</p>${coverImage}<div class="summary"><div class="box"><strong>Primary application</strong><p>${escR(primary.name)}</p></div><div class="box"><strong>Industry</strong><p>${escR(primary.industry)}</p></div><div class="box"><strong>Applications included</strong><p>${portfolioCount}</p></div><div class="box"><strong>Generated</strong><p>${new Date().toLocaleDateString()}</p></div></div><div class="footer">Prepared from the AVA Internal application database. Application-specific engineering verification remains the responsibility of the relevant project team.</div></section>${portfolio.map(sectionHtml).join("")}</body></html>`;
 // Blob URLs avoid the blank popup/document.write failure seen in some browsers.
 const blob=new Blob([html],{type:"text/html;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 const win=window.open(url,"_blank");
 if(!win){URL.revokeObjectURL(url);alert("Please allow pop-ups for AVA Internal to export the PDF.");return;}
 setTimeout(()=>{try{win.focus();win.print()}catch{}},900);
 setTimeout(()=>URL.revokeObjectURL(url),120000);
}

$("#exportData").onclick=()=>{
 const blob=new Blob([JSON.stringify({version:1,exported:new Date().toISOString(),industries:getIndustries(),applications:getApps()},null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="ava-internal-backup.json";a.click();URL.revokeObjectURL(a.href);
};
$("#importData").onchange=e=>{
 const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.applications))throw Error();saveApps(d.applications);if(Array.isArray(d.industries))saveIndustries(d.industries);fillIndustrySelects();alert("Library restored.");}catch{alert("That file is not a valid AVA backup.")}};r.readAsText(file)
};
$("#clearData").onclick=()=>{if(confirm("Delete ALL locally stored application records? This cannot be undone unless you have a backup.")){localStorage.removeItem(STORAGE_KEY);updateStats();renderLibrary()}};

showPage("home");
