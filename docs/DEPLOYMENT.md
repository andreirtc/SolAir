# Centralized deployment

Use [RAILWAY_SUPABASE.md](RAILWAY_SUPABASE.md) for the complete Railway + Supabase setup, exact environment names, verified PostgreSQL TLS, Supabase Auth, realtime publication, bootstrap, retention and separate-device acceptance.

The hosted target is Next.js on Railway with one shared Supabase PostgreSQL database. Production requires both Supabase providers and DATABASE_URL; no demo users or readings are seeded. Local SQLite and password authentication support development without accounts. Local production QA uses the explicit SOLAIR_ALLOW_LOCAL_PREVIEW=1 exception on loopback only; never configure this exception on Railway.

## PWA updates and privacy

The production build injects hashed Next.js scripts/styles/fonts into the service-worker precache and fingerprints the build and approved BEMAC asset to version the cache. API responses, locations and messages are excluded. Optimized default BEMAC images can be cached, with the raw image as the offline fallback. Private uploaded vehicle images bypass optimization and caching. A new worker waits until existing tabs close; it does not force activation during a help request.

Pending help requests are account-scoped in local storage, explicitly queued/unsent and retried with idempotent IDs in their original demo/hardware partition. Actual server acknowledgment is required before showing delivery. Cold offline launch presents the sign-in shell because the session cannot be verified; already-open readings remain visibly stale. SSE reconnects automatically; freshness recalculation runs without constant database polling. Browser push remains unavailable. Supabase recovery is implemented but SMTP delivery requires provider configuration and testing.

Railway Docker build/start configuration is supplied and the equivalent local Next.js production build has been exercised. Docker, actual Railway/Supabase accounts, Android installation and separate-network synchronization have not been tested in this environment.
