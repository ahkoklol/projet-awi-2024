import { useEffect, useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { Grid, Card, CardContent, Typography, CircularProgress, Container, Button } from '@mui/material';
import { database } from '../config/firebase';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface GameView {
  name: string;
  description: string;
  publisher: string;
  release_date: number;
}

export default function GamesViewPage() {
  const [games, setGames] = useState<GameView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const gameViewCollectionRef = collection(database, 'GameView');

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gameViewSnapshot = await getDocs(gameViewCollectionRef);
        const gamesList: GameView[] = gameViewSnapshot.docs.map((doc) => ({
          name: doc.data().name,
          description: doc.data().description,
          publisher: doc.data().publisher,
          release_date: doc.data().release_date,
        }));
        setGames(gamesList);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch games');
        console.error('Error fetching games:', error);
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom sx={{ color: 'black', marginTop: '50px', marginBottom: '10px' }}>
        Available Games
      </Typography>
      <Grid container spacing={3}>
        {games.map((game, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <CardContent>
                <Typography variant="h6" sx={{ display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 1 }}>{game.name}</Typography>
                <Typography variant="body2" sx={{ display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>{game.description}</Typography>
                <Typography variant="body2">
                  Publisher: {game.publisher}
                </Typography>
                <Typography variant="body2" sx={{ marginBottom: '15px' }}>
                  Release Date: {game.release_date}
                </Typography>
                <Button
                  variant="contained"
                  component="span"
                  style={{ backgroundColor: 'rgb(0, 186, 240)', color: 'white' }}
                  onClick={() => navigate(`/game/${encodeURIComponent(game.name)}`)}
                >
                  View Game
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
