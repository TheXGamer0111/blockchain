import { blockchainService } from '../services/blockchain';

const BlockExplorer = () => {
  const [blocks, setBlocks] = useState([]);
  
  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const data = await blockchainService.getBlocks(1, 10);
        setBlocks(data);
      } catch (error) {
        console.error('Failed to fetch blocks:', error);
      }
    };
    
    fetchBlocks();
  }, []);

  // Rest of your component
}; 