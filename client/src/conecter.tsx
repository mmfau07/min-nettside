import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login/page';


function Conecter() {
	return (
		<div className="Conecter">
			<Router>
				<Routes>
					<Route path='/login' element={<Login />}></Route>
					<Route path="/" element={<Navigate to="/login" />} />
				</Routes>
			</Router>
		</div>
	);
}

export default Conecter;