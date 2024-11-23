// New component: blockchain-frontend/src/components/transactions/MultiSigTransaction.jsx
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createMultiSigWallet, proposeTransaction } from '../../store/multiSigSlice'

export default function MultiSigTransaction() {
  const dispatch = useDispatch()
  const { wallets, pendingTransactions, isLoading, error } = useSelector(state => state.multiSig)
  
  const [createForm, setCreateForm] = useState({
    owners: [''],
    requiredSignatures: 1
  })

  const [transactionForm, setTransactionForm] = useState({
    walletAddress: '',
    recipient: '',
    amount: '',
    data: ''
  })

  const handleAddOwner = () => {
    setCreateForm(prev => ({
      ...prev,
      owners: [...prev.owners, '']
    }))
  }

  const handleRemoveOwner = (index) => {
    setCreateForm(prev => ({
      ...prev,
      owners: prev.owners.filter((_, i) => i !== index)
    }))
  }

  const handleCreateWallet = async (e) => {
    e.preventDefault()
    try {
      await dispatch(createMultiSigWallet({
        owners: createForm.owners.filter(owner => owner !== ''),
        requiredSignatures: parseInt(createForm.requiredSignatures)
      })).unwrap()
      setCreateForm({ owners: [''], requiredSignatures: 1 })
    } catch (err) {
      console.error('Failed to create multi-sig wallet:', err)
    }
  }

  const handleProposeTransaction = async (e) => {
    e.preventDefault()
    try {
      await dispatch(proposeTransaction({
        walletAddress: transactionForm.walletAddress,
        transaction: {
          recipient: transactionForm.recipient,
          amount: transactionForm.amount,
          data: transactionForm.data
        }
      })).unwrap()
      setTransactionForm({
        walletAddress: '',
        recipient: '',
        amount: '',
        data: ''
      })
    } catch (err) {
      console.error('Failed to propose transaction:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Multi-Sig Wallet */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Create Multi-Signature Wallet</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        <form onSubmit={handleCreateWallet} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Owners</label>
            {createForm.owners.map((owner, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => {
                    const newOwners = [...createForm.owners]
                    newOwners[index] = e.target.value
                    setCreateForm(prev => ({ ...prev, owners: newOwners }))
                  }}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Owner Address"
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOwner(index)}
                    className="px-2 py-1 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddOwner}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              + Add Owner
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Required Signatures</label>
            <input
              type="number"
              value={createForm.requiredSignatures}
              onChange={(e) => setCreateForm(prev => ({ ...prev, requiredSignatures: e.target.value }))}
              min="1"
              max={createForm.owners.length}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isLoading ? 'Creating...' : 'Create Wallet'}
          </button>
        </form>
      </div>

      {/* Propose Transaction */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Propose Transaction</h2>
        
        <form onSubmit={handleProposeTransaction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Wallet Address</label>
            <select
              value={transactionForm.walletAddress}
              onChange={(e) => setTransactionForm(prev => ({ ...prev, walletAddress: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Wallet</option>
              {wallets.map(wallet => (
                <option key={wallet.address} value={wallet.address}>
                  {wallet.address}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Recipient</label>
            <input
              type="text"
              value={transactionForm.recipient}
              onChange={(e) => setTransactionForm(prev => ({ ...prev, recipient: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={transactionForm.amount}
              onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Data (optional)</label>
            <textarea
              value={transactionForm.data}
              onChange={(e) => setTransactionForm(prev => ({ ...prev, data: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isLoading ? 'Proposing...' : 'Propose Transaction'}
          </button>
        </form>
      </div>

      {/* Pending Transactions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Pending Transactions</h2>
        <div className="space-y-4">
          {pendingTransactions.map(tx => (
            <div key={tx.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">To: {tx.recipient}</p>
                  <p className="text-sm text-gray-500">Amount: {tx.amount}</p>
                  <p className="text-sm text-gray-500">
                    Signatures: {tx.signatures.length}/{tx.requiredSignatures}
                  </p>
                </div>
                <button
                  onClick={() => {/* Handle sign transaction */}}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Sign
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}