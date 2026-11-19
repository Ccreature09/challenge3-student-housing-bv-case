import Link from 'next/link';

export default function Complaints() {
    return(
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

    )
};