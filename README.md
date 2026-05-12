# Codex autonomous pipeline docs v4

Скопировать все `.md` файлы из этой папки в корень проекта.

Стартовое сообщение Codex:

```text
Прочитай SKILLS.md, AGENTS.md если есть, CODEX_AUTONOMOUS_UI_UX_SKILL.md и CODEX_PIPELINE.md.

Работай полностью автономно.
Не задавай пользователю вопросов.
Не проси подтверждений.
Не останавливай pipeline из-за отсутствия идеального deploy/browser/screenshot-инструмента.
Используй fallback-режимы из CODEX_AUTONOMOUS_UI_UX_SKILL.md.

Выполни pipeline строго по порядку:
1. CODEX_TASK_01_UI_AND_MOCK_FIXES.md
2. CODEX_TASK_02_TICKET_REFUNDS.md
3. CODEX_TASK_03_ORGANIZER_FINANCE.md
4. CODEX_TASK_04_B2C_BRANDING_AND_REPORTS.md

После каждого этапа:
- self-review;
- build/tests;
- UI/UX проверки доступным способом;
- auto-fix до 3 итераций при ошибках;
- отдельный commit;
- deploy или deploy-fallback;
- post-deploy или fallback-check;
- переход к следующему этапу.

Не завершай работу после первого blocker, кроме HARD BLOCKERS:
1. невозможно прочитать репозиторий;
2. невозможно установить зависимости из-за отсутствия lock/package файлов;
3. рабочая директория разрушена и git не работает;
4. build падает после 3 auto-fix итераций и rollback stage невозможен.

Во всех остальных случаях продолжай pipeline с fallback-проверками и отчётом о том, что именно было проверено.
```
