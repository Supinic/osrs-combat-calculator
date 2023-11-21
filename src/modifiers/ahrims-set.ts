import Modifier from "./template";
import { HitTracker } from "../HitTracker";

/**
 * Ahrim's regular set effect:
 * Not simulated: Magic attacks have a 25% chance of lowering the enemy's Strength by five levels repeatedly.
 *
 * Ahrim's enhanced set effect:
 * Not simulated: Allows player to autocast Ancient Magicks.
 * Simulated: 25% chance for any combat spell to deal a hit with 30% increased damage
 */
const procChance = 0.25;
const normalChance = (1 - procChance);

export const AhrimsSetModifier: Modifier = {
    damageDistribution (combatValues) {
        const maxHit = combatValues.maxHit;
        const acc = combatValues.accuracy;
        const ahrimsTracker = new HitTracker(acc);

        for (let dmg = 0; dmg <= maxHit; dmg++) {
            ahrimsTracker.store(dmg, normalChance * acc / (maxHit + 1));
            ahrimsTracker.store(Math.floor(dmg * 1.30), procChance * acc / (maxHit + 1));
        }

        combatValues.tracker = ahrimsTracker;
        combatValues.maxHit = maxHit;
        combatValues.maxHitProc = Math.floor(maxHit * 1.30);

        return combatValues;
    },

    isApplied (context) {
        const { attacker, vertex } = context;
        if (!vertex.spell) {
            return false; // Ahrim's set effects only applies while spell-casting (no powered staves)
        }

        return attacker.checkEquipmentNames({
            neck: /^Amulet of the damned/,
            body: /^Ahrim's robetop/,
            legs: /^Ahrim's robeskirt/,
            head: /^Ahrim's hood/,
            weapon: /^Ahrim's staff/,
        });
    }
}
