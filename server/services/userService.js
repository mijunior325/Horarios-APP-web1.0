import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "../config/FIrebaseConfig";

// this is used to find a user by their email
export const findUserByEmail = async (email) => {
    // attemprt to get the user document from Firestore
  try {
    console.log("Searching for user with email:", email);
    const userDoc = await getDoc(doc(db, "users", email)); // create variable to store the info of found user
    //condition to check if user exists
    if (userDoc.exists()) {
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
