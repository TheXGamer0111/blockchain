export const generateNetworkActivity = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    data.push({
      timestamp: new Date(now - i * 3600000).toLocaleTimeString(),
      transactions: Math.floor(Math.random() * 100) + 20
    });
  }
  
  return data.reverse();
};

export const generateBlockProduction = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    data.push({
      time: new Date(now - i * 1800000).toLocaleTimeString(),
      blocks: Math.floor(Math.random() * 10) + 1
    });
  }
  
  return data.reverse();
}; 