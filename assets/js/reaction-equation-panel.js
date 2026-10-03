(() => {
  const scene=document.getElementById('lab-scene'),loaded=document.getElementById('loaded-reagents'),card=document.getElementById('reaction-card');
  if(!scene||!loaded||!card)return;
  const panel=document.createElement('aside');panel.className='live-equation-panel';panel.innerHTML='<header><span>⚛</span><div><small>REACCIÓN EN TIEMPO REAL</small><strong>Ecuación en construcción</strong></div></header><div class="equation-building" id="equation-building">Agrega dos o más sustancias</div><div class="equation-result" id="equation-result">Productos: por determinar</div><div class="reaction-signals" id="reaction-signals"><span class="idle">○ Esperando mezcla</span></div>';
  scene.append(panel);
  const formulas=()=>[...loaded.querySelectorAll('.multi-chip span')].map(x=>x.textContent.trim()).filter(Boolean);
  function update(){
    const input=formulas(),equations=[...card.querySelectorAll('code')].map(x=>x.textContent.trim()).filter(Boolean);
    document.getElementById('equation-building').textContent=equations.length?equations.join('  |  '):(input.length?`${input.join(' + ')} → ?`:'Agrega dos o más sustancias');
    const products=equations.flatMap(eq=>{const arrow=eq.split('→');return arrow[1]?[arrow[1].trim()]:[]});
    document.getElementById('equation-result').textContent=products.length?`Productos: ${products.join(' · ')}`:'Productos: por determinar';
    const joined=equations.join(' '),signals=[];
    if(products.join(' ').includes('O₂'))signals.push(['oxygen','◉ O₂ liberado']);
    if(products.join(' ').includes('CO₂'))signals.push(['gas','◌ CO₂ liberado']);
    if(scene.classList.contains('warm')||scene.classList.contains('heated')||scene.classList.contains('water-bath'))signals.push(['heat','♨ Libera calor']);
    if(scene.classList.contains('precipitate')||joined.includes('↓'))signals.push(['solid','◆ Forma precipitado']);
    if(scene.classList.contains('color-change'))signals.push(['color','● Cambio de color']);
    if(equations.length&&!signals.length)signals.push(['stable','✓ Reacción registrada']);
    document.getElementById('reaction-signals').innerHTML=signals.length?signals.map(([c,t])=>`<span class="${c}">${t}</span>`).join(''):'<span class="idle">○ Esperando mezcla</span>';
  }
  new MutationObserver(update).observe(loaded,{subtree:true,childList:true,characterData:true});
  new MutationObserver(update).observe(card,{subtree:true,childList:true,characterData:true});
  new MutationObserver(update).observe(scene,{attributes:true,attributeFilter:['class']});update();
})();
