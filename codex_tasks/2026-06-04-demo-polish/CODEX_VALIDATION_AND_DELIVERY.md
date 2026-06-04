# CODEX_VALIDATION_AND_DELIVERY

## 1. Build

Run:

```bash
npm run build
```

Build must pass.

## 2. Required static checks

Run/verify:

```bash
git diff --name-only
```

Check changed files are only relevant to this task.

Search checks:

```bash
grep -R "kvitki" -n src || true
grep -R "Квитки" -n src || true
grep -R "Центр управления · Demo" -n src || true
grep -R "Покупки 2 билета" -n src || true
grep -R "Этап помогает сохранить черновик" -n src || true
```

Expected: no matches.

Also check no generated temporary scripts remain.

## 3. Local smoke routes

Check locally:

- `/main`
- `/demo`
- `/organizer`
- `/admin`
- `/channel`
- `/proto`

Required local smoke:

1. `/main` renders.
2. `/proto` renders, 4 quick login buttons open new tabs.
3. `/organizer` renders.
4. Organizer compliance stages render; stage tooltips are meaningful.
5. Document previews open and close by Escape.
6. `/admin` renders.
7. Event applications have region filter.
8. Decision log has regional/level filter.
9. Venue registry still works.
10. Event registry does not open seatmap for no-seatmap events.
11. `/demo` renders.
12. B2C shows vertical posters and no purchases counter.
13. Seatmap event opens seatmap.
14. Open-air/capacity event buys without seatmap.
15. `/channel` renders.

Smoke status must be pass/fail, not “partial”.

## 4. Delivery

After build and local smoke:

1. commit changes;
2. push branch;
3. create PR;
4. merge PR into `main`;
5. wait for GitHub Pages deploy success;
6. run live smoke.

## 5. Live smoke URLs

- `https://ogelslamovuk.github.io/cl_platform/#/main`
- `https://ogelslamovuk.github.io/cl_platform/#/demo`
- `https://ogelslamovuk.github.io/cl_platform/#/organizer`
- `https://ogelslamovuk.github.io/cl_platform/#/admin`
- `https://ogelslamovuk.github.io/cl_platform/#/channel`
- `https://ogelslamovuk.github.io/cl_platform/#/proto`

## 6. Final report

Final report in Russian must include:

- branch;
- feature commit SHA;
- main merge commit SHA;
- PR link;
- GitHub Pages deploy run;
- changed files;
- build status;
- local smoke status;
- live smoke status;
- live URLs;
- notes on acceptance checklist.

Do not report completion before live smoke.
