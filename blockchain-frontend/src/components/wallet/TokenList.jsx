import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadTokenBalances } from '../../store/slices/walletSlice';

function TokenList() {
  const dispatch = useDispatch();
  const { tokens, loadingTokens, address } = useSelector((state) => state.wallet);

  useEffect(() => {
    if (address) {
      dispatch(loadTokenBalances(address));
    }
  }, [dispatch, address]);

  if (loadingTokens) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Token Balances</h2>
      <div className="grid gap-4">
        {Object.entries(tokens).map(([tokenAddress, token]) => (
          <div
            key={tokenAddress}
            className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <h3 className="text-white font-medium">{token.symbol}</h3>
              <p className="text-gray-400 text-sm">{token.name}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">
                {parseFloat(token.balance).toFixed(4)}
              </p>
              <button
                onClick={() => {/* Open transfer modal */}}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                Transfer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TokenList; 