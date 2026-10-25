#!/usr/bin/env node
// 네이버 글 txt 표기법 검사: 문장이 줄 안에서 끝나는지, 문단 길이, 소제목·해시태그 수, 분량.
// 사용: node flow-check.cjs 글.txt   (경고가 있으면 종료 코드 1)
const fs = require('fs');
const file = process.argv[2];
if (!file) { console.log('사용: node flow-check.cjs 글.txt'); process.exit(2); }
const txt = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
const warns = [];
const isMeta = (l) => /^(##\s|@img\d|---$|#\S|https?:|📅|🔗|💡|🌱\s)/.test(l) || /(도서 안내|도서 정보|공식 안내|공식 링크)$/.test(l);
const endsOk = (l) => /[.?!)'”"』」]\s*[^\s가-힣A-Za-z0-9]*\s*$/.test(l) || /[\p{Extended_Pictographic}]\s*$/u.test(l);
const paras = txt.split(/\n\s*\n/).map((p) => p.split('\n').map((s) => s.trim()).filter(Boolean)).filter((p) => p.length);
let body = 0, heads = 0, tags = 0, bodyLines = 0;
for (const p of paras) {
  const bodyOnly = p.filter((l) => !isMeta(l));
  if (bodyOnly.length > 4) warns.push(`문단이 ${bodyOnly.length}줄입니다(2~4줄 권장): "${bodyOnly[0].slice(0, 24)}…"`);
  for (const l of p) {
    if (/^##\s/.test(l)) { heads++; continue; }
    if (/^#\S/.test(l)) { tags += (l.match(/#[^\s#]+/g) || []).length; continue; }
    if (/^(@img\d|---$|https?:)/.test(l)) continue;
    if (isMeta(l)) { body += l.replace(/\*\*|==/g,'').replace(/\s/g,'').length; continue; }
    bodyLines++;
    const clean = l.replace(/\*\*|==/g, '');
    body += clean.replace(/\s/g, '').length;
    if (!endsOk(l)) warns.push(`문장이 줄 안에서 끝나지 않습니다: "${l.slice(0, 40)}"`);
    if (clean.length > 90) warns.push(`한 줄이 너무 깁니다(${clean.length}자, 둘로 나누세요): "${l.slice(0, 30)}…"`);
    const periods = (clean.match(/[.?!](\s|$)/g) || []).length;
    if (periods >= 3) warns.push(`한 줄에 문장이 ${periods}개입니다(한 줄 한 문장): "${l.slice(0, 30)}…"`);
  }
}
if (heads !== 4) warns.push(`소제목이 ${heads}개입니다(4개).`);
if (tags !== 10) warns.push(`해시태그가 ${tags}개입니다(10개).`);
if (body < 1200 || body > 1800) warns.push(`본문이 공백 제외 ${body}자입니다(1,200~1,800자).`);
console.log(`본문 ${body}자, 본문 줄 ${bodyLines}, 소제목 ${heads}, 해시태그 ${tags}`);
if (warns.length) { warns.forEach((w) => console.log('경고: ' + w)); process.exit(1); }
console.log('통과');

