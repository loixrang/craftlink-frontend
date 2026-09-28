# Manual location - FE-DISC-003

Discovery includes a separate manual-location form with latitude, longitude and optional radius in kilometres. Both coordinates are required when applying a location; latitude accepts -90 through 90 and longitude -180 through 180, including zero and negative values. Radius must be finite and positive when supplied. Decimal input is validated with a shared Zod schema in React Hook Form and when reading URL parameters. Invalid or incomplete URL locations are ignored as a whole with visible feedback, retaining the raw inputs for correction.

The frozen API offers latitude, longitude and radiusKm, but no address/city lookup or geocoding endpoint. This feature therefore uses explicit coordinates from a map; it does not pretend keyword search is location filtering. No provider, dependency or contract change was introduced. Browser geolocation remains FE-DISC-004; sorting and pagination remain FE-DISC-005.

Only Apply location changes the applied search. It preserves keyword/category/other filters and resets page. Clear location removes the location fields, page and any distance-sort URL value, preserving other filters; it also clears unapplied drafts/errors. Existing Clear all filters removes location too. Search and category navigation preserve applied coordinates. Direct links and history restore the form and results. Coordinates are included in the URL/history, explained beside the form; no additional browser storage or profile location writes occur.

The shared artisan service sends the contract location fields through the existing public API client and TanStack Query key. Without a radius, only coordinates are sent and no client radius is assumed. Existing loading/error/retry/empty behavior applies to location searches. The UI does not claim browser position or expose artisan coordinates.

Focused tests cover submitted versus draft values, coordinate boundaries/zero/negative values, invalid/incomplete/nonfinite links, optional and invalid radius, field errors/focus/correction, filter preservation, page reset, history/direct entry and clearing drafts. HTTP is mocked; live backend behavior and browser layout have not been verified.
