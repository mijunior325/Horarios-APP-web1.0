import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'; 
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';

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

    const columnDefs = useMemo(() => [
        { headerName: "ID", field: "id", sortable: true, filter: true },
        { headerName: "Usuario", field: "username", sortable: true, filter: true },
        { headerName: "Entrada", field: "PunchIn", sortable: true, filter: true },
        { headerName: "Entrada lunch", field: "LunchIn", sortable: true, filter: true },
        { headerName: "Salida lunch", field: "LunchOut", sortable: true, filter: true },
        { headerName: "Salida", field: "PunchOut", sortable: true, filter: true },
    ], []);

    useEffect( () => {
        async function fetchData() {
            try {
                let shifts = [];
                //testing user data
                console.log("userData in CalendarDb:", userData);

                if (userData && userData.role === "admin") {
                    // Admin: fetch all
                    shifts = await getTimeShifts({});
                } else if (userData && userData.username) {
                    // Regular user: fetch only their records
                    shifts = await getTimeShifts({ name: userData.username });
                }

                setRecords(shifts);
            } catch (error) {
                console.error("Error fetching time shifts:", error);
            }
        }

        fetchData();
    }, [userData]);

    return (
        <div className="ag-theme-my-dark-theme" style={{ height: 600, width: '100%', marginTop: 40 }}>
            <AgGridReact
                modules={[AllCommunityModule]}
                rowData={records}
                columnDefs={columnDefs}
                pagination={true}
                paginationPageSize={10}
            />
        </div>
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