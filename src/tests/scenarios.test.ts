import * as definitions from "./scenarios/index";
import { describe, it } from "node:test";

import { Attacker } from "../Attacker";
import { Defender } from "../Defender";
import {compareAccuracyRolls, generalAccuracyFormula, generalMaxHitFormula, round} from "../utils";
import { strictEqual } from "node:assert";
import { AttackData, Levels } from "../Actor";
import { BoostName } from "../Boosts";
import { PrayerName } from "../Prayers";
import { Bonuses, BonusList, BonusObject } from "../Bonuses";

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
        }
    }[];
};

for (const definition of Object.values(definitions)) {
    const { name, setup, scenarios } = definition as TestDefinition;

    describe(name, function () {
        for (const scenario of scenarios) {
            const attack = scenario.attacker.attack ?? setup.attacker.attack;

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
            const maxHit = generalMaxHitFormula(a.strength.level + a.strength.stance, a.strength.bonus);
            const accuracy = compareAccuracyRolls(attackRoll, defendRoll);

            it(scenario.name, function () {
                if (scenario.expected.attackRoll) {
                    strictEqual(scenario.expected.attackRoll, attackRoll);
                }
                if (scenario.expected.defendRoll) {
                    strictEqual(scenario.expected.defendRoll, defendRoll);
                }
                if (scenario.expected.maxHit) {
                    strictEqual(scenario.expected.maxHit, maxHit);
                }
                if (scenario.expected.accuracy) {
                    const rounded = round(accuracy, 5);
                    strictEqual(scenario.expected.accuracy, rounded);
                }
            });
        }
    });
}
