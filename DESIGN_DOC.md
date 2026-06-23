# Football Agent Manager - Game Design Document

**Version:** 1.0  
**Datum:** 2026-04-25  
**Autor:** Jens

---

## 🎯 Vision & Ziele

### Hauptziele
1. **Spielbares Management-Spiel** mit realistischer Fußball-Agentur-Simulation
2. **Daten-generierendes System** für detaillierte Karriere-Analytics
3. **Organische Entwicklung** mit langfristigen Konsequenzen
4. **Detaillierte Statistiken** über Spieler, Vereine, Transfers, Finanzen

### Abgrenzung zum Original
- **Mehr Datenerfassung** - Jede Entscheidung wird getrackt
- **Bessere Visualisierungen** - Charts, Graphs, Reports
- **Flexiblere Liga-Systeme** - Eigene Länder/Ligen erstellen
- **Web-basiert** - Läuft im Browser, Daten bleiben lokal

---

## 🏗️ Kern-Architektur

### Tech Stack
- **Frontend:** HTML/CSS/JavaScript (React optional)
- **Datenbank:** IndexedDB (Browser localStorage für kleine Daten)
- **Simulation:** JavaScript Game Loop
- **Export:** JSON, CSV für Analytics

### Datenstruktur

```javascript
// Haupt-Entitäten
{
  gameState: {
    currentWeek: number,
    currentSeason: string,
    agencyBalance: number,
    careerEarnings: number,
    hqLevel: number,
    propertyLevel: number,
    vehicleLevel: number
  },
  
  players: [{
    id: string,
    name: string,
    nationality: string,
    birthDate: date,
    position: "GK" | "CB" | "LB" | "RB" | "CDM" | "CM" | "CAM" | "RW" | "LW" | "ST",
    ability: number,         // 0-99
    potential: number,       // 0-99
    form: number,            // 0-100
    value: number,
    wage: number,
    commissionRate: number,  // 0-25%
    happiness: number,       // 0-100
    currentClub: string,
    contractExpiry: string,
    
    // Historische Daten
    careerHistory: [{
      season: string,
      club: string,
      division: string,
      games: number,
      goals: number,
      cleanSheets: number,
      form: number,
      transferValue: string,
      transferType: "Transfer" | "Loan" | "Free"
    }],
    
    injuryHistory: [{
      season: string,
      week: number,
      injuryType: string,
      weeksOut: number,
      context: "Training" | "Match"
    }],
    
    // Status
    isInjured: boolean,
    injuryWeeksRemaining: number,
    pendingOffers: [{
      type: "transfer" | "loan" | "sponsorship",
      from: string,
      value: number,
      wage: number,
      details: object
    }]
  }],
  
  clubs: [{
    id: string,
    name: string,
    country: string,
    division: string,      // "ERE", "EED", "ETD", "EDR" etc.
    reputation: number,    // 0-100
    finances: number,
    stadium: string,
    
    // Saison-Daten
    seasonStats: [{
      season: string,
      division: string,
      position: number,
      points: number,
      wins: number,
      draws: number,
      losses: number,
      goalsFor: number,
      goalsAgainst: number,
      result: "Champion" | "European Football" | "Promotion" | "Stay" | "Relegation"
    }],
    
    // Beziehung zur Agentur
    relationshipLevel: number  // 0-100, beeinflusst Verhandlungen
  }],
  
  scouts: [{
    id: string,
    name: string,
    ability: number,       // 0-99
    salary: number,
    assignedRegion: string | null,
    recentFinds: [playerId]
  }],
  
  leagues: [{
    id: string,
    name: string,
    country: string,
    tier: number,          // 1 = Top league
    clubs: [clubId],
    promotionSpots: number,
    relegationSpots: number,
    
    // Cup competitions
    hasCup: boolean,
    cupName: string
  }],
  
  // Wochenbasierte Events
  weeklyEvents: [{
    week: number,
    season: string,
    type: string,
    data: object
  }]
}
```

---

## ⏰ Zeitmanagement & Simulation

### Wochenzyklus

**Jede Woche:**
1. **Pre-Week Phase** (vor Spieltag)
   - Verarbeite Transfers
   - Update Verletzungen
   - Scout-Reports kommen rein
   
2. **Match Day Simulation**
   - Ligen-Spiele simulieren
   - Pokale simulieren
   - Ergebnisse generieren
   - Spieler-Form anpassen
   - Verletzungen generieren (Wahrscheinlichkeitsbasiert)
   
3. **Post-Week Phase**
   - Transfer-Angebote generieren
   - Spieler-Wünsche generieren
   - Sponsor-Angebote generieren
   - Weekly Summary Pop-up zeigen

