import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { query, where, getDocs, collection, addDoc } from 'firebase/firestore';
import { Container, Typography, List, SelectChangeEvent, ListItem, Grid, FormControl, InputLabel, Select, Stack, Card, TextField, CardContent, Button, ListItemButton, ListItemIcon, ListItemText, Paper, CircularProgress, Box, CssBaseline, Toolbar, Divider, Drawer, MenuItem } from '@mui/material';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { auth, database } from '../config/firebase';
import { toast } from "react-toastify";
import AppBarComponent from '../components/adminAppBar';
import Cashier from './cashier';
import SignUp from './SignUp';

const drawerWidth = 240;

interface UserProfile {
  firstname: string;
  lastname: string;
  email: string;
  address: string;
  phone: number;
  role: string;
  seller_specific_data: string;
  date_joined: string
}

interface GameDetails {
  id: string;
  name: string;
  price: number; 
  quantity: number;
  stock_status: string;
  seller_id: string;
  discount: number;
  deposit_fee: number;
  deposit_fee_type: string;
  commission: number;
  condition: string;
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // For loading state
  const [mobileOpen, setMobileOpen] = useState(false); // For toggling drawer
  const [selectedMenu, setSelectedMenu] = useState('Edit Profile'); // For tracking selected menu item
  const [newGamePrice, setNewGamePrice] = useState(0);
  const [sellerId, setSellerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [deposit_fee, setDepositFee] = useState(0);
  const [deposit_fee_type, setDepositType] = useState('');
  const [commission, setCommission] = useState(0);
  const [condition, setCondition] = useState('');
  const [stockStatus, setStockStatus] = useState('available');
  const [gameNames, setGameNames] = useState<string[]>([]);
  const [selectedGameName, setSelectedGameName] = useState('');
  const [newGameViewName, setNewGameViewName] = useState('');
  const [newGameViewDescription, setNewGameViewDescription] = useState('');
  const [newGameViewPublisher, setNewGameViewPublisher] = useState('');
  const [newGameViewReleaseDate, setNewGameViewReleaseDate] = useState(0);
  const [userGames, setUserGames] = useState<GameDetails[]>([]);
  const [sellerEmail, setSellerEmail] = useState('');
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [sellerFirstname, setSellerFirstname] = useState('');
  const [sellerLastname, setSellerLastname] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  // const [newGameViewStockStatus, setNewGameViewStockStatus] = useState(''); link to all matches to name count

  const gameDetailsCollectionRef = collection(database, "GameDetails");
  const gameViewCollectionRef = collection(database, "GameView");
  const usersCollectionRef = collection(database, "Users");

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          // Query Firestore for the user document based on email
          const usersRef = collection(database, 'Users');
          const q = query(usersRef, where('email', '==', authUser.email)); // Query where email matches
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]; // Assume unique email
            const data = userDoc.data() as UserProfile;
            setUserProfile({
              ...data,
            });
            setSellerId(userDoc.id);
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
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if ((selectedMenu === 'Stock' || selectedMenu === 'Deposit Product') && sellerId) {
      fetchAllGames();
      fetchGameNames();
    }
  }, [selectedMenu, sellerId]);

  const fetchGameNames = async () => {
    try {
      const gameNamesSnapshot = await getDocs(gameViewCollectionRef);
      const gameNamesList: string[] = gameNamesSnapshot.docs.map((doc) => doc.data().name);
      setGameNames(gameNamesList);
    } catch (error) {
      console.error('Error fetching game names:', error);
    }
  };

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

  // POST request to add a new game
const onSubmitGame = async () => {
  if (!selectedGameName) {
    toast.error('Please select a game name.');
    return;
  }

  try {
    // Wait for the result of the email check
    const emailExists = await handleEmailCheck();

    // If email doesn't exist and additional fields are not filled, don't proceed
    if (!emailExists && !sellerFirstname && !sellerLastname) {
      toast.error('Please provide seller details to create a new seller.');
      return; // Early return if additional fields are not filled
    }

    // If the email does not exist, create a new seller before proceeding
    if (!emailExists && sellerFirstname && sellerLastname) {
      await addDoc(usersCollectionRef, {
        email: sellerEmail,
        firstname: sellerFirstname,
        lastname: sellerLastname,
        address: sellerAddress,
        phone: sellerPhone,
        role: 'seller',
      });
      toast.success('New seller created successfully!');
    }

    // Proceed to add the game to the GameDetails collection
    await addDoc(gameDetailsCollectionRef, {
      name: selectedGameName,
      price: newGamePrice,
      seller_id: sellerEmail,  // Use email as seller_id
      discount: discount,
      quantity: quantity,
      stock_status: stockStatus,
      deposit_fee: deposit_fee,
      deposit_fee_type: deposit_fee_type,
      commission: commission,
      condition: condition,
    });

    toast.success('Game deposited successfully!');
    resetFormFields(); // Reset form fields after successful submission

  } catch (error) {
    console.error('Error adding game or creating seller:', error);
    toast.error('Error adding game or creating seller. Please try again.');
  }
};

