import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { query, where, getDocs, collection } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { Container, Typography, List, ListItem, ListItemText, Paper, CircularProgress } from '@mui/material';
import { auth, database } from '../config/firebase'; // Ensure correct Firebase config import

interface UserProfile {
  firstname: string;
  lastname: string;
  email: string;
  address: string;
  phone: number;
  role: string;
  subscription_id: string;
  vendor_specific_data: string;
  date_joined: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // For loading state

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        try {
          // Query Firestore for the user document based on email
          const usersRef = collection(database, 'Users');
          const q = query(usersRef, where('email', '==', authUser.email)); // Query where email matches
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]; // Assume unique email
            const data = userDoc.data() as UserProfile;
            setUserProfile(data);
          } else {
            console.log('No user document found in Firestore.');
          }
        } catch (error) {
          console.error('Error fetching user document from Firestore:', error);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('User is signed out.');
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      {userProfile ? (
        <Paper elevation={3} style={{ padding: '20px', marginTop: '20px', marginBottom: '20px' }}>
            <Typography variant="h4" gutterBottom>
                User Profile
            </Typography>
            <Typography variant="h4" style={{ marginTop: "20px" }}>
                {userProfile.firstname} {userProfile.lastname}
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
                {userProfile.role}
            </Typography>
            <List dense>
                <ListItem>
                <ListItemText primary="Email" secondary={userProfile.email} />
                </ListItem>
                <ListItem>
                {/* <ListItemText 
                    primary="Exams Taken" 
                    secondary={examsTaken.map((exam) => (
                    <Typography key={exam._id}>
                        {`Exam ${exam.examNumber}: ${format(parseISO(exam.date), 'dd/MM/yyyy')}`}
                    </Typography>
                    ))}
                /> */}
                </ListItem>
                <ListItem>
                <ListItemText primary="Date Joined">{userProfile.date_joined}</ListItemText>
                </ListItem>
            </List>
        </Paper>
      ) : (
        <Typography variant="h6">No user profile found.</Typography>
      )}
    </Container>
  );
}
