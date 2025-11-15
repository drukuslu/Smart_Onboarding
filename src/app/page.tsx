import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FrictionlessAuthLayer
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A unified authentication and integration layer to streamline user onboarding with Stripe, email, and other services.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon="🔧"
            title="Unified Setup"
            description="Configure Stripe, email providers, and authentication in one simple interface"
          />
          <FeatureCard
            icon="🔐"
            title="Secure by Default"
            description="Encrypted credential storage with HMAC-SHA256 webhook signatures"
          />
          <FeatureCard
            icon="⚡"
            title="Auto Configuration"
            description="Automatically fetch product IDs, webhooks, and identifiers from services"
          />
          <FeatureCard
            icon="📦"
            title="Plug & Play"
            description="Copy-paste code snippets with minimal ENV setup for quick integration"
          />
          <FeatureCard
            icon="🔗"
            title="SmartHooks Integration"
            description="Emit events to Vantrakticks SmartHooks for workflow automation"
          />
          <FeatureCard
            icon="📝"
            title="Form Templates"
            description="Pre-built onboarding forms with optional custom field builder"
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/onboarding/demo"
            className="px-8 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            View Demo Flow
          </Link>
        </div>

        {/* Quick Start Section */}
        <div className="mt-16 max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
          <ol className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-3">1.</span>
              <span>Create a project in the dashboard and configure your services</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-3">2.</span>
              <span>Enter your Stripe, SendGrid, and OAuth credentials once</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-3">3.</span>
              <span>Generate environment variables or copy code snippets</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-3">4.</span>
              <span>Integrate with your platform and start onboarding users</span>
            </li>
          </ol>
        </div>
      </div>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}
