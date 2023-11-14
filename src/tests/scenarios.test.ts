import { describe, it } from "node:test";
import { strictEqual, deepEqual } from "node:assert";

import * as definitions from "./scenarios/index";
import { Bonuses, BonusList, BonusObject } from "../Bonuses";
import { Attribute, Levels, Vertex } from "../Actor";
import { BoostName } from "../Boosts";
import { PrayerName } from "../Prayers";
import { calculate } from "../index";
import { round } from "../utils";
import { Definition as EquipmentDefinition, Slot as EquipmentSlot } from "../Equipment";

type ActorTestDefinition = {
    baseBonuses?: BonusList | Partial<BonusObject>;
    levels?: Partial<Levels>;
    boosts?: BoostName[];
    prayers?: PrayerName[];
    equipment?: Record<EquipmentSlot, EquipmentDefinition>;
    size?: number;
    attributes?: Attribute[];
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
            maxHitProc?: number;
            maxHitList?: number[];
            maxHitTotal?: number;
            accuracy?: number;
            averageDamage?: number;
            dps?: number;
        }
    }[];
};

const isNumber = (input: any): input is number => {
    return (typeof input === "number");
};

for (const definition of Object.values(definitions)) {
    const { name, setup, scenarios } = definition as TestDefinition;

    describe(name, function () {
        for (const scenario of scenarios) {
            const vertex = {
                ...(setup.vertex ?? {}),
                ...(scenario.vertex ?? {})
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
                    prayers: scenario.attacker?.prayers ?? setup.attacker?.prayers ?? [],
                    equipment: scenario.attacker?.equipment ?? setup.attacker?.equipment ?? {},
                    size: scenario.attacker?.size ?? setup.attacker?.size ?? 1,
                    attributes: scenario.attacker?.attributes ?? setup.attacker?.attributes ?? []
                },
                defender: {
                    baseBonuses: (Array.isArray(defenderBonuses))
                        ? defenderBonuses
                        : Bonuses.fromObject(defenderBonuses),
                    levels: scenario.defender?.levels ?? setup.defender?.levels ?? {},
                    boosts: scenario.defender?.boosts ?? setup.defender?.boosts ?? [],
                    prayers: scenario.defender?.prayers ?? setup.defender?.prayers ?? [],
                    equipment: scenario.defender?.equipment ?? setup.defender?.equipment ?? {},
                    size: scenario.defender?.size ?? setup.defender?.size ?? 1,
                    attributes: scenario.defender?.attributes ?? setup.defender?.attributes ?? []
                },
                vertex
            });

            it(scenario.name, function () {
                const { expected } = scenario;
                const maxHitData = result.tracker.getMaxHitData();

                if (isNumber(expected.attackRoll)) {
                    strictEqual(result.attackRoll, expected.attackRoll, "Incorrect attack roll");
                }
                if (isNumber(expected.defendRoll)) {
                    strictEqual(result.defendRoll, expected.defendRoll, "Incorrect defend roll");
                }
                if (isNumber(expected.maxHit)) {
                    strictEqual(result.maxHit, expected.maxHit, "Incorrect max hit");
                }
                if (isNumber(expected.maxHitProc)) {
                    strictEqual(result.maxHitProc, expected.maxHitProc, "Incorrect proc max hit");
                }
                if (isNumber(expected.maxHitTotal)) {
                    strictEqual(maxHitData.sum, expected.maxHitTotal, "Incorrect total max hit sum");
                }
                if (expected.maxHitList) {
                    deepEqual(maxHitData.list, expected.maxHitList, "Incorrect max hit list");
                }
                if (isNumber(expected.accuracy)) {
                    const rounded = round(result.accuracy, 5);
                    strictEqual(rounded, expected.accuracy, "Incorrect accuracy");
                }
                if (isNumber(expected.averageDamage)) {
                    const rounded = round(result.averageDamage, 5);
                    strictEqual(rounded, expected.averageDamage, "Incorrect average damage");
                }
                if (isNumber(expected.dps)) {
                    const rounded = round(result.dps, 5);
                    strictEqual(rounded, expected.dps, "Incorrect DPS");
                }
            });
        }
    });
}
