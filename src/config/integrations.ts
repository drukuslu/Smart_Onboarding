/**
 * Central configuration for all supported integrations
 */

export type IntegrationType =
  | 'stripe'
  | 'sendgrid'
  | 'oauth_google'
  | 'oauth_github'
  | 'hubspot'
  | 'salesforce'
  | 'mailchimp'

export interface IntegrationConfig {
  type: IntegrationType
  name: string
  description: string
  icon: string
  category: 'payment' | 'email' | 'auth' | 'crm' | 'marketing'
  requiredCredentials: {
    key: string
    label: string
    type: 'text' | 'password' | 'url'
    placeholder?: string
    description?: string
  }[]
  optionalConfig?: {
    key: string
    label: string
    type: 'text' | 'boolean' | 'select'
    options?: string[]
    default?: any
  }[]
  setupInstructions: string
  docsUrl?: string
}

export const INTEGRATIONS: Record<IntegrationType, IntegrationConfig> = {
  stripe: {
    type: 'stripe',
    name: 'Stripe',
    description: 'Accept payments and manage subscriptions',
    icon: '💳',
    category: 'payment',
    requiredCredentials: [
      {
        key: 'secret_key',
        label: 'Secret Key',
        type: 'password',
        placeholder: 'sk_test_...',
        description: 'Your Stripe secret API key'
      },
      {
        key: 'publishable_key',
        label: 'Publishable Key',
        type: 'text',
        placeholder: 'pk_test_...',
        description: 'Your Stripe publishable key'
      },
      {
        key: 'webhook_secret',
        label: 'Webhook Secret',
        type: 'password',
        placeholder: 'whsec_...',
        description: 'Webhook signing secret for event verification'
      }
    ],
    setupInstructions: 'Get your API keys from https://dashboard.stripe.com/apikeys',
    docsUrl: 'https://stripe.com/docs/keys'
  },

  sendgrid: {
    type: 'sendgrid',
    name: 'SendGrid',
    description: 'Send transactional and marketing emails',
    icon: '✉️',
    category: 'email',
    requiredCredentials: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'SG...',
        description: 'Your SendGrid API key'
      },
      {
        key: 'from_email',
        label: 'From Email',
        type: 'text',
        placeholder: 'noreply@yourdomain.com',
        description: 'Verified sender email address'
      }
    ],
    optionalConfig: [
      {
        key: 'from_name',
        label: 'From Name',
        type: 'text',
        default: 'Your App'
      }
    ],
    setupInstructions: 'Create an API key at https://app.sendgrid.com/settings/api_keys',
    docsUrl: 'https://docs.sendgrid.com/api-reference/api-keys/create-api-keys'
  },

  oauth_google: {
    type: 'oauth_google',
    name: 'Google OAuth',
    description: 'Sign in with Google',
    icon: '🔐',
    category: 'auth',
    requiredCredentials: [
      {
        key: 'client_id',
        label: 'Client ID',
        type: 'text',
        placeholder: '123456789-abc.apps.googleusercontent.com'
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'GOCSPX-...'
      },
      {
        key: 'redirect_uri',
        label: 'Redirect URI',
        type: 'url',
        placeholder: 'https://yourdomain.com/api/auth/callback/google'
      }
    ],
    setupInstructions: 'Create OAuth credentials in Google Cloud Console',
    docsUrl: 'https://console.cloud.google.com/apis/credentials'
  },

  oauth_github: {
    type: 'oauth_github',
    name: 'GitHub OAuth',
    description: 'Sign in with GitHub',
    icon: '🐙',
    category: 'auth',
    requiredCredentials: [
      {
        key: 'client_id',
        label: 'Client ID',
        type: 'text',
        placeholder: 'Iv1.abc123...'
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: '...'
      },
      {
        key: 'redirect_uri',
        label: 'Redirect URI',
        type: 'url',
        placeholder: 'https://yourdomain.com/api/auth/callback/github'
      }
    ],
    setupInstructions: 'Register a new OAuth app in GitHub Settings',
    docsUrl: 'https://github.com/settings/developers'
  },

  hubspot: {
    type: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts to your CRM',
    icon: '🎯',
    category: 'crm',
    requiredCredentials: [
      {
        key: 'api_key',
        label: 'Private App Access Token',
        type: 'password',
        placeholder: 'pat-na1-...'
      }
    ],
    setupInstructions: 'Create a private app in HubSpot Settings > Integrations',
    docsUrl: 'https://developers.hubspot.com/docs/api/private-apps'
  },

  salesforce: {
    type: 'salesforce',
    name: 'Salesforce',
    description: 'Sync with Salesforce CRM',
    icon: '☁️',
    category: 'crm',
    requiredCredentials: [
      {
        key: 'consumer_key',
        label: 'Consumer Key',
        type: 'text'
      },
      {
        key: 'consumer_secret',
        label: 'Consumer Secret',
        type: 'password'
      },
      {
        key: 'username',
        label: 'Username',
        type: 'text'
      },
      {
        key: 'password',
        label: 'Password + Security Token',
        type: 'password'
      }
    ],
    setupInstructions: 'Create a Connected App in Salesforce Setup',
    docsUrl: 'https://help.salesforce.com/s/articleView?id=sf.connected_app_create.htm'
  },

  mailchimp: {
    type: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing and automation',
    icon: '📧',
    category: 'marketing',
    requiredCredentials: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: '...-us1'
      }
    ],
    optionalConfig: [
      {
        key: 'default_list_id',
        label: 'Default Audience ID',
        type: 'text'
      }
    ],
    setupInstructions: 'Generate an API key in Mailchimp Account > Extras > API keys',
    docsUrl: 'https://mailchimp.com/developer/marketing/guides/quick-start/'
  }
}

export const INTEGRATION_CATEGORIES = {
  payment: {
    name: 'Payment Processing',
    description: 'Accept payments and manage subscriptions'
  },
  email: {
    name: 'Email Services',
    description: 'Send transactional and marketing emails'
  },
  auth: {
    name: 'Authentication',
    description: 'OAuth and social login providers'
  },
  crm: {
    name: 'CRM Systems',
    description: 'Customer relationship management'
  },
  marketing: {
    name: 'Marketing Automation',
    description: 'Email campaigns and marketing tools'
  }
}
