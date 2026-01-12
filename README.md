# PPC Intelligence Agent 🤖

An autonomous Google Ads management agent built with the **Claude Agent SDK pattern**. This agent can analyze, optimize, and report on PPC campaigns using AI-driven decision making.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR AGENT                           │
│              (Claude claude-sonnet-4-5-20250929)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ HEALTH CHECK│  │ COMPETITOR  │  │  KEYWORD    │             │
│  │ SUB-AGENT   │  │ INTEL AGENT │  │  RESEARCH   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
├─────────┴────────────────┴────────────────┴─────────────────────┤
│                        TOOLS LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Google Ads  │  │ DataForSEO  │  │   Future    │             │
│  │    API      │  │    API      │  │   Tools     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### 🚀 Campaign Builder (NEW!)
**Create complete campaigns from natural language descriptions!**

```bash
npm run campaign design landscape_design    # Design only
npm run campaign validate lawn_care         # Design + validate
npm run campaign create hardscaping         # Actually create!
```

The campaign builder:
- Designs optimal campaign structure from your description
- Creates ad groups with themed keywords
- Generates Google-compliant ad copy (30-char headlines, 90-char descriptions)
- Sets up location targeting for Central Ohio
- Validates everything via dry run before creating
- Creates campaigns in PAUSED state for safety

### 🏥 Health Check
- Identifies wasted spend (keywords with clicks, no conversions)
- Calculates key metrics vs benchmarks (CTR, CPC, CPA)
- Prioritizes issues by dollar impact
- Provides actionable recommendations

### 🔍 Competitor Intelligence
- Finds competitors bidding on same keywords
- Analyzes their keyword strategies
- Identifies gap opportunities
- Estimates competitor spend

### 🔑 Keyword Research
- Search volume and CPC data
- Long-tail keyword discovery
- Local intent keyword finding
- Seasonal trend analysis

### 📊 Full Audit
- Combines all capabilities
- Comprehensive account analysis
- Prioritized action plan
- ROI projections

## Installation

```bash
cd ppc-agent
npm install

# Copy env template and fill in your credentials
cp env.example.txt .env
```

## Configuration

Create a `.env` file with:

```env
# Required
ANTHROPIC_API_KEY=sk-ant-api03-...
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_REFRESH_TOKEN=...
GOOGLE_ADS_LOGIN_CUSTOMER_ID=...
GOOGLE_ADS_DEFAULT_CUSTOMER_ID=...

# Optional (for competitor intel)
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...
```

## Usage

### CLI Commands

```bash
# CAMPAIGN CREATION (the killer feature!)
npm run campaign list                       # See example campaigns
npm run campaign design landscape_design    # Design campaign structure
npm run campaign validate lawn_care         # Design + dry run validation
npm run campaign create hardscaping         # Actually create the campaign!

# ANALYSIS & OPTIMIZATION
npm run start -- audit                      # Full account audit
npm run start -- health                     # Quick health check
npm run start -- competitors domain1.com    # Competitor analysis
npm run start -- keywords "lawn care"       # Keyword research
npm run start -- chat                       # Interactive mode
```

### Programmatic Usage

```typescript
import { runAgent, workflows } from './src/index.js';

// Run a specific workflow
const result = await workflows.fullAudit();
console.log(result.response);

// Or run custom queries
const result = await runAgent(`
  Analyze the performance of my "Leads-Search" campaign
  and recommend bid adjustments for underperforming keywords.
`);
```

## Extending the Agent

### Adding New Tools

Create a new file in `src/tools/`:

```typescript
export const myTools = {
  my_tool: {
    name: 'my_tool',
    description: 'Does something useful',
    input_schema: {
      type: 'object',
      properties: {
        param: { type: 'string' }
      },
      required: ['param']
    },
    handler: async ({ param }) => {
      // Implementation
      return { result: 'success' };
    }
  }
};
```

### Adding Sub-Agents

Create a new file in `src/agents/`:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a specialized agent for...`;

export async function runMySubAgent(params: any) {
  // Agent implementation with tool loop
}
```

Then register in `orchestrator.ts`.

## Roadmap

- [ ] **v0.2**: Mutation tools (pause keywords, adjust bids) with approval workflow
- [ ] **v0.3**: Scheduled runs (daily health checks, weekly reports)
- [ ] **v0.4**: Multi-account management
- [ ] **v0.5**: Slack/email notifications
- [ ] **v1.0**: Web dashboard

## Security

- All mutation operations require explicit `dry_run: false`
- Queries are validated to prevent SQL injection
- API keys are never logged
- Rate limiting built into tool handlers

## License

Proprietary - Stiltner Landscapes & Co.
