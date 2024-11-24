import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { transferToken } from '../../store/slices/walletSlice';
import { toast } from 'react-toastify';

function TokenTransfer({ token, isOpen, onClose }) {
  const dispatch = useDispatch();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation
      if (!recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid recipient address');
      }

      if (parseFloat(amount) > parseFloat(token.balance)) {
        throw new Error('Insufficient balance');
      }

      await dispatch(transferToken({
        tokenAddress: token.address,
        to: recipient,
        amount
      })).unwrap();

      onClose();
      toast.success(`Successfully transferred ${amount} ${token.symbol}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Transfer {token.symbol}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.0"
                step="0.000000000000000001"
              />
              <span className="absolute right-3 top-2 text-gray-400">
                {token.symbol}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Balance: {parseFloat(token.balance).toFixed(4)} {token.symbol}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading
                ? 'bg-indigo-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Transferring...' : 'Transfer'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TokenTransfer; 