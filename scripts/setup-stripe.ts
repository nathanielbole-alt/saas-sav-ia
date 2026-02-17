import fs from 'node:fs/promises'
import path from 'node:path'
import Stripe from 'stripe'

type PlanSetup = {
  plan: 'pro' | 'business' | 'enterprise'
  productName: string
  amountCents: number
  envKey:
    | 'STRIPE_PRO_PRICE_ID'
    | 'STRIPE_BUSINESS_PRICE_ID'
    | 'STRIPE_ENTERPRISE_PRICE_ID'
}

const PLAN_SETUPS: PlanSetup[] = [
  {
    plan: 'pro',
    productName: 'SAV IA Pro',
    amountCents: 2900,
    envKey: 'STRIPE_PRO_PRICE_ID',
  },
  {
    plan: 'business',
    productName: 'SAV IA Business',
    amountCents: 7900,
    envKey: 'STRIPE_BUSINESS_PRICE_ID',
  },
  {
    plan: 'enterprise',
    productName: 'SAV IA Enterprise',
    amountCents: 14900,
    envKey: 'STRIPE_ENTERPRISE_PRICE_ID',
  },
]

function parseEnvFile(content: string): Record<string, string> {
  const parsed: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex <= 0) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    if (!key) continue
    parsed[key] = value
  }
  return parsed
}

async function loadEnvFromDotLocal(projectRoot: string): Promise<void> {
  const envPath = path.join(projectRoot, '.env.local')

  try {
    const content = await fs.readFile(envPath, 'utf8')
    const values = parseEnvFile(content)
    for (const [key, value] of Object.entries(values)) {
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // No .env.local yet, ignore.
  }
}

function upsertEnvVariable(content: string, key: string, value: string): string {
  const line = `${key}=${value}`
  const regex = new RegExp(`^${key}=.*$`, 'm')
  if (regex.test(content)) return content.replace(regex, line)
  return `${content.trimEnd()}\n${line}\n`
}

async function ensureProductAndPrice(
  stripe: Stripe,
  setup: PlanSetup
): Promise<{ productId: string; priceId: string }> {
  const products = await stripe.products.list({ active: true, limit: 100 })
  const existingProduct = products.data.find(
    (product) =>
      product.name === setup.productName || product.metadata.plan === setup.plan
  )

  const product =
    existingProduct ??
    (await stripe.products.create({
      name: setup.productName,
      metadata: {
        app: 'saas-sav-ia',
        plan: setup.plan,
      },
    }))

  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    type: 'recurring',
    limit: 100,
  })

  const existingPrice = prices.data.find(
    (price) =>
      price.currency === 'eur' &&
      price.unit_amount === setup.amountCents &&
      price.recurring?.interval === 'month'
  )

  const price =
    existingPrice ??
    (await stripe.prices.create({
      product: product.id,
      currency: 'eur',
      unit_amount: setup.amountCents,
      recurring: { interval: 'month' },
      metadata: {
        app: 'saas-sav-ia',
        plan: setup.plan,
      },
    }))

  return { productId: product.id, priceId: price.id }
}

async function writeEnvLocal(
  projectRoot: string,
  updates: Record<string, string>
): Promise<void> {
  const envPath = path.join(projectRoot, '.env.local')

  let content = ''
  try {
    content = await fs.readFile(envPath, 'utf8')
  } catch {
    content = ''
  }

  let nextContent = content
  for (const [key, value] of Object.entries(updates)) {
    nextContent = upsertEnvVariable(nextContent, key, value)
  }

  await fs.writeFile(envPath, nextContent, 'utf8')
}

async function main() {
  const projectRoot = process.cwd()
  const shouldWriteEnv = process.argv.includes('--write-env')

  await loadEnvFromDotLocal(projectRoot)

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY in environment or .env.local')
  }

  const stripe = new Stripe(stripeSecretKey, { typescript: true })

  const envUpdates: Record<string, string> = {}
  for (const setup of PLAN_SETUPS) {
    const result = await ensureProductAndPrice(stripe, setup)
    envUpdates[setup.envKey] = result.priceId

    console.log(
      `[${setup.plan}] product=${result.productId} price=${result.priceId}`
    )
  }

  if (shouldWriteEnv) {
    await writeEnvLocal(projectRoot, envUpdates)
    console.log('Updated .env.local with Stripe price IDs.')
  }

  console.log('\nCopy/paste in .env.local:')
  for (const [key, value] of Object.entries(envUpdates)) {
    console.log(`${key}=${value}`)
  }
}

void main().catch((error: unknown) => {
  console.error('Failed to setup Stripe products/prices:', error)
  process.exit(1)
})
