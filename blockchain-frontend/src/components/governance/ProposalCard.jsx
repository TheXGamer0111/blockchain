import React from 'react';
import { useDispatch } from 'react-redux';
import { castVote } from '../../store/slices/governanceSlice';
import { formatDistance } from 'date-fns';

const ProposalCard = ({ proposal }) => {
  const dispatch = useDispatch();

  const handleVote = async (vote) => {
    try {
      await dispatch(castVote({ proposalId: proposal.id, vote })).unwrap();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Passed': return 'bg-blue-500';
      case 'Failed': return 'bg-red-500';
      case 'Pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold text-white">{proposal.title}</h3>
        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(proposal.status)}`}>
          {proposal.status}
        </span>
      </div>
      
      <p className="mt-2 text-gray-400">{proposal.description}</p>
      
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Proposer: {proposal.proposer.slice(0, 8)}...</span>
          <span>Ends: {formatDistance(new Date(proposal.end_time), new Date(), { addSuffix: true })}</span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all"
            style={{ 
              width: `${(proposal.votes_for / (proposal.votes_for + proposal.votes_against || 1)) * 100}%` 
            }}
          />
        </div>
        
        <div className="flex justify-between text-sm">
          <span>For: {proposal.votes_for}</span>
          <span>Against: {proposal.votes_against}</span>
        </div>
      </div>

      {proposal.status === 'Active' && (
        <div className="mt-4 flex space-x-4">
          <button
            onClick={() => handleVote(true)}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md"
          >
            Vote For
          </button>
          <button
            onClick={() => handleVote(false)}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md"
          >
            Vote Against
          </button>
        </div>
      )}
    </div>
  );
};

export default ProposalCard; 