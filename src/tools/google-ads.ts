/**
 * Google Ads API Tools
 * 
 * These tools are exposed to the Claude Agent for querying
 * and (optionally) modifying Google Ads campaigns.
 */

import { GoogleAdsApi } from 'google-ads-api';
import { GOOGLE_ADS_CONFIG } from '../config/index.js';

// Initialize the Google Ads client
const client = new GoogleAdsApi({
  client_id: GOOGLE_ADS_CONFIG.client_id,
  client_secret: GOOGLE_ADS_CONFIG.client_secret,
  developer_token: GOOGLE_ADS_CONFIG.developer_token,
});

const customer = client.Customer({
  customer_id: GOOGLE_ADS_CONFIG.customer_id,
  login_customer_id: GOOGLE_ADS_CONFIG.login_customer_id,
  refresh_token: GOOGLE_ADS_CONFIG.refresh_token,
});

// ============================================================
// TOOL DEFINITIONS (for Claude Agent SDK)
// ============================================================

export const googleAdsTools = {
  /**
   * List all accessible Google Ads accounts
   */
  list_accounts: {
    name: 'list_accounts',
    description: 'List all Google Ads accounts accessible via the MCC',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
    handler: async () => {
      const query = `
        SELECT 
          customer_client.id,
          customer_client.descriptive_name,
          customer_client.currency_code,
          customer_client.time_zone,
          customer_client.manager
        FROM customer_client
        WHERE customer_client.status = 'ENABLED'
      `;
      
      const results = await customer.query(query);
      return results.map((row: any) => ({
        id: row.customer_client?.id,
        name: row.customer_client?.descriptive_name,
        currency: row.customer_client?.currency_code,
        timezone: row.customer_client?.time_zone,
        is_manager: row.customer_client?.manager,
      }));
    },
  },

  /**
   * Get campaign performance metrics
   */
  get_campaign_performance: {
    name: 'get_campaign_performance',
    description: 'Get performance metrics for campaigns over a date range',
    input_schema: {
      type: 'object' as const,
      properties: {
        date_range: {
          type: 'string',
          description: 'GAQL date range like LAST_30_DAYS, LAST_7_DAYS, THIS_MONTH',
          default: 'LAST_30_DAYS',
        },
        campaign_status: {
          type: 'string',
          enum: ['ENABLED', 'PAUSED', 'ALL'],
          default: 'ALL',
        },
      },
      required: [],
    },
    handler: async ({ date_range = 'LAST_30_DAYS', campaign_status = 'ALL' }) => {
      let statusFilter = '';
      if (campaign_status !== 'ALL') {
        statusFilter = `AND campaign.status = '${campaign_status}'`;
      }

      const query = `
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value,
          metrics.average_cpc,
          metrics.ctr,
          metrics.cost_per_conversion
        FROM campaign 
        WHERE segments.date DURING ${date_range}
        ${statusFilter}
        ORDER BY metrics.cost_micros DESC
      `;

      const results = await customer.query(query);
      return results.map((row: any) => ({
        id: row.campaign?.id,
        name: row.campaign?.name,
        status: row.campaign?.status,
        channel: row.campaign?.advertising_channel_type,
        impressions: row.metrics?.impressions || 0,
        clicks: row.metrics?.clicks || 0,
        cost: (row.metrics?.cost_micros || 0) / 1_000_000,
        conversions: row.metrics?.conversions || 0,
        conversion_value: row.metrics?.conversions_value || 0,
        avg_cpc: (row.metrics?.average_cpc || 0) / 1_000_000,
        ctr: row.metrics?.ctr || 0,
        cost_per_conversion: (row.metrics?.cost_per_conversion || 0) / 1_000_000,
      }));
    },
  },

  /**
   * Get keyword performance
   */
  get_keyword_performance: {
    name: 'get_keyword_performance',
    description: 'Get performance metrics for keywords',
    input_schema: {
      type: 'object' as const,
      properties: {
        date_range: {
          type: 'string',
          default: 'LAST_30_DAYS',
        },
        min_impressions: {
          type: 'number',
          description: 'Minimum impressions filter',
          default: 0,
        },
        limit: {
          type: 'number',
          description: 'Max results to return',
          default: 50,
        },
      },
      required: [],
    },
    handler: async ({ date_range = 'LAST_30_DAYS', min_impressions = 0, limit = 50 }) => {
      const query = `
        SELECT 
          ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type,
          ad_group.name,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc,
          metrics.ctr
        FROM keyword_view 
        WHERE segments.date DURING ${date_range}
          AND metrics.impressions >= ${min_impressions}
        ORDER BY metrics.cost_micros DESC
        LIMIT ${limit}
      `;

      const results = await customer.query(query);
      return results.map((row: any) => ({
        keyword: row.ad_group_criterion?.keyword?.text,
        match_type: row.ad_group_criterion?.keyword?.match_type,
        ad_group: row.ad_group?.name,
        campaign: row.campaign?.name,
        impressions: row.metrics?.impressions || 0,
        clicks: row.metrics?.clicks || 0,
        cost: (row.metrics?.cost_micros || 0) / 1_000_000,
        conversions: row.metrics?.conversions || 0,
        avg_cpc: (row.metrics?.average_cpc || 0) / 1_000_000,
        ctr: row.metrics?.ctr || 0,
      }));
    },
  },

  /**
   * Get search terms report (what users actually searched)
   */
  get_search_terms: {
    name: 'get_search_terms',
    description: 'Get search terms that triggered your ads',
    input_schema: {
      type: 'object' as const,
      properties: {
        date_range: { type: 'string', default: 'LAST_30_DAYS' },
        limit: { type: 'number', default: 100 },
      },
      required: [],
    },
    handler: async ({ date_range = 'LAST_30_DAYS', limit = 100 }) => {
      const query = `
        SELECT 
          search_term_view.search_term,
          campaign.name,
          ad_group.name,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM search_term_view
        WHERE segments.date DURING ${date_range}
        ORDER BY metrics.impressions DESC
        LIMIT ${limit}
      `;

      const results = await customer.query(query);
      return results.map((row: any) => ({
        search_term: row.search_term_view?.search_term,
        campaign: row.campaign?.name,
        ad_group: row.ad_group?.name,
        impressions: row.metrics?.impressions || 0,
        clicks: row.metrics?.clicks || 0,
        cost: (row.metrics?.cost_micros || 0) / 1_000_000,
        conversions: row.metrics?.conversions || 0,
      }));
    },
  },

  /**
   * Execute a raw GAQL query
   */
  query: {
    name: 'query',
    description: 'Execute a raw GAQL (Google Ads Query Language) query',
    input_schema: {
      type: 'object' as const,
      properties: {
        gaql: {
          type: 'string',
          description: 'The GAQL query to execute',
        },
      },
      required: ['gaql'],
    },
    handler: async ({ gaql }: { gaql: string }) => {
      // Security: Block mutation keywords in queries
      const blocked = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'MUTATE'];
      const upperQuery = gaql.toUpperCase();
      for (const keyword of blocked) {
        if (upperQuery.includes(keyword)) {
          throw new Error(`Mutation keyword "${keyword}" not allowed in query tool. Use mutation tools instead.`);
        }
      }

      const results = await customer.query(gaql);
      return results;
    },
  },
};

// Export tool list for Claude Agent SDK registration
export const toolDefinitions = Object.values(googleAdsTools).map(tool => ({
  name: tool.name,
  description: tool.description,
  input_schema: tool.input_schema,
}));

// Export handler map
export const toolHandlers: Record<string, (args: any) => Promise<any>> = {};
for (const [key, tool] of Object.entries(googleAdsTools)) {
  toolHandlers[tool.name] = tool.handler;
}
