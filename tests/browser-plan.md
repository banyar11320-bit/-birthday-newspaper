# Browser acceptance cases
- /studio is available with no credentials; a visible notice says nothing is saved.
- Editing headline updates the same shared preview; photo upload rejects SVG and >5 MB source images.
- Save Draft/Publish are disabled in local mode; there is no simulated persistence.
- Preview then return to editor retains in-memory values; reload/navigation warns on unsaved edits.
- Print output is exactly 2 A4 portrait pages with no controls, no clipped text; test max field lengths too.
- Widths 320, 375, 390, 430 and 1280 have no horizontal overflow.
- /admin requires login; all API mutations reject missing session and cross-origin requests.
- Temporary local test credentials can log in and out; deleted cookie cannot access admin.
- Blob credentials absent: authenticated dashboard clearly explains save/publish are unavailable.
