# RedactPDF

RedactPDF is a browser-only PDF redaction app.

- Render each source PDF page to canvas
- Paint selected mask areas in opaque black
- Rebuild a new PDF from masked page images only
- Do not copy original PDF page objects into output

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages deployment

This repository includes [deploy-pages.yml](.github/workflows/deploy-pages.yml), which deploys `dist` to GitHub Pages on every push to `main`.

### Required repository settings

1. Open repository settings
2. Go to `Pages`
3. Set `Source` to `GitHub Actions`

After that, pushing to `main` will publish the app.

### Base path handling

`vite.config.ts` automatically sets `base` in GitHub Actions using `GITHUB_REPOSITORY`.

- GitHub Actions: `/<repo-name>/`
- Local: `/`

So the same code works both locally and on GitHub Pages.
