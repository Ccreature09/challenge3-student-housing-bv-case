"use client"

import { Button } from "@/components/ui/button"
import { SubmitEvent } from "react";
import { useState } from "react";



export default function CreateComplaints() {
    const [title, setTitle] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [photo, setPhoto] = useState("");


    function handleChange(e) {
        setValue(e.target.value);
    }


    async function formSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        

        const formData = new FormData(event.currentTarget);
        const response = await fetch('/api/submit', {
            method: 'POST',
            body: formData,
        })


        if (!response.ok) throw new Error('Failed to Submit!');
        const data = await response.json();
        alert(data.message);
    }

    
    
    return(<div>
        <p className = "text-center text-2xl">Create Complaints</p>

        <div className="w-full max-w-xs">
        
        <form onSubmit={formSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-150">
            
            <div className="mb-4">

                    Title
                
                <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="username"
                type="text"
                value={title}
                onChange={handleChange}
                placeholder="Enter a Complaint title"/>
            
            </div>
                
                <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Location
                </label>

                <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="username"
                type="text"
                value={location}
                onChange={handleChange}
                placeholder="Enter the Building and Building Number"/>
                

                <div className="mb-6">
                
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Description
                </label>

                <input 
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight h-50 focus:outline-none focus:shadow-outline" 
                    id="username"
                    type="text"
                    value={description}
                    onChange={handleChange}
                    placeholder="Describe your Complaint"/>
                </div>
                </div>

                
                <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Photo (optional)
                </label>
                <input
                     className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight h-50 focus:outline-none focus:shadow-outline" 
                    type="file"
                    id="imageUpload"
                    name="image"
                    accept="image/*"
                    value={photo}
                    onChange={handleChange}
                    placeholder="Insert a Picture"/>

                </div>

                <div className="flex items-center justify-between">
               
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded border-3 border-blue-900 focus:outline-none focus:shadow-outline" type="button">
                    <Button type="submit">Submit Complaint</Button>
                </button>
                </div>
            </form>
            <p className="text-center text-gray-500 text-xs">
                &copy;2020 Acme Corp. All rights reserved.
            </p>
</div>
    </div>
    )
};