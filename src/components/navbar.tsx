import React from "react";
import { AppBar, Toolbar, Typography, IconButton, Badge } from "@mui/material";
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useBasket } from "../context/BasketContext";

const Navbar: React.FC = () => {
  const user = useAuth();  // Hook to check if user is authenticated
  const { basketItems } = useBasket();  // To get the count of basket items

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
