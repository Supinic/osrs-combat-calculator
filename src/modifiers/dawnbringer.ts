import Modifier from "./template";

const VERZIK_P1_COMBAT_LEVEL = [425, 1040];

/**
 * Source:
 * https://oldschool.runescape.wiki/w/Dawnbringer
 * Unlike regular powered staves, Dawnbringer's damage or accuracy against Verzik Vitur's first form isn't affected
 * by accuracy or damage-boosting items. The staff always has 100% accuracy as it ignores accuracy rolls.
 * This means the player will still be able to hit Verzik with Dawnbringer even below -65 magic accuracy.
 *
 * Summary:
 * Dawnbringer ignores all accuracy and damage bonuses from the attacker's gear or prayers.
 * The base damage (and final damage as a result) is determined by the boosted magic level alone.
 */
export const DawnbringerModifier: Modifier = {
    accuracy () {
        return 1;
    },

    attackBonus () {
        return 0;
    },

    strengthBonus () {
        return 0;
    },

    baseMaxHit (context) {
        const { magic } = context.attacker.boostedLevels;
        return Math.floor(magic / 6) - 1;
    },

    // specialAttack (baseHitTracker) {
    //
    // },

    isApplied (context) {
        const { attacker, defender, vertex } = context;
        if (vertex.type !== "Magic") {
            return false;
        }
        else if (defender.name !== "Verzik Vitur") {
            return false;
        }
        else if (!VERZIK_P1_COMBAT_LEVEL.includes(defender.combatLevel)) {
            return false;
        }

        const weapon = attacker.equipment.weapon?.name;
        return (weapon === "Dawnbringer");
    }
}
