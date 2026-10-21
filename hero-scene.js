/* Animated 3D surface projected onto a 2D canvas. All geometry is generated locally. */
(() => {
  'use strict';
  const canvas = document.getElementById('hero-canvas');
  const hero = document.querySelector('.landing-hero');
  const button = document.getElementById('scene-motion');
  const ctx = canvas?.getContext('2d');
  if (!ctx || !hero || !button) { if (button) button.hidden = true; return; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 1, height = 1, scale = 1, centerX = 0, centerY = 0;
  let running = !reduced.matches, visible = true, frame = 0, clock = 0, last = 0;
  let pointerX = 0, pointerY = 0, tiltX = 0, tiltY = 0;
  const tau = Math.PI * 2;
  const columns = 64, rows = 14;
  const fractions = Array.from({length: columns},(_,i) => i / columns * tau);
  const tube = Array.from({length: rows},(_,i) => i / rows * tau);
  function resize() {
    const rect = hero.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1,1.6);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const narrow = width <= 760;
    centerX = width * (narrow ? .5 : .745);
    centerY = height * (narrow ? .675 : .48);
    scale = narrow ? Math.min(width*.245,140) : Math.min(height*.225,width*.155);
    if (!frame) draw();
  }
  function transform(x,y,z) {
    const yaw = .4 + clock*.115 + tiltX*.15;
    const pitch = 1.08 + tiltY*.17;
    const roll = -.43 + Math.sin(clock*.16)*.055;
    const a = x*Math.cos(yaw) + z*Math.sin(yaw);
    const b = -x*Math.sin(yaw) + z*Math.cos(yaw);
    const c = y*Math.cos(pitch) - b*Math.sin(pitch);
    const d = y*Math.sin(pitch) + b*Math.cos(pitch);
    return {x:a*Math.cos(roll)-c*Math.sin(roll),y:a*Math.sin(roll)+c*Math.cos(roll),z:d};
  }
  function project(p) {
    const perspective = 5.5 / (5.5 + p.z);
    return {x:centerX+p.x*scale*perspective,y:centerY+p.y*scale*perspective,z:p.z,k:perspective};
  }
  function sphere(p,r,warm=false) {
    const q = project(p), size = r*scale*q.k;
    const gradient = ctx.createRadialGradient(q.x-size*.32,q.y-size*.38,size*.05,q.x,q.y,size);
    gradient.addColorStop(0,warm ? '#f6dfb5' : '#e4edcf');
    gradient.addColorStop(.48,warm ? '#d7ae79' : '#adc397');
    gradient.addColorStop(1,warm ? '#b68150' : '#728f62');
    ctx.beginPath(); ctx.arc(q.x,q.y,size,0,tau); ctx.fillStyle=gradient; ctx.fill();
  }
  function draw() {
    ctx.clearRect(0,0,width,height);
    tiltX += (pointerX-tiltX)*.045; tiltY += (pointerY-tiltY)*.045;
    ctx.save(); ctx.translate(centerX,centerY+scale*1.52); ctx.scale(1,.19);
    const localShadow=ctx.createRadialGradient(0,0,0,0,0,scale*2.3);
    localShadow.addColorStop(0,'rgba(104,132,79,.17)'); localShadow.addColorStop(1,'rgba(104,132,79,0)');
    ctx.fillStyle=localShadow; ctx.beginPath(); ctx.arc(0,0,scale*2.3,0,tau); ctx.fill(); ctx.restore();
    // A perspective ground grid establishes depth without adding a chart container.
    ctx.strokeStyle='rgba(110,140,88,.08)'; ctx.lineWidth=.6;
    for(let i=-5;i<=5;i++) {
      ctx.beginPath(); ctx.moveTo(centerX+i*scale*.18,centerY+scale*.65); ctx.lineTo(centerX+i*scale*.66,centerY+scale*2.2); ctx.stroke();
    }
    for(let i=0;i<7;i++) {
      const f=i/6, y=centerY+scale*(.68+1.45*f*f);
      ctx.beginPath(); ctx.moveTo(centerX-scale*(1+f*2),y); ctx.lineTo(centerX+scale*(1+f*2),y); ctx.stroke();
    }
    const orbit=[];
    for(let i=0;i<=100;i++) {
      const u=i/100*tau;
      orbit.push(project(transform(Math.cos(u)*2.12,.24*Math.sin(u*2+clock*.2),Math.sin(u)*2.12)));
    }
    ctx.beginPath(); orbit.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
    ctx.strokeStyle='rgba(106,138,85,.23)'; ctx.lineWidth=.8; ctx.stroke();
    const vertices=[];
    for(let i=0;i<columns;i++) {
      const u=fractions[i], major=1.29+.07*Math.cos(u*3+clock*.2), minor=.35+.055*Math.sin(u*3-clock*.26);
      for(let j=0;j<rows;j++) {
        const v=tube[j], radial=major+minor*Math.cos(v);
        const p=transform(radial*Math.cos(u),minor*Math.sin(v)+.12*Math.sin(u*2+clock*.23),radial*Math.sin(u));
        const normal=transform(Math.cos(v)*Math.cos(u),Math.sin(v),Math.cos(v)*Math.sin(u));
        vertices.push({...project(p),normal});
      }
    }
    const faces=[];
    for(let i=0;i<columns;i++) for(let j=0;j<rows;j++) {
      const a=vertices[i*rows+j], b=vertices[((i+1)%columns)*rows+j], c=vertices[((i+1)%columns)*rows+(j+1)%rows], d=vertices[i*rows+(j+1)%rows];
      faces.push({points:[a,b,c,d],z:(a.z+b.z+c.z+d.z)/4,normal:a.normal,u:i/columns});
    }
    faces.sort((a,b)=>b.z-a.z);
    const satellites = Array.from({length:9},(_,i)=>{
      const u=i/9*tau+clock*(i%2 ? .07 : -.05),r=1.96+(i%3)*.12;
      return {p:transform(r*Math.cos(u),.24*Math.sin(u*2)+.05*Math.cos(clock*.4+i),r*Math.sin(u)),r:i%3===0 ? .085 : .045,warm:i%3===0};
    });
    satellites.filter(s=>s.p.z>=0).forEach(s=>sphere(s.p,s.r,s.warm));
    for(const face of faces) {
      const n=face.normal;
      const diffuse=Math.max(0,-n.x*.34-n.y*.54-n.z*.77);
      const highlight=Math.pow(Math.max(0,-n.z*.85-n.y*.52),16);
      const light=.28+diffuse*.67;
      const base=[128+light*103+highlight*18,154+light*91+highlight*13,113+light*105+highlight*20];
      ctx.beginPath(); face.points.forEach((p,i)=>i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y)); ctx.closePath();
      ctx.fillStyle=`rgb(${base.map(v=>Math.min(253,Math.round(v))).join(',')})`; ctx.fill();
      ctx.strokeStyle=`rgba(77,111,68,${.12+diffuse*.08})`; ctx.lineWidth=.55; ctx.stroke();
    }
    satellites.filter(s=>s.p.z<0).forEach(s=>sphere(s.p,s.r,s.warm));
    // Sparse points surround the surface, with perspective used for their radius.
    for(let i=0;i<24;i++) {
      const u=i*2.399963+clock*.025, r=1.9+(i%5)*.13;
      const p=project(transform(Math.cos(u)*r,Math.sin(i*1.7)*.7,Math.sin(u)*r));
      ctx.beginPath(); ctx.arc(p.x,p.y,(i%4===0 ? 2.4 : 1.3)*p.k,0,tau); ctx.fillStyle=i%5===0 ? '#c7a478' : 'rgba(123,154,97,.45)'; ctx.fill();
    }
    hero.classList.add('scene-ready');
  }
  function animate(now) {
    frame=0;
    if(!running || !visible || document.hidden) return;
    if(!last || now-last>=32) {
      const delta=last ? Math.min((now-last)/1000,.06) : 0;
      clock+=delta; last=now; draw();
    }
    frame=requestAnimationFrame(animate);
  }
  function schedule() { if(running && visible && !document.hidden && !frame) {last=0;frame=requestAnimationFrame(animate);} }
  function updateButton() {button.setAttribute('aria-pressed',String(!running));button.innerHTML=running ? '暂停动画 <span aria-hidden="true">Ⅱ</span>' : '播放动画 <span aria-hidden="true">▷</span>';}
  button.addEventListener('click',()=>{running=!running;if(!running){cancelAnimationFrame(frame);frame=0;}else schedule();updateButton();});
  hero.addEventListener('pointermove',event=>{const r=hero.getBoundingClientRect();pointerX=(event.clientX-r.left)/r.width*2-1;pointerY=(event.clientY-r.top)/r.height*2-1;},{passive:true});
  hero.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();});
  reduced.addEventListener('change',event=>{running=!event.matches;if(!running){cancelAnimationFrame(frame);frame=0;draw();}else schedule();updateButton();});
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(frame);frame=0;}else schedule();},{threshold:.02}).observe(hero);
  resize(); updateButton(); schedule();
})();
