import type { Locale } from "../../i18n/LocaleContext";

export interface LandingPhoto {
    /** Full-size and small WebP files in public/images/landing/. */
    src: string;
    srcSmall: string;
    /** Pixel size of `src`, and the pixel width of `srcSmall`. */
    width: number;
    height: number;
    smallWidth: number;
    /** A plain description of what is visible, not marketing copy. */
    alt: Record<Locale, string>;
}

/**
 * Photos for the hero and the "For companies" / "For talent" panels.
 *
 * All are unset on purpose: no licensed photo has been added yet, so the hero shows
 * the Project Record alone and the panels render as text-only panels. To add one, put
 * the WebP files in public/images/landing/, record the source in
 * docs/design/photo-credits.md, then fill in the entry below. Each slot switches to
 * its photo layout on its own.
 */
export const landingPhotos: { hero?: LandingPhoto; company?: LandingPhoto; talent?: LandingPhoto } = {};

export const photoSrcSet = (photo: LandingPhoto) => `${photo.srcSmall} ${photo.smallWidth}w, ${photo.src} ${photo.width}w`;