### Saison-Ende (Week 46 in den meisten Ligen)
1. **Liga-Auswertung**
   - Meister ermitteln
   - Auf-/Abstieg berechnen
   - European Football Qualifikation
   - Tabellen speichern
   
2. **Transfer-Windows**
   - Sommer-Window: Woche 1-6 (intensive Phase)
   - Winter-Window: Woche 22-26 (weniger aktiv)
   - Mehr Angebote als in normalen Wochen
   - Spieler wechseln Vereine (AI-gesteuert)
   
3. **Saison-Summary**
   - Deine besten Deals
   - Career Earnings Update
   - Statistiken der Saison

---

## 👥 Spieler-System

### Spieler-Generierung

**Initialer Pool:**
- 1000+ Spieler pro Land generiert
- Verteilung nach Position: 
  - GK: 10%
  - Defenders (CB, LB, RB): 30% (10% each)
  - Midfielders (CDM, CM, CAM): 35% (12%, 12%, 11%)
  - Forwards (RW, LW, ST): 25% (8%, 8%, 9%)
- Altersverteilung: 16-35 Jahre
- Ability-Verteilung: Normal distribution (μ=60, σ=15)

**Potential-System:**
```
Junge Spieler (16-21): Potential = Ability + random(10-30)
Mittleres Alter (22-28): Potential = Ability + random(5-15)
Ältere Spieler (29+): Potential = Ability (kein Wachstum mehr)
```

**Entwicklung pro Saison:**
```javascript
// Wachstum basiert auf:
// - Alter
// - Spielzeit (games played)
// - Vereinsqualität
// - Form

if (age < 23) {
  abilityGain = random(1-5) * (gamesPlayed / 38) * clubQuality
} else if (age < 28) {
  abilityGain = random(0-2) * (gamesPlayed / 38) * clubQuality
} else {
  abilityGain = random(-2 to 0) // Decline
}

newAbility = min(ability + abilityGain, potential)
```

### Spieler-Wünsche & Events

**Event-Typen** (Wahrscheinlichkeit pro Spieler pro Woche: 2%)
- **Personal Request** (40%)
  - "Buch ein Restaurant" (Happiness +5, Cost £100-1000)
  - "Organisiere einen Urlaub" (Happiness +10, Cost £2000-5000)
  - "Hilf mit einem Fan-Problem" (Happiness +5, Free)
  - "Kaufe ein Geschenk für Freundin/Familie" (Happiness +8, Cost £500-3000)
  
- **Career Concerns** (30%)
  - "Ich will mehr Spielzeit" → Trigger: Bench-Rolle
  - "Ich will zu einem besseren Verein" → Trigger: Ability > Club Reputation
  - "Ich brauche eine Vertragsverlängerung"
  
- **Sponsorship Interest** (20%)
  - Basierend auf: Ability, Form, League Tier
  - Wert: £1k-100k/week je nach Spieler
  
- **Complaint** (10%)
  - "Du kümmerst dich nicht genug" → Trigger: Lange nicht interagiert
  - "Ich bin mit meinem Gehalt unzufrieden"

**Happiness-System:**
```
Happiness (0-100):
- Affects: Wahrscheinlichkeit Vertragsverlängerung, Performance
- Decreases: -1 pro Woche ohne Interaction
- Increases: Events erfüllen, gute Transfers, Spielzeit
- Critical: <30 → Spieler kann Vertrag kündigen
```

---

## 💼 Agentur-Management

### HQ-System

**HQ Levels (1-10):**
```javascript
const HQ_LEVELS = [
  { level: 1, cost: 0,          maxPlayers: 5,  maxScouts: 1, weeklyCost: 500 },
  { level: 2, cost: 10000,      maxPlayers: 10, maxScouts: 2, weeklyCost: 1250 },
  { level: 3, cost: 50000,      maxPlayers: 15, maxScouts: 3, weeklyCost: 3000 },
  { level: 4, cost: 150000,     maxPlayers: 20, maxScouts: 4, weeklyCost: 7500 },
  { level: 5, cost: 400000,     maxPlayers: 25, maxScouts: 5, weeklyCost: 15000 },
  { level: 6, cost: 800000,     maxPlayers: 30, maxScouts: 6, weeklyCost: 21250 },
  { level: 7, cost: 1500000,    maxPlayers: 35, maxScouts: 7, weeklyCost: 27500 },
  { level: 8, cost: 2500000,    maxPlayers: 40, maxScouts: 8, weeklyCost: 34000 },
  { level: 9, cost: 5000000,    maxPlayers: 45, maxScouts: 9, weeklyCost: 41000 },
  { level: 10, cost: 10000000,  maxPlayers: 50, maxScouts: 10, weeklyCost: 50000 }
]
```

