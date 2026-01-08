import axios from 'axios';

export const $axios = axios.create({
  timeout: 5000,
});

$axios.interceptors.request.use(
  config => {
    if (!config['metadata']) {
      config['metadata'] = {};
    }

    config['metadata'].startTime = Date.now();

    return config;
  },
  error => {},
);

$axios.interceptors.response.use(
  response => {
    const res = response;
    const req = response.request;
    const cfg = response.config;

    if (cfg.responseType !== 'json') {
      return response;
    }

    const duration = Date.now() - res.config['metadata'].startTime;

    return response;
  },
  error => {
    const req = error.config;
    const res = error.response;
    return res;
  },
);
