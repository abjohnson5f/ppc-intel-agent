/**
 * PPC Intelligence Orchestrator
 * 
 * This is the main agent that coordinates sub-agents and tools
 * to provide comprehensive PPC management capabilities.
 */

import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/index.js';
import { runHealthCheck, type HealthCheckResult } from './health-check-agent.js';
import { runCompetitorIntel, type CompetitorIntelResult } from './competitor-intel-agent.js';
import { createCampaign, campaignBuilderTool } from './campaign-builder-agent.js';
import { runBudgetOptimizer, budgetOptimizerTool } from './budget-optimizer-agent.js';
import { runAdCopyTester, adCopyTesterTool } from './ad-copy-tester-agent.js';
import { runNegativeKeywordAnalysis, negativeKeywordTool } from './negative-keyword-agent.js';
import { toolDefinitions as googleAdsTools, toolHandlers as googleAdsHandlers } from '../tools/google-ads.js';
import { toolDefinitions as dataForSEOTools, toolHandlers as dataForSEOHandlers } from '../tools/dataforseo.js';
import { toolDefinitions as notificationTools, toolHandlers as notificationHandlers } from '../tools/notifications.js';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const ORCHESTRATOR_SYSTEM_PROMPT = `You are an elite PPC Intelligence Agent for managing Google Ads campaigns. You have access to:

## Sub-Agents (High-Level Tasks)
- **Health Check Agent**: Run comprehensive account health analysis
- **Competitor Intel Agent**: Analyze competitor PPC strategies
- **Campaign Builder Agent**: Create new campaigns from descriptions
- **Budget Optimizer Agent**: Recommend budget reallocations
- **Ad Copy Tester Agent**: Generate A/B test ad variations
- **Negative Keyword Agent**: Find and add negative keywords

## Direct Tools (Granular Tasks)
- Google Ads API tools for querying campaign/keyword data
- DataForSEO tools for market research and competitor analysis
- Notification tools for sending alerts

## Your Capabilities
1. **Audit**: Run full account audits identifying waste and opportunities
2. **Research**: Research keywords, competitors, and market trends
3. **Optimize**: Recommend bid adjustments, negative keywords, new keywords
4. **Create**: Build new campaigns from natural language descriptions
5. **Report**: Generate executive summaries and detailed reports
6. **Alert**: Send notifications about important findings

## Guidelines
- Always start with data gathering before making recommendations
- Prioritize recommendations by ROI impact
- Consider seasonal trends for landscaping businesses
- Focus on local/geo-targeted opportunities
- Be specific with numbers and dollar amounts
- Use sub-agents for complex multi-step tasks
- Use direct tools for specific data queries

## Output Format
Structure your responses with:
- **Summary**: 2-3 sentence overview
- **Key Findings**: Bullet points of important discoveries
- **Recommendations**: Prioritized action items with expected impact
- **Next Steps**: What to do immediately

Remember: You're optimizing for a landscaping business in Central Ohio (Dublin, Powell, Galena, New Albany).`;

// Sub-agent tools that the orchestrator can call
const subAgentTools: Anthropic.Tool[] = [
  {
    name: 'run_health_check',
    description: 'Run a comprehensive health check on the Google Ads account. Returns analysis of wasted spend, efficiency issues, and recommendations.',
    input_schema: {
      type: 'object' as const,
      properties: {
        customer_id: {
          type: 'string',
          description: 'Optional specific customer ID to check',
        },
      },
      required: [],
    },
  },
  {
    name: 'run_competitor_intel',
    description: 'Analyze competitor PPC strategies, find gap keywords, and identify attack opportunities.',
    input_schema: {
      type: 'object' as const,
      properties: {
        target_domain: {
          type: 'string',
          description: 'Your domain (e.g., stiltnerlandscapes.com)',
        },
        seed_keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Seed keywords to analyze',
        },
        location: {
          type: 'string',
          default: 'United States',
        },
      },
      required: ['target_domain', 'seed_keywords'],
    },
  },
  {
    name: campaignBuilderTool.name,
    description: campaignBuilderTool.description,
    input_schema: campaignBuilderTool.input_schema,
  },
  {
    name: budgetOptimizerTool.name,
    description: budgetOptimizerTool.description,
    input_schema: budgetOptimizerTool.input_schema,
  },
  {
    name: adCopyTesterTool.name,
    description: adCopyTesterTool.description,
    input_schema: adCopyTesterTool.input_schema,
  },
  {
    name: negativeKeywordTool.name,
    description: negativeKeywordTool.description,
    input_schema: negativeKeywordTool.input_schema,
  },
];

