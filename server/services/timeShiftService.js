// Import necessary Firestore functions for document operations and timestamps
import { doc, setDoc, getDoc, Timestamp, collection, query, where, getDocs  } from "firebase/firestore";
// Import the Firestore database instance from your config
import { db } from "../config/FirebaseConfig";
import { getAllUsers } from "./userService";


// Function to create a new time shift document in Firestore
const createTimeShift = async (userId) => {
    try {
        const timeShiftData = {
            userId,
            PunchIn: Timestamp.now(), // Set to current time
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

// Export the createTimeShift function
export { createTimeShift};

const openLunchShift = async (timeShiftId, LunchIn) => {
    try {
        // Reference to the specific time shift document
        const timeShiftRef = doc(db, "timeShifts", timeShiftId);

        // Update the LunchIn time and set lunchOpen to true
        await setDoc(
            timeShiftRef,
            {
                LunchIn: Timestamp.fromDate(new Date(LunchIn)), // Update LunchIn timestamp
                lunchOpen: true // Mark lunch as open
            },
            { merge: true } // Merge with existing document fields
        );
        // Retrieve the updated document
        const updatedDoc = await getDoc(timeShiftRef);
        // Return the updated time shift data
        return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
        // Log and rethrow any errors
        console.error("Error opening lunch shift:", error);
        throw error;
    }
};

// Export the openLunchShift function
export { openLunchShift };  

const closeLunchShift = async (timeShiftId, LunchOut) => {
    try {
        // Reference to the specific time shift document
        const timeShiftRef = doc(db, "timeShifts", timeShiftId);

        // Update the LunchOut time and set lunchOpen to false
        await setDoc(
            timeShiftRef,
            {
                LunchOut: Timestamp.fromDate(new Date(LunchOut)), // Update LunchOut timestamp
                lunchOpen: false // Mark lunch as closed
            },
            { merge: true } // Merge with existing document fields
        );
        // Retrieve the updated document
        const updatedDoc = await getDoc(timeShiftRef);
        // Return the updated time shift data
        return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
        // Log and rethrow any errors
        console.error("Error closing lunch shift:", error);
        throw error;
    }
};

// Export the closeLunchShift function
export { closeLunchShift };

// Function to close an existing time shift by updating its PunchOut and open status
const closeTimeShift = async (timeShiftId, PunchOut) => {
    try {
        // Reference to the specific time shift document
        const timeShiftRef = doc(db, "timeShifts", timeShiftId);

        const currentDoc = await getDoc(timeShiftRef);
        if (!currentDoc.exists()) {
            throw new Error("Time shift not found.");
        } else if (currentDoc.data().lunchOpen) {
            throw new Error("Cannot close time shift while lunch is open.");
        }

        // Update the PunchOut time and set open to false (close the shift)
        await setDoc(
            timeShiftRef,
            {
                PunchOut: Timestamp.fromDate(new Date(PunchOut)), // Update PunchOut timestamp
                open: false // Mark the shift as closed
            },
            { merge: true } // Merge with existing document fields
        );
        // Retrieve the updated document
        const updatedDoc = await getDoc(timeShiftRef);
        // Return the updated time shift data
        return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
        // Log and rethrow any errors
        console.error("Error closing time shift:", error);
        throw error;
    }
};

// Export the closeTimeShift function
export { closeTimeShift };

// Function to get a time shift document by its ID
const getTimeShiftById = async (timeShiftId) => {
    try {
        // Reference to the specific time shift document
        const timeShiftRef = doc(db, "timeShifts", timeShiftId);
        // Fetch the document from Firestore
        const timeShiftDoc = await getDoc(timeShiftRef);
        if (timeShiftDoc.exists()) {
            // If the document exists, return its data
            return { id: timeShiftDoc.id, ...timeShiftDoc.data() };
        } else {
            // If not found, log and return null
            console.log("No such time shift found.");
            return null;
        }
    } catch (error) {
        // Log and rethrow any errors
        console.error("Error getting time shift by ID:", error);
        throw error;
    }
};

// Export the getTimeShiftById function
export { getTimeShiftById };

// Function to get the open (active) time shift for a specific user
const getOpenTimeShiftByUser = async (userId) => {
    try {
        // Reference to the 'timeShifts' collection
        const timeShiftsRef = collection(db, "timeShifts");
        // Create a query to find time shifts for the user that are still open
        const q = query(
            timeShiftsRef,
            where("userId", "==", userId), // Filter by userId
            where("open", "==", true) // Only open shifts
        );
        // Execute the query
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            // If there is at least one open shift, return the first one
            const timeShiftDoc = querySnapshot.docs[0];
            return { id: timeShiftDoc.id, ...timeShiftDoc.data() };
        } else {
            // If no open shift found, log and return null
            console.log("No open time shift found for user.");
            return null;
        }
    } catch (error) {
        // Log and rethrow any errors
        console.error("Error getting open time shift by user:", error);
        throw error;
    }
};

// Export the getOpenTimeShiftByUser function
export { getOpenTimeShiftByUser };

// Function to get time shifts filtered by optional userId, username and/or date range
const getTimeShifts = async ({ userId, username, startDate, endDate }) => {
    try {
        const timeShiftsRef = collection(db, "timeShifts");
        const filters = [];

        // resolve username to userId if necessary
        if (username && !userId) {
            const allUsers = await getAllUsers();
            const match = allUsers.find(u => u.username === username || u.name === username || u.email === username);
            if (match) {
                userId = match.id;
            } else {
                // no user matches, return empty list
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

        // attach username from users collection
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

// Export the getTimeShifts function
export { getTimeShifts };

