import { calculateGuardian } from "../guardian";

const targets = {
    "Target dummy": {},
    Sotetseg: {
        baseBonuses: {
            stabDefence: 70,
            slashDefence: 70,
            crushDefence: 70,
            magicDefence: 30,
            rangedDefence: 150
        },
        levels: {
            hitpoints: 4000,
            defence: 200,
            magic: 250
        }
    },
    "Akkha 0": {
        baseBonuses: {
            stabDefence: 60,
            slashDefence: 120,
            crushDefence: 120,
            magicDefence: 0,
            rangedDefence: 60
        },
        levels: {
            hitpoints: 400,
            defence: 80,
            magic: 100
        }
    },
    "Akkha 600": {
        baseBonuses: {
            stabDefence: 60,
            slashDefence: 120,
            crushDefence: 120,
            magicDefence: 0,
            rangedDefence: 60
        },
        levels: {
            hitpoints: 1360,
            defence: 272,
            magic: 340
        }
    }
};

for (const [name, def] of Object.entries(targets)) {
    const r = calculateGuardian({
        name,
        ...def
    });

    console.log(name, r);
}
