import { AttackData } from "./Actor";
import { Attacker } from "./Attacker";
import { Defender } from "./Defender";
import { compareAccuracyRolls, generalAccuracyFormula, generalMaxHitFormula } from "./utils";
import { HitTracker } from "./HitTracker";

const attackData: AttackData = {
    vertex: "Melee",
    spell: null,
    style: "Aggressive",
    type: "Crush"
} as const;

const att = new Attacker(
    "Tester",
    {
        boosts: [],
        "prayers": ["Piety"]
    },
    attackData
)

const def = new Defender(
    "Tester",
    {}
);

const a = att.output();
const d = def.output(attackData.type);

const defendRoll = generalAccuracyFormula(d.base, d.bonus);
const attackRoll = generalAccuracyFormula(a.accuracy.level + a.accuracy.stance, a.accuracy.bonus);
const baseMaxHit = generalMaxHitFormula(a.strength.level + a.strength.stance, a.strength.bonus);
const accuracy = compareAccuracyRolls(attackRoll, defendRoll);

const ht = HitTracker.createBasicDistribution(accuracy, baseMaxHit);
const averageDamage = ht.getAverageDamage();
const dps = averageDamage / a.speed / 0.6

console.log({
    defendRoll,
    attackRoll,
    baseMaxHit,
    averageDamage,
    dps
});
