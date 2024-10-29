import { useEffect, useState } from 'react';
import { query, where, getDocs, collection } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { Grid, Card, CardContent, Typography, CircularProgress, Container, Button, Box, IconButton, Menu, MenuItem } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // For dropdown menu
  const [sortOption, setSortOption] = useState<string>(''); // Sorting state
  const navigate = useNavigate();

  const gameDetailsCollectionRef = collection(database, 'GameDetails');
  const gameViewCollectionRef = collection(database, 'GameView');
  const usersCollectionRef = collection(database, 'Users');

  useEffect(() => {
    fetchGameView();
    fetchGameDetails();
  }, [sortOption]);

  const fetchGameDetails = async () => {
    setLoading(true);
    try {
      const gamesQuery = query(gameDetailsCollectionRef, where('name', '==', gameName), where('stock_status', '==', 'available'));
      const querySnapshot = await getDocs(gamesQuery);
      let gamesList: GameDetails[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GameDetails[];

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
      const sellersMap = sellerDataList.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setSellers(sellersMap);

      // Apply sorting based on selected option
      if (sortOption === 'priceLowToHigh') {
        gamesList = gamesList.sort((a, b) => a.price - b.price);
      } else if (sortOption === 'priceHighToLow') {
        gamesList = gamesList.sort((a, b) => b.price - a.price);
      } else if (sortOption === 'sellerName') {
        gamesList = gamesList.sort((a, b) => {
          const sellerA = sellers[a.seller_id]?.firstname || '';
          const sellerB = sellers[b.seller_id]?.firstname || '';
          return sellerA.localeCompare(sellerB);
        });
      }

      setGameDetails(gamesList);
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
      setGameView(gameViewList[0]);
    } catch (error) {
      toast.error('Failed to fetch game metadata');
      console.error('Error fetching game metadata:', error);
    }
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    setAnchorEl(null); // Close the menu after selecting
  };

  const handleFilterButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget); // Open the dropdown menu
  };

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '80px', marginBottom: '20px' }}>
        <Button 
          variant="contained" 
          style={{ backgroundColor: 'rgb(0, 159, 164)', color: 'white' }}
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
          <Typography variant="body2" gutterBottom sx={{ color: 'black' }}>
            Release Date: {gameView.release_date}
          </Typography>
        </>
      )}
      {/* Filter Button on the right side */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end',  // Ensures alignment to the right
          marginBottom: '10px' 
        }}
      >
        <IconButton aria-label="filter" onClick={handleFilterButtonClick} sx={{ ml: 'auto' }}>
          <FilterListIcon />
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => handleSortChange('priceLowToHigh')}>Price: Low to High</MenuItem>
          <MenuItem onClick={() => handleSortChange('priceHighToLow')}>Price: High to Low</MenuItem>
          <MenuItem onClick={() => handleSortChange('sellerName')}>Seller Name (Alphabetical)</MenuItem>
        </Menu>
      </Box>

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
