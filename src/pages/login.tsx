import { useState } from 'react';
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
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase'; // Make sure to import your Firebase config
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

  // Sign in function for email/password authentication
  const handleSubmit = async (event: any) => {
    event.preventDefault(); // The form will be submitted using the default browser behavior (causing a page reload). The page reload would interrupt the React state and component lifecycle, causing the entire page to reload, potentially losing any state or context you had before.
    setIsLoading(true); // Disable the button while logging in

    try {
      // Firebase authentication with email and password
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login successful!');
      console.log('Login successful!');
      navigate('/');
    } catch (error: any) {
      switch (error.code) {
        case 'auth/user-not-found':
          toast.error('No user found with this email.');
          break;
        case 'auth/wrong-password':
          toast.error('Incorrect password.');
          break;
        case 'auth/invalid-email':
          toast.error('Invalid email format.');
          break;
        default:
          toast.error('Failed to log in. Please try again.');
      }
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false); // Re-enable the button after the process
    }
  };

  return (
    <ThemeProvider theme={createTheme()}>
      <Container component="main" maxWidth="xs" sx={{ marginTop: '100px' }}>
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
            Log in
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
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
                  disabled={isLoading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isLoading}
                />
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
                '&:hover': {
                  backgroundColor: 'rgb(51, 79, 161)',
                  borderColor: 'rgb(75, 184, 185)',
                },
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Logging In...' : 'Log in'}
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link
                  href="/signup"
                  variant="body2"
                  sx={{ color: 'red', '&:hover': { color: 'red' } }}
                >
                  Don't have an account? Sign up
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
