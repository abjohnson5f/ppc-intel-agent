/**
 * PPC Intelligence Agent
 * 
 * Main entry point for the autonomous PPC management agent.
 * 
 * Usage:
 *   npm start                              # Interactive chat mode
 *   npm start "your request here"          # Single request mode
 * 
 * Examples:
 *   npm start "Create a lawn care campaign for Dublin with $50/day budget"
 *   npm start "What keywords are wasting money?"
 *   npm start "Find competitors bidding on landscape design"
 *   npm start "Run a health check on my account"
 */

import 'dotenv/config';
import * as readline from 'readline';
import { runAgent, workflows } from './agents/orchestrator.js';

export { runAgent, workflows };

const BANNER = `
╔═══════════════════════════════════════════════════════════════════════════╗
║                     PPC INTELLIGENCE AGENT v0.2.0                         ║
║           Autonomous Google Ads Management powered by Claude               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Just tell me what you need in plain English:                             ║
║                                                                           ║
║  • "Create a landscape design campaign for Dublin and Powell"             ║
║  • "What's wasting money in my account?"                                  ║
║  • "Find competitors bidding on lawn care in Columbus"                    ║
║  • "Run a health check"                                                   ║
║  • "Research keywords for patio installation"                             ║
║  • "Suggest negative keywords based on my search terms"                   ║
║  • "How are my campaigns performing this month?"                          ║
║                                                                           ║
║  Type 'exit' or 'quit' to leave.                                          ║
╚═══════════════════════════════════════════════════════════════════════════╝
`;

const PROMPT = '\n💬 You: ';

/**
 * Interactive chat mode - the primary interface
 */
async function interactiveMode() {
  console.log(BANNER);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = () => {
    rl.question(PROMPT, async (input) => {
      const trimmed = input.trim();
      
      if (!trimmed) {
        askQuestion();
        return;
      }

      if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
        console.log('\n👋 Goodbye!\n');
        rl.close();
        process.exit(0);
      }

      if (trimmed.toLowerCase() === 'help') {
        console.log(`
📖 HELP - What I can do:

  🏥 ACCOUNT HEALTH
     "Run a health check" / "What's wasting money?" / "Show my metrics"

  🚀 CAMPAIGN CREATION  
     "Create a [service] campaign for [cities] with $X/day budget"
     "Build a campaign for spring cleanup services"

  🔍 COMPETITOR RESEARCH
     "Find competitors bidding on [keywords]"
     "Who's competing with us for landscape design?"

  🔑 KEYWORD RESEARCH
     "Research keywords for [service]"
     "Find new keyword opportunities"

  ➖ NEGATIVE KEYWORDS
     "Suggest negative keywords" / "What searches should I block?"

  📊 PERFORMANCE
     "How are my campaigns doing?" / "Show campaign performance"
     "Which keywords are performing best?"

  💰 BUDGET OPTIMIZATION
     "How should I reallocate my budgets?"
     "Which campaigns deserve more spend?"

Just describe what you need - I'll figure out the rest!
`);
        askQuestion();
        return;
      }

      try {
        console.log('\n🤖 Agent: Thinking...\n');
        const result = await runAgent(trimmed);
        console.log('━'.repeat(70));
        console.log('\n🤖 Agent:\n');
        console.log(result.response);
        console.log('\n' + '━'.repeat(70));
        
        if (result.toolCalls.length > 0) {
          console.log(`\n📊 Used ${result.toolCalls.length} tool(s): ${result.toolCalls.map(t => t.tool).join(', ')}`);
        }
        console.log(`💰 Tokens: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out`);
      } catch (error) {
        console.error('\n❌ Error:', error instanceof Error ? error.message : error);
      }

      askQuestion();
    });
  };

  askQuestion();
}

/**
 * Single request mode - run one query and exit
 */
async function singleRequestMode(query: string) {
  console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                     PPC INTELLIGENCE AGENT v0.2.0                         ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📝 Request: ${query}\n`);
  console.log('🤖 Agent: Working on it...\n');

  try {
    const result = await runAgent(query);
    console.log('━'.repeat(70));
    console.log('\n🤖 Response:\n');
    console.log(result.response);
    console.log('\n' + '━'.repeat(70));
    
    if (result.toolCalls.length > 0) {
      console.log(`\n📊 Tools used: ${result.toolCalls.map(t => t.tool).join(', ')}`);
    }
    console.log(`💰 Tokens: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out\n`);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Main entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // No arguments = interactive mode
    await interactiveMode();
  } else {
    // Arguments = treat as a single request
    const query = args.join(' ');
    await singleRequestMode(query);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
