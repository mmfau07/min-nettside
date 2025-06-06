import React, { useEffect, useState } from "react";

export default function Home() {
    const [error, setError] = useState<string | null>(null);
    const [isloding, setIsLoading] = useState(true);

    useEffect(() => {

        // Check if cookies are set and if so the login emidiately
        const usernameCookie = document.cookie.split('; ').find(row => row.startsWith('username='));
        const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('token='));

        if (usernameCookie && tokenCookie) {
            // Extract the username and token from the cookies
            const username = usernameCookie.split('=')[1];
            const token = tokenCookie.split('=')[1];
            
            fetch('http://localhost:5000/api/checkCookie', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    token: token,
                })
            }).then(response => {
                if (response.ok) {
                    // Redirect to the home page or another page after successful cookie check
                    response.json().then(data => {
                        if (data.validToken === false) {
                            document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                            window.location.href = '/login';
                        }
                    })
                }
                if (response.status === 401) {
                    // Unauthorized, clear cookies and redirect to login
                    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    window.location.href = '/login';
                    setError('Invalid credentials, please login again.');
                }
            }).catch(error => {
                console.error('Network error:', error);
                setError('Unable to connect to server.');
            })
        } else {
            // If cookies are not set, redirect to login page
            window.location.href = '/login';
        }

        // Set loading to false after checking cookies
        setIsLoading(false);
    }, [])

    return (
        <div>
            <h1>Home Page</h1>
        </div>
    )
}