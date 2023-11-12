import spells from "../game-data/spells.json";
import Modifier from "./template";
import { Context } from "../Modifiers";

const fireStrikeMaxHit = spells["Fire Strike"].maxHit;
const definitions = [
    {
        names: ["Thammaron's sceptre"],
        formula: (magic: number) => Math.floor(magic / 3) - 8
    },
    {
        names: ["Accursed sceptre"],
        formula: (magic: number) => Math.floor(magic / 3) - 6
    },
    {
        names: ["Trident of the seas", "Trident of the seas (e)"],
        formula: (magic: number) => Math.floor(magic / 3) - 5
    },
    {
        names: ["Trident of the swamp", "Trident of the swamp (e)"],
        formula: (magic: number) => Math.floor(magic / 3) - 2
    },
    {
        names: ["Sanguinesti staff", "Holy sanguinesti staff"],
        formula: (magic: number) => Math.floor(magic / 3) - 1
    },
    {
        names: ["Dawnbringer"],
        formula: (magic: number) => Math.floor(magic / 6) - 1
    },
    {
        names: ["Crystal staff (basic)", "Corrupted staff (basic)"],
        formula: () => 23
    },
    {
        names: ["Crystal staff (attuned)", "Corrupted staff (attuned)"],
        formula: () => 31
    },
    {
        names: ["Crystal staff (perfected)", "Corrupted staff (perfected)"],
        formula: () => 39
    },
    {
        names: ["Starter staff"],
        formula: () => fireStrikeMaxHit
    }
];

const supportedWeapons = definitions.flatMap(i => i.names);

export const PoweredStaffModifier: Modifier = {
    baseMaxHit (context: Context) {
        const { magic } = context.attacker.boostedLevels;
        const weapon = context.attacker.equipment.weapon?.name ?? "";

        const staffData = definitions.find(i => i.names.includes(weapon));
        if (!staffData) {
            throw new Error(`No corresponding powered staff found: ${weapon}`);
        }

        return staffData.formula(magic);
    },

    isApplied (context: Context) {
        const weapon = context.attacker.equipment.weapon?.name ?? "";
        return (supportedWeapons.includes(weapon));
    }
}
