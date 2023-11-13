import { Context } from "../Modifiers";
import { HitTracker } from "../HitTracker";
// import { SpecialHitTracker } from "../SpecialHitTracker";

export default interface TemplateModifier {
    accuracy?: (acc: number, context: Context) => number;
    attackLevel?: (level: number, context: Context) => number;
    attackBonus?: (bonus: number, context: Context) => number;
    strengthLevel?: (level: number, context: Context) => number;
    strengthBonus?: (bonus: number, context: Context) => number;
    defenceLevel?: (level: number, context: Context) => number;
    defenceBonus?: (bonus: number, context: Context) => number;
    attackRoll?: (roll: number, context: Context) => number;
    defendRoll?: (roll: number, context: Context) => number;
    maxHit?: (maxHit: number, context: Context) => number;
    flatMaxHitBonus?: (context: Context) => number;
    baseMaxHit?: (context: Context) => number;
    attackSpeed?: (speed: number, context: Context) => number;
    damageDistribution?: (tracker: HitTracker, context: Context) => HitTracker;

    // specialAttack?: (baseTracker: HitTracker, context: Context) => SpecialHitTracker;

    isApplied: (context: Context) => boolean;
}
