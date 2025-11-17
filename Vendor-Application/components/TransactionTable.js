import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function TransactionTable({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        No transactions found
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    const colors = {
      deposit: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      transfer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      facepay: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      upi: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return (
      <Badge className={colors[type] || ''}>
        {type?.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="font-mono text-xs">{tx.tx_id}</TableCell>
              <TableCell>{getTypeBadge(tx.transaction_type)}</TableCell>
              <TableCell className="font-semibold">
                ₹{parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-xs">
                {tx.receiver_account || tx.sender_account || '-'}
              </TableCell>
              <TableCell>{getStatusBadge(tx.status)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {tx.timestamp ? formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true }) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}