// Combine all tools
const allTools = [...subAgentTools, ...googleAdsTools, ...dataForSEOTools, ...notificationTools];

// Combined handler map
const allHandlers: Record<string, (args: any) => Promise<any>> = {
  ...googleAdsHandlers,
  ...dataForSEOHandlers,
  ...notificationHandlers,
  // Sub-agent handlers
  run_health_check: async ({ customer_id }: { customer_id?: string }) => {
    return await runHealthCheck(customer_id);
  },
  run_competitor_intel: async ({ 
    target_domain, 
    seed_keywords, 
    location 
  }: { 
    target_domain: string; 
    seed_keywords: string[]; 
    location?: string 
  }) => {
    return await runCompetitorIntel(target_domain, seed_keywords, location);
  },
  [campaignBuilderTool.name]: campaignBuilderTool.handler,
  [budgetOptimizerTool.name]: budgetOptimizerTool.handler,
  [adCopyTesterTool.name]: adCopyTesterTool.handler,
  [negativeKeywordTool.name]: negativeKeywordTool.handler,
};

export interface OrchestratorOptions {
  maxIterations?: number;
  verbose?: boolean;
}

export interface AgentResponse {
  response: string;
  toolCalls: Array<{ tool: string; input: any; result: any }>;
  usage: { inputTokens: number; outputTokens: number };
}

/**
 * Run the PPC Intelligence Agent
 */
