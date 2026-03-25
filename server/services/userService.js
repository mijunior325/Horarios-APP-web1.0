import { doc, setDoc, getDoc, getDocs, collection, Timestamp, deleteDoc, query, where } from "firebase/firestore";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { auth, db } from "../config/FirebaseConfig";
import { deleteTimeShiftsByUserId } from "./timeShiftService";

// this is used to find a user by their email
export const findUserByEmail = async (email) => {
    // attempt to get the user document from Firestore
  try {
    console.log("Searching for user with email:", email);
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      console.log("User found:", userDoc.data());
      const userData = { id: userDoc.id, ...userDoc.data() };
      return userData;
    } else {
      console.log("No such user found.");
      return null;
    }
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
}

// this is used to find a user by their id

export const findUserById = async (id) => {
  try {
    console.log("Searching for user with ID:", id);
    const userDoc = await getDoc(doc(db, "users", id));
    if (userDoc.exists()) {
      console.log("User found:", userDoc.data());
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      console.log("No such user found.");
      return null;
    }
  } catch (error) {
    console.error("Error finding user by ID:", error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return users;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
};

// Create a new user in Firebase Auth and Firestore
export const createUser = async ({ name, email, position, dept, password }) => {
  try {
    // Generate a temporary password if not provided
    const tempPassword = password || Math.random().toString(36).slice(-10);

    const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
    const uid = userCredential.user.uid;

    const isAdminPosition = typeof position === "string" && /admin/i.test(position);
    const role = isAdminPosition ? "admin" : "user";

    await setDoc(doc(db, "users", uid), {
      id: uid,
      name,
      email,
      position,
      dept,
      role,
      createdAt: Timestamp.now(),
    });

    console.log("New user saved to Firestore (users/" + uid + ")");

    // Return the generated Firebase UID, similar to how Firebase generates IDs
    return { id: uid, password: tempPassword };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Delete a user from Firestore and Firebase Auth (requires re-authentication for Auth)
export const deleteUserById = async (userId) => {
  try {
    // Delete all time shifts for the user
    await deleteTimeShiftsByUserId(userId);
    console.log("Time shifts deleted for user:", userId);

    // Delete from Firestore
    await deleteDoc(doc(db, "users", userId));
    console.log("User deleted from Firestore:", userId);

    // Note: Deleting from Firebase Auth requires the user to be signed in or admin SDK
    // For client-side, it's not straightforward. This only deletes from Firestore and time shifts.
    // To delete from Auth, use Firebase Admin SDK on server-side.

    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
