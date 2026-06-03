---
name: upgrade-pdfjs
description: |
  Upgrade the bundled PDF.js library inside the `pdfmore` VSCode extension.
  Downloads the latest (or a user-specified) PDF.js Prebuilt (legacy/older browsers) release,
  fully replaces `lib/build/` and `lib/web/`, reapplies three source patches
  (remove sample PDF, neutralize `defaultUrl`, rewrite `DownloadManager.download` to
  postMessage the host), diffs `lib/web/viewer.html` against `src/entry/html_body_tmpl.ts`,
  bumps the version string in `README.md`, and verifies the build.
  Triggers: "upgrade pdf.js", "update pdfjs", "bump pdf.js", "升级 pdf.js", "更新 pdfjs 库".
  Does NOT trigger for: editing webview JS in `src/entry/*`, modifying the toolbar UI,
  or fixing PDF rendering bugs unrelated to a library upgrade.
---

# upgrade-pdfjs

Upgrade the vendored PDF.js library under `lib/` to a newer release while preserving this project's patches.

## Background

The extension vendors a prebuilt PDF.js distribution. The relevant layout:

```
lib/
  build/                # upstream — fully overwritten on upgrade
    pdf.mjs
    pdf.worker.mjs
  web/                  # upstream — fully overwritten on upgrade
    viewer.mjs          # upstream BUT must be patched (3 places, see step 5)
    viewer.css          # upstream
    viewer.html         # upstream — diff against html_body_tmpl.ts
    cmaps/  iccs/  locale/  standard_fonts/  images/  wasm/
  main.js               # PROJECT-OWNED glue, NOT in upstream zip
  pdf.css               # PROJECT-OWNED override, NOT in upstream zip
  LICENSE               # upstream
```

`lib/build/` and `lib/web/` are treated as fully upstream-managed — nothing in them needs to be preserved across an upgrade. Project-owned files live *outside* those directories (`lib/main.js`, `lib/pdf.css`). New customizations should follow the same pattern.

### Patches to `lib/web/viewer.mjs` (must be reapplied)

Three independent edits live inside the upstream `viewer.mjs` and are overwritten on upgrade:

1. **Neutralize sample PDF default URL** — `defaultOptions.defaultUrl.value: ""`.
2. **Rewrite `download(data, url, filename)`** — bridge to the VSCode host via `vscodeInstance.postMessage(...)` instead of triggering a browser download. `vscodeInstance` is set globally by `src/entry/main.js` (`window.vscodeInstance = acquireVsCodeApi()`).
3. (Future patches added by the team should be added to step 5.)

The viewer's `<body>` HTML is the source of `src/entry/html_body_tmpl.ts` (`bodyStr`), consumed by `src/pdfPreview.ts::getWebviewContents()`. If upstream changes `lib/web/viewer.html`'s body, the change must be ported to `html_body_tmpl.ts`.

## Procedure

### 1. Establish target version

Ask the user which version to upgrade to. If they say "latest", fetch the latest release from `https://github.com/mozilla/pdf.js/releases/latest` (use WebFetch).

- `CURRENT_VERSION`: parse from `README.md` line 7 (currently mentions e.g. `6.0.227`).
- `TARGET_VERSION`: from user / latest release.

If `TARGET_VERSION == CURRENT_VERSION`, stop and tell the user nothing to do.

### 2. Download the prebuilt (legacy) ZIP

```bash
TMPDIR=$(mktemp -d)
curl -fL -o "$TMPDIR/pdfjs.zip" \
  "https://github.com/mozilla/pdf.js/releases/download/v${TARGET_VERSION}/pdfjs-${TARGET_VERSION}-legacy-dist.zip"
unzip -q "$TMPDIR/pdfjs.zip" -d "$TMPDIR/pdfjs"
ls "$TMPDIR/pdfjs"   # expect: build/  web/  LICENSE
```

If `legacy-dist` returns 404, fall back to `pdfjs-<TARGET_VERSION>-dist.zip` and confirm with the user (legacy targets older browsers — what this project ships per README).

### 3. Snapshot viewer.html for body diff

