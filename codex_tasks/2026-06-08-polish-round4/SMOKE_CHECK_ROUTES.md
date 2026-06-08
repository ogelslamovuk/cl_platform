# Smoke-check routes

Local and live smoke-check must cover these routes.

## Local routes

Use the repository's normal local dev/preview command.

Required routes:

```text
/#/main
/#/proto
/#/organizer
/#/admin
/#/channel
/#/demo
```

If the repo has a different base path locally, adapt only the base path, not the hash routes.

## Live GitHub Pages routes

```text
https://ogelslamovuk.github.io/cl_platform/#/main
https://ogelslamovuk.github.io/cl_platform/#/proto
https://ogelslamovuk.github.io/cl_platform/#/organizer
https://ogelslamovuk.github.io/cl_platform/#/admin
https://ogelslamovuk.github.io/cl_platform/#/channel
https://ogelslamovuk.github.io/cl_platform/#/demo
```

## Expected smoke result

For each route:

- page opens;
- no obvious blank screen;
- no obvious runtime crash;
- visible texts are Russian/business-like on main UI;
- demo data appears where expected;
- no worse than before.

## Extra checks

- B2C `/demo`: event cards show varied posters and realistic event names.
- `/admin`: dashboard has decision/control context.
- `/channel`: operator cabinet looks business-like.
- organizer/application route: forms/status context are not broken.
