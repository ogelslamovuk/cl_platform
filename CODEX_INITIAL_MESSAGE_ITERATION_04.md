Read these files first, in this exact order:

1. SKILLS.md
2. CL_PLATFORM_CONTEXT.md
3. CODEX_TASK_ITERATION_04.md
4. CODEX_ACCEPTANCE_CHECKLIST_ITERATION_04.md
5. CODEX_DELIVERY.md

Then execute Iteration 4 v2 autonomously.

This is a full autonomous delivery task, not a draft implementation.

Hard rules:
- Follow SKILLS.md as the base project instruction.
- Follow CODEX_TASK_ITERATION_04.md as the main product/implementation task.
- First find the existing Channel/Seller sale/refund flow and existing AdminReports.
- Do not ask product questions unless there is a real blocker.
- Do not expand scope.
- Do not create duplicate entities.
- Do not introduce English UI text.
- Do not redesign the product.
- Do not create a new sales flow.
- Do not create a new refund flow.
- Do not create duplicate reports.
- Do not create full reseller onboarding wizard.
- Do not implement real API/webhooks.
- Do not implement reseller settlement.
- Do not implement real contract document flow.
- Do not break Iteration 1 wizard.
- Do not break Iteration 2 payment approval gate.
- Do not break Iteration 3 tariff constructor/summary.
- Do not break existing Channel/Seller sale/refund flow.
- Do not break existing AdminReports.
- Do not stop after code changes.
- Do not stop after PR creation.
- If any acceptance checklist item fails, continue fixing before final response.
- If build fails, fix within scope and rerun.
- If GitHub Pages deploy is not complete, wait/check again before final response.

Definition of done:
- implementation completed;
- acceptance checklist passed;
- npm run build passed;
- tests passed if present;
- demo scenario from CODEX_TASK_ITERATION_04.md checked;
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
