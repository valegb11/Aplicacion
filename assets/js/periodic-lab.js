(() => {
  const shelf=document.getElementById('element-shelf');
  if(!shelf)return;
  const symbols='H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
  const names='Hidrógeno Helio Litio Berilio Boro Carbono Nitrógeno Oxígeno Flúor Neón Sodio Magnesio Aluminio Silicio Fósforo Azufre Cloro Argón Potasio Calcio Escandio Titanio Vanadio Cromo Manganeso Hierro Cobalto Níquel Cobre Zinc Galio Germanio Arsénico Selenio Bromo Criptón Rubidio Estroncio Itrio Circonio Niobio Molibdeno Tecnecio Rutenio Rodio Paladio Plata Cadmio Indio Estaño Antimonio Telurio Yodo Xenón Cesio Bario Lantano Cerio Praseodimio Neodimio Prometio Samario Europio Gadolinio Terbio Disprosio Holmio Erbio Tulio Iterbio Lutecio Hafnio Tantalio Wolframio Renio Osmio Iridio Platino Oro Mercurio Talio Plomo Bismuto Polonio Astato Radón Francio Radio Actinio Torio Protactinio Uranio Neptunio Plutonio Americio Curio Berkelio Californio Einsteinio Fermio Mendelevio Nobelio Lawrencio Rutherfordio Dubnio Seaborgio Bohrio Hassio Meitnerio Darmstadtio Roentgenio Copernicio Nihonio Flerovio Moscovio Livermorio Teneso Oganesón'.split(' ');
  const periods=[
    [['H',1],['He',18]],
    [['Li',1],['Be',2],['B',13],['C',14],['N',15],['O',16],['F',17],['Ne',18]],
    [['Na',1],['Mg',2],['Al',13],['Si',14],['P',15],['S',16],['Cl',17],['Ar',18]],
    ['K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr'.split(' ').map((s,i)=>[s,i+1])][0],
    ['Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe'.split(' ').map((s,i)=>[s,i+1])][0],
    [['Cs',1],['Ba',2],['La',3],...('Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn'.split(' ').map((s,i)=>[s,i+4]))],
    [['Fr',1],['Ra',2],['Ac',3],...('Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ').map((s,i)=>[s,i+4]))]
  ];
  const lanth='Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu'.split(' '), act='Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr'.split(' ');
  const picture={H:'💧',He:'🎈',Li:'🔋',B:'🧪',C:'💎',N:'🌿',O:'🫁',F:'🦷',Ne:'💡',Na:'🧂',Mg:'✨',Al:'🥫',Si:'💻',P:'🔥',S:'🌋',Cl:'🏊',K:'🍌',Ca:'🦴',Ti:'✈️',Cr:'🔧',Mn:'🔩',Fe:'🏗️',Co:'🔵',Ni:'🪙',Cu:'🔌',Zn:'🛡️',Br:'🧴',Kr:'💡',Ag:'🥈',Sn:'🥫',I:'🩹',Xe:'🔦',W:'💡',Pt:'💍',Au:'🥇',Hg:'🌡️',Pb:'🔋',Ra:'☢️',U:'⚛️',Pu:'☢️'};
  const category=z=>z===1?'nonmetal':z===2||z===10||z===18||z===36||z===54||z===86||z===118?'noble':z===3||z===11||z===19||z===37||z===55||z===87?'alkali':z===4||z===12||z===20||z===38||z===56||z===88?'alkaline':(z>=57&&z<=71)?'lanthanide':(z>=89&&z<=103)?'actinide':([5,14,32,33,51,52].includes(z)?'metalloid':([6,7,8,15,16,34].includes(z)?'nonmetal':([9,17,35,53,85,117].includes(z)?'halogen':(z>=21&&z<=30)||(z>=39&&z<=48)||(z>=72&&z<=80)||(z>=104&&z<=112)?'transition':'metal')));
  const index=Object.fromEntries(symbols.map((s,i)=>[s,i]));
  const cells=[];
  periods.forEach((row,r)=>row.forEach(([s,c])=>cells.push({s,row:r+1,col:c})));
  lanth.forEach((s,i)=>cells.push({s,row:9,col:i+4}));act.forEach((s,i)=>cells.push({s,row:10,col:i+4}));
  const details=shelf.closest('details');
  const tools=document.createElement('div');tools.className='periodic-tools';tools.innerHTML='<label>🔎 <input id="element-search" type="search" placeholder="Buscar elemento o símbolo"></label><div class="periodic-legend"><span class="alkali">Alcalinos</span><span class="transition">Transición</span><span class="nonmetal">No metales</span><span class="noble">Gases nobles</span></div>';
  details.insertBefore(tools,shelf);
  shelf.className='element-shelf periodic-grid';
  shelf.innerHTML=cells.map(({s,row,col})=>{const i=index[s],z=i+1,n=names[i],cat=category(z),icon=picture[s]||((z>=57&&z<=71)?'🧲':(z>=89&&z<=103)?'☢️':cat==='noble'?'💡':cat==='transition'?'⚙️':'⚗️');return `<button class="periodic-element ${cat}" style="--period:${row};--group:${col}" data-find="${s.toLowerCase()} ${n.toLowerCase()}" title="${n}: muestra representativa"><small>${z}</small><b>${s}</b><i aria-hidden="true">${icon}</i><span>${n}</span></button>`}).join('');
  const search=document.getElementById('element-search');
  search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();document.querySelectorAll('.periodic-element').forEach(el=>el.classList.toggle('search-hidden',q&&!el.dataset.find.includes(q)));if(q)details.open=true});
})();
