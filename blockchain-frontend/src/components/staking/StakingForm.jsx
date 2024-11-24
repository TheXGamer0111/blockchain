import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createStake } from '../../store/slices/stakingSlice';

function StakingForm() {    
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.staking);
  const { balance } = useSelector((state) => state.wallet);
  
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('30');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(balance)) {
      setError('Insufficient balance');
      return;
    }

    try {
      await dispatch(createStake({ amount: parseFloat(amount), duration: parseInt(duration) })).unwrap();
      setAmount('');
      setDuration('30');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Create New Stake</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount (NEXUS)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-4 pr-12 sm:text-sm border-gray-300 rounded-md"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">NEXUS</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Lock Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="30">30 Days (10% APY)</option>
            <option value="90">90 Days (15% APY)</option>
            <option value="180">180 Days (20% APY)</option>
            <option value="365">365 Days (25% APY)</option>
          </select>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Creating Stake...' : 'Create Stake'}
        </button>
      </form>
    </div>
  );
}

export default StakingForm; 