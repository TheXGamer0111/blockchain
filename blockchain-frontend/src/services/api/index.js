export { default as api } from './config';
export { blockchainService } from './blockchainService';
export { stakingService } from './stakingService';
export { governanceService } from './governanceService';
export { walletService } from './walletService';

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      status: error.response.status,
      message: error.response.data.message || 'An error occurred',
      data: error.response.data
    };
  } else if (error.request) {
    // Request made but no response
    return {
      status: 503,
      message: 'Service unavailable',
      data: null
    };
  } else {
    // Error setting up request
    return {
      status: 500,
      message: error.message || 'An unexpected error occurred',
      data: null
    };
  }
}; 