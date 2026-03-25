const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Firebase Admin SDK
// You need to download the service account key from Firebase Console
// and place it in the server directory as 'serviceAccountKey.json'
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: 'https://apolloscheduler-af4c9-default-rtdb.firebaseio.com' // If using Realtime Database
});

const db = admin.firestore();
const auth = admin.auth();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/delete-user', async (req, res) => {
  const { userId } = req.body;
  try {
    // Delete all time shifts for the user
    const timeShiftsRef = db.collection('timeShifts');
    const querySnapshot = await timeShiftsRef.where('userId', '==', userId).get();
    const deletePromises = querySnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    console.log(`Deleted ${deletePromises.length} time shifts for user ${userId}`);

    // Delete from Firestore
    await db.collection('users').doc(userId).delete();
    console.log('User deleted from Firestore:', userId);

    // Delete from Firebase Auth
    await auth.deleteUser(userId);
    console.log('User deleted from Auth:', userId);

    res.status(200).json({ message: 'User and records deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});