**Sponsor Tiers (unlock mit HQ Level):**
- Regional (HQ 1+): £500-2k/week
- Interregional (HQ 3+): £2k-10k/week
- National (HQ 5+): £10k-50k/week
- Continental (HQ 7+): £50k-200k/week
- International (HQ 9+): £200k-1m/week

### Property & Vehicles

**Property (HQ Cost Reduction):**
```javascript
const PROPERTIES = [
  { name: "Trailer",           cost: 10000,      reduction: 5% },
  { name: "House",             cost: 100000,     reduction: 10% },
  { name: "Luxury Penthouse",  cost: 750000,     reduction: 15% },
  { name: "Mansion",           cost: 2500000,    reduction: 25% },
  { name: "Castle",            cost: 10000000,   reduction: 40% }
]
```

**Vehicles (Scouting Cost Reduction):**
```javascript
const VEHICLES = [
  { name: "Sports Car",    cost: 25000,      reduction: 5% },
  { name: "Limousine",     cost: 250000,     reduction: 10% },
  { name: "Helicopter",    cost: 500000,     reduction: 15% },
  { name: "Yacht",         cost: 2000000,    reduction: 25% },
  { name: "Private Jet",   cost: 10000000,   reduction: 40% }
]
```

### Scout-System

**Scout-Eigenschaften:**
- Ability: 50-99 (bestimmt Qualität der gefundenen Spieler)
- Salary: £500-10k/week (abhängig von Ability)
- Assignment: Free Roam oder Region/Land

**Scouting-Mechanik:**
```javascript
// Pro Woche pro Scout
if (scout.assignment === "Free Roam") {
  findPlayers(count: 1, anyRegion: true)
} else {
  findPlayers(count: 2-4, region: scout.assignment)
}

// Gefundene Spieler-Qualität
minAbility = scout.ability - 20
maxAbility = scout.ability + 10
foundPlayer.ability = random(minAbility, maxAbility)
```

**Regionen & Kosten:**

**Heimatland (z.B. Niederlande):**
```javascript
const NL_REGIONS = [
  { name: "Drenthe & Groningen",    cost: 500,  topClub: "FC Groningen" },
  { name: "Friesland & Flevoland",  cost: 400,  topClub: "SC Heerenveen" },
  { name: "Gelderland",             cost: 800,  topClub: "Vitesse" },
  { name: "Limburg",                cost: 600,  topClub: "MVV" },
  { name: "North Brabant",          cost: 1200, topClub: "PSV" },
  { name: "North Holland",          cost: 2000, topClub: "Ajax" },
  { name: "Overijssel",             cost: 1000, topClub: "Twente" },
  { name: "South Holland",          cost: 1500, topClub: "Feyenoord" },
  { name: "Utrecht",                cost: 1000, topClub: "FC Utrecht" }
]
```

**Ausland (von NL aus):**
```javascript
const FOREIGN_COUNTRIES = [
  { name: "Belgium",       baseCost: 2000 },
  { name: "Germany",       baseCost: 5000 },
  { name: "England",       baseCost: 8000 },
  { name: "Spain",         baseCost: 6000 },
  { name: "Italy",         baseCost: 6000 },
  { name: "France",        baseCost: 5000 },
  { name: "Portugal",      baseCost: 3000 },
  { name: "Switzerland",   baseCost: 3000 },
  { name: "Austria",       baseCost: 2500 },
  { name: "Czech Republic", baseCost: 1500 },
  { name: "Poland",        baseCost: 1500 },
  { name: "Croatia",       baseCost: 1500 },
  { name: "Scotland",      baseCost: 2000 },
  { name: "Sweden",        baseCost: 2000 },
  { name: "Turkey",        baseCost: 3000 },
  { name: "Brazil",        baseCost: 10000 }
]
```

---

## ⚽ Vereins- & Liga-System

### Liga-Hierarchie

**Beispiel: Niederlande**
```javascript
const NL_LEAGUES = [
  {
    id: "ERE",
    name: "Eredivisie",
    tier: 1,
    clubs: 18,
    promotionTo: null,
    relegationTo: "EED",
    promotionSpots: 0,
    relegationSpots: 1,
    playoffs: true,
    playoffSpots: 8,
    hasCup: true,
    cupName: "KNVB Beker"
  },
  {
    id: "EED",
    name: "Eerste Divisie",
    tier: 2,
    clubs: 20,
    promotionTo: "ERE",
    relegationTo: "ETD",
    promotionSpots: 1,
    relegationSpots: 2,
    playoffs: true,
    playoffSpots: 8
  },
  {
    id: "ETD",
    name: "Tweede Divisie",
    tier: 3,
    clubs: 18,
    promotionTo: "EED",
    relegationTo: "EDR",
    promotionSpots: 2,
    relegationSpots: 2
  },
  {
    id: "EDR",
    name: "Derde Divisie",
    tier: 4,
    clubs: 18,
    promotionTo: "ETD",
    relegationTo: null,
    promotionSpots: 2,
    relegationSpots: 0
  }
]
```

