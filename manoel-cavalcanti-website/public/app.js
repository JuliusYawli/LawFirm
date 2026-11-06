import { english } from './translations.js';
const dialog=document.getElementById('language-dialog');
const switcher=document.getElementById('language-switch');
const form=document.getElementById('request-form');
const status=document.getElementById('form-status');
const submit=document.getElementById('submit-request');
const messages={pt:{sending:'Enviando…',success:'Solicitação recebida. Aguarde o contato do escritório para confirmar os detalhes e o agendamento.',failure:'Não foi possível salvar sua solicitação. Tente novamente ou entre em contato por e-mail.',limited:'Muitas solicitações. Tente novamente em uma hora ou entre em contato por e-mail.',invalid:'Confira seu nome, e-mail, mensagem e data antes de enviar.'},en:{sending:'Sending…',success:'Request received. Please wait for the office to contact you to confirm the details and appointment.',failure:'Your request could not be saved. Please try again or contact us by email.',limited:'Too many requests. Please try again in an hour or contact us by email.',invalid:'Check your name, email, message and date before submitting.'}};
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(node){return node.parentElement.closest('script,dialog,#form-status')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});
const nodes=[];while(walker.nextNode()){const node=walker.currentNode;const original=node.textContent;const key=original.trim();if(english[key])nodes.push({node,original,key})}
const originalTitle=document.title;
const menu=document.getElementById('main-nav');
const menuToggle=document.getElementById('menu-toggle');
function closeMenu(){menu.classList.remove('is-open');menuToggle.setAttribute('aria-expanded','false')}
menuToggle.addEventListener('click',()=>{const open=menu.classList.toggle('is-open');menuToggle.setAttribute('aria-expanded',String(open))});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.classList.contains('is-open')){closeMenu();menuToggle.focus()}});
document.documentElement.classList.add('js');
let language='pt',statusKey='',busy=false,chosen=false,pendingSubmission=null;
function renderStatus(key,error=false){statusKey=key;status.textContent=key?messages[language][key]:'';status.dataset.error=String(error)}
function setLanguage(value){
 language=value;chosen=true;document.documentElement.lang=value==='pt'?'pt-BR':'en';
 for(const {node,original,key} of nodes)node.textContent=value==='en'?original.replace(key,english[key]):original;
 document.title=value==='en'?english[originalTitle]:originalTitle;
 document.querySelector('meta[name=description]').content=value==='en'?'Manoel Cavalcanti — Law office in Angra dos Reis. Contact us for information and appointments.':'Manoel Cavalcanti — Advocacia em Angra dos Reis. Entre em contato para informações e agendamento.';
 document.querySelector('meta[property="og:title"]').content=document.title;
 document.querySelector('meta[property="og:description"]').content=document.querySelector('meta[name=description]').content;
 document.querySelector('meta[property="og:locale"]').content=value==='en'?'en_US':'pt_BR';
 document.querySelectorAll('[data-whatsapp]').forEach(a=>a.href='https://wa.me/5584998393641?text='+encodeURIComponent(value==='en'?'Hello, I would like information about a consultation.':'Olá, gostaria de informações sobre uma consulta.'));
 menuToggle.setAttribute('aria-label',value==='en'?'Toggle navigation':'Abrir ou fechar navegação');
 closeMenu();
 document.querySelector('nav').setAttribute('aria-label',value==='en'?'Main navigation':'Navegação principal');
 document.querySelector('.brand').setAttribute('aria-label',value==='en'?'Manoel Cavalcanti, home':'Manoel Cavalcanti, início');
 document.querySelector('.portrait img').alt=value==='en'?'Brass scales of justice beside law books':'Balança da justiça em bronze ao lado de livros jurídicos';
 switcher.textContent=value==='en'?'EN / PT':'PT / EN';switcher.setAttribute('aria-label',value==='en'?'Choose language':'Escolher idioma');
 document.querySelectorAll('a[href^="mailto:"]').forEach(a=>{if(a.href.includes('?'))a.href='mailto:manoellawcavalcanti@gmail.com?subject='+encodeURIComponent(value==='en'?'Consultation request':'Solicitação de atendimento')});
 if(statusKey)renderStatus(statusKey,status.dataset.error==='true');
 if(document.getElementById('storage-status').dataset.cleared==='true')announceStorageCleared();
 try{localStorage.setItem('office-language',JSON.stringify({language:value,expires:Date.now()+180*24*60*60*1000}))}catch{}
 if(dialog.open)dialog.close();
}
dialog.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.language)));
dialog.addEventListener('close',()=>switcher.focus());
dialog.addEventListener('cancel',event=>{if(!chosen){event.preventDefault();setLanguage('pt')}});
switcher.addEventListener('click',()=>dialog.showModal());
let remembered;
try{
 const stored=localStorage.getItem('office-language');
 if(['pt','en'].includes(stored))remembered=stored;
 else if(stored){const preference=JSON.parse(stored);if(preference.expires>Date.now())remembered=preference.language;else localStorage.removeItem('office-language')}
}catch{}
const resetLanguage=document.getElementById('reset-language');
function announceStorageCleared(){document.getElementById('storage-status').textContent=language==='en'?'Saved language removed. You can change language using the button at the top.':'Idioma salvo removido. Você pode mudar o idioma pelo botão no topo.'}
resetLanguage.addEventListener('click',()=>{try{localStorage.removeItem('office-language')}catch{}document.getElementById('storage-status').dataset.cleared='true';announceStorageCleared()});
if(['pt','en'].includes(remembered))setLanguage(remembered);else dialog.showModal();
document.getElementById('year').textContent=new Date().getFullYear();
const date=form.elements.preferredDate;
function refreshDate(){date.min=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}refreshDate();date.addEventListener('focus',refreshDate);
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!form.reportValidity())return;
 busy=true;submit.disabled=true;form.setAttribute('aria-busy','true');renderStatus('sending');
 let requestTimer;
 try{
 const body=Object.fromEntries(new FormData(form));body.language=language;
 const serialized=JSON.stringify(body);
 if(!pendingSubmission||pendingSubmission.serialized!==serialized)pendingSubmission={serialized,requestId:crypto.randomUUID()};
 body.requestId=pendingSubmission.requestId;
  const controller=new AbortController();requestTimer=setTimeout(()=>controller.abort(),20000);
  const response=await fetch('/api/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
  const data=await response.json();
  if(response.status!==201||typeof data.id!=='string'){if(response.status===409)pendingSubmission=null;renderStatus(response.status===429?'limited':response.status===400?'invalid':'failure',true)}
  else{form.reset();pendingSubmission=null;renderStatus('success')}
 }catch{renderStatus('failure',true)}finally{clearTimeout(requestTimer);busy=false;submit.disabled=false;form.removeAttribute('aria-busy');status.focus()}
});

