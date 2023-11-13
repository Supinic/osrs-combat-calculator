import Modifier from "./template";
import { HitTracker } from "../HitTracker";

// Ahrim's set effect: 25% chance to raise your max hit by 30%
const procChance = 0.25;
const normalChance = (1 - procChance);

export const AhrimsSetModifier: Modifier = {
    damageDistribution (combatValues) {
        const m1 = combatValues.maxHit;
        const m2 = Math.floor(m1 * 1.30);
        const acc = combatValues.accuracy;

        const ahrimsTracker = new HitTracker(acc);
        for (let dmg = 0; dmg <= m1; dmg++) {
            ahrimsTracker.storeSingle(dmg, normalChance * acc / (m1 + 1));
        }
        for (let dmg = 0; dmg <= m2; dmg++) {
            ahrimsTracker.storeSingle(dmg, procChance * acc / (m2 + 1));
        }

        combatValues.tracker = ahrimsTracker;
        combatValues.maxHit = m1;
        combatValues.maxHitProc = m2;

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
