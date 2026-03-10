import { doc, setDoc, getDoc, getDocs, collection, Timestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../config/FirebaseConfig";

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

// Create a new user in Firebase Auth and Firestore
export const createUser = async ({ name, email, position, password }) => {
  try {
    // Generate a temporary password if not provided
    const tempPassword = password || Math.random().toString(36).slice(-10);

    const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
    const uid = userCredential.user.uid;

    const role = (position || "").toLowerCase() === "admin" ? "admin" : "user";

    await setDoc(doc(db, "users", uid), {
      name,
      email,
      position,
      role,
      createdAt: Timestamp.now(),
    });

    return { uid, password: tempPassword };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};
