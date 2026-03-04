import { doc, setDoc, getDoc, Timestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/FirebaseConfig";
import { getAllUsers } from "./userService";

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

