// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import Header from "../components/Header";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Profile = () => {
  const [profileData, setProfileData] = useState({ name: "", email: "" });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  const { toggleSidebar, theme, toggleTheme } = useOutletContext();

  const token = localStorage.getItem("token");
  const config = {
    headers: {
      "x-auth-token": token,
    },
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth`, config);
        setProfileData({ name: res.data.name, email: res.data.email });
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };
    fetchUserData();
  }, []); // Note: Dependency array is empty, config is defined inside.

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const onProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/users/profile`, profileData, config);
      showMessage("success", "Profile updated successfully!");
    } catch (err) {
      showMessage("error", err.response?.data?.msg || "Update failed.");
    }
  };

  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      showMessage("error", "New passwords do not match.");
      return;
    }
    try {
      await axios.put(
        `${API_URL}/api/users/password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        config
      );
      showMessage("success", "Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      showMessage("error", err.response?.data?.msg || "Update failed.");
    }
  };

  return (
    <div className="profile-page">
      <Header
        title="Account Settings"
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {message.text && (
        <div className={`message-banner ${message.type}`}>{message.text}</div>
      )}

      {/* User Profile Card */}
      <div className="profile-card">
        <div className="profile-card-header">
          <h3>Profile Information</h3>
          <p>Update your account's profile information and email address.</p>
        </div>
        <form onSubmit={onProfileSubmit} className="profile-card-body">
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
              />
            </div>
          </div>
          <div className="profile-card-footer">
            <p>Please make sure your details are correct.</p>
            <button type="submit" className="auth-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="profile-card">
        <div className="profile-card-header">
          <h3>Change Password</h3>
          <p>
            Ensure your account is using a long, random password to stay secure.
          </p>
        </div>
        <form onSubmit={onPasswordSubmit} className="profile-card-body">
          <div className="input-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength="6"
              />
            </div>
            <div className="input-group">
              <label htmlFor="confirmNewPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmNewPassword"
                name="confirmNewPassword"
                value={passwordData.confirmNewPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
          </div>
          <div className="profile-card-footer">
            <p>Minimum 6 characters required.</p>
            <button type="submit" className="auth-btn">
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
