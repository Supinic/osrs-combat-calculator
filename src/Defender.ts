import { Actor, AttackData } from "./Actor";

import applyBoosts from "./Boosts";
import getPrayerMultipliers from "./Prayers";

export class Defender extends Actor {
	output (attackType: AttackData["type"]) {
		const boostedLevels = applyBoosts(this.levels, this.boosts);
		const prayerMultipliers = getPrayerMultipliers(this.prayers);

		let base;
		let bonus;
		if (attackType === "Magic") {
			bonus = this.totalBonuses.magicDefence
			base = Math.floor(boostedLevels.magic * prayerMultipliers.magicDefence) + 9;
		}
		else {
			switch (attackType) {
				case "Stab": bonus = this.totalBonuses.stabDefence; break;
				case "Slash": bonus = this.totalBonuses.slashDefence; break;
				case "Crush": bonus = this.totalBonuses.crushDefence; break;
				case "Ranged": bonus = this.totalBonuses.rangedDefence; break;
				default: throw new Error(`Unknown attack type provided: ${attackType}`);
			}

			base = Math.floor(boostedLevels.defence * prayerMultipliers.defence) + 9;
		}

		return {
			base,
			bonus
		};
	}
}