### Vereins-Reputation & Finanzen

**Reputation-Einfluss:**
- Beeinflusst: Transfer-Budget, Gehälter, Spieler-Anziehungskraft
- Basiert auf: Liga-Tier, Historie (Titel), aktuelle Performance

**Dynamische Reputation:**
```javascript
// Pro Saison
if (position <= 3) reputation += 2
if (champion) reputation += 5
if (relegated) reputation -= 5
if (promoted) reputation += 3

// Cup Win
if (cupWinner) reputation += 3

reputation = clamp(reputation, 0, 100)
```

**Transfer-Budget Simulation:**
```javascript
clubBudget = baseAmount * (reputation / 50) * (leagueTier multiplier)

// Beispiel
Ajax (Reputation 95, Tier 1): £30m-50m
Feyenoord (Reputation 88, Tier 1): £20m-35m
Twente (Reputation 75, Tier 1): £10m-20m
```

### Match Simulation

**Einfache Ergebnis-Generierung:**
```javascript
function simulateMatch(homeClub, awayClub) {
  const homeStrength = calculateStrength(homeClub)
  const awayStrength = calculateStrength(awayClub)
  
  // Home advantage
  homeStrength *= 1.1
  
  // Poisson distribution for goals
  homeGoals = poisson(homeStrength / 30)
  awayGoals = poisson(awayStrength / 30)
  
  return { homeGoals, awayGoals }
}

function calculateStrength(club) {
  // Basierend auf durchschnittlicher Spieler-Ability
  const avgAbility = club.players.reduce((sum, p) => sum + p.ability, 0) / club.players.length
  const formFactor = club.players.reduce((sum, p) => sum + p.form, 0) / club.players.length / 100
  
  return avgAbility * formFactor * (club.reputation / 100)
}
```

**Performance-Tracking:**
```javascript
// Nach jedem Spiel für jeden Spieler
player.form += random(-5, +5)
player.form = clamp(player.form, 50, 100)

// Injury chance: 2% pro Spiel
if (random(0, 100) < 2) {
  player.isInjured = true
  player.injuryWeeksRemaining = random(1, 8)
  player.injuryHistory.push({...})
}
```

---

## 💰 Finanz-System

### Einnahmen

**Wöchentliche Einnahmen:**
```javascript
weeklyIncome = {
  wages: players.reduce((sum, p) => sum + (p.wage * p.commissionRate / 100), 0),
  sponsorship: players.reduce((sum, p) => sum + p.sponsorshipDeal, 0)
}
```

**Transfer-Gebühren:**
```javascript
// Bei Transfer eines Spielers
transferFee = transferValue * 0.05  // 5% Agent-Gebühr
careerEarnings += transferFee
```

### Ausgaben

**Wöchentliche Ausgaben:**
```javascript
weeklyExpenditure = {
  hq: HQ_LEVELS[hqLevel].weeklyCost * (1 - propertyReduction),
  scouts: scouts.reduce((sum, s) => sum + s.salary, 0),
  scouting: scouts.reduce((sum, s) => sum + s.regionCost, 0) * (1 - vehicleReduction)
}
```

**Einmalige Ausgaben:**
- Spieler-Wünsche erfüllen (£100-5000)
- HQ Upgrades
- Property/Vehicle Käufe
- Scout-Einstellung

---

## 📊 Analytics & Reports

### Tracking-Kategorien

**Karriere-Statistiken:**
- Total Career Earnings
- Total Transfers Completed
- Total Players Managed
- Average Player Value Increase
- Best Deal (höchster Transfer-Erlös)
- Most Successful Player (Titles, Caps)

**Saison-Statistiken:**
- Earnings this Season
- New Players Signed
- Players Sold
- Active Contracts
- Scout Performance (Finds per Scout)

**Spieler-Statistiken:**
- Career Path (alle Vereine, Saisons, Stats)
- Value Development Over Time
- Injury History
- Happiness Trend
- Performance (Games, Goals, Form)

**Vereins-Statistiken:**
- Relationship Levels
- Most Used Clubs
- Best Partnership (meiste Deals)

**Liga-Statistiken:**
- Historical Tables
- Champion History
- Promotion/Relegation Movements
- Cup Winners

### Export-Formate

