import { useEffect, useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { Grid, Card, CardContent, Typography, CircularProgress, Container, Button, TextField, Box, IconButton, Menu, MenuItem } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
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
  const [filteredGames, setFilteredGames] = useState<GameView[]>([]); // State for filtered games
  const [loading, setLoading] = useState<boolean>(true);
  const [sortOption, setSortOption] = useState<string>('name'); // Default sort by name
  const [searchTerm, setSearchTerm] = useState<string>(''); // State for search term
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // Anchor element for the menu
  const navigate = useNavigate();

  const gameViewCollectionRef = collection(database, 'GameView');

  useEffect(() => {
    fetchGames();
  }, [sortOption]);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const gameViewSnapshot = await getDocs(gameViewCollectionRef);
      let gamesList: GameView[] = gameViewSnapshot.docs.map((doc) => ({
        name: doc.data().name,
        description: doc.data().description,
        publisher: doc.data().publisher,
        release_date: doc.data().release_date,
      }));

      // Sort the games based on the selected option
      gamesList = gamesList.sort((a, b) => {
        if (sortOption === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortOption === 'publisher') {
          return a.publisher.localeCompare(b.publisher);
        }
        return 0;
      });

      setGames(gamesList);
      setFilteredGames(gamesList); // Initialize filtered games with the full list
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch games');
      console.error('Error fetching games:', error);
      setLoading(false);
    }
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    setAnchorEl(null); // Close the menu after selection
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    // Filter games based on search term
    const filtered = games.filter((game) =>
      game.name.toLowerCase().includes(term) || game.publisher.toLowerCase().includes(term)
    );
    setFilteredGames(filtered);
  };

  const handleFilterButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget); // Toggle the menu
  };

  const isMenuOpen = Boolean(anchorEl);

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

      {/* Search and Filter Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        {/* Search Bar */}
        <TextField
          label="Search by Game Name or Publisher"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ ml: 'auto', minWidth: '300px', maxWidth: '350px' }}
        />

        {/* Filter Button */}
        <IconButton aria-label="filter" onClick={handleFilterButtonClick}>
          <FilterListIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
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
          <MenuItem onClick={() => handleSortChange('name')}>Game Name (Alphabetical)</MenuItem>
          <MenuItem onClick={() => handleSortChange('publisher')}>Publisher (Alphabetical)</MenuItem>
        </Menu>
      </Box>

      {/* Games List */}
      <Grid container spacing={3}>
        {filteredGames.map((game, index) => (
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
