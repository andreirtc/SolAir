# Help center and user manual

Help (SOS & Assistance) and Help and support share the searchable FAQ interface. The existing assistance form and request activity are retained below it. User manual opens an accessible dialog with the full guide and a direct PDF download.

- Shared manual content: `src/content/solair-user-manual.json`.
- Popup: `src/UserManual.tsx`.
- FAQ topics: `src/help-topics.ts`.
- PDF builder: `scripts/build-user-manual.py` (Python with reportlab and pypdf).
- Deployed PDF: `public/downloads/SOLAIR-user-manual.pdf`.
- Document artifact: `output/pdf/SOLAIR-user-manual.pdf`.

After changing manual content, run `python scripts/build-user-manual.py`, render and inspect the resulting pages, and commit the deployed PDF with the content changes. PDF creation is separate from the frontend build; running the app does not require Python.

The manual describes current recorded-data behavior, account roles, deferred address lookup and available notification/contact controls. It includes no private driver records or credentials.

Validation: `node --import tsx tests/help-center-manual-browser.ts` uses its own disposable database and verifies FAQ search, assistance-form focus, modal keyboard behavior, download bytes and responsive themes. It does not send an assistance request or a message.
