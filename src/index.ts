import spells from "./game-data/spells.json";

import * as utils from "./utils";
import { HitTracker } from "./HitTracker";
import { Actor, ActorData, Vertex } from "./Actor";

type Input = {
    attacker: ActorData;
    defender: ActorData;
    vertex: Vertex;
};

export function calculate (options: Input) {
    const attacker = new Actor(options.attacker);
    const defender = new Actor(options.defender);

    const { vertex } = options;
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
            maxHit = 0; // @todo generic magic max hit
        }
    }
    else {
        maxHit = utils.generalMaxHitFormula(atk.strength.level + atk.strength.stance, atk.strength.bonus);
    }

    const ht = HitTracker.createBasicDistribution(accuracy, maxHit);
    const averageDamage = ht.getAverageDamage();
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
