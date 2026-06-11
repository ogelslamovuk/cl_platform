# Poster asset manifest

## Input locations
Codex must look for the generated poster assets in this order:

```text
codex_tasks/2026-06-09-demo-posters-integration/poster_assets_here/
```

then:

```text
images_task/generated_posters/
```

Accepted:
- extracted PNG files directly in `codex_tasks/2026-06-09-demo-posters-integration/poster_assets_here/`
- extracted PNG files directly in `images_task/generated_posters/`
- one archive: `images_task/generated_posters/cl_platform_demo_posters_17_png.zip`

## Target location
Copy the 17 PNG files into:

```text
public/demo/posters/
```

Use paths in code as:

```text
/demo/posters/<filename>.png
```

## Required exact filenames

```text
poster-mikhail-stasov-vernus-k-tebe.png
poster-vasilkovy-kraj.png
poster-belarus-u-sertsy.png
poster-pesnya-rodnay-zyamli.png
poster-slyozy-na-asfalte.png
poster-kazki-palessya.png
poster-andre-boticelli-violonchel-pri-svechah.png
poster-kola-tradycyj.png
poster-grodzenskiya-abrysy.png
poster-spadchyna-i-suchasnast.png
poster-kupalski-vyanok.png
poster-jimmy-thornton-only-hits-live.png
poster-novyya-imiony.png
poster-syabroustva-kultur.png
poster-slutskie-poyasa.png
poster-gorod-govorit.png
poster-simfoniya-kino.png
```

## Validation requirements
- Validate that all 17 required filenames exist.
- Validate that all are PNG files.
- Do not use old SVG poster files for the target events.
- Do not rename files unless the current filename differs only by an obvious archive-folder prefix. The final target filenames must be exact.
- Report missing and extra files in the final report.
