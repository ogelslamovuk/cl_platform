# Инструкция запуска для пользователя

1. Положи 17 PNG постеров сюда:

```text
D:\JetBrains\cl_platform\codex_tasks\2026-06-09-demo-posters-integration\poster_assets_here\
```

Допустимый альтернативный путь:

```text
D:\JetBrains\cl_platform\images_task\generated_posters\
```

2. Положи этот task package в репозиторий:

```text
D:\JetBrains\cl_platform\codex_tasks\2026-06-09-demo-posters-integration\
```

3. Открой Codex в репозитории `cl_platform`.

4. Первым сообщением отправь содержимое:

```text
CODEX_INITIAL_MESSAGE.md
```

5. Дальше Codex должен сам:
- проверить ассеты;
- скопировать PNG в `public/demo/posters/`;
- обновить demo data;
- проверить B2C афишу;
- прогнать build/local smoke;
- не создавать PR;
- закоммитить и запушить approved scope в deployment branch;
- дождаться деплоя;
- перепроверить live `/main`, `/demo`, `/admin`, `/channel`;
- вернуть отчёт с commit SHA, live URL и статусом deploy/smoke.
