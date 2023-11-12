import spells from "./game-data/spells.json";

import { Bonuses, BonusList } from "./Bonuses";
import { InputSlot, Slot, Equipment, Definition as EquipmentDefinition } from "./Equipment";
import applyBoosts, { BoostName } from "./Boosts";
import getPrayerMultipliers, { PrayerName } from "./Prayers";

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

export type Attribute = "dragon"
    | "fiery" | "spectral" | "kalphite"
    | "vampyre" | "demon" | "shade" | "leafy"
    | "undead" | "penance" | "xerician"

export type ActorData = {
    id?: number;
    name?: string;
    size?: number;
    equipment?: Partial<Record<InputSlot, EquipmentDefinition>>,
    levels?: Partial<Levels>;
    baseBonuses?: BonusList;
    prayers?: Iterable<PrayerName>;
    boosts?: Iterable<BoostName>;
    attributes?: Iterable<Attribute>;
};

export type SpellName = keyof typeof spells;
export type Vertex = {
    class: "Melee" | "Ranged" | "Magic";
    style: "Accurate" | "Aggressive" | "Controlled" | "Defensive" | "Rapid" | "Longrange";
    type: "Slash" | "Stab" | "Crush" | "Ranged" | "Magic" | "Spell";
    spell: SpellName | null;
};

export class Actor {
    #id: number;
    #name: string;
    #size: number;

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
    #baseBonuses = new Bonuses();
    #totalBonuses: Bonuses;

    #boosts: Set<BoostName> = new Set();
    #prayers: Set<PrayerName> = new Set();
    #attributes: Set<Attribute> = new Set();
    #flags: Flags = {};

    constructor (data: ActorData) {
        this.#id = data.id ?? -1;
        this.#name = data.name ?? "Combatant";
        this.#size = data.size ?? 1;

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
        if (data.attributes) {
            this.#attributes = new Set(data.attributes);
        }
    }

    getAttackValues (vertex: Vertex) {
        let speed = this.#equipment.weapon?.speed ?? Equipment.fallbackWeaponSpeed;
        const accuracy = {
            level: 0,
            bonus: 0,
            stance: 0
        };
        const strength = {
            level: 0,
            bonus: 0,
            stance: 0
        };

        const boostedLevels = applyBoosts(this.#levels, this.#boosts);
        const prayerMultipliers = getPrayerMultipliers(this.#prayers);

        if (vertex.class === "Melee") {
            accuracy.stance = 8;
            strength.stance = 8;

            if (vertex.style === "Accurate") {
                accuracy.stance += 3;
            }
            else if (vertex.style === "Controlled") {
                accuracy.stance += 1;
                strength.stance += 1;
            }
            else if (vertex.style === "Aggressive") {
                strength.stance += 3;
            }

            accuracy.level = Math.floor(boostedLevels.attack * prayerMultipliers.attack);
            strength.level = Math.floor(boostedLevels.strength * prayerMultipliers.strength);

            if (vertex.type === "Stab") {
                accuracy.bonus = this.totalBonuses.stabAttack;
            }
            else if (vertex.type === "Slash") {
                accuracy.bonus = this.totalBonuses.slashAttack;
            }
            else if (vertex.type === "Crush") {
                accuracy.bonus = this.totalBonuses.crushAttack;
            }

            strength.bonus = this.totalBonuses.strength;
        }
        else if (vertex.class === "Ranged") {
            accuracy.stance = 8;
            strength.stance = 8;

            if (vertex.style === "Accurate") {
                accuracy.stance += 3;
            }
            else if (vertex.style === "Rapid") {
                speed -= 1;
            }

            accuracy.level = Math.floor(boostedLevels.ranged * prayerMultipliers.rangedAttack);
            strength.level = Math.floor(boostedLevels.ranged * prayerMultipliers.rangedStrength);

            accuracy.bonus = this.totalBonuses.rangedAttack;
            strength.bonus = this.totalBonuses.rangedStrength;
        }
        else if (vertex.class === "Magic") {
            accuracy.stance = 9;
            strength.stance = 0;

            if (!vertex.spell && vertex.style === "Accurate") {
                accuracy.stance += 2;
            }
            else if (vertex.spell) {
                speed = 5;
            }

            accuracy.level = Math.floor(boostedLevels.magic * prayerMultipliers.magicAttack);
            strength.level = 0; // Magic level does not provide any inherent bonus to magic damage

            accuracy.bonus = this.totalBonuses.magicAttack;
            strength.bonus = this.totalBonuses.magicStrength;
        }
        else {
            throw new Error(`Invalid vertex class: ${vertex.class}`);
        }

        return {
            accuracy,
            strength,
            speed
        };
    }

    getDefendValues (vertex: Vertex) {
        const boostedLevels = applyBoosts(this.levels, this.boosts);
        const prayerMultipliers = getPrayerMultipliers(this.prayers);

        let base;
        let bonus;
        if (vertex.type === "Magic" || vertex.type === "Spell") {
            bonus = this.totalBonuses.magicDefence;
            base = Math.floor(boostedLevels.magic * prayerMultipliers.magicDefence) + 9;
        }
        else {
            switch (vertex.type) {
                case "Stab": bonus = this.totalBonuses.stabDefence; break;
                case "Slash": bonus = this.totalBonuses.slashDefence; break;
                case "Crush": bonus = this.totalBonuses.crushDefence; break;
                case "Ranged": bonus = this.totalBonuses.rangedDefence; break;
            }

            base = Math.floor(boostedLevels.defence * prayerMultipliers.defence) + 9;
        }

        return {
            base,
            bonus
        };
    }

    get totalBonuses () { return this.#totalBonuses; }
    get boosts () { return this.#boosts; }
    get equipment () { return this.#equipment; }
    get attributes () { return this.#attributes; }
    get prayers () { return this.#prayers; }
    get levels () { return this.#levels; }
    get flags () { return this.#flags; }
    get size () { return this.#size; }
    get id () { return this.#id; }
    get name () { return this.#name; }
}
