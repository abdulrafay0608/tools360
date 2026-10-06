"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * useConsentBanner — Hook for CMP (Consent Management Platform).
 *
 * Prepared but NOT enabled. When you're ready for a real consent solution
 * (e.g. for EU/UK GDPR/PECR compliance before loading real ads):
 *
 * 1. Set `CONSENT_ENABLED = true` below.
 * 2. Build a ConsentBanner UI component that calls `grantConsent()` / `denyConsent()`.
 * 3. Conditionally load the AdSense script only after consent is granted.
 *
 * This hook manages consent state via localStorage.
 */

const CONSENT_ENABLED = false;
const CONSENT_KEY = "tools360_ad_consent";

/**
 * @returns {{
 *   consentRequired: boolean,
 *   consentGiven: boolean | null,
 *   showBanner: boolean,
 *   grantConsent: () => void,
 *   denyConsent: () => void,
 *   resetConsent: () => void,
 * }}
 */
export default function useConsentBanner() {
  const [consentGiven, setConsentGiven] = useState(null);

  useEffect(() => {
    if (!CONSENT_ENABLED) {
      setConsentGiven(true); // No consent needed, treat as granted
      return;
    }

    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "granted") {
      setConsentGiven(true);
    } else if (stored === "denied") {
      setConsentGiven(false);
    }
    // null = not yet decided, show banner
  }, []);

  const grantConsent = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "granted");
    setConsentGiven(true);
  }, []);

  const denyConsent = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "denied");
    setConsentGiven(false);
  }, []);

  const resetConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_KEY);
    setConsentGiven(null);
  }, []);

  return {
    consentRequired: CONSENT_ENABLED,
    consentGiven,
    showBanner: CONSENT_ENABLED && consentGiven === null,
    grantConsent,
    denyConsent,
    resetConsent,
  };
}
