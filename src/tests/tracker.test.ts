import { describe, it } from "node:test";
import { strictEqual, deepEqual } from "node:assert";

import { HitTracker } from "../HitTracker";

describe("Hit tracker calculations", () => {
    describe("Should return same values back", () => {
       const tracker = new HitTracker(0.5);

       strictEqual(tracker.getAccuracy(), 0.5);
    });

    describe("Double hits", () => {
        for (let hitAmount = 1; hitAmount <= 4; hitAmount++) {
            it(`Doubles a hit tracker with ${hitAmount} hit(s)`, () => {
                const tracker = new HitTracker(0.75);
                for (let i = 0; i <= 4; i++) {
                    const hits = new Array(hitAmount).fill(i);
                    tracker.store(hits, 0.15);
                }

                const trackerMax = tracker.getMaxHitData();
                const doubleHitTracker = HitTracker.doubleHits(tracker, 0.10);
                const doubleMax = doubleHitTracker.getMaxHitData();
                const expectedHitList = [...trackerMax.list, ...trackerMax.list];

                strictEqual(tracker.getAccuracy(), doubleHitTracker.getAccuracy(), "Accuracy should be unchanged");
                strictEqual(doubleMax.list.length, trackerMax.list.length * 2, "There should be twice the amount of hits");
                deepEqual(doubleMax.list, expectedHitList, "There should be twice the amount of hits");
                strictEqual(doubleMax.max, trackerMax.max, "Actual top max hit should be unchanged");
                strictEqual(doubleMax.sum, trackerMax.sum * 2, "Sum of max hits should be doubled");
            });
        }
    });
});
