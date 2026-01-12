# PPC Intel Agent 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Claude Agent SDK](https://img.shields.io/badge/Claude-Agent%20SDK-orange.svg)](https://docs.anthropic.com/claude/docs/agents)

**Create complete Google Ads campaigns from natural language descriptions.**

> "Create a landscape design campaign targeting Dublin and Powell Ohio with a $50/day budget"  
> → Full campaign with ad groups, keywords, and responsive search ads in seconds.

---

## ✨ Features

### 🚀 Campaign Builder (Production-Ready)
Create complete Google Ads campaigns from natural language:

```bash
npm run campaign design landscape_design    # Design only
npm run campaign validate lawn_care         # Design + dry run validation
npm run campaign create hardscaping         # Actually create (PAUSED)
```

**What it creates:**
- Campaign with budget & bidding strategy
- Multiple themed ad groups
- Keywords with appropriate match types (EXACT, PHRASE, BROAD)
- Responsive search ads (15 headlines, 4 descriptions)
- Location targeting (Ohio cities)
- All Google Ads policy compliant

### 🏥 Health Check Agent
Identify wasted spend and optimization opportunities:

```bash
npm run health-check
```

- Finds keywords with clicks but zero conversions
- Calculates CTR, CPC, CPA vs benchmarks
- Prioritizes issues by dollar impact
- Provides actionable quick wins

### 🔍 Competitor Intelligence
Analyze competitor PPC strategies:

```bash
npm run competitor-intel greenscape.com ohiolawns.com
```

- Finds competitors bidding on your keywords
- Analyzes their keyword strategies
- Identifies gap opportunities
- Uses DataForSEO for market intelligence

### 💰 Budget Optimizer
Maximize ROI with smart budget reallocation:

- Identifies high-performing campaigns for budget increase
- Finds underperformers for budget reduction
- Calculates expected impact
- Considers seasonality

### 📝 Ad Copy Tester
Generate A/B test variations:

- Creates policy-compliant ad variations
- Tests different emotional appeals
- Validates character limits
- Provides hypothesis for each test

### 🚫 Negative Keyword Analyzer
Stop wasted spend:

- Analyzes search terms report
- Identifies irrelevant traffic
- Recommends negatives by category
- Calculates expected savings

### 🔑 Keyword Research
Find high-value keywords:

```bash
npm run keyword-research "landscape design" "lawn care"
```

- Search volume and CPC data
- Competition analysis
- Long-tail variations
- Local intent keywords

### 📊 Full Audit
Comprehensive account analysis:

```bash
npm run full-audit
```

Combines all agents for complete PPC audit.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PPC INTELLIGENCE AGENT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        ORCHESTRATOR AGENT                            │    │
│  │                    (Claude claude-sonnet-4-20250514)                          │    │
│  └───────────────────────────┬─────────────────────────────────────────┘    │
│                              │                                               │
│    ┌──────────────┬──────────┼──────────┬──────────────┬──────────────┐     │
│    ▼              ▼          ▼          ▼              ▼              ▼     │
│ ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │
│ │Campaign│  │ Health │  │Compet. │  │ Budget │  │Ad Copy │  │Negative│    │
│ │Builder │  │ Check  │  │ Intel  │  │Optimize│  │ Tester │  │Keyword │    │
│ └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘    │
│      │           │           │           │           │           │         │
│      └───────────┴───────────┼───────────┴───────────┴───────────┘         │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         TOOLS LAYER                                  │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │   │
│  │  │   MCP Bridge    │  │  Google Ads API │  │   DataForSEO    │      │   │
│  │  │ (@channel47 MCP)│  │  (Direct Query) │  │   (Research)    │      │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/abjohnson5f/ppc-intel-agent.git
cd ppc-intel-agent
npm install
```

### 2. Configure Environment

```bash
# Create .env from template
./setup-env.sh

# Edit .env with your credentials
nano .env
```

**Required credentials:**
- `ANTHROPIC_API_KEY` - [Get from Anthropic Console](https://console.anthropic.com/settings/keys)
- Google Ads API credentials (from your MCP config at `~/.cursor/mcp.json`)
- DataForSEO credentials (optional, for competitor intel)

### 3. Test Campaign Builder

```bash
# List example campaigns
npm run campaign list

# Validate a campaign (dry run)
npm run campaign validate landscape_design
```

### 4. Create Your First Campaign

```bash
# This will CREATE a real campaign (in PAUSED state)
npm run campaign create "Lawn care campaign for Dublin Ohio with $30/day budget"
```

---

## 📖 Usage

### CLI Commands

| Command | Description |
|---------|-------------|
| `npm run campaign list` | Show example campaign types |
| `npm run campaign design <type>` | Design campaign structure |
| `npm run campaign validate <type>` | Design + dry run validation |
| `npm run campaign create <type>` | Actually create campaign |
| `npm run health-check` | Run account health check |
| `npm run competitor-intel [domains...]` | Analyze competitors |
| `npm run keyword-research [keywords...]` | Research keywords |
| `npm run full-audit` | Run comprehensive audit |
| `npm run webhook-server` | Start webhook server for n8n |

### Campaign Types (Examples)

| Type | Description |
|------|-------------|
| `landscape_design` | Landscape design services |
| `lawn_care` | Lawn care & maintenance |
| `hardscaping` | Patios, retaining walls |
| `outdoor_living` | Outdoor kitchens, fire pits |
| `seasonal` | Spring cleanup, fall cleanup |

### Programmatic Usage

```typescript
import { workflows } from 'ppc-intelligence-agent';

