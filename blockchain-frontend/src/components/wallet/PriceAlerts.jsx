import { useState } from 'react';
import { toast } from 'react-toastify';

function PriceAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({
    token: 'ETH',
    price: '',
    condition: 'above'
  });

  const handleAddAlert = (e) => {
    e.preventDefault();
    if (!newAlert.price) return;

    setAlerts([...alerts, { ...newAlert, id: Date.now() }]);
    setNewAlert({ ...newAlert, price: '' });
    toast.success('Price alert added successfully!');
  };

  const handleRemoveAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
    toast.info('Price alert removed');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-medium text-white mb-4">Price Alerts</h2>
      
      <form onSubmit={handleAddAlert} className="mb-4">
        <div className="flex space-x-2">
          <select
            value={newAlert.token}
            onChange={(e) => setNewAlert({ ...newAlert, token: e.target.value })}
            className="bg-gray-700 text-white rounded-lg px-3 py-2"
          >
            <option value="ETH">ETH</option>
            <option value="BTC">BTC</option>
            <option value="MATIC">MATIC</option>
          </select>
          
          <select
            value={newAlert.condition}
            onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
            className="bg-gray-700 text-white rounded-lg px-3 py-2"
          >
            <option value="above">Above</option>
            <option value="below">Below</option>
          </select>
          
          <input
            type="number"
            value={newAlert.price}
            onChange={(e) => setNewAlert({ ...newAlert, price: e.target.value })}
            placeholder="Price"
            className="bg-gray-700 text-white rounded-lg px-3 py-2 flex-1"
          />
          
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Add Alert
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
          >
            <div className="flex items-center space-x-2">
              <span className="text-white">{alert.token}</span>
              <span className="text-gray-400">{alert.condition}</span>
              <span className="text-white">${alert.price}</span>
            </div>
            <button
              onClick={() => handleRemoveAlert(alert.id)}
              className="text-red-400 hover:text-red-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PriceAlerts; 