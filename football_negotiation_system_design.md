# System Design Specification: Dynamic Agent-Club Negotiation Mechanic

## 1. System Overview & Architecture Goals
This document specifies the design for a dynamic, emergent contract negotiation mechanic in a football management game.

### Core Role Definition
* **User (Player Character):** Football Player Agent. Primary goals are maximizing player compensation, securing long-term career stability or strategic mobility, and earning personal agent commission.
* **CPU (Opponent):** Football Club (represented by the Sporting Director / Board). Primary goals are minimizing total financial exposure, staying within wage budget limits, maintaining squad wage parity, and securing player contract length based on asset value.

### Key Architectural Goal: Emergent Play over Fixed Options
Rather than selecting explicit tactical "stances" from a menu, the negotiation strategy emerges naturally from **how the user manipulates numbers round-by-round**. The CPU analyzes offer ratios, concession velocity, and historical relationship scores to infer agent intent and adjust its bargaining behavior dynamically.

---

## 2. Core Variables & State Management

### 2.1 Negotiation Terms (User & CPU Inputs)
| Parameter | Symbol | Range | Unit / Scale | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Weekly Wage** | $W$ | $\$1,000 - \$500,000+$ | $\$ /$ week | Recurring financial cost to club. |
| **Contract Length** | $L$ | $1 - 5$ | Years | Contract duration. Value impact depends on player age and profile. |
| **Agent Fee** | $F$ | $\$0 - \$10,000,000+$ | Lump Sum ($\$) | One-off payout to the user/agent upon signing. |

### 2.2 Club Internal State Variables
* **Maximum Budget ($B_{\text{max}}$):** Total financial allocation for the deal over its lifespan.
  $$B_{\text{max}} = (W_{\text{budget}} \times 52 \times L) + F_{\text{budget}}$$
* **Wage Ceiling ($W_{\text{cap}}$):** Soft cap based on existing squad hierarchy to avoid team unrest.
* **Plan B Threat Meter ($P_{\text{threat}}$):** Range $[0.0, 100.0\%]$. Replaces standard static turn counters. Represents the club actively pursuing alternative transfer targets.
  * Starts at $0\%$ (or higher if `Club_Relationship` is poor).
  * If $P_{\text{threat}} \ge 100\%$, the CPU terminates negotiations immediately and signs a alternative target.
* **Acceptance Threshold Score ($S_{\text{target}}$):** The baseline Package Score the club expects to achieve.

### 2.3 Long-Term & External Variables
* **Club Relationship ($R_{\text{club}}$):** Persistent metric between $-100$ (Hated) and $+100$ (Loved).
* **Player Morale / Loyalty ($M_{\text{player}}$):** Player's satisfaction with current agent actions. Over-leveraging the player for personal agent fees causes dissatisfaction.

---

## 3. Evaluation Math & Formulas

### 3.1 Package Valuation Score ($S$)
The CPU converts any 3-variable proposal into a unified financial Package Score:

$$S = w_w \cdot \left(\frac{W}{W_{\text{target}}}\right) + w_l \cdot f(L, \text{Age}) + w_f \cdot \left(\frac{F}{F_{\text{target}}}\right)$$

Where:
* $w_w, w_l, w_f$ are weight coefficients depending on club priority (default: $w_w = 0.55, w_l = 0.25, w_f = 0.20$).
* $f(L, \text{Age})$ is the Length Value Function:
  * **Young Stars ($	ext{Age} < 24$):** Longer contracts preferred ($L=4, 5$ yields score discount).
  * **Veterans ($	ext{Age} > 31$):** Shorter contracts preferred ($L=1, 2$ preferred; $L \ge 4$ incurs score penalty).

### 3.2 Offer Metrics & Tracking Ratios
At each round $t$, the CPU computes three real-time behavioral metrics:

1. **Agent-to-Wage Greed Ratio ($R_{\text{greed}}$):**
   $$R_{\text{greed}} = \frac{F_t}{W_t \times 52}$$

2. **Wage Premium Ratio ($R_{\text{wage}}$):**
   $$R_{\text{wage}} = \frac{W_t}{W_{\text{club\_initial}}}$$

3. **Concession Velocity ($V_{\text{concess}}$):** Measure of how much the agent moved toward the club's last counter-offer:
   $$V_{\text{concess}} = \frac{(W_{t-1} - W_t) + (F_{t-1} - F_t)}{(W_{t-1} - W_{\text{club\_counter}}) + (F_{t-1} - F_{\text{club\_counter}})}$$

