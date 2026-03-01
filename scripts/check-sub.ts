import { loadEnvConfig } from '@next/env'
import { createClient } from '@supabase/supabase-js'

loadEnvConfig(process.cwd())

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    const { data: users } = await supabase.auth.admin.listUsers()
    const user =
      users.users.find((entry) => entry.email === 'bolenathaniel@gmail.com') ??
      users.users[0]

    if (!user) {
      throw new Error('No users found')
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    console.log('Current plan_id:', sub?.plan_id)
    console.log('Status:', sub?.status)
}

void check()
