import React from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {

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
