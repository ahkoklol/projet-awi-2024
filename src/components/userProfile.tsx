import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { query, where, getDocs, collection } from 'firebase/firestore';
import { auth, database } from '../config/firebase'; // Ensure correct Firebase config import

const UserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState({ firstName: '', lastName: '' });

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        console.log("Authenticated user:", authUser);

        // User is signed in, set the user state
        setUser(authUser);
        
        try {
          // Query Firestore to fetch the user's document based on their email
          const usersRef = collection(database, 'Users'); // Reference to Users collection
          const q = query(usersRef, where('email', '==', authUser.email)); // Query where email matches
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]; // Assuming email is unique, take the first document
            const data = userDoc.data();
            console.log("Fetched user data from Firestore:", data);

            // Set the fetched data into local state
            setUserData({
              firstName: data?.firstname || 'No First Name',
              lastName: data?.lastname || 'No Last Name',
            });
          } else {
            console.log("No user document found in Firestore.");
          }
        } catch (error) {
          console.error("Error fetching user document from Firestore:", error);
        }
      } else {
        console.log("User is signed out.");
        // Reset state if the user is logged out
        setUser(null);
        setUserData({ firstName: '', lastName: '' });
      }
    });

    // Clean up the auth listener when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <header>
      {user ? (
        <div>
          Welcome, {userData.firstName} {userData.lastName}
        </div>
      ) : (
        <div>Please log in</div>
      )}
    </header>
  );
};

export default UserProfile;
