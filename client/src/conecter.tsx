import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './route/home/page';
import Login from './route/login/page';
import CreateUser from './route/creatUser/page';


function Conecter() {
	return (
		<div className="Conecter">
			<Router>
				<Routes>
					<Route path='/login' element={<Login />} />
					<Route path="/" element={<Navigate to="/login" />} />
					<Route path="/home" element={<Home />} />
					<Route path="/createUser" element={<CreateUser />} />
				</Routes>
			</Router>
		</div>
	);
}

export default Conecter;