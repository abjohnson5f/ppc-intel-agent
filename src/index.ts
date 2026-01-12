/**
 * PPC Intelligence Agent
 * 
 * Main entry point for the autonomous PPC management agent.
 * Built with the Claude Agent SDK pattern.
 */

import 'dotenv/config';
import { runAgent, workflows } from './agents/orchestrator.js';

export { runAgent, workflows };

// CLI interface when run directly
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           PPC INTELLIGENCE AGENT v0.1.0                       ║');
  console.log('║     Autonomous Google Ads Management powered by Claude        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  switch (command) {
    case 'audit':
      console.log('Running full account audit...\n');
      const auditResult = await workflows.fullAudit();
      console.log('\n📊 AUDIT RESULTS\n');
      console.log(auditResult.response);
      console.log(`\n💰 Token usage: ${auditResult.usage.inputTokens} in / ${auditResult.usage.outputTokens} out`);
      break;

    case 'health':
      console.log('Running quick health check...\n');
      const healthResult = await workflows.quickHealthCheck();
      console.log('\n🏥 HEALTH CHECK RESULTS\n');
      console.log(healthResult.response);
      break;

    case 'competitors':
      const competitors = args.slice(1);
      if (competitors.length === 0) {
        console.log('Usage: ppc-agent competitors <domain1> <domain2> ...');
        process.exit(1);
      }
      console.log(`Analyzing competitors: ${competitors.join(', ')}\n`);
      const competitorResult = await workflows.competitorAnalysis(competitors);
      console.log('\n🔍 COMPETITOR ANALYSIS\n');
      console.log(competitorResult.response);
      break;

    case 'keywords':
      const keywords = args.slice(1);
      if (keywords.length === 0) {
        console.log('Usage: ppc-agent keywords <keyword1> <keyword2> ...');
        process.exit(1);
      }
      console.log(`Researching keywords: ${keywords.join(', ')}\n`);
      const keywordResult = await workflows.keywordResearch(keywords, 'Columbus,Ohio,United States');
      console.log('\n🔑 KEYWORD RESEARCH\n');
      console.log(keywordResult.response);
      break;

    case 'chat':
      // Interactive mode
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      console.log('Interactive mode. Type your requests or "exit" to quit.\n');

      const askQuestion = () => {
        rl.question('You: ', async (input) => {
          if (input.toLowerCase() === 'exit') {
            console.log('Goodbye!');
            rl.close();
            return;
          }

          try {
            const result = await runAgent(input);
            console.log(`\nAgent: ${result.response}\n`);
          } catch (error) {
            console.error('Error:', error);
          }

          askQuestion();
        });
      };

      askQuestion();
      return; // Don't exit for interactive mode

    default:
      console.log('Usage: ppc-agent <command> [options]\n');
      console.log('Commands:');
      console.log('  audit       - Run full account audit');
      console.log('  health      - Quick health check');
      console.log('  competitors - Analyze competitors');
      console.log('  keywords    - Research keywords');
      console.log('  chat        - Interactive mode');
      console.log('\nExamples:');
      console.log('  ppc-agent audit');
      console.log('  ppc-agent competitors greenscape.com perfectlawns.com');
      console.log('  ppc-agent keywords "landscape design" "lawn care"');
  }
}

// Run if executed directly
main().catch(console.error);
