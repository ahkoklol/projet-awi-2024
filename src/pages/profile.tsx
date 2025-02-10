import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { query, where, getDocs, collection, addDoc } from 'firebase/firestore';
import { Container, Typography, List, SelectChangeEvent, ListItem, Grid, FormControl, InputLabel, Select, TextField, Button, ListItemButton, ListItemIcon, ListItemText, Paper, CircularProgress, Box, CssBaseline, Toolbar, Divider, Drawer, MenuItem } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { auth, database } from '../config/firebase';
import { toast } from "react-toastify";
import { useSession } from '../context/SessionContext';
import AppBarComponent from '../components/adminAppBar';
import Cashier from '../components/cashier';
import SignUp from '../components/SignUp';
import FinancialStatementFastclick from '../components/financialsFastclick';
import CreateGame from '../components/createGame';
import Stock from '../components/stock';
import FinancialStatementSellers from '../components/financialsSellers';
import Sessions from '../components/session';
import PersonIcon from "@mui/icons-material/Person";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import InventoryIcon from "@mui/icons-material/Inventory";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AddBoxIcon from "@mui/icons-material/AddBox";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import HistoryIcon from "@mui/icons-material/History";

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
  const [selectedMenu, setSelectedMenu] = useState('Profile View');
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
  const [stockLocation, setStockLocation] = useState('');

  const { isOpen: isSessionOpen } = useSession();

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

  // Function to handle stock location change
  const handleStockLocationChange = (event: SelectChangeEvent) => {
    const location = event.target.value;
    setStockLocation(location);

    // Set stock status based on location choice
    if (location === "aisle") {
      setStockStatus("available");
    } else if (location === "storage") {
      setStockStatus("pending");
    }
  };

  // POST request to add a new game
