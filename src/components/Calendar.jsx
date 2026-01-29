
import React, { useMemo, useState, useEffect } from "react";

export default function Calendar() {
	const [department, setDepartment] = useState("Todos");
	const [name, setName] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const [users, setUsers] = useState([]);
	const [records, setRecords] = useState([]);
	const [departments, setDepartments] = useState(["Todos"]);

	useEffect(() => {
		try {
			const u = JSON.parse(localStorage.getItem("users")) || [];
			setUsers(u);

			const recObj = JSON.parse(localStorage.getItem("records")) || {};
			const flat = [];
			Object.keys(recObj).forEach((username) => {
				const userRecords = recObj[username] || [];
				userRecords.forEach((r, idx) => {
					const userMeta = u.find((x) => x.username === username) || {};
					flat.push({ id: `${username}-${idx}`, username, type: r.type, timestamp: r.timestamp, department: userMeta.department || userMeta.departamento || "" });
				});
			});
			// sort desc by timestamp
			flat.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
			setRecords(flat);

			// collect departments if present on users
			const deptSet = new Set();
			u.forEach((us) => {
				const d = us.department || us.departamento;
				if (d) deptSet.add(d);
			});
			setDepartments(["Todos", ...Array.from(deptSet)]);
		} catch (e) {
			setUsers([]);
			setRecords([]);
			setDepartments(["Todos"]);
		}
	}, []);

	const namesForDepartment = useMemo(() => {
		if (!users || users.length === 0) return ["Todos"];
		let list = users;
		if (department !== "Todos") list = users.filter((u) => (u.department || u.departamento) === department);
		return ["Todos", ...list.map((u) => u.username)];
	}, [users, department]);

	const filtered = useMemo(() => {
		const res = records.filter((r) => {
			if (department !== "Todos" && r.department !== department) return false;
			if (name && name !== "") {
				if (r.username !== name) return false;
			}
			if (startDate) {
				const start = new Date(startDate);
				const t = new Date(r.timestamp);
				// include same day
				if (t < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false;
			}
			if (endDate) {
				const end = new Date(endDate);
				const t = new Date(r.timestamp);
				if (t > new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999)) return false;
			}
			return true;
		});

		// ensure descending by timestamp (newest first)
		res.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
		return res;
	}, [records, department, name, startDate, endDate]);

	return (
		<div style={{ padding: 12 }}>
			<h3>Filtros</h3>

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

			<div>
				<h4>Resultados ({filtered.length})</h4>
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr>
							<th style={{ border: "1px solid #ddd", padding: 6 }}>Usuario</th>
							<th style={{ border: "1px solid #ddd", padding: 6 }}>Tipo</th>
							<th style={{ border: "1px solid #ddd", padding: 6 }}>Fecha</th>
							<th style={{ border: "1px solid #ddd", padding: 6 }}>Departamento</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((r) => (
							<tr key={r.id}>
								<td style={{ border: "1px solid #eee", padding: 6 }}>{r.username}</td>
								<td style={{ border: "1px solid #eee", padding: 6 }}>{r.type}</td>
								<td style={{ border: "1px solid #eee", padding: 6 }}>{new Date(r.timestamp).toLocaleString()}</td>
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
