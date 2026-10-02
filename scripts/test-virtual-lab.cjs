const endpoint = 'http://127.0.0.1:9333';
const pageUrl = 'http://127.0.0.1:4178/virtual-lab.html?automated-test=1';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitForJson(url, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try { const response = await fetch(url); if (response.ok) return response.json(); } catch {}
    await sleep(250);
  }
  throw new Error(`No respondió ${url}`);
}

async function main() {
  await fetch(`${endpoint}/json/new?${encodeURIComponent(pageUrl)}`, { method: 'PUT' });
  const pages = await waitForJson(`${endpoint}/json`);
  const page = pages.find(item => item.type === 'page' && item.url.includes('virtual-lab.html'));
  if (!page) throw new Error('No se encontró la pestaña del laboratorio.');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id); pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  for (let i = 0; i < 40; i++) {
    if (await evaluate("document.readyState === 'complete' && !!document.querySelector('.periodic-element')")) break;
    await sleep(200);
  }
  const results = await evaluate(`(async()=>{
    const checks=[]; const check=(name,ok,detail='')=>checks.push({name,ok:Boolean(ok),detail});
    check('Tabla periódica completa',document.querySelectorAll('.periodic-element').length===118,'elementos='+document.querySelectorAll('.periodic-element').length);
    check('Gabinete disponible',document.querySelectorAll('.reagent-vial').length>=5,'recipientes='+document.querySelectorAll('.reagent-vial').length);
    check('Herramientas ampliadas',document.querySelectorAll('.process-group button').length>=14,'herramientas='+document.querySelectorAll('.process-group button').length);
    const oxygen=[...document.querySelectorAll('.periodic-element')].find(x=>x.querySelector('b')?.textContent==='O');oxygen.click();
    check('Elemento abre constructor',document.querySelector('.substance-modal').classList.contains('open'));
    check('Elemento transferido al constructor',document.getElementById('builder-element').value==='O','seleccionado='+document.getElementById('builder-element').value);
    document.getElementById('substance-name').value='Oxígeno de prueba';document.getElementById('builder-subscript').value='2';document.getElementById('add-formula-part').click();
    check('Subíndice aplicado',document.getElementById('formula-preview').textContent.includes('O₂'),document.getElementById('formula-preview').textContent);
    document.getElementById('substance-form').requestSubmit();
    check('Sustancia creada', [...document.querySelectorAll('.reagent-vial')].some(x=>x.textContent.includes('Oxígeno de prueba')));
    const beaker=document.querySelector('[data-tool="beaker"]');beaker.click();const mortar=[...document.querySelectorAll('[data-process-tool]')].find(x=>x.dataset.processTool==='mortar');mortar.click();
    check('Recipiente se conserva al elegir herramienta',document.getElementById('apparatus').classList.contains('beaker'),document.getElementById('apparatus').className);
    document.getElementById('use-equipment').click();check('Mortero ejecuta animación',document.getElementById('lab-scene').classList.contains('grinding'));
    document.getElementById('clear-lab').click();document.querySelector('[data-reagent="vinegar"]').click();document.querySelector('[data-reagent="bicarb"]').click();document.getElementById('mix-lab').click();
    check('Reacción vinagre-bicarbonato',document.getElementById('lab-scene').classList.contains('bubbling'));
    check('Ecuación real mostrada',document.getElementById('reaction-card').textContent.includes('NaHCO₃'));
    document.getElementById('clear-lab').click();document.querySelector('[data-reagent="cuso4"]').click();document.querySelector('[data-reagent="naoh"]').click();document.getElementById('mix-lab').click();
    check('Precipitación visual',document.getElementById('lab-scene').classList.contains('precipitate'));
    const hot=[...document.querySelectorAll('[data-process-tool]')].find(x=>x.dataset.processTool==='hotplate');hot.click();document.getElementById('use-equipment').click();check('Placa térmica aplica calor',document.getElementById('lab-scene').classList.contains('heated'));
    return checks;
  })()`);
  console.log(JSON.stringify(results, null, 2));
  const failed = results.filter(item => !item.ok);
  ws.close();
  if (failed.length) process.exitCode = 1;
}
main().catch(error => { console.error(error.stack || error); process.exit(1); });