// Run a full audit
const audit = await workflows.fullAudit();
console.log(audit.response);

// Create a campaign
const campaign = await workflows.createCampaign(
  'Landscape design campaign for Dublin Ohio',
  { dryRun: true }
);

// Research keywords
const keywords = await workflows.keywordResearch(
  ['landscape design', 'lawn care'],
  'Columbus,Ohio,United States'
);
```

---

## 🔗 n8n Integration

Start the webhook server:

```bash
npm run webhook-server
# Server runs on http://localhost:3847
```

### Webhook Endpoints

**POST `/webhook`**
```json
{
  "action": "health-check"
}
```

**Available actions:**
- `health-check` - Run account health check
- `full-audit` - Run comprehensive audit
- `create-campaign` - Create a new campaign
- `keyword-research` - Research keywords
- `competitor-analysis` - Analyze competitors
- `custom` - Run custom query

### n8n HTTP Request Node Config

```
URL: http://YOUR_SERVER:3847/webhook
Method: POST
Body (JSON):
{
  "action": "create-campaign",
  "params": {
    "description": "Lawn care campaign for Powell Ohio",
    "dry_run": true
  }
}
```

---

## 🔐 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | Claude API key |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | ✅ | Google Ads developer token |
| `GOOGLE_ADS_CLIENT_ID` | ✅ | OAuth client ID |
| `GOOGLE_ADS_CLIENT_SECRET` | ✅ | OAuth client secret |
| `GOOGLE_ADS_REFRESH_TOKEN` | ✅ | OAuth refresh token |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | ✅ | MCC account ID |
| `GOOGLE_ADS_DEFAULT_CUSTOMER_ID` | ✅ | Target client account ID |
| `DATAFORSEO_LOGIN` | ❌ | DataForSEO API login |
| `DATAFORSEO_PASSWORD` | ❌ | DataForSEO API password |
| `SLACK_WEBHOOK_URL` | ❌ | Slack webhook for notifications |
| `AGENT_MODEL` | ❌ | Claude model (default: claude-sonnet-4-5-20250929) |
| `AGENT_MAX_TOKENS` | ❌ | Max tokens (default: 8192) |

### Google Ads Account Structure

This agent is configured for:
- **MCC Account:** Your manager account (LOGIN_CUSTOMER_ID)
- **Client Account:** The account to manage (DEFAULT_CUSTOMER_ID)

---

## 📁 Project Structure

```
ppc-agent/
├── src/
│   ├── index.ts                          # Main entry point
│   ├── run-campaign-builder.ts           # Campaign CLI
│   ├── run-health-check.ts               # Health check CLI
│   ├── run-competitor-intel.ts           # Competitor CLI
│   ├── run-full-audit.ts                 # Full audit CLI
│   ├── run-keyword-research.ts           # Keyword research CLI
│   ├── webhook-server.ts                 # n8n webhook server
│   ├── config/
│   │   └── index.ts                      # Zod-validated config
│   ├── agents/
│   │   ├── orchestrator.ts               # Main coordinator
│   │   ├── campaign-builder-agent.ts     # Campaign creation
│   │   ├── health-check-agent.ts         # Health analysis
│   │   ├── competitor-intel-agent.ts     # Competitor research
│   │   ├── budget-optimizer-agent.ts     # Budget optimization
│   │   ├── ad-copy-tester-agent.ts       # Ad copy generation
│   │   └── negative-keyword-agent.ts     # Negative keywords
│   └── tools/
│       ├── mcp-bridge.ts                 # Spawns @channel47 MCP
│       ├── google-ads.ts                 # Direct Google Ads API
│       ├── dataforseo.ts                 # DataForSEO API
│       └── notifications.ts              # Slack notifications
├── package.json
├── tsconfig.json
├── setup-env.sh                          # Environment setup script
└── README.md
```

---

## 🛡️ Safety Features

1. **Dry Run by Default** - All campaigns validate before creation
2. **PAUSED State** - New campaigns are created PAUSED for review
3. **Content Sanitization** - Auto-truncates to meet character limits
4. **Policy Validation** - Checks for common ad policy violations
5. **Partial Failure Mode** - Identifies specific operation failures

---

## 📈 Roadmap

- [x] Campaign Builder with dry run
- [x] Health Check Agent
- [x] Competitor Intel Agent
- [x] Budget Optimizer Agent
- [x] Ad Copy Tester Agent
- [x] Negative Keyword Agent
- [x] n8n Webhook Integration
- [x] Slack Notifications
- [ ] Bid Adjustment Agent
- [ ] Landing Page Analyzer
- [ ] Automated Reporting
- [ ] Multi-account Support

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [@channel47/google-ads-mcp](https://github.com/channel47/google-ads-mcp-server) for the MCP server
- [Anthropic](https://anthropic.com) for Claude and the Agent SDK
- [DataForSEO](https://dataforseo.com) for competitive intelligence APIs
