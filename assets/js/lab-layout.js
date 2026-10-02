(() => {
  const layout=document.querySelector('.vl-layout'),cabinet=document.querySelector('.vl-cabinet'),workbench=document.querySelector('.vl-workbench');
  if(!layout||!cabinet||!workbench)return;
  const details=cabinet.querySelector('details'),shelf=document.getElementById('reagent-shelf'),creator=cabinet.querySelector('.substance-creator');
  const strip=document.createElement('section');strip.className='cabinet-strip';
  const heading=document.createElement('div');heading.className='cabinet-strip-head';heading.innerHTML='<div><span>GABINETE DE SUSTANCIAS</span><h2>Escoge o crea los recipientes</h2><p>Arrastra las sustancias desde esta franja hasta la mesa de mezcla.</p></div>';
  if(creator)heading.append(creator);
  strip.append(heading,shelf);
  workbench.prepend(strip);
  if(details){const panel=document.createElement('section');panel.className='periodic-wide-panel';panel.append(details);layout.after(panel);details.open=true}
  cabinet.remove();layout.classList.add('laboratory-wide');
})();
