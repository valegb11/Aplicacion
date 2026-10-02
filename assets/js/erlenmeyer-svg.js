(() => {
  const apparatus=document.getElementById('apparatus');
  if(!apparatus)return;
  function render(){
    const active=apparatus.classList.contains('erlenmeyer');
    let svg=apparatus.querySelector('.erlenmeyer-svg');
    if(!active){svg?.remove();return}
    if(svg)return;
    apparatus.insertAdjacentHTML('beforeend',`<svg class="erlenmeyer-svg" viewBox="0 0 240 280" role="img" aria-label="Matraz Erlenmeyer">
      <defs><linearGradient id="glass-shine" x1="0" x2="1"><stop offset="0" stop-color="#dff7ff" stop-opacity=".32"/><stop offset=".28" stop-color="#dff7ff" stop-opacity=".04"/><stop offset="1" stop-color="#dff7ff" stop-opacity=".14"/></linearGradient><linearGradient id="erlen-liquid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38bdf8" stop-opacity=".72"/><stop offset="1" stop-color="#0369a1" stop-opacity=".9"/></linearGradient></defs>
      <path class="erlen-glass" d="M88 18H152V82L211 224Q217 240 205 252Q194 264 174 264H66Q46 264 35 252Q23 240 29 224L88 82Z" fill="url(#glass-shine)" stroke="#b9dbea" stroke-width="8" stroke-linejoin="round"/>
      <path class="erlen-rim" d="M82 18Q82 10 91 10H149Q158 10 158 18Q158 26 149 26H91Q82 26 82 18Z" fill="#dff7ff" stroke="#7198ab" stroke-width="3"/>
      <path class="erlen-liquid-svg" d="M50 184H190L209 228Q214 241 203 251Q193 260 174 260H66Q47 260 37 251Q26 241 31 228Z" fill="url(#erlen-liquid)"/>
      <path d="M61 169Q120 160 179 169" fill="none" stroke="#e0f2fe" stroke-opacity=".42" stroke-width="3"/>
      <path d="M99 42V93L54 213" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="5" stroke-linecap="round"/>
    </svg>`);
  }
  new MutationObserver(render).observe(apparatus,{attributes:true,attributeFilter:['class']});render();
})();
