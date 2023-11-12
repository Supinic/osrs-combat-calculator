import * as definitions from "./modifiers/index";
import Modifier from "./modifiers/template";
import { Actor, Vertex } from "./Actor";

export type Context = {
    attacker: Actor;
    defender: Actor;
    vertex: Vertex;
};

/*
const modifierTargets = [
    "accuracy", // modifyAccuracy
    "attackLevel", // modifyEffectiveAttackLevel
    "attackBonus", // modifyPlayerBonus
    "strengthLevel", // modifyEffectiveStrengthLevel
    "strengthBonus", // (not used previously)
    "attackRoll", // modifyPlayerBonus
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

    determineBaseMaxHit () {
        for (const modifier of this.#list) {
            if (typeof modifier.baseMaxHit === "function") {
                return modifier.baseMaxHit(this.#context);
            }
        }

        return null;
    }
};
