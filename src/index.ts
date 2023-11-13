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

    const baseAtk = attacker.getAttackValues(vertex);
    const baseDef = defender.getDefendValues(vertex);
    const atk = modifiers.modifyAttackValues(baseAtk);
    const def = modifiers.modifyDefendValues(baseDef);

    const baseAttackRoll = utils.generalAccuracyFormula(atk.attack.level + atk.attack.stance, atk.attack.bonus);
    const baseDefendRoll = utils.generalAccuracyFormula(def.level, def.bonus);
    const attackRoll = modifiers.modifyAttackRoll(baseAttackRoll);
    const defendRoll = modifiers.modifyDefendRoll(baseDefendRoll);

    const baseAccuracy = utils.compareAccuracyRolls(attackRoll, defendRoll);
    const accuracy = modifiers.modifyAccuracy(baseAccuracy);

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

    maxHit += modifiers.getFlatMaxHitBonus();
    maxHit = modifiers.modifyMaxHit(maxHit);

    const baseTracker = HitTracker.createBasicDistribution(accuracy, maxHit);
    const tracker = modifiers.modifyDamageDistribution(baseTracker);

    const averageDamage = tracker.getAverageDamage();
    const dps = averageDamage / atk.speed / 0.6;
    return {
        defendRoll,
        attackRoll,
        accuracy: tracker.getAccuracy(),
        averageDamage,
        dps,
        maxHit: tracker.getMaxHitData()
    };
}
