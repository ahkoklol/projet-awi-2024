import React from "react";
import { AppBar, Toolbar, Typography, IconButton, Badge } from "@mui/material";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useLocation } from "react-router-dom";

const Navbar: React.FC = () => {
  const user = useAuth();  // Hook to check if user is authenticated
  const navigate = useLocation();  // To get the current location

  return (
    <AppBar position="fixed" sx={{ backgroundColor: 'rgb(240, 54, 0)' }}>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography variant="h6" component={Link} to="/" sx={{ color: 'white', '&:hover': { color: 'white' } }}>
          Fastclick Firestore
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
