import { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface BasketItem {
  id: string;
  name: string;
  price: number;
}

export default function BasketPage() {
  const [cartData, setCartData] = useState<BasketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCartData = () => {
      // Fetch basket data from localStorage
      const savedBasket = localStorage.getItem('basket');
      if (savedBasket) {
        const basket = JSON.parse(savedBasket);
        setCartData(basket.items);
      } else {
        toast.error('No items found in your basket.');
      }
      setLoading(false);
    };

    fetchCartData();
  }, []);

  // Calculate total dynamically
  const total = cartData.reduce((acc, item) => acc + item.price, 0);

  if (loading) {
    return <Typography variant="h6">Loading...</Typography>;
  }

  return (
    <Container sx={{ marginTop: '50px' }}>
      <Typography variant="h4" gutterBottom sx={{ marginBottom: '30px', color: 'black' }}>
        Your Shopping Cart
      </Typography>
      {cartData.length > 0 ? (
        <Grid container spacing={2}>
          {cartData.map((item) => (
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
              Total: ${total}
            </Typography>
            <Button variant="contained" color="primary" sx={{ marginTop: '20px' }} onClick={() => navigate(`/checkout`)}>
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
