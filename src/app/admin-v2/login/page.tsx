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
import { Eye, EyeOff, LogIn, Shield } from "lucide-react"

export default function AdminV2Login() {
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

  // Load remembered email on mount
  useEffect(() => {
    try {
      const rememberedEmail = localStorage.getItem('admin-remembered-email')
      if (rememberedEmail) {
        setFormData(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }))
      }
    } catch (error) {
      // localStorage not available (e.g., private browsing mode)
      console.warn('Could not access localStorage:', error)
    }
  }, [])

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const user = await account.get()
        
        if (user) {
          const userRole = user.prefs?.role || 'customer'
          
          if (userRole === 'admin') {
            router.push('/admin-v2')
            return
          } else {
            await account.deleteSession('current')
          }
        }
      } catch (error) {
        // No existing session
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkExistingSession()
  }, [router])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
    
    // If rememberMe is unchecked, immediately clear stored email
    if (field === 'rememberMe' && value === false) {
      try {
        localStorage.removeItem('admin-remembered-email')
      } catch (error) {
        // localStorage not available
        console.warn('Could not access localStorage:', error)
      }
    }
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
      // Clear any existing session first
      try {
        await account.deleteSession('current')
      } catch (error) {
        // No existing session to clear
      }

      // Create new session
      await account.createEmailPasswordSession(formData.email, formData.password)
      
      // Handle rememberMe: store email in localStorage if checked, remove if unchecked
      try {
        if (formData.rememberMe) {
          localStorage.setItem('admin-remembered-email', formData.email)
        } else {
          localStorage.removeItem('admin-remembered-email')
        }
      } catch (error) {
        // localStorage not available (e.g., private browsing mode)
        // Session will still work, just won't remember email
        console.warn('Could not access localStorage for rememberMe:', error)
      }
      
      // Verify the session
      const user = await account.get()
      
      if (user && user.prefs?.role === 'admin') {
        router.push('/admin-v2')
      } else {
        throw new Error('Access denied. Admin privileges required.')
      }
      
    } catch (err: any) {
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

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Checking session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md shadow-lg border-2">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Admin Portal</CardTitle>
          <CardDescription className="text-base">
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
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                placeholder="admin@dev-egypt.com"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className="h-11"
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
                  className="h-11 pr-10"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleInputChange("rememberMe", !!checked)}
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Link
                href="/admin-v2/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
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

          <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground text-center">
              <strong className="text-foreground">Demo Credentials:</strong><br />
              Email: admin@dev-egypt.com<br />
              Password: AdminPassword123!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

