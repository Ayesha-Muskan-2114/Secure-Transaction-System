'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpFromLine, Loader2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function TransferPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    receiver_account: '',
    amount: '',
    remarks: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const transferAmount = parseFloat(formData.amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/vendor/transfer', {
        ...formData,
        amount: transferAmount,
      });
      toast.success('Transfer successful!');
      toast.info(`New Balance: ₹${response.data.new_balance.toLocaleString('en-IN')}`);
      setFormData({ receiver_account: '', amount: '', remarks: '' });
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          {/* Header */}
          <div className="border-b bg-card">
            <div className="container mx-auto px-6 py-4">
              <h1 className="text-2xl font-bold">Transfer Funds</h1>
              <p className="text-sm text-muted-foreground">Send money to another account</p>
            </div>
          </div>

          {/* Content */}
          <div className="container mx-auto p-6">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gradient-to-br from-purple-600 to-violet-600 p-3">
                      <ArrowUpFromLine className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Transfer Money</CardTitle>
                      <CardDescription>Enter beneficiary details and amount</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="receiver_account">Beneficiary Account Number</Label>
                      <Input
                        id="receiver_account"
                        placeholder="Enter account number"
                        value={formData.receiver_account}
                        onChange={(e) => setFormData({ ...formData, receiver_account: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          ₹
                        </span>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-8 text-lg"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="remarks">Remarks (Optional)</Label>
                      <Textarea
                        id="remarks"
                        placeholder="Add a note for this transfer"
                        rows={3}
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        disabled={loading}
                      />
                    </div>

                    <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-4 space-y-2">
                      <p className="text-sm font-medium">Transaction Summary</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Transfer Amount:</span>
                        <span className="font-semibold">
                          ₹{formData.amount ? parseFloat(formData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Transaction Fee:</span>
                        <span className="font-semibold text-green-600">₹0.00</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-semibold">Total Debit:</span>
                        <span className="font-bold text-lg text-red-600">
                          ₹{formData.amount ? parseFloat(formData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                        </span>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing Transfer...
                        </>
                      ) : (
                        'Transfer Now'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}