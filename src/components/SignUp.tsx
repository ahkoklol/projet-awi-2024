import { FormEvent, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth, database } from '../config/firebase'; // Import Firestore and Auth config
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore'; // Firestore functions for adding the user to Firestore

function SignUp() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setIsLoading(true);

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // POST request: add user details to Firestore 'Users' collection
      const usersCollectionRef = collection(database, 'Users');
      await addDoc(usersCollectionRef, {
        email: user.email,
        firstname: name,
        lastname: surname,
        phone: phone,
        address: address,
        role: role,
        seller_specific_data: role === 'seller' ? {} : '', 
      });

      toast.success('Cashier registered successfully!');
      console.log('Cashier registered successfully:', user);
    } catch (error: any) {
      // Handle specific Firebase errors during signup
      switch (error.code) {
        case 'auth/email-already-in-use':
          toast.error('This email is already registered.');
          break;
        case 'auth/invalid-email':
          toast.error('Invalid email format.');
          break;
        case 'auth/weak-password':
          toast.error('Password is too weak. Please use a stronger password.');
          break;
        default:
          toast.error('Failed to register. Please try again.');
          break;
      }
      console.error('Error registering user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={createTheme()}>
  <Container component="main" maxWidth="xs">
    <CssBaseline />
    <Box
      sx={{
        marginTop: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: "50px",
      }}
    >
      {/* 🔹 AVATAR AVEC COULEUR BLEU MARINE */}
      <Avatar sx={{ m: 1, backgroundColor: "rgb(19, 38, 77)", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)" }}>
        <LockOutlinedIcon />
      </Avatar>

      {/* 🔹 TITRE STYLISÉ */}
      <Typography
        component="h1"
        variant="h5"
        sx={{
          fontWeight: "bold",
          color: "rgb(19, 38, 77)",
          textAlign: "center",
        }}
      >
        Create Employee Account
      </Typography>

      {/* 🔹 CONTAINER FORMULAIRE AVEC STYLISATION */}
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit}
        sx={{
          mt: 3,
          padding: "20px",
          border: "2px solid rgb(19, 38, 77)",
          borderRadius: "10px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
          transition: "transform 0.3s ease-in-out",
          "&:hover": { transform: "scale(1.02)" },
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              autoComplete="given-name"
              name="firstName"
              required
              fullWidth
              id="firstName"
              label="First Name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
              value={surname}
              onChange={(event) => setSurname(event.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="phone"
              label="Phone"
              name="phone"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="address"
              label="Address"
              name="address"
              autoComplete="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </Grid>

          {/* 🔹 RADIO BUTTONS AVEC STYLE */}
          <Grid item xs={12} sx={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
            <FormLabel component="legend" sx={{ color: "rgb(19, 38, 77)", fontWeight: "bold" }}>
              New employee role
            </FormLabel>
            <RadioGroup
              aria-label="role"
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              row
            >
              <FormControlLabel value="admin" control={<Radio sx={{ color: "rgb(19, 38, 77)" }} />} label="Admin" />
              <FormControlLabel value="cashier" control={<Radio sx={{ color: "rgb(19, 38, 77)" }} />} label="Cashier" />
            </RadioGroup>
          </Grid>
        </Grid>

        {/* 🔹 BOUTON AVEC STYLE & ANIMATION */}
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: 3 }}>
          <Button
            type="submit"
            variant="contained"
            sx={{
              backgroundColor: "rgb(19, 38, 77)",
              color: "white",
              "&:hover": { backgroundColor: "rgb(15, 30, 60)" },
              width: "200px",
            }}
            disabled={isLoading}
          >
            Create Account
          </Button>
        </Box>
      </Box>
    </Box>
  </Container>
  <ToastContainer />
</ThemeProvider>
  );
}

export default SignUp;
