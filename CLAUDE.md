# CLAUDE.md — Termling (가칭)

Claude Code 토큰 사용량으로 성장하는 터미널 수집형 펫 게임. 게임 규칙·수치·세계관은 **SPEC.md가 단일 소스**다. 스펙과 코드가 충돌하면 스펙을 따르고, 스펙을 바꿔야 하면 코드보다 SPEC.md를 먼저 수정한다.

## 프로젝트 구조

```
src/
  statusline.ts   # stdin JSON 파싱 → 경험치 반영 → 한 줄 렌더 (성능 민감)
  engine/         # 레벨/진화/해금 판정 — 순수 함수로, I/O 없음
  store/          # state.json 원자적 읽기/쓰기, events.jsonl append
  cli/            # init / status / dex / switch
  art/            # ASCII 아트 (종당 5단계, 데이터 파일로 분리)
curve.json        # 기본 밸런스 값 (필요 경험치, 해금 기준, 출현 확률)
SPEC.md
```

## 핵심 원칙

1. **모델 비종속.** 모델명/티어를 읽거나 분기하는 코드를 작성하지 않는다. 경험치는 토큰량만 기준.
2. **statusline은 절대 깨지지 않는다.** 파싱 실패·파일 손상·미지의 입력 → 예외를 밖으로 던지지 말고 마지막 정상 상태를 렌더. 실행 시간 짧게 유지 (무거운 의존성·네트워크 호출 금지).
3. **게임 로직은 순수 함수.** `engine/`은 (현재 상태, 이벤트) → (새 상태, 발생 이벤트 목록)만 계산. I/O는 전부 `store/`와 `statusline.ts`에서. 테스트는 engine 위주로 작성.
4. **수치 하드코딩 금지.** 밸런스 값은 전부 curve.json (내장 기본값 + 사용자 오버라이드 병합).
5. **데이터 규율.** state.json은 temp write 후 rename으로 원자적 저장. events.jsonl은 append-only — 2차 서버 싱크의 근간이므로 스키마 변경 시 반드시 `version` 필드로 구분.

## 기술

- TypeScript, Node 20+, 단일 패키지, `npx` 실행 가능하게 빌드
- 런타임 의존성 최소화 (statusline 기동 속도 때문. 렌더/색상도 가능하면 직접 구현)
- 테스트: vitest — 경험치 곡선, 진화 관문(Lv.10/25/40/70), 해금 조건, 만렙 100 & 샤이니 해금은 반드시 커버

## 하지 말 것

- 모델 종속 로직 (원칙 1)
- 방치 패널티, 서버 통신, 크리처 추가 — 1차 스코프 밖 (SPEC.md 9장)
- events.jsonl rewrite / 삭제

## 시작 순서 (권장)

1. `engine/` 순수 로직 + 테스트 (curve.json 로딩 포함)
2. `store/` (원자적 저장, append 로그)
3. `statusline.ts` (파싱 → engine → 렌더)
4. `cli/` (init의 settings.json 등록 포함)
5. ASCII 아트 채우기 (렌더 파이프라인 먼저, 아트는 마지막)