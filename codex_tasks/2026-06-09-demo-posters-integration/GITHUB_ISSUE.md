# Title
Integrate final 17 demo event posters into B2C афиша and deploy verified pages

# Goal
Replace the current placeholder/minimal SVG poster set with the final generated PNG poster pack and make the B2C public афиша look like a believable real event listing on the deployed demo site.

# Why
The current demo posters look like repeated mock graphics and reduce trust in the ministry-level demo. The new posters must support the demo credibility layer: realistic events, realistic performers, realistic posters, no broken showcase cards.

# Scope
- Validate the provided 17 PNG poster assets.
- Copy them into the app public assets folder.
- Update demo poster references in `src/lib/demoEngine.ts`.
- Update demo event content according to `DEMO_CONTENT_TARGET_MATRIX.md`.
- Ensure renamed demo events do not leave stale duplicates in persisted localStorage demo data.
- Ensure B2C `/demo` uses the new posters everywhere it renders public event cards/details.
- Ensure Михаил Стасов appears at the top of the public афиша.
- Preserve the existing B2C purchase and seatmap behavior.
- Run build, local smoke-check, deploy through the existing deployment mechanism, and post-deploy smoke-check live pages.

# Out of scope
- No new image generation.
- No UI redesign.
- No new routes.
- No production backend.
- No real integrations.
- No new seatmap implementation.
- No admin/operator logic redesign.
- No deletion of working flows.
- No pull request.
- No patch-only result as final acceptance.

# Acceptance
- 17 PNG posters are present in `public/demo/posters/` with exact filenames from the manifest.
- All 17 target demo events use the new poster paths.
- B2C афиша renders new posters in the existing poster frame without distortion or broken images.
- Михаил Стасов is first/visibly top-priority in B2C афиша.
- No stale old renamed demo events remain after demo data regeneration/enrichment.
- `npm run build` passes.
- Local smoke-check `/main`, `/demo`, `/admin`, `/channel` passes.
- Existing deployment workflow / GitHub Pages deployment passes.
- Live deployed `/main`, `/demo`, `/admin`, `/channel` pages are smoke-checked and reported.
- No PR was created.
