// Gesten für Klicktests (Playwright): wischen, lange drücken, tippen, am Griff ziehen, zoomen.
// Chromium: echte Touch-Ereignisse über CDP (der Browser entscheidet selbst, ob er scrollt);
// WebKit: Zeigerereignisse wie vom Finger nachgespielt (ohne echtes Scrollen). Typen: wischen.d.ts

/**
 * Bis der Übergang nach einem Seitenwechsel durch ist (lib/ui/uebergang.ts, knapp 0,3 s): Solange
 * nimmt das Bild des Übergangs alle Berührungen an, nicht die Seite darunter
 */
export async function uebergangAbwarten(page) {
	await page.waitForFunction(() =>
		document
			.getAnimations()
			.every((a) => !String(a.effect?.pseudoElement ?? '').startsWith('::view-transition'))
	);
}
/** Finger rechts auf die Zeile legen und um dx/dy ziehen, dann loslassen */
export async function wischen(page, zeile, dx, dy = 0, schritte = 10) {
	await uebergangAbwarten(page);
	const box = await zeile.boundingBox();
	if (!box) throw new Error('Zeile nicht sichtbar');
	const x = Math.round(box.x + box.width * 0.9);
	const y = Math.round(box.y + box.height / 2);
	const punkt = (i) => ({
		x: Math.round(x + (dx * i) / schritte),
		y: Math.round(y + (dy * i) / schritte)
	});
	if (page.context().browser()?.browserType().name() === 'chromium') {
		const cdp = await page.context().newCDPSession(page);
		const beruehren = (type, punkte) =>
			cdp.send('Input.dispatchTouchEvent', {
				type: type,
				touchPoints: punkte.map((p) => ({ ...p, id: 1 }))
			});
		await beruehren('touchStart', [punkt(0)]);
		for (let i = 1; i <= schritte; i++) await beruehren('touchMove', [punkt(i)]);
		await beruehren('touchEnd', []);
		await cdp.detach();
		// Wie ein Mensch kurz absetzen: Ein Tippen direkt nach einer Geste wertet Chromium als
		// „Geste stoppen“ und schickt keinen Klick
		await page.waitForTimeout(400);
		return;
	}
	const wege = Array.from({ length: schritte + 1 }, (_, i) => punkt(i));
	await page.evaluate((wege) => {
		const ziel = document.elementFromPoint(wege[0].x, wege[0].y);
		if (!ziel) throw new Error('Nichts unter dem Finger');
		const senden = (typ, p) =>
			ziel.dispatchEvent(
				new PointerEvent(typ, {
					pointerId: 7,
					pointerType: 'touch',
					isPrimary: true,
					clientX: p.x,
					clientY: p.y,
					bubbles: true,
					cancelable: true
				})
			);
		senden('pointerdown', wege[0]);
		for (const p of wege.slice(1)) senden('pointermove', p);
		senden('pointerup', wege[wege.length - 1]);
	}, wege);
	// Wie in Chromium kurz absetzen: Was nach der Geste zurückgleitet (Zeile, Blatt), steht dann
	// wieder an seinem Platz – sonst träfe die nächste Geste die falsche Stelle
	await page.waitForTimeout(400);
}
/** Finger lange (0,7 s) auf die Mitte legen, ohne zu bewegen – öffnet das Menü einer Zeile */
export async function langDruecken(page, ziel) {
	await uebergangAbwarten(page);
	const box = await ziel.boundingBox();
	if (!box) throw new Error('Nicht sichtbar');
	const p = { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
	if (page.context().browser()?.browserType().name() === 'chromium') {
		const cdp = await page.context().newCDPSession(page);
		await cdp.send('Input.dispatchTouchEvent', {
			type: 'touchStart',
			touchPoints: [{ ...p, id: 1 }]
		});
		await page.waitForTimeout(700);
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
		await cdp.detach();
	} else {
		await page.evaluate(async (p) => {
			const ziel = document.elementFromPoint(p.x, p.y);
			if (!ziel) throw new Error('Nichts unter dem Finger');
			const senden = (typ) =>
				ziel.dispatchEvent(
					new PointerEvent(typ, {
						pointerId: 8,
						pointerType: 'touch',
						isPrimary: true,
						clientX: p.x,
						clientY: p.y,
						bubbles: true,
						cancelable: true
					})
				);
			senden('pointerdown');
			await new Promise((fertig) => setTimeout(fertig, 700));
			senden('pointerup');
		}, p);
	}
	await page.waitForTimeout(400);
}
/** Mit dem Finger auf die Mitte eines Elements tippen (mit kurzer Pause davor, sonst ist es ein
 * Doppeltippen) */
export async function antippen(page, ziel) {
	await uebergangAbwarten(page);
	await page.waitForTimeout(400);
	const box = await ziel.boundingBox();
	if (!box) throw new Error('Nicht sichtbar');
	await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}
/**
 * Am Griff (SortierListe) ziehen und knapp über dem Griff `ueber` loslassen – mit der Maus oder mit
 * dem Finger (nur Chromium: Berührungen über CDP). Ohne `touch-action: none` am Griff würde der
 * Browser beim Finger scrollen und das Ziehen abbrechen.
 */
export async function amGriffZiehen(page, griff, ueber, mit = 'maus') {
	await uebergangAbwarten(page);
	const a = await griff.boundingBox();
	const b = await ueber.boundingBox();
	if (!a || !b) throw new Error('Griff nicht sichtbar');
	const x = a.x + a.width / 2;
	const y = a.y + a.height / 2;
	const ziel = b.y + b.height / 2 - 12;
	if (mit === 'maus') {
		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x, ziel, { steps: 12 });
		await page.mouse.up();
		return;
	}
	const cdp = await page.context().newCDPSession(page);
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
	for (let i = 1; i <= 12; i++) {
		await cdp.send('Input.dispatchTouchEvent', {
			type: 'touchMove',
			touchPoints: [{ x, y: y + ((ziel - y) * i) / 12 }]
		});
	}
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
	await cdp.detach();
}
/** Zwei Finger um die Mitte des Elements auseinander (faktor > 1) oder zusammen ziehen */
export async function zweiFingerZoom(page, ziel, faktor, schritte = 10) {
	await uebergangAbwarten(page);
	const box = await ziel.boundingBox();
	if (!box) throw new Error('Nicht sichtbar');
	const mx = Math.round(box.x + box.width / 2);
	const my = Math.round(box.y + box.height / 2);
	const finger = (i) => {
		const d = 40 * (1 + ((faktor - 1) * i) / schritte);
		return [
			{ x: Math.round(mx - d), y: my, id: 1 },
			{ x: Math.round(mx + d), y: my, id: 2 }
		];
	};
	if (page.context().browser()?.browserType().name() === 'chromium') {
		const cdp = await page.context().newCDPSession(page);
		const beruehren = (type, touchPoints) =>
			cdp.send('Input.dispatchTouchEvent', { type: type, touchPoints });
		await beruehren('touchStart', finger(0));
		for (let i = 1; i <= schritte; i++) await beruehren('touchMove', finger(i));
		await beruehren('touchEnd', []);
		await cdp.detach();
		await page.waitForTimeout(400);
		return;
	}
	const wege = Array.from({ length: schritte + 1 }, (_, i) => finger(i));
	await page.evaluate((wege) => {
		const ziel = document.elementFromPoint(wege[0][0].x, wege[0][0].y);
		if (!ziel) throw new Error('Nichts unter den Fingern');
		const senden = (typ, p) =>
			ziel.dispatchEvent(
				new PointerEvent(typ, {
					pointerId: 10 + p.id,
					pointerType: 'touch',
					isPrimary: p.id === 1,
					clientX: p.x,
					clientY: p.y,
					bubbles: true,
					cancelable: true
				})
			);
		for (const p of wege[0]) senden('pointerdown', p);
		for (const schritt of wege.slice(1)) for (const p of schritt) senden('pointermove', p);
		for (const p of wege[wege.length - 1]) senden('pointerup', p);
	}, wege);
	await page.waitForTimeout(400);
}
