(()=>{const root=document.querySelector('.framing'),items=[...root.querySelectorAll('[data-layer]')];let selected=null,hovered=null,focused=null;function render(){const active=hovered||focused||selected;if(active)root.dataset.active=active;else delete root.dataset.active;items.forEach(item=>item.classList.toggle('active',item.dataset.layer===active));}items.forEach(item=>{item.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=item.dataset.layer;render();}});item.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'){hovered=null;render();}});if(item.matches('button')){item.addEventListener('focus',()=>{focused=item.dataset.layer;render();});item.addEventListener('blur',()=>{focused=null;render();});item.addEventListener('click',()=>{selected=selected===item.dataset.layer?null:item.dataset.layer;focused=null;item.blur();render();});}});document.addEventListener('pointerdown',event=>{if(!event.target.closest('[data-layer]')){selected=null;focused=null;render();}});document.addEventListener('keydown',event=>{if(event.key==='Escape'){selected=null;focused=null;document.activeElement.blur();render();}});})();

// Let the question stack set the semicircle height and stack before text is covered.
(() => {
  const root = document.querySelector('.framing');
  const questions = root.querySelector('.questions');
  const update = () => {
    if (innerWidth <= 900) { root.classList.remove('is-stacked'); return; }
    root.classList.remove('is-stacked');
    const height = questions.getBoundingClientRect().height;
    const first = questions.querySelector('.question');
    const textStart = first.getBoundingClientRect().left + parseFloat(getComputedStyle(first).paddingLeft);
    const diagramStart = root.getBoundingClientRect().left + root.clientWidth * .02;
    if (diagramStart + height * 2 + 8 > textStart) root.classList.add('is-stacked');
    else root.style.setProperty('--diagram-width', `${height * 2}px`);
  };
  new ResizeObserver(update).observe(document.documentElement);
  document.fonts.ready.then(update);
  update();
})();

// Notify the host whenever the responsive content changes height.
(() => {
  const content = document.querySelector('.framing');
  const report = () => parent.postMessage({ type:'performamatch-framework-height', height:Math.ceil(content.getBoundingClientRect().height) }, '*');
  new ResizeObserver(report).observe(content);
  document.fonts.ready.then(report);
  report();
})();
