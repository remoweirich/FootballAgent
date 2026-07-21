// Sanity-check the wage/value tone-down using the REAL agency.js/players.js code
// (not hand math) against the reported case: a 15yo, ability 24, at a Dutch tier-4
// club (reputation ~24-41), with a range of potential rolls (potGap 14-36).
const vm = require('vm');
const fs = require('fs');

const sandbox = { console, Math, GameState: { seasonStartYear: 2025 }, Clubs: {}, Scouting: undefined, PlayerGen: undefined, Agency: undefined };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(require('path').join(__dirname, '..', 'js/rng.js'), 'utf8'), sandbox, { filename: 'rng.js' });
vm.runInContext(fs.readFileSync(require('path').join(__dirname, '..', 'js/players.js'), 'utf8'), sandbox, { filename: 'players.js' });
vm.runInContext(fs.readFileSync(require('path').join(__dirname, '..', 'js/agency.js'), 'utf8'), sandbox, { filename: 'agency.js' });
const run = code => vm.runInContext(code, sandbox);

console.log('--- wageFor(ability, reputation) baseline (unchanged) ---');
[[24, 24], [24, 33], [24, 40], [24, 50]].forEach(([a, r]) => {
    console.log(`ability=${a} rep=${r} -> wageFor=${run(`PlayerGen.wageFor(${a}, ${r})`)}`);
});

console.log('\n--- OLD behavior (manual, no potentialConfidence) vs NEW Agency.wagePotentialFactor ---');
[14, 25, 36].forEach(potGap => {
    const p = { ability: 24, age: 15 };
    const oldFactor = 1 + potGap * 0.06 * 1.3; // pre-fix formula
    const newFactor = run(`Agency.wagePotentialFactor({ability:24, age:15, potential:${24 + potGap}})`);
    console.log(`potGap=${potGap}: old factor=${oldFactor.toFixed(2)}  new factor=${newFactor.toFixed(2)}`);
});

console.log('\n--- Full proposed wage, ability=24 age=15, club rep=40 (near top of Dutch tier 4), across potential rolls ---');
[14, 20, 25, 30, 36].forEach(potGap => {
    const base = run(`PlayerGen.wageFor(24, 40)`);
    const oldFactor = 1 + potGap * 0.06 * 1.3;
    const newFactor = run(`Agency.wagePotentialFactor({ability:24, age:15, potential:${24 + potGap}})`);
    const oldWage = Math.round(base * oldFactor / 10) * 10;
    const newWage = Math.round(base * newFactor / 10) * 10;
    console.log(`potGap=${potGap}: OLD €${oldWage}/wk  ->  NEW €${newWage}/wk`);
});

console.log('\n--- Sanity: unaffected at higher ability (ability=70, same potGap range) ---');
[14, 25, 36].forEach(potGap => {
    const oldFactor = 1 + potGap * 0.06 * 1.3;
    const newFactor = run(`Agency.wagePotentialFactor({ability:70, age:15, potential:${70 + potGap}})`);
    console.log(`ability=70 potGap=${potGap}: old=${oldFactor.toFixed(2)} new=${newFactor.toFixed(2)} (should match, ability>=60)`);
});

console.log('\n--- playerValue() transfer-value comparison, same scenario ---');
[14, 25, 36].forEach(potGap => {
    const p = `{ability:24, age:15, potential:${24+potGap}, contractUntilSeason:2027}`;
    const newVal = run(`Agency.playerValue(${p})`);
    console.log(`potGap=${potGap}: new playerValue=€${Math.round(newVal)}`);
});
