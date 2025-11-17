'use client';

import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, History, Activity } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import DashboardCard from '@/components/DashboardCard';
import TransactionTable from '@/components/TransactionTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { getAuth } from '@/lib/auth';
import { toast } from 'sonner';

const maskAccount = (acc) => {
  if (!acc) return "-";
  const last4 = acc.slice(-4);
  return "X".repeat(acc.length - 4) + last4;
};


export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { vendor } = getAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/vendor/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          {/* Header */}
          <div className="border-b bg-card">
            <div className="container mx-auto px-6 py-4">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {dashboardData?.vendor?.name || vendor?.name}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="container mx-auto p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <DashboardCard
                title="Current Balance"
                value={`₹${dashboardData?.vendor?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`}
                icon={Wallet}
                subtitle="Available funds"
                className="border-l-4 border-l-purple-600"
              />
              <DashboardCard
                title="Account Number"
                value={maskAccount(dashboardData?.vendor?.account_number)}

                icon={Activity}
                subtitle={dashboardData?.vendor?.branch || 'Branch'}
                className="border-l-4 border-l-violet-600"
              />
              <DashboardCard
                title="Total Transactions"
                value={dashboardData?.recent_transactions?.length || 0}
                icon={History}
                subtitle="Recent activity"
                className="border-l-4 border-l-purple-500"
              />
              <DashboardCard
                title="Status"
                value="Active"
                icon={TrendingUp}
                subtitle="Account verified"
                className="border-l-4 border-l-violet-500"
              />
            </div>

            {/* Vendor Info */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">{dashboardData?.vendor?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{dashboardData?.vendor?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mobile</p>
                    <p className="font-semibold">{dashboardData?.vendor?.mobile}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="font-semibold">{maskAccount(dashboardData?.vendor?.account_number)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Branch</p>
                    <p className="font-semibold">{dashboardData?.vendor?.branch}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="font-semibold text-green-600">
                      ₹{dashboardData?.vendor?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionTable transactions={dashboardData?.recent_transactions || []} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}