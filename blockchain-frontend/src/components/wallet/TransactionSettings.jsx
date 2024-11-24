import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

function TransactionSettings() {
  const dispatch = useDispatch();
  const [settings, setSettings] = useState({
    gasPrice: 'auto',
    customGasPrice: '',
    customGasLimit: '',
    nonce: 'auto',
    customNonce: '',
    defaultSlippage: '0.5',
    customSlippage: '',
  });

  const handleSave = () => {
    // In a real app, you'd dispatch these settings to your store
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Transaction Settings</h2>
      
      <div className="space-y-6">
        {/* Gas Price Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Gas Price
          </label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="autoGas"
                value="auto"
                checked={settings.gasPrice === 'auto'}
                onChange={(e) => setSettings({ ...settings, gasPrice: e.target.value })}
                className="text-indigo-600"
              />
              <label htmlFor="autoGas" className="text-white">Automatic</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="customGas"
                value="custom"
                checked={settings.gasPrice === 'custom'}
                onChange={(e) => setSettings({ ...settings, gasPrice: e.target.value })}
                className="text-indigo-600"
              />
              <label htmlFor="customGas" className="text-white">Custom</label>
              {settings.gasPrice === 'custom' && (
                <input
                  type="number"
                  value={settings.customGasPrice}
                  onChange={(e) => setSettings({ ...settings, customGasPrice: e.target.value })}
                  placeholder="Gas Price (Gwei)"
                  className="ml-2 bg-gray-700 text-white rounded px-2 py-1"
                />
              )}
            </div>
          </div>
        </div>

        {/* Gas Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Gas Limit
          </label>
          <input
            type="number"
            value={settings.customGasLimit}
            onChange={(e) => setSettings({ ...settings, customGasLimit: e.target.value })}
            placeholder="Custom Gas Limit"
            className="w-full bg-gray-700 text-white rounded px-3 py-2"
          />
        </div>

        {/* Nonce Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Nonce
          </label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="autoNonce"
                value="auto"
                checked={settings.nonce === 'auto'}
                onChange={(e) => setSettings({ ...settings, nonce: e.target.value })}
                className="text-indigo-600"
              />
              <label htmlFor="autoNonce" className="text-white">Automatic</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="customNonce"
                value="custom"
                checked={settings.nonce === 'custom'}
                onChange={(e) => setSettings({ ...settings, nonce: e.target.value })}
                className="text-indigo-600"
              />
              <label htmlFor="customNonce" className="text-white">Custom</label>
              {settings.nonce === 'custom' && (
                <input
                  type="number"
                  value={settings.customNonce}
                  onChange={(e) => setSettings({ ...settings, customNonce: e.target.value })}
                  placeholder="Custom Nonce"
                  className="ml-2 bg-gray-700 text-white rounded px-2 py-1"
                />
              )}
            </div>
          </div>
        </div>

        {/* Default Slippage */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Default Slippage Tolerance
          </label>
          <select
            value={settings.defaultSlippage}
            onChange={(e) => setSettings({ ...settings, defaultSlippage: e.target.value })}
            className="w-full bg-gray-700 text-white rounded px-3 py-2"
          >
            <option value="0.1">0.1%</option>
            <option value="0.5">0.5%</option>
            <option value="1.0">1.0%</option>
            <option value="custom">Custom</option>
          </select>
          {settings.defaultSlippage === 'custom' && (
            <input
              type="number"
              value={settings.customSlippage}
              onChange={(e) => setSettings({ ...settings, customSlippage: e.target.value })}
              placeholder="Custom Slippage %"
              className="mt-2 w-full bg-gray-700 text-white rounded px-3 py-2"
            />
          )}
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}

export default TransactionSettings; 