**JSON Export:**
```json
{
  "gameState": {...},
  "players": [...],
  "clubs": [...],
  "seasonHistory": [...]
}
```

**CSV Exports:**
- `players.csv` - Alle Spieler mit aktuellen Stats
- `career_history.csv` - Komplette Karriereverläufe
- `transfers.csv` - Alle Transfers mit Details
- `finances.csv` - Wöchentliche Finanzberichte
- `league_tables.csv` - Historische Tabellen

---

## 🎮 UI/UX Flow

### Hauptbildschirme

**1. Dashboard (Home)**
- Current Week/Season Display
- Balance & Weekly P&L
- Quick Stats (Players, Scouts, HQ Level)
- Recent Events Feed
- "Advance Week" Button

**2. Players View**
- Grid/List von allen Spielern
- Filter: Position, Club, Ability, Status
- Sort: Name, Age, Ability, Value, Form
- Click → Player Detail Page

**3. Player Detail**
- Header: Name, Age, Position, Nationality, Photo
- Stats: Ability, Potential, Form, Value, Wage
- Contract: Expiry, Commission Rate
- Current Status: Club, Division, Happiness
- Tabs:
  - Overview (aktuelle Stats)
  - Career History (Tabelle)
  - Offers (Pending Transfer/Loan/Sponsorship)
  - Requests (Wünsche & Events)

**4. Scouting**
- Scout List (Name, Ability, Salary, Assignment)
- Hire New Scout (Market)
- Assign Scout to Region/Country
- Recent Finds Feed
- Sign Player from Finds

**5. Clubs**
- Liste aller Vereine
- Filter: Country, Division, Reputation
- Click → Club Detail (Kader, Stats, Relationship)

**6. Leagues**
- Select Country → Select Division
- Current Table
- Fixtures & Results
- Historical Tables

**7. HQ Management**
- Current Level Display
- Upgrade Options
- Property & Vehicle Shop
- Extensions (Gym, Pool, etc.)

**8. Finances**
- Balance Over Time Chart
- Weekly Income/Expenditure Breakdown
- Career Earnings
- Transaction History

**9. Analytics**
- Customizable Reports
- Charts & Graphs
- Export Options

**10. Settings**
- Game Speed (Real-time vs Manual Advance)
- Notifications
- Save/Load Game
- Export Data

### Weekly Pop-up

**Design:**
```
┌─────────────────────────────────┐
│   Week X - Season YY/YY         │
│   ─────────────────────────     │
│                                 │
│  🚑 INJURIES                    │
│  • M. Planckaert (Thigh, 2w)    │
│                                 │
│  📬 NEW OFFERS                  │
│  • Transfer: Ajax → D. Bijlsma  │
│  • Sponsor: Nike → T. De Vries  │
│                                 │
│  🔍 SCOUT FINDS                 │
│  • A. Van Leeuwen found in NL   │
│                                 │
│  💬 PLAYER REQUESTS             │
│  • Q. Dekkers: Book restaurant  │
│                                 │
│  [View Details]  [Continue]     │
└─────────────────────────────────┘
```

**End of Season Pop-up:**
```
┌─────────────────────────────────┐
│   Season YY/YY Complete! 🏆     │
│   ─────────────────────────     │
│                                 │
│  🏆 EREDIVISIE                  │
│  Champion: Ajax                 │
│  Promoted: FC Volendam          │
│  Relegated: Sparta Rotterdam    │
│                                 │
│  💰 YOUR SEASON                 │
│  Earnings: £2.5m                │
│  Players Signed: 8              │
│  Transfers Completed: 12        │
│                                 │
│  [View Full Report] [Continue]  │
└─────────────────────────────────┘
```

---

## 🔄 Spielablauf (Game Loop)

### Initialisierung (New Game)

1. **Land wählen** (z.B. Niederlande)
2. **Agentur benennen**
3. **Startbudget:** £50,000
4. **HQ Level:** 1 (5 Spieler max, 1 Scout)
5. **Ligen generieren** (4 Tiers, ~70 Clubs)
6. **Spieler generieren** (~1000 Spieler)
7. **Spieler auf Clubs verteilen** (basierend auf Ability & Club Reputation)
8. **1 Scout gratis** (Ability 60-70)
9. **Start:** Week 1, Season 25/26

### Wochen-Loop

