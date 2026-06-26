# LibreSVIP PWA

Browser-based LibreSVIP converter powered by a Pyodide module worker.

## Run

```bash
bun install
bun run dev
```

## Notes

- Input files come from the browser `File` API or drag and drop.
- Output is delivered as a browser download `Blob`.
- Local filesystem paths, output folder selection, and file manager reveal are not part of the PWA flow.
- Conversion runs inside a module worker so Pyodide can initialize correctly in the browser.