```bash
cp lib/web/viewer.html "$TMPDIR/viewer.html.old"
```

### 4. Replace `lib/build`, `lib/web`, and `lib/LICENSE`

```bash
rm -rf lib/build lib/web
cp -R "$TMPDIR/pdfjs/build" lib/build
cp -R "$TMPDIR/pdfjs/web"   lib/web
[ -f "$TMPDIR/pdfjs/LICENSE" ] && cp "$TMPDIR/pdfjs/LICENSE" lib/LICENSE
```

After this:
- `lib/main.js`, `lib/pdf.css` — untouched (they live at `lib/`, outside the overwritten dirs).
- `lib/build/` and `lib/web/` — fresh upstream.

### 5. Reapply patches to `lib/web/viewer.mjs`

Use the `Edit` tool for each patch. Verify with grep after.

**5a. Remove sample PDF asset (if upstream still ships it):**
```bash
rm -f lib/web/compressed.tracemonkey-pldi-09.pdf
```

**5b. Neutralize `defaultUrl`:**

Find:
```js
defaultOptions.defaultUrl = {
    value: "compressed.tracemonkey-pldi-09.pdf",
    kind: OptionKind.VIEWER
  };
```
Replace `value`:
```js
defaultOptions.defaultUrl = {
    value: "",
    kind: OptionKind.VIEWER
  };
```

If upstream renamed the field or changed indentation, locate it via `grep -n "defaultUrl" lib/web/viewer.mjs` and adjust.

**5c. Rewrite the `download(data, url, filename)` method:**

Locate it by `grep -n "download(data, url, filename) {" lib/web/viewer.mjs` — there should be exactly one match. The enclosing class has moved between versions (in v5 it was `class DownloadManager`; in v6 it moved up into `class BaseDownloadManager`, with `DownloadManager extends BaseDownloadManager` only overriding `_triggerDownload`). Either way, patch the single `download(data, url, filename)` method — the original implementation creates a blob URL and calls `this._triggerDownload(...)`, which is what we want to intercept.

Replace the entire method body with:

```js
download(data, url, filename) {
  const blobUrl = data ? URL.createObjectURL(new Blob([data], {
    type: "application/pdf"
  })) : null;
  vscodeInstance.postMessage({
    type: 'function-call',
    data: {
      method: 'download',
      params: {
        url,
        filename,
        data: Array.from(data),
      }
    }
  })
}
```

Notes:
- `vscodeInstance` is a global set by `src/entry/main.js` before the viewer module loads.
- The `download` host-side handler is in `src/pdfPreview.ts` under the `function-call` / `download` switch case; it writes `Buffer.from(data)` to the resource URI.
- If `blobUrl` becomes genuinely unused after the rewrite, that's fine — keep the assignment for now since it documents the prior intent. Only remove it if the user explicitly asks for cleanup.

**Verify all three patches:**
```bash
grep -n "tracemonkey" lib/web/viewer.mjs   # should print nothing
grep -n "defaultUrl"  lib/web/viewer.mjs   # should show value: ""
grep -n "vscodeInstance.postMessage" lib/web/viewer.mjs   # should show the download() patch
```

### 6. Port `viewer.html` body changes

```bash
diff -u "$TMPDIR/viewer.html.old" lib/web/viewer.html
```

- If the diff is empty or only touches `<head>` / whitespace, nothing to port.
- If `<body>...</body>` changed, port the changes into `src/entry/html_body_tmpl.ts` (the `bodyStr` template literal). The `<head>` is irrelevant — `pdfPreview.ts::getWebviewContents()` builds its own `<head>`.

**Picking a porting strategy based on diff size:**

