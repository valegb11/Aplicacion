(() => {
  const rack=document.querySelector('.tool-rack'),scene=document.getElementById('lab-scene'),apparatus=document.getElementById('apparatus'),action=document.getElementById('use-equipment');
  if(!rack||!scene||!apparatus||!action)return;
  const containerIds=['beaker','tube','petri'];
  const tools=[
    ['filter-paper','📄','Papel filtro','Retiene partículas sólidas al verter la mezcla.'],
    ['vacuum','🧯','Filtración al vacío','Acelera la filtración usando una diferencia de presión.'],
    ['centrifuge','🌀','Centrífuga','Separa componentes según su densidad mediante rotación.'],
    ['sieve','🕸️','Tamiz','Clasifica partículas sólidas por tamaño.'],
    ['hotplate','♨️','Placa térmica','Calienta el recipiente desde una superficie estable.'],
    ['waterbath','♨️','Baño María','Aplica calor suave y uniforme alrededor del recipiente.'],
    ['crucible','🥣','Crisol','Permite calentar sólidos a temperatura alta.'],
    ['mortar','🥣','Mortero','Tritura sólidos para reducir el tamaño de sus partículas.'],
    ['dropper','💧','Gotero','Añade una sustancia lentamente, gota a gota.'],
    ['rod','🥢','Varilla','Agita la mezcla sin cambiar el recipiente.'],
    ['spatula','🥄','Espátula','Transfiere pequeñas porciones de sólidos.']
  ];
  const oldExtra=[...rack.querySelectorAll('[data-extra-tool]')];
  const containerGroup=document.createElement('section');containerGroup.className='equipment-group container-group';containerGroup.innerHTML='<header><strong>1. Recipiente</strong><small>Se mantiene durante el proceso</small></header><div></div>';
  const toolGroup=document.createElement('section');toolGroup.className='equipment-group process-group';toolGroup.innerHTML='<header><strong>2. Herramienta</strong><small>Separar, calentar o manipular</small></header><div></div>';
  [...rack.querySelectorAll('[data-tool]')].forEach(b=>containerGroup.lastElementChild.append(b));
  oldExtra.forEach(b=>{b.classList.remove('active');toolGroup.lastElementChild.append(b)});
  tools.forEach(([id,icon,label,help])=>{const b=document.createElement('button');b.type='button';b.dataset.processTool=id;b.dataset.help=help;b.innerHTML=`${icon}<span>${label}</span>`;toolGroup.lastElementChild.append(b)});
  rack.replaceChildren(containerGroup,toolGroup);
  const visual=document.createElement('div');visual.className='active-tool-visual';visual.innerHTML='<span>🧪</span><small>SIN HERRAMIENTA</small>';scene.append(visual);
  let container='beaker',tool=null;
  const labels={separator:['⚗️','Embudo de decantación','Separa líquidos inmiscibles que forman capas.'],filter:['🔻','Embudo de filtración','Separa un sólido suspendido de un líquido.'],burner:['🔥','Mechero','Calienta directamente desde debajo del recipiente.']};
  rack.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(button.dataset.tool){container=button.dataset.tool;containerGroup.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===button));apparatus.className=`apparatus ${container}`;document.getElementById('equipment-title').textContent=`RECIPIENTE: ${button.textContent.trim().toUpperCase()}`;document.getElementById('equipment-help').textContent=button.dataset.help || 'El recipiente se conservará mientras cambias de herramienta.';return}
    tool=button.dataset.extraTool||button.dataset.processTool;toolGroup.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===button));const info=labels[tool]||[button.textContent.trim().slice(0,2),button.querySelector('span')?.textContent||tool,button.dataset.help];visual.innerHTML=`<span>${info[0]}</span><small>${info[1].toUpperCase()}</small>`;document.getElementById('equipment-title').textContent=`HERRAMIENTA: ${info[1].toUpperCase()}`;document.getElementById('equipment-help').textContent=info[2];
  },true);
  action.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();scene.className='lab-scene';void scene.offsetWidth;const state={separator:'separating',filter:'filtering','filter-paper':'filtering',vacuum:'vacuuming',centrifuge:'spinning',sieve:'sieving',burner:'heated',hotplate:'heated',waterbath:'water-bath',crucible:'heated',mortar:'grinding',dropper:'dropping',rod:'stirring',spatula:'transferring',pipette:'measuring',burette:'titrating'}[tool];if(!state){document.getElementById('reaction-readout').textContent='ELIGE UNA HERRAMIENTA';return}scene.classList.add(state);const status={separating:'SEPARANDO FASES',filtering:'FILTRANDO SÓLIDOS',vacuuming:'FILTRACIÓN AL VACÍO',spinning:'CENTRIFUGANDO LA MEZCLA',sieving:'TAMIZANDO PARTÍCULAS',heated:'APLICANDO CALOR', 'water-bath':'CALENTANDO SUAVEMENTE',grinding:'TRITURANDO EL SÓLIDO',dropping:'AGREGANDO GOTA A GOTA',stirring:'AGITANDO LA MEZCLA',transferring:'TRANSFIRIENDO EL SÓLIDO',measuring:'TRANSFIRIENDO UN VOLUMEN PRECISO',titrating:'DOSIFICANDO PARA LA VALORACIÓN'};document.getElementById('reaction-readout').textContent=status[state]},true);
})();
