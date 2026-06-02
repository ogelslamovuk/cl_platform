Read these files first, in this exact order:

1. SKILLS.md
2. CL_PLATFORM_CONTEXT.md
3. CODEX_TASK_ITERATION_02.md
4. CODEX_ACCEPTANCE_CHECKLIST_ITERATION_02.md
5. CODEX_DELIVERY.md

Then execute Iteration 2 autonomously.

This is a full autonomous delivery task, not a draft implementation.

Hard rules:
- Follow SKILLS.md as the base project instruction.
- Follow CODEX_TASK_ITERATION_02.md as the main product/implementation task.
- Do not ask product questions unless there is a real blocker.
- Do not expand scope.
- Do not create duplicate entities.
- Do not introduce English UI text.
- Do not redesign the product.
- Do not create or display a debt/overdue concept.
- Do not stop after code changes.
- Do not stop after PR creation.
- If any acceptance checklist item fails, continue fixing before final response.
- If build fails, fix within scope and rerun.
- If GitHub Pages deploy is not complete, wait/check again before final response.

Definition of done:
- implementation completed;
- acceptance checklist passed;
- npm run build passed;
- demo scenario from CODEX_TASK_ITERATION_02.md checked;
- PR created;
- PR merged into main;
- GitHub Pages deployed;
- public URL opened and checked.

Final response must include:
- what was done;
- build/check status;
- PR link;
- merge status;
- GitHub Pages deploy status;
- public deployed URL.
