import { useState } from 'react';
import { Card, CardContent, TextField, Button, Typography, Box, Stack, Grid } from '@mui/material';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from "react-toastify";
import { database } from '../config/firebase'; // Update path as necessary

const gameViewCollectionRef = collection(database, "GameView");

const CreateGame = () => {
  const [newGameViewName, setNewGameViewName] = useState('');
  const [newGameViewDescription, setNewGameViewDescription] = useState('');
  const [newGameViewPublisher, setNewGameViewPublisher] = useState('');
  const [newGameViewReleaseDate, setNewGameViewReleaseDate] = useState(0);

  const onSubmitGameView = async () => {
    if (!newGameViewName.trim() || !newGameViewDescription.trim() || !newGameViewPublisher.trim() || !newGameViewReleaseDate) {
      toast.error('All fields are required. Please fill out every field.');
      return;
    }

    try {
      const gameViewQuery = query(gameViewCollectionRef, where('name', '==', newGameViewName));
      const querySnapshot = await getDocs(gameViewQuery);

      if (!querySnapshot.empty) {
        toast.error('This game already exists. You can add products to the existing game.');
        return;
      }

      await addDoc(gameViewCollectionRef, {
        name: newGameViewName,
        publisher: newGameViewPublisher,
        description: newGameViewDescription,
        release_date: newGameViewReleaseDate,
      });

      toast.success('Game added successfully!');
      resetFormFields(); // Reset fields after successful submission
    } catch (error) {
      console.error('Error adding game view:', error);
      toast.error('Error adding game. Please try again.');
    }
  };

  const resetFormFields = () => {
    setNewGameViewName('');
    setNewGameViewDescription('');
    setNewGameViewPublisher('');
    setNewGameViewReleaseDate(0);
  };

  return (
    <Box sx={{ display: 'flex', marginTop: '-6rem', marginBottom: '-3rem' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 1.5,
          width: { sm: `calc(100% - 240px)` }, // Adjust drawer width if necessary
          marginLeft: { sm: `240px` },
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
};

export default CreateGame;
