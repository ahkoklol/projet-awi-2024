import { Grid, Typography, Button, List, ListItem, ListItemText, TextField, CircularProgress, Container } from '@mui/material';
import { useState, useEffect } from 'react';
import { useBasket } from '../context/BasketContext';
import useUserProfile from '../hooks/useUserProfile';
import { useNavigate } from 'react-router-dom';

export default function Checkout() {
  const { basketItems, total, itemCount, clearBasket } = useBasket();
  const { userProfile, loading } = useUserProfile();
  const navigate = useNavigate();

  // State for form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  const [error, setError] = useState('');

  // Update form fields when userProfile is loaded
  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstname || '');
      setLastName(userProfile.lastname || '');
      setAddress(userProfile.address || '');
      setPhone(userProfile.phone ? String(userProfile.phone) : '');
      setEmail(userProfile.email || '');
      setCity(userProfile.city || '');
      setPostalCode(userProfile.postal_code ? String(userProfile.postal_code) : '');
      setCountry(userProfile.country || '');
    }
  }, [userProfile]);

  // Validate form and navigate
  const handleCheckout = () => {
    if (!firstName || !lastName || !address || !phone || !email || !city || !postalCode || !country) {
      setError('Please fill in all the required fields.');
      return;
    }
    setError(''); // Clear error if everything is filled
    clearBasket();
    navigate(`/home`);
  };

  return (
    <Grid container sx={{ marginTop: '40px', marginBottom: '-20px' }} spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h3" gutterBottom sx={{ color: 'black' }}>
          Order Summary and Delivery Address
        </Typography>
      </Grid>

      {/* Left-side Info */}
      <Grid
        item
        xs={12}
        md={5}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          borderRight: { sm: 'none', md: '1px solid' },
          borderColor: 'divider',
          padding: 4,
        }}
      >
        {itemCount === 0 ? (
          <Container>
            <Typography>Your cart is empty. Add some items to proceed to checkout.</Typography>
          </Container>
        ) : (
          <>
          <Typography variant="h5" gutterBottom sx={{ color: 'black', marginTop: '40px' }}>
            Order review - {itemCount} items
          </Typography>
            <List disablePadding>
              {basketItems.map((item) => (
                <ListItem key={item.id} sx={{ py: 1, px: 0 }}>
                  <ListItemText sx={{ mr: 2, color: 'black' }} primary={item.name} />
                  <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'black' }}>
                    ${item.price.toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Total
            </Typography>
            <Typography variant="h4" gutterBottom sx={{ color: 'black' }}>
              ${total.toFixed(2)}
            </Typography>
          </>
        )}
      </Grid>

      {/* Right-side Address Form */}
      <Grid item xs={12} md={7} sx={{ padding: 4 }}>
        {loading ? (
          <Grid container spacing={3} justifyContent="center" alignItems="center">
            <CircularProgress />
            <Typography>Loading user data...</Typography>
          </Grid>
        ) : (
          <Grid container spacing={3} direction="column">
            <Grid item xs={12}>
              <TextField
                label="First Name"
                variant="outlined"
                required
                fullWidth
                size="small"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Last Name"
                variant="outlined"
                required
                fullWidth
                size="small"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address Line 1"
                variant="outlined"
                required
                fullWidth
                size="small"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Phone Number"
                variant="outlined"
                required
                fullWidth
                size="small"
                value={phone}
                inputMode="numeric"
                onChange={(e) => setPhone(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                variant="outlined"
                required
                fullWidth
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="City"
                variant="outlined"
                required
                fullWidth
                size="small"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Postal Code"
                variant="outlined"
                required
                fullWidth
                size="small"
                value={postalCode}
                inputMode="numeric"
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Country"
                variant="outlined"
                required
                fullWidth
                size="small"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </Grid>
          </Grid>
        )}

        {error && (
          <Typography color="error" sx={{ marginTop: '10px' }}>
            {error}
          </Typography>
        )}

        <Button variant="contained" color="primary" sx={{ marginTop: '30px' }} onClick={handleCheckout}>
          Proceed to Checkout
        </Button>
      </Grid>
    </Grid>
  );
}
