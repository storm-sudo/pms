import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables for seeding.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const testUsers = [
  {
    email: 'admin@nt.gmail.com',
    password: 'Password123!',
    role: 'admin',
    name: 'Test Admin',
    department: 'Leadership'
  },
  {
    email: 'researcher@nt.gmail.com',
    password: 'Password123!',
    role: 'member',
    name: 'Test Researcher',
    department: 'Mol Bio'
  },
  {
    email: 'stakeholder@external.com',
    password: 'Password123!',
    role: 'stakeholder',
    name: 'Test Stakeholder',
    department: 'External'
  }
]

async function seed() {
  console.log('🌱 Starting laboratory database seeding...')

  for (const user of testUsers) {
    // 1. Create/Update Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.name }
    })

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log(`ℹ️ User ${user.email} already exists in Auth. Skipping creation.`)
        // Get existing user ID
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === user.email)
        if (existingUser) {
          await updateProfile(existingUser.id, user)
        }
      } else {
        console.error(`❌ Error creating auth user ${user.email}:`, authError.message)
      }
    } else if (authData.user) {
      console.log(`✅ Created auth user: ${user.email}`)
      await updateProfile(authData.user.id, user)
    }
  }

  console.log('🍀 Seeding complete.')
}

async function updateProfile(id: string, user: any) {
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      status: 'approved',
      joined_date: new Date().toISOString(),
      last_active: new Date().toISOString()
    })

  if (profileError) {
    console.error(`❌ Error seeding profile for ${user.email}:`, profileError.message)
  } else {
    console.log(`✅ Seeded profile for: ${user.email}`)
  }
}

seed().catch(err => {
  console.error('💥 Seeding failed:', err)
  process.exit(1)
})
