import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

function NFTGallery() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { address } = useSelector((state) => state.wallet);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address) return;

      try {
        // This is a mock implementation. In production, you'd want to use
        // an API like Alchemy, Moralis, or OpenSea to fetch real NFT data
        const mockNFTs = [
          {
            id: 1,
            name: 'Cool NFT #1',
            image: 'https://via.placeholder.com/150',
            collection: 'Cool Collection',
          },
          // Add more mock NFTs as needed
        ];

        setNfts(mockNFTs);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [address]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-700 rounded-lg aspect-square"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-medium text-white mb-4">NFT Collection</h2>
      {nfts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {nfts.map((nft) => (
            <div key={nft.id} className="bg-gray-700 rounded-lg p-2">
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full aspect-square object-cover rounded-lg"
              />
              <div className="mt-2">
                <h3 className="text-white font-medium">{nft.name}</h3>
                <p className="text-gray-400 text-sm">{nft.collection}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center">No NFTs found</p>
      )}
    </div>
  );
}

export default NFTGallery; 