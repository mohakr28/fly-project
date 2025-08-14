// frontend/src/pages/AirportManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import Header from "../components/Header";
import { useDebounce } from "../components/useDebounce";
import { FaPlus, FaTrash, FaPlane, FaCheckCircle, FaSearch } from "react-icons/fa";
import SearchableSelect from "../components/SearchableSelect";
import PaginationControls from "../components/PaginationControls";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AirportManagement = () => {
  const { toggleSidebar, theme, toggleTheme } = useOutletContext();
  const [monitoredAirports, setMonitoredAirports] = useState([]);
  const [availableAirports, setAvailableAirports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExplorerLoading, setIsExplorerLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [countryOptions, setCountryOptions] = useState(["All"]);
  const [filters, setFilters] = useState({ query: "", country: "All" });
  const debouncedQuery = useDebounce(filters.query, 400);

  const token = localStorage.getItem("token");
  const config = { headers: { "x-auth-token": token } };

  const fetchMonitoredAirports = useCallback(async () => {
    setIsLoading(true);
    try {
      const monitoredRes = await axios.get(`${API_URL}/api/airports`, config);
      setMonitoredAirports(monitoredRes.data);
    } catch (err) {
      console.error("Failed to fetch monitored airports", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAvailableAirports = useCallback(async (page = 1, currentFilters) => {
    setIsExplorerLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
        query: currentFilters.query,
        country: currentFilters.country,
      });
      const res = await axios.get(`${API_URL}/api/airports/available?${params.toString()}`, config);
      setAvailableAirports(res.data.airports);
      setPagination({
        currentPage: res.data.currentPage,
        totalPages: res.data.totalPages,
      });
    } catch (err) {
      console.error("Failed to fetch available airports", err);
    } finally {
      setIsExplorerLoading(false);
    }
  }, []);
  
  useEffect(() => {
    const fetchCountries = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/airports/countries`, config);
            setCountryOptions(["All", ...res.data]);
        } catch (error) {
            console.error("Failed to fetch country list", error);
        }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    fetchMonitoredAirports();
  }, [fetchMonitoredAirports]);
  
  useEffect(() => {
    const currentFilters = { query: debouncedQuery, country: filters.country };
    fetchAvailableAirports(1, currentFilters);
  }, [debouncedQuery, filters.country, fetchAvailableAirports]);

  const handleAddAirport = async (icao) => {
    try {
      await axios.post(`${API_URL}/api/airports`, { icao }, config);
      fetchMonitoredAirports();
    } catch (err) {
      console.error("Failed to add airport.", err);
      // Replace alert with a better notification system in the future
      alert(err.response?.data?.msg || "An error occurred while adding the airport.");
    }
  };

  const handleDeleteAirport = async (id) => {
    if (window.confirm("Are you sure you want to stop monitoring this airport?")) {
      try {
        await axios.delete(`${API_URL}/api/airports/${id}`, config);
        fetchMonitoredAirports();
      } catch (err) {
        console.error("Could not delete airport.", err);
        alert("An error occurred while deleting the airport.");
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
        const currentFilters = { query: debouncedQuery, country: filters.country };
        fetchAvailableAirports(newPage, currentFilters);
    }
  };

  const monitoredIcaoSet = useMemo(() => new Set(monitoredAirports.map(a => a.icao)), [monitoredAirports]);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <Header
        title="Airport Monitoring"
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
      />

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
                    <button onClick={() => handleDeleteAirport(airport._id)} className="ml-2 text-text-secondary hover:text-red-500 transition-colors"> <FaTrash /> </button>
                  </div>
                ))}
              </div>
            ) : <p className="text-text-secondary">No airports are being monitored. Add one from the explorer below.</p>
          )}
        </div>
      </div>

      <div className="bg-secondary rounded-lg shadow-sm border border-border-color">
        <div className="p-6 border-b border-border-color">
          <h3 className="text-lg font-semibold text-text-primary">Airport Explorer</h3>
          <p className="mt-1 text-sm text-text-secondary">Find and add airports to your monitoring list.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 p-4 border-b border-border-color">
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input type="text" placeholder="Search by name, ICAO, or IATA..." value={filters.query}
              onChange={e => setFilters(prev => ({...prev, query: e.target.value}))}
              className="w-full pl-10 pr-4 py-2 bg-primary border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:outline-none"
            />
          </div>
          <SearchableSelect
            options={countryOptions}
            value={filters.country}
            onChange={(country) => setFilters(prev => ({ ...prev, country }))}
            placeholder="Filter by country..."
          />
        </div>

        <div className="overflow-x-auto">
          {isExplorerLoading ? (<p className="p-6 text-center text-text-secondary">Loading airports...</p>) : (
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
                {availableAirports.map(airport => {
                  const isMonitored = monitoredIcaoSet.has(airport.icao);
                  return (
                    <tr key={airport.icao}>
                      <td className="p-3 text-text-primary font-medium">{airport.name}</td>
                      <td className="p-3 text-text-secondary">{airport.country}</td>
                      <td className="p-3 font-mono text-text-secondary">{airport.icao} / {airport.iata}</td>
                      <td className="p-3 text-center">
                        {isMonitored ? (
                          <span className="flex items-center justify-center gap-2 text-green-500 font-semibold"> <FaCheckCircle /> Monitored </span>
                        ) : (
                          <button onClick={() => handleAddAirport(airport.icao)} className="px-3 py-1 bg-accent text-white font-semibold text-xs rounded-md hover:bg-opacity-90 transition flex items-center gap-1.5"> <FaPlus /> Add </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {availableAirports.length === 0 && !isExplorerLoading && 
            <p className="p-6 text-center text-text-secondary">No airports match your criteria.</p>
          }
        </div>
        <div className="p-4 border-t border-border-color">
            <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
            />
        </div>
      </div>
    </div>
  );
};

export default AirportManagement;