# Travel · 여행지 지도 모음

여행지별 폴더를 하나의 모바일 우선 정적 웹앱 허브에서 관리합니다. 현재는 `kyoto-kobe-trip/`에 19일부터 22일까지의 교토·고베 일정이 들어 있습니다.

## 실행

```bash
npm install
npm run dev
```

## 폴더 구조

```text
index.html                 # 여행지 목록 허브
kyoto-kobe-trip/
  index.html               # 교토·고베 앱 진입점
  trip.json                # 여행지별 일정·장소 데이터
src/                       # 공통 모바일 앱 엔진
public/                    # 공통 디바이스·지도 자산
```

새 여행은 `<destination-slug>/index.html`과 `<destination-slug>/trip.json`을 추가하고, 루트 `index.html`에 여행지 카드를 연결합니다. 공통 UI는 `src/`를 재사용하고 여행별 내용은 각 폴더의 `trip.json`으로 분리합니다.

## 배포

`main` 브랜치에 push하면 GitHub Actions가 `dist/client`를 GitHub Pages에 배포합니다.

- 지도: Leaflet + OpenFreeMap/OpenStreetMap
- 실제 길찾기: 장소별 Google Maps URL
- 여행 중 체크/즐겨찾기/메모: LocalStorage
- 오프라인: 서비스 워커가 앱 셸과 접속한 리소스를 캐시

Notion 토큰은 프론트 코드에 포함하지 않습니다. 여행 데이터는 각 여행지 폴더의 `trip.json` 정적 스냅샷으로 관리합니다.

## AI로 새 여행 자동 만들기

이 저장소에는 여행계획을 받아 새 여행지 폴더·일정 JSON·지도 링크·카테고리 아이콘·메뉴 번역·대표사진·대체 식당·실제 여행 기록 기능까지 구성하는 공통 스킬이 들어 있습니다.

- 공통 원본: `.agents/skills/travel-map-builder/SKILL.md`
- Claude Code: `.claude/skills/travel-map-builder/SKILL.md`
- Gemini CLI: `.gemini/skills/travel-map-builder/SKILL.md`
- Codex: 루트 `AGENTS.md`가 공통 스킬을 안내합니다.

저장소를 clone한 뒤 원하는 AI에게 다음처럼 여행계획만 전달하면 됩니다.

```text
이 저장소의 travel-map-builder 스킬을 사용해 새 여행을 만들어줘.
여행지: 후쿠오카
기간: 10월 3일~6일
숙소: 링크 또는 주소
가고 싶은 곳과 조사자료: 아래 내용 기준
요청: 장소별 지도·길찾기·운영시간·가격·입장료·메뉴 번역·음식사진·대체 식당을 넣고 모바일 화면에서 확인 가능하게 만들어줘.
```

Google Maps 링크가 없는 장소는 정확한 주소와 검색 링크를 조사해 연결하고, 불확실한 핀·시간·가격·메뉴는 `확인 필요`로 표시합니다. 새 여행은 기존 여행을 덮어쓰지 않고 `<destination-slug>/` 폴더에 분리합니다. 배포는 사용자가 명시적으로 요청한 경우에만 진행합니다.

Gemini CLI에서 새 skill이 보이지 않으면 `/skills reload` 후 `/skills list`로 확인하세요. Claude Code는 프로젝트 skill을 자동 발견하며, Codex는 새 세션에서 루트 `AGENTS.md`를 읽습니다.
