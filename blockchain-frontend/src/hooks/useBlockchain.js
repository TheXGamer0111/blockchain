import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchNetworkStats, 
  fetchRecentBlocks 
} from '../store/slices/blockchainSlice';
import { 
  connectWallet, 
  fetchBalance 
} from '../store/slices/walletSlice';

export function useBlockchain() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const wallet = useSelector((state) => state.wallet);

  const refreshData = async () => {
    await Promise.all([
      dispatch(fetchNetworkStats()),
      dispatch(fetchRecentBlocks()),
      wallet.isConnected && dispatch(fetchBalance(wallet.address))
    ]);
  };

  return {
    ...blockchain,
    ...wallet,
    refreshData,
    connectWallet: () => dispatch(connectWallet()),
    fetchBalance: () => dispatch(fetchBalance(wallet.address))
  };
} 