// Enable only after the submission handler is installed.
submit.disabled=false;

// One-time entrances with staggered groups; never hide content without observer support.
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
const entranceTargets=document.querySelectorAll('.section-heading,.featured-practices article,.consultation-timeline .step,.about>div:not(.partner-layout),.partner-image,.partner-copy,.location-section>div');
let entrance;
if('IntersectionObserver' in window&&!motionPreference.matches){
 entrance=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');entrance.unobserve(entry.target)}
 },{threshold:.08});
 document.querySelectorAll('.featured-practices,.consultation-steps').forEach(group=>{
  [...group.children].forEach((element,index)=>element.style.setProperty('--reveal-delay',`${Math.min(index,4)*85}ms`));
 });
 entranceTargets.forEach(element=>{element.classList.add('reveal-ready');entrance.observe(element)});
}
const heroVisual=document.querySelector('.hero .portrait');
let heroEntranceStarted=false;
function startHeroEntrance(){
 if(heroEntranceStarted||dialog.open||motionPreference.matches)return;
 heroEntranceStarted=true;heroVisual.classList.add('hero-enter');
}
dialog.addEventListener('close',startHeroEntrance);
startHeroEntrance();
motionPreference.addEventListener('change',event=>{
 if(event.matches){entrance?.disconnect();entranceTargets.forEach(element=>element.classList.add('is-visible'));heroVisual.classList.remove('hero-enter')}
});
// Use actual scroll position so the highlighted link always matches the visible section.
const navigationLinks=[...menu.querySelectorAll('a')];
const navigationSections=navigationLinks.map(link=>document.getElementById(link.hash.slice(1)));
const header=document.querySelector('.site-header');
function updateHeaderOffset(){document.documentElement.style.setProperty('--header-offset',`${header.getBoundingClientRect().height+12}px`)}
function updateCurrentSection(){
 const marker=header.getBoundingClientRect().bottom+24;
 let active=null;
 for(const section of navigationSections){if(section.getBoundingClientRect().top<=marker)active=section.id}
 navigationLinks.forEach(link=>{if(link.hash==='#'+active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
}
let navigationFrame=false;
function scheduleNavigationUpdate(){if(navigationFrame)return;navigationFrame=true;requestAnimationFrame(()=>{updateCurrentSection();navigationFrame=false})}
window.addEventListener('scroll',scheduleNavigationUpdate,{passive:true});
window.addEventListener('resize',()=>{updateHeaderOffset();scheduleNavigationUpdate()});
menu.addEventListener('click',updateHeaderOffset);
if('ResizeObserver' in window)new ResizeObserver(()=>{updateHeaderOffset();scheduleNavigationUpdate()}).observe(header);
updateHeaderOffset();updateCurrentSection();

// Open disclosure ancestors before scrolling to linked policy and preparation content.
function revealHashTarget(){
 let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}
 const target=document.getElementById(id);if(!target)return;
 for(let node=target;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;
 requestAnimationFrame(()=>target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
}
window.addEventListener('hashchange',revealHashTarget);
if(location.hash)revealHashTarget();
document.addEventListener('click',event=>{if(!header.contains(event.target))closeMenu()});
