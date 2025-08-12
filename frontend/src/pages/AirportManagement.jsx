// frontend/src/pages/AirportManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import Header from "../components/Header";
import { useDebounce } from "../components/useDebounce";
import { FaPlus, FaTrash, FaPlane, FaCheckCircle, FaSearch } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AirportManagement = () => {
  const { toggleSidebar, theme, toggleTheme } = useOutletContext();
  const [monitoredAirports, setMonitoredAirports] = useState([]);
  const [availableAirports, setAvailableAirports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({ query: "", country: "All" });
  const debouncedQuery = useDebounce(filters.query, 300);

  const token = localStorage.getItem("token");
  const config = { headers: { "x-auth-token": token } };

  const fetchAirports = useCallback(async () => {
    setIsLoading(true);
    try {
      const [monitoredRes, availableRes] = await Promise.all([
        axios.get(`${API_URL}/api/airports`, config),
        axios.get(`${API_URL}/api/airports/available`, config),
      ]);
      setMonitoredAirports(monitoredRes.data);
      setAvailableAirports(availableRes.data);
    } catch (err) {
      console.error("Failed to fetch airports", err);
      setError("Could not load airport data. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAirports();
  }, [fetchAirports]);

  const handleAddAirport = async (icao) => {
    try {
      await axios.post(`${API_URL}/api/airports`, { icao }, config);
      fetchAirports(); // Refresh both lists to update status
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to add airport.");
    }
  };

  const handleDeleteAirport = async (id) => {
    if (window.confirm("Are you sure you want to stop monitoring this airport?")) {
      try {
        await axios.delete(`${API_URL}/api/airports/${id}`, config);
        fetchAirports(); // Refresh both lists
      } catch (err) {
        alert("Could not delete airport. Please try again.");
      }
    }
  };

  const countryOptions = useMemo(() => {
    const countries = new Set(availableAirports.map(a => a.country));
    return ["All", ...Array.from(countries).sort()];
  }, [availableAirports]);

  const filteredAvailableAirports = useMemo(() => {
    return availableAirports.filter(airport => {
      const queryMatch = debouncedQuery.length === 0 ||
        airport.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        airport.icao.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        airport.iata.toLowerCase().includes(debouncedQuery.toLowerCase());
      
      const countryMatch = filters.country === "All" || airport.country === filters.country;

      return queryMatch && countryMatch;
    });
  }, [availableAirports, debouncedQuery, filters.country]);

  const monitoredIcaoSet = useMemo(() => new Set(monitoredAirports.map(a => a.icao)), [monitoredAirports]);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <Header
        title="Airport Monitoring"
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Monitored Airports Section */}
      <div className="bg-secondary rounded-lg shadow-sm border border-border-color">
        <div className="p-6 border-b border-border-color">
          <h3 className="text-lg font-semibold text-text-primary">Currently Monitored Airports</h3>
          <p className="mt-1 text-sm text-text-secondary">Flights from these airports are actively being tracked.</p>
        </div>
        <div className="p-6">
          {isLoading ? <p>Loading...</p> : (
            monitoredAirports.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {monitoredAirports.map(airport => (
                  <div key={airport._id} className="flex items-center gap-3 bg-primary p-3 rounded-lg border border-border-color">
                    <FaPlane className="text-accent"/>
                    <div>
                      <p className="font-semibold text-text-primary">{airport.name}</p>
                      <p className="text-xs text-text-secondary font-mono">{airport.icao} / {airport.iata}</p>
                    </div>
                    <button onClick={() => handleDeleteAirport(airport._id)} className="ml-2 text-text-secondary hover:text-red-500 transition-colors">
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            ) : <p className="text-text-secondary">No airports are being monitored. Add one from the explorer below.</p>
          )}
        </div>
      </div>

      {/* Airport Explorer Section */}
      <div className="bg-secondary rounded-lg shadow-sm border border-border-color">
        <div className="p-6 border-b border-border-color">
          <h3 className="text-lg font-semibold text-text-primary">Airport Explorer</h3>
          <p className="mt-1 text-sm text-text-secondary">Find and add European airports to your monitoring list.</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 p-4 border-b border-border-color">
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search by name, ICAO, or IATA..."
              value={filters.query}
              onChange={e => setFilters(prev => ({...prev, query: e.target.value}))}
              className="w-full pl-10 pr-4 py-2 bg-primary border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:outline-none"
            />
          </div>
          <select 
            value={filters.country}
            onChange={e => setFilters(prev => ({...prev, country: e.target.value}))}
            className="w-full md:w-auto px-3 py-2 bg-primary border border-border-color rounded-md text-text-secondary focus:ring-2 focus:ring-accent focus:outline-none"
          >
            {countryOptions.map(country => <option key={country} value={country}>{country}</option>)}
          </select>
        </div>

        {/* Airport List Table */}
        <div className="overflow-x-auto">
          {isLoading ? (<p className="p-6 text-text-secondary">Loading airport list...</p>) : (
            <table className="w-full text-sm">
              <thead className="bg-primary">
                <tr>
                  <th className="p-3 text-left font-semibold text-text-secondary">Airport Name</th>
                  <th className="p-3 text-left font-semibold text-text-secondary">Country</th>
                  <th className="p-3 text-left font-semibold text-text-secondary">Codes</th>
                  <th className="p-3 text-center font-semibold text-text-secondary">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {filteredAvailableAirports.slice(0, 100).map(airport => { // Limit to 100 results for performance
                  const isMonitored = monitoredIcaoSet.has(airport.icao);
                  return (
                    <tr key={airport.icao}>
                      <td className="p-3 text-text-primary font-medium">{airport.name}</td>
                      <td className="p-3 text-text-secondary">{airport.country}</td>
                      <td className="p-3 font-mono text-text-secondary">{airport.icao} / {airport.iata}</td>
                      <td className="p-3 text-center">
                        {isMonitored ? (
                          <span className="flex items-center justify-center gap-2 text-green-500 font-semibold">
                            <FaCheckCircle /> Monitored
                          </span>
                        ) : (
                          <button onClick={() => handleAddAirport(airport.icao)} className="px-3 py-1 bg-accent text-white font-semibold text-xs rounded-md hover:bg-opacity-90 transition flex items-center gap-1.5">
                            <FaPlus /> Add
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {filteredAvailableAirports.length === 0 && !isLoading && 
            <p className="p-6 text-center text-text-secondary">No airports match your criteria.</p>
          }
        </div>
      </div>
    </div>
  );
};

export default AirportManagement;