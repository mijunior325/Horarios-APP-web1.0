import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { deleteTimeShiftById, getTimeShifts } from "../../server/services/timeShiftService";
import { getAllUsers } from "../../server/services/userService";
import DeleteUserButton from './DeleteUserButton';
import toast from 'react-hot-toast';
import * as XLSX from "xlsx";

// Simple Error Boundary
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return <div style={{color: 'red', padding: 20}}>
                <h2>Something went wrong.</h2>
                <pre>{this.state.error && this.state.error.toString()}</pre>
            </div>;
        }
        return this.props.children;
    }
}
// boton para exportar a excel
function CalendarDb() {
    const { userData } = useAuth() || {};
    const [records, setRecords] = useState([]);
    const [users, setUsers] = useState([]);
    const [usersError, setUsersError] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState("");

    const formatDateTime = (value) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleString();
    };

    const exportToExcel = () => {
        if (!records.length) {
            toast.error("No hay registros para exportar.");
            return;
        }

        const rows = records.map((record) => ({
            Usuario: record.username || "-",
            Entrada: formatDateTime(record.PunchIn),
            "Entrada lunch": formatDateTime(record.LunchIn),
            "Salida lunch": formatDateTime(record.LunchOut),
            Salida: formatDateTime(record.PunchOut),
            Fecha: record.PunchIn ? new Date(record.PunchIn).toLocaleDateString() : "-",
            "Horas Trabajadas": record.workedHours || "-",
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
        const today = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `registros_calendario_${today}.xlsx`);
        toast.success("Archivo exportado correctamente.");
    };

    const handleDeleteAllRecords = async () => {
        if (!records.length) {
            toast.error("No hay registros para eliminar.");
            return;
        }

        const confirmDelete = window.confirm("¿Eliminar todos los registros visibles del calendario? Esta acción no se puede deshacer.");
        if (!confirmDelete) return;

        try {
            await Promise.all(records.map((record) => deleteTimeShiftById(record.id)));
            setRecords([]);
            toast.success("Todos los registros fueron eliminados.");
        } catch (error) {
            console.error("Error deleting all time shift records:", error);
            toast.error(error?.message || "No se pudieron eliminar todos los registros.");
        }
    };

    useEffect(() => {
        // populate user list once if admin
        async function initUsers() {
            setUsersError(null);
            const isAdmin = userData && (userData.role === "admin" || /admin/i.test(userData.position || ""));
            if (userData && isAdmin) {
                try {
                    const all = await getAllUsers();
                    setUsers(all);
                } catch (e) {
                    console.error("Failed to load users", e);
                    setUsersError(e?.message || "Error al cargar usuarios");
                }
            } else if (userData) {
                setUsers([userData]);
            }
        }
        initUsers();
    }, [userData]);

    useEffect(() => {
        async function fetchData() {
            try {
                let shifts = [];
                console.log("userData in CalendarDb:", userData, "selectedUserId:", selectedUserId);

                if (userData && userData.role === "admin") {
                    // Admin: optionally filter by selected user id
                    if (selectedUserId) {
                        shifts = await getTimeShifts({ userId: selectedUserId });
                    } else {
                        shifts = await getTimeShifts({});
                    }
                } else if (userData && userData.id) {
                    shifts = await getTimeShifts({ userId: userData.id });
                }

                // convert timestamps to Date or strings for grid display
                const normalized = shifts.map(s => {
                    const punchIn = s.PunchIn && s.PunchIn.toDate ? s.PunchIn.toDate() : s.PunchIn;
                    const punchOut = s.PunchOut && s.PunchOut.toDate ? s.PunchOut.toDate() : s.PunchOut;
                    const lunchIn = s.LunchIn && s.LunchIn.toDate ? s.LunchIn.toDate() : s.LunchIn;
                    const lunchOut = s.LunchOut && s.LunchOut.toDate ? s.LunchOut.toDate() : s.LunchOut;

                    let workedHours = "-";
                    if (punchIn && punchOut) {
                        const totalMs = punchOut - punchIn;
                        let lunchMs = 0;
                        if (lunchIn && lunchOut) {
                            lunchMs = lunchOut - lunchIn;
                        }
                        const workedMs = totalMs - lunchMs;
                        const hours = workedMs / (1000 * 60 * 60);
                        workedHours = hours.toFixed(2) + " horas";
                    }

                    return {
                        ...s,
                        PunchIn: punchIn,
                        PunchOut: punchOut,
                        LunchIn: lunchIn,
                        LunchOut: lunchOut,
                        workedHours,
                    };
                });

                setRecords(normalized);
            } catch (error) {
                console.error("Error fetching time shifts:", error);
            }
        }

        fetchData();
    }, [userData, selectedUserId]);

    return (
        <>
            {userData && (userData.role === "admin" || /admin/i.test(userData.position || "")) && (
                <div className='mb-12 flex items-center gap-4'>
                    <label>Usuario a mostrar: </label>
                    {usersError ? (
                        <span style={{ color: 'red', marginLeft: 8 }}>{usersError}</span>
                    ) : users.length === 0 ? (
                        <span style={{ marginLeft: 8, fontStyle: 'italic' }}>No se encontraron usuarios</span>
                    ) : (
                        <>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                            >
                                <option value="">Todos</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.username || u.name || u.email || u.id}
                                    </option>
                                ))}
                            </select>
                            {selectedUserId && (
                                <DeleteUserButton
                                    userId={selectedUserId}
                                    onDelete={() => {
                                        setSelectedUserId("");
                                        // Optionally refresh users list
                                        setUsers(prev => prev.filter(u => u.id !== selectedUserId));
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
            )}
            <div className='flex items-center justify-end gap-3 mb-4'>
                <button
                    onClick={exportToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                    Exportar a Excel
                </button>
                <button
                    onClick={handleDeleteAllRecords}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                    Eliminar todos los registros
                </button>
            </div>
            <div className=" flex flex-col gap-20 w-auto lg:h-auto h-auto border border-gray-300 rounded-lg shadow-lg">
                <div className="w-full overflow-x-auto sm:overflow-x-visible">
                <table className="lg:table-auto md:table-auto table-auto w-full text-left">
                    <thead>
                        <tr>
                            {/* <th className="px-4 py-2 bg-gray-200">ID</th> */}
                            <th className="px-4 py-4 bg-gray-200">Usuario</th>
                            <th className="px-4 py-4 bg-gray-200">Entrada</th>
                            <th className="px-4 py-4 bg-gray-200">Entrada lunch</th>
                            <th className="px-4 py-4 bg-gray-200">Salida lunch</th>
                            <th className="px-4 py-4 bg-gray-200">Salida</th>
                            <th className="px-4 py-4 bg-gray-200">Fecha</th>
                            <th className="px-4 py-4 bg-gray-200">Horas Trabajadas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record) => (
                            <tr key={record.id}>
                                {/* <td className="border-b border-gray-200 px-4 py-2">{record.id}</td> */}
                                <td className="border-b border-gray-200 px-4 py-2 font-bold">{record.username}</td>
                                <td className="border-b border-gray-200 px-4 py-2">{record.PunchIn ? new Date(record.PunchIn).toLocaleTimeString() : "-"}</td>
                                <td className="border-b border-gray-200 px-4 py-2">{record.LunchIn ? new Date(record.LunchIn).toLocaleTimeString() : "-"}</td>
                                <td className="border-b border-gray-200 px-4 py-2">{record.LunchOut ? new Date(record.LunchOut).toLocaleTimeString() : "-"}</td>
                                <td className="border-b border-gray-200 px-4 py-2">{record.PunchOut ? new Date(record.PunchOut).toLocaleTimeString() : "-"}</td>
                                <td className="border-b border-gray-200 px-4 py-2">{record.PunchIn ? new Date(record.PunchIn).toLocaleDateString() : "-"}</td>
                                <td className="border-b border-gray-200 px-4 py-2">{record.workedHours}</td>
                            </tr>
                        ))}
                    </tbody>    
                </table>
                </div>
            </div>
        </>
    );
}

// Export CalendarDb wrapped in ErrorBoundary
export default function CalendarDbWithBoundary(props) {
    return (
        <ErrorBoundary>
            <CalendarDb {...props} />
        </ErrorBoundary>
    );
}