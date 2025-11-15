/**
 * Pre-built form templates for common onboarding flows
 */

export type FormFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'tel'
  | 'url'

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  placeholder?: string
  required?: boolean
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
  }
  options?: { label: string; value: string }[]
  description?: string
}

export interface FormTemplate {
  id: string
  name: string
  description: string
  category: 'auth' | 'payment' | 'profile' | 'business'
  fields: FormField[]
  submitButton: string
  successMessage: string
  eventType: string // SmartHooks event type to trigger
}

export const FORM_TEMPLATES: Record<string, FormTemplate> = {
  'email-password-signup': {
    id: 'email-password-signup',
    name: 'Email & Password Sign Up',
    description: 'Basic email and password registration',
    category: 'auth',
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        placeholder: 'John Doe',
        required: true,
        validation: { minLength: 2, maxLength: 100 }
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'you@example.com',
        required: true,
        validation: {
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        }
      },
      {
        id: 'password',
        type: 'password',
        label: 'Password',
        placeholder: '••••••••',
        required: true,
        validation: { minLength: 8 },
        description: 'At least 8 characters'
      },
      {
        id: 'terms',
        type: 'checkbox',
        label: 'I agree to the Terms of Service and Privacy Policy',
        required: true
      }
    ],
    submitButton: 'Create Account',
    successMessage: 'Account created successfully! Check your email to verify.',
    eventType: 'user.signup'
  },

  'stripe-payment-setup': {
    id: 'stripe-payment-setup',
    name: 'Stripe Payment Setup',
    description: 'Collect payment information via Stripe',
    category: 'payment',
    fields: [
      {
        id: 'plan',
        type: 'radio',
        label: 'Choose a Plan',
        required: true,
        options: [
          { label: 'Starter - $29/month', value: 'starter' },
          { label: 'Professional - $79/month', value: 'professional' },
          { label: 'Enterprise - $199/month', value: 'enterprise' }
        ]
      },
      {
        id: 'billing_name',
        type: 'text',
        label: 'Billing Name',
        placeholder: 'Name on card',
        required: true
      },
      {
        id: 'stripe_payment_element',
        type: 'text',
        label: 'Payment Details',
        description: 'Stripe Payment Element will be embedded here',
        required: true
      }
    ],
    submitButton: 'Subscribe Now',
    successMessage: 'Payment setup complete! Welcome aboard.',
    eventType: 'payment.subscription_created'
  },

  'business-profile': {
    id: 'business-profile',
    name: 'Business Profile Setup',
    description: 'Collect business information during onboarding',
    category: 'business',
    fields: [
      {
        id: 'company_name',
        type: 'text',
        label: 'Company Name',
        placeholder: 'Acme Inc.',
        required: true
      },
      {
        id: 'company_size',
        type: 'select',
        label: 'Company Size',
        required: true,
        options: [
          { label: 'Just me', value: '1' },
          { label: '2-10 employees', value: '2-10' },
          { label: '11-50 employees', value: '11-50' },
          { label: '51-200 employees', value: '51-200' },
          { label: '200+ employees', value: '200+' }
        ]
      },
      {
        id: 'industry',
        type: 'select',
        label: 'Industry',
        required: true,
        options: [
          { label: 'Technology', value: 'technology' },
          { label: 'E-commerce', value: 'ecommerce' },
          { label: 'Finance', value: 'finance' },
          { label: 'Healthcare', value: 'healthcare' },
          { label: 'Education', value: 'education' },
          { label: 'Other', value: 'other' }
        ]
      },
      {
        id: 'website',
        type: 'url',
        label: 'Company Website',
        placeholder: 'https://example.com',
        required: false
      },
      {
        id: 'phone',
        type: 'tel',
        label: 'Phone Number',
        placeholder: '+1 (555) 123-4567',
        required: false
      }
    ],
    submitButton: 'Complete Profile',
    successMessage: 'Business profile completed!',
    eventType: 'profile.business_completed'
  },

  'oauth-social': {
    id: 'oauth-social',
    name: 'Social OAuth Sign Up',
    description: 'Sign up with Google, GitHub, or other OAuth providers',
    category: 'auth',
    fields: [
      {
        id: 'oauth_provider',
        type: 'radio',
        label: 'Sign up with',
        required: true,
        options: [
          { label: 'Google', value: 'google' },
          { label: 'GitHub', value: 'github' }
        ]
      }
    ],
    submitButton: 'Continue with OAuth',
    successMessage: 'Successfully authenticated!',
    eventType: 'user.oauth_signup'
  },

  'team-invite': {
    id: 'team-invite',
    name: 'Team Member Invitation',
    description: 'Invite team members to join',
    category: 'profile',
    fields: [
      {
        id: 'invitee_email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'colleague@company.com',
        required: true
      },
      {
        id: 'role',
        type: 'select',
        label: 'Role',
        required: true,
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'Member', value: 'member' },
          { label: 'Viewer', value: 'viewer' }
        ]
      },
      {
        id: 'personal_message',
        type: 'text',
        label: 'Personal Message (Optional)',
        placeholder: 'Join our team!',
        required: false,
        validation: { maxLength: 500 }
      }
    ],
    submitButton: 'Send Invitation',
    successMessage: 'Invitation sent!',
    eventType: 'team.member_invited'
  }
}

export const TEMPLATE_CATEGORIES = [
  { id: 'auth', name: 'Authentication', description: 'Sign up and login flows' },
  { id: 'payment', name: 'Payment', description: 'Payment and subscription setup' },
  { id: 'profile', name: 'Profile', description: 'User and team profiles' },
  { id: 'business', name: 'Business', description: 'Business information collection' }
]
