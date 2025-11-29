'use client'
import Image from "next/image";
import { useRouter, usePathname } from 'next/navigation'
import { Home, Send, History, Fingerprint, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    router.push('/')
  }

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Send, label: 'Transfer', path: '/transfer' },
    { icon: History, label: 'Transactions', path: '/transactions' },
    { icon: Fingerprint, label: 'FacePay', path: '/facepay' },
  ]

  return (
    <aside className="w-64 flex flex-col min-h-screen bg-gradient-to-b from-blue-800 via-blue-700 to-blue-900 text-white">
      {/* Logo / Branding */}
      <div className="p-6 border-b border-blue-600">
        <div className="flex flex-col items-center">
          <Image
            src="/images/logo1.jpg"
            alt="NammaPay Logo"
            width={150}
            height={70}
            className="rounded-xl shadow-lg"
            priority
          />
        {/**  <h2 className="mt-4 font-bold text-white text-lg">ABC Secure</h2>
          <p className="text-sm text-blue-200">Banking</p>*/} 
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-blue-100 hover:bg-blue-600/70 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-blue-600">
  <Button
    onClick={handleLogout}
    variant="outline"
    className="w-full justify-start text-blue-200 border-blue-200 hover:bg-white hover:text-blue-800"
  >
    <LogOut className="w-5 h-5 mr-3 text-black-500" />
    Logout
  </Button>
</div>

    </aside>
  )
}
