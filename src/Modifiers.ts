import * as definitions from "./modifiers/index";
import Modifier from "./modifiers/template";
import { Actor, AttackValues, DefendValues, Vertex } from "./Actor";
import { CombatValues } from "./index";

export type Context = {
    attacker: Actor;
    defender: Actor;
    vertex: Vertex;
};

/*
const modifierTargets = [
    "accuracy", // changeAttackRoll
    "attackLevel", // modifyEffectiveAttackLevel
    "attackBonus", // modifyPlayerBonus
    "strengthLevel", // modifyEffectiveStrengthLevel
    "strengthBonus", // (not used previously)
    "attackRoll", // modifyAccuracy
    "defendRoll", // modifyNpcDefenceRoll
    "maxHit", // modifyMaxHit
    "baseMaxHit", // determineBaseMaxHit
    "flatMaxHitBonus", // getFlatMaxHitBonus
    "attackSpeed", // modifyAttackSpeed
    "damageDistribution" // applyModifier
] as const;
*/

export default class ModifierManager {
    #context: Context;
    #list: Set<Modifier> = new Set();

    constructor (attacker: Actor, defender: Actor, vertex: Vertex) {
        this.#context = { attacker, defender, vertex };

        for (const modifier of Object.values(definitions)) {
            if (!modifier.isApplied(this.#context)) {
                continue;
            }

            this.#list.add(modifier);
        }
    }

    modifyAttackValues (atk: Readonly<AttackValues>): AttackValues {
        const result: AttackValues = {
            attack: { ...atk.attack },
            strength: { ...atk.strength },
            speed: atk.speed
        };

        for (const modifier of this.#list) {
            if (typeof modifier.attackLevel === "function") {
                result.attack.level = modifier.attackLevel(result.attack.level, this.#context);
            }
            if (typeof modifier.attackBonus === "function") {
                result.attack.bonus = modifier.attackBonus(result.attack.bonus, this.#context);
            }
            if (typeof modifier.strengthLevel === "function") {
                result.strength.bonus = modifier.strengthLevel(result.strength.level, this.#context);
            }
            if (typeof modifier.strengthBonus === "function") {
                result.strength.bonus = modifier.strengthBonus(result.strength.bonus, this.#context);
            }
            if (typeof modifier.attackSpeed === "function") {
                result.speed = modifier.attackSpeed(result.speed, this.#context);
            }
        }

        return result;
    }

    modifyDefendValues (def: Readonly<DefendValues>): DefendValues {
        const result: DefendValues = {
            level: def.level,
            bonus: def.bonus
        };

        for (const modifier of this.#list) {
            if (typeof modifier.defenceLevel === "function") {
                result.level = modifier.defenceLevel(result.level, this.#context);
            }
            if (typeof modifier.defenceBonus === "function") {
                result.bonus = modifier.defenceBonus(result.bonus, this.#context);
            }
        }

        return result;
    }

    modifyAttackRoll (roll: number): number {
        for (const modifier of this.#list) {
            if (typeof modifier.attackRoll === "function") {
                roll = modifier.attackRoll(roll, this.#context);
            }
        }

        return roll;
    }

    modifyDefendRoll (roll: number): number {
        for (const modifier of this.#list) {
            if (typeof modifier.defendRoll === "function") {
                roll = modifier.defendRoll(roll, this.#context);
            }
        }

        return roll;
    }

    modifyAccuracy (accuracy: number): number {
        for (const modifier of this.#list) {
            if (typeof modifier.accuracy === "function") {
                accuracy = modifier.accuracy(accuracy, this.#context);
            }
        }

        return accuracy;
    }

    modifyMaxHit (maxHit: number): number {
        for (const modifier of this.#list) {
            if (typeof modifier.maxHit === "function") {
                maxHit = modifier.maxHit(maxHit, this.#context);
            }
        }

        return maxHit;
    }

    modifyDamageDistribution (combatValues: CombatValues): CombatValues {
        let result = combatValues;
        for (const modifier of this.#list) {
            if (typeof modifier.damageDistribution === "function") {
                result = modifier.damageDistribution(combatValues, this.#context);
            }
        }

        return result;
    }

    getFlatMaxHitBonus (): number {
        let bonus = 0;
        for (const modifier of this.#list) {
            if (typeof modifier.flatMaxHitBonus === "function") {
                bonus += modifier.flatMaxHitBonus(this.#context);
            }
        }

        return bonus;
    }

    determineBaseMaxHit () {
        for (const modifier of this.#list) {
            if (typeof modifier.baseMaxHit === "function") {
                return modifier.baseMaxHit(this.#context);
            }
        }

        return null;
    }
};
