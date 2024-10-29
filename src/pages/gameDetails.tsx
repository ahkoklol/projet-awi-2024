import { useEffect, useState } from 'react';
import { query, where, getDocs, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { Grid, Card, CardContent, Typography, CircularProgress, Container, Button, Box } from '@mui/material';
import { database } from '../config/firebase';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface GameDetails {
  id: string;
  name: string;
  price: number;
  stock_status: string;
  seller_id: string;
  quantity: number;
  deposit_fee: number;
  deposit_fee_type: string;
  commission: number;
}

interface GameView {
  name: string;
  description: string;
  publisher: string;
  release_date: number;
}

interface SellerProfile {
  firstname: string;
  lastname: string;
  email: string;
}

export default function GameDetailsPage() {
  const { gameName } = useParams<{ gameName: string }>();
  const [gameView, setGameView] = useState<GameView | null>(null);
  const [gameDetails, setGameDetails] = useState<GameDetails[]>([]);
  const [sellers, setSellers] = useState<{ [key: string]: SellerProfile }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const gameDetailsCollectionRef = collection(database, 'GameDetails');
  const gameViewCollectionRef = collection(database, 'GameView');
  const usersCollectionRef = collection(database, 'Users');

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        // Query GameDetails by game name
        const gamesQuery = query(gameDetailsCollectionRef, where('name', '==', gameName));
        const querySnapshot = await getDocs(gamesQuery);
        const gamesList: GameDetails[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as GameDetails[];

        // Fetch sellers based on seller_id
        const sellerPromises = gamesList.map(async (game) => {
          const q = query(usersCollectionRef, where('email', '==', game.seller_id));
          const querySnapshot = await getDocs(q);
        
          if (!querySnapshot.empty) {
            const sellerData = querySnapshot.docs[0].data() as SellerProfile;
            return { [game.seller_id]: sellerData };
          } else {
            console.log(`Seller with ID ${game.seller_id} does not exist in Users collection.`);
            return {};
          }
        });

        const sellerDataList = await Promise.all(sellerPromises);
        const sellersMap = sellerDataList.reduce((acc, curr) => ({ ...acc, ...curr }), {});  // Merge all objects into one

        // Check if any game has quantity = 0 and update the stock_status
        const updatedGamesList = await Promise.all(
          gamesList.map(async (game) => {
            if (game.quantity === 0 && game.stock_status !== 'soldout') {
              const gameDocRef = doc(gameDetailsCollectionRef, game.id);
              await updateDoc(gameDocRef, { stock_status: 'soldout' });
              return { ...game, stock_status: 'soldout' }; // Update the stock status in the state
            }
            return game;
          })
        );

        setSellers(sellersMap); // Store sellers in state
        setGameDetails(updatedGamesList); // Store game details in state
        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch game details');
        console.error('Error fetching game details:', error);
        setLoading(false);
      }
    };

    const fetchGameView = async () => {
      try {
        const gameViewQuery = query(gameViewCollectionRef, where('name', '==', gameName));
        const querySnapshot = await getDocs(gameViewQuery);
        const gameViewList: GameView[] = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
        })) as GameView[];
        setGameView(gameViewList[0]); // Assuming the game is unique
      } catch (error) {
        toast.error('Failed to fetch game metadata');
        console.error('Error fetching game metadata:', error);
      }
    };

    fetchGameView();
    fetchGameDetails();
  }, [gameName]);

  const handleBackToAllGames = () => {
    navigate('/allgames');
  };

  if (loading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', marginTop: '80px' }}>
        <Button 
          variant="contained" 
          style={{ marginBottom: '20px', backgroundColor: 'rgb(0, 159, 164)', color: 'white' }}
          onClick={handleBackToAllGames}
        >
          Back to All Games
        </Button>
      </Box>
      <Typography variant="h4" gutterBottom sx={{ color: 'black', marginBottom: '20px' }}>
        {gameName}
      </Typography>
      {gameView && (
        <>
          <Typography variant="h5" gutterBottom sx={{ color: 'black' }}>
            {gameView.description}
          </Typography>
          <Typography variant="body2" gutterBottom sx={{ color: 'black' }}>
            Publisher: {gameView.publisher}
          </Typography>
          <Typography variant="body2" gutterBottom sx={{ marginBottom: '40px', color: 'black' }}>
            Release Date: {gameView.release_date}
          </Typography>
        </>
      )}
      <Grid container spacing={3}>
        {gameDetails.map((game) => (
          <Grid item xs={12} sm={6} md={4} key={game.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{game.name}</Typography>
                <Typography variant="body2">Price: ${game.price}</Typography>
                <Typography variant="body2">Stock Status: {game.stock_status}</Typography>

                {sellers[game.seller_id] ? (
                  <Typography variant="body2" color="textSecondary">
                    Seller: {sellers[game.seller_id].firstname} {sellers[game.seller_id].lastname}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Seller: Unknown
                  </Typography>
                )}

              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
