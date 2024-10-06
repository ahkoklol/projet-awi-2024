import { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, CircularProgress, Button } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { database } from '../config/firebase';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';

interface BasketItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartData {
  buyer_id: string;
  items: BasketItem[];
  item_count: number;
  total: number;
}

export default function BasketPage() {
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const currentUser = useAuth(); // Get the currently authenticated user

  useEffect(() => {
    const fetchCartData = async () => {
      if (!currentUser?.email) {
        setLoading(false);
        return;
      }

      try {
        const cartDocRef = doc(database, 'ShoppingCart', currentUser.email);
        const cartDoc = await getDoc(cartDocRef);

        if (cartDoc.exists()) {
          setCartData(cartDoc.data() as CartData); // Assuming the cart data follows the structure of CartData
        } else {
          toast.error('No items found in your basket.');
        }
      } catch (error) {
        console.error('Error fetching basket data:', error);
        toast.error('Failed to fetch basket.');
      } finally {
        setLoading(false);
      }
    };

    fetchCartData();
  }, [currentUser]);

  if (loading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ marginTop: '50px' }}>
      <Typography variant="h4" gutterBottom sx={{ marginBottom: '30px', color: 'black' }}>
        Your Shopping Cart
      </Typography>
      {cartData && cartData.items.length > 0 ? (
        <Grid container spacing={2}>
          {cartData.items.map((item) => (
            <Grid item xs={12} key={item.id}> {/* Take full width for each item */}
              <Card sx={{ width: '100%' }}> {/* Make the card take full width */}
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{item.name}</Typography>
                  <Typography variant="body2">Price: ${item.price}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ marginTop: '20px', color: 'black' }}>
              Total: ${cartData.total}
            </Typography>
            <Button variant="contained" color="primary" sx={{ marginTop: '20px' }}>
              Proceed to Checkout
            </Button>
          </Grid>
        </Grid>
      ) : (
        <Typography variant="body1">Your basket is empty.</Typography>
      )}
    </Container>
  );
}
