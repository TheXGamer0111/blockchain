import React from 'react';
import { format } from 'date-fns';

const TransactionModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Transaction Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-gray-400">Transaction Hash</p>
            <p className="font-mono break-all">{transaction.hash}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">From</p>
              <p className="font-mono break-all">{transaction.sender}</p>
            </div>
            <div>
              <p className="text-gray-400">To</p>
              <p className="font-mono break-all">{transaction.recipient}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Amount</p>
              <p className="text-xl font-bold">{transaction.amount} NEXUS</p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <span className="px-2 py-1 text-sm rounded-full bg-yellow-500/20 text-yellow-300">
                {transaction.status}
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-gray-400">Timestamp</p>
            <p>{format(new Date(transaction.timestamp * 1000), 'PPpp')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal; 