// Helper function to check if seller email exists in Firestore
const handleEmailCheck = async (): Promise<boolean> => {
  try {
    const q = query(usersCollectionRef, where('email', '==', sellerEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return true;  // Email exists
    } else {
      setShowAdditionalFields(true);
      return false;  // Email does not exist
    }
  } catch (error) {
    toast.error('Error checking seller email. Please try again.');
    console.error('Error checking email:', error);
    return false;  // In case of error, treat as email not found
  }
};

// Helper function to reset form fields
const resetFormFields = () => {
  setShowAdditionalFields(false);
  setSelectedGameName('');
  setNewGamePrice(0);
  setDiscount(0);
  setQuantity(1);
  setDepositFee(0);
  setDepositType('');
  setCommission(0);
  setCondition('');
  setSellerEmail('');
  setSellerFirstname('');
  setSellerLastname('');
  setSellerAddress('');
  setSellerPhone('');
  setStockStatus('available');
};
  
  // POST request to create a new game view
  const onSubmitGameView = async () => {
    if (!newGameViewName.trim() || !newGameViewDescription.trim() || !newGameViewPublisher.trim() || !newGameViewReleaseDate) {
      toast.error('All fields are required. Please fill out every field.');
      return; // Stop further execution if any field is empty
    }
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
      setNewGameViewReleaseDate(0);
    } catch (error) {
      console.log('Error adding document', error);
    }
  };

  // GET request to fetch all games deposited by the current user
  const fetchAllGames = async () => {
    try {
      const querySnapshot = await getDocs(gameDetailsCollectionRef);

      const gamesList: GameDetails[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GameDetails[];

    setUserGames(gamesList);
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

        {/* Conditional rendering for cashiers */}
        {userProfile?.role === 'cashier' && (
          <ListItem disablePadding>
            <ListItemButton onClick={() => setSelectedMenu('Cashier')}>
              <ListItemIcon>
                <InboxIcon />
              </ListItemIcon>
              <ListItemText primary="Cashier" />
            </ListItemButton>
          </ListItem>
        )}
        

        {/* Conditional rendering for admins */}
        {userProfile?.role === 'admin' && (
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
            <ListItem disablePadding>
            <ListItemButton onClick={() => setSelectedMenu('Create Employee')}>
              <ListItemIcon>
                <InboxIcon />
              </ListItemIcon>
              <ListItemText primary="Create Employee" />
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
            <ListItemText primary="Phone" secondary={userProfile.phone} />
            </ListItem>
            <ListItem>
            <ListItemText primary="Address" secondary={userProfile.address} />
            </ListItem>
            <ListItem>
            <ListItemText primary="Date joined" secondary={userProfile.date_joined} />
            </ListItem>
          </List>
        </Paper>
      );
    }

    if (selectedMenu === 'Cashier') {
      return (
        <Box sx={{ display: 'flex', marginTop: '-5rem' }}>
          <Box component="main" sx={{ flexGrow: 1, p: 1.5, width: { sm: `calc(100% - ${drawerWidth}px)` }, marginLeft: { sm: `${drawerWidth}px` } }}>
            <Cashier />
          </Box>
        </Box>
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
            <Typography variant="h5" gutterBottom>
              Sales Dashboard
            </Typography>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <Stack spacing={2} direction="row">
                <Card sx={{ flexGrow: 1, height: 100 }}>
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      Total Products Sold
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Products in stock
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flexGrow: 1, height: 100 }}>
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      number
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      $$
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
                      Total commission
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flexGrow: 1, height: 42 }}>
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      Total deposit fees
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
                    Deposit a product
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
                    label="Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value))}
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
                  <TextField
                    label="Deposit Fee"
                    value={deposit_fee}
                    onChange={(e) => setDepositFee(parseFloat(e.target.value))}
                    type="number"
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Deposit Type"
                    value={deposit_fee_type}
                    onChange={(e) => setDepositType(e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Commission"
                    value={commission}
                    onChange={(e) => setCommission(parseFloat(e.target.value))}
                    type="number"
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
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
                  <TextField
                    label="Seller Email"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    type="email"
                    fullWidth
                    margin="normal"
                  />
                  {/* Additional Fields for new seller */}
                  {showAdditionalFields && (
                    <>
                      <TextField
                        label="First Name"
                        value={sellerFirstname}
                        onChange={(e) => setSellerFirstname(e.target.value)}
                        fullWidth
                        margin="normal"
                      />
                      <TextField
                        label="Last Name"
                        value={sellerLastname}
                        onChange={(e) => setSellerLastname(e.target.value)}
                        fullWidth
                        margin="normal"
                      />
                      <TextField
                        label="Address"
                        value={sellerAddress}
                        onChange={(e) => setSellerAddress(e.target.value)}
                        fullWidth
                        margin="normal"
                      />
                      <TextField
                        label="Phone"
                        value={sellerPhone}
                        onChange={(e) => setSellerPhone(e.target.value)}
                        type="number"
                        fullWidth
                        margin="normal"
                      />
                    </>
                  )}
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
                    value={newGameViewReleaseDate}
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
    }

    if (selectedMenu === 'Earnings report') {
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
              Earnings report
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
    }

    if (selectedMenu === 'Create Employee') {
      return (
        <Box sx={{ display: 'flex', marginTop: '-5rem' }}>
          <Box component="main" sx={{ flexGrow: 1, p: 1.5, width: { sm: `calc(100% - ${drawerWidth}px)` }, marginLeft: { sm: `${drawerWidth}px` } }}>
            <SignUp />
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
      <AppBarComponent handleDrawerToggle={handleDrawerToggle} />
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
