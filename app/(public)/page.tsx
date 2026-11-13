import Link from "next/link";
export default function Page() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="text-center py-8">
        <h1 className="text-blue-600 text-6xl font-bold">Student Housing BV</h1>
      </header>
      <main className="min-h-screen">
        {/* Welcome heading */}
        <div className="text-center py-8">
          <h1 className="text-xl font-bold text-blue-800 sm:text-4xl">
            Welcome to Student Housing BV
          </h1>
        </div>

        <div className="flex gap-1 flex-wrap justify-center">
          {/* Repairs box */}
          <Link
            href="/tenant-dashboard/nofnp/maintenance"
            className="group relative block bg-blue-400 h-70 w-70 mx-auto overflow-hidden rounded-lg m-4"
          >
            <img
              alt="Repairs and maintenance"
              src="/images/repairs.png"
              className="absolute inset-0 h-35 w-35 object-cover opacity-75 transition-opacity group-hover:opacity-50 mx-auto top-25"
            />

            <div className="relative p-4 sm:p-6 lg:p-8">
              <p className="text-xl">Repairs</p>

              <p className="text-xl font-bold text-white sm:text-2xl">
                Maintenance and Repairs
              </p>

              <div className="mt-32">
                <div className="translate-y-8 transform opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-sm text-white">
                    Fill in the form to report any maintenance requests or
                    repairs which need to be addressed, and our team will
                    promptly respond.
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Cleaning box */}
          <a
            href="/home/cleaning"
            className="group relative block bg-blue-400 h-70 w-70 mx-auto overflow-hidden rounded-lg m-4"
          >
            <img
              alt="Cleaning schedule"
              src="/images/cleaning.png"
              className="absolute inset-0 h-40 w-40 object-cover opacity-75 transition-opacity group-hover:opacity-50 mx-auto top-25"
            />

            <div className="relative p-4 sm:p-6 lg:p-8">
              <p className="text-sm font-medium tracking-widest text-blue-800 uppercase">
                Cleaning
              </p>

              <p className="text-xl font-bold text-white sm:text-2xl">
                Cleaning Schedule
              </p>

              <div className="mt-32">
                <div className="translate-y-8 transform opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-sm text-white">
                    Schedule which flatmates are responsible for cleaning common
                    areas and when.
                  </p>
                </div>
              </div>
            </div>
          </a>

          <a
            href="/home/cleaning"
            className="group relative block bg-blue-400 h-70 w-70 mx-auto overflow-hidden rounded-lg m-4"
          >
            <img
              alt="Complaints"
              src="/images/complaints.svg"
              className="absolute inset-0 h-40 w-40 object-cover opacity-75 transition-opacity group-hover:opacity-50 mx-auto top-25"
            />

            <div className="relative p-4 sm:p-6 lg:p-8">
              <p className="text-sm font-medium tracking-widest text-blue-800 uppercase">
                Complaints
              </p>

              <p className="text-xl font-bold text-white sm:text-2xl">
                Complaints
              </p>

              <div className="mt-32">
                <div className="translate-y-8 transform opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-sm text-white">
                    Report any issues with your flatmates or property.
                  </p>
                </div>
              </div>
            </div>
          </a>
        </div>
      </main>
    </div>
  );
}
