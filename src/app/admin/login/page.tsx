"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { account } from "@/lib/appwrite"
import { Eye, EyeOff, LogIn } from "lucide-react"

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const router = useRouter()

  // SIMPLIFIED: Single session check on mount (no complex reload tracking)
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log('🔍 Admin Login: Checking for existing admin session...')
        const user = await account.get()
        
        if (user) {
          console.log('✅ Admin Login: Found session for:', user.email)
          const userRole = user.prefs?.role || 'customer'
          
          if (userRole === 'admin') {
            console.log('✅ Admin Login: Admin session found, redirecting to dashboard')
            // Use consistent redirect method
            router.push('/admin')
            return
          } else {
            console.log('⚠️ Admin Login: User is not admin, clearing session')
            await account.deleteSession('current')
          }
        }
      } catch (error) {
        console.log('ℹ️ Admin Login: No existing session found')
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkExistingSession()
  }, [router])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null) // Clear error when user starts typing
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // SIMPLIFIED: Basic validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🚀 Admin Login: Starting login process for:', formData.email)
      
      // Clear any existing session first
      try {
        await account.deleteSession('current')
        console.log('✅ Admin Login: Cleared existing session')
      } catch (error) {
        console.log('ℹ️ Admin Login: No existing session to clear')
      }

      // Create new session with Appwrite
      console.log('🔄 Admin Login: Creating email session...')
      const session = await account.createEmailPasswordSession(formData.email, formData.password)
      console.log('✅ Admin Login: Session created successfully:', session.$id)
      
      // Verify the session immediately
      console.log('🔍 Admin Login: Verifying session...')
      const user = await account.get()
      
      if (user && user.prefs?.role === 'admin') {
        console.log('✅ Admin Login: Admin role verified, redirecting to dashboard')
        // Use consistent redirect method (no page reload)
        router.push('/admin')
      } else {
        console.log('❌ Admin Login: User found but not admin role')
        throw new Error('Access denied. Admin privileges required.')
      }
      
    } catch (err: any) {
      console.error('❌ Admin Login: Login error details:', {
        message: err?.message,
        code: err?.code,
        type: err?.type,
        timestamp: new Date().toISOString()
      })
      
      let errorMessage = "Login failed. Please check your credentials and try again."
      
      if (err?.code === 401) {
        errorMessage = "Invalid email or password. Please check your credentials."
      } else if (err?.code === 429) {
        errorMessage = "Too many login attempts. Please try again later."
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  // Show loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Checking session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">DE</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Dev-Egypt Admin</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="admin@dev-egypt.com"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => handleInputChange("rememberMe", !!checked)}
              />
              <Label htmlFor="rememberMe" className="text-sm font-normal">
                Remember me
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              href="/admin/forgot-password"
              className="text-primary hover:underline"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Setup Required:</strong><br />
              First, create an admin user using the API endpoint:<br />
              <code className="text-xs bg-background px-1 rounded">POST /api/create-admin</code><br />
              <br />
              <strong>Demo Credentials:</strong><br />
              Email: admin@dev-egypt.com<br />
              Password: AdminPassword123!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}