import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProposals, voteOnProposal } from '../../store/slices/governanceSlice';

function ProposalsList() {
  const dispatch = useDispatch();
  const { proposals, loading, error } = useSelector((state) => state.governance);
  const { isConnected } = useSelector((state) => state.wallet);

  useEffect(() => {
    dispatch(fetchProposals());
  }, [dispatch]);

  const handleVote = async (proposalId, vote) => {
    if (!isConnected) {
      alert('Please connect your wallet to vote');
      return;
    }
    
    try {
      await dispatch(voteOnProposal({ proposalId, vote })).unwrap();
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error loading proposals: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          onVote={handleVote}
          isConnected={isConnected}
        />
      ))}
    </div>
  );
}

function ProposalCard({ proposal, onVote, isConnected }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'passed': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{proposal.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{proposal.description}</p>
          </div>
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(proposal.status)}`}>
            {proposal.status}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500">
            <span>For: {proposal.votesFor}</span>
            <span>Against: {proposal.votesAgainst}</span>
          </div>
          <div className="mt-2 relative pt-1">
            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
              <div
                style={{ width: `${(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
              ></div>
            </div>
          </div>
        </div>

        {proposal.status === 'active' && (
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => onVote(proposal.id, 'for')}
              disabled={!isConnected}
              className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Vote For
            </button>
            <button
              onClick={() => onVote(proposal.id, 'against')}
              disabled={!isConnected}
              className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Vote Against
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProposalsList;
