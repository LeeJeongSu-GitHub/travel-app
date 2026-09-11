# Trip data contract

Use the existing TypeScript types in `src/Prototype.tsx` as the final authority. This reference captures the fields an agent must preserve when creating a new destination.

## Trip and day

```json
{
  "title": "여행 제목",
  "days": [
    {
      "id": "day-1",
      "dayNumber": 1,
      "dayOfMonth": 19,
      "city": "교토",
      "title": "하루 일정 제목",
      "places": []
    }
  ]
}
```

Keep `dayNumber`, `dayOfMonth`, and each place `order` numeric. Use stable kebab-case IDs. If lodging repeats on different days, give each itinerary occurrence its own ID.

## Place

```json
{
  "id": "sample-restaurant",
  "order": 3,
  "name": "샘플 식당",
  "nameJa": "サンプル食堂",
  "category": "restaurant",
  "latitude": 35.0116,
  "longitude": 135.7681,
  "address": "교토시 ...",
  "plannedTime": "12:00 점심",
  "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=...",
  "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=35.0116,135.7681",
  "hours": "11:00–21:00 · L.O. 20:30",
  "closedDays": "화요일",
  "price": "약 ¥1,000–¥2,000",
  "admission": "해당 없음",
  "reservationStatus": "recommended",
  "infoSourceUrl": "https://example.com/official",
  "imageUrl": "assets/trip/sample-place.png",
  "menu": [
    { "name": "日本語 메뉴명", "nameKo": "한국어 메뉴명", "price": "¥1,200", "note": "선택" }
  ]
}
```

Normally include `id`, `order`, `name`, `category`, `googleMapsUrl`, `address`, `plannedTime`, `hours`, `price`, `admission`, and `directionsUrl`. Coordinates are optional only when the location cannot be resolved confidently; do not provide one coordinate without the other.

Allowed categories:

- `photo`: 전망, 사찰, 거리, 공원, 전망대
- `restaurant`: 식사·맛집
- `cafe`: 카페·디저트
- `hotel`: 숙소
- `station`: 역·환승 거점
- `airport`: 공항
- `logistics`: 짐 보관, 이동 준비, 기타 운영 지점

Useful optional fields are `photoPoint`, `menuPoint`, `operatingNote`, `closedDays`, `budget`, `optional`, `alternativeFor`, and `nearbyWalk`. For restaurants and cafes, provide `closedDays` explicitly; use `확인 필요` when the source does not confirm a regular closure day. A fallback restaurant should use `optional: true` and identify the primary place with `alternativeFor`.

## Uncertainty and links

Use a user-provided Maps URL first. For a missing URL, use an exact official place or Google Maps search URL. A lodging URL described as “같아”, “추정”, or similar is not confirmed: keep `reservationStatus: "check_required"`, label the address as a shared/estimated pin, and state what must be checked.

Do not turn an approximate price, schedule, menu, opening hour, or address into a confirmed fact. Store `확인 필요` in the visible field or notes and include the best source URL.

## Menu translation

Keep the original Japanese in `name`; add a short natural Korean rendering in `nameKo`. Do not replace the original. Use `note` for serving size, availability, or a translation caveat. Keep the source price unchanged.
