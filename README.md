# Kyoto Kobe Trip Map

19일부터 22일까지 교토·고베 여행을 현지에서 빠르게 확인하기 위한 모바일 우선 정적 웹앱입니다.

## 실행

```bash
npm install
npm run dev
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 `dist/client`를 GitHub Pages에 배포합니다.

- 지도: Leaflet + OpenStreetMap
- 실제 길찾기: 장소별 Google Maps URL
- 여행 중 체크/즐겨찾기/메모: LocalStorage
- 오프라인: 서비스 워커가 앱 셸과 접속한 리소스를 캐시

Notion 토큰은 프론트 코드에 포함하지 않습니다. 여행 데이터는 `src/data/trip.json`의 정적 스냅샷으로 관리합니다.
