// frontend/src/context/AirportContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AirportContext = createContext();

export const useAirports = () => useContext(AirportContext);

export const AirportProvider = ({ children }) => {
    const [airports, setAirports] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAirportDetails = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setIsLoading(false);
                return;
            }
            const config = { headers: { "x-auth-token": token } };
            
            try {
                console.log("LOG: [AirportContext] Fetching airport details map from backend...");
                const response = await axios.get(`${API_URL}/api/airports/details`, config);
                setAirports(response.data);
            } catch (error) {
                console.error("Failed to fetch airport details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAirportDetails();
    }, []);

    const value = { airports, isLoading };

    return (
        <AirportContext.Provider value={value}>
            {children}
        </AirportContext.Provider>
    );
};