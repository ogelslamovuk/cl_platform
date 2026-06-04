# CODEX_DATA_RULES

## 1. Events

Допустимые типы:

### Seatmap event

- venue has seatmap;
- event capacity <= 500;
- B2C button: `Выбрать место`;
- admin event action can open scheme;
- tickets are seat-based.

### Capacity-only / open-air event

- venue has no seatmap;
- event capacity <= 1500;
- B2C button: `Купить`;
- admin does not open scheme;
- registry shows `без схемы`;
- tickets are general admission / capacity-based.

## 2. Prohibited event data

Запрещены:

- events with 3000+ capacity;
- seatmap events above 500 seats;
- open-air events that open seatmap;
- venue without scheme but event opens scheme;
- random huge остаток мест;
- inconsistent poster per event.

## 3. Regions

Обязательные demo regions:

- Минск;
- Могилёвская область;
- Гродненская область.

Обязательные personas:

- Республиканский уровень;
- Могилёвская область;
- Гродненская область.

## 4. Posters

Poster должен быть event-level attribute/descriptor.

Один event = один poster во всех UI.

Не должно быть так:

- в B2C новый вертикальный poster;
- в organizer application старый горизонтальный poster;
- в admin другая картинка.

## 5. Documents

Mock documents are visual UI components.

They must look like documents, not plain text popups.

All document data fictional.

## 6. Resellers

Replace all:

- `kvitki.by`
- `Kvitki`
- `Квитки`
- `квитки`

with:

- `bezkassira`
- `bezkassira.by`
- `Безкассира`

Use consistent display:

- technical/domain: `bezkassira.by`;
- Russian display label: `Безкассира`.

## 7. Control

Do not invent new Control data in this task.