const onSubmitGame = async () => {

  if (!isSessionOpen) {
    toast.error('No active session. Please open a session to deposit a product.');
    return;
  }

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

    // Add multiple games based on the quantity input
    for (let i = 0; i < quantity; i++) {
      await addDoc(gameDetailsCollectionRef, {
        name: selectedGameName,
        price: newGamePrice,
        seller_id: sellerEmail,
        quantity: 1, 
        stock_status: stockStatus,
        deposit_fee: deposit_fee,
        deposit_fee_type: deposit_fee_type,
        commission: commission,
      });
    }

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
  setStockLocation('');
};
  
  const drawer = (
      <div>
        <Toolbar style={{ paddingTop: "66px", paddingBottom: "2px" }}>
          <ListItem>
            <ListItemIcon>
              <AccountCircleIcon fontSize="large" sx={{ color: "rgb(19, 38, 77)" }} />
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
            <ListItemButton onClick={() => setSelectedMenu("Profile View")}>
              <ListItemIcon>
                <PersonIcon sx={{ color: "rgb(19, 38, 77)" }} />
              </ListItemIcon>
              <ListItemText primary="Profile View" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton onClick={() => setSelectedMenu("Cashier")}>
              <ListItemIcon>
                <PointOfSaleIcon sx={{ color: "rgb(19, 38, 77)" }} />
              </ListItemIcon>
              <ListItemText primary="Cashier" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton onClick={() => setSelectedMenu("Stock")}>
              <ListItemIcon>
                <InventoryIcon sx={{ color: "rgb(19, 38, 77)" }} />
              </ListItemIcon>
              <ListItemText primary="Stock" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton onClick={() => setSelectedMenu("Deposit Product")}>
              <ListItemIcon>
                <AttachMoneyIcon sx={{ color: "rgb(19, 38, 77)" }} />
              </ListItemIcon>
              <ListItemText primary="Deposit Product" />
            </ListItemButton>
          </ListItem>

          {/* Conditional rendering for admins */}
          {userProfile?.role === "admin" && (
            <>
              <ListItem disablePadding>
                <ListItemButton onClick={() => setSelectedMenu("Financials Fastclick")}>
                  <ListItemIcon>
                    <MonetizationOnIcon sx={{ color: "rgb(19, 38, 77)" }} />
                  </ListItemIcon>
                  <ListItemText primary="Financials Fastclick" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={() => setSelectedMenu("Financials Sellers")}>
                  <ListItemIcon>
                    <MonetizationOnIcon sx={{ color: "rgb(19, 38, 77)" }} />
                  </ListItemIcon>
                  <ListItemText primary="Financials Sellers" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={() => setSelectedMenu("Create Game")}>
                  <ListItemIcon>
                    <AddBoxIcon sx={{ color: "rgb(19, 38, 77)" }} />
                  </ListItemIcon>
                  <ListItemText primary="Create Game" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={() => setSelectedMenu("Create Employee")}>
                  <ListItemIcon>
                    <GroupAddIcon sx={{ color: "rgb(19, 38, 77)" }} />
                  </ListItemIcon>
                  <ListItemText primary="Create Employee" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={() => setSelectedMenu("Sessions")}>
                  <ListItemIcon>
                    <HistoryIcon sx={{ color: "rgb(19, 38, 77)" }} />
                  </ListItemIcon>
                  <ListItemText primary="Sessions" />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </div>
);


  const renderContent = () => {
    if (selectedMenu === 'Profile View' && userProfile) {
      return (
            <Paper
            elevation={0}
            sx={{
              padding: "20px",
              marginTop: "-70px",
              marginBottom: "20px",
              marginLeft: `${drawerWidth}px`,
              boxShadow: "0px 8px 10px rgba(0, 0, 0, 0.2)",
              border: 3,
              borderRadius: 7,
              borderColor: 'rgb(19, 38, 77)',
            }}
          >
          <Typography variant="h4" fontWeight={600} style={{ marginTop: "20px" }}>
            {userProfile.firstname} {userProfile.lastname}
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {userProfile.role}
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Email"
                secondary={userProfile.email}
                primaryTypographyProps={{ fontWeight: "bold" }} // Met en gras
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Phone"
                secondary={userProfile.phone}
                primaryTypographyProps={{ fontWeight: "bold" }} // Met en gras
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Address"
                secondary={userProfile.address}
                primaryTypographyProps={{ fontWeight: "bold" }} // Met en gras
              />
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

    if (selectedMenu === 'Financials Fastclick') {
      return (
        <FinancialStatementFastclick/>
      );
    }










    if (selectedMenu === 'Deposit Product') {
      return (
        <Box sx={{ display: "flex", marginTop: "-6rem", marginBottom: "-3rem" }}>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 2,
              width: "100%",
              marginLeft: { sm: `${drawerWidth}px` },
            }}
          >
            <Grid container spacing={3}>
              {/* 🔹 TITRE CENTRÉ */}
              <Grid item xs={12}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", textAlign: "center", color: "rgb(19, 38, 77)", marginBottom: 2 }}
                >
                  Deposit a Product
                </Typography>
              </Grid>
    
              {/* 🔹 SECTION GAME INFO */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    padding: "20px",
                    border: "2px solid rgb(19, 38, 77)",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
                    transition: "transform 0.3s ease-in-out",
                    "&:hover": { transform: "scale(1.02)" },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                    Game Details
                  </Typography>
    
                  <FormControl fullWidth sx={{ marginBottom: 2 }}>
                    <InputLabel id="game-name-label">Game Name</InputLabel>
                    <Select
                      labelId="game-name-label"
                      id="game-name"
                      value={selectedGameName}
                      onChange={handleGameNameChange}
                      label="Game Name"
                    >
                      {gameNames.map((name) => (
                        <MenuItem key={name} value={name}>
                          {name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
    
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField label="Price" type="number" value={newGamePrice} onChange={(e) => setNewGamePrice(parseFloat(e.target.value))} fullWidth />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value))} fullWidth />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
    
              {/* 🔹 SECTION DEPOSIT INFO */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    padding: "20px",
                    border: "2px solid rgb(19, 38, 77)",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
                    transition: "transform 0.3s ease-in-out",
                    "&:hover": { transform: "scale(1.02)" },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                    Deposit Information
                  </Typography>
    
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField label="Deposit Fee" type="number" value={deposit_fee} onChange={(e) => setDepositFee(parseFloat(e.target.value))} fullWidth />
                    </Grid>
                    <Grid item xs={6}>

                    <FormControl fullWidth sx={{ marginBottom: 2 }}>
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

                    </Grid>
                  </Grid>
    
                  <TextField
                    label="Commission"
                    type="number"
                    value={commission}
                    onChange={(e) => setCommission(parseFloat(e.target.value))}
                    fullWidth
                    sx={{ marginTop: 2 }}
                  />
                </Paper>
              </Grid>
    
              {/* 🔹 SECTION STOCK LOCATION */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    padding: "20px",
                    border: "2px solid rgb(19, 38, 77)",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
                    transition: "transform 0.3s ease-in-out",
                    "&:hover": { transform: "scale(1.02)" },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                    Stock Information
                  </Typography>
    

                  <FormControl fullWidth sx={{ marginBottom: 2 }}>
                    <InputLabel id="stock-location-label">Stock Location</InputLabel>
                    <Select
                      labelId="stock-location-label"
                      id="stock-location"
                      value={stockLocation}
                      onChange={handleStockLocationChange}
                      label="Stock Location"
                    >
                      <MenuItem value="aisle">To the Aisle</MenuItem>
                      <MenuItem value="storage">To Storage</MenuItem>
                    </Select>
                  </FormControl>
                </Paper>
              </Grid>
    
              {/* 🔹 SECTION SELLER INFO */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    padding: "20px",
                    border: "2px solid rgb(19, 38, 77)",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
                    transition: "transform 0.3s ease-in-out",
                    "&:hover": { transform: "scale(1.02)" },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                    Seller Information
                  </Typography>
    
                  <TextField label="Seller Email" type="email" value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} fullWidth />
    
                  {showAdditionalFields && (
                    <>
                      <TextField label="First Name" value={sellerFirstname} onChange={(e) => setSellerFirstname(e.target.value)} fullWidth sx={{ marginTop: 2 }} />
                      <TextField label="Last Name" value={sellerLastname} onChange={(e) => setSellerLastname(e.target.value)} fullWidth sx={{ marginTop: 2 }} />
                      <TextField label="Address" value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} fullWidth sx={{ marginTop: 2 }} />
                      <TextField label="Phone" type="number" value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} fullWidth sx={{ marginTop: 2 }} />
                    </>
                  )}
                </Paper>
              </Grid>
    
              {/* 🔹 BOUTON ADD GAME */}
              <Grid item xs={12} sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "rgb(19, 38, 77)",
                    color: "white",
                    "&:hover": { backgroundColor: "rgb(15, 30, 60)" },
                    width: "200px",
                  }}
                  onClick={onSubmitGame}
                >
                  Add Game
                </Button>
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

    if (selectedMenu === 'Financials Sellers') {
      return (
            <FinancialStatementSellers/>
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

    if (selectedMenu === 'Sessions') {
      return (
            <Sessions/>
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
