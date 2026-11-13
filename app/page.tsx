
import "./globals.css";

export default function Home() {
  return (
    <div className="flex min-h-screen"> 

      {/* Main content */}
      <main className="min-h-screen flex p-8">

        <div className="py-8 text-center">
          <h1 className="text-xl font-bold text-blue-800 sm:text-4xl center">
            Welcome to Student Housing BV
          </h1>
        </div>

        {/* Keep your existing three activity cards here */}

      </main>



    <main className="flex min-h-screen flex-col items-center justify-between p-24">
  

    <div className ="flex gap-1 flex-wrap justify-center">
      {/* Repairs box */}
      <a
        href="/tenant-dashboard/sfv/maintenance"
        className="group relative block bg-blue-400 h-70 w-70 mx-auto overflow-hidden rounded-lg m-4"
      >

        <img
          alt="Repairs and maintenance"
          src="/images/repairs.png"
          className="absolute inset-0 h-35 w-35 object-cover opacity-75 transition-opacity group-hover:opacity-50 mx-auto top-25"
        />


        <div className="relative p-4 sm:p-6 lg:p-8">
          <p className="text-xl">
            Repairs
          </p>

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
      </a>

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
                Schedule which flatmates are responsible for cleaning
                common areas and when.
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
  )
}