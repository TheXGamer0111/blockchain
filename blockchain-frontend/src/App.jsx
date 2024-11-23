import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Wallet from './pages/Wallet'
import Explorer from './pages/Explorer'
import Network from './pages/Network'
import Contracts from './pages/Contracts'

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/network" element={<Network />} />
            <Route path="/contracts" element={<Contracts />} />
          </Routes>
        </Layout>
      </Router>
    </Provider>
  )
}

export default App 