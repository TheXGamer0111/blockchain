import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchStakes } from '../../store/slices/stakingSlice';

function StakingDashboard() {
  const dispatch = useDispatch();
  const { stakes, totalStaked, rewards, loading } = useSelector((state) => state.staking);
  const { address, isConnected } = useSelector((state) => state.wallet);

  useEffect(() => {
    if (isConnected && address) {
      dispatch(fetchStakes(address));
    }
  }, [dispatch, address, isConnected]);

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-yellow-700">Wallet Not Connected</h3>
        <p className="mt-2 text-yellow-600">Please connect your wallet to view staking information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StakingCard
          title="Total Staked"
          value={`${totalStaked} NEXUS`}
          loading={loading}
        />
        <StakingCard
          title="Available Rewards"
          value={`${rewards} NEXUS`}
          loading={loading}
        />
        <StakingCard
          title="Active Stakes"
          value={stakes.length}
          loading={loading}
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Stakes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {stakes.map((stake) => (
            <StakeItem key={stake.id} stake={stake} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StakingCard({ title, value, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StakeItem({ stake }) {
  return (
    <div className="px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {stake.amount} NEXUS
          </p>
          <p className="text-sm text-gray-500">
            Locked until: {new Date(stake.unlockDate).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-green-600">
            +{stake.rewards} NEXUS
          </p>
          <p className="text-sm text-gray-500">
            APY: {stake.apy}%
          </p>
        </div>
      </div>
    </div>
  );
}

export default StakingDashboard; 