type Chance = number;
type Damage = number;

class Distribution extends Map<Damage, Chance> {
    #maxHit: Damage = 0;

    store (hit: Damage, p: Chance): void {
        if (!Number.isInteger(hit) || hit < 0) {
            throw new Error(`Invalid hit damage, positive integer expected`);
        }
        if (p < 0 || p > 1) {
            throw new Error(`Invalid hit chance, expected range <0, 1>`);
        }

        if (hit > this.#maxHit) {
            this.#maxHit = hit;
        }

        // for (let i: Damage = 0; i <= hit; i++) {
        //     if (!this.has(i)) {
        //         this.set(i, 0);
        //     }
        // }

        const previousP = this.get(hit) ?? 0;
        this.set(hit, previousP + p);
    }

    clone () {
        return new Distribution(this);
    }

    getAverageDamage () {
        let damage = 0;
        for (const [hit, p] of this.entries()) {
            damage += hit * p;
        }

        return damage;
    }

    clear () {
        this.#maxHit = 0;
        return super.clear();
    }

    get maxHit (): Damage { return this.#maxHit; }
}

export class HitTracker {
    #missChance: Chance;
    #hitChance: Chance;

    #distribution = new Distribution();
    #extraDists: Distribution[] = [];

    constructor (accuracy: Chance) {
        this.storeSingle(0, 1 - accuracy);

        this.#missChance = 1 - accuracy;
        this.#hitChance = accuracy;
    }

    storeSingle (hit: Damage, p: Chance) {
        this.#distribution.store(hit, p);
    }

    storeMultiple (hits: Damage[], accuracy: Chance) {
        if (hits.length === 1) {
            console.warn("Applying hit length of 1 in storeMultiple - use storeSingle");
            return this.storeSingle(hits[0], accuracy);
        }

        if (!this.#extraDists) {
            this.#extraDists = new Array(hits.length - 1).fill(new Distribution());
        }
        else if (this.#extraDists.length !== hits.length) {
            throw new Error(`Mismatched multi-hit length, got ${hits.length}, expected ${this.#extraDists.length}`);
        }

        this.#distribution.store(hits[0], accuracy);

        for (let i = 1; i < hits.length; i++) {
            this.#extraDists[i].store(hits[i], accuracy);
        }
    }

    /*
    applyFlatBonus (bonus) {
        const originalDistribution = new Map(this.#distribution);
        this.clear();

        for (const [dmg, p] of originalDistribution.entries()) {
            let damage = Math.trunc(dmg + bonus);
            if (damage < 0) {
                damage = 0;
            }

            this.storeSingle(damage, p);
        }
    }

    applyMultiplier (multiplier) {
		if (multiplier < 0) {
			throw new Error("Damage multiplier cannot be negative");
		}

		const originalDistribution = new Map(this.#distribution);
		this.clear();

		for (const [dmg, p] of originalDistribution.entries()) {
			this.storeSingle(Math.trunc(dmg * multiplier), p);
		}
	}

	clamp (max) {
		let updated = false;
		for (const [damage, p] of this.#distribution) {
			if (damage <= max) {
				continue;
			}

			updated = true;
			this.#add(max, p);
			this.#distribution.delete(damage);
		}

		if (updated) {
			this.#maxHit = Math.max(...this.#distribution.keys());
		}
	}

	redistribute (max, hitList) {
		let removedP = 0;
		for (const [damage, p] of this.#distribution) {
			if (damage <= max) {
				continue;
			}

			removedP += p;
			this.#distribution.delete(damage);
		}

		if (removedP === 0) {
			return;
		}

		this.#maxHit = Math.max(...this.#distribution.keys());

		const replacementP = removedP / hitList.length;
		for (const replacementHit of hitList) {
			this.#add(replacementHit, replacementP);
		}
	}

     */

