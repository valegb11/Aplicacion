(() => {
  const tray=document.getElementById('drop-tray'),loadedBox=document.getElementById('loaded-reagents'),mixButton=document.getElementById('mix-lab'),clearButton=document.getElementById('clear-lab');
  if(!tray||!loadedBox||!mixButton||!clearButton)return;
  const reactions={
    'bicarb+vinegar':{name:'Liberación de dióxido de carbono',equation:'NaHCO₃ + CH₃COOH → CO₂ + H₂O + CH₃COONa',effect:'bubbling',obs:'Aparecen burbujas por la formación de dióxido de carbono.'},
    'caco3+hcl':{name:'Ácido y carbonato',equation:'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂',effect:'bubbling',obs:'El carbonato se consume y libera dióxido de carbono.'},
    'cuso4+naoh':{name:'Precipitación',equation:'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',effect:'precipitate',obs:'Se forma un precipitado azul de hidróxido de cobre(II).'},
    'cuso4+iron':{name:'Desplazamiento simple',equation:'Fe + CuSO₄ → FeSO₄ + Cu',effect:'color-change',obs:'El hierro desplaza al cobre y se deposita cobre metálico.'},
    'h2o2+ki':{name:'Descomposición catalizada',equation:'2H₂O₂ → 2H₂O + O₂ (KI catalizador)',effect:'bubbling warm',obs:'Se libera oxígeno y aumenta la temperatura.'},
    'hcl+naoh':{name:'Neutralización',equation:'HCl + NaOH → NaCl + H₂O',effect:'warm',obs:'La neutralización libera calor sin producir precipitado.'}
  };
  let loaded=[];
  const reagentData=id=>{const vial=document.querySelector(`[data-reagent="${CSS.escape(id)}"]`);return {id,formula:vial?.querySelector('b')?.textContent||id,name:vial?.querySelector('span')?.textContent||id}};
  function add(id){if(!id||loaded.some(x=>x.id===id)||loaded.length>=6)return;loaded.push(reagentData(id));paint()}
  function remove(id){loaded=loaded.filter(x=>x.id!==id);paint()}
  function paint(){loadedBox.innerHTML=loaded.map(x=>`<button type="button" class="loaded-chip multi-chip" data-remove-loaded="${x.id}" title="Retirar ${x.name}"><span>${x.formula}</span><b>×</b></button>`).join('');mixButton.disabled=loaded.length<2;tray.querySelector('p').textContent=loaded.length?`${loaded.length} DE 6 RECIPIENTES EN LA MESA`:'ARRASTRA AQUÍ DOS O MÁS RECIPIENTES';loadedBox.querySelectorAll('[data-remove-loaded]').forEach(b=>b.onclick=e=>{e.stopPropagation();remove(b.dataset.removeLoaded)})}
  function clear(){loaded=[];paint();const scene=document.getElementById('lab-scene');scene.className='lab-scene';document.getElementById('reaction-readout').textContent='MESA LIMPIA · ESPERANDO SUSTANCIAS';document.getElementById('reaction-card').innerHTML='<strong>Cuaderno de laboratorio</strong><p>El resultado, las ecuaciones y las observaciones aparecerán aquí.</p>'}
  document.addEventListener('click',e=>{const vial=e.target.closest('.reagent-vial');if(vial){e.preventDefault();e.stopImmediatePropagation();add(vial.dataset.reagent)}},true);
  tray.addEventListener('dragover',e=>{e.preventDefault();tray.classList.add('dragover')},true);
  tray.addEventListener('drop',e=>{e.preventDefault();e.stopImmediatePropagation();tray.classList.remove('dragover');add(e.dataTransfer.getData('text/plain'))},true);
  clearButton.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();clear()},true);
  document.querySelectorAll('[data-grade]').forEach(b=>b.addEventListener('click',clear,true));
  mixButton.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const found=[];for(let i=0;i<loaded.length;i++)for(let j=i+1;j<loaded.length;j++){const key=[loaded[i].id,loaded[j].id].sort().join('+');if(reactions[key]&&!found.some(x=>x.key===key))found.push({key,...reactions[key]})}const scene=document.getElementById('lab-scene');scene.className='lab-scene';void scene.offsetWidth;if(!found.length){scene.classList.add('flash');document.getElementById('reaction-readout').textContent='SIN CAMBIO OBSERVABLE';document.getElementById('reaction-card').innerHTML='<strong>No se observó una reacción</strong><p>La mezcla fue realizada, pero ninguna combinación incluida reaccionó bajo estas condiciones.</p>';return}found.flatMap(r=>r.effect.split(' ')).forEach(effect=>scene.classList.add(effect));document.getElementById('reaction-readout').textContent=found.length===1?found[0].name.toUpperCase():`${found.length} REACCIONES EN LA MISMA MEZCLA`;document.getElementById('reaction-card').innerHTML=`<strong>${found.length===1?'Reacción observada':'Reacciones observadas'}</strong>${found.map((r,i)=>`<section><b>${i+1}. ${r.name}</b><p><code>${r.equation}</code><br>${r.obs}</p></section>`).join('')}`},true);
  paint();
})();
