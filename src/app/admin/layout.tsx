"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Menu,
  X,
  Home,
  Tags,
  Bell,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: Tags,
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    name: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCheckingRole, setIsCheckingRole] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  // Check if user has admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      // Skip role check for login page
      if (pathname === '/admin/login') {
        setIsCheckingRole(false)
        return
      }

      console.log('Admin layout: Starting authentication check for path:', pathname)

      try {
        // Use client-side Appwrite to check authentication and role
        const { account } = await import('@/lib/appwrite')
        
        console.log('Admin layout: Checking authentication for path:', pathname)
        
        try {
          const user = await account.get()
          console.log('Admin layout: User authenticated:', user.email)
          console.log('Admin layout: User role:', user.prefs?.role)
          
          // Check if user has admin role
          const userRole = user.prefs?.role || 'customer'
          if (userRole !== 'admin') {
            console.log('Admin layout: User is not an admin, redirecting to home')
            alert('Access denied. Admin privileges required.')
            router.push('/')
            return
          }

          // User is admin, allow access
          console.log('Admin layout: Admin role verified, allowing access')
          setIsCheckingRole(false)
        } catch (authError: any) {
          // Handle authentication errors
          console.log('Admin layout: Auth check failed:', authError.message)
          console.log('Admin layout: Auth error code:', authError.code)
          console.log('Admin layout: Auth error type:', authError.type)
          
          // Check if it's a 401 Unauthorized error (no valid session)
          if (authError.code === 401 || authError.message?.includes('401') || authError.message?.includes('Unauthorized')) {
            console.log('Admin layout: No valid session found, redirecting to login')
            // Don't set isCheckingRole to false, keep showing loading state during redirect
            router.push('/admin/login')
            return
          }
          
          // Check if it's a scope/permission error (common with API key issues)
          if (authError.message?.includes('missing scopes') || authError.message?.includes('role: applications')) {
            console.log('Admin layout: API key scope issue detected')
            // This is likely an API key configuration issue, but we should still require authentication
            console.log('Admin layout: Redirecting to login due to auth configuration issue')
            // Don't set isCheckingRole to false, keep showing loading state during redirect
            router.push('/admin/login')
            return
          }
          
          // For any other auth errors, redirect to login
          console.log('Admin layout: Authentication failed, redirecting to login')
          // Don't set isCheckingRole to false, keep showing loading state during redirect
          router.push('/admin/login')
        }
      } catch (error) {
        console.error('Admin layout: Error checking admin role:', error)
        console.log('Admin layout: Redirecting to login due to error')
        // Don't set isCheckingRole to false, keep showing loading state during redirect
        router.push('/admin/login')
      }
    }

    checkAdminRole()
  }, [pathname, router])

  // Show loading state while checking role
  if (isCheckingRole && pathname !== '/admin/login') {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  // If this is the login page, render it without the admin layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">DE</span>
          </div>
          <span className="font-bold text-lg">Dev-Egypt Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-4">
        <div className="flex items-center space-x-3 rounded-lg bg-accent p-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-medium text-sm">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Admin User</p>
            <p className="text-xs text-muted-foreground truncate">admin@dev-egypt.com</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              3
            </Badge>
            <span className="sr-only">Notifications</span>
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}