    getAverageDamage () {
        let damage = 0;
        const dists = [this.#distribution, ...this.#extraDists];
        for (const dist of dists) {
            damage += dist.getAverageDamage();
        }

        return damage;
    }

    getMaxHit () {
        let maxHit = this.#distribution.maxHit;
        for (const dist of this.#extraDists) {
            if (dist.maxHit > maxHit) {
                maxHit = dist.maxHit;
            }
        }

        return maxHit;
    }

    clear () {
        this.#distribution.clear();
        for (const dist of this.#extraDists) {
            dist.clear();
        }
    }

    /**
     * Creates a basic damage distribution based on game logic.
     *
     * For a given "hit probability" `P` (accuracy) and maximum `Max` (max hit) the following is true:
     * - probability of hitting zero (miss) is (1 - P)
     * - probability of hitting any value between <0, Max> is (P / (Max + 1))
     *
     * Since the player can either "miss" or "hit" a zero (the game does not distinguish these - except for Magic),
     * the probability is weighted towards zero, and the remaining values are all equally likely.
     * Naturally, many effects don't follow this distribution. This method is simply syntax sugar for repeated usage.
     */
    static createBasicDistribution (accuracy: Chance, maxHit: Damage): HitTracker {
        const dist = new HitTracker(accuracy);

        for (let hit: Damage = 0; hit <= maxHit; hit++) {
            dist.storeSingle(hit, accuracy / (maxHit + 1));
        }

        return dist;
    }
}

/*
export class MultiHitTracker {
	#hitAmount;
	// @type {HitTracker[]}
    #hitTrackers = [];

    constructor (hits) {
        this.#hitAmount = hits;

        for (let i = 0; i < hits; i++) {
            this.#hitTrackers[i] = new HitTracker();
        }
    }

    setZeroAccuracy (accuracy) {
        for (const hitTracker of this.#hitTrackers) {
            hitTracker.setZeroAccuracy(accuracy);
        }

        return this;
    }

    createBasicDistribution (maxHits, accuracy) {
        if (this.#hitAmount !== maxHits.length) {
            throw new Error("The amount of max hits does not match the multi hit tracker's hit amount");
        }

        for (let i = 0; i < this.#hitTrackers.length; i++) {
            const hitTracker = this.#hitTrackers[i];
            const maxHit = maxHits[i];

            hitTracker.createBasicDistribution(maxHit, accuracy);
        }

        return this;
    }

    createBasicDistributionPerAccuracy (maxHits, accuracies) {
        if (this.#hitAmount !== maxHits.length) {
            throw new Error("The amount of max hits does not match the multi hit tracker's hit amount");
        }
        if (this.#hitAmount !== accuracies.length) {
            throw new Error("The amount of accuracies does not match the multi hit tracker's hit amount");
        }

        for (let i = 0; i < this.#hitTrackers.length; i++) {
            const hitTracker = this.#hitTrackers[i];
            const maxHit = maxHits[i];

            hitTracker.createBasicDistribution(maxHit, accuracies[i]);
        }

        return this;
    }

    storeMultiple (maxHits, accuracy) {
        if (this.#hitAmount !== maxHits.length) {
            throw new Error("The amount of max hits does not match the multi hit tracker's hit amount");
        }

        for (let i = 0; i < this.#hitTrackers.length; i++) {
            this.#hitTrackers[i].storeSingle(maxHits[i], accuracy);
        }
    }

    applyFlatBonus (bonus) {
        for (const hitTracker of this.#hitTrackers) {
            hitTracker.applyFlatBonus(bonus);
        }
    }

    applyFlatBonuses (bonuses) {
        if (this.#hitAmount !== bonuses.length) {
            throw new Error("The amount of bonuses does not match the multi hit tracker's hit amount");
        }

        for (let i = 0; i < this.#hitTrackers.length; i++) {
            const hitTracker = this.#hitTrackers[i];
            const bonus = bonuses[i];

            hitTracker.applyFlatBonus(bonus);
        }
    }

    applyMultiplier (multiplier) {
        for (const hitTracker of this.#hitTrackers) {
            hitTracker.applyMultiplier(multiplier);
        }
    }

    applyMultipliers (multipliers) {
        if (this.hitAmount !== multipliers.length) {
            throw new Error("The amount of multipliers does not match the multi hit tracker's hit amount");
        }

        for (let i = 0; i < this.#hitTrackers.length; i++) {
            const hitTracker = this.#hitTrackers[i];
            const multiplier = multipliers[i];

            hitTracker.applyFlatBonus(multiplier);
        }
    }

    clamp (max) {
        for (const hitTracker of this.#hitTrackers) {
            hitTracker.clamp(max);
        }
    }

    redistribute (max, hitList) {
        for (const hitTracker of this.#hitTrackers) {
            hitTracker.redistribute(max, hitList);
        }
    }

    combine () {
        const result = new HitTracker();
        const distributions = this.#hitTrackers.map(i => i.getFinalDistribution());
        const distributionValues = distributions.map(i => [...i.values()]);

        const thresholds = distributions.map(i => i.size);
        const product = distributions.reduce((acc, cur) => acc * cur.size, 1);

        const damageRolls = new Array(this.#hitTrackers.length).fill(0);
        const lastRoll = damageRolls.length - 1;

        for (let index = 0; index < product; index++) {
            // @todo possibly refactor so this carry-over system looks better to use?
            damageRolls[lastRoll]++;

            if (damageRolls[lastRoll] >= thresholds[lastRoll]) {
                damageRolls[lastRoll] = 0;

                for (let remaining = lastRoll - 1; remaining >= 0; remaining--) {
                    damageRolls[remaining]++;

                    if (damageRolls[remaining] >= thresholds[remaining]) {
                        damageRolls[remaining] = 0;
                    }
                    else {
                        break;
                    }
                }
            }

            let p = 1;
            for (let j = 0; j < damageRolls.length; j++) {
                p *= distributionValues[j][damageRolls[j]];
            }

            const damage = sumArray(damageRolls);
            result.storeSingle(damage, p);
        }

        return result;
    }

    get distributions () {
        return this.#hitTrackers.map(i => i.distribution);
    }

    get maxHit () {
        let maxHit = 0;
        for (const hitTracker of this.#hitTrackers) {
            maxHit += hitTracker.maxHit;
        }

        return maxHit;
    }

    get maxList () {
        return this.#hitTrackers.map(i => i.maxHit);
    }
}

 */
