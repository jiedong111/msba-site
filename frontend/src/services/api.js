import axios from 'axios';

const API_BASE_URL = ''; // Use Vite proxy - CORS blocks direct connection

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadCSV = async (file, modelName = 'model') => {
  console.log('🚀 Starting CSV upload:', { fileName: file.name, fileSize: file.size, modelName });
  console.log('🌐 API Base URL:', API_BASE_URL);
  console.log('📍 Full URL will be:', `${API_BASE_URL}/api/analyze-csv?model_name=${modelName}`);
  
  const formData = new FormData();
  formData.append('file', file);
  console.log('📦 FormData created with file:', formData);
  console.log('📋 File object details:', { 
    name: file.name, 
    size: file.size, 
    type: file.type,
    lastModified: file.lastModified 
  });
  console.log('📋 FormData entries:');
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value);
  }
  
  try {
    console.log('🔄 Making POST request...');
    const response = await api.post(`/api/analyze-csv?model_name=${modelName}`, formData, {
      transformRequest: [function (data, headers) {
        // Delete the Content-Type header so axios sets it with boundary
        delete headers['Content-Type'];
        return data;
      }],
    });
    
    console.log('✅ CSV upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ CSV upload failed:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers
      },
      code: error.code
    });
    
    // Log the error details for 422 specifically
    if (error.response?.status === 422) {
      console.error('🚨 422 VALIDATION ERROR:', error.response.data);
      console.error('📋 Detailed validation errors:', error.response.data.detail);
      console.error('📋 This usually means the request format is wrong');
    }
    
    // Check if it's a network error
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.error('🚨 NETWORK ERROR: Frontend cannot reach backend!');
      console.error('🔍 Check if backend is running on http://localhost:8000');
      console.error('🔍 Check if frontend is trying to connect to the right URL');
    }
    
    throw error;
  }
};

export const analyzeSentiment = async (companyName) => {
  const response = await api.post('/api/sentiment-analysis', {
    company_name: companyName,
  });
  
  return response.data;
};

// Test backend connectivity
export const testConnection = async () => {
  try {
    console.log('🔍 Testing backend connection...');
    console.log('🌐 Testing proxy with URL:', '/api/health');
    const response = await api.get('/api/health');
    console.log('✅ Backend connection successful:', response.data); 
    return response.data;
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    throw error;
  }
};

// Test proxy directly with fetch
export const testProxy = async () => {
  try {
    console.log('🔍 Testing Vite proxy directly...');
    const response = await fetch('/api/health');
    const data = await response.json();
    console.log('✅ Proxy test successful:', data);
    return data;
  } catch (error) {
    console.error('❌ Proxy test failed:', error.message);
    throw error;
  }
};

// Get available models
export const getModels = async () => {
  try {
    console.log('🔍 Fetching available models...');
    const response = await api.get('/api/models');
    console.log('✅ Models fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch models:', error.message);
    throw error;
  }
};

export default api;