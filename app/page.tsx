
import React from "react";
import "./globals.css";

export default function Page() {
  return (
    <div className="min-h-screen">

      {/* Header */}
      <header className="text-center py-8">
        <h1 className="text-blue-600 text-6xl font-bold">
          Student Housing BV
        </h1>

        <p className="mt-3 text-gray-700">
          Welcome to Student Housing BV!
        </p>

        <h2 className="text-red-600 font-bold text-xl mt-6">
          Urgent Announcements
        </h2>
      </header>

      {/* Buttons */}
      <div className="flex gap-4 justify-center my-6">

        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Button
        </button>

        <button className="btn btn-blue">
          Button
        </button>

      </div>

      {/* Navigation */}
      <nav className="flex justify-center mt-8">
        <ul className="flex flex-col gap-4">

          <li>
            <a href="/homepage">Home</a>
          </li>

          <li>
            <a href="/homepage/about">About</a>
          </li>

          <li>
            <a href="/homepage/repairs">Repairs</a>
          </li>

          <li>
            <a href="/homepage/complaints">Complaints</a>
          </li>

          <li>
            <a href="/homepage/maintenance">Maintenance</a>
          </li>

          <li>
            <a href="/homepage/account">Account</a>
          </li>

          <li>
            <a href="/homepage/Logout">Logout</a>
          </li>

        </ul>
      </nav>

    </div>
  );
}


