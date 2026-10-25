// 네이버 블로그 자동 발행 도우미 (REPL에서 eval로 불러 쓴다)
// 사용: globalThis.NAVER_ROOT = 'C:\\Users\\내이름\\NaverProfiles\\'; eval(await fs.readFile(NAVER_ROOT + 'toolkit\\naver-post-lib.js','utf8'));
globalThis.NPC = {
  root: globalThis.NAVER_ROOT || 'C:\\Users\\USERNAME\\NaverProfiles\\',
  tk: (globalThis.NAVER_ROOT || 'C:\\Users\\USERNAME\\NaverProfiles\\') + 'toolkit\\',
  work: (globalThis.NAVER_ROOT || 'C:\\Users\\USERNAME\\NaverProfiles\\') + 'toolkit\\work\\',
  relay: 'http://127.0.0.1:9300',
  chrome: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  blogs: {
    // 내 블로그를 여기에 적는다: 블로그ID: { port(디버그 포트), dir(크롬 프로필 폴더), acc(대표색), ink(글자색), bg(배경 파일 2개), key(짧은 이름) }
    example_blog_1: { port: 9231, dir: '1_example', acc: '#1b4b82', ink: '#10294d', bg: ['bg_ex1_a.png', 'bg_ex1_b.png'], key: 'ex1' },
    example_blog_2: { port: 9232, dir: '2_example', acc: '#2f7a3a', ink: '#243a1b', bg: ['bg_ex2_a.png', 'bg_ex2_b.png'], key: 'ex2' }
  }
};
const _post = async (b) => await (await fetch(NPC.relay, { method: 'POST', body: JSON.stringify(b) })).json();
globalThis.post = _post;
globalThis.edTarget = async (port) => { const tl = await post({ port, list: true }); return tl.find(x => x.type === 'page' && /postwrite|postupdate/.test(x.url)); };
globalThis.edEv = async (port, expr) => { const t = await edTarget(port); const r = await post({ port, target: t.id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true, awaitPromise: true, userGesture: true } }); return r.result ? r.result.value : JSON.stringify(r).slice(0, 200); };
globalThis.edInput = async (port, method, params) => { const t = await edTarget(port); return await post({ port, target: t.id, method, params }); };
globalThis.edClickSel = async (port, sel) => {
  const p = await edEv(port, `(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const b=e.getBoundingClientRect();return [b.x+Math.min(b.width/2,200),b.y+b.height/2]})()`);
  if (!p) return 'nosel';
  for (const [ty, b] of [['mouseMoved', 0], ['mousePressed', 1], ['mouseReleased', 0]]) await edInput(port, 'Input.dispatchMouseEvent', { type: ty, x: p[0], y: p[1], button: 'left', buttons: b, clickCount: 1 });
  return p;
};
globalThis.keyEnter = async (port) => { const t = await edTarget(port); for (const ty of ['keyDown', 'keyUp']) await post({ port, target: t.id, method: 'Input.dispatchKeyEvent', params: { type: ty, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: ty === 'keyDown' ? '\r' : undefined } }); };
globalThis.clickLastPara = async (port) => {
  await edEv(port, `(()=>{const ps=[...document.querySelectorAll('.se-component.se-text .se-text-paragraph')];ps[ps.length-1].scrollIntoView({block:'center'})})()`);
  await sleep(300);
  const p = await edEv(port, `(()=>{const ps=[...document.querySelectorAll('.se-component.se-text .se-text-paragraph')];const b=ps[ps.length-1].getBoundingClientRect();return [b.x+Math.min(b.width/2,300),b.y+b.height/2]})()`);
  for (const [ty, b] of [['mouseMoved', 0], ['mousePressed', 1], ['mouseReleased', 0]]) await edInput(port, 'Input.dispatchMouseEvent', { type: ty, x: p[0], y: p[1], button: 'left', buttons: b, clickCount: 1 });
  await sleep(300);
};
globalThis.insImg = async (port, file) => { const t = await edTarget(port); await post({ port, target: t.id, chooser: { clickExpr: `document.querySelector('.se-image-toolbar-button').click()`, files: [file] } }); await sleep(4500); };
globalThis.pasteHtml = async (port, html) => await edEv(port, `(()=>{const f=document.activeElement;const d=f.contentDocument;const dt=new d.defaultView.DataTransfer();dt.setData('text/html',${JSON.stringify(html)});dt.setData('text/plain','x');const ev=new d.defaultView.ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true});(d.activeElement||d.body).dispatchEvent(ev);return ev.defaultPrevented})()`);

