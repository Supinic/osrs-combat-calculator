import { Actor, AttackData } from "./Actor";
import { Attacker } from "./Attacker";
import { Defender } from "./Defender";
import { generalAccuracyFormula, generalMaxHitFormula } from "./utils";
import { Bonuses } from "./Bonuses";

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
        prayers: []
    },
    attackData
)

const def = new Defender(
    "Tester",
    {}
);

const a = att.output();
const d = def.output(attackData.type);

const defenceRoll = generalAccuracyFormula(d.base, d.bonus);
const attackRoll = generalAccuracyFormula(a.accuracy.level + a.accuracy.stance, a.accuracy.bonus);
const maxHit = generalMaxHitFormula(a.strength.level + a.strength.stance, a.strength.bonus);

console.log({
    defenceRoll,
    attackRoll,
    maxHit
});
