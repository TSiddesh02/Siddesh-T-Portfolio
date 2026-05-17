'use strict';
/* panels.js — Live panel, pipeline, work cards, case study charts */
const _RM=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ── SVG path helper ─────────────────────────────────── */
function buildPath(data,W,H,pad){
  const n=data.length,min=Math.min(...data),max=Math.max(...data),rY=max-min||1;
  const pts=data.map((v,i)=>({x:pad+(i/(n-1))*(W-pad*2),y:H-pad-((v-min)/rY)*(H-pad*2)}));
  const cp=(W-pad*2)/(n-1)*.38;
  let d=`M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for(let i=1;i<n;i++) d+=` C${(pts[i-1].x+cp).toFixed(1)},${pts[i-1].y.toFixed(1)} ${(pts[i].x-cp).toFixed(1)},${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
  return{d,pts,last:pts[n-1]};
}

function setDashDraw(el,dur,delay,cb){
  const len=el.getTotalLength();
  el.style.strokeDasharray=len; el.style.strokeDashoffset=len;
  el.style.transition=`stroke-dashoffset ${dur}ms ease-in-out ${delay}ms`;
  requestAnimationFrame(()=>{requestAnimationFrame(()=>{el.style.strokeDashoffset=0; if(cb)setTimeout(cb,dur+delay);});});
}

/* ── Hero live panel ─────────────────────────────────── */
(function initHeroPanel(){
  const svg=document.getElementById('lp-svg'); if(!svg) return;
  const lineEl=document.getElementById('lp-line');
  const areaEl=document.getElementById('lp-area');
  const dotEl =document.getElementById('lp-dot-lead');
  const ringEl=document.getElementById('lp-ring-lead');
  const valEl =document.getElementById('lp-cur-val');
  const badge =document.querySelector('.lp-chart-badge');
  const W=400,H=90,PAD=6;
  let sparkData=[18,22,19,26,23,29,24,31];
  let liveTimer=null,paused=false,resumeTimer=null;

  function renderPaths(data){
    const{d,pts,last}=buildPath(data,W,H,PAD);
    const areaD=d+` L${W-PAD},${H-PAD} L${PAD},${H-PAD} Z`;
    lineEl.setAttribute('d',d);
    areaEl.setAttribute('d',areaD);
    areaEl.style.opacity='.07';
    dotEl.setAttribute('cx',last.x); dotEl.setAttribute('cy',last.y);
    ringEl.setAttribute('cx',last.x); ringEl.setAttribute('cy',last.y);
    if(valEl) valEl.textContent='$'+data[data.length-1].toFixed(1)+'M';
  }

  function drawInitial(){
    const{d,pts,last}=buildPath(sparkData,W,H,PAD);
    lineEl.setAttribute('d',d);
    areaEl.setAttribute('d',d+` L${W-PAD},${H-PAD} L${PAD},${H-PAD} Z`);
    areaEl.style.opacity='0';
    dotEl.setAttribute('cx',last.x); dotEl.setAttribute('cy',last.y);
    dotEl.style.opacity='0';
    ringEl.setAttribute('cx',last.x); ringEl.setAttribute('cy',last.y);
    ringEl.style.opacity='0';

    if(_RM){ areaEl.style.opacity='.07'; dotEl.style.opacity='1'; return; }

    /* Grid lines fade at t=600ms */
    svg.querySelectorAll('.grid-line').forEach(l=>{
      l.style.opacity='0'; l.style.transition='opacity 400ms ease-out 600ms';
      requestAnimationFrame(()=>{requestAnimationFrame(()=>{ l.style.opacity='1'; });});
    });

    /* Line draws at t=700ms */
    setTimeout(()=>{
      areaEl.style.transition='opacity 1800ms ease-in-out';
      areaEl.style.opacity='.07';
      setDashDraw(lineEl,1800,0,()=>{
        /* Terminal dot entrance */
        dotEl.style.transition='transform 350ms cubic-bezier(.16,1,.3,1),opacity 200ms';
        dotEl.style.transformOrigin=`${last.x}px ${last.y}px`;
        dotEl.style.transform='scale(1.3)';
        dotEl.style.opacity='1';
        setTimeout(()=>{ dotEl.style.transform='scale(1)'; },200);
        /* One-time ring ripple */
        ringEl.style.opacity='1';
        ringEl.style.transition='transform 600ms ease-out,opacity 600ms ease-out';
        ringEl.style.transformOrigin=`${last.x}px ${last.y}px`;
        ringEl.style.transform='scale(2.5)';
        ringEl.style.opacity='0';
        setTimeout(()=>{ ringEl.style.transform='scale(1)'; ringEl.style.opacity='.3'; ringEl.style.transition='none'; startLive(); },650);
      });
    },700);
  }

  function addPoint(){
    const prev=sparkData[sparkData.length-1];
    const next=Math.max(14,Math.min(40,prev+(Math.random()*6-2)));
    /* Slide chart left, then update data */
    const stepW=(W-PAD*2)/(sparkData.length-1);
    svg.style.transition=_RM?'none':'transform 600ms cubic-bezier(.16,1,.3,1)';
    svg.style.transform=`translateX(-${stepW.toFixed(1)}px)`;
    setTimeout(()=>{
      sparkData.push(parseFloat(next.toFixed(1)));
      sparkData.shift();
      renderPaths(sparkData);
      svg.style.transition='none';
      svg.style.transform='none';
    },_RM?0:600);
  }

  function startLive(){
    liveTimer=setInterval(()=>{ if(!paused) addPoint(); },3000);
  }

  /* Pause on hover */
  const panel=document.getElementById('live-panel');
  if(panel){
    panel.addEventListener('mouseenter',()=>{
      paused=true;
      clearTimeout(resumeTimer);
      if(badge){ badge.textContent='● Paused'; badge.classList.add('paused'); }
    });
    panel.addEventListener('mouseleave',()=>{
      resumeTimer=setTimeout(()=>{
        paused=false;
        if(badge){ badge.textContent='● LIVE'; badge.classList.remove('paused'); }
      },1500);
    });
  }

  /* Chart scrubbing */
  svg.addEventListener('mousemove',e=>{
    const rect=svg.getBoundingClientRect();
    const svgX=(e.clientX-rect.left)*(W/rect.width);
    const{pts}=buildPath(sparkData,W,H,PAD);
    let nearest=0,minD=Infinity;
    pts.forEach((p,i)=>{ const d=Math.abs(p.x-svgX); if(d<minD){minD=d;nearest=i;} });
    showHairline(pts[nearest],sparkData[nearest],nearest);
  });
  svg.addEventListener('mouseleave',()=>hideHairline());

  let hairlineEl=null,tooltipEl=null;
  function showHairline(pt,val,idx){
    if(!hairlineEl){
      hairlineEl=document.createElementNS('http://www.w3.org/2000/svg','line');
      hairlineEl.classList.add('lp-hairline');
      svg.appendChild(hairlineEl);
    }
    hairlineEl.setAttribute('x1',pt.x); hairlineEl.setAttribute('x2',pt.x);
    hairlineEl.setAttribute('y1',PAD);  hairlineEl.setAttribute('y2',H-PAD);
    if(!tooltipEl){
      tooltipEl=document.createElement('div');
      tooltipEl.className='lp-tooltip';
      svg.parentElement.style.position='relative';
      svg.parentElement.appendChild(tooltipEl);
    }
    const labels=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
    tooltipEl.innerHTML=`<span class="lp-tooltip-val">${val.toFixed(1)}%</span><br><span class="lp-tooltip-label">${labels[idx]||'—'}</span>`;
    const rect=svg.getBoundingClientRect();
    const pxX=pt.x*(rect.width/W);
    const pxY=pt.y*(rect.height/H);
    const right=pxX>rect.width*.75;
    tooltipEl.style.left=right?'auto':(pxX+8)+'px';
    tooltipEl.style.right=right?(rect.width-pxX+8)+'px':'auto';
    tooltipEl.style.top=(pxY-36)+'px';
    tooltipEl.classList.remove('hidden');
  }
  function hideHairline(){
    if(hairlineEl) hairlineEl.setAttribute('x1',-10);
    if(tooltipEl) tooltipEl.classList.add('hidden');
  }

  drawInitial();
})();

/* ── Work card mini sparklines ───────────────────────── */
(function initWorkCards(){
  const cards=document.querySelectorAll('.work-card');
  const datasets=[[12,15,13,18,16,22,19,25],[8,10,9,14,11,8,12,16],[20,18,22,19,24,21,26,23],[15,18,22,25,20,28,24,31]];

  const io=new IntersectionObserver(entries=>{
    entries.forEach((entry,_)=>{
      if(!entry.isIntersecting)return;
      const card=entry.target;
      card.classList.remove('wc-hidden');
      card.classList.add('wc-visible');
      io.unobserve(card);
    });
  },{threshold:.15});

  cards.forEach((card,i)=>{
    card.style.position='relative';
    card.classList.add('wc-hidden');

    /* Live dot */
    const dot=document.createElement('div');
    dot.className='wc-live-dot'+(i<2?' active':'');
    card.appendChild(dot);

    /* Mini sparkline */
    const data=datasets[i]||datasets[0];
    const NS='http://www.w3.org/2000/svg';
    const s=document.createElementNS(NS,'svg');
    s.setAttribute('viewBox','0 0 60 28');
    s.setAttribute('preserveAspectRatio','none');
    s.classList.add('wc-sparkline');
    const path=document.createElementNS(NS,'path');
    const{d}=buildPath(data,60,28,2);
    path.setAttribute('d',d);
    s.appendChild(path); card.appendChild(s);

    /* Draw-on when visible */
    const observer=new IntersectionObserver(ents=>{
      ents.forEach(e=>{
        if(!e.isIntersecting) {
          path.style.strokeDasharray = '1000';
          path.style.strokeDashoffset = '1000';
          return;
        }
        if(!_RM) setDashDraw(path,1000,i*80);
      });
    },{threshold:.15});
    observer.observe(card);
    io.observe(card);
  });
})();

/* ── Pipeline animation ──────────────────────────────── */
(function initPipeline(){
  const pipeline=document.getElementById('pipeline'); if(!pipeline) return;
  const nodes=pipeline.querySelectorAll('.pipe-node');
  const connectors=pipeline.querySelectorAll('.pipe-connector');
  const particles=pipeline.querySelectorAll('.pipe-particle');

  let pipelineRan = false;
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) {
         nodes.forEach(n=>n.classList.remove('in'));
         connectors.forEach(c=>c.classList.remove('in'));
         particles.forEach(p=>p.classList.remove('running'));
         pipelineRan = false;
         return;
      }
      if(!pipelineRan) {
         pipelineRan = true;
         runPipeline();
      }
    });
  },{threshold:.15});
  io.observe(pipeline);

  function runPipeline(){
    if(_RM){
      nodes.forEach(n=>n.classList.add('in'));
      connectors.forEach(c=>c.classList.add('in'));
      particles.forEach((p,i)=>startParticle(p,connectors[i],i));
      return;
    }
    /* Node 1 appears first */
    nodes[0].classList.add('in');
    connectors.forEach((conn,i)=>{
      const delay=300+i*300;
      setTimeout(()=>{
        conn.classList.add('in');
        if(nodes[i+1]) setTimeout(()=>nodes[i+1].classList.add('in'),200);
        startParticle(particles[i],conn,i);
      },delay);
    });
  }

  /* Staggered start offsets per particle */
  function startParticle(dot,conn,idx){
    if(!dot||!conn) return;
    dot.classList.add('running');
    const staggerOffset=idx/connectors.length; /* 0, 0.25, 0.5, 0.75 */
    const dur=2800;
    const startDelay=staggerOffset*dur;
    let startTime=null;

    function step(ts){
      if(!startTime) startTime=ts-startDelay;
      const elapsed=(ts-startTime)%dur;
      const t=elapsed/dur;
      /* ease-in-out */
      const ease=t<.5?2*t*t:-1+(4-2*t)*t;
      const connW=conn.offsetWidth||60;
      dot.style.left=(ease*100)+'%';
      requestAnimationFrame(step);
    }
    setTimeout(()=>requestAnimationFrame(step),_RM?0:600+idx*300);
  }
})();

