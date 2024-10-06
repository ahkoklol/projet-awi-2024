import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { query, where, getDocs, collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Container, Typography, List, SelectChangeEvent, ListItem, Grid, FormControl, InputLabel, Select, Stack, Card, TextField, CardContent, Button, AppBar, ListItemButton, ListItemIcon, ListItemText, Paper, CircularProgress, Box, CssBaseline, Toolbar, Divider, Drawer, IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Link } from 'react-router-dom';
import { auth, database, storage } from '../config/firebase';
import { signOut } from 'firebase/auth';
import useAuth from "../hooks/useAuth";
import { toast } from "react-toastify";
import { ref, uploadBytes } from 'firebase/storage';

const drawerWidth = 240;

interface UserProfile {
  firstname: string;
  lastname: string;
  email: string;
  address: string;
  phone: number;
  role: string;
  subscription_id: string;
  vendor_specific_data: string;
  date_joined: string;
}

interface GameDetails {
  id: string;
  name: string;
  price: number; 
  stock_status: string;
  vendor_id: string;
  discount: number;
  deposit_fee: number;
}

interface GameView {
  name: string;
  description: string;
  publisher: string;
  release_date: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // For loading state
  const [mobileOpen, setMobileOpen] = useState(false); // For toggling drawer
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // For the menu in AppBar
  const [selectedMenu, setSelectedMenu] = useState('Edit Profile'); // For tracking selected menu item
  const [newGamePrice, setNewGamePrice] = useState(0);
  const [vendorId, setVendorId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [stockStatus, setStockStatus] = useState('available');
  const [gameNames, setGameNames] = useState<string[]>([]);
  const [selectedGameName, setSelectedGameName] = useState('');
  const [newGameViewName, setNewGameViewName] = useState('');
  const [newGameViewDescription, setNewGameViewDescription] = useState('');
  const [newGameViewPublisher, setNewGameViewPublisher] = useState('');
  const [newGameViewReleaseDate, setNewGameViewReleaseDate] = useState(0);
  const [userGames, setUserGames] = useState<GameDetails[]>([]);
  // const [newGameViewStockStatus, setNewGameViewStockStatus] = useState(''); link to all matches to name count
  // const [depositFee, setDepositFee] = useState(0); link to subscription

  const gameDetailsCollectionRef = collection(database, "GameDetails");
  const gameViewCollectionRef = collection(database, "GameView");

  const currentUser = useAuth();

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        try {
          // Query Firestore for the user document based on email
          const usersRef = collection(database, 'Users');
          const q = query(usersRef, where('email', '==', authUser.email)); // Query where email matches
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]; // Assume unique email
            const data = userDoc.data() as UserProfile;
            setUserProfile(data);
            setVendorId(userDoc.id);
          } else {
            console.log('No user document found in Firestore.');
          }
        } catch (error) {
          console.error('Error fetching user document from Firestore:', error);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('User is signed out.');
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (vendorId) {
      fetchUserGames(vendorId);
    }
  }, [vendorId])

  useEffect(() => {
    // Fetch all game names from GameView collection
    const fetchGameNames = async () => {
      try {
        const gameNamesSnapshot = await getDocs(gameViewCollectionRef);
        const gameNamesList: string[] = gameNamesSnapshot.docs.map((doc) => doc.data().name);
        setGameNames(gameNamesList);
      } catch (error) {
        console.error('Error fetching game names:', error);
      }
    };

    fetchGameNames();
  }, []);

  const handleGameNameChange = (event: SelectChangeEvent<string>) => {
    setSelectedGameName(event.target.value);
  };

  const handleStockChange = (event: SelectChangeEvent) => {
    const selectedValue = event.target.value as string;
    setStockStatus(selectedValue === 'yes' ? 'returned' : 'available');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Goodbye!');
    } catch (error) {
      console.log('User not signed out', error);
    }
  };

  // POST request to add a new game
  const onSubmitGame = async () => {
    if (!selectedGameName) {
      toast.error('Please select a game name.');
      return;
    }
    try {
      await addDoc(gameDetailsCollectionRef, { name: selectedGameName, price: newGamePrice, vendor_id: vendorId, discount: discount, stock_status: stockStatus });
      console.log('Game added successfully!');
      toast.success('Game added successfully!');
      // reset fields
      setSelectedGameName('');
      setNewGamePrice(0);
      setDiscount(0);
      setStockStatus('available');
      fetchUserGames(vendorId); // Refresh the list of games
    } catch (error) {
      console.log('Error adding document', error);
    }
  };
  
  // POST request to create a new game view
  const onSubmitGameView = async () => {
    try {
      // Step 1: Query Firestore to check if a game with the same name already exists
      const gameViewQuery = query(gameViewCollectionRef, where('name', '==', newGameViewName));
      const querySnapshot = await getDocs(gameViewQuery);

      if (!querySnapshot.empty) {
        // Step 2: If a game with the same name is found, show an error message
        toast.error('This game already exists. You can add products to the existing game.');
        console.log('This game already exists. You can add products to the existing game.');
        return; // Stop further execution
      }
      await addDoc(gameViewCollectionRef, { name: newGameViewName, publisher: newGameViewPublisher, description: newGameViewDescription, release_date: newGameViewReleaseDate });
      console.log('Game added successfully!');
      toast.success('Game added successfully!');
      // reset fields
      setNewGameViewName('');
      setNewGameViewDescription('');
      setNewGameViewPublisher('');
    } catch (error) {
      console.log('Error adding document', error);
    }
  };

  // GET request to fetch all games deposited by the current user
  const fetchUserGames = async (vendorId: string) => {
    try {
      const gamesQuery = query(gameDetailsCollectionRef, where('vendor_id', '==', vendorId));
      const querySnapshot = await getDocs(gamesQuery);
      
      const gamesList: GameDetails[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GameDetails[];

      setUserGames(gamesList); // Store games in state
    } catch (error) {
      console.error('Error fetching games for the user:', error);
    }
  };

  const drawer = (
    <div>
      <Toolbar style={{ paddingTop: '66px', paddingBottom: '2px' }}>
        <ListItem>
          <ListItemIcon>
            <AccountCircleIcon fontSize="large" />
          </ListItemIcon>
          <ListItemText
            primary={`${userProfile?.firstname} ${userProfile?.lastname}`}
            secondary={`${userProfile?.role}`}
          />
        </ListItem>
      </Toolbar>
      <Divider />
      <List>
        {/* Always available menu items */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setSelectedMenu('Edit Profile')}>
            <ListItemIcon>
              <InboxIcon />
            </ListItemIcon>
            <ListItemText primary="Edit Profile" />
          </ListItemButton>
        </ListItem>

        {/* Conditional rendering based on user role */}
        {userProfile?.role === 'vendor' && (
          <>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setSelectedMenu('Sales Dashboard')}>
                <ListItemIcon>
                  <MailIcon />
                </ListItemIcon>
                <ListItemText primary="Sales Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setSelectedMenu('Earnings Report')}>
                <ListItemIcon>
                  <MailIcon />
                </ListItemIcon>
                <ListItemText primary="Earnings Report" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setSelectedMenu('Stock')}>
                <ListItemIcon>
                  <MailIcon />
                </ListItemIcon>
                <ListItemText primary="Stock" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setSelectedMenu('Deposit Product')}>
                <ListItemIcon>
                  <MailIcon />
                </ListItemIcon>
                <ListItemText primary="Deposit Product" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setSelectedMenu('Create Game')}>
                <ListItemIcon>
                  <MailIcon />
                </ListItemIcon>
                <ListItemText primary="Create Game" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </div>
  );

  const renderContent = () => {
    if (selectedMenu === 'Edit Profile' && userProfile) {
      return (
        <Paper elevation={3} style={{ padding: '20px', marginTop: '-70px', marginBottom: '20px', marginLeft: `${drawerWidth}px` }}>
          <Typography variant="h4" gutterBottom>
            User Profile
          </Typography>
          <Typography variant="h4" style={{ marginTop: "20px" }}>
            {userProfile.firstname} {userProfile.lastname}
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {userProfile.role}
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Email" secondary={userProfile.email} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Date Joined">{userProfile.date_joined}</ListItemText>
            </ListItem>
          </List>
        </Paper>
      );
    }

    if (selectedMenu === 'Sales Dashboard') {
      return (
        <Box sx={{ display: 'flex', marginTop: '-5rem' }}>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 1.5,
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              marginLeft: { sm: `${drawerWidth}px` }, // Push the content to the right by the width of the drawer
            }}
          >
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <Stack spacing={2} direction="row">
                <Card sx={{ flexGrow: 1, height: 100 }}>
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      Total Products Sold
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Lizards are a widespread group of squamate reptiles, with over 6,000
                      species, ranging across all continents except Antarctica
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flexGrow: 1, height: 100 }}>
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      Total Earnings
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Lizards are a widespread group of squamate reptiles, with over 6,000
                      species, ranging across all continents except Antarctica
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
            <Grid item xs={4}>
              <Stack spacing={2}>
              <Card sx={{ flexGrow: 1, height: 42 }}>
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      Lizard
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flexGrow: 1, height: 42 }}>
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      Lizard
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
            <Grid item xs={8}>
              <Card sx={{ height: 40 + "vh", flexGrow: 1 }}>
                <CardContent>
                </CardContent>
              </Card>
              <Card sx={{ maxWidth: 345 }}>
                <CardContent>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
      );
    }

    if (selectedMenu === 'Deposit Product') {
      return (
        <Box sx={{ display: 'flex', marginTop: '-6rem', marginBottom: '-3rem' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 1.5,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginLeft: { sm: `${drawerWidth}px` },
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Stack spacing={2} direction="row">
              <Card sx={{ flexGrow: 1, height: 'auto' }}>
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    Add a product
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', marginBottom: '1rem' }}>
                    Use the form below to add new game details.
                  </Typography>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="game-name-label">Game Name - If not available, create a new game</InputLabel>
                    <Select
                      labelId="game-name-label"
                      id="game-name"
                      value={selectedGameName}
                      onChange={handleGameNameChange}
                      label="Game Name - If not available, create a new game"
                      sx={{ textAlign: 'left' }}
                    >
                      {gameNames.map((name) => (
                        <MenuItem key={name} value={name}>
                          {name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Price"
                    value={newGamePrice}
                    onChange={(e) => setNewGamePrice(parseFloat(e.target.value))}
                    type="number"
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Discount"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value))}
                    type="number"
                    fullWidth
                    margin="normal"
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="stock-status-label">Returned?</InputLabel>
                    <Select
                      labelId="stock-status-label"
                      id="stock-status"
                      value={stockStatus === 'returned' ? 'yes' : 'no'}
                      onChange={handleStockChange}
                      label="Returned?"  // Ensure the label is tied to the field
                      sx={{ textAlign: 'left' }}
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={onSubmitGame}
                    sx={{ marginTop: '20px' }}
                  >
                    Add Game
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
      );
    }

    if (selectedMenu === 'Create Game') {
      return (
        <Box sx={{ display: 'flex', marginTop: '-6rem', marginBottom: '-3rem' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 1.5,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginLeft: { sm: `${drawerWidth}px` },
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Stack spacing={2} direction="row">
              <Card sx={{ flexGrow: 1, height: 'auto' }}>
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    Create a new game
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', marginBottom: '1rem' }}>
                    Use the form below to add new game details.
                  </Typography>
                  <TextField
                    label="Game Name"
                    value={newGameViewName}
                    onChange={(e) => setNewGameViewName(e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Description"
                    value={newGameViewDescription}
                    onChange={(e) => setNewGameViewDescription(e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Publisher"
                    value={newGameViewPublisher}
                    onChange={(e) => setNewGameViewPublisher(e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Release Date"
                    value={newGameViewName}
                    onChange={(e) => setNewGameViewReleaseDate(parseFloat(e.target.value))}
                    fullWidth
                    type="number"
                    margin="normal"
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={onSubmitGameView}
                    sx={{ marginTop: '20px' }}
                  >
                    Add Game
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
      );
    }

    if (selectedMenu === 'Stock') {
      return (
        <Box sx={{ display: 'flex', marginTop: '-5rem' }}>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 1.5,
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              marginLeft: { sm: `${drawerWidth}px` },
            }}
          >
            <Typography variant="h5" gutterBottom>
              Your Deposited Games
            </Typography>
            
            {userGames.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No games deposited yet.
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
    }

    // Add other menu options similarly if needed
  };

  if (loading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ backgroundColor: 'rgb(19, 38, 77)', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component={Link} to="/" sx={{ color: 'white', '&:hover': { color: 'white' } }}>
            Fastclick Firestore
          </Typography>

          <AccountCircleIcon component={Link} to="profile/" />
          <IconButton color="inherit" onClick={handleMenuClick}>
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem component={Link} to="/" onClick={handleMenuClose} sx={{ color: 'black' }}>Home</MenuItem>
            {currentUser && (
              <MenuItem component={Link} to="/profile" onClick={handleMenuClose} sx={{ color: 'black' }}>Profile</MenuItem>
            )}
            {!currentUser && (
              <MenuItem component={Link} to="/login" onClick={handleMenuClose} sx={{ color: 'black' }}>Login</MenuItem>
            )}
            {!currentUser && (
              <MenuItem component={Link} to="/signup" onClick={handleMenuClose} sx={{ color: 'black' }}>Signup</MenuItem>
            )}
            {currentUser && (
              <MenuItem component={Link} to="/" onClick={handleLogout} sx={{ color: 'black' }}>Logout</MenuItem>
            )}
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginTop: '64px', // Ensure content starts below the navbar
        }}
      >
        <Toolbar />
        <Container>
          {renderContent()} {/* Dynamically render content based on selected menu item */}
        </Container>
      </Box>
    </Box>
  );
}
