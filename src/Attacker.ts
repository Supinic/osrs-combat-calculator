import { Actor, ActorData, Levels } from "./Actor";
import { Equipment } from "./Equipment";

import applyBoosts from "./Boosts";
import getPrayerMultipliers from "./Prayers";

type AttackData = {
	vertex: "Melee" | "Ranged" | "Magic";
	style: "Accurate" | "Aggressive" | "Controlled" | "Defensive" | "Rapid" | "Longrange";
	type: "Slash" | "Stab" | "Crush" | "Ranged" | "Magic" | "Spell";
	spell: string | null;
};

const defaultAttackerLevels: Levels = {
	attack: 99,
	defence: 99,
	hitpoints: 99,
	magic: 99,
	mining: 99,
	prayer: 99,
	ranged: 99,
	strength: 99
};

export class Attacker extends Actor {
	#attack: AttackData;

	constructor (name: string, actorData: ActorData, attackerData: AttackData) {
		super(name, {
			...actorData,
			levels: {
				...(actorData.levels ?? {}),
				...defaultAttackerLevels
			}
		});

		this.#attack = {
			vertex: attackerData.vertex,
			style: attackerData.style,
			type: attackerData.type,
			spell: attackerData.spell ?? null
		};
	}

	output () {
		let speed = this.equipment.weapon?.speed ?? Equipment.fallbackWeaponSpeed;
		const accuracy = {
			level: 0,
			bonus: 0,
			stance: 0
		};
		const strength = {
			level: 0,
			bonus: 0,
			stance: 0
		};

		const boostedLevels = applyBoosts(this.levels, this.boosts);
		const prayerMultipliers = getPrayerMultipliers(this.prayers);

		console.log({boostedLevels, prayerMultipliers});

		if (this.#attack.vertex === "Melee") {
			accuracy.stance = 8;
			strength.stance = 0;

			if (this.#attack.style === "Accurate") {
				accuracy.stance += 3;
			}
			else if (this.#attack.style === "Controlled") {
				accuracy.stance += 1;
				strength.stance += 1;
			}
			else if (this.#attack.style === "Aggressive") {
				strength.stance += 3;
			}

			accuracy.level = Math.floor(boostedLevels.attack * prayerMultipliers.attack);
			strength.level = Math.floor(boostedLevels.strength * prayerMultipliers.strength);

			if (this.#attack.type === "Stab") {
				accuracy.bonus = this.totalBonuses.stabAttack;
			}
			else if (this.#attack.type === "Slash") {
				accuracy.bonus = this.totalBonuses.slashAttack;
			}
			else if (this.#attack.type === "Crush") {
				accuracy.bonus = this.totalBonuses.crushAttack;
			}

			strength.bonus = this.totalBonuses.strength;
		}
		else if (this.#attack.vertex === "Ranged") {
			accuracy.stance = 8;
			strength.stance = 0;

			if (this.#attack.style === "Accurate") {
				accuracy.stance += 3;
			}
			else if (this.#attack.style === "Rapid") {
				speed -= 1;
			}

			accuracy.level = Math.floor(boostedLevels.ranged * prayerMultipliers.rangedAttack);
			strength.level = Math.floor(boostedLevels.ranged * prayerMultipliers.rangedStrength);

			accuracy.bonus = this.totalBonuses.rangedAttack;
			strength.bonus = this.totalBonuses.rangedStrength;
		}
		else if (this.#attack.vertex === "Magic") {
			accuracy.stance = 9;
			strength.stance = 0;

			if (!this.#attack.spell && this.#attack.style === "Accurate") {
				accuracy.stance += 2;
			}
			else if (this.#attack.spell) {
				speed = 5;
			}

			accuracy.level = Math.floor(boostedLevels.magic * prayerMultipliers.magicAttack);
			strength.level = 0; // Magic level does not provide any inherent bonus to magic damage

			accuracy.bonus = this.totalBonuses.magicAttack;
			strength.bonus = this.totalBonuses.magicStrength;
		}
		else {
			throw new Error(`Invalid vertex: ${this.#attack.vertex}`);
		}

		return {
			accuracy,
			strength,
			speed
		};
	}
}