/* ── Case study before/after charts ─────────────────── */
(function initCaseCharts(){
  const studies=[
    { id:'study-1', before:[20,21,20,19,20,19], after:[22,26,29,32,34,36], label:'Model deployed', stat:'.big-num' },
    { id:'study-2', before:[44,43,44,43,42,41], after:[38,34,31,29,28,27], label:'Model deployed', stat:'.big-num' },
  ];

  studies.forEach(cfg=>{
    const block=document.getElementById(cfg.id); if(!block) return;
    const wrap=block.querySelector('.study-mini-chart'); if(!wrap) return;
    /* Replace canvas with SVG */
    wrap.innerHTML='';
    const NS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(NS,'svg');
    svg.setAttribute('viewBox','0 0 200 80');
    svg.setAttribute('preserveAspectRatio','none');
    svg.classList.add('cs-svg');

    const allData=[...cfg.before,...cfg.after];
    const split=cfg.before.length;
    const W=200,H=80,PAD=6;
    const n=allData.length;
    const min=Math.min(...allData),max=Math.max(...allData),rY=max-min||1;
    const pts=allData.map((v,i)=>({x:PAD+(i/(n-1))*(W-PAD*2),y:H-PAD-((v-min)/rY)*(H-PAD*2)}));
    const cp=(W-PAD*2)/(n-1)*.38;

    function segPath(from,to){
      let d=`M${pts[from].x.toFixed(1)},${pts[from].y.toFixed(1)}`;
      for(let i=from+1;i<=to;i++) d+=` C${(pts[i-1].x+cp).toFixed(1)},${pts[i-1].y.toFixed(1)} ${(pts[i].x-cp).toFixed(1)},${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
      return d;
    }

    /* Before path */
    const bPath=document.createElementNS(NS,'path');
    bPath.setAttribute('d',segPath(0,split-1));
    bPath.classList.add('cs-before-line');
    /* After path */
    const aPath=document.createElementNS(NS,'path');
    aPath.setAttribute('d',segPath(split-1,n-1));
    aPath.classList.add('cs-after-line');
    /* Marker */
    const marker=document.createElementNS(NS,'line');
    marker.setAttribute('x1',pts[split-1].x); marker.setAttribute('x2',pts[split-1].x);
    marker.setAttribute('y1',PAD); marker.setAttribute('y2',H-PAD);
    marker.classList.add('cs-marker');
    const mlabel=document.createElementNS(NS,'text');
    mlabel.setAttribute('x',pts[split-1].x+3); mlabel.setAttribute('y',PAD+10);
    mlabel.classList.add('cs-marker-label');
    mlabel.textContent=cfg.label;

    svg.append(bPath,aPath,marker,mlabel);
    wrap.appendChild(svg);

    /* Animate on IO */
    let chartRan = false;
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(!e.isIntersecting) {
           marker.classList.remove('in');
           mlabel.classList.remove('in');
           bPath.style.strokeDasharray = '800';
           bPath.style.strokeDashoffset = '800';
           aPath.style.strokeDasharray = '900';
           aPath.style.strokeDashoffset = '900';
           chartRan = false;
           return;
        }
        if(chartRan) return;
        chartRan = true;
        
        if(_RM){ marker.classList.add('in'); mlabel.classList.add('in'); return; }
        /* Phase 1: before draws */
        setDashDraw(bPath,800,0,()=>{
          /* Phase 2: marker */
          marker.classList.add('in'); mlabel.classList.add('in');
          /* Phase 3: after draws + stat counts */
          setTimeout(()=>{
            setDashDraw(aPath,900,0,()=>{
              const statEl=block.querySelector(cfg.stat); if(!statEl) return;
              const raw=statEl.textContent.replace(/[^0-9]/g,'');
              const target=parseInt(raw)||0;
              const prefix=statEl.textContent.match(/^[^0-9]*/)?.[0]||'';
              const suffix=statEl.textContent.replace(prefix,'').replace(raw,'');
              const dur=600,t0=performance.now();
              (function step(now){
                const p=Math.min((now-t0)/dur,1);
                statEl.textContent=prefix+Math.round(target*(1-Math.pow(1-p,3)))+suffix;
                if(p<1)requestAnimationFrame(step);
              })(t0);
            });
          },300);
        });
      });
    },{threshold:.15});
    io.observe(wrap);
  });
})();
