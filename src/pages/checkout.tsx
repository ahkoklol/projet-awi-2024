import { Grid, Typography, Button, List, ListItem, ListItemText, TextField, Container } from '@mui/material';
import { useState } from 'react';
import { useBasket } from '../context/BasketContext';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore'; // Firestore functions
import { database } from '../config/firebase'; // Firestore database

export default function Checkout() {
  const { basketItems, total, itemCount, clearBasket } = useBasket();
  const navigate = useNavigate();

  // State for form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [error, setError] = useState('');

  // Function to create transactions and generate a receipt
  const handleCheckout = async () => {
    if (!firstName || !lastName || !phone || !email) {
      setError('Please fill in all the required fields.');
      return;
    }

    setError(''); // Clear error if everything is filled

    try {
      // Create a transaction for each item in the basket
      const transactionCollectionRef = collection(database, 'Transaction');
      const receiptItems = []; // Array to store purchased items for the receipt

      for (const item of basketItems) {
        // Fetch the game details to get the seller_id
        const gameDetailsRef = doc(database, 'GameDetails', item.id);
        const gameDetailsSnapshot = await getDoc(gameDetailsRef);

        if (!gameDetailsSnapshot.exists()) {
          console.error(`Game details not found for item: ${item.name}`);
          continue; // Skip this item if the game details are not found
        }

        const gameDetails = gameDetailsSnapshot.data();
        const seller_id = gameDetails?.seller_id || ''; // Get the seller_id from the GameDetails collection

        // Create the transaction document
        await addDoc(transactionCollectionRef, {
          buyer_id: email, // Use the email as the buyer_id
          commission_percentage: 0, // Assuming this is fixed for now
          deposit_fee: 0, // Assuming this is fixed for now
          item_id: item.id, // Link the item to the transaction
          sale_date: new Date(), // Current date as sale date
          sale_price: item.price, // Item price
          seller_id: seller_id, // Link the seller to the transaction
        });

        // Add the item (id, name, and price) to the receipt
        receiptItems.push({
          id: item.id,         // Add the item's id to the receipt
          name: item.name,      // Add the item's name to the receipt
          price: item.price.toFixed(2), // Add the item's price to the receipt
        });
      }

      // Create the receipt document
      const receiptCollectionRef = collection(database, 'Receipt');
      await addDoc(receiptCollectionRef, {
        email: email,
        firstname: firstName,
        lastname: lastName,
        items_purchased: receiptItems, // Include each item's id, name, and price
        total: total.toFixed(2), // Total price for the purchase
        sale_date: new Date(), // Current date as sale date
      });

      // Clear the basket after successful transactions
      clearBasket();

      // Navigate to a confirmation page or back to the home page
      navigate(`/home`);

    } catch (error) {
      console.error('Error creating transactions and receipt:', error);
      setError('Failed to complete the transaction. Please try again.');
    }
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
        </Grid>

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
