(() => {
  const shelf=document.getElementById('element-shelf'),modal=document.querySelector('.substance-modal');
  if(!shelf||!modal)return;
  function addElement(cell){const symbol=cell.querySelector('b')?.textContent;if(!symbol)return;modal.classList.add('open');const select=document.getElementById('builder-element');select.value=symbol;document.getElementById('builder-subscript').focus();document.getElementById('builder-subscript').select();modal.querySelector('.periodic-selection-note')?.remove();const note=document.createElement('p');note.className='periodic-selection-note';note.innerHTML=`Elemento seleccionado: <strong>${symbol}</strong>. Define el subíndice y pulsa “Agregar elemento”.`;document.querySelector('.formula-workbench').prepend(note)}
  shelf.querySelectorAll('.periodic-element').forEach(cell=>{cell.draggable=true;cell.addEventListener('click',()=>addElement(cell));cell.addEventListener('dragstart',e=>e.dataTransfer.setData('application/x-element',cell.querySelector('b').textContent))});
  const preview=document.querySelector('.formula-preview');
  preview.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('application/x-element')){e.preventDefault();preview.classList.add('element-dragover')}});
  preview.addEventListener('dragleave',()=>preview.classList.remove('element-dragover'));
  preview.addEventListener('drop',e=>{const symbol=e.dataTransfer.getData('application/x-element');if(!symbol)return;e.preventDefault();preview.classList.remove('element-dragover');document.getElementById('builder-element').value=symbol;document.getElementById('add-formula-part').click()});
})();
