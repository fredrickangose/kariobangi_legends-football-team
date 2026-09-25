/** Cookie lifetime — refreshed while the user is active. */
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

/** Sessions are per browser/device. Signing in on one gadget does not sign out others. */

/** Fan account: sign out after this long without activity. */
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/** Admin / press: sign out only after 5 minutes with no user activity on the site. */
export const ADMIN_SESSION_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Server-enforced twin of ADMIN_SESSION_IDLE_TIMEOUT_MS. The admin/press cookie
 * and token are issued with this lifetime (not SESSION_MAX_AGE_SECONDS) so the
 * 5-minute idle limit holds even if the client-side timer never gets to run —
 * e.g. the browser suspends or discards a backgrounded tab. Each heartbeat
 * while the user is active re-mints the token, sliding the window forward.
 */
export const ADMIN_SESSION_MAX_AGE_SECONDS = ADMIN_SESSION_IDLE_TIMEOUT_MS / 1000;
