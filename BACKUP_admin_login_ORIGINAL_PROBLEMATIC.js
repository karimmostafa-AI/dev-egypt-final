// BACKUP: Original Admin Login Component (PROBLEMATIC VERSION)
// Date: 2025-11-12T01:15:36.164Z
// Issue: Infinite refresh loop with automatic page reloads
// Backup created before implementing simplified fix

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

  // Track reload attempts to prevent infinite loop
  useEffect(() => {
    // Check if we just reloaded due to 401 error
    const reloadAttempt = sessionStorage.getItem('admin_login_reload_attempt')
    if (reloadAttempt) {
      const attemptData = JSON.parse(reloadAttempt)
      const timeSinceAttempt = Date.now() - attemptData.timestamp
      
      // If reload happened within last 10 seconds, clear the flag
      if (timeSinceAttempt < 10000) {
        console.log('Page reloaded after 401 error, checking session...')
        // Clear the flag after checking
        sessionStorage.removeItem('admin_login_reload_attempt')
      } else {
        // Old attempt, clear it
        sessionStorage.removeItem('admin_login_reload_attempt')
      }
    }
  }, [])

  // Auto-check for existing admin session on page load
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log('Checking for existing admin session...')
        const user = await account.get()
        
        if (user) {
          console.log('Found existing session for:', user.email)
          const userRole = user.prefs?.role || 'customer'
          
          if (userRole === 'admin') {
            console.log('Admin session found, auto-redirecting to dashboard')
            
            // Use window.location.href for immediate redirect
            window.location.href = '/admin'
            return
          } else {
            console.log('User is not admin, clearing session')
            await account.deleteSession('current')
          }
        }
      } catch (error) {
        console.log('No existing session found')
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
      console.log('Starting login process for:', formData.email)
      
      // First, ensure any existing session is cleared
      try {
        await account.deleteSession('current')
        console.log('Cleared any existing session')
      } catch (error) {
        // No existing session to clear, continue
        console.log('No existing session to clear')
      }

      // Create email session with Appwrite
      console.log('Creating email session...')
      console.log('Using credentials:', { email: formData.email, passwordLength: formData.password.length })
      
      const session = await account.createEmailPasswordSession(formData.email, formData.password)
      console.log('Session created successfully:', session.$id)
      
      // Note: We trust the session creation and redirect immediately
      // The admin layout will verify the user's role on the next page
      // This prevents 401 errors that can occur when trying to get user data
      // immediately after session creation due to timing issues
      
      console.log('Login successful, redirecting to dashboard...')
      
      // Keep loading state true during redirect
      // Don't set isLoading to false, let the page redirect happen
      
      // Redirect immediately with a full page reload
      // This ensures the session is properly loaded from cookies/storage
      window.location.href = '/admin'
      
      // Return to prevent any code after this from executing
      return
      
    } catch (err: any) {
      console.error("Login error:", err)
      console.error("Error code:", err?.code)
      console.error("Error type:", err?.type)
      
      let errorMessage = "Login failed. Please check your credentials and try again."
      
      if (err?.code === 401) {
        // Check if we already tried reloading
        const reloadAttempt = sessionStorage.getItem('admin_login_reload_attempt')
        
        if (reloadAttempt) {
          // Already tried reload, show actual error
          const attemptData = JSON.parse(reloadAttempt)
          const timeSinceAttempt = Date.now() - attemptData.timestamp
          
          if (timeSinceAttempt < 10000) {
            // Recent reload attempt failed, show real error
            console.log('Reload attempt failed, showing error')
            sessionStorage.removeItem('admin_login_reload_attempt')
            errorMessage = "Invalid email or password. Please check your credentials."
            setError(errorMessage)
            setIsLoading(false)
            return
          }
        }
        
        // First 401 error - attempt automatic retry with page reload
        console.log('401 error detected - attempting automatic retry with page reload...')
        
        errorMessage = "تم إنشاء الجلسة، جاري إعادة تحميل الصفحة..."
        setError(errorMessage)
        
        // Save reload attempt to sessionStorage
        sessionStorage.setItem('admin_login_reload_attempt', JSON.stringify({
          timestamp: Date.now(),
          email: formData.email
        }))
        
        // Wait a moment to show the message, then reload
        setTimeout(() => {
          console.log('Reloading page to complete login...')
          window.location.reload()
        }, 1500)
        
        // Keep loading state true during reload
        return
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