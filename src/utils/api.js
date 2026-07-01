import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gobble_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we're already refreshing, queue the request
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('http://localhost:3001/api/auth/refresh', {}, { withCredentials: true });
        const newToken = data.token;
        
        localStorage.setItem('gobble_token', newToken);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        
        processQueue(null, newToken);
        originalRequest.headers.Authorization = 'Bearer ' + newToken;
        
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('gobble_token');
        localStorage.removeItem('gobble_user');
        window.location.href = '/auth'; // Redirect to auth
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
