

import React, { useMemo, useState, useEffect, useContext } from "react";
import { AuthProvider } from "../context/AuthContext";
import { getTimeShifts } from "../../server/services/timeShiftService";


export default function Calendar() {
	const { user } = useContext(AuthProvider) || {};
	// user: { username, role, ... }
	const [department, setDepartment] = useState("Todos");
	const [name, setName] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [users, setUsers] = useState([]);
	const [records, setRecords] = useState([]);
	const [departments, setDepartments] = useState(["Todos"]);


useEffect(() => {
	async function fetchData() {
		try {
			let shifts = [];
			if (user && user.role === "admin") {
				// Admin: fetch all
				shifts = await getTimeShifts({});
			} else if (user && user.username) {
				// Regular user: fetch only their records
				shifts = await getTimeShifts({ name: user.username });
			}
			setRecords(
				shifts.map((shift, idx) => ({
					id: shift.id || idx,
					username: shift.userId || "Desconocido",
					PunchIn: shift.PunchIn?.toDate ? shift.PunchIn.toDate() : shift.PunchIn,
					PunchOut: shift.PunchOut?.toDate ? shift.PunchOut.toDate() : shift.PunchOut,
					department: shift.department || shift.departamento || "",
				}))
			);

			// Only admin needs all users/departments for filters
			if (user && user.role === "admin") {
				const userSet = new Set(shifts.map(s => s.userId));
				setUsers(Array.from(userSet).map(username => ({ username })));
				const deptSet = new Set(shifts.map(s => s.department || s.departamento).filter(Boolean));
				setDepartments(["Todos", ...Array.from(deptSet)]);
			} else {
				setUsers(user && user.username ? [{ username: user.username }] : []);
				setDepartments(["Todos"]);
			}
		} catch (e) {
			setUsers([]);
			setRecords([]);
			setDepartments(["Todos"]);
		}
	}
	fetchData();
}, [user]);



	const namesForDepartment = useMemo(() => {
		if (!users || users.length === 0) return user && user.username ? [user.username] : ["Todos"];
		let list = users;
		if (department !== "Todos") list = users.filter((u) => (u.department || u.departamento) === department);
		return user && user.role === "admin"
			? ["Todos", ...list.map((u) => u.username)]
			: [user.username];
	}, [users, department, user]);


	const filtered = useMemo(() => {
		let res = records.filter((r) => {
			if (department !== "Todos" && r.department !== department) return false;
			if (name && name !== "") {
				if (r.username !== name) return false;
			}
			if (startDate) {
				const start = new Date(startDate);
				const t = r.PunchIn ? new Date(r.PunchIn) : null;
				if (t && t < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false;
			}
			if (endDate) {
				const end = new Date(endDate);
				const t = r.PunchIn ? new Date(r.PunchIn) : null;
				if (t && t > new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999)) return false;
			}
			return true;
		});
		// Sort by PunchIn descending (newest first)
		res.sort((a, b) => {
			const aTime = a.PunchIn ? new Date(a.PunchIn).getTime() : 0;
			const bTime = b.PunchIn ? new Date(b.PunchIn).getTime() : 0;
			return bTime - aTime;
		});
		return res;
	}, [records, department, name, startDate, endDate]);


	return (
		<div style={{ padding: 12 }}>
			<h3>Filtros</h3>

			{user && user.role === "admin" ? (
				<div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
					<div>
						<label>Departamento</label>
						<br />
						<select value={department} onChange={(e) => { setDepartment(e.target.value); setName(""); }}>
							{departments.map((d) => (
								<option key={d} value={d}>{d}</option>
							))}
						</select>
					</div>

					<div>
						<label>Nombre</label>
						<br />
						<select value={name} onChange={(e) => setName(e.target.value)}>
							{namesForDepartment.map((n) => (
								<option key={n} value={n === "Todos" ? "" : n}>{n}</option>
							))}
						</select>
					</div>

					<div>
						<label>Fecha inicio</label>
						<br />
						<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
					</div>

					<div>
						<label>Fecha final</label>
						<br />
						<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
					</div>
				</div>
			) : null}

			<div>
				<h4>Resultados ({filtered.length})</h4>
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr>
							<th style={{ border: "1px solid #ddd", padding: 6 }}>Usuario</th>
							<th style={{ border: "1px solid #ddd", padding: 6 }}>Entrada</th>
							<th style={{ border: "1px solid #ddd", padding: 6 }}>Salida</th>
							<th style={{ border: "1px solid #ddd", padding: 6 }}>Departamento</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((r) => (
							<tr key={r.id}>
								<td style={{ border: "1px solid #eee", padding: 6 }}>{r.username}</td>
								<td style={{ border: "1px solid #eee", padding: 6 }}>
									{r.PunchIn ? new Date(r.PunchIn).toLocaleString() : ""}
								</td>
								<td style={{ border: "1px solid #eee", padding: 6 }}>
									{r.PunchOut ? new Date(r.PunchOut).toLocaleString() : ""}
								</td>
								<td style={{ border: "1px solid #eee", padding: 6 }}>{r.department || ""}</td>
							</tr>
						))}
						{filtered.length === 0 && (
							<tr>
								<td colSpan={4} style={{ padding: 12, textAlign: "center" }}>No hay resultados</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
