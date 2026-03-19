import { doc, setDoc, getDoc, Timestamp, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../config/FirebaseConfig";
import { getAllUsers } from "./userService";

// Crea un nuevo registro de turno para el userId dado.
// El turno se marca como abierto con una marca de tiempo PunchIn; todos los
// demás campos (punch out, tiempos de almuerzo) se inicializan en null.
// Se usa un ID compuesto de userId y el tiempo actual
// para reducir la probabilidad de colisiones.
const createTimeShift = async (userId) => {
    try {
        const timeShiftData = {
            userId,
            PunchIn: Timestamp.now(),
            PunchOut: null,
            LunchIn: null,
            LunchOut: null,
            lunchOpen: false,
            open: true
        };
        await setDoc(
            doc(db, "timeShifts", `${userId}_${Date.now()}`),
            timeShiftData
        );
        return { ...timeShiftData };
    } catch (error) {
        console.error("Error creating time shift:", error);
        throw error;
    }
};

export { createTimeShift };

// Marca el período de almuerzo como iniciado para un documento de turno.
// Escribe la hora LunchIn proporcionada (convertida a un Timestamp de Firestore)
// y activa la bandera lunchOpen. La opción merge asegura que solo
// actualicemos campos específicos sin sobrescribir los demás.
const openLunchShift = async (timeShiftId, LunchIn) => {
    try {
        const timeShiftRef = doc(db, "timeShifts", timeShiftId);
        await setDoc(
            timeShiftRef,
            {
                LunchIn: Timestamp.fromDate(new Date(LunchIn)),
                lunchOpen: true
            },
            { merge: true }
        );
        const updatedDoc = await getDoc(timeShiftRef);
        return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
        console.error("Error opening lunch shift:", error);
        throw error;
    }
};

export { openLunchShift };

// Completa el período de almuerzo registrando la hora LunchOut y
// estableciendo lunchOpen en false. También devuelve el documento actualizado
// para que quienes llamen puedan reflejar el cambio inmediatamente.
const closeLunchShift = async (timeShiftId, LunchOut) => {
    try {
        const timeShiftRef = doc(db, "timeShifts", timeShiftId);
        await setDoc(
            timeShiftRef,
            {
                LunchOut: Timestamp.fromDate(new Date(LunchOut)),
                lunchOpen: false
            },
            { merge: true }
        );
        const updatedDoc = await getDoc(timeShiftRef);
        return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
        console.error("Error closing lunch shift:", error);
        throw error;
    }
};

export { closeLunchShift };

// Finaliza un turno registrando la hora PunchOut y marcando
// el turno como cerrado. Antes de hacerlo, realiza comprobaciones de validez:
//   * el documento debe existir
//   * el período de almuerzo no debe seguir abierto
// Estas comprobaciones previenen datos incompletos o estados inconsistentes.
const closeTimeShift = async (timeShiftId, PunchOut) => {
    try {
        const timeShiftRef = doc(db, "timeShifts", timeShiftId);

        const currentDoc = await getDoc(timeShiftRef);
        if (!currentDoc.exists()) {
            throw new Error("Time shift not found.");
        } else if (currentDoc.data().lunchOpen) {
            throw new Error("Cannot close time shift while lunch is open.");
        }

        await setDoc(
            timeShiftRef,
            {
                PunchOut: Timestamp.fromDate(new Date(PunchOut)),
                open: false
            },
            { merge: true }
        );
        const updatedDoc = await getDoc(timeShiftRef);
        return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
        console.error("Error closing time shift:", error);
        throw error;
    }
};

export { closeTimeShift };

// Recupera un único documento de turno por su ID de Firestore.
// Devuelve null si el documento no existe. Útil para operaciones de edición/visualización
// donde el ID ya se conoce.
const getTimeShiftById = async (timeShiftId) => {
    try {
        const timeShiftRef = doc(db, "timeShifts", timeShiftId);
        const timeShiftDoc = await getDoc(timeShiftRef);
        if (timeShiftDoc.exists()) {
            return { id: timeShiftDoc.id, ...timeShiftDoc.data() };
        } else {
            console.log("No such time shift found.");
            return null;
        }
    } catch (error) {
        console.error("Error getting time shift by ID:", error);
        throw error;
    }
};

export { getTimeShiftById };

// Busca el turno actualmente abierto (aún no cerrado) para un usuario.
// Se usa durante los flujos de punch-in/punch-out para determinar si el
// usuario tiene una sesión activa. Consulta open=true y devuelve la
// primera coincidencia (debería haber solo un turno activo por usuario).
const getOpenTimeShiftByUser = async (userId) => {
    try {
        const timeShiftsRef = collection(db, "timeShifts");
        const q = query(
            timeShiftsRef,
            where("userId", "==", userId),
            where("open", "==", true)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const timeShiftDoc = querySnapshot.docs[0];
            return { id: timeShiftDoc.id, ...timeShiftDoc.data() };
        } else {
            console.log("No open time shift found for user.");
            return null;
        }
    } catch (error) {
        console.error("Error getting open time shift by user:", error);
        throw error;
    }
};

export { getOpenTimeShiftByUser };

// Recupera una lista de turnos opcionalmente filtrada por ID de usuario,
// nombre de usuario y/o rango de fechas. Si se suministra un nombre de usuario
// sin un userId correspondiente, se realiza una búsqueda mediante getAllUsers()
// para encontrar el ID del usuario coincidente. La consulta se arma
// automáticamente según los filtros proporcionados. Después de obtener los turnos
// crudos, enriquecemos cada registro con un nombre de usuario para propósitos
// de visualización buscando la información del usuario correspondiente.
const getTimeShifts = async ({ userId, username, startDate, endDate }) => {
    try {
        const timeShiftsRef = collection(db, "timeShifts");
        const filters = [];

        if (username && !userId) {
            const allUsers = await getAllUsers();
            const match = allUsers.find(u => u.username === username || u.name === username || u.email === username);
            if (match) {
                userId = match.id;
            } else {
                return [];
            }
        }

        if (userId) {
            filters.push(where("userId", "==", userId));
        }
        if (startDate) {
            filters.push(where("PunchIn", ">=", Timestamp.fromDate(new Date(startDate))));
        }
        if (endDate) {
            filters.push(where("PunchIn", "<=", Timestamp.fromDate(new Date(endDate))));
        }

        const q = filters.length > 0 ? query(timeShiftsRef, ...filters) : query(timeShiftsRef);
        const querySnapshot = await getDocs(q);
        const shifts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const usersList = await getAllUsers();
        const usersMap = new Map(usersList.map(u => [u.id, u]));
        return shifts.map(s => ({
            ...s,
            username: usersMap.get(s.userId)?.username || usersMap.get(s.userId)?.name || s.userId
        }));
    } catch (error) {
        console.error("Error getting time shifts:", error);
        throw error;
    }
};

export { getTimeShifts };

// Elimina todos los turnos asociados a un userId específico.
// Primero consulta todos los documentos de timeShifts para el usuario,
// luego elimina cada uno individualmente. Esto es necesario porque
// Firestore no soporta eliminación masiva directa desde el cliente.
const deleteTimeShiftsByUserId = async (userId) => {
    try {
        const timeShiftsRef = collection(db, "timeShifts");
        const q = query(timeShiftsRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`Deleted ${deletePromises.length} time shifts for user ${userId}`);
        return deletePromises.length;
    } catch (error) {
        console.error("Error deleting time shifts by user ID:", error);
        throw error;
    }
};

export { deleteTimeShiftsByUserId };

