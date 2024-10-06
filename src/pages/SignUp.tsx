import { FormEvent, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
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
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // Validate that a role has been selected
    if (!role) {
      toast.error('Please select a role (buyer or seller)');
      return; // Prevent form submission if no role is selected
    }

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
        role: role, // Role chosen from 'buyer' or 'seller'
        subscription_id: '/collection/Subscription', // will be added later when choosing a subscription
        seller_specific_data: role === 'seller' ? {} : '', // For sellers, add specific data if needed
      });

      toast.success('User registered successfully!');
      console.log('User registered successfully:', user);
      navigate('/'); // Only navigate if registration is successful
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '50px',
          }}
        >
          <Avatar sx={{ m: 1, backgroundColor: 'rgb(62, 86, 124)' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign up
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
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

              {/* Radio Buttons for selecting Role */}
                <Grid item xs={12} style={{ display: 'flex', alignItems: 'center' }}>
                  <FormLabel component="legend" style={{ marginRight: '10px' }}>Role</FormLabel>
                  <RadioGroup
                    aria-label="role"
                    name="role"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    row
                  >
                    <FormControlLabel value="buyer" control={<Radio />} label="Buyer" />
                    <FormControlLabel value="Seller" control={<Radio />} label="Seller" />
                  </RadioGroup>
                </Grid>

            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                marginTop: '10px',
                backgroundColor: 'rgb(61, 89, 171)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgb(51, 79, 161)', borderColor: 'rgb(75, 184, 185)' },
              }}
              disabled={isLoading}
            >
              Sign Up
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link href="/login" variant="body2" sx={{ color: 'red', '&:hover': { color: 'red' } }}>
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
      <ToastContainer />
    </ThemeProvider>
  );
}

export default SignUp;
