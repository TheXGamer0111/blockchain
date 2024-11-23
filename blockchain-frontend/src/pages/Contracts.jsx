import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { deployNewContract, callContractFunction, clearMessages } from '../store/contractsSlice'

export default function Contracts() {
  const dispatch = useDispatch()
  const { deployedContracts, lastResult, isLoading, error, success } = useSelector(
    (state) => state.contracts
  )
  const [deployForm, setDeployForm] = useState({
    code: '',
    constructorArgs: ''
  })
  const [callForm, setCallForm] = useState({
    address: '',
    functionName: '',
    args: ''
  })

  useEffect(() => {
    // Clear messages when component unmounts
    return () => dispatch(clearMessages())
  }, [dispatch])

  const handleDeploy = async (e) => {
    e.preventDefault()
    try {
      const args = JSON.parse(deployForm.constructorArgs || '{}')
      await dispatch(deployNewContract({
        code: deployForm.code,
        constructor_args: args
      })).unwrap()
      setDeployForm({ code: '', constructorArgs: '' })
    } catch (err) {
      console.error('Deploy failed:', err)
    }
  }

  const handleCall = async (e) => {
    e.preventDefault()
    try {
      const args = JSON.parse(callForm.args || '{}')
      await dispatch(callContractFunction({
        address: callForm.address,
        functionName: callForm.functionName,
        args
      })).unwrap()
    } catch (err) {
      console.error('Contract call failed:', err)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Smart Contracts</h1>

      {/* Deploy Contract */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Deploy New Contract</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}
        
        <form onSubmit={handleDeploy} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Contract Code</label>
            <textarea
              value={deployForm.code}
              onChange={(e) => setDeployForm(prev => ({ ...prev, code: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={10}
              placeholder="Paste your contract code here..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Constructor Arguments (JSON)</label>
            <input
              type="text"
              value={deployForm.constructorArgs}
              onChange={(e) => setDeployForm(prev => ({ ...prev, constructorArgs: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder='{"arg1": "value1", "arg2": "value2"}'
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isLoading ? 'Deploying...' : 'Deploy Contract'}
          </button>
        </form>
      </div>

      {/* Deployed Contracts */}
      {deployedContracts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Deployed Contracts</h2>
          <div className="space-y-2">
            {deployedContracts.map((contract) => (
              <div 
                key={contract.address}
                className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => setCallForm(prev => ({ ...prev, address: contract.address }))}
              >
                <p className="font-medium">Address: {contract.address}</p>
                <p className="text-sm text-gray-500">
                  Deployed: {new Date(contract.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interact with Contract */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Interact with Contract</h2>
        
        <form onSubmit={handleCall} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Contract Address</label>
            <input
              type="text"
              value={callForm.address}
              onChange={(e) => setCallForm(prev => ({ ...prev, address: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter contract address..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Function Name</label>
            <input
              type="text"
              value={callForm.functionName}
              onChange={(e) => setCallForm(prev => ({ ...prev, functionName: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter function name..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Function Arguments (JSON)</label>
            <input
              type="text"
              value={callForm.args}
              onChange={(e) => setCallForm(prev => ({ ...prev, args: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder='{"arg1": "value1", "arg2": "value2"}'
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isLoading ? 'Calling...' : 'Call Function'}
          </button>
        </form>

        {/* Function Result */}
        {lastResult !== null && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-700">Result:</h3>
            <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-x-auto">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 