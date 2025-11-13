// Test Analytics Tracking
// Run this in the browser console to verify tracking is working

async function testAnalyticsTracking() {
  console.log('🔍 Testing Analytics Tracking...\n')
  
  // Test 1: Check if visitor tracker is sending data
  console.log('1️⃣ Testing Live Visitor API...')
  try {
    const testVisitorData = {
      visitor_id: `test_visitor_${Date.now()}`,
      session_id: `test_session_${Date.now()}`,
      current_page: window.location.pathname,
      device_type: 'desktop',
      browser: 'Chrome',
      os: 'Windows',
      screen_resolution: '1920x1080',
      entered_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    }
    
    const response = await fetch('/api/analytics/live-visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testVisitorData),
    })
    
    const result = await response.json()
    console.log('✅ Live Visitor API Response:', result)
  } catch (error) {
    console.error('❌ Live Visitor API Error:', error)
  }
  
  // Test 2: Fetch current live visitors
  console.log('\n2️⃣ Fetching Live Visitors...')
  try {
    const response = await fetch('/api/analytics/live-visitors')
    const data = await response.json()
    console.log('✅ Live Visitors:', data)
    console.log(`   Total: ${data.total} visitors`)
    console.log(`   Cleaned: ${data.cleaned} stale visitors`)
  } catch (error) {
    console.error('❌ Fetch Live Visitors Error:', error)
  }
  
  // Test 3: Check localStorage/sessionStorage
  console.log('\n3️⃣ Checking Storage Availability...')
  try {
    localStorage.setItem('test', 'test')
    localStorage.removeItem('test')
    console.log('✅ localStorage: Available')
  } catch (e) {
    console.warn('⚠️ localStorage: Not available (private browsing?)')
  }
  
  try {
    sessionStorage.setItem('test', 'test')
    sessionStorage.removeItem('test')
    console.log('✅ sessionStorage: Available')
  } catch (e) {
    console.warn('⚠️ sessionStorage: Not available (private browsing?)')
  }
  
  console.log('\n✨ Test complete!')
}

// Run the test
testAnalyticsTracking()
