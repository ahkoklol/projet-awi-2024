import { useState, useEffect } from 'react';
import { Card, CardContent, Grid, Typography, Box, Checkbox, FormControlLabel } from '@mui/material';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { database } from '../config/firebase';

interface GameDetails {
  id: string;
  name: string;
  price: number;
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

  // Function to handle status change
  const handleStatusChange = async (gameId: string) => {
    try {
      const gameDocRef = doc(database, "GameDetails", gameId);
      await updateDoc(gameDocRef, { stock_status: 'available' });
      
      // Update local state
      setUserGames((prevGames) =>
        prevGames.map((game) =>
          game.id === gameId ? { ...game, stock_status: 'available' } : game
        )
      );
    } catch (error) {
      console.error("Error updating stock status:", error);
    }
  };

  return (
    <Box sx={{ display: 'flex', marginTop: '-5rem' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 1.5,
          width: { sm: `calc(100% - 240px)` },
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
                  <CardContent sx={{ marginBottom: '-5px' }}>
                    <Typography variant="h6" sx={{ display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 1 }}>{game.name}</Typography>
                    <Typography variant="body2">Price: ${game.price}</Typography>
                    <Typography variant="body2">Stock Status: {game.stock_status}</Typography>
                    
                    {game.stock_status === 'pending' && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            color="primary"
                            onChange={() => handleStatusChange(game.id)}
                            aria-label="Change status to available"
                          />
                        }
                        label="Mark as Available"
                      />
                    )}
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