// 글 표기법(txt): 빈 줄로 문단 구분, 한 문단 안의 줄바꿈은 줄 나눔
//  ## 소제목 / --- 구분선 / @img1 이미지 자리 / **강조색** / ==형광펜== / 마지막 문단은 #해시태그
globalThis.parseBlocks = (txt) => txt.trim().split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map(b => {
  if (b === '---') return { t: 'div' };
  const m = b.match(/^@img(\d)$/); if (m) return { t: 'img', n: +m[1] };
  if (b.startsWith('## ')) return { t: 'h', text: b.slice(3) };
  if (/^#\S/.test(b) && !b.startsWith('##')) return { t: 'tags', text: b };
  return { t: 'g', lines: b.split('\n') };
});
globalThis.toHtml = (txt, acc) => {
  const inl = s => s.replace(/\*\*(.+?)\*\*/g, `<span style="font-weight:bold;color:${acc}">$1</span>`).replace(/==(.+?)==/g, '<span style="background-color:#fff8b2">$1</span>');
  const blocks = parseBlocks(txt); const chunks = [[]];
  for (const b of blocks) {
    if (b.t === 'img') { chunks.push({ img: b.n }); chunks.push([]); continue; }
    const c = chunks[chunks.length - 1];
    if (b.t === 'div') c.push('<hr>');
    else if (b.t === 'h') c.push(`<p><span style="font-size:24px;font-weight:bold;color:${acc}">${inl(b.text)}</span></p><p><br></p>`);
    else if (b.t === 'tags') c.push(`<p>${b.text}</p>`);
    else c.push('<p>' + b.lines.map(inl).join('<br>') + '</p><p><br></p>');
  }
  return chunks.map(c => Array.isArray(c) ? c.join('') : c);
};

// 편집 화면 열기: 대표 이미지(hero) 넣고 제목 입력
globalThis.startPost = async (port, d) => {
  const tl0 = await post({ port, list: true });
  for (const t of tl0.filter(x => x.type === 'page' && /postwrite|postupdate/.test(x.url))) await fetch(`http://127.0.0.1:${port}/json/close/${t.id}`);
  await sleep(1500);
  await fetch(`http://127.0.0.1:${port}/json/new?https://blog.naver.com/${d.blog}/postwrite`, { method: 'PUT' }); await sleep(8000);
  await edEv(port, `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='취소'&&b.offsetParent&&document.body.innerText.includes('작성 중인 글'));if(b)b.click()})()`); await sleep(800);
  await edClickSel(port, '.se-help-panel-close-button'); await sleep(400);
  await edClickSel(port, '.se-component.se-text .se-text-paragraph'); await sleep(400);
  const t = await edTarget(port);
  await post({ port, target: t.id, chooser: { clickExpr: `document.querySelector('.se-image-toolbar-button').click()`, files: [d.hero] } }); await sleep(5000);
  await edEv(port, `document.querySelector('.se-title-text').scrollIntoView({block:'center'})`); await sleep(400);
  await edClickSel(port, '.se-title-text'); await sleep(300);
  await edInput(port, 'Input.insertText', { text: d.title }); await sleep(300);
  await clickLastPara(port);
};
// d = {blog, hero:'파일경로', title, txt, card:{1:'파일경로',2:'파일경로'}}
globalThis.buildPost = async (port, d, acc) => {
  await startPost(port, d);
  const chunks = toHtml(d.txt, acc);
  for (let c of chunks) {
    if (typeof c === 'object') { await clickLastPara(port); await insImg(port, d.card[c.img]); await sleep(800); await clickLastPara(port); continue; }
    if (!c) continue;
    await clickLastPara(port); await sleep(300);
    if (c.startsWith('<hr>')) { c = c.slice(4); await edClickSel(port, '.se-insert-horizontal-line-default-toolbar-button'); await sleep(900); await clickLastPara(port); await sleep(300); }
    await pasteHtml(port, c); await sleep(1800);
  }
  return await edEv(port, `(()=>{const out=[];document.querySelectorAll('.se-component').forEach(c=>{if(c.classList.contains('se-text')){out.push('text')}else out.push([...c.classList].filter(x=>/se-(image|horizontalLine|documentTitle)/.test(x))[0])});return out})()`);
};
// 발행 후 새 글 주소를 돌려준다
globalThis.pickCategory = async (port, name) => {
  await edEv(port, `document.querySelector('button[class*=selectbox_button]').click()`); await sleep(800);
  const p = await edEv(port, `(()=>{const li=[...document.querySelectorAll('li[class*=item]')].filter(e=>e.offsetParent&&e.innerText.trim()===${JSON.stringify(name)})[0];if(!li)return null;const b=(li.querySelector('button')||li).getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]})()`);
  if (!p) return 'nolist';
  const t = await edTarget(port);
  for (const [ty, b] of [['mouseMoved', 0], ['mousePressed', 1], ['mouseReleased', 0]]) await post({ port, target: t.id, method: 'Input.dispatchMouseEvent', params: { type: ty, x: p[0], y: p[1], button: 'left', buttons: b, clickCount: 1 } });
  await sleep(800);
  return await edEv(port, `document.querySelector('button[class*=selectbox_button]').innerText`);
};
// publish(port, '카테고리이름'): 발행 창에서 카테고리를 고르고 발행한다. 고른 결과가 다르면 발행하지 않고 null을 돌려준다.
globalThis.publish = async (port, category) => {
  await edEv(port, `(()=>{[...document.querySelectorAll('button')].filter(b=>/^발행$/.test(b.innerText.trim())).forEach(x=>x.click())})()`); await sleep(2500);
  if (category) { const got = await pickCategory(port, category); if (got !== category) return null; }
  await edEv(port, `(()=>{const b=document.querySelector('button[class*=confirm_btn]');b.click();return b.innerText})()`); await sleep(8000);
  const tl = await post({ port, list: true });
  const u = tl.filter(x => x.type === 'page').map(x => x.url).find(x => /PostView\.naver.*isAfterWrite=true/.test(x));
  return u || null;
};

// 도식 카드: 3D 배경 위에 글자를 올려 1200x675 PNG로 저장 (디버그 크롬의 임시 탭을 이용)
globalThis.cardRow = (e, t) => `<div class=row><span class=em>${e}</span><span>${t}</span></div>`;
globalThis.cardArrow = () => '<div class=ar>⬇️</div>';
globalThis.cardHl = (t) => `<span class=hl>${t}</span>`;
globalThis.cardTable = (headers, rows) => `<table><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
globalThis.renderCard = async (blog, bgFile, title, inner, src, outFile) => {
  const B = NPC.blogs[blog]; const u = p => 'file:///' + p.replace(/\\/g, '/');
  const html = `<!doctype html><meta charset=utf-8><style>*{box-sizing:border-box}body{margin:0;width:1200px;height:675px;overflow:hidden;font-family:'Malgun Gothic','Segoe UI Emoji',sans-serif;color:${B.ink};position:relative}
.wrap{position:absolute;left:225px;top:100px;width:750px;height:470px;display:flex;flex-direction:column;justify-content:center}
h1{margin:0 0 14px;font-size:38px;color:${B.acc};text-align:center}.hl{background:linear-gradient(transparent 50%,#fff176 50%);padding:0 3px}
.row{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.85);border:3px solid ${B.acc};border-radius:20px;padding:10px 18px;margin:6px 0;font-size:26px;line-height:1.25}
.em{font-size:36px}.ar{text-align:center;font-size:24px;line-height:1;margin:-2px 0}.src{position:absolute;left:0;right:0;text-align:center;bottom:-34px;font-size:15px;opacity:.75}
table{width:100%;border-collapse:separate;border-spacing:0 6px;font-size:24px}th{background:${B.acc};color:#fff;padding:9px;border-radius:12px}td{background:rgba(255,255,255,.88);padding:9px 12px;text-align:center;border-radius:12px}</style>
<div style="position:absolute;left:0;top:0;width:1200px;height:675px;background:url('${u(NPC.work + bgFile)}') 0 0/1200px 675px no-repeat"></div>
<div class=wrap><h1>${title}</h1>${inner}<div class=src>${src}</div></div>`;
  const hf = NPC.work + 'tmp_card.html'; await fs.writeFile(hf, html);
  const port = B.port;
  const nt = await (await fetch(`http://127.0.0.1:${port}/json/new?` + u(hf), { method: 'PUT' })).json(); await sleep(2500);
  const r = await post({ port, target: nt.id, method: 'Page.captureScreenshot', params: { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1200, height: 675, scale: 1 } } });
  await fs.writeFile(outFile, Buffer.from(r.data, 'base64')); await fetch(`http://127.0.0.1:${port}/json/close/${nt.id}`);
  return outFile;
};
// 새 3D 배경이 필요할 때 (글자 없는 빈 패널 + 가장자리 장식)
globalThis.genBg = async (blog, objects, outName, palette) => {
  const pal = palette || 'navy blue and mint green palette'; // 블로그 대표색에 맞춰 영어로 직접 적어 넣는다 (예: 'coral pink and sky blue palette')
  const p = `cute 3D clay-style render, soft rounded shapes, pastel colors, glossy plastic look, soft studio lighting, 16:9 wide composition, a large EMPTY rounded off-white panel taking the center 70 percent of the image reserved for text, decorative cute 3D objects only around the borders and corners, absolutely no text, no letters, no numbers, no logos, ${pal}, cute 3D objects: ${objects}`;
  const r = await imagegen.generate({ prompt: p }); const f = NPC.work + outName;
  await fs.writeFile(f, Buffer.from(r.images[0].data.replace(/^data:[^,]*,/, ''), 'base64')); return outName;
};
globalThis.genHero = async (prompt, outName) => {
  const r = await imagegen.generate({ prompt: prompt + ', photorealistic, soft natural light, no text, no logos, no people faces, 16:9' });
  const f = NPC.work + outName; await fs.writeFile(f, Buffer.from(r.images[0].data.replace(/^data:[^,]*,/, ''), 'base64')); return f;
};
// 글쓰기 검사 (합니다체, 1,200자 이상, 질문형 소제목)
globalThis.lintPost = async (txt, title, health) => {
  eval(await fs.readFile(NPC.tk + 'lint.js', 'utf8'));
  const clean = txt.replace(/\*\*|==/g, '').replace(/^@img\d$/gm, '').replace(/^---$/gm, '').replace(/^## /gm, '');
  return await globalThis.postLint.check({ text: clean, title, tone: 'hamnida', disclosure: false, disclosureWithin: null, hashtagsLast: true, minChars: 1200, images: [], keyword: '', channel: 'naver', health: !!health, aeo: true });
};
// 크롬 프로필이 제어 모드로 떠 있는지 확인하고, 없으면 연다. 로그인이 풀렸으면 'LOGIN_NEEDED'를 돌려준다.
globalThis.ensureBlog = async (blog) => {
  const B = NPC.blogs[blog];
  let alive = true; try { await fetch(`http://127.0.0.1:${B.port}/json/version`); } catch (e) { alive = false; }
  return { alive, port: B.port, profile: NPC.root + B.dir };
};
globalThis.isLoggedIn = async (blog) => {
  const B = NPC.blogs[blog]; const tl = await post({ port: B.port, list: true }); const t = tl.find(x => x.type === 'page'); if (!t) return false;
  await post({ port: B.port, target: t.id, method: 'Page.navigate', params: { url: `https://admin.blog.naver.com/${blog}` } }); await sleep(5000);
  const tl2 = await post({ port: B.port, list: true });
  return tl2.some(x => x.type === 'page' && x.url.includes('admin.blog.naver.com') && !x.url.includes('nidlogin'));
};
globalThis.ledgerAdd = async (blog, rec) => {
  const f = NPC.tk + `ledger\\${blog}.json`; let a = []; try { a = JSON.parse(await fs.readFile(f, 'utf8')); } catch (e) { }
  a.push(rec); await fs.writeFile(f, JSON.stringify(a, null, 1));
};
