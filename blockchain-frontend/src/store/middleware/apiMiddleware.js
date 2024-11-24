import api from '../../services/api';

export const apiMiddleware = () => (next) => async (action) => {
  if (!action.meta?.api) return next(action);

  const { url, method = 'GET', data } = action.meta.api;
  
  try {
    const response = await api[method.toLowerCase()](url, data);
    return next({ ...action, payload: response.data });
  } catch (error) {
    return next({ ...action, error: error.message, type: `${action.type}_ERROR` });
  }
}; 