const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
for(const button of document.querySelectorAll('.image-detail-toggle')){
 let pinned=false,hovered=false;
 const render=()=>{
  const active=pinned||hovered;
  button.classList.toggle('is-detail',active);
  button.setAttribute('aria-pressed',String(active));
  button.setAttribute('aria-label',`${active?'Show overview':'Show detail'}: ${button.dataset.work}`);
  button.querySelectorAll('img').forEach((img,i)=>img.setAttribute('aria-hidden',String(i===(active?0:1))));
  const figure=button.closest('figure');
  figure.querySelector('.overview-credit').hidden=active;
  figure.querySelector('.detail-credit').hidden=!active;
 };
 button.addEventListener('click',()=>{pinned=!pinned;hovered=false;render();});
 button.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;render();}});
 button.addEventListener('pointerleave',event=>{
  if(event.pointerType==='mouse'){hovered=false;pinned=false;render();}
 });
 button.addEventListener('blur',()=>{pinned=false;render();});
 render();
}
const preview=document.querySelector('.hover-preview');
let previewRow=null;
if(preview){
 let hideTimer; const hide=()=>{clearTimeout(hideTimer);hideTimer=setTimeout(()=>preview.classList.remove('is-visible'),160);};
 for(const row of document.querySelectorAll('.preview-row')){
  const show=event=>{
   if(!matchMedia('(hover: hover) and (min-width: 701px)').matches)return;
   if(document.querySelector('dialog[open]'))return;
   clearTimeout(hideTimer);
   if(previewRow===row&&preview.classList.contains('is-visible'))return;
   previewRow=row;
   preview.querySelector('img').src=row.querySelector('.row-preview-source').src;
   preview.querySelector('img').alt=row.dataset.caption;
   preview.querySelector('span').textContent=row.dataset.caption;
   preview.querySelector('small').textContent=row.dataset.credit;
   preview.classList.add('is-visible');
   const rect=row.getBoundingClientRect();
   const bounds=preview.getBoundingClientRect();
   const x=event.clientX??rect.left+rect.width*.55;
   const y=event.clientY??rect.top;
   const left=x+28+bounds.width<=innerWidth-16?x+28:x-bounds.width-28;
   const topInset=(document.querySelector('header')?.getBoundingClientRect().bottom??74)+12;
   preview.style.left=Math.max(16,Math.min(innerWidth-bounds.width-16,left))+'px';
   preview.style.top=Math.max(topInset,Math.min(innerHeight-bounds.height-16,y-bounds.height*.35))+'px';
  };
  row.addEventListener('pointerenter',show);row.addEventListener('pointermove',show);row.addEventListener('pointerleave',hide);
  row.addEventListener('focusin',show);row.addEventListener('focusout',hide);
 }
 preview.addEventListener('pointerenter',()=>clearTimeout(hideTimer));
 preview.addEventListener('pointerleave',hide);
 window.addEventListener('scroll',hide,{passive:true});
}

