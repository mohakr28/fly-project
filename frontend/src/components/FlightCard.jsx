// src/components/FlightCard.js
import React from "react";
import { format } from "date-fns";
import {
  FaPlane,
  FaExclamationTriangle,
  FaSatelliteDish,
  FaMapMarkerAlt,
  FaCloud,
  FaSun,
  FaSnowflake,
  FaBolt,
  FaInfoCircle,
} from "react-icons/fa";

// دالة مساعدة لاختيار أيقونة الطقس
const getWeatherIcon = (condition) => {
  if (!condition) return <FaCloud />;
  const lowerCaseCondition = condition.toLowerCase();
  if (lowerCaseCondition.includes("snow")) return <FaSnowflake />;
  if (lowerCaseCondition.includes("thunder")) return <FaBolt />;
  if (lowerCaseCondition.includes("rain")) return <FaCloud />;
  if (lowerCaseCondition.includes("clear")) return <FaSun />;
  return <FaCloud />;
};

const FlightCard = ({ flight }) => {
  const isDelayed = flight.status === "Delayed";
  const statusColor = isDelayed
    ? "var(--warning-color)"
    : "var(--danger-color)";

  const hasLiveData =
    flight.live && flight.live.latitude && flight.live.longitude;
  const isOnGround = hasLiveData && flight.live.onGround;
  const isAirborne = hasLiveData && !flight.live.onGround;

  const LiveIndicator = () => {
    /* ... (لا تغيير هنا، يمكنك نسخها من الردود السابقة) ... */
  };

  // مكون صغير لعرض معلومات الطقس
  const WeatherInfo = ({ weather }) => {
    if (!weather?.condition) return null;
    return (
      <span
        title={`${weather.condition}, ${weather.temperature}°C, ${weather.windSpeed} km/h wind`}
      >
        {getWeatherIcon(weather.condition)}
      </span>
    );
  };

  return (
    <div className="flight-card" style={{ borderLeftColor: statusColor }}>
      <div className="card-header">
        <h3>{flight.flightNumber.toUpperCase()}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* ... (مؤشر الموقع المباشر لم يتغير) ... */}
          <span
            className="status-text"
            style={{ backgroundColor: statusColor }}
          >
            {flight.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="card-body">
        <div className="flight-path-timeline">
          <div className="timeline-point">
            <div className="timeline-airport">
              {flight.departureAirport.toUpperCase()}{" "}
              {flight.weatherInfo && (
                <WeatherInfo weather={flight.weatherInfo.departure} />
              )}
            </div>
            <div className="timeline-time">
              <span>
                Scheduled:{" "}
                {format(new Date(flight.scheduledDeparture), "HH:mm")}
              </span>
              {isDelayed && (
                <span>
                  Actual:{" "}
                  {flight.actualDeparture
                    ? format(new Date(flight.actualDeparture), "HH:mm")
                    : "-"}
                </span>
              )}
            </div>
          </div>
          <div className="timeline-line">
            <FaPlane />
          </div>
          <div className="timeline-point">
            <div className="timeline-airport">
              {flight.arrivalAirport.toUpperCase()}{" "}
              {flight.weatherInfo && (
                <WeatherInfo weather={flight.weatherInfo.arrival} />
              )}
            </div>
            <div className="timeline-time">
              <span>
                {format(new Date(flight.scheduledDeparture), "MMM dd, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* عرض سياق الإلغاء إذا وجد */}
      {flight.cancellationContext && (
        <div
          style={{
            padding: "10px 20px",
            fontSize: "0.8rem",
            backgroundColor: "#fffbe6",
            color: "#92400e",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderTop: "1px solid var(--border-color)",
          }}
        >
          <FaInfoCircle />
          {flight.cancellationContext}
        </div>
      )}

      <div className="card-footer">
        <FaExclamationTriangle style={{ color: statusColor }} />
        <span>
          {isDelayed
            ? `Delayed by ${flight.delayDuration} minutes`
            : "This flight was cancelled"}
        </span>
        {hasLiveData && (
          <a
            href={`https://www.google.com/maps?q=${flight.live.latitude},${flight.live.longitude}&z=14`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginLeft: "auto",
              color: "var(--primary-color)",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Show on Map
          </a>
        )}
      </div>
    </div>
  );
};

export default FlightCard;
