import { useEffect, useState } from 'react';
import { wsService } from '../../services/websocket';

const BlockchainStatus = () => {
  const [blockchainState, setBlockchainState] = useState(null);

  useEffect(() => {
    const unsubscribe = wsService.subscribe('BLOCKCHAIN_STATE', (data) => {
      // Only update state if data has changed
      // console.log('Received blockchain state:', data);
      setBlockchainState(prevState => {
        if (!prevState || JSON.stringify(prevState) !== JSON.stringify(data)) {
          console.log('Blockchain state updated:', data);
          return data;
        }
        return prevState;
      });
    });

    return () => unsubscribe();
  }, []);

  if (!blockchainState) {
    return <div>Loading blockchain status...</div>;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl text-white font-bold mb-4">Blockchain Status</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-400">Chain Length</p>
          <p className="text-xl text-white font-semibold">{blockchainState.chainLength}</p>
        </div>
        <div>
          <p className="text-gray-400">Mempool Size</p>
          <p className="text-xl text-white font-semibold">{blockchainState.mempool ? blockchainState.mempool : 0}</p>
        </div>
        <div>
          <p className="text-gray-400">Difficulty</p>
          <p className="text-xl text-white font-semibold">{blockchainState.difficulty}</p>
        </div>
        <div>
          <p className="text-gray-400">Mining Status</p>
          <p className="text-xl text-white font-semibold">{blockchainState.isMining ? 'Mining' : 'Idle'}</p>
        </div>
      </div>
    </div>
  );
};

export default BlockchainStatus; 