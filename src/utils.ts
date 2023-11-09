type Entries<T> = { [K in keyof T]: [K, T[K]] }[keyof T];

export function typeEntries<T extends object>(t: T): Entries<T>[] {
    return Object.entries(t) as Entries<T>[];
}
