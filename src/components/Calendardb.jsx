import  { AllCommunityModules } from '@ag-grid-community/all-modules';
import { AgGridReact } from '@ag-grid-community/react';
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { getTimeShifts, getTimeShiftById } from '../../server/services/timeShiftService';

export default function CalendarDb() {
    const { userData } = useAuth() || {};
    const [records, setRecords] = useState([]);

    const columnDefs = useMemo(() => [
        { headerName: "ID", field: "id", sortable: true, filter: true },
        { headerName: "Usuario", field: "username", sortable: true, filter: true },
        { headerName: "Entrada", field: "PunchIn", sortable: true, filter: true },
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