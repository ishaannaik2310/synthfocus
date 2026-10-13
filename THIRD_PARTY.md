# Third-Party Notices and Acknowledgements

This document lists third-party assets, fonts, and dependencies utilized in SynthFocus.

---

## 1. Typography & Fonts

SynthFocus uses the following web fonts served via `next/font/google`:

- **Oswald**
  - **Source**: Google Fonts (https://fonts.google.com/specimen/Oswald)
  - **Authors**: Vernon Adams, Kalapi Gajjar, Cyreal
  - **License**: SIL Open Font License (OFL), Version 1.1 (see upstream)

- **Inter**
  - **Source**: Google Fonts (https://fonts.google.com/specimen/Inter)
  - **Author**: Rasmus Andersson
  - **License**: SIL Open Font License (OFL), Version 1.1 (see upstream)

- **JetBrains Mono**
  - **Source**: Google Fonts (https://fonts.google.com/specimen/JetBrains+Mono)
  - **Author**: JetBrains
  - **License**: SIL Open Font License (OFL), Version 1.1 (see upstream)

---

## 2. Software Dependencies

SynthFocus relies on open-source packages in the Node.js and Python ecosystems. For specific licensing terms, copyright notices, and author details, refer to each package's upstream registry metadata:

### Node.js / NPM Packages (`frontend/package.json`)
- `next` (Next.js): See upstream package metadata
- `react`, `react-dom`: See upstream package metadata
- `motion`: See upstream package metadata
- `react-markdown`: See upstream package metadata
- `tailwindcss`: See upstream package metadata
- `@playwright/test`: See upstream package metadata
- `eslint`, `eslint-config-next`: See upstream package metadata

### Python Packages (`backend/requirements.txt`)
- `fastapi`: See upstream package metadata
- `uvicorn`: See upstream package metadata
- `pydantic`, `pydantic-settings`: See upstream package metadata
- `sse-starlette`: See upstream package metadata
- `langchain-google-genai`, `langchain-core`: See upstream package metadata
- `langgraph`: See upstream package metadata
- `google-genai`: See upstream package metadata
- `httpx`: See upstream package metadata
- `pytest`, `pytest-asyncio`: See upstream package metadata

---

## 3. Visual Media & Generated Assets

- The hero figure cluster artwork (`frontend/public/images/hero-buyers.webp`) and accompanying section graphics were generated using Antigravity's image generation tool specifically for SynthFocus.
- Images located in `docs/screenshots/` (`landing_overview.png`, `results.png`) are authentic screenshots of this project's own user interface.
- Icons in `frontend/public/` are standard utility icons.

---

## 4. Local Development Skills Notice

Agent skills in `.agent/` (such as `impeccable`, `image-to-code`, and `web-design-guidelines`) are development-time tools located on the local developer machine; they are explicitly excluded via `.gitignore` and are not included in this repository.
