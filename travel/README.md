# 여행 데이터 보관소

새 여행 데이터는 이 폴더 아래에 `destination-slug/trip.json`으로 보관합니다. 실제 배포 페이지 엔트리는 같은 slug로 `page/destination-slug/index.html`에 보관합니다.

GitHub Pages 빌드는 이 정본 데이터를 기존의 `/<destination-slug>/` 주소로 출력합니다. 따라서 저장소에서는 여행 폴더가 `travel/` 아래에 모이고, 공개 주소는 기존 규칙을 유지합니다.

저장소 루트에는 여행별 폴더를 만들지 않습니다. 여행 데이터는 이 폴더의 JSON만, 페이지 엔트리는 `page/` 아래의 HTML만 수정합니다. Pages 빌드가 `page/<slug>/index.html`을 공개 산출물의 `/<slug>/index.html`로 옮겨 기존 주소를 유지합니다.
