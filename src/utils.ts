type Entries<T> = { [K in keyof T]: [K, T[K]] }[keyof T];

export function typeEntries<T extends object>(t: T): Entries<T>[] {
    return Object.entries(t) as Entries<T>[];
}

export function generalAccuracyFormula (a: number, b: number) {
    return a * (b + 64);
}

export function generalMaxHitFormula (a: number, b: number) {
    return Math.floor(0.5 + a * (b + 64) / 640);
}
