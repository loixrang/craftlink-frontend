# Browser location - FE-DISC-004

Use my location explicitly requests a single browser position; mounting the page never prompts. A secure context and browser geolocation support are required. The request uses a 10-second acquisition timeout, no cached position and no high-accuracy preference. Permission prompting remains controlled by the browser.

Successful coordinates are validated and fill the manual form. The optional radius is retained. Review and Apply location are required before coordinates enter the URL/history and discovery API; the existing manual form preserves other filters and resets page. No profile write or additional storage is introduced.

Pending and success feedback are announced through a status region. Denial (including browser/policy restrictions), timeout, unavailable position, unsupported browsers, insecure contexts, invalid coordinates and synchronous failures leave manual entry available. Denied permission can be changed in browser settings before retrying. Raw browser error messages are not rendered.

Cancel, manual edits, apply, clear and navigation invalidate pending callbacks. The browser API cannot abort an outstanding permission prompt or position acquisition; cancellation prevents its result from changing the form. Retry has a new request identity so older callbacks are ignored.

Tests mock geolocation and cover explicit activation, draft/apply separation, filter/radius preservation, zero and boundary coordinates, error recovery, retry, cancellation and obsolete callbacks. Existing discovery tests cover submission through the API. Real browser permissions, device location, responsive visual layout and live backend integration were not exercised. Sorting and pagination remain FE-DISC-005.
