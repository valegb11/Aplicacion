(() => {
  const shelf=document.getElementById('reagent-shelf');if(!shelf)return;
  const art={vinegar:'🍶',bicarb:'🥄',cuso4:'🔷',naoh:'🧴',hcl:'⚗️',caco3:'🪨',iron:'🔩',h2o2:'🧪',ki:'🧂'};
  function paint(){shelf.querySelectorAll('.reagent-vial').forEach(v=>{if(v.querySelector('.vial-picture'))return;const e=document.createElement('em');e.className='vial-picture';e.textContent=art[v.dataset.reagent]||'⚗️';v.prepend(e)})}
  new MutationObserver(paint).observe(shelf,{childList:true});paint();
})();