**Klick auf "Advance Week":**
```javascript
function advanceWeek() {
  // 1. PRE-WEEK
  currentWeek++
  processInjuries()         // Countdown injuries
  processContracts()        // Check expiries
  processScoutAssignments() // Scouts find players
  
  // 2. MATCH DAY
  simulateAllMatches()      // Alle Ligen
  updatePlayerForms()       // Post-match form update
  generateInjuries()        // Random injuries
  
  // 3. POST-WEEK
  generateTransferOffers()  // Clubs make offers
  generatePlayerRequests()  // Player events
  generateSponsorOffers()   // Sponsor deals
  
  updateFinances()          // Deduct weekly costs, add income
  
  // 4. CHECK END OF SEASON
  if (currentWeek === 46) {
    endSeason()
  }
  
  // 5. SHOW WEEKLY POP-UP
  showWeeklySummary()
}
```

### Saison-Ende

```javascript
function endSeason() {
  // Liga-Auswertungen
  leagues.forEach(league => {
    determineChampion(league)
    processPromotionRelegation(league)
    if (league.hasCup) determineCupWinner(league)
  })
  
  // Transfer Window (Spieler wechseln AI-gesteuert)
  simulateTransferWindow()
  
  // Player Development
  players.forEach(player => {
    developPlayer(player) // Ability change based on age/games
    player.age++
  })
  
  // Reset für neue Saison
  currentWeek = 1
  currentSeason = incrementSeason(currentSeason)
  
  // Show Season Summary
  showSeasonSummary()
}
```

---

## 🧠 AI & Simulation

### Transfer-AI (Clubs)

**Angebote generieren:**
```javascript
function generateTransferOffer(player) {
  const abilityDiff = player.ability - player.currentClub.reputation
  const formBonus = player.form > 85 ? 1.2 : 1.0
  
  // 3 Szenarien für Angebote:
  
  // 1. Spieler zu gut für aktuellen Club
  if (abilityDiff > 10) {
    const targetClub = findBetterClub(player)
    
    offer = {
      type: "transfer",
      from: targetClub,
      value: player.value * formBonus,
      wage: player.wage * 1.3,  // 30% raise
      commissionBonus: random(10000, 100000)
    }
    
    player.pendingOffers.push(offer)
  }
  
  // 2. Spieler gut genug für Club, aber andere Clubs interessiert
  else if (Math.abs(abilityDiff) <= 10 && player.form > 80) {
    // Gute Form zieht Interesse an
    const interestedClub = findSimilarClub(player)
    
    if (random(0, 100) < 30) {  // 30% Chance bei hoher Form
      offer = {
        type: "transfer",
        from: interestedClub,
        value: player.value * formBonus,
        wage: player.wage * 1.15,  // 15% raise
        commissionBonus: random(5000, 50000)
      }
      
      player.pendingOffers.push(offer)
    }
  }
  
  // 3. Spieler zu schlecht für aktuellen Club
  else if (abilityDiff < -10) {
    const targetClub = findWeakerClub(player)
    
    offer = {
      type: "transfer",
      from: targetClub,
      value: player.value * 0.8,
      wage: player.wage * 0.9,  // 10% pay cut
      commissionBonus: random(1000, 10000)
    }
    
    player.pendingOffers.push(offer)
  }
}

function findBetterClub(player) {
  const suitableClubs = clubs.filter(c => 
    c.reputation >= player.currentClub.reputation + 10 &&
    c.reputation <= player.ability + 10 &&
    c.finances > player.value
  )
  
  return random(suitableClubs)
}

function findSimilarClub(player) {
  const suitableClubs = clubs.filter(c => 
    Math.abs(c.reputation - player.currentClub.reputation) <= 10 &&
    c.id !== player.currentClub.id &&
    c.finances > player.value
  )
  
  return random(suitableClubs)
}

function findWeakerClub(player) {
  const suitableClubs = clubs.filter(c => 
    c.reputation <= player.currentClub.reputation - 10 &&
    c.reputation >= player.ability - 10 &&
    c.finances > player.value * 0.8
  )
  
  return random(suitableClubs)
}
```

### Spieler-Entwicklung AI

**Vertragsverlängerung:**
```javascript
if (player.contractExpiry - currentDate < 1year) {
  if (player.happiness > 70) {
    offerRenewal(player)
  } else {
    // Unglücklicher Spieler lehnt ab
    requestTransfer(player)
  }
}
```

**Happiness-Faktoren:**
```javascript
function updateHappiness(player) {
  // Baseline decay
  player.happiness -= 1
  
  // Playing time
  if (player.gamesThisSeason < 10) player.happiness -= 2
  
  // Club match
  if (player.ability > player.currentClub.reputation + 20) {
    player.happiness -= 3  // Wants better club
  }
  
  // Agent attention
  if (lastInteractionWeeks > 10) player.happiness -= 2
  
  player.happiness = clamp(player.happiness, 0, 100)
}
```

---

## 🎨 Visuelle Features

### Charts & Visualisierungen

**Player Value Over Time:**
- Line Chart (X: Seasons, Y: Value)

