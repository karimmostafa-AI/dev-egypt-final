"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Models } from "appwrite"
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
  LogOut,
  User,
  ChevronRight,
  LayoutDashboard,
  Warehouse,
} from "lucide-react"
import { useAdminNotifications } from "@/hooks/useAdminRealTimeData"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const navigation = [
  {
    name: "Dashboard",
    href: "/admin-v2",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Products",
    href: "/admin-v2/products",
    icon: Package,
    badge: null,
  },
  {
    name: "Categories",
    href: "/admin-v2/categories",
    icon: Tags,
    badge: null,
  },
  {
    name: "Orders",
    href: "/admin-v2/orders",
    icon: ShoppingCart,
    badge: 0,
  },
  {
    name: "Customers",
    href: "/admin-v2/customers",
    icon: Users,
    badge: null,
  },
  {
    name: "Analytics",
    href: "/admin-v2/analytics",
    icon: BarChart3,
    badge: null,
  },
  {
    name: "Inventory",
    href: "/admin-v2/inventory",
    icon: Warehouse,
    badge: null,
  },
  {
    name: "Settings",
    href: "/admin-v2/settings",
    icon: Settings,
    badge: null,
  },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminV2Layout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCheckingRole, setIsCheckingRole] = useState(true)
  const [user, setUser] = useState<Models.User<{ role?: string }> | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { notifications } = useAdminNotifications()

  // Check if user has admin role (server-side verification)
  useEffect(() => {
    const checkAdminRole = async () => {
      // Skip role check for login page
      if (pathname === '/admin-v2/login') {
        setIsCheckingRole(false)
        return
      }

      try {
        // Get user info for display (UX only - not for authorization)
        const { account } = await import('@/lib/appwrite')
        try {
          const currentUser = await account.get()
          setUser(currentUser as Models.User<{ role?: string }>)
        } catch (userError) {
          // User info fetch failed, but continue with server-side verification
          console.warn('Could not fetch user info for display:', userError)
        }

        // Server-side admin verification (SECURE - checks database, not user preferences)
        const verifyResponse = await fetch('/api/admin/verify')
        
        if (verifyResponse.status === 401) {
          // Not authenticated - redirect to login
          router.push('/admin-v2/login')
          return
        }

        const verifyData = await verifyResponse.json()

        if (!verifyData.isAdmin) {
          // Access denied - user is not an admin
          alert('Access denied. Admin privileges required.')
          router.push('/')
          return
        }

        setIsCheckingRole(false)
      } catch (error) {
        console.error('Admin layout: Error checking admin role:', error)
        router.push('/admin-v2/login')
      }
    }

    checkAdminRole()
  }, [pathname, router])

  // Fetch and update notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        setIsLoadingNotifications(true)
        
        // Count unread notifications from the hook
        // In the future, this could fetch from an API endpoint like:
        // const response = await fetch('/api/admin/notifications/count')
        // const data = await response.json()
        // setNotificationCount(data.count)
        const unreadCount = notifications.filter(n => !n.read).length
        setNotificationCount(unreadCount)
      } catch (error) {
        console.error('Error fetching notification count:', error)
        setNotificationCount(0)
      } finally {
        setIsLoadingNotifications(false)
      }
    }

    fetchNotificationCount()
    
    // Cleanup is not needed for this effect as it only updates state
  }, [notifications])

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    if (pathname === '/admin-v2') {
      return [{ label: 'Dashboard', href: '/admin-v2' }]
    }

    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs = [{ label: 'Dashboard', href: '/admin-v2' }]

    let currentPath = '/admin-v2'
    segments.slice(1).forEach((segment, index) => {
      currentPath += `/${segment}`
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      breadcrumbs.push({ label, href: currentPath })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  const handleLogout = async () => {
    try {
      const { account } = await import('@/lib/appwrite')
      await account.deleteSession('current')
      router.push('/admin-v2/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/admin-v2/login')
    }
  }

  // Show loading state while checking role
  if (isCheckingRole && pathname !== '/admin-v2/login') {
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
  if (pathname === '/admin-v2/login') {
    return <>{children}</>
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6 bg-gradient-to-r from-primary/10 to-primary/5">
        <Link href="/admin-v2" className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-sm">DE</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight">Dev-Egypt</span>
            <span className="text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge !== null && item.badge > 0 && (
                <Badge variant="secondary" className="ml-auto h-5 min-w-5 px-1.5 text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-4">
        <div className="flex items-center space-x-3 rounded-lg bg-muted/50 p-3 border border-border/50">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-medium text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || 'Admin User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || 'admin@dev-egypt.com'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:border-r bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-50">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center gap-4 border-b bg-card px-6 shadow-sm">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          {/* Breadcrumbs */}
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage className="font-medium">{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products, orders, customers..."
                className="pl-9 w-full"
              />
            </div>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {!isLoadingNotifications && notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-medium text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || 'admin@dev-egypt.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin-v2/settings" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center">
                  <Home className="mr-2 h-4 w-4" />
                  View Store
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/30">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

