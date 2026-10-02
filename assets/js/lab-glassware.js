(() => {
  const containers=document.querySelector('.container-group>div'),tools=document.querySelector('.process-group>div');
  if(!containers||!tools)return;
  const rename={beaker:['Vaso de precipitados','Contener, mezclar y calentar líquidos.'],tube:['Tubo de ensayo','Realizar ensayos y reacciones cualitativas.'],petri:['Placa de Petri','Observar muestras, sólidos y cristalización.']};
  Object.entries(rename).forEach(([id,[name,help]])=>{const b=containers.querySelector(`[data-tool="${id}"]`);if(!b)return;b.querySelector('span').textContent=name;b.dataset.help=help;b.title=help});
  const containerData=[
    ['volumetric-flask','⚗️','Matraz aforado','Mide un volumen fijo y exacto para preparar disoluciones.'],
    ['erlenmeyer','⚗️','Matraz Erlenmeyer','Permite agitar líquidos sin salpicaduras y realizar reacciones o valoraciones.'],
    ['cylinder','🧪','Probeta','Cilindro graduado para mediciones aproximadas de volumen.']
  ];
  containerData.forEach(([id,icon,name,help])=>{const b=document.createElement('button');b.type='button';b.dataset.tool=id;b.dataset.help=help;b.title=help;b.innerHTML=`${icon}<span>${name}</span>`;containers.append(b)});
  const toolData=[
    ['pipette','💧','Pipeta','Transfiere volúmenes precisos; puede ser graduada o aforada.'],
    ['burette','📏','Bureta','Mide volúmenes variables con una llave de paso, ideal para valoraciones.']
  ];
  toolData.forEach(([id,icon,name,help])=>{const b=document.createElement('button');b.type='button';b.dataset.processTool=id;b.dataset.help=help;b.title=help;b.innerHTML=`${icon}<span>${name}</span>`;tools.append(b)});
})();
