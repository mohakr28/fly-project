// frontend/src/pages/AirportManagement.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import Header from "../components/Header";
import { useDebounce } from "../components/useDebounce";
import { FaPlus, FaTrash, FaPlane, FaCheckCircle, FaSearch } from "react-icons/fa";
import SearchableSelect from "../components/SearchableSelect";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll"; // ✅ 1. استيراد الخطاف

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AirportManagement = () => {
  const { toggleSidebar, theme, toggleTheme } = useOutletContext();
  const [monitoredAirports, setMonitoredAirports] = useState([]);
  const [availableAirports, setAvailableAirports] = useState([]);
  const [isLoadingMonitored, setIsLoadingMonitored] = useState(true);
  const [isExplorerLoading, setIsExplorerLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [countryOptions, setCountryOptions] = useState(["All"]);
  const [filters, setFilters] = useState({ query: "", country: "All" });
  const debouncedQuery = useDebounce(filters.query, 400);

  const token = localStorage.getItem("token");
  const config = { headers: { "x-auth-token": token } };
  
  const loaderRef = useRef(null); // ✅ 2. Ref لعنصر التحميل

  const fetchMonitoredAirports = useCallback(async () => {
    setIsLoadingMonitored(true);
    try {
      const monitoredRes = await axios.get(`${API_URL}/api/airports`, config);
      setMonitoredAirports(monitoredRes.data);
    } catch (err) {
      console.error("Failed to fetch monitored airports", err);
    } finally {
      setIsLoadingMonitored(false);
    }
  }, []);

  const fetchAvailableAirports = useCallback(async (page = 1, currentFilters, isLoadMore = false) => {
    setIsExplorerLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 20, // 20 مطارًا في الصفحة
        query: currentFilters.query,
        country: currentFilters.country,
      });

      const res = await axios.get(`${API_URL}/api/airports/available?${params.toString()}`, config);
      
      if (isLoadMore) {
          setAvailableAirports(prev => [...prev, ...res.data.airports]);
      } else {
          setAvailableAirports(res.data.airports);
      }
      
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
    fetchMonitoredAirports();
  }, [fetchMonitoredAirports]);
  
  useEffect(() => {
    const currentFilters = { query: debouncedQuery, country: filters.country };
    fetchAvailableAirports(1, currentFilters, false);
  }, [debouncedQuery, filters.country, fetchAvailableAirports]);

  const hasNextPage = pagination.currentPage < pagination.totalPages;
  const loadMore = useCallback(() => {
      const currentFilters = { query: debouncedQuery, country: filters.country };
      fetchAvailableAirports(pagination.currentPage + 1, currentFilters, true);
  }, [pagination.currentPage, debouncedQuery, filters.country, fetchAvailableAirports]);

  useInfiniteScroll(loaderRef, isExplorerLoading, hasNextPage, loadMore); // ✅ 3. استخدام الخطاف

  const handleAddAirport = async (icao) => {
    try {
      await axios.post(`${API_URL}/api/airports`, { icao }, config);
      fetchMonitoredAirports();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to add airport.");
    }
  };

  const handleDeleteAirport = async (id) => {
    if (window.confirm("Are you sure you want to stop monitoring this airport?")) {
      try {
        await axios.delete(`${API_URL}/api/airports/${id}`, config);
        fetchMonitoredAirports();
      } catch (err) {
        alert("Could not delete airport. Please try again.");
      }
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
          {isLoadingMonitored ? <p>Loading...</p> : (
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
          {availableAirports.length > 0 && (
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
          {/* ✅ 4. عرض مؤشر التحميل والنهاية */}
          <div ref={loaderRef} className="h-10 flex items-center justify-center text-text-secondary">
            {isExplorerLoading && <p>Loading more airports...</p>}
            {!isExplorerLoading && !hasNextPage && availableAirports.length > 0 && <p>You have reached the end.</p>}
          </div>
          {!isExplorerLoading && availableAirports.length === 0 && 
            <p className="p-6 text-center text-text-secondary">No airports match your criteria.</p>
          }
        </div>
      </div>
    </div>
  );
};

export default AirportManagement;