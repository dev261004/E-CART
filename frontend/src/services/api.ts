// File: src/services/api.ts
import axios from 'axios';
import { setupInterceptors } from "./interceptors";
const baseURL = "http://localhost:4000";

const api = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
});

setupInterceptors(api);

export default api