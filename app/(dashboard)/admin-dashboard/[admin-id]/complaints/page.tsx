"use client"

import Link from 'next/link';
import { useState } from 'react';

export default function Complaints() {
    return(
      <div>
        <div>
                  <div>
            <h1 className="text-center text-3xl top-10">Complaints</h1>
        <div
        className="group relative block h-40 w-80 overflow-hidden rounded-lg border-3 border-blue-900 bg-blue-400 translate-x-[10%] translate-y-1/2">
           <div
              
            >
              <div className="relative p-4">
                <p className="text-sm font-medium tracking-widest text-blue-800 uppercase">
                  Submitted
                </p>

                <p className="text-xl text-white text-center">
                  X
                </p>
              </div>
            </div>
            </div>

        <div
          className="group relative block h-40 w-80 overflow-hidden rounded-lg border-3 border-blue-900 bg-blue-400 translate-x-[150%] translate-y-[-48%]">

              <div className="relative p-4">
                <p className="text-sm font-medium tracking-widest text-blue-800 uppercase">
                  In Progress
                </p>

                <p className="text-xl text-white text-center">
                  Y
                </p>
              </div>

        </div>


          <div className="group relative block h-40 w-80 overflow-hidden rounded-lg border-3 border-blue-900 bg-blue-400 translate-x-[290%] translate-y-[-148%]">

              <div className="relative p-4">
                <p className="text-sm font-medium tracking-widest text-blue-800 uppercase">
                  Unresolved
                </p>

                <p className="text-xl text-white text-center">
                  Z
                </p>
              </div>
            </div>
        </div>
        </div>
        

  <div className="relative flex flex-col w-full h-full overflow-scroll text-gray-700 bg-white shadow-md rounded-xl bg-clip-border">
  <table className="w-full text-left table-auto min-w-max">
    <thead>
      <tr>
        <th className="p-4 border-b border-blue-gray-100 bg-blue-gray-50">
          <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">
            #
          </p>
        </th>
        <th className="p-4 border-b border-blue-gray-100 bg-blue-gray-50">
          <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">
            Complaint
          </p>
        </th>
        <th className="p-4 border-b border-blue-gray-100 bg-blue-gray-50">
          <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">
            Location
          </p>
        </th>
        <th className="p-4 border-b border-blue-gray-100 bg-blue-gray-50">
          <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">
            16/11/2026
          </p>
        </th>
        <th className="p-4 border-b border-blue-gray-100 bg-blue-gray-50">
          <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">
            Status
          </p>
        </th>
        <th className="p-4 border-b border-blue-gray-50">
          <p className="block font-sans text-sm antialiased font-medium leading-normal text-blue-gray-900 opacity-70">
            Edit Status
          </p>
        </th>
        
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="p-4 border-b border-blue-gray-50">
          <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
            1
          </p>
        </td>
        <td className="p-4 border-b border-blue-gray-50">
          <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
            Frequent and disruptive parties
          </p>
        </td>
        <td className="p-4 border-b border-blue-gray-50">
          <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
            Gravesanderstaad
          </p>
        </td>
        <td className="p-4 border-b border-blue-gray-50">
          <a href="#" className="block font-sans text-sm antialiased font-medium leading-normal text-blue-gray-900">
            16/11/2026
          </a>
        </td>
        <td className="p-4 border-b border-blue-gray-50">
          <a href="#" className="block font-sans text-sm antialiased font-medium leading-normal text-blue-gray-900">
            Resolved
          </a>
        </td>
      </tr>
      <tr>
        <td className="p-4 border-b border-blue-gray-50">
          <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
            2
          </p>
        </td>
        <td className="p-4 border-b border-blue-gray-50">
          <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
            Loud Noises after 10:00 PM
          </p>
        </td>
        <td className="p-4 border-b border-blue-gray-50">
          <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
            Johannes Van Der Waalsweg
          </p>
        </td>
        <td className="p-4 border-b border-blue-gray-50">
          <a href="#" className="block font-sans text-sm antialiased font-medium leading-normal text-blue-gray-900">
            17/11/2026
          </a>
        </td>

        <td className="p-4 border-b border-blue-gray-50">
          <a href="#" className="block font-sans text-sm antialiased font-medium leading-normal text-blue-gray-900">
            In progress
          </a>
        </td>

        <td className="p-4 border-b border-blue-gray-50">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded border-3 absolute top-1/2 left-1/2 -translate-x-[100%] -translate-y-[-750%] border-blue-900 focus:outline-none focus:shadow-outline" type="button">
                    <button>Edit Status</button>
            </button>
        </td>

      </tr>
      <tr>
      </tr>
    </tbody>
  </table>
      </div>
    
    </div>
    )
};