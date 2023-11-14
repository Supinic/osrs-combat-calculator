import Modifier from "./template";
import { HitTracker } from "../HitTracker";

const scytheHitsFormulas = [
    (dmg: number) => [dmg],
    (dmg: number) => [dmg, Math.floor(dmg / 2)],
    (dmg: number) => [dmg, Math.floor(dmg / 2), Math.floor(dmg / 4)],
];

export const ScytheModifier: Modifier = {
    damageDistribution (combatValues, context) {
        let hitFormula;
        const { defender } = context;

        if (defender.size === 2) {
            hitFormula = scytheHitsFormulas[1];
        }
        else if (defender.size >= 3) {
            hitFormula = scytheHitsFormulas[2];
        }
        else {
            hitFormula = scytheHitsFormulas[0];
        }

        const acc = combatValues.accuracy;
        const maxHit = combatValues.maxHit;
        const scytheTracker = new HitTracker(acc);
        for (let dmg = 0; dmg <= maxHit; dmg++) {
            const hits = hitFormula(dmg);
            scytheTracker.storeMultiple(hits, (acc / (maxHit + 1)));
        }

        combatValues.tracker = scytheTracker;

        return combatValues;
    },

    isApplied (context) {
        const { attacker, vertex } = context;
        if (vertex.class !== "Melee") {
            return false;
        }

        return attacker.checkEquipmentNames({
            weapon: /scythe of vitur/i
        });
    }
}
