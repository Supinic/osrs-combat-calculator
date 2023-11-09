import prayers from "./game-data/prayers.json";

type Multiplier = number;
export type PrayerName = keyof typeof prayers;
type PrayerDefinition = {
	effects: {
		[P in BoostableStat]?: Multiplier;
	}
}

export type BoostableStat =
	"attack" | "strength" | "defence"
	| "rangedAttack" | "rangedStrength"
	| "magicAttack" | "magicStrength" | "magicDefence";

/**
 * Accepts a list of prayers, and returns back an object determining the list of stat multipliers.
 */
export default function getMultipliers (appliedPrayerNames: Set<PrayerName>): Record<BoostableStat, number> {
	const result = {
		attack: 1,
		strength: 1,
		defence: 1,
		rangedAttack: 1,
		rangedStrength: 1,
		magicAttack: 1,
		magicStrength: 1,
		magicDefence: 1
	};

	for (const prayerName of appliedPrayerNames) {
		const prayer = prayers[prayerName] as PrayerDefinition;
		if (!prayer) {
			throw new Error(`Invalid prayer name provided: ${prayerName}`);
		}

		for (const [untypedStat, multiplier] of Object.entries(prayer.effects)) {
			const stat = untypedStat as BoostableStat;
			if (result[stat] !== 1) {
				throw new Error(`Conflicting prayer effect provided: ${stat}`)
			}

			result[stat] = multiplier;
		}
	}

	return result;
}
