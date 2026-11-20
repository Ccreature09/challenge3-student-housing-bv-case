import { Button } from "@/components/ui/button"

export default function ViewComplaints() {
  return (
    <main>
      <h1 className="text-center text-3xl mt-4">My Complaints</h1>
        <Button variant="outline"
            className="bg-blue-400 h-16 rounded-2xl border-2 blue-500 px-8 text-lg text-white hover:text-white">Create Complaint
        </Button>
      <div
  className="relative flex flex-col w-full h-full overflow-scroll text-gray-700 bg-white shadow-md rounded-xl bg-clip-border">
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
            Resolved
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
      </tr>
      <tr>
      </tr>
    </tbody>
  </table>
</div>
    </main>
  );
}