# Customer account basics - FE-CUST-005

The protected `/customer/account` page displays the authenticated email and customer role from the verified session (`GET /auth/me`). It is linked from customer navigation, the customer dashboard, and provides a return link to the dashboard. No extra account query or mutation is made, and no profile fields are inferred from registration data.

The frozen API contract has no customer profile read/update route and defines no editable customer fields. The page therefore explains that email/profile changes are not available yet. Do not add editable data until the API contract defines its fields, validation, and endpoint.

Focused coverage checks the displayed identity, navigation and role protection. HTTP is not used by this page; session restoration remains covered by FE-AUTH-003.
