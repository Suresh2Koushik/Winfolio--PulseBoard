/**
 * Product feature switches, set at build time.
 *
 * TEAMS_ENABLED: manager features (manager dashboard, choosing a manager, feedback
 * and action items, the manager role). Off for v1, which is individual-only; the code,
 * security rules and tests stay in place so v2 can switch it back on.
 */
export const TEAMS_ENABLED = import.meta.env.VITE_FEATURE_TEAMS === "true";

/**
 * ATTACHMENTS_ENABLED: file evidence on wins. Needs Firebase Storage, which requires
 * the Blaze plan; keep off until Storage is set up and storage.rules are deployed.
 */
export const ATTACHMENTS_ENABLED = import.meta.env.VITE_FEATURE_ATTACHMENTS === "true";
