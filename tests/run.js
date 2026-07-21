#!/usr/bin/env node
// Test runner. Executes every tests/test_*.js in its own node process and reports pass/fail from
// the exit code (the suites process.exit(1) on any failed assertion). Pass a substring to filter,
// e.g. `node tests/run.js dialogue` runs only the dialogue suites.
//
// These are headless engine tests: each spins the game up in a vm sandbox with light DOM/Router
// stubs and drives it directly — no browser. The old Playwright-based UI tests are not included
// (they need a browser + the playwright package); keep those separate if reintroduced.
const fs = require('fs'), path = require('path'), cp = require('child_process');

const dir = __dirname;
const filter = process.argv[2] || '';
const files = fs.readdirSync(dir)
    .filter(f => /^test_.*\.js$/.test(f) && f.includes(filter))
    .sort();

if (!files.length) { console.log('no tests match', JSON.stringify(filter)); process.exit(0); }

let passed = 0, failed = 0;
const fails = [];
const t0 = Date.now();
for (const f of files) {
    const r = cp.spawnSync(process.execPath, [path.join(dir, f)], { encoding: 'utf8', timeout: 120000 });
    const out = ((r.stdout || '') + (r.stderr || '')).trim().split('\n');
    const last = out.filter(Boolean).slice(-1)[0] || '';
    if (r.status === 0) { passed++; console.log(`  \x1b[32mPASS\x1b[0m ${f}  \x1b[90m${last.slice(0, 60)}\x1b[0m`); }
    else {
        failed++; fails.push(f);
        const failLines = out.filter(l => /^FAIL|\*\*\*|Error|not defined|throw/.test(l)).slice(0, 3);
        console.log(`  \x1b[31mFAIL\x1b[0m ${f}  \x1b[90m(exit ${r.status})\x1b[0m`);
        failLines.forEach(l => console.log(`         ${l.trim().slice(0, 100)}`));
    }
}
const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n${passed}/${files.length} suites passed in ${secs}s` + (failed ? `  —  ${failed} failed: ${fails.join(', ')}` : ''));
process.exit(failed ? 1 : 0);
