import { trackApiCall } from './logger';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4455/api';

// Helper for making API requests with tracing
const apiRequest = async (endpoint, method = 'GET', data = null, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  // Add body if data is present
  if (data) {
    requestOptions.body = JSON.stringify(data);
  }
  
  // Use trackApiCall to trace the fetch request
  return trackApiCall(url, method, requestOptions, async (opts) => {
    const response = await fetch(url, opts);
    
    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'API request failed');
    }
    
    return response.json();
  });
};

// Convenience methods for common HTTP methods
const get = (endpoint, options = {}) => apiRequest(endpoint, 'GET', null, options);
const post = (endpoint, data, options = {}) => apiRequest(endpoint, 'POST', data, options);
const put = (endpoint, data, options = {}) => apiRequest(endpoint, 'PUT', data, options);
const patch = (endpoint, data, options = {}) => apiRequest(endpoint, 'PATCH', data, options);
const del = (endpoint, options = {}) => apiRequest(endpoint, 'DELETE', null, options);

export default {
  get,
  post,
  put,
  patch,
  delete: del
}; 