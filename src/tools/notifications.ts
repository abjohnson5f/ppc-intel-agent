/**
 * Notification Tools
 * 
 * Send alerts and reports via Slack, email, etc.
 */

import { env } from '../config/index.js';

// ============================================================
// SLACK NOTIFICATIONS
// ============================================================

interface SlackMessage {
  channel?: string;
  text: string;
  blocks?: any[];
  attachments?: any[];
}

export async function sendSlackMessage(message: SlackMessage): Promise<boolean> {
  const webhookUrl = env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('⚠️  Slack webhook not configured. Message not sent.');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message.text,
        blocks: message.blocks,
        attachments: message.attachments,
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    console.log('✅ Slack message sent');
    return true;
  } catch (error) {
    console.error('❌ Failed to send Slack message:', error);
    return false;
  }
}

// ============================================================
// PRE-BUILT NOTIFICATION TEMPLATES
// ============================================================

/**
 * Send a health check alert
 */
export async function sendHealthCheckAlert(
  issues: Array<{ severity: string; title: string; impact: string }>,
  metrics: { totalSpend: number; wastedSpend: number; ctr: number }
): Promise<boolean> {
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const highIssues = issues.filter(i => i.severity === 'high');

  const text = `🏥 *PPC Health Check Alert*\n\n` +
    `💰 Total Spend: $${metrics.totalSpend.toFixed(2)}\n` +
    `💸 Wasted Spend: $${metrics.wastedSpend.toFixed(2)}\n` +
    `📊 CTR: ${(metrics.ctr * 100).toFixed(2)}%\n\n` +
    `🔴 Critical Issues: ${criticalIssues.length}\n` +
    `🟠 High Issues: ${highIssues.length}`;

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🏥 PPC Health Check Alert' },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Total Spend:*\n$${metrics.totalSpend.toFixed(2)}` },
        { type: 'mrkdwn', text: `*Wasted Spend:*\n$${metrics.wastedSpend.toFixed(2)}` },
        { type: 'mrkdwn', text: `*CTR:*\n${(metrics.ctr * 100).toFixed(2)}%` },
        { type: 'mrkdwn', text: `*Issues Found:*\n${issues.length}` },
      ],
    },
    { type: 'divider' },
  ];

  // Add critical issues
  if (criticalIssues.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*🔴 Critical Issues:*\n' + 
          criticalIssues.map(i => `• ${i.title}: ${i.impact}`).join('\n'),
      },
    });
  }

  return sendSlackMessage({ text, blocks });
}

/**
 * Send a campaign created notification
 */
export async function sendCampaignCreatedAlert(
  campaignName: string,
  budget: number,
  adGroups: number,
  keywords: number,
  status: 'validated' | 'created'
): Promise<boolean> {
  const emoji = status === 'created' ? '🚀' : '✅';
  const statusText = status === 'created' ? 'CREATED' : 'VALIDATED';

  const text = `${emoji} *Campaign ${statusText}*\n\n` +
    `📋 ${campaignName}\n` +
    `💰 Budget: $${budget}/day\n` +
    `📁 Ad Groups: ${adGroups}\n` +
    `🔑 Keywords: ${keywords}`;

  return sendSlackMessage({
    text,
    attachments: [
      {
        color: status === 'created' ? '#36a64f' : '#2196f3',
        fields: [
          { title: 'Campaign', value: campaignName, short: false },
          { title: 'Daily Budget', value: `$${budget}`, short: true },
          { title: 'Ad Groups', value: `${adGroups}`, short: true },
          { title: 'Keywords', value: `${keywords}`, short: true },
          { title: 'Status', value: status === 'created' ? 'PAUSED (Review Required)' : 'Ready to Create', short: true },
        ],
      },
    ],
  });
}

/**
 * Send a wasted spend alert
 */
export async function sendWastedSpendAlert(
  totalWasted: number,
  topKeywords: Array<{ keyword: string; spend: number; clicks: number }>
): Promise<boolean> {
  if (totalWasted < 10) {
    // Don't alert for small amounts
    return false;
  }

  const urgency = totalWasted > 100 ? '🔴 URGENT' : totalWasted > 50 ? '🟠 WARNING' : '🟡 INFO';

  const text = `${urgency} *Wasted Spend Detected*\n\n` +
    `💸 Total: $${totalWasted.toFixed(2)}\n\n` +
    `Top wasting keywords:\n` +
    topKeywords.slice(0, 5).map(k => 
      `• "${k.keyword}": $${k.spend.toFixed(2)} (${k.clicks} clicks, 0 conv)`
    ).join('\n');

  return sendSlackMessage({ text });
}

/**
 * Send a competitor alert
 */
export async function sendCompetitorAlert(
  competitors: Array<{ domain: string; keywords: number; estimatedSpend: number }>
): Promise<boolean> {
  const text = `🔍 *Competitor Intelligence Update*\n\n` +
    competitors.slice(0, 5).map(c =>
      `• *${c.domain}*: ${c.keywords} keywords, ~$${c.estimatedSpend.toLocaleString()}/mo`
    ).join('\n');

  return sendSlackMessage({ text });
}

// ============================================================
// TOOL DEFINITIONS FOR AGENT
// ============================================================

export const notificationTools = {
  send_slack_alert: {
    name: 'send_slack_alert',
    description: 'Send a custom Slack notification',
    input_schema: {
      type: 'object' as const,
      properties: {
        message: {
          type: 'string',
          description: 'The message to send',
        },
        urgency: {
          type: 'string',
          enum: ['info', 'warning', 'critical'],
          default: 'info',
        },
      },
      required: ['message'],
    },
    handler: async ({ message, urgency = 'info' }: { message: string; urgency?: string }) => {
      const emoji = { info: 'ℹ️', warning: '⚠️', critical: '🚨' }[urgency] || 'ℹ️';
      return sendSlackMessage({ text: `${emoji} ${message}` });
    },
  },
};

export const toolDefinitions = Object.values(notificationTools).map(tool => ({
  name: tool.name,
  description: tool.description,
  input_schema: tool.input_schema,
}));

export const toolHandlers: Record<string, (args: any) => Promise<any>> = {};
for (const tool of Object.values(notificationTools)) {
  toolHandlers[tool.name] = tool.handler;
}
