import { useState, useEffect } from 'react';
import { wsService } from '../../services/websocket';
import { formatDistanceToNow } from 'date-fns';

const BlockExplorer = () => {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBlocks: 0,
    averageBlockTime: 0,
    currentDifficulty: 0,
    activeValidators: new Set()
  });

  useEffect(() => {
    const unsubscribe = wsService.subscribe('BLOCKCHAIN_UPDATE', (data) => {
      console.log('Received blockchain update:', data);
      setBlocks(data.blocks || []);
      
      // Calculate stats from blocks
      const validators = new Set(data.blocks.map(block => block.validator));
      setStats({
        totalBlocks: data.totalBlocks,
        averageBlockTime: calculateAverageBlockTime(data.blocks),
        currentDifficulty: calculateDifficulty(data.blocks[0]?.hash || ''),
        activeValidators: validators
      });
      setIsLoading(false);
    });

    wsService.sendMessage({ type: 'GET_BLOCKCHAIN_DATA' });
    return () => unsubscribe();
  }, []);

  const calculateDifficulty = (hash) => {
    let zeros = 0;
    for (let char of hash) {
      if (char === '0') zeros++;
      else break;
    }
    return zeros;
  };

  const calculateAverageBlockTime = (blocks) => {
    if (blocks.length < 2) return 0;
    const times = blocks.slice(0, -1).map((block, i) => 
      blocks[i + 1].timestamp - block.timestamp
    );
    return times.reduce((a, b) => a + b, 0) / times.length;
  };

  const BlockCard = ({ block, onClick }) => (
    <div 
      className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
      onClick={() => onClick(block)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold">Block #{block.index}</h3>
          <p className="text-sm text-gray-400">
            {formatDistanceToNow(new Date(block.timestamp * 1000), { addSuffix: true })}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs mb-2">
            {block.transactions.length} txns
          </span>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
            Nonce: {block.nonce}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Hash</p>
          <p className="font-mono truncate">{block.hash}</p>
        </div>
        <div>
          <p className="text-gray-400">Previous Hash</p>
          <p className="font-mono truncate">{block.previous_hash}</p>
        </div>
        <div>
          <p className="text-gray-400">Validator</p>
          <p className="font-mono truncate">{block.validator || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-gray-400">Difficulty</p>
          <p>{calculateDifficulty(block.hash)}</p>
        </div>
      </div>
    </div>
  );

  const BlockDetails = ({ block, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Block #{block.index} Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-gray-400">Hash</p>
            <p className="font-mono break-all">{block.hash}</p>
          </div>
          <div>
            <p className="text-gray-400">Previous Hash</p>
            <p className="font-mono break-all">{block.previous_hash}</p>
          </div>
          <div>
            <p className="text-gray-400">Timestamp</p>
            <p>{new Date(block.timestamp * 1000).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400">Nonce</p>
            <p>{block.nonce}</p>
          </div>
          <div>
            <p className="text-gray-400">Validator</p>
            <p className="font-mono">{block.validator || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-gray-400">Block Size</p>
            <p>{(JSON.stringify(block).length / 1024).toFixed(2)} KB</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4">Transactions ({block.transactions.length})</h3>
          <div className="space-y-2">
            {block.transactions.map((tx) => (
              <div key={tx.hash} className="bg-gray-700 p-3 rounded">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">From</p>
                    <p className="font-mono text-sm truncate">{tx.sender}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">To</p>
                    <p className="font-mono text-sm truncate">{tx.recipient}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Amount</p>
                    <p className="text-sm">{tx.amount} NEXUS</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Hash</p>
                    <p className="font-mono text-sm truncate">{tx.hash}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Network Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-400">Total Blocks</p>
          <p className="text-2xl font-bold">{stats.totalBlocks}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-400">Average Block Time</p>
          <p className="text-2xl font-bold">{stats.averageBlockTime.toFixed(2)}s</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-400">Current Difficulty</p>
          <p className="text-2xl font-bold">{stats.currentDifficulty}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-400">Active Validators</p>
          <p className="text-2xl font-bold">{stats.activeValidators.size}</p>
        </div>
      </div>

      {/* Blocks List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading blocks...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map(block => (
            <BlockCard 
              key={block.hash} 
              block={block} 
              onClick={setSelectedBlock}
            />
          ))}
        </div>
      )}

      {/* Block Details Modal */}
      {selectedBlock && (
        <BlockDetails 
          block={selectedBlock} 
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  );
};

export default BlockExplorer; 