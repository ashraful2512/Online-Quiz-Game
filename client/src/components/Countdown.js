import React from "react";

export default function Countdown({ count }) {
  return (
    <div className="countdown-screen">
      <div className="countdown-label">Get Ready!</div>
      <div className="countdown-number" key={count}>{count}</div>
      <div className="countdown-sub">Quiz battle starting...</div>
    </div>
  );
}
