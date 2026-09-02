/**
 * Tenant branding colours are chosen by each organization, so they can be any
 * hex at all. Anything painted on top of one has to be picked at runtime —
 * hard-coding white text fails WCAG the moment a tenant picks a pale brand.
 */

function toRgb(hex) {
  const value = String(hex || "").trim().replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

/** WCAG relative luminance. */
export function luminance(hex) {
  const rgb = toRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two hex colours, 1–21. */
export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Black or white — whichever reads better on `hex`. Falls back to white for an
 * unparseable value so a bad brand colour never produces invisible text.
 */
export function readableTextOn(hex) {
  const l = luminance(hex);
  if (l === null) return "#ffffff";
  // Compare against both candidates rather than a fixed threshold.
  const onWhite = (1.05) / (l + 0.05);
  const onBlack = (l + 0.05) / 0.05;
  return onBlack >= onWhite ? "#0f172a" : "#ffffff";
}

/**
 * A tenant brand colour is fine for large decorative fills, but small text on
 * white needs 4.5:1. When it falls short, use the product's own ink instead of
 * rendering unreadable brand-coloured text.
 */
export function safeTextColor(hex, fallback = "var(--color-ink)") {
  const ratio = contrastRatio(hex, "#ffffff");
  return ratio !== null && ratio >= 4.5 ? hex : fallback;
}
