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
        {/* 🔹 TITRE CENTRÉ */}
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: "bold", color: "rgb(19, 38, 77)", textAlign: "center" }}
        >
          Games in Stock
        </Typography>
  
        {userGames.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", fontWeight: "bold" }}>
            No games in stock
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {userGames.map((game) => (
              <Grid item xs={12} sm={6} md={4} key={game.id}>
                <Card
                  sx={{
                    border: "2px solid rgb(19, 38, 77)", // Bordure bleu marine
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)", // Ombre douce
                    transition: "transform 0.3s ease-in-out",
                    "&:hover": { transform: "scale(1.02)" }, // Effet zoom au hover
                  }}
                >
                  <CardContent sx={{ marginBottom: '-5px' }}>
                    {/* 🔹 NOM DU JEU EN GRAS */}
                    <Typography
                      variant="h6"
                      sx={{
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 1,
                        fontWeight: "bold",
                        color: "rgb(19, 38, 77)",
                      }}
                    >
                      {game.name}
                    </Typography>
  
                    {/* 🔹 INFORMATIONS EN GRAS */}
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      Price: <span style={{ fontWeight: "normal" }}>${game.price}</span>
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      Stock Status: <span style={{ fontWeight: "normal" }}>{game.stock_status}</span>
                    </Typography>
  
                    {/* 🔹 CHECKBOX POUR CHANGEMENT DE STATUT */}
                    {game.stock_status === 'pending' && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            sx={{
                              color: "rgb(19, 38, 77)",
                              "&.Mui-checked": { color: "rgb(19, 38, 77)" },
                            }}
                            onChange={() => handleStatusChange(game.id)}
                            aria-label="Change status to available"
                          />
                        }
                        label="Mark as Available"
                        sx={{ fontWeight: "bold" }}
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