---

## 4. Emergent Pattern Detection Engine

The CPU classifies agent behavior based on thresholds calculated from $R_{\text{greed}}$, $R_{\text{wage}}$, and $V_{\text{concess}}$.

```
                     HIGH AGENT FEE (R_greed > 0.25)
                                   ▲
                                   │
      PROFILE 1: "THE PARASITE"    │    PROFILE 3: "THE WILDCAT"
   (Greedy Agent, Moderate Wage)   │   (Max Wage + Max Fee Demands)
                                   │
LOW WAGE ──────────────────────────┼──────────────────────────► HIGH WAGE
(R_wage < 1.1)                     │                            (R_wage > 1.3)
                                   │
     PROFILE 4: "REASONABLE DEALS" │    PROFILE 2: "CLIENT'S CHAMPION"
   (Balanced / Fast Agreement)     │   (High Wage, Waived/Low Fee)
                                   │
                                   ▼
                     LOW AGENT FEE (R_greed < 0.10)
```

### 4.1 Profile Mechanics & CPU Responses

| Emergent Profile | Trigger Conditions | CPU AI Reaction & Impact |
| :--- | :--- | :--- |
| **1. The Parasite** | $R_{\text{greed}} > 0.25$ AND $R_{\text{wage}} < 1.15$ | *  Club suspects agent self-interest over client welfare.<br>*  If $R_{\text{club}} < 0$, CPU freezes Agent Fee increases.<br>*  Player Morale ($M_{\text{player}}$) drops if deal leaks.<br>*  Plan B Threat increases by $+10\%$ per turn. |
| **2. Client's Champion** | $R_{\text{greed}} < 0.08$ AND $R_{\text{wage}} > 1.25$ | *  Club respects agent prioritizing player.<br>*  CPU willing to flex Wage Ceiling ($W_{\text{cap}}$) by up to $+10\%$.<br>*  Plan B Threat increase reduced by $-50\%$.<br>*  $+5$ $R_{\text{club}}$ upon deal completion. |
| **3. The Wildcat** | $R_{\text{wage}} > 1.35$ AND $R_{\text{greed}} > 0.20$ AND $V_{\text{concess}} < 0.1$ | *  CPU perceives non-credible or arrogant negotiation.<br>*  Plan B Threat increases rapidly ($+25\%$ to $+35\%$ per turn).<br>*  CPU issues hard ultimatum counter-offers early. |
| **4. Asset Optimizer** | Length $L$ matches Club preference AND $V_{\text{concess}} \ge 0.3$ | *  Smooth negotiation flow.<br>*  Plan B Threat increase minimal ($+5\%$ per turn).<br>*  CPU counter-offers give clear financial hints in dialogue. |

---

## 5. Long-Term Relationship System (`Club_Relationship`)

The persistent variable $R_{\text{club}} \in [-100, 100]$ alters baseline parameters at the start of every deal and is updated at conclusion.

### 5.1 Initial Modifiers Based on $R_{\text{club}}$
* **Loved ($R_{\text{club}} \ge +50$):**
  * Starting Plan B Threat: $0\%$.
  * Threat accumulation rate: $-30\%$ modifier.
  * Budget flexibility: $+5\%$ buffer on $B_{\text{max}}$.
  * Dialogue feedback gives precise numeric hints (*"We can offer at most $65k/week"*).
* **Neutral ($-49 \le R_{\text{club}} \le +49$):** Standard baseline mechanics.
* **Hated ($R_{\text{club}} \le -50$):**
  * Starting Plan B Threat: $30\%$.
  * Threat accumulation rate: $+50\%$ modifier.
  * Strict cap on Agent Fees ($F \le 0.10 \times B_{\text{max}}$).
  * Dialogue feedback is cold and uninformative (*"Unacceptable. Provide a realistic figure."*).

### 5.2 Post-Negotiation Relationship Updates
At the end of a negotiation, $R_{\text{club}}$ updates according to outcome:

```python
def update_club_relationship(outcome, profile_used, turns_taken):
    delta = 0
    if outcome == "AGREEMENT":
        if profile_used == "CLIENT_CHAMPION":
            delta += 8
        elif profile_used == "PARASITE":
            delta -= 4
        elif profile_used == "WILDCAT":
            delta -= 6
        
        # Fast deal bonus
        if turns_taken <= 2:
            delta += 4
            
    elif outcome == "WALKOUT":
        delta -= 20
    elif outcome == "ULTIMATUM_REJECTED":
        delta -= 15

    return clamp(current_relationship + delta, -100, 100)
```

