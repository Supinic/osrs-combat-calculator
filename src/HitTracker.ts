type Chance = number;
type Damage = number;

class Distribution extends Map<Damage, Chance> {
    #missChance: Chance = 0;
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
        const clone = new Distribution(this);
        clone.#maxHit = this.#maxHit;
        clone.#missChance = this.#missChance;

        return clone;
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

    get missChance (): Chance { return this.#missChance; }
    set missChance (p: Chance) { this.#missChance = p; }

    get maxHit (): Damage { return this.#maxHit; }
}

export class HitTracker {
    #missChance: Chance;
    #hitChance: Chance;

    #multi = false;
    #distributions: Distribution[] = [new Distribution()];

    constructor (accuracy: Chance) {
        this.#missChance = 1 - accuracy;
        this.#hitChance = accuracy;

        this.#distributions[0].missChance = this.#missChance;
    }

    store (hits: Damage | Damage[], p: Chance) {
        if (typeof hits === "number") {
            return this.#distributions[0].store(hits, p);
        }

        if (hits.length === 0) {
            throw new Error("Cannot process an empty list of hits");
        }
        else if (hits.length === 1) {
            return this.#distributions[0].store(hits[0], p);
        }
        else {
            this.#expandCheck(hits.length);

            for (let i = 0; i < hits.length; i++) {
                this.#distributions[i].store(hits[i], p);
            }
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
        for (const dist of this.#distributions) {
            damage += dist.getAverageDamage();
        }

        return damage;
    }

    getMaxHitData () {
        const list = this.#distributions.map(i => i.maxHit);
        return {
            max: Math.max(...list),
            sum: list.reduce((acc, cum) => acc + cum, 0),
            list
        };
    }

    getAccuracy () {
        return this.#hitChance;
    }

    clear () {
        for (const dist of this.#distributions) {
            dist.clear();
        }
    }

    debug () {
        return this.#distributions.map(i => [...i.entries()]);
    }

    #expandCheck (length: number) {
        if (this.#distributions.length === length) { // Length checks out, OK
            return;
        }
        else if (this.#multi) { // Already expanded, throw error
            throw new Error(`Mismatched multi-hit length, got ${length}, expected ${this.#distributions.length}`);
        }

        // Expand and set the `#multi` flag to `true`
        for (let i = 1; i < length; i++) {
            const dist = new Distribution();
            dist.missChance = this.#missChance;

            this.#distributions.push(dist);
        }

        this.#multi = true;
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
            dist.store(hit, accuracy / (maxHit + 1));
        }

        return dist;
    }

    static doubleHits (existing: HitTracker, procChance: number): HitTracker {
        const tracker = new HitTracker(existing.getAccuracy());
        const extraDists = [];

        for (const dist of existing.#distributions) {
            // 25% miss chance = 75% hit chance, 10% proc chance = 7.5% hit, 92.5% miss
            const newAccuracy = (1 - dist.missChance) * procChance;
            const newMissChance = (1 - newAccuracy);

            const hits = [...dist.keys()];
            const clone = new Distribution();
            clone.missChance = newMissChance;

            for (const hit of hits) {
                clone.store(hit, newAccuracy / hits.length);
            }

            extraDists.push(clone);
        }

        tracker.#distributions = [
            ...existing.#distributions.map(i => i.clone()),
            ...extraDists
        ];

        return tracker;
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
