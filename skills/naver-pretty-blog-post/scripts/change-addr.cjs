// 사용: node change-addr.cjs <포트> <현재블로그ID> <새주소>   (제어용 크롬이 떠 있고 로그인된 상태에서)
const [,, port, blog, cand] = process.argv;
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const nt = await (await fetch(`http://127.0.0.1:${port}/json/new?https://admin.blog.naver.com/${blog}`, { method: 'PUT' })).json();
  await sleep(7000);
  const ws = new WebSocket(nt.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = {};
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, userGesture: true }); return r.result && r.result.result ? r.result.result.value : null; };
  const mouse = async (x, y) => { for (const [t, b] of [['mouseMoved', 0], ['mousePressed', 1], ['mouseReleased', 0]]) await send('Input.dispatchMouseEvent', { type: t, x, y, button: 'left', buttons: b, clickCount: 1 }); };
  await ev(`document.querySelector('#papermain').contentDocument.querySelector('#changeBlogDomain').click()`); await sleep(1500);
  const pos = await ev(`(()=>{const i=[...document.querySelectorAll('input')].find(e=>e.offsetParent&&e.type==='text'&&/${blog}/.test(e.value));if(!i)return null;const b=i.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]})()`);
  if (!pos) { console.log('입력칸을 찾지 못함'); process.exit(1); }
  await mouse(pos[0], pos[1]); await sleep(300);
  for (const t of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type: t, modifiers: 2, key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65 });
  await send('Input.insertText', { text: cand }); await sleep(2200);
  const msg = await ev(`(document.body.innerText.match(/(사용할 수 있|이미 사용|사용할 수 없|형식)[^\\n]*/g)||[]).join(' / ')`);
  console.log('검사 결과:', msg);
  if (!/사용할 수 있/.test(msg || '')) { console.log('사용할 수 없는 주소라 중단'); process.exit(2); }
  await mouse(596, 687); await sleep(2500); await mouse(528, 635); await sleep(2500);
  await ev("(()=>{const w=document.querySelector('#papermain').contentWindow;w.alert=()=>{};w.confirm=()=>true;w.document.querySelector('input._btnConfirm').click();return 1})()"); await sleep(5000);
  const now = await ev(`document.querySelector('#papermain')?document.querySelector('#papermain').contentDocument.body.innerText.match(/blog.naver.com\\/\\w+/)?.[0]:null`);
  console.log('변경 후 주소:', now);
  ws.close();
})();

