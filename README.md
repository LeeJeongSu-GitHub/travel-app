# Travel Map Builder

여행 계획 몇 줄을 넣으면 조사자료를 보완하고 모바일 여행 일정 지도를 만드는 재사용 가능한 템플릿입니다. 현재 괌 태교여행, 교토·고베, 제주 여행을 포함하고 있습니다.

[![Live on GitHub Pages](https://img.shields.io/badge/Live-GitHub%20Pages-2ea44f?logo=github)](https://leejeongsu-github.github.io/travel-app/)
[![Mobile first](https://img.shields.io/badge/UI-mobile--first-2563eb)](#디자인-계약)
[![GitHub Actions](https://img.shields.io/badge/Deploy-GitHub%20Actions-6f42c1?logo=githubactions)](./.github/workflows/deploy-pages.yml)

> 핵심 흐름: **간단한 여행 정보 → 조사자료 → 공통 UI 여행 앱 → 현지 기록 저장·공유**

## 🔗 실제 배포 사이트

아래 링크를 누르면 현재 GitHub Pages 앱으로 이동합니다.

| 구분 | 바로 열기 | 내용 |
| --- | --- | --- |
| 여행 허브 | [여행지 목록](https://leejeongsu-github.github.io/travel-app/) | 여행지별 앱 목록 |
| 괌 태교여행 | [괌 여행 앱](https://leejeongsu-github.github.io/travel-app/guam-trip/?day=1) | 괌 3박 4일 일정 |
| 교토·고베 | [교토·고베 여행 앱](https://leejeongsu-github.github.io/travel-app/kyoto-kobe-trip/?day=19) | 19일~22일 일정 |
| 제주 스포츠 투어 | [제주 여행 앱](https://leejeongsu-github.github.io/travel-app/jeju-sports-trip/) | 10월 1일~4일 일정 |

- [공개 여행지 허브 주소 규칙](#배포)
- [교토·고베 데이터](./travel/kyoto-kobe-trip/trip.json)
- [괌 데이터](./travel/guam-trip/trip.json)
- [복붙용 기본 프롬프트](#복붙용-기본-프롬프트)
- [로컬 실행](#30초-만에-실행)
- [앱에서 여행 계획 입력](#앱에서-여행-계획-입력)
- [GitHub Pages 배포](#배포)
- [새 여행 추가 흐름](#새-여행-추가-흐름)
- [현재 구현·작업 내역](#현재-작업-완료-내역)
- [새 여행 입력 방법](#가장-쉬운-입력-방법-권장)
- [자동 조사·이미지 출처 규칙](#자동-조사-시-출처이미지-처리-규칙)
- [스킬·데이터 계약](#스킬과-문서)
- [실제 화면 미리보기](#실제-화면-미리보기)
> 이 링크는 현재 저장소의 공개 주소입니다. clone/fork한 저장소는 본인 GitHub Pages 주소가 생성됩니다.

## 빠른 시작

### 로컬에서 실행

```bash
npm ci
npm run dev
```

브라우저에서 `http://localhost:5173/`을 엽니다. 포트가 다르면 터미널에 표시된 주소를 사용하세요.

### 내 GitHub에 배포

1. GitHub 저장소의 `Settings → Pages → Source`가 `GitHub Actions`인지 확인합니다.
2. `main`에 변경 내용을 push하면 `Deploy to GitHub Pages` 작업이 실행됩니다.
3. Actions의 build와 deploy가 모두 성공하면 아래 주소에서 확인합니다.

```text
로컬 허브       http://localhost:5173/
로컬 괌         http://localhost:5173/page/guam-trip/
로컬 교토·고베  http://localhost:5173/page/kyoto-kobe-trip/
로컬 제주       http://localhost:5173/page/jeju-sports-trip/
공개 허브       https://leejeongsu-github.github.io/travel-app/
공개 괌         https://leejeongsu-github.github.io/travel-app/guam-trip/
공개 교토·고베  https://leejeongsu-github.github.io/travel-app/kyoto-kobe-trip/
공개 제주       https://leejeongsu-github.github.io/travel-app/jeju-sports-trip/
```

---

## 앱에서 여행 계획 입력

앱 헤더 메뉴의 `계획 입력` 또는 일정 화면의 `여행 계획을 한 번에 입력`을 누르면 자연어에 가까운 Markdown 형식으로 여러 날의 계획을 입력할 수 있습니다.

```text
# 1일차
- 시간: 14:00~16:00
- 지역: 투몬
- 장소: 투몬 비치
- 식사: 타시 그릴
```

`일정 생성`을 누르면 입력한 장소가 현재 여행 일정에 추가되고, 장소명으로 Google Maps 검색·길찾기 링크가 만들어집니다. 입력한 계획과 생성 결과는 여행별 `localStorage`에 저장되며, 정확한 주소·좌표·영업시간은 장소 상세에서 확인·수정해야 합니다. 외부 LLM이나 장소 정보 자동 조사는 아직 연결하지 않은 브라우저 전용 MVP입니다.

---

## 폴더 구조

```text
index.html                 # 여행지 목록 허브
travel/                    # 여행지별 일정·장소 데이터
  guam-trip/trip.json
  kyoto-kobe-trip/trip.json
  jeju-sports-trip/trip.json
page/                      # 여행지별 앱 진입점
  guam-trip/index.html
  kyoto-kobe-trip/index.html
  jeju-sports-trip/index.html
src/                       # 공통 모바일 앱 엔진
public/                    # 공통 디바이스·지도 자산
```

새 여행은 `travel/<destination-slug>/trip.json`과 `page/<destination-slug>/index.html`을 추가하고, 루트 `index.html`에 여행지 카드를 연결합니다. 공통 UI는 `src/`를 재사용하고 여행별 내용은 `travel/` 아래 데이터로 분리합니다.

## 새 여행 추가 흐름

아래 순서만 따르면 기존 여행을 건드리지 않고 새 여행을 하나 더 만들 수 있습니다.

1. 이 저장소를 clone하고 `README.md`의 [가장 쉬운 입력 방법](#가장-쉬운-입력-방법-권장)에 여행지·기간·숙소·희망 장소만 적습니다.
2. AI에게 계획과 조사자료를 전달합니다. 장소명만 있거나 Google Maps 링크가 없어도 주소·지도 검색 링크·운영 정보를 조사하도록 요청할 수 있습니다.
3. AI가 기존 폴더와 겹치지 않는 `<destination-slug>/` 폴더, `index.html`, `trip.json`, 루트 허브 카드를 만듭니다.
4. `npm run validate:trip`, `npm run check:runtime`, `npm run build`, `npm run test:sites`로 생성 결과를 확인합니다.
5. 변경을 `main`에 push하면 GitHub Actions가 `dist/client`를 GitHub Pages에 배포합니다. 완료 후 허브에서 새 여행 카드를 열어 모바일 화면을 확인합니다.

여행별 URL은 일반 프로젝트 저장소 기준 `https://<github-id>.github.io/<repository-name>/<destination-slug>/` 형태입니다. 일정이 여러 개이면 각 여행 폴더의 `trip.json`만 별도로 관리하므로 한 여행의 장소 추가·삭제·실제 방문 체크가 다른 여행에 섞이지 않습니다.

---

## 배포

이 저장소는 특정 GitHub 계정에 종속되지 않는 GitHub Pages 정적 배포 템플릿입니다. 저장소를 fork하거나 `Use this template`으로 가져가면 각자의 계정과 저장소 이름에 맞춰 Pages 경로를 자동 계산합니다.

- 저장소: `https://github.com/<github-id>/<repository-name>`
- 일반 프로젝트 저장소 허브: `https://<github-id>.github.io/<repository-name>/`
- 사용자 페이지 저장소(`<github-id>.github.io`) 허브: `https://<github-id>.github.io/`
- 여행 앱: `https://<github-id>.github.io/<repository-name>/<destination-slug>/`
- 사용자 페이지 저장소의 여행 앱: `https://<github-id>.github.io/<destination-slug>/`
- Actions workflow: [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml)
- 빌드 결과: `dist/client`

복사한 저장소에서 최초 1회만 `Settings → Pages → Build and deployment → Source`를 `GitHub Actions`로 설정하세요. 이후 각자의 `main`에 push하거나 Actions의 `Deploy to GitHub Pages`를 수동 실행하면 본인 GitHub Pages에 빌드·배포됩니다.

### 저장소를 가져간 사람의 배포 순서

1. 이 저장소를 fork하거나 `Use this template`으로 본인 GitHub 계정에 복사합니다.
2. 복사한 저장소의 `Settings → Pages → Source`를 `GitHub Actions`로 설정합니다.
3. 여행 데이터를 바꾸고 `main`에 push합니다. 별도의 사용자명 수정이나 Vite 설정 수정은 필요하지 않습니다.
4. Actions가 끝나면 `https://<github-id>.github.io/<repository-name>/`에서 허브를 엽니다.

fork 저장소는 GitHub Actions가 기본적으로 꺼져 있을 수 있으므로 `Actions` 탭에서 workflow를 활성화한 뒤 실행하세요.

배포 전 확인:

1. 새 여행 폴더에 `<destination-slug>/index.html`과 `trip.json`이 있는지 확인합니다.
2. 루트 `index.html`에 새 여행 카드가 연결되어 있는지 확인합니다.
3. `npm run build`가 `dist/client`를 만드는지 확인합니다.
4. Actions의 `build`와 `deploy`가 모두 성공한 뒤 프로젝트 저장소는 `https://<github-id>.github.io/<repository-name>/<destination-slug>/`, 사용자 페이지 저장소는 `https://<github-id>.github.io/<destination-slug>/`를 엽니다.

`vite.config.ts`가 배포 환경의 `GITHUB_REPOSITORY`를 읽어 build base를 자동으로 정합니다.

- 일반 저장소: `/<repository-name>/`
- 사용자 페이지 저장소: `/`
- 로컬 개발: `/`
- 로컬에서 특정 프로젝트 경로를 미리 테스트할 때: `VITE_BASE_PATH=/my-repo/ npm run build` (PowerShell: `$env:VITE_BASE_PATH="/my-repo/"; npm run build`)

이미지·manifest·스크립트는 `import.meta.env.BASE_URL` 또는 상대 경로를 사용하므로 계정명과 저장소명이 달라도 깨지지 않습니다.

> [!IMPORTANT]
> GitHub 저장소의 `Settings → Pages → Source`는 최초 1회 `GitHub Actions`로 설정해야 합니다. `main` push 후 Actions의 `build`와 `deploy`가 모두 성공하기 전에는 공개 URL을 확정하지 마세요.

기본 기능:

- 지도: Leaflet + OpenFreeMap/OpenStreetMap
- 실제 길찾기: 장소별 Google Maps URL
- 여행 중 체크/즐겨찾기/메모: LocalStorage
- 오프라인: 서비스 워커가 앱 셸과 접속한 리소스를 캐시

Notion 토큰은 프론트 코드에 포함하지 않습니다. 여행 데이터는 `travel/<destination-slug>/trip.json` 정적 스냅샷으로 관리합니다.

---

## 현재 작업 완료 내역

현재 기준 여행은 괌 태교여행, 교토·고베, 제주 스포츠 투어입니다. 일정 데이터는 `travel/` 아래에, 앱 진입 페이지는 `page/` 아래에 여행지별로 보관됩니다.

- 루트 여행 허브에서 여행지별 앱으로 이동합니다. 공개 주소는 저장소를 가져간 계정의 Pages 주소를 사용합니다.
- 교토·고베 앱은 `travel/kyoto-kobe-trip/`와 `page/kyoto-kobe-trip/`에 나뉘어 보관되며, GitHub Pages에서는 `/kyoto-kobe-trip/` 경로로 열립니다.
- 괌 태교여행 앱은 `travel/guam-trip/`와 `page/guam-trip/`에 나뉘어 보관되며, 날짜별 투몬·북부·남부 동선과 대체 식당을 제공합니다.
- Leaflet + OpenFreeMap/OpenStreetMap 기반 한글 지도, 날짜별 경로 미리보기, 장소별 Google Maps 장소 보기·길찾기를 제공합니다.
- 숙소·사진 명소·맛집·카페·역·공항·짐 보관/이동을 아이콘·색상·범례로 구분하고, 지도 숫자 마커와 목록 번호에도 같은 카테고리 색상을 적용합니다.
- 카드와 상세 화면에 주소, 영업시간, 휴무일, 가격, 입장료, 예약 상태, 운영 메모를 표시합니다. 식당·카페의 휴무일은 별도 표시하며 확인하지 못한 값은 `확인 필요`로 표시합니다.
- 일본어 메뉴 아래에 한국어 번역과 가격을 병기하고, 메뉴별 음식 썸네일·장소 대표 이미지·지도 미리보기 폴백을 제공합니다.
- 기준 식당 주변의 대체 식당 후보, 예약 링크, 공식 정보·메뉴 원문 링크를 상세 화면에서 확인할 수 있습니다.
- 사용자가 지정한 사이트와 공식 페이지를 조사해 장소 정보의 원문 링크를 남기고, 안정적·허용된 대표 이미지 URL을 연결합니다. 이미지 출처가 불명확하면 지도/카테고리 폴백을 사용합니다.
- 실제 방문 체크, 즐겨찾기, 현지 메모, 장소 추가·수정·삭제, 실제 방문 장소만 보기, 새로고침 후 상태 유지를 지원합니다.
- 앱 안에서 `# 1일차`와 `- 식사:`, `- 장소:` 형식의 자연어 계획을 입력하고 일정 카드로 변환할 수 있습니다.
- 모바일 헤더·카드·이미지·하단 내비게이션의 잘림과 상세 시트 내부 스크롤을 반응형으로 보정했습니다. Pretendard 우선 폰트와 섹션 경계선도 공통 적용하고, 일정 상단의 방문 체크·장소 추가·대체 후보 컨트롤은 같은 높이의 한 줄 행으로 정렬합니다.
- 같은 숙소를 하루의 시작·종료 지점으로 반복해도 지도에서 순번 마커가 겹치지 않도록 좌우로 분리해 1번과 10번을 모두 확인할 수 있습니다. 실제 좌표와 이동 경로 데이터는 그대로 유지합니다.
- 사용자가 제공한 교토·고베 숙소 이미지를 앱 자산으로 반영했고, 비용 문제로 제외한 사이호지는 일정에서 제거했습니다.

### 현재 확인 필요 항목

출처가 없거나 변동 가능성이 있는 정보는 확정하지 않고 앱에 표시합니다. 현재 데이터에서 대표적으로 다음 항목은 방문 전에 다시 확인해야 합니다.

- 뉴뮌헨 하펜부르크·스테이크랜드 고베의 휴무일
- 일부 숙소의 정확한 핀·예약 정보
- 일부 메뉴의 가격·당일 판매 여부

### 스킬과 문서

- Codex 공통 스킬: `.agents/skills/travel-map-builder/SKILL.md`
- Claude/Gemini 연결용 포인터: `.claude/skills/travel-map-builder/`, `.gemini/skills/travel-map-builder/`
- JSON 필드 계약: `.agents/skills/travel-map-builder/references/trip-data-contract.md`
- 짧은 여행 입력부터 상세 조사자료까지 지원하며, 사용자는 여행지·기간·숙소·가고 싶은 곳 정도만 입력해도 됩니다.
- 새 기능이나 데이터 필드가 추가되면 이 README의 작업 완료 내역, 입력 포맷, 생성 결과 목록도 함께 갱신합니다.

### 앱 색상·아이콘 구분

일정 카드와 지도 마커는 아래 범례를 공통으로 사용합니다. 색상만 보지 않고 아이콘과 글자를 함께 표시해 모바일에서도 장소 종류를 빠르게 구분합니다.

| 표시 | 장소 종류 | 예시 |
| --- | --- | --- |
| 🟢 | 숙소 | 교토 숙소, 고베 숙소 |
| 🟣 | 사진 명소 | 청수사, 산넨자카 |
| 🔴 | 맛집 | 식당, 디저트 가게 |
| 🟠 | 카페 | 카페, 휴식 장소 |
| 🔵 | 역 | 교토역, 산조역 |
| 🔷 | 공항 | 간사이국제공항 |
| ⚫ | 짐 보관·이동 | 수하물 보관, 이동 구간 |

---

## 실제 화면 미리보기

아래 이미지는 목업이 아니라 현재 GitHub Pages에 배포된 교토·고베 앱을 430×932 모바일 화면에서 직접 캡처한 화면입니다. 화면이 바뀌면 저장소의 스냅샷 생성 스크립트로 다시 만들 수 있습니다.

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="./public/assets/readme/hub.png" alt="여행지 허브 화면" width="220" />
      <br /><strong>01 · 여행지 허브</strong>
      <br />여행지별 폴더를 카드로 분리합니다. 새 여행이 추가되어도 기존 일정과 섞이지 않습니다.
    </td>
    <td width="50%" valign="top">
      <img src="./public/assets/readme/itinerary-day2.png" alt="DAY 2 일정과 지도 화면" width="220" />
      <br /><strong>02 · 날짜별 일정·지도</strong>
      <br />헤더 아래 DAY 1~4 탭, 한글 지도, 방문 순서 마커, 실제 방문 체크, 장소 추가를 한 화면에서 사용합니다.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="./public/assets/readme/place-detail.png" alt="키치키치 장소 상세 화면" width="220" />
      <br /><strong>03 · 장소 상세·메뉴</strong>
      <br />영업시간, 가격, 입장료, 휴무일, 대체 식당, 일본어 메뉴와 한국어 번역·음식 사진을 확인합니다.
    </td>
    <td width="50%" valign="top">
      <img src="./public/assets/readme/saved-records.png" alt="저장한 장소와 현지 메모 화면" width="220" />
      <br /><strong>04 · 여행 기록</strong>
      <br />장소를 저장하고 방문 체크·현지 메모를 남깁니다. 추가·수정·삭제와 실제 방문만 보기 기능도 제공합니다.
    </td>
  </tr>
</table>

### 화면에서 확인할 수 있는 기능

| 화면 | 주요 기능 |
| --- | --- |
| 허브 | 여행지별 진입점, 여행 기간·지역 요약 |
| 일정 | 헤더 아래 고정형 DAY 1~4 탭, 일정 제목, 실제 방문 수, 대체 후보 토글, 장소 추가 |
| 지도 | 한글 지도, 방문 순서 마커, 겹치는 좌표 마커 분리, 내 위치·경로 맞춤 |
| 장소 카드 | 카테고리 아이콘·색상, 대표 이미지, 영업시간, 휴무일, 가격, 체크·즐겨찾기 |
| 상세 시트 | 주소, Google Maps·길찾기, 예약 링크, 메뉴 원문·번역, 음식 사진, 대체 식당 |
| 저장 | 즐겨찾기 모음, 현지 메모 모음, 실제 여행 중 기록 확인 |

### 스냅샷 다시 만들기

스크립트는 특정 GitHub 계정의 URL을 기본값으로 사용하지 않습니다. 로컬 서버나 각자의 공개 Pages URL을 `README_CAPTURE_URL`로 넘기면 같은 4장 구성을 다시 캡처합니다.

```bash
# 로컬 서버를 먼저 실행한 뒤
README_CAPTURE_URL=http://localhost:5173/kyoto-kobe-trip/ node scripts/capture-readme-screenshots.mjs

# 공개 Pages에서 캡처할 때
README_CAPTURE_URL=https://<github-id>.github.io/<repository-name>/kyoto-kobe-trip/ node scripts/capture-readme-screenshots.mjs
```

PowerShell에서는 다음처럼 실행합니다.

```powershell
$env:README_CAPTURE_URL = "http://localhost:5173/kyoto-kobe-trip/"
node scripts/capture-readme-screenshots.mjs
```

---

## AI로 새 여행 자동 만들기

이 저장소는 여행 계획을 입력받아 여행지별 폴더와 모바일 일정 앱을 만드는 템플릿입니다. 여행 계획을 아래 포맷으로 전달하면 AI가 장소 조사, 지도 연결, 일정 JSON 작성, 대표 이미지, 메뉴 번역, 대체 식당, 실제 방문 기록 기능까지 기존 앱 구조에 맞춰 구성합니다.

### 복붙용 기본 프롬프트

아래 코드블록을 그대로 복사한 뒤, 알고 있는 값만 채워 Claude Code·Gemini CLI·Codex에 전달하세요.
```text
https://<github-id>.github.io/<repository-name>/
https://<github-id>.github.io/<repository-name>/<destination-slug>/
```

사용자 페이지 저장소(`<github-id>.github.io`)는 `<repository-name>` 부분이 없습니다. GitHub 계정명과 저장소명을 코드에 직접 입력할 필요가 없으며, `GITHUB_REPOSITORY`로 Pages base path를 자동 계산합니다.

## 이 앱으로 할 수 있는 일

| 기능 | 설명 |
| --- | --- |
| 여행 생성 | 여행지·기간·숙소·희망 장소만 입력해도 부족한 주소, 지도 링크, 좌표, 운영 정보를 조사합니다. |
| 장소 정보 | 영업시간, 라스트오더, 휴무일, 가격, 입장료, 예약, 출처, 대표 이미지를 표시합니다. 모르는 값은 `확인 필요`로 남깁니다. |
| 메뉴판 | 일본어 원문 아래에 한국어 번역과 가격을 병기하고 메뉴별 음식 이미지를 연결합니다. |
| 지도 | 한글 우선 지도, 카테고리 색상 마커, Google Maps 장소 보기·길찾기를 제공합니다. |
| 대체 후보 | 예약 실패나 대기 상황에 대비한 근처 대체 식당을 기본 동선과 분리해 보여줍니다. |
| 여행 중 기록 | 방문 완료, 즐겨찾기, 현지 메모, 예약 체크를 저장합니다. |
| 장소 편집 | 등록되지 않은 장소를 추가하고, 기존 장소를 수정하거나 삭제(이 기기에서 숨김)할 수 있습니다. |
| 결과 공유 | 수정·삭제·추가·체크·메모가 포함된 JSON을 카카오톡 공유, 클립보드 복사, 파일 저장으로 보관합니다. |

## 여행 중 장소 추가·편집·공유

### 장소를 추가하거나 수정하기

1. 원하는 DAY에서 `장소 추가`를 누릅니다.
2. 장소명·카테고리·방문 시간·주소를 입력합니다.
3. Google Maps 링크가 없으면 장소명과 주소로 검색·길찾기 링크가 자동 생성됩니다.
4. 좌표가 없으면 목록에는 표시하되 지도 핀은 생략하고 `지도 위치 확인 필요`로 표시합니다.
5. 장소 카드를 누른 뒤 상세 시트의 `수정` 또는 `삭제`를 사용합니다.

원본 `trip.json`은 바뀌지 않습니다. 추가 장소, 수정 내용, 숨긴 장소는 해당 여행의 이 기기에만 저장되므로 실제 여행 결과를 정리할 때 안전합니다. `실제 방문 기록` 필터를 켜면 체크한 장소만 남겨 볼 수 있습니다.

### 친구에게 최종 일정 공유하기

1. 상단 `☰ 빠른 메뉴 → 데이터 내보내기`를 엽니다.
2. `카톡·앱으로 공유`, `텍스트 복사`, 또는 `파일로 저장`을 선택합니다.
3. 친구가 같은 여행 앱에서 `☰ → 데이터 가져오기`를 엽니다.
4. JSON을 붙여넣거나 `.json` 파일을 선택하고 `이 데이터로 업데이트`를 누릅니다.

내보내기 데이터에는 현재 일정 스냅샷과 방문 체크·즐겨찾기·메모·예약 체크·장소 수정·삭제·추가·선택 DAY가 함께 들어갑니다. 다른 `destination-slug`의 데이터는 잘못 적용되지 않도록 거부합니다.

> GitHub Pages는 정적 사이트이므로 LocalStorage 기록이 URL만으로 자동 동기화되지는 않습니다. **앱 링크는 원본 일정 공유용**, **JSON 내보내기는 실제 여행 결과 공유·복원용**입니다.

## 새 여행 자동 생성

가장 간단한 방법은 아래 프롬프트에 여행 정보만 채워 `$travel-map-builder` 스킬을 호출하는 것입니다.

<details>
<summary>복붙용 앱 생성 프롬프트 열기</summary>

```text
이 저장소의 $travel-map-builder 스킬을 사용해 새 여행 앱을 만들어줘.

여행지: [도시 또는 국가]
기간: [YYYY-MM-DD ~ YYYY-MM-DD 또는 3박 4일]
숙소: [이름·주소·Google Maps 링크. 모르면 예정/미정]
가고 싶은 곳: [장소·맛집·카페·활동]
여행 스타일/예산: [예: 맛집 중심, 하루 3~4곳, 1인 하루 10,000엔]
참고 자료: [링크·문서·이미지·메모]
원하는 작업: [앱 생성만 / GitHub Pages 배포까지]

현재 저장소의 공통 travel-map-builder 디자인과 교토·고베 실제 화면을 그대로 유지해줘.
기존 여행은 수정하지 말고 travel/<destination-slug>/trip.json,
page/<destination-slug>/index.html과 루트 허브 카드를 새로 만들어줘.
주소·Google Maps 링크·좌표·영업시간·휴무일·가격·메뉴·대표 이미지는 조사해서 채우고,
확인할 수 없는 내용은 추측하지 말고 확인 필요로 표시해줘.
일본어 메뉴는 원문 아래에 한국어 번역과 가격을 표시하고,
식당별 휴무일·대체 식당·출처 링크도 포함해줘.
장소 추가·수정·삭제·방문 체크·메모·JSON 내보내기/가져오기를 유지해줘.
배포는 내가 배포까지라고 요청한 경우에만 진행해줘.
```

전체 작업 지침은 [`prompts/travel-app-build.md`](./prompts/travel-app-build.md)에 있습니다.

</details>

## 여행계획 조사 프롬프트

여행 정보가 메모 수준이면 먼저 아래 프롬프트로 `travel-research.v1` 조사자료를 만듭니다. 이 단계는 코드를 수정하지 않고, 다음 앱 생성 단계가 읽을 수 있는 JSON을 만듭니다.

<details>
<summary>복붙용 여행계획 조사 프롬프트 열기</summary>

```text
여행 계획을 완성하고 장소 정보를 조사해줘. 코드를 만들지 말고
사람이 읽을 수 있는 일정 요약과 travel-research.v1 JSON을 만들어줘.

여행지/국가: [예: 일본 후쿠오카·유후인]
기간: [YYYY-MM-DD ~ YYYY-MM-DD 또는 3박 4일]
여행 인원: [성인 2명]
숙소: [이름·주소·Google Maps 링크]
고정 일정/교통: [항공편·열차·예약·체크인/체크아웃]
가고 싶은 곳·먹고 싶은 것: [장소·맛집·카페·활동]
여행 스타일/예산: [예: 맛집 중심, 1인 하루 10,000엔]
특별 조건: [걷기·유모차·채식·알레르기 등]
참고 링크·문서·이미지·메모: [붙여넣기]

사용자가 준 날짜·순서·예약·장소는 보존해줘.
공식 홈페이지·공식 SNS·예약 페이지·정확한 Google Maps 결과를 우선 조사해줘.
주소·좌표·영업시간·라스트오더·휴무일·가격·입장료·예약·메뉴·대표 이미지와
각 출처를 기록해줘. Google Maps 링크가 없으면 정확한 검색 링크를 만들고,
정확한 핀을 확인하지 못한 좌표는 null로 둬.
일본어 메뉴는 nameJa, 한국어 번역은 nameKo, 가격은 원문 그대로 보존해줘.
식당·카페의 closedDays는 별도 필드로 넣고, 모르면 확인 필요로 표시해줘.
대체 식당은 기본 일정과 분리하고 alternativeFor, nearbyWalk를 기록해줘.
확인할 수 없는 정보는 절대 추측하지 말고 needsConfirmation에 이유를 적어줘.
```

전체 JSON 필드와 Claude·Gemini·GPT/Codex별 조사 방식은 [`prompts/travel-plan-research.md`](./prompts/travel-plan-research.md)를 참고하세요.

</details>

## UI만 수정할 때

데이터나 여행 폴더는 건드리지 않고 헤더·지도·카드·상세 시트·반응형만 고칠 때는 `$travel-ui`를 사용합니다.

<details>
<summary>복붙용 UI 수정 프롬프트 열기</summary>

```text
이 저장소의 $travel-ui 스킬을 사용해 UI만 수정해줘.

문제/요구사항: [예: Pixel 10에서 헤더가 잘리고 썸네일이 본문을 가림]
기준 화면: 현재 교토·고베 앱의 모바일 디자인
범위: [헤더 / 지도 / 장소 카드 / 상세 시트 / 하단 메뉴 / 반응형]

design-system.md와 component-contract.md를 먼저 읽고,
TravelHeader, TravelBottomNav, TravelCategoryLegend, TravelPlaceCard,
TravelDataTransferSheet와 src/prototype.css를 재사용해줘.
Prototype.tsx는 상태·데이터 조합만 담당하게 하고 공통 UI는 src/travel-ui에서 수정해줘.
360/393/430px 및 넓은 기기 화면의 overflow를 검수하고 검수 명령을 실행해줘.
```

자세한 규칙은 [`.agents/skills/travel-ui/SKILL.md`](./.agents/skills/travel-ui/SKILL.md)에 있습니다.

</details>

## 저장소 구조

```text
travel/                         # 여행별 정본 데이터
  guam-trip/trip.json
  kyoto-kobe-trip/trip.json
  jeju-sports-trip/trip.json
  <destination-slug>/trip.json
page/                           # 배포 페이지 엔트리
  guam-trip/index.html
  kyoto-kobe-trip/index.html
  jeju-sports-trip/index.html
  <destination-slug>/index.html
src/travel-ui/                  # 모든 여행이 공유하는 UI·타입·카테고리
  components.tsx
  types.ts
  category.ts
  index.ts
src/Prototype.tsx               # 상태·지도·데이터 조합
src/prototype.css               # 공통 디자인·반응형 스타일
prompts/                        # 조사·앱 생성 원샷 프롬프트
.agents/skills/                 # Codex canonical skills
.claude/skills/, .gemini/skills/ # provider pointer skills
```

새 여행은 반드시 `travel/<destination-slug>/trip.json`과 `page/<destination-slug>/index.html`로 추가합니다. 저장소 루트에 여행별 폴더나 독립 dashboard/CSS를 만들지 않습니다. Pages 빌드가 배포 시 `/<destination-slug>/` 경로로 출력합니다.

## 스킬·에이전트 안내

| 환경 | 먼저 읽는 파일 | 역할 |
| --- | --- | --- |
| Codex 전체 작업 | [`AGENTS.md`](./AGENTS.md) → [canonical skill](./.agents/skills/travel-map-builder/SKILL.md) | 조사·여행 생성·데이터·검수·선택적 배포 |
| Codex UI-only | [`AGENTS.md`](./AGENTS.md) → [travel-ui](./.agents/skills/travel-ui/SKILL.md) | 공통 UI·반응형·시각 회귀 |
| Claude Code | [`CLAUDE.md`](./CLAUDE.md) → [Claude pointer](./.claude/skills/travel-map-builder/SKILL.md) | canonical travel-map-builder 연결 |
| Gemini CLI | [`GEMINI.md`](./GEMINI.md) → [Gemini pointer](./.gemini/skills/travel-map-builder/SKILL.md) | canonical travel-map-builder 연결 |

공통 계약 문서는 다음 순서로 사용합니다.

1. [`design-system.md`](./.agents/skills/travel-map-builder/references/design-system.md) — 현재 화면의 시각 규칙
2. [`component-contract.md`](./.agents/skills/travel-map-builder/references/component-contract.md) — 공통 컴포넌트 API와 경계
3. [`trip-data-contract.md`](./.agents/skills/travel-map-builder/references/trip-data-contract.md) — `trip.json` 필드
4. [`research-packet.md`](./.agents/skills/travel-map-builder/references/research-packet.md) — 조사 결과 JSON

## 디자인 계약

현재 교토·고베 화면이 모든 여행의 기준입니다. 여행별 차이는 데이터로만 표현하고, UI는 공통 컴포넌트를 조합합니다.

### 공통 컴포넌트

| 컴포넌트 | 책임 |
| --- | --- |
| `TravelHeader` | 제목·기간·헤더 안 `DAY · 날짜` 이동·빠른 메뉴 |
| `TravelBottomNav` | 일정·지도·예약·저장 고정 하단 메뉴 |
| `TravelCategoryLegend` | 장소 종류별 색상·아이콘 범례 |
| `TravelPlaceCard` | 번호·카테고리·운영정보·썸네일·체크·즐겨찾기 |
| `TravelDataTransferSheet` | JSON 내보내기·가져오기·공유 |

### 화면 규칙

- Pretendard-first 폰트, 옅은 배경, 흰색 bordered card, 명확한 section 경계선을 사용합니다.
- `DAY · 날짜`는 헤더의 `.header-copy .header-meta` 안에 둡니다. 지도 위에 날짜 탭을 겹치지 않습니다.
- 지도는 compact sticky route preview이며, 스크롤 중에는 요약 바로 접혀 장소 카드를 가리지 않습니다.
- 지도 마커 클릭은 카드 포커스만 하고, 카드 본문 클릭만 상세 `BottomSheet`를 엽니다.
- 상세 시트는 내부 스크롤이 가능해야 하며 메뉴·사진·대체 식당·메모의 마지막까지 도달해야 합니다.
- 360/393/430px과 넓은 기기 화면에서 제목·버튼·썸네일·메뉴가 겹치거나 잘리지 않아야 합니다.

### 카테고리 색상

`🟢 숙소` · `🟣 사진 명소` · `🔴 맛집` · `🟠 카페` · `🔵 역` · `🔷 공항` · `⚫ 짐 보관·이동`

카드 왼쪽 accent, 번호, 지도 마커, 범례는 같은 카테고리 색상을 사용합니다. 원격 이미지가 실패하면 지도 미리보기나 카테고리 이미지로 대체하고 깨진 이미지 아이콘을 표시하지 않습니다.

## 실제 화면 미리보기

현재 앱의 실제 캡처는 `public/assets/readme/`에 있습니다.

<table>
  <tr>
    <td><img src="./public/assets/readme/hub.png" alt="여행 허브" width="220" /></td>
    <td><img src="./public/assets/readme/itinerary-day2.png" alt="지도와 일정 카드" width="220" /></td>
    <td><img src="./public/assets/readme/place-detail.png" alt="장소 상세" width="220" /></td>
    <td><img src="./public/assets/readme/saved-records.png" alt="저장한 장소와 메모" width="220" /></td>
  </tr>
  <tr>
    <td align="center">여행 허브</td>
    <td align="center">지도·동선·카드</td>
    <td align="center">운영 정보·메뉴</td>
    <td align="center">기록·즐겨찾기</td>
  </tr>
</table>

스크린샷을 다시 만들려면 로컬 서버를 실행한 뒤 다음 명령을 사용합니다.

```powershell
$env:README_CAPTURE_URL = "http://localhost:5173/kyoto-kobe-trip/"
node scripts/capture-readme-screenshots.mjs
```

## 검수 명령

```bash
npm run validate:trip
npm run check:runtime
npm run build
npm run test:sites
git diff --check
```

여행 생성·UI 변경 후에는 모든 DAY, 숙소 상세, 식당 메뉴, 대체 식당, 휴무일, 이미지 폴백, 마커/카드 클릭, 상세 시트 첫·끝 스크롤, 장소 추가·수정·삭제, 실제 방문만 보기, JSON 내보내기·가져오기를 확인합니다.

## 불확실한 정보 처리

공식 페이지·공식 SNS·예약 페이지·정확한 Google Maps 결과를 우선합니다. 나무위키·블로그·검색 결과 썸네일은 보조 자료로만 사용합니다. 주소·좌표·영업시간·휴무일·가격·메뉴·이미지를 확인하지 못하면 추측하지 않고 화면에 `확인 필요`와 출처 또는 사유를 남깁니다.

<details>
<summary>상세 문서와 프롬프트 전체 목록</summary>

- 앱 생성 원샷: [`prompts/travel-app-build.md`](./prompts/travel-app-build.md)
- 여행계획 조사: [`prompts/travel-plan-research.md`](./prompts/travel-plan-research.md)
- Codex 전체 스킬: [`.agents/skills/travel-map-builder/SKILL.md`](./.agents/skills/travel-map-builder/SKILL.md)
- Codex UI 스킬: [`.agents/skills/travel-ui/SKILL.md`](./.agents/skills/travel-ui/SKILL.md)
- 시각 계약: [`.agents/skills/travel-map-builder/references/design-system.md`](./.agents/skills/travel-map-builder/references/design-system.md)
- 컴포넌트 계약: [`.agents/skills/travel-map-builder/references/component-contract.md`](./.agents/skills/travel-map-builder/references/component-contract.md)
- 데이터 계약: [`.agents/skills/travel-map-builder/references/trip-data-contract.md`](./.agents/skills/travel-map-builder/references/trip-data-contract.md)
- 조사자료 계약: [`.agents/skills/travel-map-builder/references/research-packet.md`](./.agents/skills/travel-map-builder/references/research-packet.md)

</details>
