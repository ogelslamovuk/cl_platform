# UI audit excerpt used for polish round 4

The audit was treated as input, not as absolute truth.

## Accepted audit findings

- UI currently risks looking like a generic React dashboard.
- Mock content is too toy-like in places.
- Repeated posters hurt credibility.
- English/dev labels are visible in UI.
- Application statuses are not explicit enough.
- Admin decision/audit trail is not visible enough.
- Control section needs meaningful demo violations.
- Admin tables need readability/status improvements.
- Forms need clearer grouping.
- Fee/payment visibility improves legal/procedural credibility.
- Step 8 `Пошлинные платежи` must not show unexplained totals like `420 BYN · 10 базовых величин`.
- Operator/channel page should look more like a business portal and less like a developer console.

## Rejected or deferred audit items

- Full auth/security redesign — deferred.
- Fix demo-login — explicitly out of scope for this iteration.
- New B2C purchase flow with payment/QR/PDF — deferred.
- Global visual rebrand / official symbols — deferred.
- Theme switcher — rejected for now.
- Full mobile/adaptive redesign — deferred.
- Real integrations, real payment, real digital signature — out of scope.

## User-approved direction

Focus on urgent polish for presentation:

```text
Ничего не должно стать хуже. Только лучше.
```

Therefore implementation must enrich existing screens and data, not replace or destabilize them.


## Round 4 user addition

User explicitly added that Step 8 `Пошлинные платежи` needs stronger UI explanation and that `/proto` financial settings should include a selector `Порядок начисления платежей` with two options:

- `По действующим правилам`;
- `Расширенный расчёт`.

The UI must explain where the amount comes from. Working screens must show result, basis and calculation, not highlight the selector option as a separate product model. Do not expose this as `по максимуму` or Dubai/DTCM terminology.
