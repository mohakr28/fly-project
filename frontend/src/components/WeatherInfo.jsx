import React from "react";
import {
  FaCloud,
  FaTemperatureHigh,
  FaWind,
  FaBolt,
  FaSnowflake,
  FaSmog,
  FaQuestionCircle,
} from "react-icons/fa";

const getWeatherPhenomena = (metarString) => {
  if (!metarString) return { text: "N/A", Icon: FaQuestionCircle };
  if (metarString.includes("TS")) return { text: "Thunderstorm", Icon: FaBolt };
  if (metarString.includes("SN")) return { text: "Snow", Icon: FaSnowflake };
  if (metarString.includes("RA")) return { text: "Rain", Icon: FaCloud };
  if (metarString.includes("FG")) return { text: "Fog", Icon: FaSmog };
  if (
    metarString.includes("NCD") ||
    metarString.includes("CAVOK") ||
    metarString.includes("CLR")
  ) {
    return { text: "Clear", Icon: FaCloud };
  }
  return { text: "Cloudy", Icon: FaCloud };
};

const WeatherInfo = ({ weather, type }) => {
  if (
    !weather ||
    weather.temperature === undefined ||
    weather.windSpeed === undefined
  ) {
    return (
      <div className="detail-item">
        <strong>{type} Weather:</strong>
        <span style={{ marginLeft: "4px" }}>Data not available</span>
      </div>
    );
  }

  const { text: conditionText } = getWeatherPhenomena(weather.condition);

  return (
    <div className="detail-item" title={weather.condition || "Weather details"}>
      <strong>{type}:</strong>
      <span style={{ marginLeft: "4px" }}>{conditionText},</span>
      <span>{weather.temperature}°C,</span>
      <span>{weather.windSpeed} km/h wind</span>
    </div>
  );
};

export default WeatherInfo;
