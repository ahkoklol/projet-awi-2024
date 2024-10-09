import { AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { toast } from 'react-toastify';

interface AppBarComponentProps {
  handleDrawerToggle: () => void;
}

export default function AppBarComponent({ handleDrawerToggle }: AppBarComponentProps) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Goodbye!');
    } catch (error) {
      console.log('Error during logout', error);
    }
  };

  return (
    <AppBar position="fixed" sx={{ backgroundColor: 'rgb(19, 38, 77)', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ color: 'white', '&:hover': { color: 'white' } }}>
          Fastclick Firestore
        </Typography>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          onClick={handleLogout}
          sx={{ color: 'white', '&:hover': { color: 'white' } }}
        >
          Logout
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