**Agency Balance:**
- Line Chart (X: Weeks, Y: Balance)

**League Table:**
- Sortable Table mit Farbcodierung (Top 3, Playoffs, Relegation)

**Player Ability Distribution:**
- Histogram aller deiner Spieler

**Scout Performance:**
- Bar Chart (Finds per Scout)

---

## 📁 Datei-Struktur (Technisch)

```
/football-agent-game
├── index.html
├── styles/
│   ├── main.css
│   ├── components.css
│   └── themes.css
├── js/
│   ├── main.js
│   ├── game-state.js
│   ├── simulation.js
│   ├── ui.js
│   ├── players.js
│   ├── clubs.js
│   ├── leagues.js
│   ├── scouts.js
│   ├── finances.js
│   ├── events.js
│   ├── analytics.js
│   └── utils.js
├── data/
│   ├── leagues.json
│   ├── clubs.json
│   ├── names.json (Vor- und Nachnamen per Land)
│   └── save-game.json
└── assets/
    ├── flags/
    ├── club-logos/
    └── icons/
```

---

## 🚀 Entwicklungs-Roadmap

### Phase 1: Core MVP (2-3 Wochen)
- [x] Game State Management
- [x] Player Generation & Management
- [x] Club & League System
- [x] Basic Week Advancement
- [x] Simple Match Simulation
- [x] Basic UI (Dashboard, Players, Clubs)

### Phase 2: Simulation & Events (2 Wochen)
- [x] Scout System
- [x] Transfer Offers
- [x] Player Requests & Events
- [x] Injury System
- [x] Weekly Pop-up
- [x] End of Season Logic

### Phase 3: HQ & Finances (1 Woche)
- [x] HQ Upgrades
- [x] Property & Vehicles
- [x] Finance Tracking
- [x] Detailed P&L

### Phase 4: Analytics & Export (1 Woche)
- [x] Career History Tracking
- [x] Charts & Graphs
- [x] Export to CSV/JSON
- [x] Historical League Tables

### Phase 5: Polish & Features (Ongoing)
- [ ] Cup Competitions
- [ ] Advanced AI
- [ ] Save/Load System
- [ ] Multiple Save Slots
- [ ] Custom League Editor
- [ ] Mobile Responsive Design

---

## 🎯 Success Metrics

### Für Gameplay:
- Mindestens 10 Saisons spielbar ohne Bugs
- Realistische Spielerentwicklung
- Balancierte Finanzen (nicht zu einfach, nicht zu schwer)
- Spannende Events (nicht zu viele, nicht zu wenige)

### Für Analytics:
- Alle relevanten Daten exportierbar
- Charts lesbar und informativ
- Historische Daten vollständig

---

## 📝 Offene Fragen - BEANTWORTET

### 1. Spieler-Namen: Generierte Namen

**Name-Generation System:**
```javascript
// Spieler bekommen Vor- und Nachnamen passend zur Nationalität
const NATIONALITIES_DISTRIBUTION = {
  // Tier 1 (Starke Nationalmannschaften): 40%
  "Brazil": 8%, "Germany": 7%, "France": 6%, "Spain": 6%, 
  "England": 5%, "Italy": 4%, "Argentina": 4%,
  
  // Tier 2 (Gute Nationalmannschaften): 35%
  "Netherlands": 5%, "Portugal": 4%, "Belgium": 4%,
  "Switzerland": 3%, "Croatia": 3%, "Uruguay": 3%,
  "Colombia": 3%, "Denmark": 2.5%, "Sweden": 2.5%,
  "Austria": 2%, "Poland": 2%, "Czech Republic": 2%,
  
  // Tier 3 (Durchschnittliche NTs): 20%
  "Turkey": 2%, "Scotland": 2%, "Serbia": 2%,
  "Norway": 1.5%, "Greece": 1.5%, "Slovakia": 1.5%,
  "Romania": 1.5%, "Hungary": 1.5%, "Finland": 1.5%,
  // ... weitere
  
  // Tier 4 (Exotisch/Wildcard): 5%
  "Madagascar": 0.5%, "Ghana": 0.5%, "Senegal": 0.5%,
  "Japan": 0.5%, "South Korea": 0.5%, "Australia": 0.5%,
  // ... weitere
}

// Namen-Datenbank pro Land
const NAMES_BY_COUNTRY = {
  "Switzerland": {
    firstNames: ["Marco", "Granit", "Xherdan", "Yann", "Fabian", "Noah", "Luca", "Nico", ...],
    lastNames: ["Keller", "Dzemaili", "Shaqiri", "Sommer", "Schär", "Frei", "Gomez", "Elvedi", "Müller", "Akanji", ...]
  },
  "Brazil": {
    firstNames: ["Gabriel", "Vinicius", "Neymar", "Thiago", "Lucas", "Matheus", ...],
    lastNames: ["Silva", "Santos", "Oliveira", "Souza", "Costa", "Pereira", "Rodrigues", ...]
  },
  "Germany": {
    firstNames: ["Thomas", "Manuel", "Kai", "Leon", "Joshua", "Serge", ...],
    lastNames: ["Müller", "Neuer", "Havertz", "Goretzka", "Kimmich", "Gnabry", "Wagner", ...]
  },
  // ... für alle Länder
}

function generatePlayer(country) {
  const firstName = random(NAMES_BY_COUNTRY[country].firstNames)
  const lastName = random(NAMES_BY_COUNTRY[country].lastNames)
  
  return {
    name: `${firstName} ${lastName}`,
    nationality: country,
    // ... rest of player data
  }
}
```

