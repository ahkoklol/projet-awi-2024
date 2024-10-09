import React from "react";
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Badge } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import { Link } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from 'firebase/auth';
import useAuth from "../hooks/useAuth";
import { toast } from "react-toastify";
import { useBasket } from "../context/BasketContext";

const Navbar: React.FC = () => {
  const user = useAuth();  // Hook to check if user is authenticated
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { basketItems } = useBasket();  // To get the count of basket items

  const handleClick: React.MouseEventHandler = (event) => {
    setAnchorEl(event.currentTarget as HTMLElement);
  };

  const handleClose: React.MouseEventHandler = () => {
    setAnchorEl(null);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('User signed out');
      toast.success('Goodbye!');
    } catch (error) {
      console.log('User not signed out', error);
    }
  };

  return (
    <AppBar position="fixed" sx={{ backgroundColor: 'rgb(19, 38, 77)' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" component={Link} to="/" sx={{ color: 'white', '&:hover': { color: 'white' } }}>
          Fastclick Firestore
        </Typography>

        <div>
          {/* if not a user (=client) show the basket */}
          {!user && (
          <IconButton component={Link} to="/basket" color="inherit">
            <Badge badgeContent={basketItems.length} color="error">
              <ShoppingBasketIcon />
            </Badge>
          </IconButton>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
