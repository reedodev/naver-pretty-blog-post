# 네이버 예쁜 글 (naver-pretty-blog-post)

짧은 줄 문단, 이모지, 형광펜, 3D 귀여운 도식 이미지를 넣은 네이버 블로그 글을 만들고, 정한 카테고리에 올리는 Claude Code 스킬입니다. 하루 여러 편 자동 발행 절차도 들어 있습니다.

## 설치
Claude Code에서 입력합니다.

```
/plugin marketplace add reedodev/naver-pretty-blog-post
/plugin install naver-pretty-blog-post@naver-pretty-blog-post
```

## 이렇게 말해 보세요
1. `naver-pretty-blog-post 양식으로 새 블로그 설정을 도와줘. 주소는 ○○, 주제는 ○○, 카테고리는 ○○/○○/○○, 대표색은 ○○야. 로그인은 내가 할게.`
2. `naver-pretty-blog-post 양식으로 ○○ 블로그에 "○○○" 주제 글 1편 써서 ○○ 카테고리에 올려줘.`
3. `○○ 블로그에 하루 3편(9시, 13시, 19시) 자동 발행 루틴을 만들어줘.`

## 들어 있는 것
- `skills/naver-pretty-blog-post/SKILL.md`: 글 양식과 순서
- `scripts/`: 글 붙여넣기·이미지 도식·발행 도우미(`naver-post-lib.js`), 크롬 중계 프로그램(`relay.cjs`), 주소 변경 도구(`change-addr.cjs`)
- `scripts/flow-check.cjs`: 글 txt를 발행 전에 검사합니다. 문장이 줄 안에서 끝나는지, 문단 길이, 소제목 4개, 해시태그 10개, 공백 제외 1,200~1,800자를 확인합니다. `node scripts/flow-check.cjs 글.txt`\n- `references/WORKFLOW.md`: 자동 발행 작업 지침 예시
- `examples/`: 카테고리·주제 대기열 예시

## 글 흐름 (v1.1)\n한 줄에는 한 문장만 쓰고 문장은 줄 안에서 끝냅니다. 소제목은 기(계기) → 승(소개) → 전(핵심 내용) → 결(쓰임·마무리) 순서로 이어지게 씁니다. 자세한 규칙과 좋은 예·나쁜 예는 `SKILL.md`의 「글 흐름 규칙」에 있습니다.\n\n## 알아 두세요
- 로그인, 로그아웃, 비밀번호 입력은 스킬이 하지 않습니다. 사용자가 직접 로그인합니다.
- 네이버 편집기 화면 구조가 바뀌면 선택자(`.se-...`)를 고쳐야 할 수 있습니다.
- `lintPost`(글 검사)는 본문 글자 수, 합니다체, 질문형 소제목을 확인합니다. 후기·경험을 지어내지 않고 공식 자료만 쓰는 것은 글쓴이가 지켜야 합니다.
- 이미지 생성은 `imagegen` 도구가 있는 환경에서만 작동합니다. 없으면 직접 만든 이미지 파일을 넣습니다.
- Windows와 크롬 기준으로 만들었습니다.

MIT License.

