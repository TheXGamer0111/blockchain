import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const GovernanceWidget = () => {
  const { proposals } = useSelector((state) => state.governance);
  const activeProposals = proposals.filter(p => p.status === 'active');

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-white">Governance</h2>
        <Link 
          to="/governance" 
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          View All
        </Link>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-400 text-sm">Active Proposals</p>
          <p className="text-2xl font-bold text-white">{activeProposals.length}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Participation</p>
          <p className="text-2xl font-bold text-white">78.5%</p>
        </div>
      </div>

      {activeProposals.length > 0 && (
        <div className="space-y-2">
          {activeProposals.slice(0, 2).map(proposal => (
            <Link 
              key={proposal.id}
              to={`/governance`}
              className="block hover:bg-gray-700 p-2 rounded"
            >
              <p className="text-white text-sm">{proposal.title}</p>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Votes: {proposal.votesFor + proposal.votesAgainst}</span>
                <span>{proposal.timeLeft}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default GovernanceWidget; 