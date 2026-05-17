'use strict';

(function initHeroFlow() {
  const canvas = document.getElementById('hero-flow-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  
  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  window.addEventListener('resize', resize);
  resize();

  const lines = [];
  for (let i = 0; i < 5; i++) {
    lines.push({
      yOffset: Math.random() * height,
      amplitude: Math.random() * 40 + 20,
      frequency: Math.random() * 0.002 + 0.001,
      speed: Math.random() * 0.001 + 0.0005,
      phase: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.3 + 0.1
    });
  }

  function draw(time) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    ctx.clearRect(0, 0, width, height);
    
    lines.forEach(line => {
      ctx.beginPath();
      for (let x = 0; x < width; x += 5) {
        const y = Math.sin(x * line.frequency + time * line.speed + line.phase) * line.amplitude + (height/2);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(29, 158, 117, ${line.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

(function initStackCards() {
  const cards = document.querySelectorAll('.stack-card');
  if (!cards.length) return;

  // Generate Supply Chain Nodes
  const supplyGroup = document.querySelector('#svg-supply .s-nodes');
  if (supplyGroup) {
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 300 + 50;
      const y = Math.random() * 200 + 50;
      supplyGroup.innerHTML += `<circle cx="${x}" cy="${y}" r="3" fill="#555" class="sn-node" />`;
      if (i > 0) {
         supplyGroup.innerHTML += `<line x1="${x}" y1="${y}" x2="200" y2="150" stroke="#1D9E75" stroke-width="0.5" opacity="0.3" class="sn-line" stroke-dasharray="200" stroke-dashoffset="200"/>`;
      }
    }
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const id = e.target.id;
      
      if (!e.isIntersecting) {
        if (id === 'sc-1') {
          const d = e.target.querySelector('.s-demand');
          const s = e.target.querySelector('.s-supply');
          const dot = e.target.querySelector('.s-dot');
          const txt = e.target.querySelector('.s-text');
          if(d) d.style.strokeDashoffset = '1000';
          if(s) s.style.strokeDashoffset = '1000';
          if(dot) dot.setAttribute('r', '0');
          if(txt) txt.style.opacity = '0';
        }
        if (id === 'sc-2') {
          const ret = e.target.querySelector('.s-retention');
          const txt = e.target.querySelector('.s-text');
          if(ret) ret.style.strokeDashoffset = '1500';
          if(txt) txt.style.opacity = '0';
        }
        if (id === 'sc-3') {
          const lines = e.target.querySelectorAll('.sn-line');
          const nodes = e.target.querySelectorAll('.sn-node');
          lines.forEach(l => l.style.strokeDashoffset = '200');
          nodes.forEach(n => n.setAttribute('fill', '#555'));
        }
        return;
      }
      
      if (id === 'sc-1') {
        const d = e.target.querySelector('.s-demand');
        const s = e.target.querySelector('.s-supply');
        const dot = e.target.querySelector('.s-dot');
        const txt = e.target.querySelector('.s-text');
        if(d) d.style.strokeDashoffset = '0';
        if(s) setTimeout(() => s.style.strokeDashoffset = '0', 400);
        if(dot) setTimeout(() => dot.setAttribute('r', '6'), 1200);
        if(txt) setTimeout(() => txt.style.opacity = '1', 1200);
      }
      
      if (id === 'sc-2') {
        const ret = e.target.querySelector('.s-retention');
        const txt = e.target.querySelector('.s-text');
        if(ret) ret.style.strokeDashoffset = '0';
        if(txt) setTimeout(() => txt.style.opacity = '1', 1000);
      }

      if (id === 'sc-3') {
        const lines = e.target.querySelectorAll('.sn-line');
        const nodes = e.target.querySelectorAll('.sn-node');
        lines.forEach((l, i) => setTimeout(() => l.style.strokeDashoffset = '0', i * 30));
        nodes.forEach((n, i) => setTimeout(() => n.setAttribute('fill', '#1D9E75'), i * 30));
      }
      
    });
  }, { threshold: 0.5 });

  cards.forEach(c => io.observe(c));

  // Scroll effect (stacking transform & fade)
  window.addEventListener('scroll', () => {
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const topDist = rect.top - (window.innerHeight * 0.12); // distance from sticky point
      
      if (topDist <= 0) {
        // Card is stuck at the top
        const nextCard = cards[index + 1];
        if (nextCard) {
           const nextRect = nextCard.getBoundingClientRect();
           
           if (nextRect.top < window.innerHeight) {
              const progress = 1 - (nextRect.top / window.innerHeight);
              const scale = 1 - (progress * 0.05);
              // Fade out precisely as the next card covers it (at 0.12 progress left)
              const opacity = Math.max(0, 1 - (progress / 0.88));
              card.style.transform = `scale(${scale})`;
              card.style.opacity = opacity;
           } else {
              card.style.transform = 'scale(1)';
              card.style.opacity = '1';
           }
        }
      } else {
        card.style.transform = 'scale(1)';
        card.style.opacity = '1';
      }
    });
  });
})();

(function initAboutTerminal() {
  const terminal = document.getElementById('about-terminal');
  if (!terminal) return;
  const lines = terminal.querySelectorAll('.about-type-line');
  if (!lines.length) return;

  const isReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReduced) {
    lines.forEach(l => l.textContent = l.dataset.text || '');
    return;
  }

  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      io.disconnect();
      let currentLine = 0;
      
      function typeLine() {
        if (currentLine >= lines.length) return;
        const line = lines[currentLine];
        const text = line.dataset.text || '';
        let charIndex = 0;
        
        // Add cursor
        line.innerHTML = '<span class="term-cursor" style="border-right: 2px solid var(--accent); padding-right: 2px; animation: blink 1s infinite;"></span>';
        const cursor = line.querySelector('.term-cursor');

        function typeChar() {
          if (charIndex < text.length) {
            cursor.insertAdjacentText('beforebegin', text.charAt(charIndex));
            charIndex++;
            setTimeout(typeChar, Math.random() * 15 + 10);
          } else {
            cursor.remove();
            currentLine++;
            setTimeout(typeLine, 200);
          }
        }
        typeChar();
      }
      setTimeout(typeLine, 300);
    }
  }, { threshold: 0.3 });
  
  io.observe(terminal);
})();
