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
import Cashier from '../components/cashier';
import SignUp from '../components/SignUp';
import SalesDashboard from '../components/salesDashboard';
import CreateGame from '../components/createGame';
import Stock from '../components/stock';

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

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('Edit Profile');
  const [newGamePrice, setNewGamePrice] = useState(0);
  const [sellerId, setSellerId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [deposit_fee, setDepositFee] = useState(0);
  const [deposit_fee_type, setDepositType] = useState('');
  const [commission, setCommission] = useState(0);
  const [stockStatus, setStockStatus] = useState('available');
  const [gameNames, setGameNames] = useState<string[]>([]);
  const [selectedGameName, setSelectedGameName] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [sellerFirstname, setSellerFirstname] = useState('');
  const [sellerLastname, setSellerLastname] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');

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
            const userDoc = querySnapshot.docs[0];
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
      quantity: quantity,
      stock_status: stockStatus,
      deposit_fee: deposit_fee,
      deposit_fee_type: deposit_fee_type,
      commission: commission,
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
  setQuantity(1);
  setDepositFee(0);
  setDepositType('');
  setCommission(0);
  setSellerEmail('');
  setSellerFirstname('');
  setSellerLastname('');
  setSellerAddress('');
  setSellerPhone('');
  setStockStatus('available');
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

          <ListItem disablePadding>
            <ListItemButton onClick={() => setSelectedMenu('Cashier')}>
              <ListItemIcon>
                <InboxIcon />
              </ListItemIcon>
              <ListItemText primary="Cashier" />
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
        <SalesDashboard/>
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
                    label="Deposit Fee"
                    value={deposit_fee}
                    onChange={(e) => setDepositFee(parseFloat(e.target.value))}
                    type="number"
                    fullWidth
                    margin="normal"
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="deposit-fee-type-label">Deposit Fee Type</InputLabel>
                    <Select
                      labelId="deposit-fee-type-label"
                      id="deposit-fee-type"
                      value={deposit_fee_type}
                      onChange={(e) => setDepositType(e.target.value)}
                      label="Deposit Fee Type"
                    >
                      <MenuItem value="fixed">Fixed</MenuItem>
                      <MenuItem value="percentage">Percentage</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Commission"
                    value={commission}
                    onChange={(e) => setCommission(parseFloat(e.target.value))}
                    type="number"
                    fullWidth
                    margin="normal"
                  />
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
        <CreateGame/>
      );
    }

    if (selectedMenu === 'Stock') {
      return (
        <Stock/>
      );
    }

    if (selectedMenu === 'Earnings report') {
      return (
            <Typography variant="h5" gutterBottom>
              Earnings report
            </Typography>
      );
    }

    if (selectedMenu === 'Create Employee') {
      return (
        <Box sx={{ display: 'flex', marginTop: '-160px' }}>
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
