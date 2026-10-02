(() => {
  const $=id=>document.getElementById(id);
  const reagents={vinegar:{name:'Ácido acético',formula:'CH₃COOH',grade:8,color:'#fb7185'},bicarb:{name:'Bicarbonato',formula:'NaHCO₃',grade:8,color:'#e2e8f0'},cuso4:{name:'Sulfato de cobre',formula:'CuSO₄',grade:8,color:'#38bdf8'},naoh:{name:'Hidróxido de sodio',formula:'NaOH',grade:8,color:'#a78bfa'},hcl:{name:'Ácido clorhídrico',formula:'HCl',grade:10,color:'#facc15'},caco3:{name:'Carbonato de calcio',formula:'CaCO₃',grade:8,color:'#f8fafc'},iron:{name:'Hierro',formula:'Fe',grade:10,color:'#94a3b8'},h2o2:{name:'Peróxido de hidrógeno',formula:'H₂O₂',grade:10,color:'#bae6fd'},ki:{name:'Yoduro de potasio',formula:'KI',grade:10,color:'#c4b5fd'}};
  const reactions={
    'bicarb+vinegar':{name:'Liberación de dióxido de carbono',equation:'NaHCO₃ + CH₃COOH → CO₂ + H₂O + CH₃COONa',effect:'bubbling',obs:'Aparecen muchas burbujas por la formación de CO₂.'},
    'caco3+hcl':{name:'Ácido y carbonato',equation:'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂',effect:'bubbling',obs:'El carbonato se consume mientras se libera CO₂.'},
    'cuso4+naoh':{name:'Precipitación',equation:'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',effect:'precipitate',obs:'Se forma un precipitado azul de hidróxido de cobre(II).'},
    'cuso4+iron':{name:'Desplazamiento simple',equation:'Fe + CuSO₄ → FeSO₄ + Cu',effect:'color-change',obs:'El hierro desplaza al cobre; cambia el color y se deposita cobre.'},
    'h2o2+ki':{name:'Descomposición catalizada',equation:'2H₂O₂ → 2H₂O + O₂ (KI catalizador)',effect:'bubbling warm',obs:'Se libera oxígeno y la reacción aumenta la temperatura.'},
    'hcl+naoh':{name:'Neutralización',equation:'HCl + NaOH → NaCl + H₂O',effect:'warm',obs:'No aparece gas ni precipitado, pero la mezcla se calienta.'}
  };
  const symbols=('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og').split(' ');
  let grade=8,loaded=[],tool='beaker';
  function renderShelf(){ $('reagent-shelf').innerHTML=Object.entries(reagents).filter(([,r])=>r.grade<=grade).map(([id,r])=>`<button class="reagent-vial" draggable="true" data-reagent="${id}" style="--vial-color:${r.color}"><b>${r.formula}</b><span>${r.name}</span></button>`).join('');document.querySelectorAll('[data-reagent]').forEach(v=>{v.ondragstart=e=>e.dataTransfer.setData('text/plain',v.dataset.reagent);v.onclick=()=>load(v.dataset.reagent)})}
  $('element-shelf').innerHTML=symbols.map(s=>`<button class="element-vial" title="Muestra de ${s}">${s}</button>`).join('');
  function load(id){if(loaded.includes(id)||loaded.length===2)return;loaded.push(id);paintLoaded()}
  function paintLoaded(){$('loaded-reagents').innerHTML=loaded.map(id=>`<span class="loaded-chip">${reagents[id].formula}</span>`).join('');$('mix-lab').disabled=loaded.length!==2}
  $('drop-tray').ondragover=e=>{e.preventDefault();$('drop-tray').classList.add('dragover')};$('drop-tray').ondragleave=()=>$('drop-tray').classList.remove('dragover');$('drop-tray').ondrop=e=>{e.preventDefault();$('drop-tray').classList.remove('dragover');load(e.dataTransfer.getData('text/plain'))};
  document.querySelectorAll('[data-grade]').forEach(b=>b.onclick=()=>{grade=+b.dataset.grade;document.querySelectorAll('[data-grade]').forEach(x=>x.classList.toggle('active',x===b));clear();renderShelf()});
  document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(x=>x.classList.toggle('active',x===b));$('apparatus').className=`apparatus ${tool}`});
  function clear(){loaded=[];paintLoaded();$('lab-scene').className='lab-scene';$('reaction-readout').textContent='MESA LIMPIA · ESPERANDO SUSTANCIAS';$('reaction-card').innerHTML='<strong>Cuaderno de laboratorio</strong><p>El resultado, la ecuación y las observaciones aparecerán aquí.</p>'}
  $('clear-lab').onclick=clear;
  $('mix-lab').onclick=()=>{const key=[...loaded].sort().join('+'),r=reactions[key],scene=$('lab-scene');scene.className='lab-scene';void scene.offsetWidth;if(!r){scene.classList.add('flash');$('reaction-readout').textContent='SIN CAMBIO OBSERVABLE';$('reaction-card').innerHTML='<strong>No se observó una reacción</strong><p>Estas sustancias no tienen una reacción incluida en el simulador bajo las condiciones del laboratorio. Prueba otra combinación.</p>';return}r.effect.split(' ').forEach(x=>scene.classList.add(x));$('reaction-readout').textContent=r.name.toUpperCase();$('reaction-card').innerHTML=`<strong>${r.name}</strong><p><b>${r.equation}</b><br>${r.obs}</p>`};
  window.virtualLabAddReagent = function(id,data){ reagents[id]=data; renderShelf(); };
  renderShelf();
})();
