'use client';

import { useState, useEffect } from 'react';
import { History, Download } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import TransactionTable from '@/components/TransactionTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from 'sonner';

const maskAccount = (acc) => {
  if (!acc) return "-";
  const last4 = acc.slice(-4);
  return "X".repeat(acc.length - 4) + last4;
};


export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/vendor/transactions');
      setTransactions(response.data.transactions || []);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.info('Export feature coming soon!');
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          {/* Header */}
          <div className="border-b bg-card">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Transaction History</h1>
                  <p className="text-sm text-muted-foreground">View all your transaction records</p>
                </div>
                <Button onClick={handleExport} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="container mx-auto p-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gradient-to-br from-purple-600 to-violet-600 p-3">
                    <History className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>All Transactions</CardTitle>
                    <CardDescription>
                      Total: {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
  {loading ? (
    <div className="flex h-64 items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>
  ) : (
    <TransactionTable
      transactions={transactions.map(tx => ({
        ...tx,
        customer_account: maskAccount(tx.customer_account),
        vendor_account: maskAccount(tx.vendor_account),
      }))}
    />
  )}
</CardContent>

            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}