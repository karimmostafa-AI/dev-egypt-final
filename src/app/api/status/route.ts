import { NextResponse } from "next/server"

export async function GET() {
  // Check if Appwrite is properly configured
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY
  
  const isAppwriteConfigured = projectId && projectId !== 'your-project-id-here' && apiKey && apiKey !== 'your-api-key-here'
  
  return NextResponse.json({
    status: 'online',
    appwriteConfigured: isAppwriteConfigured,
    fallbackMode: !isAppwriteConfigured,
    timestamp: new Date().toISOString(),
    apis: {
      brands: isAppwriteConfigured ? 'appwrite' : 'fallback',
      categories: isAppwriteConfigured ? 'appwrite' : 'fallback', 
      products: isAppwriteConfigured ? 'appwrite' : 'fallback'
    }
  })
}