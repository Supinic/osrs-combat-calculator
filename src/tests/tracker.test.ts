import { beforeEach, describe, it } from "node:test";
import { strictEqual, deepEqual } from "node:assert";

import { HitTracker } from "../HitTracker";

describe("Hit tracker calculations", () => {
    describe("Should return same values back", () => {
       const tracker = new HitTracker(0.5);

       strictEqual(tracker.getAccuracy(), 0.5);
    });
});
