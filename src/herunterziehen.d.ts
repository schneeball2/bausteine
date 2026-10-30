export interface HerunterziehenOptionen {
	/** Griff oben im Blatt (`touch-action: none`) */
	griff: () => HTMLElement | null | undefined;
	/** Zu: nach dem Hinausgleiten */
	schliessen: () => void;
	/** Fest: folgt dem Finger nur zäh und bleibt offen */
	fest?: () => boolean;
	/** Beim Loslassen fragen, ob es zu darf (z. B. „Änderungen verwerfen?“) */
	darfZu?: () => boolean;
	/** Weitere Bereiche (CSS-Selektor), aus denen der Finger nicht zieht */
	ausnahmen?: string;
}

export function herunterziehen(o: HerunterziehenOptionen): (blatt: HTMLElement) => () => void;
