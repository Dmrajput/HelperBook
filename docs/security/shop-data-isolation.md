# Shop and employee isolation

Owner routes derive the shop from the authenticated user id. They do not use a shop id from the body as the tenant.

Employee routes derive the employee and shop from the employee access token. `requireEmployee` also rejects a suspended shop. Portal salary, advance, leave, and receipt queries include both `shopId` and `employeeId`.

The security suite creates Owner A / Shop A and Owner B / Shop B in `helperbook_security_test`, then checks:

- Owner A cannot open Owner B’s employee. The response is 404.
- Owner A cannot open Owner B’s attendance history. The response is 404.
- A `shopId` sent in the employee create body does not move the new employee to the other shop.
- An employee token cannot call owner employee routes or admin routes.
- An owner token cannot call admin routes.
- An employee token requesting an unknown salary id is denied.

Employees cannot mark attendance, pay salary, approve leave, or manage subscriptions through the portal routes. Those routes are mounted behind `requireEmployee` and expose read and leave-request actions only.

Exports for salary, attendance, advances, and leave use the same owner shop lookup as the on-screen reports. There is no public receipt URL. Receipt PDFs are generated for the authenticated owner’s shop or the authenticated employee’s own salary.
