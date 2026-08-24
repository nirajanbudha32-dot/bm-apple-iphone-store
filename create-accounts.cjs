const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://moavwfubvalkxgfcntmy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vYXZ3ZnVidmFsa3hnZmNudG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NDQ3ODMsImV4cCI6MjEwMzEyMDc4M30.I4NHV1U-Qe_OvUjShXgxAqpc90BY11U3tUWE3Y6f6B8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAccounts() {
  // Create Admin account
  console.log('Creating admin account...');
  const { data: adminData, error: adminError } = await supabase.auth.signUp({
    email: 'admin@bm.com',
    password: 'admin123',
  });

  if (adminError) {
    console.error('Admin error:', adminError.message);
  } else {
    console.log('Admin user created:', adminData.user?.id);
    // Set admin role
    if (adminData.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: adminData.user.id,
        email: 'admin@bm.com',
        role: 'admin',
      });
      if (profileError) {
        console.error('Profile error:', profileError.message);
      } else {
        console.log('Admin profile set with role: admin');
      }
    }
  }

  // Create Salesman account
  console.log('\nCreating salesman account...');
  const { data: salesData, error: salesError } = await supabase.auth.signUp({
    email: 'salesman@bm.com',
    password: 'sales123',
  });

  if (salesError) {
    console.error('Salesman error:', salesError.message);
  } else {
    console.log('Salesman user created:', salesData.user?.id);
    // Set salesman role
    if (salesData.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: salesData.user.id,
        email: 'salesman@bm.com',
        role: 'salesman',
      });
      if (profileError) {
        console.error('Profile error:', profileError.message);
      } else {
        console.log('Salesman profile set with role: salesman');
      }
    }
  }

  console.log('\nDone!');
}

createAccounts().catch(console.error);
