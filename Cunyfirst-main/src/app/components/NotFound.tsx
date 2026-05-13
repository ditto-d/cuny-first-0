import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";

export function NotFound() {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    navigate("/");
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
                <p className="text-8xl font-bold text-blue-200 mb-4">404</p>
                <h1 className="text-2xl text-gray-900 font-semibold mb-2">Page Not Found</h1>
                <p className="text-gray-600 mb-6">
                    The page you're looking for doesn't exist.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                    Redirecting to login in{" "}
                    <span className="font-semibold text-blue-600">{countdown}</span>{" "}
                    second{countdown !== 1 ? "s" : ""}...
                </p>
                <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium underline">
                    Go now
                </Link>
            </div>
        </div>
    );
}