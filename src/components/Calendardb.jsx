import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'; 
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { getTimeShifts } from "../../server/services/timeShiftService";
import { getAllUsers } from "../../server/services/userService";
import DeleteUserButton from './DeleteUserButton';

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

function CalendarDb() {
    const { userData } = useAuth() || {};
    const [records, setRecords] = useState([]);
    const [users, setUsers] = useState([]);
    const [usersError, setUsersError] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState("");

    const columnDefs = useMemo(() => [
        { headerName: "ID", field: "id", sortable: true, filter: true },
        { headerName: "Usuario", field: "username", sortable: true, filter: true },
        { headerName: "Entrada", field: "PunchIn", sortable: true, filter: true },
        { headerName: "Entrada lunch", field: "LunchIn", sortable: true, filter: true },
        { headerName: "Salida lunch", field: "LunchOut", sortable: true, filter: true },
        { headerName: "Salida", field: "PunchOut", sortable: true, filter: true },
    ], []);

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
                const normalized = shifts.map(s => ({
                    ...s,
                    PunchIn: s.PunchIn && s.PunchIn.toDate ? s.PunchIn.toDate() : s.PunchIn,
                    PunchOut: s.PunchOut && s.PunchOut.toDate ? s.PunchOut.toDate() : s.PunchOut,
                    LunchIn: s.LunchIn && s.LunchIn.toDate ? s.LunchIn.toDate() : s.LunchIn,
                    LunchOut: s.LunchOut && s.LunchOut.toDate ? s.LunchOut.toDate() : s.LunchOut,
                }));

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