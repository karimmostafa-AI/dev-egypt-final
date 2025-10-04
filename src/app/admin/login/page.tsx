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
            
            // Add a small delay to ensure session is properly stored
            await new Promise(resolve => setTimeout(resolve, 500))
            
            router.push('/admin')
            
            // Fallback redirect using window.location if router.push doesn't work
            setTimeout(() => {
              if (window.location.pathname === '/admin/login') {
                console.log('Router push failed, using window.location fallback')
                window.location.href = '/admin'
              }
            }, 1000)
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
      
      // Check if there's already an active session
      try {
        const existingUser = await account.get()
        if (existingUser && existingUser.email === formData.email) {
          console.log('Session already exists for this user')
          
          // Check if user has admin role
          const userRole = existingUser.prefs?.role || 'customer'
          if (userRole !== 'admin') {
            setError('Access denied. Admin privileges required.')
            await account.deleteSession('current')
            return
          }
          
          console.log('Admin session verified, redirecting to dashboard')
          console.log('Router push called for /admin')
          
          // Add a small delay to ensure session is properly stored
          await new Promise(resolve => setTimeout(resolve, 500))
          
          router.push("/admin")
          console.log('Router push completed')
          
          // Fallback redirect using window.location if router.push doesn't work
          setTimeout(() => {
            if (window.location.pathname === '/admin/login') {
              console.log('Router push failed, using window.location fallback')
              window.location.href = '/admin'
            }
          }, 1000)
          return
        } else if (existingUser) {
          // Different user is logged in, delete existing session first
          console.log('Different user logged in, deleting old session')
          await account.deleteSession('current')
        }
      } catch (error) {
        // No active session, continue with login
        console.log('No active session found, proceeding with login')
      }

      // Create email session with Appwrite
      console.log('Creating email session...')
      console.log('Using credentials:', { email: formData.email, passwordLength: formData.password.length })
      
      const session = await account.createEmailPasswordSession(formData.email, formData.password)
      console.log('Session created successfully:', session.$id)
      console.log('Session details:', {
        id: session.$id,
        userId: session.userId,
        provider: session.provider,
        current: session.current,
        ip: session.ip,
        osCode: session.osCode,
        osName: session.osName,
        clientCode: session.clientCode,
        clientName: session.clientName
      })

      // Wait a moment for session to be stored
      await new Promise(resolve => setTimeout(resolve, 100))

      // Check localStorage for session token
      try {
        const sessionToken = localStorage.getItem('appwrite-session');
        console.log('Session token in localStorage:', sessionToken ? 'Found' : 'Not found');
        if (sessionToken) {
          console.log('Session token preview:', sessionToken.substring(0, 20) + '...');
        }
        
        // Also check for other possible session storage keys
        const allKeys = Object.keys(localStorage);
        const appwriteKeys = allKeys.filter(key => key.includes('appwrite') || key.includes('session'));
        console.log('All Appwrite-related localStorage keys:', appwriteKeys);
      } catch (error) {
        console.log('Could not access localStorage:', error);
      }
      
      // Try to get current session info
      try {
        const currentSession = await account.getSession('current');
        console.log('Current session info:', {
          id: currentSession.$id,
          userId: currentSession.userId,
          current: currentSession.current
        });
      } catch (sessionError: any) {
        console.log('Could not get current session:', sessionError.message);
      }

      // Get user data to verify login
      console.log('Getting user data...')
      let user;
      try {
        user = await account.get()
        console.log('User retrieved successfully:', user.email, 'Role:', user.prefs?.role)
        console.log('User details:', {
          id: user.$id,
          email: user.email,
          name: user.name,
          role: user.prefs?.role,
          emailVerification: user.emailVerification
        })
      } catch (userError: any) {
        console.error('Failed to get user data:', userError)
        console.error('User error details:', {
          message: userError.message,
          code: userError.code,
          type: userError.type
        })
        throw new Error(`Failed to retrieve user data: ${userError.message}`)
      }

      // Check if user has admin role
      const userRole = user.prefs?.role || 'customer'
      if (userRole !== 'admin') {
        setError('Access denied. Admin privileges required.')
        await account.deleteSession('current')
        return
      }

      console.log('Admin login successful, redirecting to dashboard')
      console.log('Router push called for /admin')
      
      // Add a small delay to ensure session is properly stored
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirect to admin dashboard on success
      router.push("/admin")
      console.log('Router push completed')
      
      // Fallback redirect using window.location if router.push doesn't work
      setTimeout(() => {
        if (window.location.pathname === '/admin/login') {
          console.log('Router push failed, using window.location fallback')
          window.location.href = '/admin'
        }
      }, 1000)
    } catch (err: any) {
      console.error("Login error:", err)
      console.error("Error code:", err?.code)
      console.error("Error type:", err?.type)
      
      let errorMessage = "Login failed. Please check your credentials and try again."
      
      if (err?.code === 401) {
        errorMessage = "Invalid email or password. Please check your credentials."
      } else if (err?.code === 429) {
        errorMessage = "Too many login attempts. Please try again later."
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
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