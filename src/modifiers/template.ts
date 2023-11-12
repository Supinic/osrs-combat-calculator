import { Context } from "../Modifiers";
import { HitTracker } from "../HitTracker";

type CombatValues = {
    tracker: HitTracker;
    accuracy: number;
    maxHit: number;
};

export default interface TemplateModifier {
    accuracy?: (acc: number, context: Context) => number;
    attackLevel?: (level: number, context: Context) => number;
    attackBonus?: (bonus: number, context: Context) => number;
    strengthLevel?: (level: number, context: Context) => number;
    strengthBonus?: (bonus: number, context: Context) => number;
    attackRoll?: (roll: number, context: Context) => number;
    defendRoll?: (roll: number, context: Context) => number;
    maxHit?: (maxHit: number, context: Context) => number;
    flatMaxHitBonus?: (extraMaxHit: number, context: Context) => number;
    baseMaxHit?: (context: Context) => number;
    attackSpeed?: (speed: number, context: Context) => number;
    damageDistribution?: (values: CombatValues, context: Context) => number;

    isApplied: (context: Context) => boolean;
}
