import Link from "next/link";
import { useState } from "react";

const {text, setText} = useState("example");

export default function Complaints() {
    return (
        <div>
            <h1 className="text-center text-3xl top-10">Complaints</h1>
        <Link href="/tenant-dashboard/1/complaints/view-complaints"
        className="group relative block h-80 w-80 overflow-hidden rounded-lg border-3 border-blue-900 bg-blue-400 translate-x-1/2 translate-y-1/2">
           <div
              
            >
              <img
                src="/images/view.webp"
                alt="Complaints"
                className="absolute inset-0 top-25 mx-auto h-25 w-25 object-contain opacity-75 transition-opacity group-hover:opacity-50"
              />

              <div className="relative p-4">
                <p className="text-sm font-medium tracking-widest text-blue-800 uppercase">
                  Issues
                </p>

                <p className="text-xl text-white">
                  View Complaints
                </p>

                <p className="mt-4 translate-y-8 text-sm text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  View any reported issues with your flatmates or property.
                </p>
              </div>
            </div>
        </Link>

        <div>
        <Link href="/tenant-dashboard/1/complaints/create-complaints"
          className="group relative block h-80 w-80 overflow-hidden rounded-lg border-3 border-blue-900 bg-blue-400 translate-x-[250%] translate-y-[-48%]">
          <img
            src="/images/create.png"
            alt="Complaints"
            className="absolute inset-0 top-25 mx-auto h-25 w-25 object-contain opacity-75 transition-opacity group-hover:opacity-50"
          />

              <div className="relative p-4">
                <p className="text-sm font-medium tracking-widest text-blue-800 uppercase">
                  Issues
                </p>

                <p className="text-xl text-white">
                  Create Complaint
                </p>

                <p className="mt-4 translate-y-8 text-sm text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  Report any issues with your flatmates or property.
                </p>
              </div>
          </Link>
        </div>
        </div>
    )
};