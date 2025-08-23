import { useState, useEffect, useCallback } from 'react';
import { FiCreditCard, FiArrowUp, FiArrowDown, FiClock, FiFilter } from 'react-icons/fi';
import { walletService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DEFAULT_CURRENCY = import.meta.env.VITE_DEFAULT_CURRENCY || 'INR';

const Wallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [walletData, setWalletData] = useState({ balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    type: 'all',
    status: '',
    page: 1,
    limit: 10
  });

  const [addFundsForm, setAddFundsForm] = useState({ amount: '', paymentMethod: 'UPI' });
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    bankDetails: { accountNumber: '', ifscCode: '', accountHolderName: '' }
  });

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Create Razorpay order
  const createRazorpayOrder = async (amount) => {
  try {
    const response = await api.post("/api/payments/create-order", {
      amount,
      currency: "INR",
    });
    return response.data; 
  } catch (error) {
    console.error("createRazorpayOrder", error);
    toast.error("Failed to initiate payment");
    throw error;
  }
};


  // Open Razorpay screen
const handleRazorpayScreen = async (order) => {
  try {
    setIsSubmitting(true);

    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) throw new Error("Failed to load Razorpay checkout script");

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: "Sejal Sinha",
      description: "Wallet top-up",
      handler: async function (response) {
        try {
          const verifyRes = await api.post('/api/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            amount: order.amount / 100 // convert paise to rupees
          });

          if (verifyRes.data.success) {
            toast.success("Funds added successfully!");
            setShowAddFundsModal(false);
            setAddFundsForm({ amount: '', paymentMethod: 'UPI' });
            await fetchData();
          } else {
            toast.error("Payment verification failed");
          }
        } catch (err) {
          console.error("Payment verification error:", err);
          toast.error("Error verifying payment");
        }
      },
      prefill: { name: user.name || 'User', email: user.email || '' },
      theme: { color: "#F4C430" }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();

  } catch (error) {
    console.error("handleRazorpayScreen error:", error);
    toast.error(error.message || "Payment initialization failed");
  } finally {
    setIsSubmitting(false);
  }
};


  // const paymentFetch = async (e) => {
  //   e.preventDefault();
  //   try {
  //     const paymentId = e.target.paymentId.value;
  //     const response = await axios.get(`http://localhost:4000/api/payments/${paymentId}`);
  //     setResponseState(response.data);
  //   } catch (error) {
  //     console.error('paymentFetch', error);
  //     toast.error('Failed to fetch payment details');
  //   }
  // };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to access your wallet');
        navigate('/login');
        return;
      }

      const [walletResponse, transactionsResponse] = await Promise.all([
        walletService.getWallet(),
        walletService.getTransactions(filters)
      ]);

      if (walletResponse.data?.success) setWalletData(walletResponse.data.data || { balance: 0 });
      else console.error('Wallet fetch failed', walletResponse.data);

      if (Array.isArray(transactionsResponse.data?.transactions)) setTransactions(transactionsResponse.data.transactions);
      else console.error('Transactions fetch invalid', transactionsResponse.data);

    } catch (error) {
      console.error('fetchData', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        setError('Failed to load wallet data');
        toast.error('Failed to load wallet data');
      }
    } finally {
      setIsLoading(false);
      setIsTransactionsLoading(false);
    }
  }, [filters, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const validateAmount = (amount) => {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) throw new Error('Please enter a valid amount greater than 0');
    if (num > 100000) throw new Error('Amount cannot exceed ₹1,00,000');
    return true;
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    try {
      validateAmount(addFundsForm.amount);
      const orderData = await createRazorpayOrder(Number(addFundsForm.amount));
      handleRazorpayScreen(orderData); 
    } catch (error) {
      console.error("handleAddFunds", error);
      toast.error(error.message || "Failed to add funds");
    }
  };


  const handleWithdraw = async (e) => {
    e.preventDefault();

    try {
        setIsSubmitting(true);
        validateAmount(withdrawForm.amount);
        if (Number(withdrawForm.amount) > walletData.balance) throw new Error('Insufficient balance');
        const response = await walletService.withdrawFunds(withdrawForm);

      if (response.data?.success) {
        toast.success('Withdrawal request submitted successfully');
        setShowWithdrawModal(false);
        setWithdrawForm({ amount: '', bankDetails: { accountNumber: '', ifscCode: '', accountHolderName: '' } });
        await fetchData();

      } else throw new Error(response.data?.message || 'Failed to process withdrawal');
    } catch (error) {
        console.error('handleWithdraw', error);

        toast.error(error.message || 'Failed to process withdrawal');
    } finally { setIsSubmitting(false); }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return 'Invalid Date'; }
  };

  const formatAmount = (amount) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: DEFAULT_CURRENCY, minimumFractionDigits: 2 }).format(amount || 0);
    } catch { return `₹0.00`; }
  };

  const getTransactionStatusBadge = (status) => {
    const statusMap = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'processing': 'bg-blue-100 text-blue-800'
    };
    return statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getTransactionIcon = (type) => {
    if (type?.toLowerCase() === 'credit') return <FiArrowUp className="w-4 h-4 text-green-500" />;
    if (type?.toLowerCase() === 'debit') return <FiArrowDown className="w-4 h-4 text-red-500" />;
    return <FiClock className="w-4 h-4 text-gray-500" />;
  };

  if (isLoading) return <div className="h-64 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  if (error) return (
    <div className="text-center py-12">
      <p className="text-red-500">{error}</p>
      <Button onClick={() => { setError(null); setIsLoading(true); fetchData(); }} variant="primary" className="mt-4">Retry</Button>
    </div>
  );

  return (
    <div className="container mx-auto max-w-5xl p-4">
      {/* Wallet Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Wallet</h2>
            <FiCreditCard className="w-8 h-8" />
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-green-100">Available Balance</p>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">
                {formatAmount(walletData.balance)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium mb-2">Quick Actions</h3>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddFundsModal(true)}
            >
              Add Money
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowWithdrawModal(true)}
            >
              Withdraw
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter className="mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <DatePicker
                selected={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                className="w-full rounded-md border-gray-300 shadow-sm"
                placeholderText="Select start date"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <DatePicker
                selected={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                className="w-full rounded-md border-gray-300 shadow-sm"
                placeholderText="Select end date"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'credit', label: 'Credit' },
                  { value: 'debit', label: 'Debit' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={[
                  { value: '', label: 'All' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'failed', label: 'Failed' }
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">Transaction History</h3>
        </div>
        
        {isTransactionsLoading ? (
          <div className="h-48 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Your transaction history will appear here"
            icon={<FiCreditCard className="w-12 h-12 text-gray-400 ml-20" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.description || 
                             (transaction.type === 'credit' ? 'Money Added' : 
                              transaction.type === 'debit' ? 'Payment' : 'Transaction')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.referenceId || transaction._id.substring(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'credit' ? '+' : '-'} {formatAmount(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionStatusBadge(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Funds Modal */}
      <Modal
        isOpen={showAddFundsModal}
        onClose={() => !isSubmitting && setShowAddFundsModal(false)}
        title="Add Funds to Wallet"
      >
        <div className="space-y-4">
          <Input
            label="Amount"
            type="number"
            value={addFundsForm.amount}
            onChange={(e) => setAddFundsForm(prev => ({ ...prev, amount: e.target.value }))}
            required
            min="1"
            max="100000"
            disabled={isSubmitting}
          />

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddFundsModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="primary"
              loading={isSubmitting}
              onClick={handleAddFunds}
            >
              Pay
            </Button>
          </div>
        </div>
      </Modal>


      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => !isSubmitting && setShowWithdrawModal(false)}
        title="Withdraw Funds"
      >
        <form onSubmit={handleWithdraw}>
          <div className="space-y-4">
            <Input
              label="Amount"
              type="number"
              value={withdrawForm.amount}
              onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
              required
              min="1"
              max={walletData.balance}
              disabled={isSubmitting}
            />
            <Input
              label="Account Number"
              value={withdrawForm.bankDetails.accountNumber}
              onChange={(e) => setWithdrawForm(prev => ({
                ...prev,
                bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
              }))}
              required
              disabled={isSubmitting}
            />
            <Input
              label="IFSC Code"
              value={withdrawForm.bankDetails.ifscCode}
              onChange={(e) => setWithdrawForm(prev => ({
                ...prev,
                bankDetails: { ...prev.bankDetails, ifscCode: e.target.value }
              }))}
              required
              disabled={isSubmitting}
              pattern="^[A-Z]{4}0[A-Z0-9]{6}$"
              title="Please enter a valid IFSC code (e.g., HDFC0123456)"
            />
            <Input
              label="Account Holder Name"
              value={withdrawForm.bankDetails.accountHolderName}
              onChange={(e) => setWithdrawForm(prev => ({
                ...prev,
                bankDetails: { ...prev.bankDetails, accountHolderName: e.target.value }
              }))}
              required
              disabled={isSubmitting}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowWithdrawModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Withdraw
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Wallet; 