const workViewer=document.querySelector('#work-viewer');
if(workViewer){
 let opener=null,restoreFocus=true,gesture=null,wheelDistance=0;
 const closeWork=(scrollDelta=0)=>{
  if(!workViewer.open)return;
  restoreFocus=!scrollDelta;
  workViewer.close();
  if(scrollDelta)window.scrollBy({top:scrollDelta,behavior:'instant'});
 };
 const openWork=row=>{
  if(!row||workViewer.open)return;
  opener=row.querySelector('.work-open');restoreFocus=true;wheelDistance=0;
  const source=row.querySelector('.row-preview-source');
  const large=workViewer.querySelector('.work-viewer-image');
  large.src=source.currentSrc||source.src;large.alt=row.dataset.caption;
  workViewer.querySelector('p').textContent=row.dataset.caption;
  workViewer.querySelector('small').textContent=row.dataset.credit;
  preview?.classList.remove('is-visible');
  workViewer.showModal();
 };
 document.querySelectorAll('.work-open').forEach(button=>button.addEventListener('click',()=>openWork(button.closest('.preview-row'))));
 preview?.querySelector('button').addEventListener('click',()=>openWork(previewRow));
 workViewer.addEventListener('click',()=>closeWork());
 workViewer.addEventListener('close',()=>{
  if(restoreFocus)opener?.focus({preventScroll:true});
  else document.activeElement?.blur();
 });
 workViewer.addEventListener('wheel',event=>{
  if(event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
  event.preventDefault();
  wheelDistance+=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
  if(Math.abs(wheelDistance)>14)closeWork(wheelDistance);
 },{passive:false});
 workViewer.addEventListener('keydown',event=>{
  const step={ArrowDown:64,ArrowUp:-64,PageDown:innerHeight*.75,PageUp:-innerHeight*.75,' ':innerHeight*.75}[event.key];
  if(step&&event.target===workViewer){event.preventDefault();closeWork(step);}
  else if(step&&['ArrowDown','ArrowUp','PageDown','PageUp'].includes(event.key)){event.preventDefault();closeWork(step);}
 });
 // Hand a vertical swipe back to the page, continuing the same finger movement.
 workViewer.addEventListener('touchstart',event=>{
  if(event.touches.length!==1){gesture=null;return;}
  const touch=event.touches[0];
  gesture={x:touch.clientX,y:touch.clientY,lastY:touch.clientY,scrolling:false};
 },{passive:true});
 window.addEventListener('touchmove',event=>{
  if(!gesture)return;
  if(event.touches.length!==1){gesture=null;return;}
  const touch=event.touches[0],dy=gesture.y-touch.clientY;
  if(!gesture.scrolling){
   if(Math.abs(dy)<24||Math.abs(dy)<Math.abs(touch.clientX-gesture.x))return;
   if(event.cancelable)event.preventDefault();
   gesture.scrolling=true;closeWork(dy);
  }else{
   if(event.cancelable)event.preventDefault();
   window.scrollBy({top:gesture.lastY-touch.clientY,behavior:'instant'});
  }
  gesture.lastY=touch.clientY;
 },{passive:false});
 const finishGesture=()=>{gesture=null;};
 window.addEventListener('touchend',finishGesture,{passive:true});
 window.addEventListener('touchcancel',finishGesture,{passive:true});
}

// On small screens a single photograph follows its row through the reading area.
const mobileRows=[...document.querySelectorAll('.preview-row')];
if(mobileRows.length){
 const mobile=matchMedia('(max-width:700px)');
 const visible=new Set();
 let active=null,frame=0;
 mobileRows.forEach(row=>row.querySelector('.row-preview-source').removeAttribute('hidden'));
 const select=row=>{
  if(row===active)return;
  active?.classList.remove('is-scroll-preview');active=row;
  if(active){active.querySelector('img').loading='eager';active.classList.add('is-scroll-preview');}
 };
 const update=()=>{
  frame=0;
  if(!mobile.matches||document.querySelector('dialog[open]')){select(null);return;}
  const target=innerHeight*.48;
  let closest=null,distance=Infinity;
  for(const row of visible){
   const rect=row.getBoundingClientRect(),delta=Math.abs((rect.top+rect.bottom)/2-target);
   if(rect.bottom>innerHeight*.25&&rect.top<innerHeight*.72&&delta<distance){closest=row;distance=delta;}
  }
  select(closest);
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(entry.isIntersecting){visible.add(entry.target);if(mobile.matches)entry.target.querySelector('img').loading='eager';}
   else visible.delete(entry.target);
  });schedule();
 },{rootMargin:'160px 0px',threshold:0});
 mobileRows.forEach(row=>observer.observe(row));
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule);mobile.addEventListener('change',schedule);
 document.querySelector('#site-menu')?.addEventListener('toggle',schedule);
 document.querySelector('#work-viewer')?.addEventListener('toggle',schedule);
 document.querySelector('#work-viewer')?.addEventListener('close',schedule);
}
const viewer=document.querySelector('#image-viewer');let trigger;
if(viewer){
 document.querySelectorAll('.image-open').forEach(button=>button.addEventListener('click',()=>{
  trigger=button;const img=button.querySelector('img');viewer.querySelector('img').src=img.currentSrc||img.src;viewer.querySelector('img').alt=img.alt;viewer.querySelector('p').textContent=button.dataset.caption||img.alt;viewer.querySelector('.viewer-credit').textContent=button.dataset.credit||'';viewer.showModal();
 }));
 document.querySelector('#close-viewer').addEventListener('click',()=>viewer.close());
 viewer.addEventListener('click',event=>{if(event.target===viewer){const r=viewer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)viewer.close();}});
 viewer.addEventListener('close',()=>trigger?.focus({preventScroll:true}));
}
const practiceGallery=document.querySelector('.practice-gallery');
if(practiceGallery){
 const slides=[...practiceGallery.querySelectorAll('.practice-slide')];
 const status=practiceGallery.querySelector('.practice-status');
 let current=0;
 const alignArrows=()=>practiceGallery.style.setProperty('--practice-displayed-height',slides[current].querySelector('.practice-media').getBoundingClientRect().height+'px');
 const showSlide=(index,announce=true)=>{
  const moveFocus=slides[current]?.contains(document.activeElement);
  current=(index+slides.length)%slides.length;
  slides.forEach((slide,i)=>{
   slide.hidden=i!==current;
   const frame=slide.querySelector('iframe');
   if(frame){
    // Load the map only when selected, and stop its audio when leaving it.
    if(i===current&&!frame.hasAttribute('src'))frame.src=frame.dataset.src;
    else if(i!==current&&frame.hasAttribute('src'))frame.removeAttribute('src');
   }
  });
  // Load the visible photograph and the next one before the next click.
  for(const i of [current,(current+1)%slides.length]){
   const img=slides[i].querySelector('img');if(img)img.loading='eager';
  }
  if(announce)status.textContent=slides[current].getAttribute('aria-label');
  if(moveFocus)slides[current].querySelector('.image-open,iframe').focus({preventScroll:true});
  alignArrows();
 };
 const showHash=()=>{
  const index=slides.findIndex(slide=>'#'+slide.id===location.hash);
  if(index>=0)showSlide(index,false);
 };
 practiceGallery.querySelector('.practice-previous').addEventListener('click',()=>showSlide(current-1));
 practiceGallery.querySelector('.practice-next').addEventListener('click',()=>showSlide(current+1));
 practiceGallery.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
   event.preventDefault();showSlide(current+(event.key==='ArrowRight'?1:-1));
  }
 });
 window.addEventListener('hashchange',showHash);
 new ResizeObserver(alignArrows).observe(practiceGallery);
 showSlide(0,false);showHash();
}
const carousel=document.querySelector('.selected-grid');
if(carousel){
 const cards=[...carousel.children];
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const narrowCarousel=matchMedia('(max-width:700px)');
 let cardBounds=[],mobileHeight=0;
 const fitVisibleCards=()=>{
  if(!narrowCarousel.matches){carousel.style.removeProperty('--mobile-carousel-height');mobileHeight=0;return;}
  const left=carousel.scrollLeft,right=left+carousel.clientWidth;
  const height=Math.ceil(Math.max(0,...cardBounds.filter(card=>card.right>left&&card.left<right).map(card=>card.height)));
  if(height&&height!==mobileHeight){mobileHeight=height;carousel.style.setProperty('--mobile-carousel-height',height+'px');}
 };
 let offsets=[],maxScroll=0,autoOffset=0,direction=1;
 let paused=motion.matches,hovered=false,touching=false,inView=false;
 let resumeAt=performance.now()+1800,lastTime=0;
 let drag=null,velocity=0,suppressClick=false;
 const pauseBriefly=(delay=500)=>{resumeAt=performance.now()+delay;};
 const keyboardFocused=()=>carousel.matches(':focus-visible')||carousel.querySelector(':focus-visible');
 const measure=()=>{
  const padding=parseFloat(getComputedStyle(carousel).paddingLeft);
  offsets=cards.map(card=>card.offsetLeft-padding);
  maxScroll=Math.max(0,carousel.scrollWidth-carousel.clientWidth);
  autoOffset=carousel.scrollLeft;
  cardBounds=cards.map(card=>({left:card.offsetLeft,right:card.offsetLeft+card.offsetWidth,height:card.getBoundingClientRect().height}));
  fitVisibleCards();
 };
 const step=way=>{
  velocity=0;pauseBriefly();direction=way;
  const left=way>0 ? (offsets.find(x=>x>carousel.scrollLeft+3)??maxScroll) : ([...offsets].reverse().find(x=>x<carousel.scrollLeft-3)??0);
  carousel.scrollTo({left:Math.max(0,Math.min(maxScroll,left)),behavior:reduced()?'instant':'smooth'});
 };
 const updateAutoplay=()=>carousel.setAttribute('aria-label',paused?'Selected projects carousel, automatic scrolling paused':'Selected projects carousel');
 carousel.addEventListener('keydown',event=>{
  if(event.target===carousel&&['ArrowLeft','ArrowRight'].includes(event.key)){
   event.preventDefault();step(event.key==='ArrowRight'?1:-1);
  }else if(event.target===carousel&&event.code==='Space'){
   event.preventDefault();paused=!paused;velocity=0;autoOffset=carousel.scrollLeft;resumeAt=0;updateAutoplay();
  }
 });
 carousel.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')hovered=true;});
 carousel.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'){hovered=false;pauseBriefly(250);}});
 carousel.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0)return;
  velocity=0;suppressClick=false;touching=true;
  // Touch keeps the browser's native swipe and vertical page scrolling.
  if(event.pointerType==='touch'||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||event.target.closest('.photo-credit a'))return;
  drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,startScroll:carousel.scrollLeft,
   lastScroll:carousel.scrollLeft,lastTime:performance.now(),velocity:0,active:false};
 });
 carousel.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
  if(!drag.active){
   if(Math.abs(dx)<6||Math.abs(dx)<Math.abs(dy))return;
   drag.active=true;carousel.setPointerCapture(event.pointerId);carousel.classList.add('is-dragging');
  }
  event.preventDefault();
  const now=performance.now(),left=Math.max(0,Math.min(maxScroll,drag.startScroll-dx));
  carousel.scrollTo({left,behavior:'instant'});
  const speed=(carousel.scrollLeft-drag.lastScroll)/Math.max(8,now-drag.lastTime);
  drag.velocity=Math.max(-2.5,Math.min(2.5,speed*.7+drag.velocity*.3));
  drag.lastTime=now;drag.lastScroll=carousel.scrollLeft;autoOffset=carousel.scrollLeft;
 });
 const release=event=>{
  if(drag&&event.pointerId!==drag.id)return;
  if(touching){touching=false;pauseBriefly(event.pointerType==='touch'?1500:250);}
  if(!drag)return;
  const finished=drag;drag=null;
  if(finished.active){
   suppressClick=true;
   velocity=event.type==='pointerup'&&!reduced()&&performance.now()-finished.lastTime<100?finished.velocity:0;
   if(Math.abs(velocity)>.02)direction=Math.sign(velocity);
   autoOffset=carousel.scrollLeft;
   carousel.classList.remove('is-dragging');
   if(carousel.hasPointerCapture(finished.id))carousel.releasePointerCapture(finished.id);
   const bounds=carousel.getBoundingClientRect();
   hovered=event.pointerType==='mouse'&&event.clientX>=bounds.left&&event.clientX<=bounds.right&&event.clientY>=bounds.top&&event.clientY<=bounds.bottom;
  }
 };
 window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
 carousel.addEventListener('lostpointercapture',release);
 carousel.addEventListener('dragstart',event=>event.preventDefault());
 carousel.addEventListener('click',event=>{
  if(suppressClick&&event.detail!==0){event.preventDefault();event.stopPropagation();suppressClick=false;}
 },true);
 window.addEventListener('blur',()=>{velocity=0;touching=false;drag=null;hovered=false;carousel.classList.remove('is-dragging');});
 carousel.addEventListener('wheel',()=>{velocity=0;pauseBriefly(800);},{passive:true});
 carousel.addEventListener('focusout',()=>pauseBriefly(250));
 carousel.addEventListener('scroll',()=>{
  // Keep autoplay aligned after native touch, trackpad or focus-driven scrolling.
  if(Math.abs(carousel.scrollLeft-autoOffset)>2){autoOffset=carousel.scrollLeft;velocity=0;pauseBriefly();}
  fitVisibleCards();
 },{passive:true});
 window.addEventListener('resize',measure);
 const cardObserver=new ResizeObserver(measure);
 cards.forEach(card=>cardObserver.observe(card));
 cards.forEach(card=>card.querySelectorAll('img').forEach(img=>img.addEventListener('load',measure)));
 motion.addEventListener('change',event=>{if(event.matches){paused=true;velocity=0;updateAutoplay();}});
 new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;},{threshold:0.1}).observe(carousel);
 const animate=time=>{
  const elapsed=lastTime?Math.min(time-lastTime,50):0;lastTime=time;
  const available=inView&&!document.hidden&&!document.querySelector('dialog[open]')&&maxScroll>0;
  if(Math.abs(velocity)>.02&&!touching&&available){
   const decay=Math.exp(-elapsed/260);
   autoOffset=Math.max(0,Math.min(maxScroll,autoOffset+velocity*260*(1-decay)));
   carousel.scrollTo({left:autoOffset,behavior:'instant'});velocity*=decay;
   if(autoOffset===0||autoOffset===maxScroll||Math.abs(velocity)<=.02){velocity=0;resumeAt=time+250;}
  }else if(!paused&&!hovered&&!touching&&available&&!keyboardFocused()&&time>=resumeAt){
   autoOffset=Math.max(0,Math.min(maxScroll,autoOffset+direction*24*elapsed/1000));
   carousel.scrollTo({left:autoOffset,behavior:'instant'});
   if(autoOffset>=maxScroll||autoOffset<=0){direction*=-1;resumeAt=time+1400;}
  }else {autoOffset=carousel.scrollLeft;if(!available)velocity=0;}
  requestAnimationFrame(animate);
 };
 measure();updateAutoplay();requestAnimationFrame(animate);
}

const menu=document.querySelector('#site-menu');
const menuToggle=document.querySelector('.menu-toggle');
if(menu && menuToggle){
 menuToggle.addEventListener('click',()=>menu.showModal());
 menu.querySelector('.menu-close').addEventListener('click',()=>menu.close());
 menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',event=>{
  menu.close();
  if(!a.hasAttribute('data-about'))return;
  const target=document.querySelector(a.hash);
  if(!target)return;
  event.preventDefault();
  if(location.hash!==a.hash)history.pushState(null,'',a.hash);
  requestAnimationFrame(()=>{
   const top=target.getBoundingClientRect().top+scrollY-document.querySelector('header').getBoundingClientRect().height;
   window.scrollTo({top,behavior:reduced()?'instant':'smooth'});
  });
 }));
 menu.addEventListener('click',e=>{if(e.target===menu){const r=menu.getBoundingClientRect();if(e.clientX<r.left || e.clientX>r.right)menu.close();}});
 menu.addEventListener('close',()=>menuToggle.focus({preventScroll:true}));
}
