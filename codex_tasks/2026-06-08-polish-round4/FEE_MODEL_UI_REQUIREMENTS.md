# FEE_MODEL_UI_REQUIREMENTS — порядок начисления платежей и расчёт пошлины для polish round 4

## Purpose

Strengthen Step 8 `Пошлинные платежи` in the event application so it no longer shows an unexplained total like `Начислено 420 BYN · 10 базовых величин`.

The UI must explain the calculation briefly and clearly:

- why the amount was charged;
- which event parameters were used;
- which tariff/rate was applied;
- what formula was applied;
- what the organizer/admin should do next.

This is a demo-first UI enrichment. Do not implement a real payment gateway, real legal calculation engine, real tax/accounting logic, or backend.

---

## Product decision

Add a selector to the financial settings area on `/proto`.

User-facing selector label:

```text
Порядок начисления платежей
```

Use exactly these two user-facing options:

1. `По действующим правилам`
2. `Расширенный расчёт`

Default option: `По действующим правилам`.

Do not use these user-facing labels:

- `Регламентная модель`;
- `Детализированная модель`;
- `по максимуму`;
- `как в Дубае`;
- `Dubai`;
- `DTCM`;
- `ePermit`;
- `NEN`;
- `арабская модель`.

Recommended UI microcopy on `/proto`:

```text
Порядок начисления платежей
Выберите, как прототип рассчитывает начисления в заявках на мероприятия.
```

For `По действующим правилам`:

```text
Расчёт по проектной вместимости площадки или планируемому количеству входных билетов.
```

For `Расширенный расчёт`:

```text
Демо-сценарий с дополнительными начислениями по параметрам мероприятия, площадки, документов и билетной модели.
```

Small note under selector:

```text
Настройка влияет только на демонстрационные начисления в прототипе и не подключает реальные платежи.
```

---

## Where to show selector and tariff tables

On `/proto`, in the existing financial settings area near current `процент платформы / Минкульт` settings, add a compact selector:

- radio group, segmented control, or two-button toggle;
- persist in existing demo settings/localStorage only if current architecture already stores financial settings;
- default must be `По действующим правилам`;
- changing the selector must update demo fee display in event application Step 8.

Below the selector, show a compact tariff/pricing visualization for the selected option.

For `По действующим правилам`, show the current BV scale table.

Suggested title:

```text
Шкала госпошлины
```

For `Расширенный расчёт`, show a demo tariff table.

Suggested title:

```text
Демо-тарифы расширенного расчёта
```

The tariff tables are shown on `/proto` only. In organizer/admin working screens, do not highlight the selected option name as a product concept; show only the calculated amount, basis and breakdown.

Do not change demo auth/login.
Do not create a new settings page.
Do not create a backend setting.

---

## Step 8 UI target: `Пошлинные платежи`

In event application Step 8, replace the unexplained fee summary with a structured, compact block.

Do not display `По действующим правилам` / `Расширенный расчёт` as a prominent field in Step 8. Those names belong to `/proto` settings. In Step 8, show the result and the calculation basis.

Recommended compact layout:

### Summary card

Fields:

- `Статус`: `Ожидает оплаты` / `Оплачено` / `Не требуется`
- `Начислено`: total BYN
- `Основание`: short basis line
- `Ставка`: rate in BV where applicable
- `Расчёт`: short formula
- `Следующее действие`: short instruction

### Calculation summary

Show 3–5 key parameters:

- `Площадка`
- `Формат`: `зрительный зал` / `open-air` / `без закреплённых мест`
- `Проектная вместимость` or `Планируемое количество билетов`
- `Категория мероприятия`
- `Статус оплаты`

### Explain action

Add visible action:

```text
Показать расчёт
```

It may open a modal, drawer, expandable panel, or popover. Choose the safest pattern already used in the project.

---

## Current-rules calculation breakdown

For `По действующим правилам`, use the current BV capacity/tickets scale.

Use this table on `/proto`:

| Вместимость / билеты | Ставка |
|---|---:|
| 1–150 | 3 БВ |
| 151–300 | 10 БВ |
| 301–500 | 30 БВ |
| 501–1000 | 50 БВ |
| 1001–1500 | 80 БВ |
| 1501–2000 | 100 БВ |
| 2001–3000 | 150 БВ |
| свыше 3000 | 200 БВ |
| нет проектной вместимости, но реализуются билеты | 3 БВ |

For the current example `420 BYN · 10 базовых величин`, Step 8 must be brief, not verbose.

Recommended Step 8 display:

