import type { Locale } from "../../i18n/LocaleContext";

export interface LandingPhoto {
    /** 800w and 1600w WebP files in public/images/landing/. */
    src800: string;
    src1600: string;
    width: number;
    height: number;
    alt: Record<Locale, string>;
}

/**
 * Photos for the "For companies" / "For talent" panels.
 *
 * Both are unset on purpose: no licensed photo has been added yet, so the panels
 * render as solid colour. To add one, put the WebP files in public/images/landing/,
 * record the source in docs/design/photo-credits.md, then fill in the entry below.
 */
export const landingPhotos: { company?: LandingPhoto; talent?: LandingPhoto } = {};