**Namens-Diversität:**
- Schweiz: Mix aus deutschen (Müller, Keller), albanischen (Dzemaili, Xhaka), spanischen (Gomez, Rodriguez), französischen (Frei), afrikanischen (Akanji, Embolo) Namen
- England: Mix aus englischen, karibischen, afrikanischen Namen
- Deutschland: Deutsche + türkische + polnische Namen
- Frankreich: Französische + maghrebinische + afrikanische Namen

### 2. Club-Namen & Logos

**Erkennbar aber leicht verändert:**
```javascript
const CLUB_NAME_VARIATIONS = {
  // Original → In-Game Name
  "Manchester United": "Man Utd",
  "Manchester City": "Man City",
  "Liverpool": "Liverpool FC",
  "Chelsea": "Chelsea FC",
  "Arsenal": "Arsenal FC",
  "Tottenham": "Spurs",
  
  // Niederlande
  "Ajax Amsterdam": "Ajax",
  "PSV Eindhoven": "PSV",
  "Feyenoord Rotterdam": "Feyenoord",
  "FC Utrecht": "Utrecht",
  
  // Deutschland
  "Bayern München": "Bayern",
  "Borussia Dortmund": "Dortmund",
  "RB Leipzig": "Leipzig",
  
  // Schweiz
  "FC Basel": "Basel",
  "BSC Young Boys": "Young Boys",
  "FC Zürich": "Zürich"
  // ...
}
```

**Logo-System:**
- **Generische Icons** mit Team-Farben
- **Ähnliche Elemente** zu echten Logos (z.B. Man Utd → roter Teufel, Ajax → rotes/weißes Schild)
- **SVG-basiert** für Skalierbarkeit
- **2-3 Farben pro Club** (basierend auf echten Trikotfarben)

```javascript
const CLUB_COLORS = {
  "Man Utd": { primary: "#DA291C", secondary: "#FBE122" },  // Rot/Gelb
  "Man City": { primary: "#6CABDD", secondary: "#FFFFFF" },  // Hellblau/Weiß
  "Ajax": { primary: "#D2122E", secondary: "#FFFFFF" },      // Rot/Weiß
  "PSV": { primary: "#ED1C24", secondary: "#FFFFFF" },       // Rot/Weiß
  "Feyenoord": { primary: "#E30613", secondary: "#FFFFFF" }  // Rot/Weiß
  // ...
}
```

### 3. Speicher-System
**localStorage only** - Kein Cloud-Sync (erstmal)

### 4. Multiplayer
**Nein** (erstmal nicht)

### 5. Monetarisierung
**Komplett kostenlos** (erstmal nicht)

---

## 🔚 Schlusswort

Dieses Design-Doc bildet die Grundlage für ein vollständiges Football Agent Management Game mit starkem Fokus auf Datenerfassung und Analytics.

Die Architektur ist modular aufgebaut, sodass Features inkrementell entwickelt werden können, ohne das Kernsystem zu brechen.

**Nächste Schritte:**
1. Review dieses Dokuments
2. Feedback & Anpassungen
3. Technische Architektur finalisieren
4. Mit Phase 1 Development starten

---

**Version History:**
- v1.0 (2026-04-25): Initial Design Doc
- v2.0 (2026-04-25): Updates nach Jens' Feedback
  - 10 detaillierte Positionen (GK, CB, LB, RB, CDM, CM, CAM, RW, LW, ST)
  - Saison-Länge: 46 Wochen
  - Transfer-Windows: Woche 1-6, 22-26
  - European Football als Liga-Result
  - Erweiterte Transfer-AI (Form-basiert, 3 Szenarien)
  - Detailliertes Namen-System (nationalitäts-basiert)
  - Club-Namen & Logo-System definiert
