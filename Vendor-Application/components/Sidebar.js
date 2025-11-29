'use client';
import Image from "next/image";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ArrowUpFromLine, 
  History, 
  Scan, 
  LogOut
} from 'lucide-react';
import { clearAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transfer', href: '/transfer', icon: ArrowUpFromLine },
  { name: 'FacePay', href: '/facepay', icon: Scan },
  { name: 'Transactions', href: '/transactions', icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-purple-800">

      {/* Logo */}
      <div className="flex justify-center py-6">
        <Image
          src="/images/logo.png"
          alt="NammaPay Logo"
          width={150}
          height={70}
          className="rounded-xl shadow-lg"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-white/80 hover:bg-purple-700 hover:text-white'
              )}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-white/80'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-purple-700 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/80 hover:text-red-500"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5 text-white/80" />
          Logout
        </Button>
      </div>
    </div>
  );
}
