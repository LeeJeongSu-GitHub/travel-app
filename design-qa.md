# Design QA — Kyoto Kobe Trip Map

**Source visual truth**

- [codex-clipboard-3a26d8b6-40f0-4bc7-94b9-91aaba9d7d0d.png](C:/Users/shin1/AppData/Local/Temp/codex-clipboard-3a26d8b6-40f0-4bc7-94b9-91aaba9d7d0d.png) — TRIPLE-style day 1 reference.
- [codex-clipboard-5ac5a595-ff88-4cfa-9ad3-bf5a31fd9a32.png](C:/Users/shin1/AppData/Local/Temp/codex-clipboard-5ac5a595-ff88-4cfa-9ad3-bf5a31fd9a32.png) — dense day 4 reference.

**Implementation evidence**

- Codex In-app Browser tab 1, `http://localhost:4173/kyoto-kobe-trip/?day=22`.
- Inline implementation capture clipped to `[data-testid="device-screen"]`; 393 × 852 CSS px, 393 × 852 captured pixels, device scale 1. The capture shows DAY 4 with the map, numbered route, day tabs, and bottom navigation.
- The source captures are 420 × 803 and 303 × 803 pixels. They are used as structural references; device chrome is excluded from app-owned fidelity judgments.

**State and interactions checked**

- DAY 2 and DAY 4 selection updates the map, route list, and `?day=20` / `?day=22` URL query.
- Place card opens the detail Bottom Sheet; Google Maps place/directions links are present.
- Detail sheet save, visit complete, and local memo entry persist in LocalStorage and appear in Saved.
- Reservation completion updates the count and badge locally.
- Alternative route toggle reveals optional places without changing the primary route line.
- All Map view exposes date and category filters.
- 393px screen has no horizontal overflow (`scrollWidth === clientWidth`); browser console reported no warnings/errors.

**Fidelity review**

- Fonts and typography: Korean UI uses the existing system fallback stack with compact bold hierarchy, readable body text, and no clipped labels. The small uppercase route labels are an intentional addition for scanability.
- Spacing and layout: the implementation keeps the reference order—header, map, day tabs, numbered vertical cards, and bottom navigation—with larger map height per the PRD's 34–42dvh requirement. Cards retain the reference's compact white surfaces and thin separators.
- Colors and tokens: white cards, cool pale map shell, blue primary actions, day-colored pins, and explicit reservation status colors preserve the reference's high-contrast utility while adding a coherent Kyoto/Kobe palette.
- Image quality and asset fidelity: map imagery is live Leaflet/OpenStreetMap as required by the PRD; the provided screenshots are references and are not shipped as page artwork. Icons use the installed Lucide family. Device-frame assets were rechecked after the GitHub Pages base-path fix.
- Copy and content: visible itinerary copy comes from the PRD. Unconfirmed hotel coordinates remain an explicit “지도 위치 확인 필요” state instead of an invented pin.

**Findings**

- No actionable P0/P1/P2 differences remain.
- The map visual differs from the screenshots because the PRD explicitly requires Leaflet/OpenStreetMap instead of Google Maps as the map canvas. This is an intentional product constraint, not design drift.
- The mobile runtime adds a device frame in the prototype preview. This is protected template chrome and is not part of the shipped app-owned layout.

**Open Questions**

- Exact travel month/year is not provided, so the UI correctly shows day-of-month labels only.
- Exact Kyoto/Kobe accommodation coordinates and host pins should be filled in `src/data/trip.json` when confirmed.

**Implementation Checklist**

- [x] Match reference information hierarchy and mobile density.
- [x] Verify primary actions and local state flows.
- [x] Verify 393px responsive layout and horizontal overflow.
- [x] Recheck device assets after the GitHub Pages base-path correction.
- [x] Check console warnings/errors.

**Follow-up Polish**

- Add confirmed accommodation pins and exact travel date metadata when available.
- If desired, add a build-time Notion sync workflow using GitHub Secrets in a later phase.

final result: passed
