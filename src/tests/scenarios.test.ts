import { describe, it } from "node:test";
import { strictEqual } from "node:assert";

import { Attacker } from "../Attacker";
import { Defender } from "../Defender";
import { compareAccuracyRolls, generalAccuracyFormula, generalMaxHitFormula, round } from "../utils";
import { AttackData, Levels } from "../Actor";
import { BoostName } from "../Boosts";
import { PrayerName } from "../Prayers";
import { Bonuses, BonusList, BonusObject } from "../Bonuses";
import { HitTracker } from "../HitTracker";
import spells from "../game-data/spells.json";

import * as definitions from "./scenarios/index"

type ActorTestDefinition = {
    baseBonuses?: BonusList | Partial<BonusObject>;
    levels?: Partial<Levels>;
    boosts?: BoostName[];
    prayers?: PrayerName[];
};
type AttackerTestDefinition = ActorTestDefinition & {
    attack: AttackData;
};
type TestDefinition = {
    name: string;
    setup: {
        attacker: AttackerTestDefinition;
        defender: ActorTestDefinition;
    };
    scenarios: {
        name: string;
        attacker: Partial<AttackerTestDefinition>;
        defender: ActorTestDefinition;
        expected: {
            attackRoll?: number;
            defendRoll?: number;
            maxHit?: number;
            accuracy?: number;
            averageDamage?: number;
            dps?: number;
        }
    }[];
};

for (const definition of Object.values(definitions)) {
    const { name, setup, scenarios } = definition as TestDefinition;

    describe(name, function () {
        for (const scenario of scenarios) {
            const attack = {
                ...(scenario.attacker.attack ?? {}),
                ...(setup.attacker.attack ?? {})
            };

            const attackerBonuses = scenario.attacker?.baseBonuses ?? setup.attacker.baseBonuses ?? Bonuses.getEmptyList();
            const defenderBonuses = scenario.defender?.baseBonuses ?? setup.defender.baseBonuses ?? Bonuses.getEmptyList();

            const att = new Attacker(
                "Tester",
                {
                    baseBonuses: (Array.isArray(attackerBonuses))
                        ? attackerBonuses
                        : Bonuses.fromObject(attackerBonuses),
                    levels: scenario.attacker?.levels ?? setup.attacker.levels ?? {},
                    boosts: scenario.attacker?.boosts ?? setup.attacker.boosts ?? [],
                    prayers: scenario.attacker?.prayers ?? setup.attacker.prayers ?? []
                },
                attack
            );

            const def = new Defender(
                "Tester",
                {
                    baseBonuses: (Array.isArray(defenderBonuses))
                        ? defenderBonuses
                        : Bonuses.fromObject(defenderBonuses),
                    levels: scenario.defender?.levels ?? setup.defender.levels ?? {},
                    boosts: scenario.defender?.boosts ?? setup.defender.boosts ?? [],
                    prayers: scenario.defender?.prayers ?? setup.defender.prayers ?? []
                }
            );

            const a = att.output();
            const d = def.output(attack.type);

            const defendRoll = generalAccuracyFormula(d.base, d.bonus);
            const attackRoll = generalAccuracyFormula(a.accuracy.level + a.accuracy.stance, a.accuracy.bonus);
            const accuracy = compareAccuracyRolls(attackRoll, defendRoll);

            let maxHit: number;
            if (attack.type === "Magic" || attack.type === "Spell") {
                if (attack.spell) {
                    maxHit = spells[attack.spell].maxHit;
                }
                else {
                    maxHit = 0; // @todo generic magic max hit
                }
            }
            else {
                maxHit = generalMaxHitFormula(a.strength.level + a.strength.stance, a.strength.bonus);
            }

            const ht = HitTracker.createBasicDistribution(accuracy, maxHit);
            const averageDamage = ht.getAverageDamage();
            const dps = averageDamage / a.speed / 0.6;

            it(scenario.name, function () {
                if (scenario.expected.attackRoll) {
                    strictEqual(scenario.expected.attackRoll, attackRoll, "Incorrect attack roll");
                }
                if (scenario.expected.defendRoll) {
                    strictEqual(scenario.expected.defendRoll, defendRoll, "Incorrect defend roll");
                }
                if (scenario.expected.maxHit) {
                    strictEqual(scenario.expected.maxHit, maxHit, "Incorrect max hit");
                }
                if (scenario.expected.accuracy) {
                    const rounded = round(accuracy, 5);
                    strictEqual(scenario.expected.accuracy, rounded, "Incorrect accuracy");
                }
                if (scenario.expected.averageDamage) {
                    const rounded = round(averageDamage, 5);
                    strictEqual(scenario.expected.averageDamage, rounded, "Incorrect average damage");
                }
                if (scenario.expected.dps) {
                    const rounded = round(dps, 5);
                    strictEqual(scenario.expected.dps, rounded, "Incorrect DPS");
                }
            });
        }
    });
}
