'use strict';
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
gsap.registerPlugin(ScrollTrigger);

/* Lenis */
if (!RM && typeof Lenis!=='undefined') {
  const lenis = new Lenis({lerp:.1, wheelMultiplier:1.0, touchMultiplier:2});
  if(typeof ScrollTrigger!=='undefined') lenis.on('scroll',()=>ScrollTrigger.update());
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

/* Chrome */
const curDot=Object.assign(document.createElement('div'),{id:'cursor-dot'});
const curRing=Object.assign(document.createElement('div'),{id:'cursor-ring'});
const progBar=Object.assign(document.createElement('div'),{id:'scroll-progress'});
const progFill=Object.assign(document.createElement('div'),{id:'scroll-fill'});
progBar.appendChild(progFill);
const SECS=['hero','work','case-studies','stack','about','contact'];
const pipNav=document.createElement('nav'); pipNav.id='section-nav';
SECS.forEach(id=>{
  const p=Object.assign(document.createElement('div'),{className:'s-pip',title:id});
  p.addEventListener('click',()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'}));
  pipNav.appendChild(p);
});
document.body.append(curDot,curRing,progBar,pipNav);
if(!RM) document.body.classList.add('has-cursor');

/* Scroll progress + nav */
window.addEventListener('scroll',()=>{
  const max=document.documentElement.scrollHeight-window.innerHeight;
  progFill.style.width=(window.scrollY/max*100).toFixed(2)+'%';
  document.getElementById('main-nav').classList.toggle('scrolled',window.scrollY>40);
},{passive:true});

/* Pips + nav active */
const pips=[...pipNav.querySelectorAll('.s-pip')];
const secEls=SECS.map(id=>document.getElementById(id)).filter(Boolean);
const navLinks=[...document.querySelectorAll('.nav-links a')];
let pipVis=false;
window.addEventListener('scroll',()=>{
  const mid=window.scrollY+window.innerHeight*.45;
  let active=0; secEls.forEach((el,i)=>{if(el?.offsetTop<=mid)active=i;});
  pips.forEach((p,i)=>p.classList.toggle('on',i===active));
  navLinks.forEach(a=>a.classList.toggle('nav-on',a.getAttribute('href')?.replace('#','')==SECS[active]));
  const show=window.scrollY>window.innerHeight*.3;
  if(show!==pipVis){pipVis=show;pipNav.classList.toggle('vis',show);}
},{passive:true});

/* Cursor */
let mx=-300,my=-300,rx=-300,ry=-300;
if(!RM){
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;curDot.style.transform=`translate3d(${mx}px,${my}px,0)`;});
  const hSel='a,button,.contact-link,input,textarea,.stack-card';
  document.querySelectorAll(hSel).forEach(el=>{
    el.addEventListener('mouseenter',()=>document.body.classList.add('hovering'));
    el.addEventListener('mouseleave',()=>document.body.classList.remove('hovering'));
  });
  (function rloop(){
    rx+=(mx-rx)*.15; ry+=(my-ry)*.15;
    curRing.style.transform=`translate3d(${rx}px,${ry}px,0)`;
    requestAnimationFrame(rloop);
  })();
}

/* Preloader */
function runPreloader(cb){
  if(RM){cb();return;}
  const pre=document.getElementById('preloader');
  if(!pre){cb();return;}
  gsap.fromTo(pre.querySelector('.pre-bar'),{scaleX:0},{scaleX:1,duration:1.4,ease:'power3.inOut',
    onComplete:()=>gsap.to(pre,{opacity:0,duration:.6,delay:.1,onComplete:()=>{pre.style.display='none';setTimeout(cb,300);}})});
}

/* Hero left — CSS class toggle entrance */
function heroEntrance(){
  const els={
    eyebrow:document.querySelector('.hero-eyebrow'),
    hl1:document.querySelector('.hl-1'),
    hl2:document.querySelector('.hl-2'),
    sub:document.querySelector('.hero-sub'),
    actions:document.querySelector('.hero-actions'),
    panel:document.querySelector('.hero-right'),
  };
  const kpis=[...document.querySelectorAll('.lp-kpi')];

  if(RM){
    Object.values(els).forEach(el=>el?.classList.remove('anim-out'));
    kpis.forEach(el=>el.classList.remove('anim-out'));
    return;
  }

  /* Set initial hidden state */
  Object.values(els).forEach(el=>el?.classList.add('anim-out'));
  kpis.forEach(el=>el.classList.add('anim-out'));

  const reveal=(el,delay)=>setTimeout(()=>el?.classList.remove('anim-out'),delay);
  reveal(els.eyebrow, 2100);
  reveal(els.hl1, 2300);
  reveal(els.hl2, 2600);
  reveal(els.sub, 2900);
  reveal(els.actions, 3100);
  reveal(els.panel, 2600);

  /* KPI counters at t=3000ms */
  setTimeout(()=>{
    document.querySelectorAll('.lp-kpi-num').forEach(el=>{
      const tile=el.closest('.lp-kpi');
      const target=parseFloat(tile.dataset.base);
      const isInt=tile.dataset.int==='true';
      const dur=1400,t0=performance.now();
      (function step(now){
        const p=Math.min((now-t0)/dur,1);
        const ease=1-Math.pow(1-p,3);
        el.textContent=isInt?Math.round(target*ease):(target*ease).toFixed(1);
        if(p<1)requestAnimationFrame(step);
        else el.textContent=isInt?Math.round(target):target;
      })(t0);
    });
    document.querySelectorAll('.lp-live-dot').forEach(d=>d.classList.add('pulse'));
  },3000);
}

/* Competency bars — animate fill on scroll entry */
(function initBars(){
  const chart=document.getElementById('aboutChart'); if(!chart) return;
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      const bars=e.target.querySelectorAll('.bar-fill');
      if(!e.isIntersecting) {
         bars.forEach(b=>b.style.width='0%');
         return;
      }
      bars.forEach((b,i)=>{
        const w=b.dataset.width||'0';
        setTimeout(()=>{ b.style.width=w+'%'; }, RM?0:i*120);
      });
    });
  },{threshold:.15});
  io.observe(chart);
  /* Ensure bars start at 0 */
  chart.querySelectorAll('.bar-fill').forEach(b=>{ b.style.width='0%'; });
})();

/* Form logic removed based on user feedback */

/* Magnetic buttons */
if(!RM){
  document.querySelectorAll('.btn-primary,.btn-ghost,.nav-cta').forEach(el=>{
    el.addEventListener('mousemove',e=>{
      const r=el.getBoundingClientRect();
      el.style.transform=`translate(${(e.clientX-(r.left+r.width/2))*.2}px,${(e.clientY-(r.top+r.height/2))*.2}px)`;
    });
    el.addEventListener('mouseleave',()=>{el.style.transform='';});
  });
}

/* IO scroll reveals */
function initIO(){
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting)return;
      e.target.classList.add('io-visible');
      e.target.classList.remove('io-hidden');
      io.unobserve(e.target);
    });
  },{threshold:.15});
  document.querySelectorAll('.section-title,.section-num,.section-desc,.about-left,.about-visual,.credential,.contact-left,.contact-right,.contact-link,.timeline-item').forEach(el=>{
    el.classList.add('io-hidden');
    io.observe(el);
  });
}

runPreloader(()=>{heroEntrance();initIO();});
