(() => {
  'use strict';

  const W = 960, H = 540, GROUND = 462;
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, '0');
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const rects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const backgrounds = ['Blue','Brown','Gray','Green','Pink','Purple','Yellow'].map(n => `Background/${n}.png`);
  const fruits = ['Apple','Bananas','Cherries','Kiwi','Melon','Orange','Pineapple','Strawberry'].map(n => `Items/Fruits/${n}.png`);
  const characters = ['Mask Dude','Ninja Frog','Pink Man','Virtual Guy'];
  const charStates = ['Double Jump','Fall','Hit','Idle','Jump','Run','Wall Jump'];
  const charFiles = characters.flatMap(c => charStates.map(s => `Main Characters/${c}/${s} (32x32).png`));
  const menuButtons = ['Achievements','Back','Close','Leaderboard','Levels','Next','Play','Previous','Restart','Settings','Volume'].map(n => `Menu/Buttons/${n}.png`);
  const levelButtons = Array.from({length:50},(_,i)=>`Menu/Levels/${pad(i+1)}.png`);
  const boxes = [1,2,3].flatMap(n => [`Items/Boxes/Box${n}/Idle.png`,`Items/Boxes/Box${n}/Hit (28x24).png`,`Items/Boxes/Box${n}/Break.png`]);
  const checkpoints = [
    'Items/Checkpoints/Checkpoint/Checkpoint (Flag Idle)(64x64).png','Items/Checkpoints/Checkpoint/Checkpoint (Flag Out) (64x64).png','Items/Checkpoints/Checkpoint/Checkpoint (No Flag).png',
    'Items/Checkpoints/End/End (Idle).png','Items/Checkpoints/End/End (Pressed) (64x64).png','Items/Checkpoints/Start/Start (Idle).png','Items/Checkpoints/Start/Start (Moving) (64x64).png'
  ];
  const traps = [
    'Traps/Arrow/Hit (18x18).png','Traps/Arrow/Idle (18x18).png','Traps/Blocks/HitSide (22x22).png','Traps/Blocks/HitTop (22x22).png','Traps/Blocks/Idle.png','Traps/Blocks/Part 1 (22x22).png','Traps/Blocks/Part 2 (22x22).png',
    'Traps/Falling Platforms/Off.png','Traps/Falling Platforms/On (32x10).png','Traps/Fan/Off.png','Traps/Fan/On (24x8).png','Traps/Fire/Hit (16x32).png','Traps/Fire/Off.png','Traps/Fire/On (16x32).png',
    'Traps/Platforms/Brown Off.png','Traps/Platforms/Brown On (32x8).png','Traps/Platforms/Chain.png','Traps/Platforms/Grey Off.png','Traps/Platforms/Grey On (32x8).png',
    ...['Rock Head','Spike Head'].flatMap(n => ['Blink','Bottom Hit','Idle','Left Hit','Right Hit','Top Hit'].map(s => `Traps/${n}/${s}${s==='Idle'?'.png':` (${n==='Rock Head'?'42x42':'54x52'}).png`}`)),
    'Traps/Sand Mud Ice/Ice Particle.png','Traps/Sand Mud Ice/Mud Particle.png','Traps/Sand Mud Ice/Sand Mud Ice (16x6).png','Traps/Sand Mud Ice/Sand Particle.png',
    'Traps/Saw/Chain.png','Traps/Saw/Off.png','Traps/Saw/On (38x38).png','Traps/Spiked Ball/Chain.png','Traps/Spiked Ball/Spiked Ball.png','Traps/Spikes/Idle.png','Traps/Trampoline/Idle.png','Traps/Trampoline/Jump (28x28).png'
  ];
  const other = ['Items/Fruits/Collected.png','Main Characters/Appearing (96x96).png','Main Characters/Desappearing (96x96).png','Menu/Text/Text (Black) (8x10).png','Menu/Text/Text (White) (8x10).png','Other/Confetti (16x16).png','Other/Dust Particle.png','Other/Shadow.png','Other/Transition.png','Terrain/Terrain (16x16).png'];
  const ALL_ASSETS = [...backgrounds,...fruits,...charFiles,...menuButtons,...levelButtons,...boxes,...checkpoints,...traps,...other];
  const images = {};
  let loaded = 0;
  ALL_ASSETS.forEach(src => { const im = new Image(); im.onload = im.onerror = () => loaded++; im.src = src; images[src] = im; });

  // Fifty authored routes. Each digit is a 120px terrain section: 0 low, 1–3 raised, _ gap.
  // Hazard glyphs are deliberately separate so traversal and puzzle rhythm can be tuned independently.
  const ROUTES = [
    '00000111100000111100','00001111000022220000','0000__11110000__11110','00111100222200111100','00011112221111000000','0011__1122__11110000','00002222111100003330','001111__2222__111100','00011122233322211100','0000__1111__2222__000',
    '00011110002222001110','0011__222200__1111000','00022221111000333300','0011110000__22221110','00001111222233332220','0011__1111__2222__110','0002222__3333__111000','00111122220000333320','000__111222333__11100','0001__22__3333__22100',
    '00011122221110003330','0011__2222__3333__110','00022211110000333320','001111__3333__222200','00003333222211110000','0011__33332222__1110','0002222__1111__33300','00111133330000222220','000__222333111__22200','0001__333__2222__33100',
    '00011110002222333320','0011__22223333__11110','00033332221111002220','001122__3333__221110','00003333111122223330','0011__3333__1111__220','00022223333__11112220','00113333000022221110','000__333222111__33300','0001__33__2222__33100',
    '0001112223332221110000','0011__22333322__111100','0003332221110003332220','00112233__332211__1100','0000333311222233330000','0011__3332211__3332210','000222333__111__333220','0011333222000333222110','000__333222111333__110','0001__22__333__22__100'
  ];
  const HAZARDS = [
    '  b  s   t   b  s   ',' b s  t   b s  t     ','  b   d  s  b   d  s ',' b s  b t  s b  t    ','  t s b   t s  b     ',' b   d s b   d  s    ','  s  t b  s  t   b   ',' b s   d  b s  d     ','  t s b t s b  t     ',' b   d  s  b d  s    ',
    '  w  s   f   b  w   ',' b   d w  f   d  s   ','  w f  t  s  w f     ',' b s  w   d f  w     ','  f w s  t f  w s    ',' w   d f  w   d s    ','  f w   d  s f  w    ',' w s f  b  w f s     ','  d  w f s   d w f   ',' w  d f  w s d  f    ',
    '  n  a   i   m  n   ',' n   d a  i   d  m   ','  a i  n  m  a i     ',' n m  a   d i  n     ','  i a n  m i  a n    ',' a   d i  n   d m    ','  m a   d  i n  a    ',' a i n  m  a n i     ','  d  a i n   d m a   ',' n  d a  i m d  n    ',
    '  c  p   s   g  c   ',' p   c s  g   c  f   ','  c g  w  p  c s     ',' p s  c   g f  c     ','  g c w  p g  c s    ',' c   p g  c   p f    ','  w c   g  s p  c    ',' c g p  w  c s g     ','  p  c g w   p c s   ',' c  g p  c w g  c    ',
    '  s w f a n c p g o   ',' c d w f  a n  o s     ','  o g c w f a n s t   ',' p s c  d o f  a n    ','  g c o w p s f a n   ',' c d p g  o w  f s    ','  o c w  d a n p g s  ',' c g o w f  a n s p   ','  d o c w f a  n g s  ',' c o d w f a n p g s  '
  ];
  const BIOMES = [
    {name:'VERDANT VAULTS',bg:3,accent:'#79e36f',tip:'Baca ritme lompatan dan pecahkan box dari bawah.'},
    {name:'EMBER WORKS',bg:1,accent:'#ff8b55',tip:'Frog dapat menempel dan melompat dari dinding.'},
    {name:'PRISM MINES',bg:4,accent:'#ff78ad',tip:'Pink Man dapat phase melewati barrier ungu.'},
    {name:'CIRCUIT DEPTHS',bg:0,accent:'#69e4ff',tip:'Virtual Guy mematikan mesin selama 2.5 detik.'},
    {name:'THE LAST FOLD',bg:5,accent:'#d493ff',tip:'Gunakan semua tubuh. Jangan biarkan kepala mengejar.'}
  ];
  const CHAR_INFO = [
    {name:'MASK DUDE',folder:'Mask Dude',ability:'DOUBLE JUMP'},
    {name:'NINJA FROG',folder:'Ninja Frog',ability:'WALL CLING'},
    {name:'PINK MAN',folder:'Pink Man',ability:'PHASE'},
    {name:'VIRTUAL GUY',folder:'Virtual Guy',ability:'HACK'}
  ];

  const defaultSave = () => ({stage:0,unlocked:0,completed:[],elapsed:0,lives:3,achievements:[],scores:[],muted:false,reduced:false,runStarted:false});
  let save;
  try { save = {...defaultSave(),...JSON.parse(localStorage.getItem('fiftyfold-save')||'{}')}; } catch { save = defaultSave(); }
  const persist = () => localStorage.setItem('fiftyfold-save',JSON.stringify(save));

  const state = {screen:'title',stage:save.stage,paused:false,last:performance.now(),runBase:save.elapsed||0,runStamp:0,modal:'levels',modalPage:0,keys:{},pressed:{},camera:0,shake:0,transition:0,world:null,player:null,particles:[],hackUntil:0,audio:null};

  function img(src){ return images[src]; }
  function frame(src, x,y,w,h, sizeW=w,sizeH=h,flip=false,alpha=1){
    const im=img(src); if(!im||!im.complete) return;
    ctx.save(); ctx.globalAlpha=alpha; if(flip){ctx.translate(x+sizeW,0);ctx.scale(-1,1);x=0;}
    const tagged=src.match(/\((\d+)x\d+\)/); const animated=src.includes('Items/Fruits/')||src.includes('Main Characters/')||src.includes('Other/Confetti'); const fw=tagged?Number(tagged[1]):(src.includes('/Boxes/')?28:(animated?im.height:im.width)); const frames=Math.max(1,Math.floor(im.width/fw)); const sx=(Math.floor(state.last/95)%frames)*fw;
    ctx.drawImage(im,sx,0,fw,im.height,x,y,sizeW,sizeH); ctx.restore();
  }
  function formatTime(ms){ const total=Math.max(0,ms); const m=Math.floor(total/60000); const s=Math.floor(total/1000)%60; return `${pad(m)}:${pad(s)}.${String(Math.floor(total%1000)).padStart(3,'0')}`; }
  function runTime(){ return state.runBase + (save.runStarted && state.screen==='game' && !state.paused ? performance.now()-state.runStamp : 0); }
  function commitTime(){ if(save.runStarted && state.screen==='game' && !state.paused){ state.runBase=runTime(); save.elapsed=state.runBase; state.runStamp=performance.now(); } }
  function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),1800); }
  function showOnly(id){ $$('.overlay').forEach(x=>x.classList.remove('active')); if(id) $(id).classList.add('active'); }

  function audio(){ if(!state.audio) state.audio=new (window.AudioContext||window.webkitAudioContext)(); return state.audio; }
  function sfx(kind){ if(save.muted) return; const a=audio(),o=a.createOscillator(),g=a.createGain(); const spec={jump:[420,690,.08,'square'],fruit:[720,1100,.11,'sine'],hit:[160,60,.18,'sawtooth'],switch:[290,520,.12,'square'],win:[520,1040,.35,'triangle'],hack:[110,880,.22,'square']}[kind]||[300,400,.1,'square']; o.type=spec[3];o.frequency.setValueAtTime(spec[0],a.currentTime);o.frequency.exponentialRampToValueAtTime(spec[1],a.currentTime+spec[2]);g.gain.setValueAtTime(.08,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+spec[2]);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+spec[2]); }

  function makeWorld(index){
    const route=ROUTES[index], hz=HAZARDS[index]||'', biome=Math.floor(index/10), platforms=[], hazards=[], fruitList=[], boxList=[], mechanics=[];
    const topOf=(i)=> route[i]==='_' ? 380 : GROUND-Number(route[i]||0)*62;
    for(let i=0;i<route.length;i++){
      const x=i*120, ch=route[i];
      if(ch!=='_') platforms.push({x,y:topOf(i),w:122,h:H-topOf(i),type:'ground'});
      const h=hz[i]||' ';
      const y=topOf(i);
      if(h==='d'){platforms.push({x:x+30,y:y-72,w:72,h:12,type:'fall'});}
      if('swfangoc'.includes(h)) hazards.push({type:h,x:x+48,y:y-(h==='f'?32:h==='o'?74:h==='c'?28:24),w:h==='o'?28:h==='c'?28:26,h:h==='f'?32:h==='o'?74:28,active:true});
      if(h==='t') hazards.push({type:'t',x:x+43,y:y-28,w:36,h:28,active:true});
      if(h==='b') boxList.push({x:x+46,y:y-32,w:34,h:30,type:(i+index)%3+1,state:'idle',timer:0});
      if(h==='m'||h==='i') mechanics.push({type:h,x:x+10,y:y-9,w:100,h:9});
      if(h==='p'||h==='g'){platforms.push({x:x+30,y:y-84,w:76,h:12,type:h==='p'?'brown':'grey'});}
      if(i>0 && i<route.length-1 && ch!=='_' && (i%2===1 || i%5===0)) fruitList.push({x:x+54,y:y-70-(i%3)*20,w:28,h:28,type:(i+index)%fruits.length,collected:false});
    }
    if(index>=20) mechanics.push({type:'barrier',x:Math.floor(route.length*.54)*120,y:170,w:22,h:292});
    if(index>=30) mechanics.push({type:'laser',x:Math.floor(route.length*.72)*120,y:155,w:18,h:307});
    const routeMiddle=Math.floor(route.length/2);
    let checkpointIndex=routeMiddle;
    for(let distance=0;distance<route.length;distance++){
      const candidates=[routeMiddle-distance,routeMiddle+distance];
      const safe=candidates.find(i=>i>0&&i<route.length-1&&route[i]!=='_'&&(!hz[i]||hz[i]===' '));
      if(safe!==undefined){checkpointIndex=safe;break;}
    }
    const checkpoint={x:checkpointIndex*120+60,y:topOf(checkpointIndex)};
    const boss=index%10===9 ? {x:-120,y:GROUND-62,w:58,h:58,type:(biome%2?'Spike Head':'Rock Head'),speed:68+biome*10} : null;
    return {index,biome,route,width:route.length*120,platforms,hazards,fruits:fruitList,boxes:boxList,mechanics,boss,checkpoint,start:52,end:route.length*120-88,fruitTotal:fruitList.length,collected:0,started:performance.now(),cleared:false};
  }

  function loadStage(index, fresh=true){
    state.stage=clamp(index,0,49); save.stage=state.stage; save.unlocked=Math.max(save.unlocked,state.stage); persist();
    state.world=makeWorld(state.stage); state.camera=0; state.hackUntil=0; state.particles=[];
    state.player={x:52,y:330,w:25,h:30,vx:0,vy:0,onGround:false,onWall:0,jumps:0,char:Math.min(Math.floor(state.stage/10),3),face:1,state:'Idle',anim:'appear',animUntil:performance.now()+620,phase:false,dead:false};
    state.transition=fresh?1:0; updateHUD();
  }
  function startRun(isNew=false){
    if(isNew){ const scores=save.scores||[],muted=save.muted,reduced=save.reduced; save=defaultSave();save.scores=scores;save.muted=muted;save.reduced=reduced;state.runBase=0;save.runStarted=true;save.lives=3; }
    else { state.runBase=save.elapsed||0; save.runStarted=true; }
    state.runStamp=performance.now(); state.screen='game';state.paused=false;showOnly(null);$('#hud').classList.remove('hidden');loadStage(save.stage||0);persist();
    toast(`${BIOMES[Math.floor(state.stage/10)].name} · ${BIOMES[Math.floor(state.stage/10)].tip}`);
  }
  function updateHUD(){ if(!state.world)return; const b=state.world.biome;$('#worldLabel').textContent=`BIOME ${b+1} · ${BIOMES[b].name}`;$('#stageLabel').textContent=pad(state.stage+1);$('#fruitLabel').textContent=`FRUIT ${state.world.collected}/${state.world.fruitTotal}`;$('#characterLabel').textContent=`${CHAR_INFO[state.player?.char||0].name} · ${CHAR_INFO[state.player?.char||0].ability}`;$('#livesLabel').textContent='♥ '.repeat(save.lives).trim(); }

  function jump(){ const p=state.player;if(!p||p.dead)return;
    if(p.onGround){p.vy=-490;p.onGround=false;p.jumps=1;sfx('jump');dust(p.x+p.w/2,p.y+p.h);}
    else if(p.char===0&&p.jumps<2){p.vy=-450;p.jumps=2;p.state='Double Jump';sfx('jump');burst(p.x,p.y,'#fff',5);}
    else if(p.char===1&&p.onWall){p.vy=-470;p.vx=-p.onWall*290;p.face=-p.onWall;p.state='Wall Jump';p.jumps=1;sfx('jump');}
  }
  function ability(){ const p=state.player;if(!p||p.dead)return;
    if(p.char===0&&p.jumps<2&&!p.onGround){p.vy=-450;p.jumps=2;sfx('jump');}
    if(p.char===2){p.phase=true;sfx('switch');setTimeout(()=>{if(state.player)p.phase=false;},900);toast('PHASE · 0.9 SEC');}
    if(p.char===3){state.hackUntil=performance.now()+2500;sfx('hack');toast('SYSTEMS OFFLINE · 2.5 SEC');}
  }
  function switchChar(){ const max=Math.min(Math.floor(state.stage/10),3);if(max<1){toast('NEXT BODY LOCKED');return;}const p=state.player;p.char=(p.char+1)%(max+1);p.anim='appear';p.animUntil=performance.now()+400;sfx('switch');updateHUD();toast(`${CHAR_INFO[p.char].name} · ${CHAR_INFO[p.char].ability}`); }

  function burst(x,y,color,count=8){for(let i=0;i<count;i++)state.particles.push({x,y,vx:(Math.random()-.5)*190,vy:(Math.random()-.8)*170,life:.65,color});}
  function dust(x,y){state.particles.push({x,y,vx:-state.player.vx*.15,vy:-20,life:.35,sprite:'Other/Dust Particle.png'});}
  function hurt(){const p=state.player;if(!p||p.dead||performance.now()<p.invuln)return;p.dead=true;p.state='Hit';p.anim='disappear';p.animUntil=performance.now()+650;sfx('hit');state.shake=12;save.lives--;updateHUD();commitTime();save.elapsed=state.runBase;persist();setTimeout(()=>{if(save.lives<=0){state.screen='over';$('#gameOverText').textContent=`Stage ${pad(state.stage+1)} menghabiskan nyawa terakhir. Kembali ke stage ${pad(Math.floor(state.stage/10)*10+1)}.`;showOnly('#gameOver');$('#hud').classList.add('hidden');}else loadStage(state.stage,false);},700); }
  function collect(f){f.collected=true;state.world.collected++;sfx('fruit');burst(f.x+14,f.y+14,BIOMES[state.world.biome].accent);state.particles.push({x:f.x,y:f.y,vx:0,vy:-70,life:.45,sprite:'Items/Fruits/Collected.png'});unlockAchievement('collector',state.world.collected>=state.world.fruitTotal);updateHUD();if(state.world.collected===state.world.fruitTotal)toast('EXIT UNLOCKED');}
  function unlockAchievement(id,condition=true){if(condition&&!save.achievements.includes(id)){save.achievements.push(id);persist();toast('ACHIEVEMENT UNLOCKED');}}

  function physics(dt){
    const p=state.player,w=state.world;if(!p||p.dead)return; const left=state.keys.KeyA||state.keys.ArrowLeft,right=state.keys.KeyD||state.keys.ArrowRight;
    let accel=p.onGround?1500:920,max=250;
    const mud=w.mechanics.some(m=>m.type==='m'&&rects(p,m)), ice=w.mechanics.some(m=>m.type==='i'&&rects(p,m));if(mud)max=125;if(ice)accel=260;
    if(left){p.vx=Math.max(p.vx-accel*dt,-max);p.face=-1;} else if(right){p.vx=Math.min(p.vx+accel*dt,max);p.face=1;} else p.vx*=Math.pow(ice?.97:.78,dt*60);
    p.vy+=1180*dt;p.vy=Math.min(p.vy,680);p.onWall=0;
    w.hazards.filter(h=>h.type==='n').forEach(h=>{if(Math.abs((p.x+p.w/2)-(h.x+h.w/2))<50&&p.y<h.y&&p.y>h.y-210&&performance.now()>state.hackUntil)p.vy-=1500*dt;});
    const previousX=p.x;
    p.x+=p.vx*dt;
    const solids=[...w.platforms,...w.mechanics.filter(m=>m.type==='barrier'&&!p.phase)];
    solids.forEach(s=>{if(rects(p,s)){if(p.vx>0){p.x=s.x-p.w;p.onWall=1;}else if(p.vx<0){p.x=s.x+s.w;p.onWall=-1;}p.vx=0;}});
    const previousY=p.y,previousBottom=p.y+p.h;
    p.y+=p.vy*dt;p.onGround=false;
    solids.forEach(s=>{if(rects(p,s)){if(p.vy>=0&&p.y+p.h-s.y<34){p.y=s.y-p.h;p.vy=0;p.onGround=true;p.jumps=0;}else if(p.vy<0){p.y=s.y+s.h;p.vy=25;w.boxes.forEach(b=>{if(Math.abs((b.x+b.w/2)-(p.x+p.w/2))<34&&Math.abs(b.y-(p.y))<70){b.state='hit';b.timer=.25;sfx('hit');}});}}});
    if(p.char===1&&p.onWall&&!p.onGround&&p.vy>90)p.vy=90;
    w.boxes.forEach(b=>{
      b.timer-=dt;
      if(b.timer<=0&&b.state==='hit'){b.state='break';b.timer=.35;burst(b.x,b.y,'#ffd166',5);}
      else if(b.timer<=0&&b.state==='break')b.state='gone';
      if(b.state==='gone'||!rects(p,b))return;
      const wasAbove=previousBottom<=b.y+4;
      const wasBelow=previousY>=b.y+b.h-4;
      if(p.vy>=0&&wasAbove){p.y=b.y-p.h;p.vy=0;p.onGround=true;p.jumps=0;}
      else if(p.vy<0&&wasBelow){p.y=b.y+b.h;p.vy=50;b.state='hit';b.timer=.25;sfx('hit');}
      else{p.x=previousX;if(previousX+p.w<=b.x+5)p.x=b.x-p.w;else if(previousX>=b.x+b.w-5)p.x=b.x+b.w;p.vx=0;}
    });
    const trapsOff=performance.now()<state.hackUntil;
    w.hazards.forEach(h=>{if(h.type==='t'&&rects(p,h)&&p.vy>0){p.y=h.y-p.h;p.vy=-590;p.jumps=0;sfx('jump');}else if(h.type!=='n'&&h.type!=='t'&&!trapsOff&&rects(p,h))hurt();});
    w.mechanics.filter(m=>m.type==='laser').forEach(m=>{if(!trapsOff&&rects(p,m))hurt();});
    if(w.boss){const b=w.boss;b.x+=b.speed*dt;if(p.x-b.x>360)b.x+=55*dt;if(rects(p,b))hurt();if(b.x>p.x+100)b.x=p.x-180;}
    w.fruits.forEach(f=>{if(!f.collected&&rects(p,f))collect(f);});
    if(p.y>H+120||p.x< (w.boss? w.boss.x-40:-100))hurt();
    const exit={x:w.end,y:GROUND-70,w:50,h:70};if(w.collected===w.fruitTotal&&rects(p,exit)&&!w.cleared)clearStage();
    state.camera=clamp(state.camera+(p.x-W*.38-state.camera)*Math.min(1,dt*5),0,Math.max(0,w.width-W));
    p.state=p.onGround?(Math.abs(p.vx)>30?'Run':'Idle'):(p.onWall&&p.char===1?'Wall Jump':(p.vy<0?(p.jumps===2?'Double Jump':'Jump'):'Fall'));
  }

  function clearStage(){const w=state.world;w.cleared=true;sfx('win');for(let i=0;i<30;i++)state.particles.push({x:state.player.x,y:state.player.y,vx:(Math.random()-.5)*430,vy:-Math.random()*350,life:1.8,sprite:'Other/Confetti (16x16).png'});commitTime();save.elapsed=state.runBase;if(!save.completed.includes(state.stage))save.completed.push(state.stage);unlockAchievement('first');if(state.stage%10===9)unlockAchievement(`biome${w.biome+1}`);if(state.stage===49){unlockAchievement('master');save.stage=49;persist();setTimeout(victory,900);return;}save.stage=state.stage+1;save.unlocked=Math.max(save.unlocked,save.stage);if(save.stage%10===0)save.lives=3;persist();setTimeout(()=>{loadStage(save.stage);toast(save.stage%10===0?`${CHAR_INFO[Math.min(Math.floor(save.stage/10),3)].name} UNLOCKED`:`STAGE ${pad(save.stage+1)}`);},850); }
  function victory(){commitTime();save.elapsed=state.runBase;save.runStarted=false;persist();state.screen='victory';$('#hud').classList.add('hidden');$('#victoryTime').textContent=`Final time: ${formatTime(state.runBase)}`;showOnly('#victory');}

  function drawBackground(){const w=state.world,b=BIOMES[w.biome],im=img(backgrounds[b.bg]);ctx.fillStyle='#18202d';ctx.fillRect(0,0,W,H);if(im&&im.complete){const shift=-(state.camera*.08)%128;ctx.globalAlpha=.72;for(let x=shift-128;x<W+128;x+=128)for(let y=0;y<H;y+=128)ctx.drawImage(im,x,y,128,128);ctx.globalAlpha=1;}ctx.fillStyle='#0c102080';ctx.fillRect(0,0,W,H);for(let i=0;i<16;i++){const x=((i*173-state.camera*.18)%(W+160)+W+160)%(W+160)-80;ctx.fillStyle=`${b.accent}18`;ctx.fillRect(x,80+(i*71)%330,3,3);}}
  function drawTerrain(s){const b=state.world.biome,atlas=img('Terrain/Terrain (16x16).png');ctx.fillStyle=['#63442e','#743a2b','#80624c','#3d4b66','#48314f'][b];ctx.fillRect(s.x,s.y,s.w,s.h);if(atlas&&atlas.complete){const crops=[[96,0],[96,48],[96,112],[192,48],[288,128]],c=crops[b];for(let x=s.x;x<s.x+s.w;x+=48)ctx.drawImage(atlas,c[0],c[1],48,48,x,s.y,50,48);}ctx.fillStyle='#10131c55';ctx.fillRect(s.x,s.y+47,s.w,s.h-47);}
  function drawWorld(){const w=state.world,c=state.camera;ctx.save();ctx.translate(-Math.floor(c),0);
    w.platforms.forEach(s=>{if(s.type==='ground')drawTerrain(s);else{const on=performance.now()>state.hackUntil;const path=s.type==='fall'?'Traps/Falling Platforms/On (32x10).png':`Traps/Platforms/${s.type==='brown'?'Brown':'Grey'} ${on?'On (32x8)':'Off'}.png`;if(s.type!=='fall'){const chain=img('Traps/Platforms/Chain.png');for(let y=0;y<s.y;y+=16)ctx.drawImage(chain,s.x+s.w/2-4,y,8,16);}frame(path,s.x,s.y,s.w,18, s.w,18);}});
    // Start, midpoint checkpoint, and goal use every checkpoint family during a run.
    const startAge=performance.now()-w.started;frame(startAge<900?'Items/Checkpoints/Start/Start (Moving) (64x64).png':'Items/Checkpoints/Start/Start (Idle).png',w.start-26,GROUND-64,64,64,64,64);
    const cp=w.checkpoint, passed=state.player.x>cp.x;frame(passed?'Items/Checkpoints/Checkpoint/Checkpoint (Flag Idle)(64x64).png':'Items/Checkpoints/Checkpoint/Checkpoint (No Flag).png',cp.x-32,cp.y-64,64,64,64,64);
    if(Math.abs(state.player.x-cp.x)<55&&!passed)frame('Items/Checkpoints/Checkpoint/Checkpoint (Flag Out) (64x64).png',cp.x-32,cp.y-64,64,64,64,64);
    frame(w.collected===w.fruitTotal?'Items/Checkpoints/End/End (Pressed) (64x64).png':'Items/Checkpoints/End/End (Idle).png',w.end-8,GROUND-64,64,64,64,64);
    w.mechanics.forEach(m=>{if(m.type==='barrier'){ctx.fillStyle=state.player.phase?'#ff7ed433':'#ff7ed4aa';ctx.fillRect(m.x,m.y,m.w,m.h);for(let y=m.y;y<m.y+m.h;y+=24)ctx.fillStyle='#ffd1ef',ctx.fillRect(m.x+7,y,8,12);}else if(m.type==='laser'){const off=performance.now()<state.hackUntil;ctx.fillStyle=off?'#68f7da22':'#63eeffcc';ctx.fillRect(m.x,m.y,m.w,m.h);frame(off?'Traps/Fire/Off.png':'Traps/Fire/On (16x32).png',m.x-7,m.y,32,64,32,64);}else{const path=m.type==='i'?'Traps/Sand Mud Ice/Ice Particle.png':m.type==='m'?'Traps/Sand Mud Ice/Mud Particle.png':'Traps/Sand Mud Ice/Sand Particle.png';ctx.fillStyle=m.type==='i'?'#9feaff99':'#6c432d';ctx.fillRect(m.x,m.y,m.w,m.h);for(let x=m.x;x<m.x+m.w;x+=24)ctx.drawImage(img(path),x,m.y-7,16,16);}});
    w.boxes.forEach(b=>{if(b.state==='gone')return;let path=`Items/Boxes/Box${b.type}/Idle.png`;if(b.state==='hit')path=`Items/Boxes/Box${b.type}/Hit (28x24).png`;if(b.state==='break')path=`Items/Boxes/Box${b.type}/Break.png`;frame(path,b.x,b.y,34,30,34,30);});
    w.fruits.forEach(f=>{if(!f.collected)frame(fruits[f.type],f.x,f.y,30,30,30,30);});
    const off=performance.now()<state.hackUntil;
    w.hazards.forEach(h=>drawHazard(h,off));
    if(w.boss)drawBoss(w.boss);
    drawPlayer();
    state.particles.forEach(p=>{if(p.sprite)frame(p.sprite,p.x,p.y,18,18,18,18);else{ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,5,5);}});
    ctx.restore();
  }
  function drawHazard(h,off){const map={s:'Traps/Spikes/Idle.png',w:off?'Traps/Saw/Off.png':'Traps/Saw/On (38x38).png',f:off?'Traps/Fire/Off.png':'Traps/Fire/On (16x32).png',a:off?'Traps/Arrow/Hit (18x18).png':'Traps/Arrow/Idle (18x18).png',n:off?'Traps/Fan/Off.png':'Traps/Fan/On (24x8).png',t:'Traps/Trampoline/Jump (28x28).png',o:'Traps/Spiked Ball/Spiked Ball.png',c:'Traps/Blocks/Idle.png'};if(h.type==='o'){const chain=img('Traps/Spiked Ball/Chain.png');for(let y=h.y-80;y<h.y+46;y+=8)ctx.drawImage(chain,h.x+10,y,8,8);}if(h.type==='w'){const chain=img('Traps/Saw/Chain.png');ctx.drawImage(chain,h.x+9,h.y-40,8,48);}frame(map[h.type],h.x,h.y,h.w,h.h,h.w,h.h);}
  function drawBoss(b){const blink=Math.floor(state.last/700)%5===0;let stateName=blink?'Blink':(Math.floor(state.last/280)%4===0?'Right Hit':'Idle');let suffix=stateName==='Idle'?'.png':` (${b.type==='Rock Head'?'42x42':'54x52'}).png`;frame(`Traps/${b.type}/${stateName}${suffix}`,b.x,b.y,b.w,b.h,b.w,b.h);ctx.fillStyle='#ff5d7399';ctx.fillRect(b.x-6,b.y+b.h,b.w+12,4);}
  function drawPlayer(){const p=state.player;if(!p)return;ctx.globalAlpha=.28;ctx.drawImage(img('Other/Shadow.png'),p.x-6,p.y+p.h-2,38,14);ctx.globalAlpha=1;if(p.anim&&performance.now()<p.animUntil){const path=p.anim==='appear'?'Main Characters/Appearing (96x96).png':'Main Characters/Desappearing (96x96).png';frame(path,p.x-34,p.y-38,96,96,96,96,p.face<0);return;}p.anim=null;const folder=CHAR_INFO[p.char].folder,src=`Main Characters/${folder}/${p.state} (32x32).png`;frame(src,p.x-5,p.y-3,36,36,36,36,p.face<0,p.phase?.45:1);}
  function render(){ctx.save();if(state.shake>0&&!save.reduced){ctx.translate((Math.random()-.5)*state.shake,(Math.random()-.5)*state.shake);state.shake*=.86;}if(state.world){drawBackground();drawWorld();}else{ctx.fillStyle='#111522';ctx.fillRect(0,0,W,H);}ctx.restore();if(state.screen==='game'&&state.transition>0){ctx.globalAlpha=state.transition;ctx.fillStyle='#0c101a';ctx.fillRect(0,0,W,H);const tr=img('Other/Transition.png');if(tr&&tr.complete)for(let x=0;x<W;x+=88)for(let y=0;y<H;y+=88)ctx.drawImage(tr,x,y,88,88);ctx.globalAlpha=1;state.transition=Math.max(0,state.transition-.045);} }
  function updateParticles(dt){state.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=360*dt;p.life-=dt;});state.particles=state.particles.filter(p=>p.life>0);}
  function loop(now){const dt=Math.min(.032,(now-state.last)/1000||0);state.last=now;if(state.screen==='game'&&!state.paused){physics(dt);updateParticles(dt);$('#timerLabel').textContent=formatTime(runTime());}render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

  const ACH=[['first','FIRST STEP','Clear one stage'],['collector','CLEAN SWEEP','Collect every fruit in a stage'],['biome1','GREENLIGHT','Escape Verdant Vaults'],['biome2','FIREPROOF','Escape Ember Works'],['biome3','PHASED','Escape Prism Mines'],['biome4','ROOT ACCESS','Escape Circuit Depths'],['biome5','UNFOLDED','Escape The Last Fold'],['master','FIFTYFOLD','Clear all 50 stages']];
  function openModal(type,page=0){state.modal=type;state.modalPage=page;state.screen='modal';showOnly('#modal');renderModal();}
  function renderModal(){const type=state.modal,body=$('#modalBody'),page=state.modalPage;$('#modalEyebrow').textContent=type==='achievements'?'PLAYER ARCHIVE':type==='leaderboard'?'LOCAL RECORDS':type==='settings'?'SYSTEM':'STAGE SELECT';$('#modalTitle').textContent=type.toUpperCase();$('.pager').style.display=type==='achievements'?'flex':'none';
    if(type==='levels'){body.innerHTML=`<div class="biome-tabs">${BIOMES.map((b,i)=>`<button data-biome="${i}" class="${page===i?'active':''}">${i+1}</button>`).join('')}</div><div class="level-grid">${Array.from({length:10},(_,j)=>{const n=page*10+j,locked=n>save.unlocked,done=save.completed.includes(n);return `<button class="level-tile ${locked?'locked':''} ${done?'done':''} ${n===save.stage?'current':''}" data-level="${n}" ${locked?'disabled':''}><img src="Menu/Levels/${pad(n+1)}.png" alt="Level ${n+1}"></button>`}).join('')}</div>`;}
    if(type==='achievements'){if(page===0)body.innerHTML=`<div class="achievement-list">${ACH.map(a=>`<div class="achievement ${save.achievements.includes(a[0])?'':'locked'}"><span><strong>${a[1]}</strong><br><small>${a[2]}</small></span><span>${save.achievements.includes(a[0])?'✓':'?'}</span></div>`).join('')}</div>`;else body.innerHTML=`<p>Every supplied PNG is visible here and used by gameplay or interface.</p><div class="codex">${ALL_ASSETS.map(p=>`<figure><img src="${p}" alt=""><figcaption>${esc(p.split('/').pop())}</figcaption></figure>`).join('')}</div>`;}
    if(type==='leaderboard'){const scores=[...(save.scores||[])].sort((a,b)=>a.time-b.time);body.innerHTML=scores.length?`<div class="leader-list">${scores.slice(0,10).map((s,i)=>`<div class="leader-row"><span>${pad(i+1)} · ${esc(s.name)}</span><strong>${formatTime(s.time)}</strong></div>`).join('')}</div>`:'<p>No completed runs yet. The clock is waiting.</p>';}
    if(type==='settings')body.innerHTML=`<div class="setting"><span>SOUND EFFECTS</span><button data-setting="mute">${save.muted?'OFF':'ON'}</button></div><div class="setting"><span>CAMERA SHAKE</span><button data-setting="motion">${save.reduced?'OFF':'ON'}</button></div><div class="setting"><span>SAVE DATA</span><button data-setting="clear">CLEAR PROGRESS</button></div><p><small>Controls: A/D or arrows to move · Space to jump · E character ability · Q switch character · Esc pause.</small></p>`;
  }
  function closeModal(){state.screen='title';showOnly('#titleScreen');}
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const action=b.dataset.action,panel=b.dataset.panel;
    if(panel)openModal(panel);if(action==='play')startRun(false);if(action==='new'){if(confirm('Start a new run? Existing stage progress will reset.'))startRun(true);}if(action==='volume'){save.muted=!save.muted;persist();toast(save.muted?'SFX OFF':'SFX ON');}if(action==='resume'){state.paused=false;state.screen='game';state.runStamp=performance.now();showOnly(null);$('#hud').classList.remove('hidden');}if(action==='restart-stage'){state.paused=false;state.screen='game';state.runStamp=performance.now();showOnly(null);loadStage(state.stage,false);}if(action==='home'){commitTime();state.screen='title';showOnly('#titleScreen');$('#hud').classList.add('hidden');persist();}if(action==='close-modal')closeModal();if(action==='previous'){state.modalPage=Math.max(0,state.modalPage-1);renderModal();}if(action==='next'){state.modalPage=Math.min(1,state.modalPage+1);renderModal();}if(action==='retry-biome'){save.lives=3;save.stage=Math.floor(state.stage/10)*10;state.screen='game';state.runStamp=performance.now();showOnly(null);$('#hud').classList.remove('hidden');loadStage(save.stage);}if(action==='save-score'){const name=($('#runnerName').value||'PLAYER').trim().toUpperCase().slice(0,12);save.scores.push({name,time:state.runBase,date:Date.now()});persist();state.screen='title';showOnly('#titleScreen');}
    if(b.dataset.biome!==undefined){state.modalPage=Number(b.dataset.biome);renderModal();}if(b.dataset.level!==undefined){const n=Number(b.dataset.level);if(n<=save.unlocked){commitTime();state.screen='game';state.runStamp=performance.now();showOnly(null);$('#hud').classList.remove('hidden');loadStage(n);}}
    if(b.dataset.setting==='mute'){save.muted=!save.muted;persist();renderModal();}if(b.dataset.setting==='motion'){save.reduced=!save.reduced;persist();renderModal();}if(b.dataset.setting==='clear'){if(confirm('Clear stage progress and achievements? Local leaderboard will remain.')){const scores=save.scores,muted=save.muted,reduced=save.reduced;save=defaultSave();save.scores=scores;save.muted=muted;save.reduced=reduced;state.runBase=0;persist();renderModal();}}
  });
  addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(!state.keys[e.code]){if(state.screen==='game'&&!state.paused){if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')jump();if(e.code==='KeyE')ability();if(e.code==='KeyQ')switchChar();if(e.code==='Escape'){commitTime();state.paused=true;state.screen='pause';showOnly('#pauseScreen');}}else if(e.code==='Escape'&&state.screen==='pause'){$('[data-action="resume"]').click();}}state.keys[e.code]=true;});
  addEventListener('keyup',e=>state.keys[e.code]=false);
  addEventListener('blur',()=>{if(state.screen==='game'&&!state.paused){commitTime();state.paused=true;state.screen='pause';showOnly('#pauseScreen');}});
  addEventListener('beforeunload',()=>{commitTime();save.elapsed=state.runBase;persist();});
  setInterval(()=>{if(state.screen==='game'&&!state.paused){commitTime();persist();}},5000);
  loadStage(save.stage||0);state.screen='title';showOnly('#titleScreen');$('#hud').classList.add('hidden');
})();
