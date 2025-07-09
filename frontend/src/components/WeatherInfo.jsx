import React from "react";
import { FaEye, FaCloud, FaTemperatureHigh, FaWind } from "react-icons/fa";

const WeatherInfo = ({ weather, type }) => {
  if (!weather || !weather.condition) {
    return null;
  }

  const visibilityKm = weather.visibility
    ? `${(weather.visibility / 1000).toFixed(1)} km`
    : "N/A";

  // --- ✅ إضافة tooltip لإظهار تقرير TAF عند التحويم ---
  return (
    <div
      className="detail-item"
      title={weather.taf ? `TAF: ${weather.taf}` : "TAF not available"}
    >
      <strong>{type}:</strong>
      <span style={{ marginLeft: "4px" }}>
        <FaTemperatureHigh /> {weather.temperature}°C
      </span>
      <span style={{ marginLeft: "8px" }}>
        <FaWind /> {weather.windSpeed} km/h
      </span>
      <span style={{ marginLeft: "8px" }}>
        <FaEye /> {visibilityKm}
      </span>
      {weather.cloudLayers && weather.cloudLayers.length > 0 && (
        <span style={{ marginLeft: "8px" }}>
          <FaCloud /> {weather.cloudLayers[0].cover} @{" "}
          {weather.cloudLayers[0].height} ft
        </span>
      )}
    </div>
  );
};

export default WeatherInfo;
