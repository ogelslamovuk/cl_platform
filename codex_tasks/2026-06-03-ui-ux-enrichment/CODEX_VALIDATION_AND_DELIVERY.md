# CODEX_VALIDATION_AND_DELIVERY.md

# Validation and delivery protocol

## 1. Build

Обязательно выполнить:

```bash
npm run build
```

Финальный результат не сдавать без `npm run build: passed`.

## 2. Local smoke-check

После build выполнить smoke-check по маршрутам:

- `/#/main`
- `/#/demo`
- `/#/organizer`
- `/#/admin`
- `/#/channel`

Для каждого маршрута результат фиксировать строго:

- `passed`
- `failed`

Не использовать формулировки:

- `частично ок`;
- `вроде работает`;
- `визуально должно быть нормально`.

## 3. Required smoke points

### Organizer

Проверить:

- dashboard KPI кликабельны;
- заявка открывается;
- карточка текущего мероприятия отображается;
- этап 2 показывает участников и mock-документы;
- preview документа открывается;
- этап 4 показывает договор;
- кнопка `Подать на рассмотрение` только на этапе 9;
- этап 8 показывает BYN крупно;
- этап 9 плитки кликабельны.

### Admin

Проверить:

- dashboard KPI кликабельны;
- колокольчик открывает уведомления;
- tooltip не обрезается;
- меню содержит `Заявки операторов`;
- `Заявки мероприятий` отображается вместо длинного старого названия;
- заявки организаторов фильтруются;
- заявки мероприятий показывают документы;
- реестр мероприятий имеет географию;
- региональный режим фильтрует Могилёвскую область;
- контроль не содержит запрещённых demo-кейсов;
- журнал решений фильтруется.

### SeatMap / venues

Проверить:

- в реестре площадок нет кнопки `Заполнить mock-данными`;
- 6 шаблонов seatmap доступны;
- open-air отсутствует среди seatmap-шаблонов;
- применение шаблона меняет схему;
- крупное capacity-only событие не открывает схему.

### B2C demo

Проверить:

- постеры вертикальные;
- сетка не ломается на desktop;
- постеры разные;
- на постерах нет `Центр управления · Demo`;
- seatmap-событие ведёт к выбору места;
- capacity-only событие покупается без выбора места.

### Channel

Проверить:

- route открывается;
- существующий channel/seller flow не сломан;
- билеты / события после изменений отображаются без raw technical labels.

## 4. Git delivery

После успешного build и smoke-check:

1. Проверить `git status`.
2. Убедиться, что изменены только файлы по задаче.
3. Сделать commit с понятным сообщением.
4. Push branch в GitHub.
5. Создать PR в `main` или использовать стандартный GitHub-flow проекта.
6. Дождаться checks.
7. Merge в `main`.
8. Дождаться GitHub Pages deploy.
9. Проверить live routes.

## 5. Live routes

Проверить:

- `https://ogelslamovuk.github.io/cl_platform/#/main`
- `https://ogelslamovuk.github.io/cl_platform/#/demo`
- `https://ogelslamovuk.github.io/cl_platform/#/organizer`
- `https://ogelslamovuk.github.io/cl_platform/#/admin`
- `https://ogelslamovuk.github.io/cl_platform/#/channel`

## 6. Final report format

Финальный отчёт на русском.

Обязательно указать:

- branch;
- commit SHA;
- PR link;
- merge status;
- GitHub Pages deploy status;
- live URLs;
- список изменённых файлов;
- `npm run build: passed`;
- local smoke-check по маршрутам;
- live smoke-check по маршрутам;
- кратко по фазам: done / not done.

Нельзя сдавать результат со статусом `готово`, пока live routes не проверены.

## 7. Hard blocker protocol

При hard blocker остановиться и вернуть:

- точный шаг;
- точную команду;
- точный вывод ошибки;
- какие файлы уже изменены;
- что нужно сделать для продолжения.

Нельзя маскировать blocker как готовность.
