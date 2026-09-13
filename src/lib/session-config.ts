/** Cookie lifetime — refreshed while the user is active. */
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

/** Sessions are per browser/device. Signing in on one gadget does not sign out others. */

/** Fan account: sign out after this long without activity. */
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/** Admin / press: sign out only after 5 minutes with no user activity on the site. */
export const ADMIN_SESSION_IDLE_TIMEOUT_MS = 5 * 60 * 1000;
