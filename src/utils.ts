export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export function generalAccuracyFormula (a: number, b: number) {
    return a * (b + 64);
}

export function generalMaxHitFormula (a: number, b: number) {
    return Math.floor(0.5 + a * (b + 64) / 640);
}

export function compareAccuracyRolls (atk: number, def: number) {
    if (atk > def) {
        return Math.max(0, Math.min(1, 1 - (def + 2) / (2 * (atk + 1))));
    }
    else {
        return Math.max(0, Math.min(1, atk / (2 * (def + 1))));
    }
}

export function round (num: number, places: number) {
    return Math.trunc(num * (10 ** places)) / (10 ** places);
}
