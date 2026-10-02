# Browser location - FE-DISC-004

Not implemented. There is no browser geolocation code in this frontend: `navigator.geolocation` and `getCurrentPosition` appear nowhere under `src/`, no permission is ever requested, and no location on any route is derived from a device position. This document records that absence deliberately rather than describing behavior that does not exist.

The reason is the location model chosen on 2026-10-02 (see DECISIONS.md): discovery filters administratively by `state` and `city`, which the implementation already supported through the state plus city/LGA selector in MANUAL_LOCATION.md. A browser position yields latitude and longitude, which only the unused coordinate filters could consume. Wiring geolocation in would therefore have required reintroducing coordinate filtering and radius handling to produce a result the current discovery model cannot express, and FE-DISC-003/FE-DISC-004 as originally specified are mutually inconsistent for that reason.

Consequences that are accepted rather than hidden: no distance sorting, no radius filtering and no distance values are shown, and the optional `distanceKm` field in the artisan summary is never rendered. Artisan coordinates are never requested from the API and never displayed.

`ROADMAP.md` still marks FE-DISC-004 complete, which does not match the code. Correcting that marker is a product decision rather than a documentation fix, so it is deliberately left unchanged pending one; browser geolocation would need to be re-specified against the agreed location model, or formally deferred.
