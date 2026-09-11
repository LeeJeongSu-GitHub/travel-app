import { useCallback, useEffect, useMemo, useState, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { setWorkerUrl } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { MapContainer, Marker, Polyline, Tooltip, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CircleHelp,
  ExternalLink,
  Heart,
  Info,
  Landmark,
  LocateFixed,
  Luggage,
  Map as MapIcon,
  MapPinned,
  Menu,
  Navigation,
  Plane,
  Pencil,
  Plus,
  Search,
  StickyNote,
  Ticket,
  TrainFront,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { BottomSheet, KeyboardInput, KeyboardTextarea, MobileScroll, useKeyboard } from "./mobile";
const tripDataFiles = import.meta.glob("../*/trip.json", { eager: true, import: "default" }) as Record<string, Trip>;

setWorkerUrl(maplibreWorkerUrl);

type Category = "photo" | "restaurant" | "cafe" | "hotel" | "station" | "airport" | "logistics";
type ReservationStatus = "required" | "recommended" | "not_required" | "check_required" | "completed";
type Coordinate = [number, number];
type View = "schedule" | "map" | "reservations" | "saved";
type DayFilter = number | "all";
type CategoryFilter = Category | "all";
type MenuItem = { name: string; nameJa?: string; nameKo?: string; price: string; note?: string };

type Place = {
  id: string;
  order: number;
  name: string;
  nameJa?: string;
  category: Category;
  latitude?: number;
  longitude?: number;
  address?: string;
  plannedTime?: string;
  googleMapsUrl: string;
  directionsUrl?: string;
  reservationUrl?: string;
  reservationStatus?: ReservationStatus;
  photoPoint?: string;
  menuPoint?: string;
  menu?: MenuItem[];
  budget?: string;
  hours?: string;
  price?: string;
  admission?: string;
  operatingNote?: string;
  infoSourceUrl?: string;
  alternativeFor?: string;
  nearbyWalk?: string;
  optional?: boolean;
  notes?: string;
};

type TripDay = { id: string; dayNumber: number; dayOfMonth: number; city: string; title: string; places: Place[] };
type Trip = { title: string; days: TripDay[] };
type MapPlace = Place & { dayNumber: number; dayOfMonth: number; dayTitle: string };
type PlaceDraft = { name: string; category: Category; plannedTime: string; address: string; hours: string; price: string; admission: string; latitude: string; longitude: string; googleMapsUrl: string; directionsUrl: string; notes: string; markVisited: boolean };
type LocalTripState = { selectedDay: number; completedPlaceIds: string[]; favoritePlaceIds: string[]; notes: Record<string, string>; reservationDoneIds: string[]; placeEdits: Record<string, Partial<Place>>; hiddenPlaceIds: string[]; addedPlaces: MapPlace[]; actualOnly: boolean };

const tripSlug = window.location.pathname.split("/").filter(Boolean).at(-1) ?? "kyoto-kobe-trip";
const trip = tripDataFiles[`../${tripSlug}/trip.json`] ?? tripDataFiles["../kyoto-kobe-trip/trip.json"] ?? { title: "여행 지도", days: [] };
const tripStorageKey = `travel-map-state-${tripSlug}`;
const tripDestinationLabel = trip.title.replace(/\s*여행(?:\s*지도)?$/, "").trim();
const tripDateLabel = trip.days.length ? `${trip.days[0].dayOfMonth}일 ~ ${trip.days[trip.days.length - 1].dayOfMonth}일 · ${tripDestinationLabel || trip.days[0].city}` : "여행 일정";
const DAY_COLORS = ["#7357db", "#1457d9", "#139d8c", "#ef5a6f"];
const categoryLabels: Record<Category, string> = {
  photo: "사진 명소",
  restaurant: "맛집",
  cafe: "카페",
  hotel: "숙소",
  station: "역",
  airport: "공항",
  logistics: "짐 보관·이동",
};
const categoryIcons: Record<Category, typeof Camera> = {
  photo: Camera,
  restaurant: Utensils,
  cafe: Search,
  hotel: Landmark,
  station: TrainFront,
  airport: Plane,
  logistics: Luggage,
};
const reservationLabels: Record<ReservationStatus, string> = {
  required: "예약 필수",
  recommended: "예약 권장",
  not_required: "예약 불필요",
  check_required: "확인 필요",
  completed: "예약 완료",
};

const KOREAN_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const KOREAN_LABEL_EXPRESSION = [
  "coalesce",
  ["get", "name:ko"],
  ["get", "name:ko-Latn"],
  ["get", "name:en"],
  ["get", "name_en"],
  ["get", "name:latin"],
  ["get", "name:nonlatin"],
  ["get", "name"],
] as const;

function readLocalState(): LocalTripState | null {
  try {
    const raw = window.localStorage.getItem(tripStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalTripState>;
    return {
      selectedDay: Number(parsed.selectedDay) || trip.days[0]?.dayOfMonth || 1,
      completedPlaceIds: Array.isArray(parsed.completedPlaceIds) ? parsed.completedPlaceIds : [],
      favoritePlaceIds: Array.isArray(parsed.favoritePlaceIds) ? parsed.favoritePlaceIds : [],
      notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
      reservationDoneIds: Array.isArray(parsed.reservationDoneIds) ? parsed.reservationDoneIds : [],
      placeEdits: parsed.placeEdits && typeof parsed.placeEdits === "object" ? parsed.placeEdits : {},
      hiddenPlaceIds: Array.isArray(parsed.hiddenPlaceIds) ? parsed.hiddenPlaceIds : [],
      addedPlaces: Array.isArray(parsed.addedPlaces) ? parsed.addedPlaces : [],
      actualOnly: Boolean(parsed.actualOnly),
    };
  } catch {
    return null;
  }
}

function initialDayOfMonth() {
  const queryDay = Number(new URLSearchParams(window.location.search).get("day"));
  const storedDay = readLocalState()?.selectedDay;
  return trip.days.some((day) => day.dayOfMonth === queryDay)
    ? queryDay
    : trip.days.some((day) => day.dayOfMonth === storedDay)
      ? storedDay!
      : trip.days[0].dayOfMonth;
}

function emptyPlaceDraft(): PlaceDraft {
  return { name: "", category: "photo", plannedTime: "", address: "", hours: "", price: "", admission: "", latitude: "", longitude: "", googleMapsUrl: "", directionsUrl: "", notes: "", markVisited: true };
}

function placeToDraft(place: MapPlace | null): PlaceDraft {
  if (!place) return emptyPlaceDraft();
  return { name: place.name, category: place.category, plannedTime: place.plannedTime ?? "", address: place.address ?? "", hours: place.hours ?? "", price: place.price ?? "", admission: place.admission ?? "", latitude: place.latitude === undefined ? "" : String(place.latitude), longitude: place.longitude === undefined ? "" : String(place.longitude), googleMapsUrl: place.googleMapsUrl, directionsUrl: place.directionsUrl ?? "", notes: place.notes ?? "", markVisited: false };
}

function optionalText(value: string) {
  return value.trim() || undefined;
}

function parseCoordinate(value: string) {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCoordinatesFromUrl(value: string): Coordinate | null {
  const match = value.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ?? value.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
}

function draftToPlace(draft: PlaceDraft, id: string, order: number): Place {
  const query = [draft.name.trim(), draft.address.trim()].filter(Boolean).join(" ");
  const googleMapsUrl = draft.googleMapsUrl.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const directionsUrl = draft.directionsUrl.trim() || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
  const urlCoordinates = parseCoordinatesFromUrl(googleMapsUrl);
  return { id, order, name: draft.name.trim(), category: draft.category, plannedTime: optionalText(draft.plannedTime), address: optionalText(draft.address), hours: optionalText(draft.hours), price: optionalText(draft.price), admission: optionalText(draft.admission), latitude: parseCoordinate(draft.latitude) ?? urlCoordinates?.[0], longitude: parseCoordinate(draft.longitude) ?? urlCoordinates?.[1], googleMapsUrl, directionsUrl, notes: optionalText(draft.notes) };
}

function coordinates(place: Place): Coordinate | null {
  return typeof place.latitude === "number" && typeof place.longitude === "number" ? [place.latitude, place.longitude] : null;
}

function distanceKm(start: Coordinate, end: Coordinate) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(end[0] - start[0]);
  const longitudeDelta = toRadians(end[1] - start[1]);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(start[0])) * Math.cos(toRadians(end[0])) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceLabel(current: Place, next?: Place) {
  if (!next) return "다음 일정 없음";
  const start = coordinates(current);
  const end = coordinates(next);
  if (!start || !end) return "이동 정보 확인 필요";
  const distance = distanceKm(start, end);
  return `직선 약 ${distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}`;
}

function createNumberIcon(label: string, selected: boolean, optional: boolean, color: string) {
  return L.divIcon({
    className: "number-marker-icon",
    html: `<span class="number-marker ${selected ? "is-selected" : ""} ${optional ? "is-optional" : ""}" style="--marker-color:${color}">${label}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

const currentLocationIcon = L.divIcon({ className: "current-location-icon", html: '<span class="current-location-dot" aria-hidden="true"></span>', iconSize: [24, 24], iconAnchor: [12, 12] });

function MapViewport({ routePlaces, selectedPlace, userLocation }: { routePlaces: MapPlace[]; selectedPlace: Place | null; userLocation: Coordinate | null }) {
  const map = useMap();
  const routeKey = routePlaces.map((place) => place.id).join("|");

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 60);
    return () => window.clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    const points = routePlaces.map(coordinates).filter((point): point is Coordinate => Boolean(point));
    if (userLocation) points.push(userLocation);
    if (points.length === 1) map.setView(points[0], 15, { animate: false });
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15, animate: false });
  }, [map, routeKey, userLocation]);

  useEffect(() => {
    const point = selectedPlace ? coordinates(selectedPlace) : null;
    if (point) map.flyTo(point, Math.max(map.getZoom(), 15), { duration: 0.45 });
  }, [map, selectedPlace?.id]);

  return userLocation ? <Marker position={userLocation} icon={currentLocationIcon} /> : null;
}

function KoreanMapLayer({ onReady, onError }: { onReady: () => void; onError: () => void }) {
  const map = useMap();

  useEffect(() => {
    let active = true;
    const layer = maplibreGL({ style: KOREAN_MAP_STYLE_URL }).addTo(map);
    const glMap = layer.getMaplibreMap();
    const handleLoad = () => {
      if (!active) return;
      for (const styleLayer of glMap.getStyle().layers) {
        if (styleLayer.type !== "symbol" || !styleLayer.layout?.["text-field"]) continue;
        glMap.setLayoutProperty(styleLayer.id, "text-field", KOREAN_LABEL_EXPRESSION as never);
      }
      onReady();
    };
    const handleError = (event: { error?: unknown }) => {
      if (event.error) onError();
    };

    glMap.on("load", handleLoad);
    glMap.on("error", handleError);
    return () => {
      active = false;
      glMap.off("load", handleLoad);
      glMap.off("error", handleError);
      map.removeLayer(layer);
    };
  }, [map, onError, onReady]);

  return null;
}

function MapButtons({ routePlaces, onLocate }: { routePlaces: MapPlace[]; onLocate: () => void }) {
  const map = useMap();
  const fitRoute = () => {
    const points = routePlaces.map(coordinates).filter((point): point is Coordinate => Boolean(point));
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 });
  };
  return <div className="map-actions" aria-label="지도 조작"><button type="button" className="map-action" onClick={onLocate} aria-label="내 위치 보기"><LocateFixed size={18} strokeWidth={1.9} /><span>내 위치</span></button><button type="button" className="map-action" onClick={fitRoute} aria-label="오늘 경로 맞춤 보기"><MapPinned size={18} strokeWidth={1.9} /><span>경로 맞춤</span></button></div>;
}

function OfflineMapFallback({ places, onSelect }: { places: MapPlace[]; onSelect: (place: MapPlace) => void }) {
  return <div className="offline-map" role="status"><div className="offline-map-icon"><MapIcon size={20} /></div><strong>지도를 불러올 수 없습니다</strong><p>저장된 일정과 주소는 계속 확인할 수 있어요.</p><div className="offline-place-list">{places.filter((place) => !place.optional).slice(0, 5).map((place) => <button type="button" key={place.id} onClick={() => onSelect(place)}><span className="offline-place-number">{place.order}</span><span>{place.name}</span><ChevronRight size={15} /></button>)}</div></div>;
}

function TripMap({ places, routePlaces, selectedPlace, onSelect, userLocation, onUserLocation, mode = "day" }: { places: MapPlace[]; routePlaces: MapPlace[]; selectedPlace: Place | null; onSelect: (place: MapPlace) => void; userLocation: Coordinate | null; onUserLocation: (location: Coordinate) => void; mode?: "day" | "all" }) {
  const [mapError, setMapError] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const mapPlaces = places.filter((place) => coordinates(place));
  const routePoints = routePlaces.map(coordinates).filter((point): point is Coordinate => Boolean(point));
  const center = routePoints[0] ?? [34.9858, 135.7588];
  const handleMapReady = useCallback(() => setMapError(false), []);
  const handleMapError = useCallback(() => setMapError(true), []);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => onUserLocation([position.coords.latitude, position.coords.longitude]), () => undefined, { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 });
  };
  const mapUnavailable = !isOnline || mapError;

  return <section className={`trip-map ${mode === "all" ? "is-all-map" : ""}`} aria-label={mode === "all" ? "전체 여행 지도" : "오늘 일정 지도"}>
    <div className="map-label-row"><div><span className="eyebrow">ROUTE PREVIEW</span><strong>{mode === "all" ? "전체 경로" : "방문 순서"}</strong></div><span className="map-count">{mapPlaces.length}곳 표시</span></div>
    <div className="map-frame" data-scroll-drag="ignore">
      {mapUnavailable ? <OfflineMapFallback places={places} onSelect={onSelect} /> : <MapContainer center={center} zoom={13} minZoom={1} zoomControl={false} scrollWheelZoom doubleClickZoom className="leaflet-map" aria-label="한글 여행 지도">
        <KoreanMapLayer onReady={handleMapReady} onError={handleMapError} />
        <MapViewport routePlaces={routePlaces} selectedPlace={selectedPlace} userLocation={userLocation} />
        <ZoomControl position="bottomright" />
        <MapButtons routePlaces={routePlaces} onLocate={requestLocation} />
        {routePoints.length > 1 ? <Polyline positions={routePoints} pathOptions={{ color: "#1457d9", weight: 3, opacity: 0.8, dashArray: "6 8" }} /> : null}
        {mapPlaces.map((place) => { const point = coordinates(place); if (!point) return null; const color = DAY_COLORS[(place.dayNumber - 1) % DAY_COLORS.length]; const label = mode === "all" ? `${place.dayNumber}·${place.order}` : String(place.order); const Icon = categoryIcons[place.category]; return <Marker key={`${place.id}-${place.order}`} position={point} icon={createNumberIcon(label, selectedPlace?.id === place.id, Boolean(place.optional), color)} eventHandlers={{ click: () => onSelect(place) }} alt={`DAY ${place.dayNumber} ${place.order}번 ${place.name}`}><Tooltip direction="top" offset={[0, -14]} opacity={0.96}><span className="map-tooltip"><Icon size={12} /> {place.name}<small>{categoryLabels[place.category]}</small></span></Tooltip></Marker>; })}
      </MapContainer>}
      {mapUnavailable ? <button type="button" className="map-retry" onClick={() => { setMapError(false); setIsOnline(navigator.onLine); }}><MapIcon size={15} /> 지도 다시 불러오기</button> : null}
    </div>
    <p className="map-caption"><span className="route-dash" /> 선은 실제 도로가 아닌 방문 순서입니다.</p>
  </section>;
}

function AppHeader({ view, menuOpen, setMenuOpen, setView }: { view: View; menuOpen: boolean; setMenuOpen: (open: boolean) => void; setView: (view: View) => void }) {
  const title = view === "schedule" ? trip.title : view === "map" ? "전체 지도" : view === "reservations" ? "예약·운영 확인" : "저장한 장소";
  return <header className="trip-header"><button type="button" className="icon-button header-back" aria-label={view === "schedule" ? "일정 홈" : "일정으로 돌아가기"} onClick={() => setView("schedule")}><ArrowLeft size={22} strokeWidth={1.8} /></button><div className="header-copy"><strong>{title}</strong><span>{tripDateLabel}</span></div><button type="button" className="icon-button header-menu-button" aria-label="빠른 메뉴" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} strokeWidth={1.8} /> : <Menu size={22} strokeWidth={1.8} />}</button>{menuOpen ? <div className="quick-menu" role="menu"><button type="button" role="menuitem" onClick={() => { setView("schedule"); setMenuOpen(false); }}><CalendarDays size={16} /> 오늘 일정</button><button type="button" role="menuitem" onClick={() => { setView("map"); setMenuOpen(false); }}><MapIcon size={16} /> 전체 지도</button><button type="button" role="menuitem" onClick={() => { setView("reservations"); setMenuOpen(false); }}><Bookmark size={16} /> 예약 확인</button></div> : null}</header>;
}

function DayTabs({ days, selectedDay, onChange }: { days: TripDay[]; selectedDay: number; onChange: (day: number) => void }) {
  return <nav className="day-tabs" aria-label="여행 날짜 선택">{days.map((day) => <button key={day.id} type="button" className={selectedDay === day.dayOfMonth ? "is-active" : ""} onClick={() => onChange(day.dayOfMonth)} aria-pressed={selectedDay === day.dayOfMonth}><span>DAY {day.dayNumber}</span><strong>{day.dayOfMonth}일</strong></button>)}</nav>;
}

function ReservationBadge({ status, completed }: { status?: ReservationStatus; completed?: boolean }) {
  if (!status || status === "not_required") return null;
  return <span className={`reservation-badge status-${completed ? "completed" : status}`}>{completed ? reservationLabels.completed : reservationLabels[status]}</span>;
}

function PlaceCard({ place, day, selected, completed, favorite, onSelect, onToggleComplete, onToggleFavorite }: { place: Place; day: TripDay; selected: boolean; completed: boolean; favorite: boolean; onSelect: () => void; onToggleComplete: () => void; onToggleFavorite: () => void }) {
  const Icon = categoryIcons[place.category];
  return <article id={`place-${place.id}`} className={`place-card category-${place.category} ${selected ? "is-selected" : ""} ${completed ? "is-completed" : ""} ${place.optional ? "is-optional" : ""}`}><button type="button" className="place-main" onClick={onSelect} aria-label={`${place.order}번 ${place.name} 상세 보기`}><span className="place-number" style={{ "--number-color": DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length] } as CSSProperties}>{place.order}</span><span className="place-copy"><span className="place-title-row"><strong>{place.name}</strong>{place.optional ? <span className="optional-tag">대체</span> : null}</span><span className="place-meta"><span className={`category-icon category-${place.category}`}><Icon size={14} /></span><span>{categoryLabels[place.category]}</span>{place.plannedTime ? ` · ${place.plannedTime}` : ""}</span>{place.optional && place.nearbyWalk ? <span className="nearby-label"><MapPinned size={13} /> {place.nearbyWalk}</span> : null}{place.hours || place.price || place.admission ? <span className="place-facts">{place.hours ? <span><Clock3 size={12} /> {place.hours}</span> : null}{place.price ? <span><CircleDollarSign size={12} /> {place.price}</span> : null}{place.admission ? <span><Ticket size={12} /> {place.admission}</span> : null}</span> : null}{place.notes ? <span className="place-note">{place.notes}</span> : null}{!coordinates(place) ? <span className="location-warning"><Info size={13} /> 지도 위치 확인 필요</span> : null}<span className="place-actions"><a href={place.googleMapsUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}><MapIcon size={14} /> 지도</a>{place.directionsUrl ? <a href={place.directionsUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}><Navigation size={14} /> 길찾기</a> : null}</span></span></button><div className="place-card-controls"><button type="button" className={`favorite-button ${favorite ? "is-active" : ""}`} onClick={onToggleFavorite} aria-label={favorite ? `${place.name} 즐겨찾기 해제` : `${place.name} 즐겨찾기`} aria-pressed={favorite}><Heart size={17} fill={favorite ? "currentColor" : "none"} /></button><button type="button" className={`complete-button ${completed ? "is-active" : ""}`} onClick={onToggleComplete} aria-label={completed ? `${place.name} 완료 해제` : `${place.name} 방문 완료`} aria-pressed={completed}>{completed ? <Check size={16} /> : <span /> }<span>{completed ? "완료" : "체크"}</span></button></div>{place.reservationStatus && place.reservationStatus !== "not_required" ? <ReservationBadge status={place.reservationStatus} /> : null}</article>;
}

function MenuSection({ items }: { items: MenuItem[] }) {
  return <div className="detail-block menu-section"><div className="detail-label-row"><span className="detail-label">메뉴판</span><small>일본어 원문 · 한국어 번역</small></div><div className="menu-list">{items.map((item) => <div key={`${item.name}-${item.price}`}><span className="menu-copy"><strong lang="ja">{item.nameJa ?? item.name}</strong><small className={item.nameKo ? "menu-translation" : "menu-translation is-missing"}>{item.nameKo ?? "한국어 번역 확인 필요"}</small>{item.note ? <small>{item.note}</small> : null}</span><b>{item.price}</b></div>)}</div></div>;
}

function RouteConnector({ current, next }: { current: Place; next?: Place }) {
  if (!next) return null;
  return <div className="route-connector" aria-label={`${current.name}에서 ${next.name}까지 ${distanceLabel(current, next)}`}><span className="route-line" /><span className="route-distance"><Navigation size={12} /> {distanceLabel(current, next)}</span></div>;
}

function PlaceEditorSheet({ place, open, completed, onClose, onSave }: { place: MapPlace | null; open: boolean; completed: boolean; onClose: () => void; onSave: (draft: PlaceDraft) => void }) {
  const keyboard = useKeyboard();
  const [draft, setDraft] = useState<PlaceDraft>(() => ({ ...placeToDraft(place), markVisited: !place || completed }));

  useEffect(() => {
    if (open) setDraft({ ...placeToDraft(place), markVisited: !place || completed });
  }, [completed, open, place]);

  const updateDraft = <Key extends keyof PlaceDraft>(key: Key, value: PlaceDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return <BottomSheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }} title={place ? "장소 정보 수정" : "실제 장소 추가"} description={place ? "여행 중 바뀐 정보와 방문 기록을 업데이트하세요." : "현재 선택한 날짜에 방문한 장소를 추가하세요."} snap={0.92}><div className="editor-sheet-content"><div className="editor-help"><Info size={15} /><span>Google Maps 링크가 없으면 장소명과 주소로 검색 링크를 자동으로 만들어요. 좌표가 없으면 목록에는 보이고 지도 핀은 생략됩니다.</span></div><div className="editor-grid"><label className="editor-field editor-field-wide"><span>장소명</span><KeyboardInput value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} onBlur={() => keyboard.hide()} placeholder="예: 니시키시장" autoComplete="off" /></label><label className="editor-field"><span>카테고리</span><select value={draft.category} onChange={(event) => updateDraft("category", event.target.value as Category)}><option value="photo">사진 명소</option><option value="restaurant">맛집</option><option value="cafe">카페</option><option value="hotel">숙소</option><option value="station">역</option><option value="airport">공항</option><option value="logistics">짐 보관·이동</option></select></label><label className="editor-field"><span>방문 시간</span><KeyboardInput value={draft.plannedTime} onChange={(event) => updateDraft("plannedTime", event.target.value)} onBlur={() => keyboard.hide()} placeholder="예: 14:30" autoComplete="off" /></label><label className="editor-field editor-field-wide"><span>주소</span><KeyboardInput value={draft.address} onChange={(event) => updateDraft("address", event.target.value)} onBlur={() => keyboard.hide()} placeholder="장소 주소 또는 역 이름" autoComplete="street-address" /></label><label className="editor-field"><span>영업시간</span><KeyboardInput value={draft.hours} onChange={(event) => updateDraft("hours", event.target.value)} onBlur={() => keyboard.hide()} placeholder="예: 10:00–18:00" autoComplete="off" /></label><label className="editor-field"><span>가격·예산</span><KeyboardInput value={draft.price} onChange={(event) => updateDraft("price", event.target.value)} onBlur={() => keyboard.hide()} placeholder="예: 약 ¥1,200" autoComplete="off" /></label><label className="editor-field"><span>입장료</span><KeyboardInput value={draft.admission} onChange={(event) => updateDraft("admission", event.target.value)} onBlur={() => keyboard.hide()} placeholder="예: 무료 / ¥500" autoComplete="off" /></label><label className="editor-field"><span>위도</span><KeyboardInput value={draft.latitude} onChange={(event) => updateDraft("latitude", event.target.value)} onBlur={() => keyboard.hide()} placeholder="예: 35.0116" inputMode="decimal" autoComplete="off" /></label><label className="editor-field"><span>경도</span><KeyboardInput value={draft.longitude} onChange={(event) => updateDraft("longitude", event.target.value)} onBlur={() => keyboard.hide()} placeholder="예: 135.7681" inputMode="decimal" autoComplete="off" /></label><label className="editor-field editor-field-wide"><span>Google Maps 링크</span><KeyboardInput value={draft.googleMapsUrl} onChange={(event) => updateDraft("googleMapsUrl", event.target.value)} onBlur={() => keyboard.hide()} placeholder="https://maps.google.com/..." autoComplete="url" /></label><label className="editor-field editor-field-wide"><span>길찾기 링크 <small>선택</small></span><KeyboardInput value={draft.directionsUrl} onChange={(event) => updateDraft("directionsUrl", event.target.value)} onBlur={() => keyboard.hide()} placeholder="비워두면 장소 링크를 사용" autoComplete="url" /></label><label className="editor-field editor-field-wide"><span>메모</span><KeyboardTextarea value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} onBlur={() => keyboard.hide()} placeholder="실제로 간 시간, 대기, 느낀 점" rows={3} /></label></div><label className="visited-checkbox"><input type="checkbox" checked={draft.markVisited} onChange={(event) => updateDraft("markVisited", event.target.checked)} /><span><Check size={15} /> 실제 방문한 장소로 기록</span></label><div className="editor-actions"><button type="button" className="secondary-link" onClick={onClose}>취소</button><button type="button" className="primary-link" onClick={() => onSave(draft)} disabled={!draft.name.trim()}><Check size={16} /> 저장</button></div></div></BottomSheet>;
}

function LegacyPlaceDetailSheet({ place, day, open, onClose, note, onNoteChange, completed, favorite, onToggleComplete, onToggleFavorite }: { place: Place | null; day: TripDay | undefined; open: boolean; onClose: () => void; note: string; onNoteChange: (note: string) => void; completed: boolean; favorite: boolean; onToggleComplete: () => void; onToggleFavorite: () => void }) {
  const keyboard = useKeyboard();
  if (!place) return null;
  const Icon = categoryIcons[place.category];
  const nearbyAlternatives = day?.places.filter((candidate) => candidate.optional && candidate.category === "restaurant" && candidate.alternativeFor === place.id) ?? [];
  const menuItems = (place.menu ?? []).map((item) => ({ ...item, name: `${item.nameJa ?? item.name}\n${item.nameKo ?? "한국어 번역 확인 필요"}` }));
  return <BottomSheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }} title={place.name} description={`${day ? `DAY ${day.dayNumber} · ${day.dayOfMonth}일` : "전체 일정"} · ${categoryLabels[place.category]}`} snap={0.82}><div className="detail-sheet-content"><button type="button" className="sheet-close" onClick={onClose}><X size={16} /> 닫기</button><div className="detail-topline"><span className={`detail-icon category-${place.category}`}><Icon size={19} /></span><span>{place.plannedTime ?? "시간 미정"}</span><ReservationBadge status={place.reservationStatus} /></div>{place.nameJa ? <p className="detail-ja">{place.nameJa}</p> : null}<div className="detail-facts" aria-label="운영·가격 정보"><div><Clock3 size={15} /><span><small>영업시간</small><strong>{place.hours ?? "방문 전 확인"}</strong></span></div><div><CircleDollarSign size={15} /><span><small>가격대</small><strong>{place.price ?? place.budget ?? "현장 확인"}</strong></span></div><div><Ticket size={15} /><span><small>입장료</small><strong>{place.admission ?? (place.category === "restaurant" || place.category === "cafe" ? "해당 없음" : "현장 확인")}</strong></span></div></div>{place.address ? <div className={`detail-address ${!coordinates(place) ? "is-warning" : ""}`}><MapPinned size={16} /><span>{place.address}</span></div> : null}{!coordinates(place) ? <div className="detail-warning"><CircleHelp size={16} /><span>정확한 핀/좌표가 아직 없어 Google Maps 검색 결과를 확인해야 합니다.</span></div> : null}{place.nearbyWalk ? <div className="nearby-callout"><MapPinned size={16} /><span>{place.nearbyWalk}</span></div> : null}{nearbyAlternatives.length ? <div className="detail-block"><span className="detail-label">근처 대체 식당</span><div className="detail-alternative-list">{nearbyAlternatives.map((candidate) => <button type="button" key={candidate.id} onClick={() => window.open(candidate.googleMapsUrl, "_blank", "noopener,noreferrer")}><span><strong>{candidate.name}</strong><small>{candidate.nearbyWalk ?? "같은 일정의 대체 후보"}</small></span><ChevronRight size={15} /></button>)}</div></div> : null}{menuItems.length ? <div className="detail-block"><span className="detail-label">메뉴판</span><div className="menu-list">{menuItems.map((item) => <div key={`${item.name}-${item.price}`}><span><strong>{item.name}</strong>{item.note ? <small>{item.note}</small> : null}</span><b>{item.price}</b></div>)}</div></div> : null}{place.photoPoint ? <div className="detail-block"><span className="detail-label">촬영 포인트</span><p>{place.photoPoint}</p></div> : null}{place.menuPoint && !menuItems.length ? <div className="detail-block"><span className="detail-label">추천 메뉴</span><p>{place.menuPoint}{place.budget ? ` · ${place.budget}` : ""}</p></div> : null}{place.operatingNote ? <div className="detail-block"><span className="detail-label">운영 메모</span><p>{place.operatingNote}</p></div> : null}{place.notes ? <div className="detail-block"><span className="detail-label">일정 메모</span><p>{place.notes}</p></div> : null}<div className="detail-links"><a className="primary-link" href={place.directionsUrl ?? place.googleMapsUrl} target="_blank" rel="noreferrer"><Navigation size={16} /> Google Maps 길찾기 <ExternalLink size={14} /></a><a className="secondary-link" href={place.googleMapsUrl} target="_blank" rel="noreferrer"><MapIcon size={16} /> 장소 보기 <ExternalLink size={14} /></a>{place.infoSourceUrl ? <a className="info-source-link" href={place.infoSourceUrl} target="_blank" rel="noreferrer"><Info size={16} /> 공식 정보·메뉴 원문 <ExternalLink size={14} /></a> : null}{place.reservationUrl ? <a className="reservation-link" href={place.reservationUrl} target="_blank" rel="noreferrer"><CalendarDays size={16} /> 예약 확인 <ExternalLink size={14} /></a> : null}</div><div className="detail-actions"><button type="button" className={favorite ? "is-active" : ""} onClick={onToggleFavorite}><Heart size={16} fill={favorite ? "currentColor" : "none"} /> {favorite ? "저장됨" : "저장"}</button><button type="button" className={completed ? "is-active" : ""} onClick={onToggleComplete}><Check size={16} /> {completed ? "방문 완료" : "방문 완료 체크"}</button></div><label className="note-field"><span><StickyNote size={15} /> 현지 메모</span><KeyboardTextarea value={note} onChange={(event) => onNoteChange(event.target.value)} onBlur={() => keyboard.hide()} placeholder="기다린 시간, 맛집 대기, 촬영한 컷을 적어두세요" rows={3} /></label></div></BottomSheet>;
}

function EditablePlaceDetailSheet({ place, day, open, onClose, note, onNoteChange, completed, favorite, onToggleComplete, onToggleFavorite, onEdit, onDelete }: { place: Place | null; day: TripDay | undefined; open: boolean; onClose: () => void; note: string; onNoteChange: (note: string) => void; completed: boolean; favorite: boolean; onToggleComplete: () => void; onToggleFavorite: () => void; onEdit: () => void; onDelete: () => void }) {
  const keyboard = useKeyboard();
  if (!place) return null;
  const Icon = categoryIcons[place.category];
  const nearbyAlternatives = day?.places.filter((candidate) => candidate.optional && candidate.category === "restaurant" && candidate.alternativeFor === place.id) ?? [];
  const menuItems = (place.menu ?? []).map((item) => ({ ...item, name: `${item.nameJa ?? item.name}\n${item.nameKo ?? "한국어 번역 확인 필요"}` }));
  return <BottomSheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }} title={place.name} description={`${day ? `DAY ${day.dayNumber} · ${day.dayOfMonth}일` : "전체 일정"} · ${categoryLabels[place.category]}`} snap={0.82}><div className="detail-sheet-content"><button type="button" className="sheet-close" onClick={onClose}><X size={16} /> 닫기</button><div className="detail-topline"><span className={`detail-icon category-${place.category}`}><Icon size={19} /></span><span>{place.plannedTime ?? "시간 미정"}</span><ReservationBadge status={place.reservationStatus} /></div>{place.nameJa ? <p className="detail-ja">{place.nameJa}</p> : null}<div className="detail-facts" aria-label="운영·가격 정보"><div><Clock3 size={15} /><span><small>영업시간</small><strong>{place.hours ?? "방문 전 확인"}</strong></span></div><div><CircleDollarSign size={15} /><span><small>가격대</small><strong>{place.price ?? place.budget ?? "현장 확인"}</strong></span></div><div><Ticket size={15} /><span><small>입장료</small><strong>{place.admission ?? (place.category === "restaurant" || place.category === "cafe" ? "해당 없음" : "현장 확인")}</strong></span></div></div>{place.address ? <div className={`detail-address ${!coordinates(place) ? "is-warning" : ""}`}><MapPinned size={16} /><span>{place.address}</span></div> : null}{!coordinates(place) ? <div className="detail-warning"><CircleHelp size={16} /><span>정확한 핀/좌표가 아직 없어 Google Maps 검색 결과를 확인해야 합니다.</span></div> : null}{place.nearbyWalk ? <div className="nearby-callout"><MapPinned size={16} /><span>{place.nearbyWalk}</span></div> : null}{nearbyAlternatives.length ? <div className="detail-block"><span className="detail-label">근처 대체 식당</span><div className="detail-alternative-list">{nearbyAlternatives.map((candidate) => <button type="button" key={candidate.id} onClick={() => window.open(candidate.googleMapsUrl, "_blank", "noopener,noreferrer")}><span><strong>{candidate.name}</strong><small>{candidate.nearbyWalk ?? "같은 일정의 대체 후보"}</small></span><ChevronRight size={15} /></button>)}</div></div> : null}{menuItems.length ? <div className="detail-block"><span className="detail-label">메뉴판</span><div className="menu-list">{menuItems.map((item) => <div key={`${item.name}-${item.price}`}><span><strong>{item.name}</strong>{item.note ? <small>{item.note}</small> : null}</span><b>{item.price}</b></div>)}</div></div> : null}{place.photoPoint ? <div className="detail-block"><span className="detail-label">촬영 포인트</span><p>{place.photoPoint}</p></div> : null}{place.menuPoint && !menuItems.length ? <div className="detail-block"><span className="detail-label">추천 메뉴</span><p>{place.menuPoint}{place.budget ? ` · ${place.budget}` : ""}</p></div> : null}{place.operatingNote ? <div className="detail-block"><span className="detail-label">운영 메모</span><p>{place.operatingNote}</p></div> : null}{place.notes ? <div className="detail-block"><span className="detail-label">일정 메모</span><p>{place.notes}</p></div> : null}<div className="detail-links"><a className="primary-link" href={place.directionsUrl ?? place.googleMapsUrl} target="_blank" rel="noreferrer"><Navigation size={16} /> Google Maps 길찾기 <ExternalLink size={14} /></a><a className="secondary-link" href={place.googleMapsUrl} target="_blank" rel="noreferrer"><MapIcon size={16} /> 장소 보기 <ExternalLink size={14} /></a>{place.infoSourceUrl ? <a className="info-source-link" href={place.infoSourceUrl} target="_blank" rel="noreferrer"><Info size={16} /> 공식 정보·메뉴 원문 <ExternalLink size={14} /></a> : null}{place.reservationUrl ? <a className="reservation-link" href={place.reservationUrl} target="_blank" rel="noreferrer"><CalendarDays size={16} /> 예약 확인 <ExternalLink size={14} /></a> : null}</div><div className="detail-actions"><button type="button" className={favorite ? "is-active" : ""} onClick={onToggleFavorite}><Heart size={16} fill={favorite ? "currentColor" : "none"} /> {favorite ? "저장됨" : "저장"}</button><button type="button" className={completed ? "is-active" : ""} onClick={onToggleComplete}><Check size={16} /> {completed ? "방문 완료" : "방문 완료 체크"}</button><button type="button" onClick={onEdit}><Pencil size={16} /> 수정</button><button type="button" className="danger-action" onClick={onDelete}><Trash2 size={16} /> 삭제</button></div><label className="note-field"><span><StickyNote size={15} /> 현지 메모</span><KeyboardTextarea value={note} onChange={(event) => onNoteChange(event.target.value)} onBlur={() => keyboard.hide()} placeholder="기다린 시간, 맛집 대기, 촬영한 컷을 적어두세요" rows={3} /></label></div></BottomSheet>;
}

function PlaceDetailSheet({ place, day, open, onClose, note, onNoteChange, completed, favorite, onToggleComplete, onToggleFavorite, onEdit, onDelete }: { place: Place | null; day: TripDay | undefined; open: boolean; onClose: () => void; note: string; onNoteChange: (note: string) => void; completed: boolean; favorite: boolean; onToggleComplete: () => void; onToggleFavorite: () => void; onEdit: () => void; onDelete: () => void }) {
  return <EditablePlaceDetailSheet place={place} day={day} open={open} onClose={onClose} note={note} onNoteChange={onNoteChange} completed={completed} favorite={favorite} onToggleComplete={onToggleComplete} onToggleFavorite={onToggleFavorite} onEdit={onEdit} onDelete={onDelete} />;
}

function ScheduleView({ activeDay, selectedPlace, selectedPlaceId, showAlternatives, setShowAlternatives, actualOnly, onToggleActualOnly, onAddPlace, onSelectPlace, onToggleComplete, onToggleFavorite, completedIds, favoriteIds, userLocation, onUserLocation, onDayChange }: { activeDay: TripDay; selectedPlace: Place | null; selectedPlaceId: string | null; showAlternatives: boolean; setShowAlternatives: (show: boolean) => void; actualOnly: boolean; onToggleActualOnly: () => void; onAddPlace: () => void; onSelectPlace: (place: MapPlace) => void; onToggleComplete: (id: string) => void; onToggleFavorite: (id: string) => void; completedIds: string[]; favoriteIds: string[]; userLocation: Coordinate | null; onUserLocation: (location: Coordinate) => void; onDayChange: (day: number) => void }) {
  const primaryPlaces = activeDay.places.filter((place) => !place.optional);
  const restaurantAlternatives = activeDay.places.filter((place) => place.optional && place.category === "restaurant");
  const otherAlternatives = activeDay.places.filter((place) => place.optional && place.category !== "restaurant");
  const withDay = (place: Place): MapPlace => ({ ...place, dayNumber: activeDay.dayNumber, dayOfMonth: activeDay.dayOfMonth, dayTitle: activeDay.title });
  const visitedCount = activeDay.places.filter((place) => completedIds.includes(place.id)).length;
  const renderCard = (place: Place) => <PlaceCard place={place} day={activeDay} selected={selectedPlaceId === place.id} completed={completedIds.includes(place.id)} favorite={favoriteIds.includes(place.id)} onSelect={() => onSelectPlace(withDay(place))} onToggleComplete={() => onToggleComplete(place.id)} onToggleFavorite={() => onToggleFavorite(place.id)} />;
  return <main className="schedule-view"><section className="day-intro"><div className="day-intro-copy"><span className="eyebrow">DAY {activeDay.dayNumber} · {activeDay.dayOfMonth}일</span><h1>{activeDay.title}</h1><p>{activeDay.city}</p></div><div className="day-intro-tools"><button type="button" className={`record-view-button ${actualOnly ? "is-active" : ""}`} aria-pressed={actualOnly} onClick={onToggleActualOnly}><Check size={14} /> {actualOnly ? "전체 일정" : `실제 방문 ${visitedCount}곳`}</button><button type="button" className="record-add-button" onClick={onAddPlace}><Plus size={15} /> 장소 추가</button><label className="alternative-toggle"><input type="checkbox" checked={showAlternatives} onChange={(event) => setShowAlternatives(event.target.checked)} /><span className="toggle-track" /><span>대체 후보</span></label></div></section><TripMap places={primaryPlaces.map(withDay)} routePlaces={primaryPlaces.map(withDay)} selectedPlace={selectedPlace} onSelect={onSelectPlace} userLocation={userLocation} onUserLocation={onUserLocation} /><DayTabs days={trip.days} selectedDay={activeDay.dayOfMonth} onChange={onDayChange} /><section className="itinerary-section" aria-label={`${activeDay.dayOfMonth}일 일정 목록`}><div className="section-heading"><div><span className="eyebrow">{primaryPlaces.length} STOPS</span><h2>{actualOnly ? "실제 방문 기록" : "오늘의 동선"}</h2></div><span className="section-hint">체크=실제 방문</span></div><div className="itinerary-list">{primaryPlaces.map((place, index) => <div key={`${place.id}-item`}>{renderCard(place)}<RouteConnector current={place} next={primaryPlaces[index + 1]} /></div>)}</div></section>{showAlternatives && restaurantAlternatives.length ? <section className="alternatives-section" aria-label="근처 대체 식당"><div className="section-heading"><div><span className="eyebrow">NEARBY RESTAURANTS</span><h2>근처 대체 식당</h2></div><span className="section-hint">기본 동선은 유지</span></div><p className="section-description">예약이 어렵거나 대기가 길 때, 해당 식당 주변에서 바로 바꿔 갈 수 있는 후보입니다.</p><div className="itinerary-list">{restaurantAlternatives.map((place) => <div key={`${place.id}-alternative`}>{renderCard(place)}</div>)}</div></section> : null}{showAlternatives && otherAlternatives.length ? <section className="alternatives-section other-alternatives" aria-label="대체 코스"><div className="section-heading"><div><span className="eyebrow">OPTIONAL ROUTES</span><h2>대체 촬영 코스</h2></div></div><p className="section-description">시간과 운영일을 확인한 뒤 기본 동선 대신 선택하세요.</p><div className="itinerary-list">{otherAlternatives.map((place) => <div key={`${place.id}-alternative`}>{renderCard(place)}</div>)}</div></section> : null}</main>;
}

function AllMapView({ allPlaces, selectedPlace, onSelectPlace, onUserLocation, userLocation }: { allPlaces: MapPlace[]; selectedPlace: Place | null; onSelectPlace: (place: MapPlace) => void; onUserLocation: (location: Coordinate) => void; userLocation: Coordinate | null }) {
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const filtered = allPlaces.filter((place) => (dayFilter === "all" || place.dayOfMonth === dayFilter) && (categoryFilter === "all" || place.category === categoryFilter));
  const routePlaces = dayFilter === "all" ? allPlaces.filter((place) => !place.optional) : filtered.filter((place) => !place.optional);
  const categoryOptions: Array<{ key: CategoryFilter; label: string }> = [{ key: "all", label: "전체" }, { key: "photo", label: "사진" }, { key: "restaurant", label: "맛집" }, { key: "cafe", label: "카페" }, { key: "hotel", label: "숙소" }];
  return <main className="all-map-view"><section className="view-heading"><span className="eyebrow">ALL DAYS</span><h1>전체 지도</h1><p>날짜와 장소 종류로 경로를 가볍게 좁혀볼 수 있어요.</p></section><div className="filter-group"><span className="filter-label">날짜</span><div className="filter-row">{[{ key: "all", label: "전체" }, ...trip.days.map((day) => ({ key: day.dayOfMonth, label: String(day.dayOfMonth) }))].map((filter) => <button type="button" key={String(filter.key)} className={dayFilter === filter.key ? "is-active" : ""} onClick={() => setDayFilter(filter.key as DayFilter)}>{filter.label}</button>)}</div></div><div className="filter-group"><span className="filter-label">장소</span><div className="filter-row">{categoryOptions.map((filter) => <button type="button" key={filter.key} className={categoryFilter === filter.key ? "is-active" : ""} onClick={() => setCategoryFilter(filter.key)}>{filter.label}</button>)}</div></div><TripMap mode="all" places={filtered} routePlaces={routePlaces} selectedPlace={selectedPlace} onSelect={onSelectPlace} userLocation={userLocation} onUserLocation={onUserLocation} /><section className="all-map-list"><div className="section-heading"><div><span className="eyebrow">{filtered.length} PLACES</span><h2>필터 결과</h2></div></div>{filtered.filter((place) => !place.optional).slice(0, 12).map((place) => <button type="button" key={place.id} onClick={() => onSelectPlace(place)} className={selectedPlace?.id === place.id ? "is-selected" : ""}><span className="all-map-number" style={{ "--number-color": DAY_COLORS[(place.dayNumber - 1) % DAY_COLORS.length] } as CSSProperties}>{place.order}</span><span><strong>{place.name}</strong><small>DAY {place.dayNumber} · {categoryLabels[place.category]}</small></span><ChevronRight size={16} /></button>)}</section></main>;
}

function ReservationsView({ places, reservationDoneIds, onToggleReservation, onSelectPlace }: { places: MapPlace[]; reservationDoneIds: string[]; onToggleReservation: (id: string) => void; onSelectPlace: (place: MapPlace) => void }) {
  const reservationPlaces = places.filter((place) => place.reservationStatus && place.reservationStatus !== "not_required");
  const pendingCount = reservationPlaces.filter((place) => !reservationDoneIds.includes(place.id)).length;
  return <main className="simple-view reservations-view"><section className="view-heading"><span className="eyebrow">RESERVATIONS</span><h1>예약·운영 확인</h1><p>Notion 원본은 바꾸지 않고, 이 기기에서만 체크해요.</p></section><div className="reservation-summary"><span><Bookmark size={18} /> 확인할 항목</span><strong>{pendingCount}개 남음</strong></div><section className="reservation-list">{reservationPlaces.map((place) => { const done = reservationDoneIds.includes(place.id); return <div className={`reservation-row ${done ? "is-done" : ""}`} key={place.id}><button type="button" className={`reservation-check ${done ? "is-active" : ""}`} onClick={() => onToggleReservation(place.id)} aria-label={`${place.name} ${done ? "예약 완료 해제" : "예약 완료 처리"}`}>{done ? <Check size={15} /> : null}</button><button type="button" className="reservation-copy" onClick={() => onSelectPlace(place)}><span><strong>{place.name}</strong><small>DAY {place.dayNumber} · {place.plannedTime ?? "시간 미정"}</small></span><ReservationBadge status={place.reservationStatus} completed={done} /></button><ChevronRight size={16} className="row-chevron" /></div>; })}</section></main>;
}

function SavedView({ places, favoriteIds, notes, onSelectPlace }: { places: MapPlace[]; favoriteIds: string[]; notes: Record<string, string>; onSelectPlace: (place: MapPlace) => void }) {
  const savedPlaces = places.filter((place) => favoriteIds.includes(place.id));
  const notedPlaces = places.filter((place) => notes[place.id]?.trim());
  return <main className="simple-view saved-view"><section className="view-heading"><span className="eyebrow">SAVED</span><h1>저장한 장소</h1><p>즐겨찾기와 현지에서 적어둔 메모를 모아봤어요.</p></section><section className="saved-section"><div className="section-heading"><div><span className="eyebrow">FAVORITES</span><h2>즐겨찾기</h2></div><span className="count-chip">{savedPlaces.length}</span></div>{savedPlaces.length ? <div className="saved-list">{savedPlaces.map((place) => <button type="button" key={place.id} onClick={() => onSelectPlace(place)}><Heart size={16} fill="currentColor" /><span><strong>{place.name}</strong><small>DAY {place.dayNumber} · {categoryLabels[place.category]}</small></span><ChevronRight size={16} /></button>)}</div> : <div className="empty-card"><Heart size={22} /><strong>아직 저장한 장소가 없어요</strong><span>일정 카드의 하트 버튼으로 모아둘 수 있어요.</span></div>}</section><section className="saved-section"><div className="section-heading"><div><span className="eyebrow">FIELD NOTES</span><h2>현지 메모</h2></div><span className="count-chip">{notedPlaces.length}</span></div>{notedPlaces.length ? <div className="saved-list">{notedPlaces.map((place) => <button type="button" key={place.id} onClick={() => onSelectPlace(place)}><StickyNote size={16} /><span><strong>{place.name}</strong><small>{notes[place.id]}</small></span><ChevronRight size={16} /></button>)}</div> : <div className="empty-card"><StickyNote size={22} /><strong>메모가 비어 있어요</strong><span>장소 상세에서 현지 메모를 남겨보세요.</span></div>}</section></main>;
}

function BottomNav({ view, setView }: { view: View; setView: (view: View) => void }) {
  const items: Array<{ key: View; label: string; icon: typeof CalendarDays }> = [{ key: "schedule", label: "일정", icon: CalendarDays }, { key: "map", label: "지도", icon: MapIcon }, { key: "reservations", label: "예약", icon: Bookmark }, { key: "saved", label: "저장", icon: Heart }];
  return <nav className="trip-bottom-nav" aria-label="주요 메뉴">{items.map(({ key, label, icon: Icon }) => <button type="button" key={key} className={view === key ? "is-active" : ""} onClick={() => setView(key)} aria-current={view === key ? "page" : undefined}><Icon size={20} fill={key === "saved" && view === key ? "currentColor" : "none"} /><span>{label}</span></button>)}</nav>;
}

export default function Prototype() {
  const persisted = useMemo(() => readLocalState(), []);
  const [view, setView] = useState<View>("schedule");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => initialDayOfMonth());
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>(persisted?.completedPlaceIds ?? []);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(persisted?.favoritePlaceIds ?? []);
  const [notes, setNotes] = useState<Record<string, string>>(persisted?.notes ?? {});
  const [reservationDoneIds, setReservationDoneIds] = useState<string[]>(persisted?.reservationDoneIds ?? []);
  const [placeEdits, setPlaceEdits] = useState<Record<string, Partial<Place>>>(persisted?.placeEdits ?? {});
  const [hiddenPlaceIds, setHiddenPlaceIds] = useState<string[]>(persisted?.hiddenPlaceIds ?? []);
  const [addedPlaces, setAddedPlaces] = useState<MapPlace[]>(persisted?.addedPlaces ?? []);
  const [actualOnly, setActualOnly] = useState(Boolean(persisted?.actualOnly));
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorPlace, setEditorPlace] = useState<MapPlace | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const editedDays = useMemo(() => trip.days.map((day) => {
    const originalPlaces = day.places.filter((place) => !hiddenPlaceIds.includes(place.id)).map((place) => ({ ...place, ...(placeEdits[place.id] ?? {}) }));
    const manualPlaces = addedPlaces.filter((place) => place.dayNumber === day.dayNumber).map(({ dayNumber: _dayNumber, dayOfMonth: _dayOfMonth, dayTitle: _dayTitle, ...place }) => place);
    return { ...day, places: [...originalPlaces, ...manualPlaces] };
  }), [addedPlaces, hiddenPlaceIds, placeEdits]);
  const visibleDays = useMemo(() => editedDays.map((day) => ({ ...day, places: actualOnly ? day.places.filter((place) => completedIds.includes(place.id)) : day.places })), [actualOnly, completedIds, editedDays]);
  const activeDay = visibleDays.find((day) => day.dayOfMonth === selectedDay) ?? visibleDays[0] ?? trip.days[0];
  const allPlaces = useMemo(() => visibleDays.flatMap((day) => day.places.map((place) => ({ ...place, dayNumber: day.dayNumber, dayOfMonth: day.dayOfMonth, dayTitle: day.title }))), [visibleDays]);
  const selectedPlace = allPlaces.find((place) => place.id === selectedPlaceId) ?? null;
  const selectedPlaceDay = selectedPlace ? visibleDays.find((day) => day.dayNumber === selectedPlace.dayNumber) : activeDay;

  useEffect(() => { window.localStorage.setItem(tripStorageKey, JSON.stringify({ selectedDay, completedPlaceIds: completedIds, favoritePlaceIds: favoriteIds, notes, reservationDoneIds, placeEdits, hiddenPlaceIds, addedPlaces, actualOnly } satisfies LocalTripState)); }, [selectedDay, completedIds, favoriteIds, notes, reservationDoneIds, placeEdits, hiddenPlaceIds, addedPlaces, actualOnly]);
  useEffect(() => { const query = new URLSearchParams(window.location.search); query.set("day", String(selectedDay)); window.history.replaceState({}, "", `${window.location.pathname}?${query.toString()}`); }, [selectedDay]);
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined); }, []);

  const selectDay = (dayOfMonth: number) => { const nextDay = visibleDays.find((day) => day.dayOfMonth === dayOfMonth); if (!nextDay) return; setSelectedDay(dayOfMonth); setSelectedPlaceId(nextDay.places[0]?.id ?? null); setView("schedule"); setSheetOpen(false); };
  const selectPlace = (place: MapPlace) => { setSelectedDay(place.dayOfMonth); setSelectedPlaceId(place.id); setSheetOpen(true); window.setTimeout(() => document.getElementById(`place-${place.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50); };
  const toggleId = (setIds: Dispatch<SetStateAction<string[]>>, id: string) => { setIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); };
  const openEditor = (place: MapPlace | null = null) => { setSheetOpen(false); window.setTimeout(() => { setEditorPlace(place); setEditorOpen(true); }, 180); };
  const savePlaceDraft = (draft: PlaceDraft) => {
    const existing = editorPlace;
    const id = existing?.id ?? `manual-${Date.now()}`;
    const sourceDay = editedDays.find((day) => day.dayNumber === (existing?.dayNumber ?? activeDay.dayNumber));
    const order = existing?.order ?? (sourceDay?.places.length ?? activeDay.places.length) + 1;
    const nextPlace = draftToPlace(draft, id, order);
    if (existing && addedPlaces.some((place) => place.id === existing.id)) {
      setAddedPlaces((current) => current.map((place) => place.id === existing.id ? { ...nextPlace, dayNumber: place.dayNumber, dayOfMonth: place.dayOfMonth, dayTitle: place.dayTitle } : place));
    } else if (existing) {
      setPlaceEdits((current) => ({ ...current, [existing.id]: nextPlace }));
    } else {
      setAddedPlaces((current) => [...current, { ...nextPlace, dayNumber: activeDay.dayNumber, dayOfMonth: activeDay.dayOfMonth, dayTitle: activeDay.title }]);
    }
    setCompletedIds((current) => draft.markVisited ? (current.includes(id) ? current : [...current, id]) : current.filter((item) => item !== id));
    setEditorOpen(false);
    setEditorPlace(null);
  };
  const deleteSelectedPlace = () => {
    if (!selectedPlace || !window.confirm(`${selectedPlace.name}을(를) 이 기기에서 숨길까요? 원본 일정은 바뀌지 않습니다.`)) return;
    if (addedPlaces.some((place) => place.id === selectedPlace.id)) setAddedPlaces((current) => current.filter((place) => place.id !== selectedPlace.id));
    else setHiddenPlaceIds((current) => current.includes(selectedPlace.id) ? current : [...current, selectedPlace.id]);
    setCompletedIds((current) => current.filter((id) => id !== selectedPlace.id));
    setFavoriteIds((current) => current.filter((id) => id !== selectedPlace.id));
    setReservationDoneIds((current) => current.filter((id) => id !== selectedPlace.id));
    setNotes((current) => { const next = { ...current }; delete next[selectedPlace.id]; return next; });
    setSelectedPlaceId(null);
    setSheetOpen(false);
  };
  const appContent: ReactNode = view === "schedule" ? <ScheduleView activeDay={activeDay} selectedPlace={selectedPlace} selectedPlaceId={selectedPlaceId} showAlternatives={showAlternatives} setShowAlternatives={setShowAlternatives} actualOnly={actualOnly} onToggleActualOnly={() => { setActualOnly((current) => !current); setSheetOpen(false); }} onAddPlace={() => openEditor()} onSelectPlace={selectPlace} onToggleComplete={(id) => toggleId(setCompletedIds, id)} onToggleFavorite={(id) => toggleId(setFavoriteIds, id)} completedIds={completedIds} favoriteIds={favoriteIds} userLocation={userLocation} onUserLocation={setUserLocation} onDayChange={selectDay} /> : view === "map" ? <AllMapView allPlaces={allPlaces} selectedPlace={selectedPlace} onSelectPlace={selectPlace} onUserLocation={setUserLocation} userLocation={userLocation} /> : view === "reservations" ? <ReservationsView places={allPlaces} reservationDoneIds={reservationDoneIds} onToggleReservation={(id) => toggleId(setReservationDoneIds, id)} onSelectPlace={selectPlace} /> : <SavedView places={allPlaces} favoriteIds={favoriteIds} notes={notes} onSelectPlace={selectPlace} />;

  return <div className="trip-app"><MobileScroll className="trip-scroll"><div className="trip-scroll-content"><AppHeader view={view} menuOpen={menuOpen} setMenuOpen={setMenuOpen} setView={setView} />{appContent}</div></MobileScroll><BottomNav view={view} setView={(nextView) => { setView(nextView); setMenuOpen(false); }} /><PlaceDetailSheet place={selectedPlace} day={selectedPlaceDay} open={sheetOpen} onClose={() => setSheetOpen(false)} note={selectedPlace ? notes[selectedPlace.id] ?? "" : ""} onNoteChange={(note) => { if (selectedPlace) setNotes((current) => ({ ...current, [selectedPlace.id]: note })); }} completed={selectedPlace ? completedIds.includes(selectedPlace.id) : false} favorite={selectedPlace ? favoriteIds.includes(selectedPlace.id) : false} onToggleComplete={() => { if (selectedPlace) toggleId(setCompletedIds, selectedPlace.id); }} onToggleFavorite={() => { if (selectedPlace) toggleId(setFavoriteIds, selectedPlace.id); }} onEdit={() => { if (selectedPlace) openEditor(selectedPlace); }} onDelete={deleteSelectedPlace} /><PlaceEditorSheet place={editorPlace} open={editorOpen} completed={editorPlace ? completedIds.includes(editorPlace.id) : false} onClose={() => { setEditorOpen(false); setEditorPlace(null); }} onSave={savePlaceDraft} /></div>;
}
