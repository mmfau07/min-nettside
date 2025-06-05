import React, { useEffect, useState } from "react";

export default function CreateUser() {
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
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
                            setError('Invalid response from server');
                        } else {
                            window.location.href = '/home';
                        }
                    })
                }
                if (response.status === 401) {
                    // Unauthorized, clear cookies and redirect to login
                    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    setError('Invalid credentials, please login again.');
                }
            }).catch(error => {
                console.error('Network error:', error);
                setError('Unable to connect to server.');
            })
        }

        // Set loading to false after checking cookies
        setIsLoading(false);
    }, [])
    

    function setCookie(cname: string, cvalue: string) {
        const date = new Date();
        date.setTime(date.getTime() + (1*24*60*60*1000));
        let expires = "expires="+ date.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    

    function createUser() {
        fetch('http://localhost:5000/api/createUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, password: password })
        }).then(response => {
            if (response.ok) {

                // add cookie
                response.json().then(data => {
                    if (!data.username || !data.token) {
                        setError('Invalid response from server');
                    } else {
                        setCookie('username', data.username);
                        setCookie('token', data.token);

                        // Redirect to the home page or another page after successful user creation
                        window.location.href = '/home';
                    }
                })
                
            } else {
                // Handle error response
                response.json().then(data => {
                    console.error(data);
                    setError(data.message || 'User creation failed');
                }).catch(() => {
                    setError('User creation failed');
                });
            }
        })
    }

    if (isloding) return <div>Loading...</div>;

    return (
    <div>
        <h1>Login Page</h1>
        <table>
            <tbody>
                <tr>
                    <td>Username:</td>
                    <td><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} /></td>
                </tr>
                <tr>
                    <td>Password:</td>
                    <td><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></td>
                </tr>
                <tr>
                    <button onClick={createUser}>creat</button>
                </tr>
                {error && (
                    <tr>
                        <td colSpan={2} style={{ color: 'red' }}>{error}</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
    )
}