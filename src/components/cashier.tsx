import { Grid, Typography, Button, List, ListItem, ListItemText, TextField } from '@mui/material';
import { useState } from 'react';
import { useBasket } from '../context/BasketContext';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { database } from '../config/firebase';
import { toast } from 'react-toastify';
import { useSession } from '../context/SessionContext';
import Paper from "@mui/material/Paper";

export default function Cashier() {
  const { basketItems, total, itemCount, clearBasket, addItemToBasket, removeItemFromBasket } = useBasket();
  const [email, setEmail] = useState('');
  const [itemId, setItemId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { isOpen: isSessionOpen, sessionDocId } = useSession();

  // Function to handle adding item to the basket
  const handleAddItem = async () => {

    if (!isSessionOpen) {
      toast.error('No active session. Please open a session to add items to the basket.');
      return; // Prevent adding item if no session is open
    }

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

    if (basketItems.length === 0) {
      toast.error('Basket cannot be empty');
      return; // Prevent checkout if the basket is empty
    }

    if (!isSessionOpen) {
      toast.error('No active session. Please open a session to proceed to checkout.');
      return; // Prevent checkout if no session is open
    }

    setError(''); // Clear error if everything is filled
  
    try {
      const transactionCollectionRef = collection(database, 'Transaction');
      const receiptItems = []; // Array to store purchased items for the receipt
  
      for (const item of basketItems) {
        // Fetch the game details to get the current quantity and seller_id
        const gameDetailsRef = doc(database, 'GameDetails', item.id);
        const gameDetailsSnapshot = await getDoc(gameDetailsRef);
  
        if (!gameDetailsSnapshot.exists()) {
          console.error(`Game details not found for item: ${item.name}`);
          continue; // Skip this item if the game details are not found
        }
  
        const gameDetails = gameDetailsSnapshot.data();
        const seller_id = gameDetails?.seller_id || ''; // Get the seller_id from the GameDetails collection
        const currentQuantity = gameDetails?.quantity || 0; // Get the current quantity
  
        // Check if the item has enough stock (in this case, we assume you're only purchasing 1 quantity per item)
        if (currentQuantity > 0) {
          // Calculate the new quantity after purchase
          const newQuantity = currentQuantity - 1;
  
          // Update the quantity and stock status in the GameDetails document
          await updateDoc(gameDetailsRef, {
            quantity: newQuantity,
            stock_status: newQuantity === 0 ? 'soldout' : gameDetails.stock_status, // Set to 'soldout' if quantity becomes 0
          });
  
          // Create the transaction document
          await addDoc(transactionCollectionRef, {
            buyer_id: email || 'N/A', // Use the email as the buyer_id
            session_id: sessionDocId, // Link the transaction to the session
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
        } else {
          console.error(`Insufficient stock for item: ${item.name}`);
        }
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
    <Grid container direction="column" spacing={3} sx={{ marginTop: "-40px", marginLeft: "0px" }}>
      {/* 🔹 TITRE (EN DEHORS DES CONTAINERS) */}
      <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, marginLeft: "20px" }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", textAlign: "center", marginBottom: "-10px"}}>
          Order Summary
        </Typography>
      </Grid>
  
      {/* 🔹 CONTAINER 1 : CLIENT & AJOUT D'ITEM */}
      <Grid item xs={12}>
        <Paper
          elevation={3}
          sx={{
            padding: "20px",
            border: "2px solid rgb(19, 38, 77)",
            borderRadius: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)", // Ombre douce
            transition: "transform 0.3s ease-in-out",
            "&:hover": { transform: "scale(1.02)" },
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold", marginBottom: 2 }}>
            Customer Details
          </Typography>
          <TextField
            label="Customer email (Optional)"
            variant="outlined"
            fullWidth
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
  
          <Typography variant="h5" sx={{ fontWeight: "bold", marginTop: 3, marginBottom: 2 }}>
            Add Item
          </Typography>
          <Grid container spacing={2} sx={{ display: "flex", alignItems: "center" }}>
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
              <Button
                variant="contained"
                onClick={handleAddItem}
                sx={{
                  backgroundColor: "rgb(19, 38, 77)",
                  color: "white",
                  "&:hover": { backgroundColor: "rgb(15, 30, 60)" },
                }}
              >
                Add Item to Basket
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
  
      {/* 🔹 CONTAINER 2 : LISTE DES ITEMS */}
      <Grid item xs={12}>
        <Paper
          elevation={3}
          sx={{
            padding: "20px",
            border: "2px solid rgb(19, 38, 77)",
            borderRadius: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)", // Ombre douce
            transition: "transform 0.3s ease-in-out",
            "&:hover": { transform: "scale(1.02)" },
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold", marginBottom: 2 }}>
            Basket ({itemCount} items)
          </Typography>
  
          <List disablePadding>
            {basketItems.map((item) => (
              <ListItem
                key={item.id}
                sx={{
                  py: 1,
                  px: 0,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <ListItemText
                  primaryTypographyProps={{ fontWeight: "bold" }}
                  primary={item.name}
                />
                <Typography variant="body1" sx={{ fontWeight: "bold", color: "rgb(19, 38, 77)", mr: 2 }}>
                  ${item.price.toFixed(2)}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => removeItemFromBasket(item.id)}
                  sx={{
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    backgroundColor: "#800000", // Rouge Bordeaux
                    color: "white",
                    "&:hover": { backgroundColor: "#600000" }, // Rouge plus foncé au hover
                  }}
                >
                  Remove
                </Button>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
  
      {/* 🔹 CONTAINER 3 : TOTAL & CHECKOUT */}
      <Grid item xs={12}>
        <Paper
          elevation={3}
          sx={{
            padding: "20px",
            border: "2px solid rgb(19, 38, 77)",
            borderRadius: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)", // Ombre douce
            transition: "transform 0.3s ease-in-out",
            "&:hover": { transform: "scale(1.02)" },
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold", marginBottom: 2 }}>
            Total
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold", marginBottom: 3 }}>
            ${total.toFixed(2)}
          </Typography>
  
          {error && (
            <Typography color="error" sx={{ marginTop: "10px" }}>
              {error}
            </Typography>
          )}
  
          <Button
            variant="contained"
            sx={{
              marginTop: "10px",
              backgroundColor: "rgb(19, 38, 77)",
              color: "white",
              "&:hover": { backgroundColor: "rgb(15, 30, 60)" },
              width: "250px", // Réduction de la largeur
              display: "block",
              marginLeft: "auto",
              marginRight: "auto", // Centrage horizontal
            }}
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );
}
