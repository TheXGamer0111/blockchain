import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProposal } from '../../store/slices/governanceSlice';

function CreateProposal() {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.governance);
  const { isConnected } = useSelector((state) => state.wallet);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('7');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await dispatch(createProposal({
        title,
        description,
        duration: parseInt(duration)
      })).unwrap();
      
      // Reset form
      setTitle('');
      setDescription('');
      setDuration('7');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Create New Proposal</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter proposal title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Describe your proposal"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Voting Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="3">3 Days</option>
            <option value="7">7 Days</option>
            <option value="14">14 Days</option>
            <option value="30">30 Days</option>
          </select>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !isConnected}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {loading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3.148 7.751C5.818 21.796 7.969 24 10.5 24h4c2.53 0 4.681-2.203 4.937-5.291a12.025 12.025 0 00-4.398-5.775 11.955 11.955 0 00-3.499-2.053 11.916 11.916 0 00-3.598-1.907zM12 16a4 4 0 100 8 4 4 0 000-8z"></path>
            </svg>
          ) : (
            'Create Proposal'
          )}
        </button>
      </form>
    </div>
  )
}

export default CreateProposal
