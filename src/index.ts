import spells from "./game-data/spells.json";

import * as utils from "./utils";
import { HitTracker } from "./HitTracker";
import { Actor, ActorData, Vertex } from "./Actor";
import ModifierManager from "./Modifiers";

type Input = {
    attacker: ActorData;
    defender: ActorData;
    vertex: Vertex;
};

export function calculate (options: Input) {
    const attacker = new Actor(options.attacker);
    const defender = new Actor(options.defender);

    const { vertex } = options;
    const modifiers = new ModifierManager(attacker, defender, vertex);

    const atk = attacker.getAttackValues(vertex);
    const def = defender.getDefendValues(vertex);

    const defendRoll = utils.generalAccuracyFormula(def.base, def.bonus);
    const attackRoll = utils.generalAccuracyFormula(atk.accuracy.level + atk.accuracy.stance, atk.accuracy.bonus);
    const accuracy = utils.compareAccuracyRolls(attackRoll, defendRoll);

    let maxHit: number;
    if (vertex.type === "Magic" || vertex.type === "Spell") {
        if (vertex.spell) {
            maxHit = spells[vertex.spell].maxHit;
        }
        else {
            const baseMaxHit = modifiers.determineBaseMaxHit();
            if (baseMaxHit === null) {
                throw new Error("No base max hit determined");
            }

            maxHit = baseMaxHit;
        }
    }
    else {
        maxHit = utils.generalMaxHitFormula(atk.strength.level + atk.strength.stance, atk.strength.bonus);
    }

    const tracker = HitTracker.createBasicDistribution(accuracy, maxHit);
    const averageDamage = tracker.getAverageDamage();
    const dps = averageDamage / atk.speed / 0.6;

    return {
        defendRoll,
        attackRoll,
        accuracy,
        maxHit, // @todo make sure to re-check the resulting HitTracker's maxHit
        averageDamage,
        dps
    };
}
