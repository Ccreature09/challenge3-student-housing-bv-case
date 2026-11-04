import React from "react";

export default function Page() {
  return (
    <div>
      <p className="text-blue-600 text-6xl">Student Housing BV</p>
      <p>Welcome to Student Housing BV!</p>
      <p className="text-red-600 font-bold" style={{ textAlign: "center" }}>
        Urgent Announcements
      </p>

      <nav className="flex flex-col gap-2 mt-4">
        <ul>
          <li><a href="/homepage">Home</a></li>
          <li><a href="/homepage/about">About</a></li>
          <li><a href="/homepage/repairs">Repairs</a></li>
          <li><a href="/homepage/complaints">Complaints</a></li>
        </ul>
      </nav>
    </div>
  );
}
