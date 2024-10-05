import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { query, where, getDocs, collection } from 'firebase/firestore';
import { Container, Typography, List, ListItem, Grid, Stack, Card, CardMedia, CardActions, CardContent, Button, AppBar, ListItemButton, ListItemIcon, ListItemText, Paper, CircularProgress, Box, CssBaseline, Toolbar, Divider, Drawer, IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Link } from 'react-router-dom';
import { auth, database } from '../config/firebase';
import { signOut } from 'firebase/auth';
import useAuth from "../hooks/useAuth";
import { toast } from "react-toastify";

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

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // For loading state
  const [mobileOpen, setMobileOpen] = useState(false); // For toggling drawer
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // For the menu in AppBar
  const [selectedMenu, setSelectedMenu] = useState('Edit Profile'); // For tracking selected menu item

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

  const drawer = (
    <div>
      <Toolbar style={{ paddingTop: '66px', paddingBottom: '2px' }}>
        {/* User profile info with icon */}
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
        {['Edit Profile', 'Sales Dashboard', 'Earnings Report', 'Stock'].map((text) => (
          <ListItem key={text} disablePadding>
            <ListItemButton onClick={() => setSelectedMenu(text)}> {/* Set selected menu item */}
              <ListItemIcon>
                {text === 'Edit Profile' || text === 'Earnings Report' ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  const renderContent = () => {
    if (selectedMenu === 'Edit Profile' && userProfile) {
      return (
        <Paper elevation={3} style={{ padding: '20px', marginTop: '20px', marginBottom: '20px' }}>
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
        <Box sx={{ display: 'flex', marginTop: '-4rem' }}>
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
