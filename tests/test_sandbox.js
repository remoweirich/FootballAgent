// Sandbox editor (ui/js/screen-sandbox.js): the clamping/validation of the edits, which write straight
// into the live save. Drives the save handlers against a light DOM stub and asserts the bounds hold.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..') + '/';

const inputs = {};                     // id -> { value } for the editable fields
const appEl = { innerHTML: '' };
const el = () => ({ style: {}, classList: { add() {}, remove() {}, contains() { return false; } }, innerHTML: '', addEventListener() {}, remove() {}, textContent: '', appendChild() {}, _id: '', set id(v) { this._id = v; }, get id() { return this._id; } });
const document = {
    getElementById: id => (id === 'app' ? appEl : (id === 'sbxOverlay' || id === 'sbxToast' || id === 'sbxCSS' ? null : (inputs[id] || (inputs[id] = { value: '' })))),
    createElement: () => el(), head: { appendChild() {} }, body: { appendChild() {} },
};
const player = { id: 'p1', name: 'Old Name', age: 21, ability: 60, potential: 78, peakAbility: 61 };
const sb = {
    console: { log() {}, warn() {}, error() {} }, Math, Date, JSON, setTimeout: () => 0, document,
    UI: { esc: s => (s == null ? '' : String(s)) }, I18n: { t: (k) => k },
    Monetization: { owns: () => true },
    Agency: { clients: () => [player] },
    SettingsScreen: { show() {} },
    GameState: { _saved: 0, agency: { balance: 3000, reputation: 12 }, getPlayer: id => (id === 'p1' ? player : null), save() { this._saved++; } },
};
vm.createContext(sb);
const S = vm.runInContext(fs.readFileSync(path.join(root, 'ui', 'js', 'screen-sandbox.js'), 'utf8') + ';Sandbox', sb, { filename: 'screen-sandbox.js' });
const GS = sb.GameState;

let failed = false;
const check = (l, c) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + l); if (!c) failed = true; };

// ---- agency finances + reputation ----
inputs.sbxBal = { value: '1250000' };
S.setBalance();
check('balance is set to the entered value', GS.agency.balance === 1250000);
inputs.sbxRep = { value: '200' };            // over the cap
S.setRep();
check('reputation is clamped to 0–100', GS.agency.reputation === 100);
inputs.sbxRep = { value: '-5' };
S.setRep();
check('reputation clamps up from below 0', GS.agency.reputation === 0);

// ---- per-client edits, all out of bounds ----
inputs.sbxName = { value: '  New Name  ' };
inputs.sbxAge = { value: '60' };             // over 45
inputs.sbxAbil = { value: '150' };           // over 99
inputs.sbxPot = { value: '10' };             // below the (clamped) ability -> must lift to ability
S.saveClient('p1');
check('name is trimmed + applied', player.name === 'New Name');
check('age clamps to 45', player.age === 45);
check('ability clamps to 99', player.ability === 99);
check('potential can never sit below ability', player.potential === 99);
check('peakAbility follows a raised ability', player.peakAbility === 99);

// ---- a normal in-range edit ----
inputs.sbxName = { value: 'Star Kid' }; inputs.sbxAge = { value: '18' }; inputs.sbxAbil = { value: '55' }; inputs.sbxPot = { value: '90' };
S.saveClient('p1');
check('in-range values apply verbatim', player.age === 18 && player.ability === 55 && player.potential === 90);
check('edits are saved', GS._saved > 0);

// ---- gate: a non-owner is bounced back to Settings, not rendered ----
sb.Monetization.owns = () => false;
let bounced = false; sb.SettingsScreen.show = () => { bounced = true; };
appEl.innerHTML = 'STALE';
S.show();
check('sandbox refuses to open without the entitlement', bounced === true && appEl.innerHTML === 'STALE');

console.log(failed ? '\n*** FAIL ***' : '\nAll sandbox checks passed.');
process.exitCode = failed ? 1 : 0;
