import React from "react";
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link } from "react-router-dom";
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { auth } from "../config/firebase";
import { signOut } from 'firebase/auth';
import useAuth from "../hooks/useAuth";
import { toast } from "react-toastify";

const Navbar: React.FC = () => {
    const user = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick: React.MouseEventHandler = (event) => {
    setAnchorEl(event.currentTarget as HTMLElement); // Cast event.currentTarget to HTMLElement
  };

  const handleClose: React.MouseEventHandler = () => {
    setAnchorEl(null);
  };

  const logout = async () => {
        try {
            await signOut(auth);
            console.log('User signed out');
            toast.success('Goodbye!')
        } catch (error) {
            console.log('User not signed out', error);
        }
    }

  return (
    <AppBar position="fixed" sx={{ backgroundColor: 'rgb(19, 38, 77)' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" component={Link} to="/" sx={{ color: 'white', '&:hover': {color: 'white',  } }}>
          Fastclick Firestore
        </Typography>
        
        <AccountCircleIcon component={Link} to="profile/" />
        <>
          <IconButton color="inherit" onClick={handleClick}>
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
            <MenuItem component={Link} to="/" onClick={handleClose} sx={{ color: 'black' }}>Home</MenuItem>
            {user && (<MenuItem component={Link} to={"/profile"} onClick={handleClose} sx={{ color: 'black' }}>Profile</MenuItem>)}
            {!user && (<MenuItem component={Link} to="/login" onClick={handleClose} sx={{ color: 'black' }}>Login</MenuItem>)}
            {!user && (<MenuItem component={Link} to="/signup" onClick={handleClose} sx={{ color: 'black' }}>Signup</MenuItem>)}
            {user && (<MenuItem component={Link} to="/" onClick={logout} sx={{ color: 'black' }}>Logout</MenuItem>)}
          </Menu>
        </>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;