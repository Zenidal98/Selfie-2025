import axios from "axios";


const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Aggancia automaticamente il token alle richieste protette
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token"); // già sessionStorage nel login
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;


// interceptor che serve ad aggiungere il token nelle richieste e quindi a far si che poi in backend si divida fra gli utenti