```text
Начислено: 420 BYN

Основание: проектная вместимость 200 мест
Диапазон: 151–300 мест
Ставка: 10 БВ
Расчёт: 10 × 42 BYN
```

The detailed popup/drawer may add only one extra line if needed:

```text
Итого: 10 × 42 BYN = 420 BYN
```

Avoid long explanatory text like “почему начислено” with numbered paragraphs. This UI is for users who work with the process regularly.

Optional short source-like label:

```text
Основание начисления: выдача удостоверения на право проведения мероприятия.
```

Do not cite laws with external links unless the project already has a pattern for legal source links.

---

## Exemption / no-fee display

If demo data indicates that the event is exempt or free under current mock assumptions, show:

```text
Госпошлина не требуется
```

And short explanation:

```text
Основание: мероприятие с участием только белорусских исполнителей / государственная организация культуры.
```

Do not build a complex exemption law engine. It is enough to show a clear mock reason from demo data.

---

## Expanded calculation breakdown

For `Расширенный расчёт`, show that this is a demo scenario with expanded fee structure.

Use line items such as:

1. `Базовое рассмотрение заявки`
2. `Проверка площадки и вместимости`
3. `Проверка схемы зала / билетной модели`
4. `Проверка состава исполнителей`
5. `Проверка материалов и документов`
6. `Контроль билетных каналов`
7. `Постсобытийная сверка продаж`

Each line item should show:

- parameter;
- rate;
- quantity;
- subtotal.

Recommended Step 8 summary for expanded calculation:

```text
Начислено: 672 BYN

Базовое начисление: 420 BYN
Дополнительные начисления: 252 BYN
```

Recommended popup/drawer breakdown:

```text
Вместимость 200 мест — 420 BYN
Нестандартная площадка — +126 BYN
Иностранные исполнители — +84 BYN
Дополнительный билетный оператор — +42 BYN

Итого: 672 BYN
```

Important wording:

- Call it `расширенный расчёт` only where needed.
- In working screens, avoid presenting it as a separate product model.
- Do not present it as current Belarusian law.
- Do not mention Dubai/DTCM in UI.

---

## `/proto` demo tariff table for expanded calculation

On `/proto`, when `Расширенный расчёт` is selected, show a compact table of demo surcharges / coefficients.

Suggested table:

| Параметр | Условие | Начисление |
|---|---|---:|
| Вместимость | по шкале госпошлины | по действующей шкале |
| Площадка | open-air / нестандартная площадка | +30% к базовому начислению |
| Исполнители | иностранные исполнители | +2 БВ |
| Состав участников | более 20 участников | +1 БВ за каждые 10 участников |
| Билетные операторы | больше одного оператора | +1 БВ за оператора |
| Схема зала | reserved seating / сложная схема | +2 БВ |
| Постсобытийная сверка | включена | +1 БВ |

Suggested note:

```text
Расширенный расчёт — демонстрационный сценарий для показа более сложной структуры начислений. Он не является действующим правилом расчёта госпошлины.
```

---

## Settings and data requirements

Use existing financial settings if possible.

Allowed demo settings:

- `baseUnitAmountBYN`: default `42`
- internal `feeMode`: `currentRules` / `expandedCalculation` or equivalent
- existing platform/ministry percentage settings must remain untouched unless needed only for display compatibility.

If these fields do not exist, add them minimally to existing demo settings/state.

Do not create a new global settings architecture.

---

## Acceptance for this fee calculation change

- [ ] `/proto` has selector `Порядок начисления платежей` with options `По действующим правилам` and `Расширенный расчёт`.
- [ ] Default option is `По действующим правилам`.
- [ ] Existing financial settings remain visible and not worse.
- [ ] `/proto` shows the current BV scale table when `По действующим правилам` is selected.
- [ ] `/proto` shows demo surcharge/coefficient table when `Расширенный расчёт` is selected.
- [ ] Event application Step 8 shows a structured `Пошлинные платежи` block.
- [ ] Step 8 does not prominently display the selected option name; it shows result, basis and calculation.
- [ ] The amount `420 BYN · 10 базовых величин` is explained compactly with formula `10 × 42 BYN = 420 BYN` where that case applies.
- [ ] There is a `Показать расчёт` action with detailed breakdown.
- [ ] Expanded calculation shows a multi-line demo breakdown by event parameters.
- [ ] Expanded calculation is clearly framed as demo-only in `/proto`.
- [ ] No real payment gateway is implemented.
- [ ] No Dubai/DTCM terms appear in visible UI.
- [ ] All new visible text is Russian.
- [ ] `npm run build` passes.
- [ ] Live smoke-check includes `/proto` and the event application route containing Step 8.
