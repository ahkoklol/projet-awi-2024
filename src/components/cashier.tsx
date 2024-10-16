import { Grid, Typography, Button, List, ListItem, ListItemText, TextField } from '@mui/material';
import { useState } from 'react';
import { useBasket } from '../context/BasketContext';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { database } from '../config/firebase';
import { toast } from 'react-toastify';

export default function Cashier() {
  const { basketItems, total, itemCount, clearBasket, addItemToBasket } = useBasket();

  // State for form fields
  const [email, setEmail] = useState('');
  const [itemId, setItemId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Function to handle adding item to the basket
  const handleAddItem = async () => {
    try {
      const itemRef = doc(database, 'GameDetails', itemId);  // Assuming 'Items' is the collection where items are stored
      const itemSnapshot = await getDoc(itemRef);

      if (!itemSnapshot.exists()) {
        setError('Item not found');
        setMessage('');
        return;
      }

      const itemData = itemSnapshot.data();
      const newItem = {
        id: itemId,
        name: itemData.name,
        price: itemData.price,
        commission: itemData.commission,
        deposit_fee: itemData.deposit_fee,
        deposit_fee_type: itemData.deposit_fee_type,
        quantity: 1,
      };

      const itemAdded = addItemToBasket(newItem);

      if (itemAdded) {
        setMessage('Item added to the basket successfully');
        setError('');
        setItemId('');  // Clear the input field after adding
        console.log(message);
      } else {
        setError('Item already exists in the basket');
        setMessage('');
      }

    } catch (err) {
      console.error('Error adding item to basket:', err);
      setError('Failed to add item to basket.');
      setMessage('');
    }
  };

  // Function to create transactions and generate a receipt
  const handleCheckout = async () => {

    console.log(basketItems);

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
          buyer_id: email || 'N/A', // Use the email as the buyer_id
          commission_percentage: item.commission, // Assuming this is fixed for now
          deposit_fee: item.deposit_fee, // Assuming this is fixed for now
          deposit_fee_type: item.deposit_fee_type, // Assuming this is fixed for now
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
        email: email || 'N/A',
        items_purchased: receiptItems, // Include each item's id, name, and price
        total: total.toFixed(2), // Total price for the purchase
        sale_date: new Date(), // Current date as sale date
      });

      // Clear the basket after successful transactions
      clearBasket();

      toast.success('Transaction completed successfully!');

    } catch (error) {
      console.error('Error creating transactions and receipt:', error);
      setError('Failed to complete the transaction. Please try again.');
    }
  };


  return (
    <Grid container direction="column" sx={{ marginTop: '-40px' }} spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h3" gutterBottom sx={{ color: 'black' }}>
          Order Summary
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Email (Optional)"
          variant="outlined"
          fullWidth
          size="small"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <Grid container spacing={2} sx={{ display: 'flex', alignItems: 'center' }}>
          <Grid item xs>
            <TextField
              label="Item ID"
              variant="outlined"
              fullWidth
              size="small"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            />
          </Grid>
          <Grid item>
            <Button variant="contained" color="primary" onClick={handleAddItem}>
              Add Item to Basket
            </Button>
          </Grid>
        </Grid>

        <Typography variant="h5" gutterBottom sx={{ color: 'black', marginTop:'30px' }}>
          {itemCount} items
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
      </Grid>

      

      {error && (
        <Typography color="error" sx={{ marginTop: '10px' }}>
          {error}
        </Typography>
      )}

      <Button variant="contained" color="primary" sx={{ marginTop: '10px' }} onClick={handleCheckout}>
        Proceed to Checkout
      </Button>
    </Grid>
  );
}
