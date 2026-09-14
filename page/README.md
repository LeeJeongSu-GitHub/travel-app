# 배포 페이지 보관소

각 여행의 실제 페이지 엔트리를 `page/<destination-slug>/index.html`로 보관합니다. 여행 데이터는 같은 slug의 `travel/<destination-slug>/trip.json`에 있습니다.

Pages 빌드는 이 페이지들을 기존의 `/<destination-slug>/` 공개 주소로 출력합니다. 따라서 새 여행을 추가할 때 저장소 루트에 목적지 폴더를 만들지 않고 `travel/`과 `page/` 아래에 각각 한 폴더씩 추가합니다.