export async function runAgent(
  userMessage: string,
  options: OrchestratorOptions = {}
): Promise<AgentResponse> {
  const { maxIterations = 10, verbose = true } = options;

  if (verbose) {
    console.log('\n🤖 PPC Intelligence Agent Starting...\n');
    console.log(`📝 Task: ${userMessage}\n`);
  }

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  const toolCallLog: Array<{ tool: string; input: any; result: any }> = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const response = await client.messages.create({
      model: env.AGENT_MODEL,
      max_tokens: env.AGENT_MAX_TOKENS,
      system: ORCHESTRATOR_SYSTEM_PROMPT,
      tools: allTools,
      messages,
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    // Check if we're done
    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      );

      if (verbose) {
        console.log('\n✅ Agent completed task\n');
      }

      return {
        response: textBlock?.text || '',
        toolCalls: toolCallLog,
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        },
      };
    }

    // Process tool calls
    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (verbose) {
        console.log(`🔄 Iteration ${iterations}: ${toolUseBlocks.length} tool call(s)`);
      }

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        if (verbose) {
          console.log(`  🔧 ${toolUse.name}`);
        }

        try {
          const handler = allHandlers[toolUse.name];
          if (!handler) {
            throw new Error(`Unknown tool: ${toolUse.name}`);
          }

          const result = await handler(toolUse.input as any);
          const resultStr = JSON.stringify(result, null, 2);

          toolCallLog.push({
            tool: toolUse.name,
            input: toolUse.input,
            result,
          });

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: resultStr.length > 50000 
              ? resultStr.substring(0, 50000) + '\n... (truncated)'
              : resultStr,
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          if (verbose) {
            console.log(`    ❌ Error: ${errorMsg}`);
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Error: ${errorMsg}`,
            is_error: true,
          });
        }
      }

      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
    }
  }

  throw new Error(`Agent exceeded max iterations (${maxIterations})`);
}

/**
 * Run a specific workflow
 */
export const workflows = {
  /**
   * Full account audit
   */
  async fullAudit(customerId?: string): Promise<AgentResponse> {
    return runAgent(`
      Run a complete audit of the Google Ads account:
      
      1. Start with a health check to identify issues
      2. Analyze competitor landscape for landscaping keywords in Central Ohio
      3. Identify wasted spend and recommend negative keywords
      4. Find new keyword opportunities
      5. Provide a prioritized action plan with expected ROI
      
      ${customerId ? `Customer ID: ${customerId}` : ''}
      
      Focus on landscaping services: landscape design, lawn care, hardscaping, outdoor living.
      Target areas: Dublin OH, Powell OH, Galena OH, New Albany OH.
    `);
  },

  /**
   * Quick health check
   */
  async quickHealthCheck(customerId?: string): Promise<AgentResponse> {
    return runAgent(`
      Run a quick health check on the Google Ads account.
      Focus on:
      - Top 5 wasted spend keywords
      - Top 5 performing keywords
      - Overall CTR, CPC, CPA metrics vs benchmarks
      - Immediate recommendations
      
      ${customerId ? `Customer ID: ${customerId}` : ''}
    `);
  },

  /**
   * Competitor analysis
   */
  async competitorAnalysis(competitors: string[]): Promise<AgentResponse> {
    return runAgent(`
      Analyze these competitors for landscaping services in Central Ohio:
      ${competitors.join(', ')}
      
      Find:
      1. What keywords they're bidding on
      2. Their estimated spend
      3. Gap keywords we should target
      4. Their ad copy themes
      5. Opportunities to outcompete them
    `);
  },

  /**
   * Keyword research
   */
  async keywordResearch(seedKeywords: string[], location: string): Promise<AgentResponse> {
    return runAgent(`
      Research keywords for a landscaping business:
      
      Seed keywords: ${seedKeywords.join(', ')}
      Location: ${location}
      
      Find:
      1. Related keywords with search volume and CPC
      2. Long-tail variations
      3. Local intent keywords (city + service)
      4. Seasonal opportunities
      5. Recommended bid ranges
      
      Prioritize by potential ROI for a landscaping business.
    `);
  },

  /**
   * Create a new campaign
   */
  async createCampaign(
    description: string,
    options: { dryRun?: boolean } = {}
  ): Promise<AgentResponse> {
    return runAgent(`
      Create a new Google Ads search campaign:
      
      ${description}
      
      Business: Stiltner Landscapes
      Website: https://stiltnerlandscapes.com
      Phone: (614) 707-4788
      Services: Landscape Design, Hardscaping, Outdoor Living, Lawn Care
      
      Use the create_campaign tool to build and ${options.dryRun !== false ? 'validate (dry run)' : 'CREATE'} the campaign.
      ${options.dryRun !== false ? 'This is a dry run - the campaign will NOT be created yet.' : 'This will CREATE the campaign in PAUSED state.'}
    `);
  },

  /**
   * Optimize budgets
   */
  async optimizeBudgets(): Promise<AgentResponse> {
    return runAgent(`
      Analyze our campaign budgets and recommend optimizations:
      
      1. Review performance of all campaigns
      2. Identify campaigns with good CPA that could benefit from more budget
      3. Find campaigns with poor performance that should have budget reduced
      4. Calculate specific budget reallocation recommendations
      5. Estimate the impact of the changes
      
      We're a landscaping business, so consider seasonality (peak: March-October).
    `);
  },

  /**
   * Analyze negative keywords
   */
  async analyzeNegativeKeywords(): Promise<AgentResponse> {
    return runAgent(`
      Analyze search terms and recommend negative keywords:
      
      1. Get the search terms report
      2. Identify irrelevant searches wasting money
      3. Group negatives by category (DIY, jobs, wrong location, etc.)
      4. Recommend match types for each negative
      5. Calculate expected monthly savings
      
      We're a residential landscaping company in Dublin/Powell/Galena/New Albany, Ohio.
    `);
  },

  /**
   * Generate ad variations
   */
  async generateAdVariations(service: string, location: string = 'Dublin Ohio'): Promise<AgentResponse> {
    return runAgent(`
      Generate A/B test ad variations for:
      
      Service: ${service}
      Location: ${location}
      Business: Stiltner Landscapes
      
      Create 3-5 compelling ad variations that:
      1. Test different emotional appeals
      2. Test different CTAs
      3. Follow all Google Ads policies
      4. Highlight local presence and expertise
      
      Each variation should have a hypothesis for what it tests.
    `);
  },
};
