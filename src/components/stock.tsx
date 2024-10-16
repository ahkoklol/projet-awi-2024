import { useState, useEffect } from 'react';
import { Card, CardContent, Grid, Typography, Box } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { database } from '../config/firebase'; // Adjust the import path if needed

interface GameDetails {
  id: string;
  name: string;
  price: number;
  discount: number;
  stock_status: string;
}

const Stock = () => {
  const [userGames, setUserGames] = useState<GameDetails[]>([]);

  useEffect(() => {
    fetchAllGames();
  }, []);

  // Function to fetch all games from Firestore
  const fetchAllGames = async () => {
    try {
      const gameDetailsCollectionRef = collection(database, "GameDetails");
      const querySnapshot = await getDocs(gameDetailsCollectionRef);
      const gamesList: GameDetails[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GameDetails[];
      
      setUserGames(gamesList);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', marginTop: '-5rem' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 1.5,
          width: { sm: `calc(100% - 240px)` }, // Adjust drawer width if necessary
          marginLeft: { sm: `240px` },
        }}
      >
        <Typography variant="h5" gutterBottom>
          Games in Stock
        </Typography>

        {userGames.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No games in stock
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {userGames.map((game) => (
              <Grid item xs={12} sm={6} md={4} key={game.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{game.name}</Typography>
                    <Typography variant="body2">Price: ${game.price}</Typography>
                    <Typography variant="body2">Discount: {game.discount}%</Typography>
                    <Typography variant="body2">Stock Status: {game.stock_status}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default Stock;
