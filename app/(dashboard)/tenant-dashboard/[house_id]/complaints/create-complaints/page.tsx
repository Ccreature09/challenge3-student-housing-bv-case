"use client" //allows for use of event handlers

import { Button } from "@/components/ui/button"
import { useState, SubmitEvent } from "react";



export default function CreateComplaints() {
    const [title, setTitle] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [photo, setPhoto] = useState("");

    async function formSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault(); //stops page from refreshing upon form submit
    
        const response = await fetch("/api/complaints", { //fetch sends request to backend
            method: "POST"

            headers: { //the following lines (up to first } ) are important to parse request bodies (POST, PUT) correctly
                "Content-Type": "application/json",
             },
              //application/json is the official IANA registered MIME type for JSON => it indicates the message body for JSON data
            body: JSON.stringify({ //stringify converts JS object into JSON, allowing it to be sent in the request
                title: title,
                location:location,
                description:description,
                photo: photo,
            }), 
        });


        if (!response.ok) throw new Error('Failed to Submit!');
        const data = await response.json();
        alert(data.message);
    }

    
    
    return(<div>
        <p className = "text-center text-2xl">Create Complaints</p>

        <div className="w-full max-w-xs">
        
        <form onSubmit={formSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-250 h-210">
            
            <div className="mb-4">

                    Title
                
                <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="username"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter a Complaint title"
                required
                />
            
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
                onChange={(event) => setLocation(event.target.value)}
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
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe your Complaint"/>
                </div>
                </div>

                
                <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">

                    Photo (optional)
                    
                </label>
                <img src="/images/photo.webp" alt="Camera image" className="w-20 h-20"></img>
                <input
                     className="shadow appearance-none border rounded w-60 py-2 px-3 text-gray-700 leading-tight h-50 focus:outline-none focus:shadow-outline" 
                    type="file"
                    id="imageUpload"
                    name="image"
                    accept="image/*"
                    value={photo}
                    onChange={(event) => setPhoto(event.target.value)}
                    placeholder="Insert a Picture"/>
                    

                </div>

                <div className="flex items-center justify-between">
               
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded border-3 absolute top-1/2 left-1/2 -translate-x-[100%] -translate-y-[-750%] border-blue-900 focus:outline-none focus:shadow-outline" type="button">
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