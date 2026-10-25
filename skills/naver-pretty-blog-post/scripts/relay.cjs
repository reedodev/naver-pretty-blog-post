const http=require('http');
http.createServer(async(req,res)=>{
 let b='';for await(const c of req)b+=c;
 try{
  const {port,target,method,params,list,setFile,chooser}=JSON.parse(b);
  const tabs=await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  if(list){res.end(JSON.stringify(tabs.map(t=>({id:t.id,type:t.type,url:t.url,title:t.title}))));return;}
  const t=tabs.find(x=>x.type==='page'&&(!target||x.url.includes(target)||x.id===target));
  if(!t){res.end(JSON.stringify({error:'no target'}));return;}
  const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
  if(chooser){let id=0;const pend={};let opened;const waitOpen=new Promise(r=>opened=r);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend[m.id]){pend[m.id](m);delete pend[m.id];}else if(m.method==='Page.fileChooserOpened'){opened(m.params);}};const send=(method,params={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method,params}));});await send('Page.enable');await send('Page.setInterceptFileChooserDialog',{enabled:true});await send('Runtime.evaluate',{expression:chooser.clickExpr,userGesture:true});const p=await Promise.race([waitOpen,new Promise(r=>setTimeout(()=>r(null),8000))]);if(!p){ws.close();res.end(JSON.stringify({error:'no chooser'}));return;}const rr=await send('DOM.setFileInputFiles',{files:chooser.files,backendNodeId:p.backendNodeId});await new Promise(r=>setTimeout(r,500));ws.close();res.end(JSON.stringify({ok:rr,mode:p.mode}));return;}
  if(setFile){let id=0;const pend={};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend[m.id]){pend[m.id](m);delete pend[m.id];}};const send=(method,params={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method,params}));});const ev=await send('Runtime.evaluate',{expression:setFile.expr});const oid=ev.result.result.objectId;const rr=await send('DOM.setFileInputFiles',{objectId:oid,files:setFile.files});ws.close();res.end(JSON.stringify(rr));return;}
  const out=await new Promise(r=>{ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id===1){r(m)}};ws.send(JSON.stringify({id:1,method,params:params||{}}));});
  ws.close();res.end(JSON.stringify(out.result??out.error));
 }catch(e){res.end(JSON.stringify({error:String(e)}))}
}).listen(9300,'127.0.0.1');


