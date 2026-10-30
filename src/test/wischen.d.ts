import type { Locator, Page } from '@playwright/test';
/**
 * Bis der Übergang nach einem Seitenwechsel durch ist (lib/ui/uebergang.ts, knapp 0,3 s): Solange
 * nimmt das Bild des Übergangs alle Berührungen an, nicht die Seite darunter
 */
export declare function uebergangAbwarten(page: Page): Promise<void>;
/** Finger rechts auf die Zeile legen und um dx/dy ziehen, dann loslassen */
export declare function wischen(
	page: Page,
	zeile: Locator,
	dx: number,
	dy?: number,
	schritte?: number
): Promise<void>;
/** Finger lange (0,7 s) auf die Mitte legen, ohne zu bewegen – öffnet das Menü einer Zeile */
export declare function langDruecken(page: Page, ziel: Locator): Promise<void>;
/** Mit dem Finger auf die Mitte eines Elements tippen (mit kurzer Pause davor, sonst ist es ein
 * Doppeltippen) */
export declare function antippen(page: Page, ziel: Locator): Promise<void>;
/**
 * Am Griff (SortierListe) ziehen und knapp über dem Griff `ueber` loslassen – mit der Maus oder mit
 * dem Finger (nur Chromium: Berührungen über CDP). Ohne `touch-action: none` am Griff würde der
 * Browser beim Finger scrollen und das Ziehen abbrechen.
 */
export declare function amGriffZiehen(
	page: Page,
	griff: Locator,
	ueber: Locator,
	mit?: 'maus' | 'finger'
): Promise<void>;
/** Zwei Finger um die Mitte des Elements auseinander (faktor > 1) oder zusammen ziehen */
export declare function zweiFingerZoom(
	page: Page,
	ziel: Locator,
	faktor: number,
	schritte?: number
): Promise<void>;
