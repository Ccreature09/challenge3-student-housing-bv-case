export default function EditComplaints() {
    return(<div>
        <p>Update Complaint</p>
        <div>
        <p className = "text-center text-2xl">Create Complaints</p>

        <div className="w-full max-w-xs">
        <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-150">
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Title
                </label>
                <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" type="text" placeholder="Enter a Complaint title"></input>
                </div>
                <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Location
                </label><input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" type="text" placeholder="Enter the Building and Building Number"></input>

                <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Description
                </label>
                <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight h-50 focus:outline-none focus:shadow-outline" id="username" type="text" placeholder="Describe your Complaint"></input>
                </div>
                </div>

                
                <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Photo (optional)
                </label>
                </div>
            </form>
            <p className="text-center text-gray-500 text-xs">
                &copy;2020 Acme Corp. All rights reserved.
            </p>
</div>
    </div>
    </div>
    )
}