import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStakingRewards, claimRewards } from '../../store/slices/stakingSlice';

function StakingRewards() {
  const dispatch = useDispatch();
  const { rewards, loading } = useSelector((state) => state.staking);
  const { isConnected } = useSelector((state) => state.wallet);

  useEffect(() => {
    if (isConnected) {
      dispatch(fetchStakingRewards());
      const interval = setInterval(() => {
        dispatch(fetchStakingRewards());
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [dispatch, isConnected]);

  const handleClaim = async () => {
    try {
      await dispatch(claimRewards()).unwrap();
    } catch (err) {
      console.error('Failed to claim rewards:', err);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Staking Rewards</h2>
        <button
          onClick={handleClaim}
          disabled={loading || !rewards.available}
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
            ${(loading || !rewards.available) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Claiming...' : 'Claim Rewards'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RewardCard
          title="Available Rewards"
          value={`${rewards.available} NEXUS`}
          description="Ready to claim"
          loading={loading}
        />
        <RewardCard
          title="Pending Rewards"
          value={`${rewards.pending} NEXUS`}
          description="Will be available after lock period"
          loading={loading}
        />
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Reward History</h3>
        <div className="space-y-4">
          {rewards.history.map((reward) => (
            <div key={reward.id} className="flex justify-between items-center text-sm">
              <div>
                <p className="text-gray-900">{reward.amount} NEXUS</p>
                <p className="text-gray-500">{new Date(reward.date).toLocaleDateString()}</p>
              </div>
              <span className="text-green-600">Claimed</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RewardCard({ title, value, description, loading }) {
  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

export default StakingRewards; 