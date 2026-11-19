// npm i ws && node server.js
const {WebSocketServer}=require('ws'),fs=require('fs');
let DB={u:{}};try{DB=JSON.parse(fs.readFileSync('data.json'))}catch(e){}
setInterval(()=>fs.writeFile('data.json',JSON.stringify(DB),()=>{}),10000);
const WP={pistola:25,mp40:12,rifle:22,escopeta:10,sniper:120},MAXN={escopeta:7};
const PR={pistola:0,mp40:150,rifle:300,escopeta:250,sniper:600,pico:100,mochila:120};
const P=new Map(),M=[],C=[];let nid=1;
const rnd=(a,b)=>a+Math.random()*(b-a);
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const send=(w,o)=>w.readyState===1&&w.send(JSON.stringify(o));
const prof=u=>({n:u.name,ch:u.ch,m:u.money,own:u.own});
const vec=a=>Array.isArray(a)&&a.length==3&&a.every(Number.isFinite)?a:null;
const wss=new WebSocketServer({port:process.env.PORT||8080});
wss.on('connection',w=>{
 const p={id:nid++,hp:100,h:[0,1.6,0],l:[0,1,0],r:[0,1,0],u:null};
 const mx=()=>p.u.own.includes('mochila')?150:100;
 const me=tp=>send(w,{t:'me',id:p.id,u:prof(p.u),tp});
 w.on('message',d=>{let m;try{m=JSON.parse(d)}catch(e){return}
  if(m.t=='hi'){const k=String(m.tok).slice(0,40);p.u=DB.u[k]=DB.u[k]||{name:'',ch:0,money:0,own:['pistola']};p.hp=mx();if(p.u.name)P.set(w,p);return me()}
  if(!p.u)return;
  if(m.t=='name'){const n=String(m.n);let e='';
   if(!/^[A-Za-z0-9_]{3,14}$/.test(n))e='Nombre inválido (3-14 letras, números o _)';
   else if(p.u.name&&p.u.ch>=1)e='Ya usaste tu único cambio de nombre';
   else if(p.u.name==n)e='Ese ya es tu nombre';
   else if(Object.values(DB.u).some(x=>x.name.toLowerCase()==n.toLowerCase()))e='Ese nombre ya está usado';
   if(e)return send(w,{t:'err',e});
   if(p.u.name)p.u.ch++;p.u.name=n;P.set(w,p);return me()}
  if(!P.has(w))return;
  if(m.t=='pos'){p.h=vec(m.h)||p.h;p.l=vec(m.l)||p.l;p.r=vec(m.r)||p.r}
  if(m.t=='buy'){const k=m.k,u=p.u;if(has(PR,k)&&!u.own.includes(k)&&u.money>=PR[k]){u.money-=PR[k];u.own.push(k);me()}}
  if(m.t=='hit'){const o=M.find(x=>x.id==m.id);if(!o||!has(WP,m.w)||!p.u.own.includes(m.w))return;
   o.hp-=WP[m.w]*Math.min(+m.n||1,MAXN[m.w]||1);
   if(o.hp<=0){M.splice(M.indexOf(o),1);p.u.money+=20;me()}}
 });
 w.on('close',()=>P.delete(w));
});
setInterval(()=>{const E=[...P.entries()],ps=E.map(e=>e[1]);
 if(ps.length)while(M.length<3+ps.length*3){const a=rnd(0,6.28),r=rnd(25,70);M.push({id:nid++,x:Math.cos(a)*r,z:Math.sin(a)*r,hp:100})}
 while(C.length<40)C.push({id:nid++,x:rnd(-70,70),z:rnd(-70,70),y:rnd(.3,1.3),v:Math.round(rnd(5,15))});
 for(const m of M){let b=null,bd=45;
  for(const p of ps){const d=Math.hypot(p.h[0]-m.x,p.h[2]-m.z);if(d<bd){bd=d;b=p}}
  if(b&&bd>.05){m.x+=(b.h[0]-m.x)/bd*.14;m.z+=(b.h[2]-m.z)/bd*.14;
   if(bd<1.2&&b.h[1]<2.5)b.hp-=1.2}} // subirte a una roca alta (>2.5 m) te salva
 for(const [w,p] of E){const mx=p.u.own.includes('mochila')?150:100;
  p.hp=Math.min(mx,p.hp+.02);
  if(p.hp<=0){p.hp=mx;p.u.money>>=1;p.h=[0,1.6,0];send(w,{t:'me',id:p.id,u:prof(p.u),tp:1})}
  for(let i=C.length-1;i>=0;i--){const c=C[i];
   if([p.h,p.l,p.r].some(q=>Math.hypot(q[0]-c.x,q[1]-c.y,q[2]-c.z)<.8)){
    C.splice(i,1);p.u.money+=c.v*(p.u.own.includes('pico')?2:1);send(w,{t:'me',id:p.id,u:prof(p.u)})}}}
 const s=JSON.stringify({t:'s',p:ps.map(p=>({id:p.id,n:p.u.name,h:p.h,l:p.l,r:p.r,hp:p.hp})),m:M.map(m=>[m.id,m.x,m.z]),c:C.map(c=>[c.id,c.x,c.y,c.z])});
 for(const [w] of E)if(w.readyState===1)w.send(s)},50);
