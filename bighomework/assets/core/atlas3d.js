/* Small, dependency-free 3D mesh renderer. All equipment is modelled in world
   coordinates, depth-sorted and projected after camera rotation. No image planes. */
(function(g){
  'use strict';
  const A=g.ATLAS, esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function html(){return '<section class="atlas3d-section"><div class="wrap"><div class="atlas3d-heading"><div><span class="section-label">石油全流程 · 交互沙盘</span><h2>从地表，走进每一道工序</h2></div><p>旋转井场，选择设备旁的环节标记。每个区域都连接具体案例，沿着作业链逐步打开实验。</p></div><div class="atlas3d-layout"><div class="atlas3d-view"><canvas aria-label="石油作业三维模型，可拖拽旋转；下方提供全部环节的键盘导航" tabindex="0"></canvas><div class="atlas3d-labels"></div><div class="atlas3d-note">13 个环节 / 61 个场景　·　概念模型，非工程比例</div><div class="atlas3d-controls"><button data-camera="left" aria-label="向左旋转">↶ 旋转</button><button data-camera="right" aria-label="向右旋转">旋转 ↷</button><button data-camera="zoom-in" aria-label="放大模型">＋</button><button data-camera="zoom-out" aria-label="缩小模型">－</button><button data-camera="reset">复位</button><button data-camera="tour" aria-pressed="false">自动导览</button></div></div><aside class="atlas3d-panel" aria-live="polite"></aside></div><nav class="atlas3d-stages" aria-label="三维作业环节">'+A.stages.map(s=>'<button data-stage3d="'+s.id+'" aria-pressed="false">'+String(s.idx).padStart(2,'0')+' '+s.name+'</button>').join('')+'</nav><p class="atlas3d-tip">拖拽旋转 · 方向键调整视角 · ＋ / －缩放 · 点击环节后选择案例演示</p></div></section>';}
  function mount(root){
    const box=root.querySelector('.atlas3d-view');if(!box)return;
    const cv=box.querySelector('canvas'),ctx=cv.getContext('2d'),labels=box.querySelector('.atlas3d-labels'),panel=root.querySelector('.atlas3d-panel');
    let yaw=-.38,tilt=.63,zoom=1,selected=0,w=0,h=0,raf=0,visible=true,dead=false,tour=false,last=0,tourTime=0,drag=null;
    const meshes=[],wires=[],hubs=[[-9,-4],[-5,-4],[-1,-4],[3,-4],[7,-4],[-9,0],[-5,0],[-1,0],[3,0],[7,0],[-6,4],[0,4],[7,4]];
    let ground=false;
    function face(v,c){meshes.push({v,c,layer:ground?0:1});}
    function poly(v,c){face(v,c);}
    function cube(x,y,z,sx,sy,sz,c){const p=[[x-sx/2,y,z-sz/2],[x+sx/2,y,z-sz/2],[x+sx/2,y,z+sz/2],[x-sx/2,y,z+sz/2],[x-sx/2,y+sy,z-sz/2],[x+sx/2,y+sy,z-sz/2],[x+sx/2,y+sy,z+sz/2],[x-sx/2,y+sy,z+sz/2]];[[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach((f,i)=>face(f.map(k=>p[k]),shade(c,[.73,.86,.65,.78,1.13][i])));}
    function shade(c,s){const n=parseInt(c.slice(1),16);return '#'+[n>>16,(n>>8)&255,n&255].map(v=>Math.min(255,Math.round(v*s)).toString(16).padStart(2,'0')).join('');}
    function cylinder(x,y,z,r,ht,c,n=14){const a=[],b=[];for(let i=0;i<n;i++){let t=i/n*Math.PI*2;a.push([x+Math.cos(t)*r,y,z+Math.sin(t)*r]);b.push([x+Math.cos(t)*r,y+ht,z+Math.sin(t)*r]);}for(let i=0;i<n;i++)face([a[i],a[(i+1)%n],b[(i+1)%n],b[i]],shade(c,.72+.24*Math.sin(i/n*6.28)));face(b,shade(c,1.12));}
    function beam(a,b,r,c){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz),u=Math.abs(dy)/len<.9?[0,1,0]:[1,0,0];let v=[dy*u[2]-dz*u[1],dz*u[0]-dx*u[2],dx*u[1]-dy*u[0]],vl=Math.hypot(...v);v=v.map(k=>k/vl*r);let t=[dy*v[2]-dz*v[1],dz*v[0]-dx*v[2],dx*v[1]-dy*v[0]],tl=Math.hypot(...t);t=t.map(k=>k/tl*r);const aa=[],bb=[];for(let i=0;i<6;i++){const an=i*Math.PI/3,off=v.map((k,j)=>k*Math.cos(an)+t[j]*Math.sin(an));aa.push(a.map((k,j)=>k+off[j]));bb.push(b.map((k,j)=>k+off[j]));}for(let i=0;i<6;i++)face([aa[i],aa[(i+1)%6],bb[(i+1)%6],bb[i]],shade(c,.72+i*.07));}
    function line(a,b,c,width=1){wires.push({a,b,c,width});}
    function tower(x,z,ht=3.5){const base=1.15,cap=.3;cube(x,.1,z,2,.15,1.8,'#c3b287');for(let a of [-1,1])for(let b of [-1,1]){beam([x+a*base/2,.25,z+b*base/2],[x+a*cap/2,ht,z+b*cap/2],.045,'#b8793d');}for(let j=0;j<5;j++){const y=.25+j*(ht-.25)/5,r=base/2*(1-j/5)+cap/2*j/5,r2=base/2*(1-(j+1)/5)+cap/2*(j+1)/5;for(let s of [-1,1]){beam([x-r,y,z+s*r],[x+r2,y+(ht-.25)/5,z+s*r2],.025,'#a48152');beam([x+s*r,y,z-r],[x+s*r2,y+(ht-.25)/5,z+r2],.025,'#a48152');}}cube(x,ht,z,.65,.17,.65,'#355c5c');beam([x,0,z],[x,ht,z],.035,'#d3d5ce');}
    function house(x,z,c='#e1d6b7'){cube(x,.13,z,1.9,.75,1.25,c);cube(x,.9,z,2.05,.15,1.4,'#397c79');for(let i=0;i<3;i++)cube(x-.65+i*.65,.43,z+.64,.3,.25,.025,'#486e73');}
    function truck(x,z){cube(x,.33,z,1.65,.5,.75,'#daaa49');cube(x-.65,.8,z,.5,.3,.7,'#295f64');for(let i of [-.6,.6])for(let j of [-.42,.42])cylinder(x+i,.12,z+j,.18,.14,'#354747',8);}
    function pump(x,z){cube(x,.08,z,1.9,.18,1.5,'#bdc3ac');beam([x-.5,.2,z],[x,1.65,z],.09,'#3e8883');beam([x+.5,.2,z],[x,1.65,z],.09,'#3e8883');beam([x-.8,1.5,z],[x+1,1.9,z],.11,'#cb923c');beam([x+1,1.9,z],[x+1,.1,z],.035,'#788884');cylinder(x-.5,.2,z+.32,.35,.4,'#294d50');}
    // Sedimentary cutaway slab and three sandstone beds.
    ground=true;
    cube(-.4,-1.75,0,24,1.75,11.9,'#d1bd91');
    [['#a18e6a',-.45,.16],['#e2cf9f',-.8,.2],['#8c8670',-1.1,.15],['#c9ab75',-1.5,.2]].forEach(([c,y,sy])=>cube(-.4,y,0,24.02,sy,11.92,c));
    cube(-.4,0,0,24.1,.12,12,'#a8b298');
    // Roads divide the operations; pipelines link the three production areas.
    cube(-.4,.13,-2,23.5,.035,.5,'#cdd1b7');cube(-.4,.13,2,23.5,.035,.5,'#cdd1b7');
    for(let x=-11;x<11;x+=1.4){cube(x,.17,-2,.65,.015,.035,'#eff1d8');cube(x,.17,2,.65,.015,.035,'#eff1d8');}
    ground=false;
    beam([-10,.35,5.55],[10.4,.35,5.55],.105,'#2c8d83');beam([10.4,.35,-4.7],[10.4,.35,5.55],.105,'#2c8d83');
    hubs.forEach(([x,z],i)=>{ground=true;cube(x,.14,z,3.15,.05,2.6,i<5?'#bac5ab':i<11?'#b1c6b5':'#c7c6b0');ground=false;
      if(i===0){for(let j=0;j<4;j++){let xx=x-.95+j*.6;const s=.85+j*.05;poly([[xx-s,.2,z+.7],[xx+s,.2,z+.7],[xx+s,.2,z-.6],[xx,.9+(j%2)*.55,z-.15]],['#8e9d78','#a9ab7b','#c4b78c','#8e9d78'][j]);}beam([x+.9,.2,z+.7],[x+.9,1.5,z+.7],.04,'#c27b37');}
      if(i===1){truck(x-.4,z-.3);for(let j=0;j<7;j++){cylinder(x-1.2+j*.4,.2,z+.85,.075,.2,'#247f74',7);}line([x-1.25,.4,z+.85],[x+1.3,.4,z+.85],'#708763');}
      if(i===2){tower(x,z,3.6);house(x+1.1,z+.3);}
      if(i===3){house(x-.4,z);cylinder(x+1,.2,z+.2,.33,.75,'#cda760');cube(x-.8,1.1,z,.6,.14,.6,'#45746c');}
      if(i===4){truck(x-.4,z);cylinder(x+.75,.15,z,.45,.8,'#448a85');beam([x+.75,.15,z],[x+.75,2,z],.04,'#927857');}
      if(i===5){truck(x-.3,z);for(let j=0;j<2;j++)cylinder(x+.75,.15,z-.6+j*1.2,.37,1.2,'#d7dbcb');}
      if(i===6){beam([x,.2,z],[x,2,z],.11,'#3a8781');for(let j=0;j<3;j++){beam([x-.6,.6+j*.5,z],[x+.6,.6+j*.5,z],.07,'#337b74');cylinder(x+.65,.55+j*.5,z,.14,.13,'#c39648');}}
      if(i===7){tower(x,z,2.25);cube(x-1,.2,z,1,.5,.8,'#b48d54');}
      if(i===8){pump(x-.35,z);pump(x+.7,z-.5);}
      if(i===9){tower(x+.45,z,2.9);truck(x-.7,z+.5);}
      if(i===10){for(let j=0;j<3;j++){truck(x-1+j*.9,z-.4);cylinder(x-1+j,.15,z+.7,.35,.8,'#b4c9be');}beam([x-1.4,.4,z+1],[x+1.5,.4,z+1],.08,'#357f77');}
      if(i===11){for(let j=0;j<3;j++)cylinder(x-1+j,.16,z+(j%2)*.3,.52,1.25,'#ced7cc');beam([x,.2,z+1],[x,.2,5.55],.1,'#328b81');}
      if(i===12){for(let j=0;j<3;j++){let xx=x-.85+j*.8;cylinder(xx,.15,z-.3,.29,2+j*.4,'#c2ceca');for(let k=0;k<5;k++)cylinder(xx,.3+k*.4,z-.3,.32,.045,'#718f8c');beam([xx,2+j*.4,z-.3],[xx+.3,2.1+j*.4,z+.3],.06,'#a79566');}house(x,z+1);}
      line([x-1.3,.21,z+1.3],[x+1.3,.21,z+1.3],'#d8d7b1');
    });
    // Borehole outlets on the front geological cutaway.
    for(let x of [-1,3,7])beam([x,-1.35,5.99],[x+1,-1.35,5.99],.055,'#d5a347');
    labels.innerHTML=A.stages.map((s,i)=>'<button data-stage3d="'+s.id+'" aria-pressed="false"><b>'+String(i+1).padStart(2,'0')+'</b>'+s.name+'</button>').join('');
    function select(i){selected=i;const st=A.stages[i];panel.innerHTML='<small>作业环节 '+String(i+1).padStart(2,'0')+' / 13</small><h3>'+st.name+'</h3><p>'+esc(st.blurb)+'</p><nav aria-label="'+st.name+'案例">'+st.scenes.map(sc=>'<a href="#/scene/'+sc.id+'?tab=demo">'+esc(sc.name)+'<span>↗</span></a>').join('')+'</nav><a class="btn sm" href="#/stage/'+st.id+'">查看背景与全部案例 →</a>';root.querySelectorAll('[data-stage3d]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stage3d===st.id)));draw();}
    function project(p){const c=Math.cos(yaw),s=Math.sin(yaw),xx=p[0]*c-p[2]*s,zz=p[0]*s+p[2]*c,yy=p[1]*Math.cos(tilt)-zz*Math.sin(tilt),depth=p[1]*Math.sin(tilt)+zz*Math.cos(tilt),scale=Math.min(w/28,h/16.5)*zoom;return [w*.5+xx*scale,h*.55-yy*scale,depth,scale];}
    function draw(){if(dead||!w)return;ctx.clearRect(0,0,w,h);ctx.save();const shadow=project([-.4,-1.9,0]);ctx.fillStyle='#577b6918';ctx.beginPath();ctx.ellipse(shadow[0],shadow[1]+15,w*.42,h*.2,-yaw*.1,0,Math.PI*2);ctx.fill();ctx.restore();
      meshes.map(f=>{const pp=f.v.map(project);return {pp,c:f.c,layer:f.layer,d:pp.reduce((n,p)=>n+p[2],0)/pp.length};}).sort((a,b)=>a.layer-b.layer||a.d-b.d).forEach(f=>{ctx.beginPath();f.pp.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=f.c;ctx.fill();ctx.strokeStyle=f.c;ctx.lineWidth=.45;ctx.stroke();});
      wires.forEach(l=>{const a=project(l.a),b=project(l.b);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=l.c;ctx.lineWidth=l.width;ctx.stroke();});
      const [sx,sz]=hubs[selected],p=project([sx,.3,sz]),r=p[3]*1.55;ctx.save();ctx.strokeStyle='#e5b24f';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.ellipse(p[0],p[1],r,r*.5,0,0,Math.PI*2);ctx.stroke();ctx.restore();
      labels.querySelectorAll('button').forEach((b,i)=>{const [x,z]=hubs[i],p=project([x, i===2?3.9:i===9?3.2:i===12?3.3:1.7,z]);b.style.left=Math.max(35,Math.min(w-35,p[0]))+'px';b.style.top=Math.max(50,Math.min(h-65,p[1]-5))+'px';b.style.zIndex=String(Math.round(50+p[2]));});
    }
    function size(){const rect=box.getBoundingClientRect(),dpr=Math.min(2,g.devicePixelRatio||1);w=rect.width;h=rect.height;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
    function click(e){const b=e.target.closest('button');if(!b)return;if(b.dataset.stage3d){select(A.stages.findIndex(s=>s.id===b.dataset.stage3d));return;}const a=b.dataset.camera;if(!a)return;if(a==='left')yaw-=.18;if(a==='right')yaw+=.18;if(a==='zoom-in')zoom=Math.min(1.5,zoom+.1);if(a==='zoom-out')zoom=Math.max(.65,zoom-.1);if(a==='reset'){yaw=-.38;tilt=.63;zoom=1;tour=false;}if(a==='tour'){tour=!tour;last=performance.now();if(tour&&!raf)raf=requestAnimationFrame(frame);}root.querySelector('[data-camera=tour]').setAttribute('aria-pressed',String(tour));root.querySelector('[data-camera=tour]').textContent=tour?'暂停导览':'自动导览';draw();}
    function frame(t){raf=0;if(dead||!tour)return;const dt=Math.min(100,t-last);last=t;if(visible){yaw+=dt*.00006;tourTime+=dt;if(tourTime>5000){tourTime=0;select((selected+1)%13);}draw();}raf=requestAnimationFrame(frame);}
    root.addEventListener('click',click);cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId);});cv.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.007;tilt=Math.max(.35,Math.min(.95,tilt+(e.clientY-drag.y)*.004));drag={x:e.clientX,y:e.clientY};draw();});cv.addEventListener('pointerup',()=>drag=null);cv.addEventListener('pointercancel',()=>drag=null);
    cv.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw-=.1;if(e.key==='ArrowRight')yaw+=.1;if(e.key==='ArrowUp')tilt=Math.min(.95,tilt+.05);if(e.key==='ArrowDown')tilt=Math.max(.35,tilt-.05);if(e.key==='+')zoom=Math.min(1.5,zoom+.1);if(e.key==='-')zoom=Math.max(.65,zoom-.1);draw();});
    const resize=new ResizeObserver(size);resize.observe(box);const observer=new IntersectionObserver(es=>visible=es[0].isIntersecting);observer.observe(box);size();select(0);
    return ()=>{dead=true;cancelAnimationFrame(raf);resize.disconnect();observer.disconnect();root.removeEventListener('click',click);};
  }
  g.Atlas3D={html,mount};
})(window);
