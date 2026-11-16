/** In die Zwischenablage; ein Versprechen geht auch (Safari: Inhalt, der noch entsteht). Wirft, wenn es nicht geht. */
export declare function inZwischenablage(inhalt: string | Promise<string>): Promise<void>;
/** Kann das Gerät teilen (Teilen-Menü)? */
export declare function teilenGeht(): boolean;
/** Kann das Gerät so eine Datei teilen? */
export declare function dateiTeilenGeht(name: string, typ: string): boolean;
/** Datei ins Teilen-Menü – ohne `await` davor aufrufen (Safari) */
export declare function teilenDatei(datei: File, titel: string): Promise<void>;
/** Kopieren und Teilen mit dem Hinweis der App */
export declare function weitergebenMit(zeigeHinweis: (text: string) => void): {
	/** Kopieren mit Hinweis „<was> kopiert“; geht es nicht, `feld` markieren. → ob kopiert wurde */
	kopieren(inhalt: string, was: string, feld?: HTMLElement): Promise<boolean>;
	/** Teilen-Menü öffnen; ohne Teilen kopieren */
	teilen(daten: { url?: string; text?: string; title?: string }, was?: string): Promise<void>;
};
