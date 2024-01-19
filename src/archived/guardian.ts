import { Actor, ActorData, Vertex } from "../Actor";
import ModifierManager from "../Modifiers";
import * as utils from "../utils";
import { HitTracker } from "../HitTracker";

const defences = {
    stabDefence: {
        class: "Melee",
        type: "Stab"
    },
    slashDefence: {
        class: "Melee",
        type: "Slash"
    },
    crushDefence: {
        class: "Melee",
        type: "Crush"
    },
    magicDefence: {
        class: "Magic",
        type: "Magic"
    },
    rangedDefence: {
        class: "Ranged",
        type: "Ranged"
    }
} as const;

const MIN_HIT = 6;
const MAX_HIT = 15;
const ATTACK_SPEED = 5;
const ATTACK_ROLL = 45_000;

export function calculateGuardian (defenderData: ActorData) {
    const attacker = new Actor({});
    const defender = new Actor(defenderData);

    let worstDefence = Infinity;
    const vertex: Vertex = {
        spell: null,
        class: "Melee",
        type: "Crush",
        style: "Accurate"
    };

    for (const [rawType, values] of Object.entries(defences)) {
        const defenceType = rawType as (keyof typeof defences);
        if (worstDefence > defender.bonuses[defenceType]) {
            worstDefence = defender.bonuses[defenceType];
            vertex.class = values.class;
            vertex.type = values.type;
        }
    }

    const modifiers = new ModifierManager(attacker, defender, vertex);

    modifiers.modifyActors();

    const baseDef = defender.getDefendValues(vertex);
    const def = modifiers.modifyDefendValues(baseDef);

    const baseDefendRoll = utils.generalAccuracyFormula(def.level, def.bonus);
    const attackRoll = modifiers.modifyAttackRoll(ATTACK_ROLL);
    const defendRoll = modifiers.modifyDefendRoll(baseDefendRoll);

    const baseAccuracy = utils.compareAccuracyRolls(attackRoll, defendRoll);
    const accuracy = modifiers.modifyAccuracy(baseAccuracy);

    const tracker = new HitTracker(accuracy);
    for (let i = MIN_HIT; i <= MAX_HIT; i++) {
        tracker.store(i, (accuracy / (MAX_HIT - MIN_HIT + 1)));
    }

    const result = modifiers.modifyDamageDistribution({
        tracker,
        attackRoll,
        defendRoll,
        maxHit: MAX_HIT,
        accuracy
    });

    const averageDamage = result.tracker.getAverageDamage();
    const dps = averageDamage / ATTACK_SPEED / 0.6;
    return {
        defendRoll,
        attackRoll,
        accuracy: result.accuracy,
        averageDamage,
        dps,
        maxHit: result.maxHit,
        maxHitProc: result.maxHitProc ?? null,
        tracker: result.tracker,
        attackSpeed: ATTACK_SPEED,
        vertex
    };
}
