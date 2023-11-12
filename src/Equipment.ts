import { Bonuses, BonusList } from "./Bonuses";
import AttackStyles from "./game-data/attack-styles.json";

const slots = ["cape", "head", "neck", "ammo", "weapon", "shield", "body", "legs", "hands", "feet", "ring"] as const;

export type Slot = typeof slots[number];
export type InputSlot = Slot | "2h";

export type WeaponCategory = keyof (typeof AttackStyles);

type ArmourDefinition = {
    id: number;
    name: string;
    slot: Slot;
    bonuses: BonusList;
};
type WeaponDefinition = {
    id: number;
    name: string;
    bonuses: BonusList;
    slot: "2h" | "weapon";
    category: WeaponCategory;
    speed: number;
};
export type Definition = ArmourDefinition | WeaponDefinition;

const isWeapon = (data: Definition): data is WeaponDefinition => {
    return (data.slot === "2h" || data.slot === "weapon");
}

export class Equipment {
    #id: number;
    #name: string;
    #slot: Slot;
    #isTwoHanded: (boolean | null) = null;
    #category: (WeaponCategory | null) = null;
    #speed: (number | null) = null;

    #bonuses: Bonuses;

    constructor (data: Definition) {
        this.#id = data.id;
        this.#name = data.name;
        this.#bonuses = new Bonuses(data.bonuses);

        if (isWeapon(data)) {
            this.#slot = "weapon";
            this.#isTwoHanded = (data.slot === "2h");
            this.#category = data.category;
            this.#speed = data.speed;
        }
        else {
            this.#slot = data.slot;
        }
    }

    get id  () { return this.#id };
    get category  () { return this.#category };
    get name  () { return this.#name };
    get bonuses () { return this.#bonuses };
    get slot () { return this.#slot };
    get speed () { return this.#speed; }

    static createUnarmedSlot (): Equipment {
        return new Equipment({
            id: -1,
            name: "Unarmed",
            slot: "weapon",
            bonuses: Bonuses.getEmptyList(),
            category: "Unarmed",
            speed: 4
        });
    }

    static get fallbackWeaponSpeed () {
        return 4;
    }

    static isValidSlot (slot: string): slot is Slot {
        // @ts-ignore
        return slots.includes(slot);
    }
}
