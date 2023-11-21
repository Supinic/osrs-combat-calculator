import Modifier from "./template";
import { HitTracker } from "../HitTracker";

const procChance = 0.10;
const normalChance = (1 - procChance);
const accuracyBonus = 0.50;

export const Leagues4MeleeRelicModifier: Modifier = {
    attackSpeed (speed) {
        if (speed >= 4) {
            return Math.floor(speed / 2);
        }
        else {
            return Math.ceil(speed / 2);
        }
    },

    attackRoll (roll) {
        return Math.floor(roll * (1 + accuracyBonus));
    },

    damageDistribution (combatValues) {
        const { maxHit, accuracy } = combatValues;
        const critStore = new HitTracker(accuracy);

        for (let dmg = 0; dmg <= maxHit; dmg++) {
            critStore.store(dmg, normalChance * accuracy / (maxHit + 1));
            critStore.store(dmg * 2, procChance * accuracy / (maxHit + 1));
        }

        combatValues.tracker = critStore;
        combatValues.maxHitProc = maxHit * 2;

        return combatValues;
    },

    isApplied (context) {
        const { attacker, vertex } = context;
        return (attacker.flags.has("leagues4-tier3-melee") && vertex.class === "Melee");
    }
}
