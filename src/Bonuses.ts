type Bonus = number;
export type BonusList = [Bonus, Bonus, Bonus, Bonus, Bonus, Bonus, Bonus, Bonus, Bonus, Bonus, Bonus, Bonus, Bonus, Bonus];

export type BonusType = "stabAttack" | "slashAttack" | "crushAttack" | "magicAttack" | "rangedAttack"
    | "stabDefence" | "slashDefence" | "crushDefence" | "magicDefence" | "rangedDefence"
    | "strength" | "rangedStrength" | "magicStrength"
    | "prayer";

const bonusIndex = {
    stabAttack: 0,
    slashAttack: 1,
    crushAttack: 2,
    magicAttack: 3,
    rangedAttack: 4,
    stabDefence: 5,
    slashDefence: 6,
    crushDefence: 7,
    magicDefence: 8,
    rangedDefence: 9,
    strength: 10,
    rangedStrength: 11,
    magicStrength: 12,
    prayer: 13
} as const;

export type BonusObject = Record<keyof typeof bonusIndex, number>;

export class Bonuses {
    #list: BonusList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    constructor (input?: BonusList) {
        if (input) {
            this.#list = [...input];
        }
    }

    toArray (): BonusList {
        return [...this.#list];
    }

    add (bonuses: Bonuses) {
        for (let i = 0; i < this.#list.length; i++) {
            this.#list[i] += bonuses.#list[i];
        }
    }

    get stabAttack () { return this.#list[0]; }
    get slashAttack () { return this.#list[1]; }
    get crushAttack () { return this.#list[2]; }
    get magicAttack () { return this.#list[3]; }
    get rangedAttack () { return this.#list[4]; }

    get stabDefence () { return this.#list[5]; }
    get slashDefence () { return this.#list[6]; }
    get crushDefence () { return this.#list[7]; }
    get magicDefence () { return this.#list[8]; }
    get rangedDefence () { return this.#list[9]; }

    get strength () { return this.#list[10]; }
    get rangedStrength () { return this.#list[11]; }
    get magicStrength () { return this.#list[12]; }

    get prayer () { return this.#list[13]; }

    static fromObject (data: Partial<BonusObject>): BonusList {
        const result = Bonuses.getEmptyList();
        for (const [untypedStat, value] of Object.entries(data)) {
            const stat = untypedStat as keyof BonusObject;
            const index = bonusIndex[stat];
            result[index] = value;
        }

        return result;
    }

    static getEmptyList (): BonusList {
        return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
}