- **Small/focused diff** (a few elements, a renamed ID, an added button): use `Edit` to apply each change to `html_body_tmpl.ts`.
- **Large structural diff** (e.g. v5 → v6 replaced the entire `#sidebarContainer` block with `#viewsManager`): regenerate `html_body_tmpl.ts` wholesale from the new `<body>`. The template's content is exactly `lib/web/viewer.html` lines between `<body tabindex="0">` and `</body>`, with one quirk — the first content line (`    <div id="outerContainer">`) has its 4 leading spaces stripped because it sits on the same conceptual line as the opening backtick. Reconstruction script:

  ```bash
  BODY_OPEN=$(grep -n "<body" lib/web/viewer.html | head -1 | cut -d: -f1)
  BODY_CLOSE=$(grep -n "</body>" lib/web/viewer.html | head -1 | cut -d: -f1)
  CONTENT_START=$((BODY_OPEN + 1))
  CONTENT_END=$((BODY_CLOSE - 1))
  LAST_LINE=$(sed -n "${CONTENT_END}p" lib/web/viewer.html)
  {
    echo 'export const bodyStr = `'
    sed -n "${CONTENT_START},$((CONTENT_END - 1))p" lib/web/viewer.html | sed '1s/^    //'
    printf '%s`;\n' "$LAST_LINE"
  } > src/entry/html_body_tmpl.ts
  ```

  (The closing-backtick-on-same-line-as-last-div style matches the file's existing convention.)

**After porting, check for dead CSS / JS references to removed IDs:**

```bash
# Grep for any element IDs from the OLD body that are no longer in the new body,
# but are still referenced by project code.
diff <(grep -oE 'id="[^"]+"' "$TMPDIR/viewer.html.old" | sort -u) \
     <(grep -oE 'id="[^"]+"' lib/web/viewer.html | sort -u) \
  | grep '^<' | sed 's/^< id="//; s/"$//' \
  | while read -r removed_id; do
      hits=$(grep -rn "$removed_id" src/ 2>/dev/null)
      [ -n "$hits" ] && echo "DEAD REF to removed #$removed_id:" && echo "$hits"
    done
```

Report any hits to the user — these are project customizations (CSS rules, JS lookups) that the upgrade has just broken. Do NOT silently rewrite them: the new equivalent may have different layout semantics. Let the user decide.

### 7. Bump README version string

Edit `README.md` line 7:
```
1. **PDF.js Integration**: Utilizes the latest PDF.js library (version <TARGET_VERSION>) for ...
```

Do NOT bump `package.json#version` or write to `CHANGELOG.md` without asking — those are the **extension** version, not the PDF.js version.

### 8. Build & verify

```bash
npm run compile                          # extension host TS → out/
npx rollup -c rollup.config.mjs          # webview JS → dist/
npm run lint
```

All three must succeed. If TypeScript fails because `html_body_tmpl.ts` was edited, fix the syntax there. If Rollup fails, inspect `src/entry/` imports.

### 9. Manual smoke test (ask the user)

The build verifies code correctness, not feature correctness. Ask the user to:
1. Reload the extension in VSCode (F5 / Extension Development Host).
2. Open a `.pdf` — confirm it renders.
3. Toggle Dark/Light in the toolbar — confirm theme switching still works.
4. Edit an annotation, save, reopen — confirm the host-side write path (the `download()` patch) persists changes to disk.

State explicitly that you cannot run this test yourself.

### 10. Cleanup

```bash
rm -rf "$TMPDIR"
```

## Quick checklist (paste into your final summary)

- [ ] `CURRENT_VERSION` → `TARGET_VERSION` decided
- [ ] `viewer.html.old` snapshot taken
- [ ] `lib/build/` and `lib/web/` replaced; `lib/LICENSE` refreshed
- [ ] `lib/main.js`, `lib/pdf.css` untouched
- [ ] Sample PDF removed
- [ ] `defaultUrl` neutralized
- [ ] `download(data, url, filename)` rewritten to `vscodeInstance.postMessage`
- [ ] `viewer.html` body diff reviewed; `html_body_tmpl.ts` updated (focused Edits or wholesale regenerate)
- [ ] Dead-reference scan: any old element IDs still referenced in `src/` reported to user (do not silently rewrite)
- [ ] `README.md` version bumped
- [ ] `npm run compile` ✓
- [ ] `npx rollup -c rollup.config.mjs` ✓
- [ ] `npm run lint` ✓
- [ ] User notified to perform visual smoke test
