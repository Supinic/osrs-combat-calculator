import { Bonuses, BonusList } from "./Bonuses";
import { InputSlot, Slot, Equipment, Definition as EquipmentDefinition } from "./Equipment";
import { BoostName } from "./Boosts";
import { PrayerName } from "./Prayers";

type Level = number;
export type Levels = {
    hitpoints: Level;
    attack: Level;
    strength: Level;
    defence: Level;
    magic: Level;
    ranged: Level;
    prayer: Level;
    mining: Level;
};

export type EquipmentDescriptor = Record<Slot, Equipment | null>;
export type Flags = Record<string, boolean>;

export type ActorData = {
    equipment?: Partial<Record<InputSlot, EquipmentDefinition>>,
    levels?: Partial<Levels>;
    baseBonuses?: BonusList;
    prayers?: Iterable<PrayerName>;
    boosts?: Iterable<BoostName>;
};

export type AttackData = {
    vertex: "Melee" | "Ranged" | "Magic";
    style: "Accurate" | "Aggressive" | "Controlled" | "Defensive" | "Rapid" | "Longrange";
    type: "Slash" | "Stab" | "Crush" | "Ranged" | "Magic" | "Spell";
    spell: string | null;
};

export class Actor {
    #name: string;
    #equipment: EquipmentDescriptor = {
        head: null,
        neck: null,
        cape: null,
        ammo: null,
        body: null,
        legs: null,
        hands: null,
        feet: null,
        weapon: Equipment.createUnarmedSlot(),
        shield: null,
        ring: null
    };
    #levels: Levels = {
        hitpoints: 1,
        attack: 1,
        strength: 1,
        defence: 1,
        magic: 1,
        ranged: 1,
        prayer: 1,
        mining: 1
    };
    #baseBonuses: Bonuses = new Bonuses();
    #totalBonuses: Bonuses;

    #boosts: Set<BoostName> = new Set(); //Boosts;
    #prayers: Set<PrayerName> = new Set(); // Prayers;
    #flags: Flags = {};

    constructor (name: string, data: ActorData) {
        this.#name = name;
        if (data.equipment) {
            for (const definition of Object.values(data.equipment)) {
                const equipment = new Equipment(definition);
                this.#equipment[equipment.slot] = equipment;
            }
        }

        if (data.levels) {
           this.#levels = {
               ...this.#levels,
               ...data.levels
           };
        }

        if (data.baseBonuses) {
            this.#baseBonuses = new Bonuses(data.baseBonuses);
        }

        this.#totalBonuses = new Bonuses();
        this.#totalBonuses.add(this.#baseBonuses);

        for (const item of Object.values(this.#equipment)) {
            if (item === null) {
                continue;
            }

            this.#totalBonuses.add(item.bonuses);
        }

        if (data.boosts) {
            this.#boosts = new Set(data.boosts);
        }
        if (data.prayers) {
            this.#prayers = new Set(data.prayers);
        }
    }

    get totalBonuses () { return this.#totalBonuses; }
    get boosts () { return this.#boosts; }
    get equipment () { return this.#equipment; }
    get prayers () { return this.#prayers; }
    get levels () { return this.#levels; }
    get flags () { return this.#flags; }
}
