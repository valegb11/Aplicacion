(() => {
  const rack=document.querySelector('.tool-rack'),apparatus=document.getElementById('apparatus'),scene=document.getElementById('lab-scene');
  if(!rack||!apparatus||!scene)return;
  const equipment=[['separator','⚗️','Decantar'],['filter','🔻','Filtrar'],['burner','🔥','Calentar']];
  equipment.forEach(([id,icon,label])=>{const b=document.createElement('button');b.type='button';b.dataset.extraTool=id;b.innerHTML=`${icon}<span>${label}</span>`;rack.append(b)});
  const panel=document.createElement('div');panel.className='equipment-action';panel.innerHTML='<strong id="equipment-title">EQUIPO PREPARADO</strong><p id="equipment-help">Elige un recipiente o una herramienta de separación.</p><button id="use-equipment" type="button">Aplicar herramienta</button>';
  scene.after(panel);
  let selected='beaker';
  function select(id,button){selected=id;document.querySelectorAll('.tool-rack button').forEach(x=>x.classList.toggle('active',x===button));scene.classList.remove('heated','separating','filtering');apparatus.className=`apparatus ${id}`;const help={separator:'Separa líquidos que forman capas mediante decantación.',filter:'Retiene un sólido mientras el líquido atraviesa el filtro.',burner:'Aplica calor al recipiente seleccionado.',beaker:'Recipiente para mezclar y calentar sustancias.',tube:'Tubo para observar pequeñas reacciones.',petri:'Superficie para sólidos y cristalización.'};document.getElementById('equipment-title').textContent=button.textContent.trim().toUpperCase();document.getElementById('equipment-help').textContent=help[id]}
  document.querySelectorAll('.tool-rack [data-tool]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.tool;document.getElementById('equipment-help').textContent='Recipiente seleccionado para el experimento.'}));
  document.querySelectorAll('[data-extra-tool]').forEach(b=>b.onclick=()=>select(b.dataset.extraTool,b));
  document.getElementById('use-equipment').onclick=()=>{scene.classList.remove('heated','separating','filtering');void scene.offsetWidth;if(selected==='burner'){scene.classList.add('heated');document.getElementById('reaction-readout').textContent='APLICANDO CALOR CONTROLADO'}else if(selected==='separator'){scene.classList.add('separating');document.getElementById('reaction-readout').textContent='SEPARANDO LAS DOS FASES'}else if(selected==='filter'){scene.classList.add('filtering');document.getElementById('reaction-readout').textContent='FILTRANDO LA MEZCLA'}else document.getElementById('reaction-readout').textContent='SELECCIONA UNA HERRAMIENTA DE PROCESO'};
})();
