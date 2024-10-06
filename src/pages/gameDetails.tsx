import { useEffect, useState } from 'react';
import { query, where, getDocs, collection, doc, getDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { Grid, Card, CardContent, Typography, CircularProgress, Container, Button } from '@mui/material';
import { database } from '../config/firebase';
import { toast } from 'react-toastify';
import { useBasket } from '../context/BasketContext'; // Import useBasket hook
import useAuth from "../hooks/useAuth";

interface GameDetails {
  id: string;
  name: string;
  price: number;
  stock_status: string;
  seller_id: string;  // seller_id refers to the document ID in the seller's collection
  discount: number;
  deposit_fee: number;
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
  const { gameName } = useParams<{ gameName: string }>(); // Extract game name from the route params
  const [gameView, setGameView] = useState<GameView | null>(null);
  const [gameDetails, setGameDetails] = useState<GameDetails[]>([]);
  const [sellers, setSellers] = useState<{ [key: string]: SellerProfile }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const { addItemToBasket } = useBasket(); // Access addItemToBasket from context

  const currentUser = useAuth();

  const gameDetailsCollectionRef = collection(database, 'GameDetails');
  const gameViewCollectionRef = collection(database, 'GameView');
  const usersCollectionRef = collection(database, 'Users'); // Assuming sellers are in the 'Users' collection

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
            const sellerDocRef = doc(usersCollectionRef, game.seller_id); // Reference the seller's document by seller_id
            const sellerDocSnapshot = await getDoc(sellerDocRef);
          
            if (sellerDocSnapshot.exists()) {
              const sellerData = sellerDocSnapshot.data() as SellerProfile;
              return { [game.seller_id]: sellerData };  // Return seller data mapped by seller_id
            } else {
              // If no seller is found, return an empty object
              return {};
            }
          });
          
          const sellerDataList = await Promise.all(sellerPromises);
          const sellersMap = sellerDataList.reduce((acc, curr) => ({ ...acc, ...curr }), {});  // Merge all objects into one
          
          setSellers(sellersMap); // Store sellers in state
          setGameDetails(gamesList); // Store game details in state
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

  const handleAddToBasket = async (game: GameDetails) => {
    if (!currentUser?.email) {
      toast.error('Please log in to add items to the basket.');
      return;
    }
  
    try {
      // Use the context's addItemToBasket function
      await addItemToBasket({
        id: game.id,
        name: game.name,
        price: game.price,
      });
  
      toast.success(`${game.name} added to basket!`);
    } catch (error) {
      console.error('Error adding item to basket:', error);
      toast.error('Failed to add item to basket');
    }
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
      <Typography variant="h4" gutterBottom sx={{ color: 'black', marginTop: '80px', marginBottom: '20px' }}>
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
                <Typography variant="body2">Discount: {game.discount}%</Typography>
                <Typography variant="body2">Stock/Condition Status: {game.stock_status}</Typography>

                {sellers[game.seller_id] ? (
                  <Typography variant="body2" color="textSecondary">
                    Seller: {sellers[game.seller_id].firstname} {sellers[game.seller_id].lastname}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Seller: Unknown
                  </Typography>
                )}

                <Button
                  variant="contained"
                  component="span"
                  color="primary"
                  sx={{ backgroundColor: 'black', color: 'white', '&:hover': { backgroundColor: 'grey', borderColor: 'grey' }, marginTop: '15px' }}
                  onClick={() => handleAddToBasket(game)}
                >
                  Add to basket
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}