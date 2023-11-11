import boosts from "./game-data/boosts.json";
import { Levels } from "./Actor";

export type BoostName = keyof typeof boosts;

const boostableLevels = ["attack", "strength", "defence", "magic", "ranged", "mining"] as const;
type BoostableLevel = typeof boostableLevels[number];

type BoostEffect = {
	multiplier?: number;
	flat?: number;
};
type BoostDefinition = {
	effects: {
		[P in BoostableLevel]?: BoostEffect;
	}
}

const applySingleBoost = (levels: Readonly<Levels>, boostData: BoostDefinition): Partial<Levels> => {
	const boostedLevels: Partial<Levels> = {};
	for (const [untypedStat, effect] of Object.entries(boostData.effects)) {
		const stat = untypedStat as BoostableLevel; // Typescript moment

		const { multiplier = 1, flat = 0 } = effect;
		boostedLevels[stat] = Math.floor(levels[stat] * multiplier) + flat;
	}

	return boostedLevels;
};

/**
 * Accepts a stat object and list of boosts, and returns a new object representing the boosted stats.
 */
export default function apply (levels: Readonly<Levels>, appliedBoostNames: Set<BoostName>): Levels {
	const result: Levels = { ...levels };
	for (const boostName of appliedBoostNames) {
		const boostData = boosts[boostName] as BoostDefinition;
		if (!boostData) {
			throw new Error(`Invalid boost provided: ${boostName}`);
		}

		const boostedStats = applySingleBoost(levels, boostData);
		for (const [untypedStat, value] of Object.entries(boostedStats)) {
			const stat = untypedStat as BoostableLevel; // Typescript moment #2

			if (value > result[stat]) {
				result[stat] = value;
			}
		}
	}

	return result;
}
