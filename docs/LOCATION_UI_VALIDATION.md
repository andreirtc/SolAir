# Location explorer and recent stays

Updated 25 October 2026. Frontend only; existing authentication, role permissions, API contracts and database behavior are preserved.

The Location page uses a larger interactive map, a floating vehicle identity card, a translucent Recent stays timeline and a last-reported-position card. Existing vehicle selection, city-reference controls, fleet framing, GPS markers, basemap failure messaging, refresh and vehicle-details navigation remain available. Bottom navigation remains unchanged.

Recent stays use the existing authenticated `/api/history/:vehicleId?mode=...` endpoint, with up to 100 recent reports refreshed every 30 seconds. The UI shows up to six possible stays, newest first. A stay requires at least three distinct fresh GPS fixes spanning two minutes, within 60 metres of the initial point. Missing or stale fixes, movement outside that radius, or gaps longer than five minutes break a stay. Duplicate frames and cached fix timestamps do not extend its duration. Wrong-mode, recovered historical CPE, event-only, malformed and future-dated records are excluded.

These are inferred observations, not confirmed visits or continuously verified parking durations. Coordinates and recorded times are shown; no addresses or place names are invented. This is a recent sample window, not a complete travel history. Demo observations are labeled simulated and do not appear in hardware mode. Selecting a stay highlights its historical area on the map; returning restores the vehicle's last known position or the existing city reference.

No geocoding service, new dependency, database table or backend endpoint was added. Confirmed place names, saved favorites, longer history retention and authoritative arrival/departure records would require separate backend/product work.

Validation uses four focused stay-inference unit tests and an isolated browser fixture covering empty hardware history, inferred stops, selection/return, history failure/retry, mode separation and responsive light/dark layouts at 320, 360, 390 and 1440px. Test GPS records and basemap tiles are explicitly synthetic and never written into the working database. Actual-phone usability and physical GPS accuracy remain unverified.

Results: all four unit tests, the Location browser fixture and existing map regressions passed. Map regressions cover desktop/mobile BEMAC/Manila, NWOW/Malabon, vehicle switching, GPS priority, first-fix behavior, preserved zoom, invalid coordinates and unassigned references. The older map test now uses an exact vehicle-selector label and passes through the mobile welcome screen. Production build, TypeScript and lint passed. The live phone proxy also rendered the new Location page for the existing assigned demo account; insufficient hardware GPS history correctly showed an empty stays list.
