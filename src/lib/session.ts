// Session persistence policy for DeepShield ("Remember me").
//
// The auth session itself is stored in localStorage, so it survives closing
// the browser. "Remember me" decides whether that is desirable: when the user
// opts out, the session is discarded as soon as a brand-new browser session
// starts (detected with a sessionStorage marker), which mimics a classic
// "sign me out when I close the browser" behaviour without a server round-trip.

const REMEMBER_KEY = "deepshield.auth.remember";
const BROWSER_SESSION_KEY = "deepshield.auth.browser-session";

export function setRememberSession(remember: boolean) {
  try {
    window.localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    window.sessionStorage.setItem(BROWSER_SESSION_KEY, "1");
  } catch {
    /* storage blocked — fall back to default persistent behaviour */
  }
}

export function isRememberSession(): boolean {
  try {
    return window.localStorage.getItem(REMEMBER_KEY) !== "0";
  } catch {
    return true;
  }
}

/**
 * True when a stored session belongs to a previous browser session and the
 * user asked not to be remembered — the caller should then sign out.
 */
export function shouldDiscardStoredSession(): boolean {
  if (isRememberSession()) return false;
  try {
    const sameBrowserSession = window.sessionStorage.getItem(BROWSER_SESSION_KEY) === "1";
    window.sessionStorage.setItem(BROWSER_SESSION_KEY, "1");
    return !sameBrowserSession;
  } catch {
    return false;
  }
}

export function clearRememberSession() {
  try {
    window.localStorage.removeItem(REMEMBER_KEY);
    window.sessionStorage.removeItem(BROWSER_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
