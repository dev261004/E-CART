    import React from "react";
    import { useNavigate } from "react-router-dom";
    import { JSX } from "react/jsx-runtime";

    export default function NotFoundPage(): JSX.Element {
        const navigate = useNavigate();

        return (
            <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">

                <div className="max-w-4xl w-full flex flex-col md:flex-row items-center gap-10">
                    
                    {/* Illustration (optional) */}
                    <div className="flex-1 flex items-center justify-center">
                        <img
                            src="/notfound.png"
                            alt="Not found illustration"
                            className="w-full max-w-sm object-contain "
                        />
                    </div>

                    {/* Text Section */}
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-5xl font-extrabold text-gray-900">Page not found</h1>
                        <p className="mt-4 text-lg text-gray-600">
                            The page you're looking for doesn’t exist or may have been moved.
                        </p>

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">

                            <button
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 
                                        shadow-sm transition-all"
                            >
                                Go back
                            </button>

                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-3 rounded-full bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 
                                        transition-all"
                            >
                                Go to homepage
                            </button>
                        </div>

                     
                    </div>
                </div>

              
            </div>
        );
    }
