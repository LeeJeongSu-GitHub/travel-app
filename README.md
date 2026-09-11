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