---

## 6. Algorithmic State Machine & Flow

```
                               ┌──────────────────────────────────┐
                               │     1. INITIALIZE NEGOTIATION    │
                               │ - Load Player, Club, R_club      │
                               │ - Set P_threat based on R_club   │
                               └────────────────┬─────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 2. USER SUBMITS OFFER                                   │
│                                 (Wage, Length, Fee)                                     │
└───────────────────────────────────────────────┬─────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               3. EVALUATE & CLASSIFY                                    │
│ - Compute Package Score S vs S_target                                                   │
│ - Calculate R_greed, R_wage, V_concess                                                  │
│ - Determine Emergent Profile (Parasite, Champion, Wildcat, Optimizer)                   │
└───────────────────────────────────────────────┬─────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                             4. UPDATE PLAN B THREAT METER                               │
│ - P_threat += Base_Increment * Profile_Modifier * R_club_Modifier                       │
└───────────────────────────────────────────────┬─────────────────────────────────────────┘
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │ Is P_threat >= 100%?  │
                                    └───────────┬───────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼ YES                                             ▼ NO
        ┌──────────────────────────────┐                 ┌──────────────────────────────┐
        │       5A. CLUB WALKOUT       │                 │   5B. CHECK SCORE ACCEPTANCE │
        │ - Negotiation Fails          │                 │       Is S <= S_target?      │
        │ - R_club -= 20               │                 └──────────────┬───────────────┘
        └──────────────────────────────┘                                │
                                                       ┌────────────────┴────────────────┐
                                                       ▼ YES                             ▼ NO
                                        ┌──────────────────────────────┐ ┌──────────────────────────────┐
                                        │        6A. DEAL SIGNED!      │ │     6B. GENERATE COUNTER     │
                                        │ - Contract Finalized         │ │ - CPU adjusts W, L, F        │
                                        │ - Update R_club (+/ -)       │ │ - Output Dialogue Feedback   │
                                        └──────────────────────────────┘ └──────────────┬───────────────┘
                                                                                        │
                                                                                        ▼
                                                                             (Loop back to Step 2)
```

---

## 7. Data Structure Schemas (for Implementation)

Below are JSON/Data Model structures designed for straightforward code generation by Claude Code / LLM tools:

### 7.1 Negotiation Session State Schema
```json
{
  "session_id": "neg_2026_001",
  "club_id": "fc_barcelona",
  "player_id": "player_8821",
  "agent_id": "agent_main",
  "club_relationship": 15,
  "turn_number": 1,
  "plan_b_threat": 0.0,
  "max_budget": 15000000,
  "wage_ceiling": 90000,
  "target_package_score": 100.0,
  "last_user_offer": {
    "weekly_wage": 0,
    "contract_length": 0,
    "agent_fee": 0
  },
  "last_club_counter": {
    "weekly_wage": 60000,
    "contract_length": 3,
    "agent_fee": 400000
  },
  "detected_profile": "NEUTRAL"
}
```

### 7.2 Dialogue Reaction Matrix Mapping
```json
{
  "dialogue_triggers": [
    {
      "profile": "PARASITE",
      "threat_level": "LOW",
      "text": "Your commission demands are quite steep, agent. Let's focus on what the player actually takes home."
    },
    {
      "profile": "PARASITE",
      "threat_level": "HIGH",
      "text": "We are not going to line your pockets at the expense of our wage structure. We are actively looking at other options."
    },
    {
      "profile": "CLIENT_CHAMPION",
      "threat_level": "LOW",
      "text": "We respect how hard you are fighting for your client. We can stretch our wage structure slightly to make this work."
    },
    {
      "profile": "WILDCAT",
      "threat_level": "HIGH",
      "text": "These demands are completely out of touch with market reality. Take our counter-offer seriously or this meeting is over."
    }
  ]
}
```

---

## 8. Summary of Key Gameplay Loop Benefits
1. **No Exploitative Max-Slider Cheats:** Opening with maximum agent fees or ungrounded wages immediately triggers "The Parasite" or "The Wildcat" profiles, spiking the Plan B Threat meter and provoking rapid walkouts.
2. **Dynamic Strategic Depth:** Players learn to read the club's dialogue hints, manage tension across rounds, and decide when to sacrifice agent fee in favor of player wage or long-term club relationship.
3. **Long-Term Career Consequences:** Burning bridges with clubs via aggressive tactics carries persistent penalties into future transfer windows, forcing players to think multi-seasonally.
