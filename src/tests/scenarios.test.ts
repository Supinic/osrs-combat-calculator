import { describe, it } from "node:test";
import { strictEqual } from "node:assert";

import * as definitions from "./scenarios/index"
import { Bonuses, BonusList, BonusObject } from "../Bonuses";
import { Levels, Vertex } from "../Actor";
import { BoostName } from "../Boosts";
import { PrayerName } from "../Prayers";
import { calculate } from "../index";
import { round } from "../utils";

type ActorTestDefinition = {
    baseBonuses?: BonusList | Partial<BonusObject>;
    levels?: Partial<Levels>;
    boosts?: BoostName[];
    prayers?: PrayerName[];
};

type TestDefinition = {
    name: string;
    setup: {
        attacker?: ActorTestDefinition;
        defender?: ActorTestDefinition;
        vertex?: Partial<Vertex>;
    };
    scenarios: {
        name: string;
        attacker?: Partial<ActorTestDefinition>;
        defender?: Partial<ActorTestDefinition>;
        vertex?: Partial<Vertex>;
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
            const vertex = {
                ...(scenario.vertex ?? {}),
                ...(setup.vertex ?? {})
            } as Vertex;

            const attackerBonuses = scenario.attacker?.baseBonuses ?? setup.attacker?.baseBonuses ?? Bonuses.getEmptyList();
            const defenderBonuses = scenario.defender?.baseBonuses ?? setup.defender?.baseBonuses ?? Bonuses.getEmptyList();

            const result = calculate({
                attacker: {
                    baseBonuses: (Array.isArray(attackerBonuses))
                        ? attackerBonuses
                        : Bonuses.fromObject(attackerBonuses),
                    levels: scenario.attacker?.levels ?? setup.attacker?.levels ?? {},
                    boosts: scenario.attacker?.boosts ?? setup.attacker?.boosts ?? [],
                    prayers: scenario.attacker?.prayers ?? setup.attacker?.prayers ?? []
                },
                defender: {
                    baseBonuses: (Array.isArray(defenderBonuses))
                        ? defenderBonuses
                        : Bonuses.fromObject(defenderBonuses),
                    levels: scenario.defender?.levels ?? setup.defender?.levels ?? {},
                    boosts: scenario.defender?.boosts ?? setup.defender?.boosts ?? [],
                    prayers: scenario.defender?.prayers ?? setup.defender?.prayers ?? []
                },
                vertex
            });

            it(scenario.name, function () {
                if (scenario.expected.attackRoll) {
                    strictEqual(result.attackRoll, scenario.expected.attackRoll, "Incorrect attack roll");
                }
                if (scenario.expected.defendRoll) {
                    strictEqual(result.defendRoll, scenario.expected.defendRoll, "Incorrect defend roll");
                }
                if (scenario.expected.maxHit) {
                    strictEqual(result.maxHit, scenario.expected.maxHit, "Incorrect max hit");
                }
                if (scenario.expected.accuracy) {
                    const rounded = round(result.accuracy, 5);
                    strictEqual(rounded, scenario.expected.accuracy, "Incorrect accuracy");
                }
                if (scenario.expected.averageDamage) {
                    const rounded = round(result.averageDamage, 5);
                    strictEqual(rounded, scenario.expected.averageDamage, "Incorrect average damage");
                }
                if (scenario.expected.dps) {
                    const rounded = round(result.dps, 5);
                    strictEqual(rounded, scenario.expected.dps, "Incorrect DPS");
                }
            });
        }
    });
}
