import React from "react";
import "./LoadingSpinner.css";

export default function LoadingSpinner({ message = "Loading questions..." }) {
  return (
    <div className="loading-spinner">
      <div className="spinner-container">
        <div className="spinner">
          <div className="spinner-circle"></div>
          <div className="spinner-circle"></div>
          <div className="spinner-circle"></div>
        </div>
        <div className="loading-text">
          <div className="loading-message">{message}</div>
          <div className="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
