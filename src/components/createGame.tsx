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
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          p: 2,
        }}
      >
  
      <Grid container justifyContent="center">
        <Grid item xs={12} sx={{ textAlign: "center", marginBottom: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "rgb(19, 38, 77)",
              marginLeft: "220px",
              marginTop: "-250px",
            }}
          >
            Create a New Game
          </Typography>
        </Grid>

        <Grid item xs={12} md={8} lg={6}>
          <Card
            sx={{
              minWidth: "500px",
              border: "2px solid rgb(19, 38, 77)",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
              transition: "transform 0.3s ease-in-out",
              "&:hover": { transform: "scale(1.02)" },
              padding: "20px",
              marginTop: "-190px",
              marginLeft: "140px",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  textAlign: "center",
                  color: "rgb(19, 38, 77)",
                  marginBottom: 2,
                }}
              >
                Game Details
              </Typography>

              {/* 🔹 FORMULAIRE COMPACTÉ */}
              <Stack spacing={2}>
                <TextField
                  label="Game Name"
                  value={newGameViewName}
                  onChange={(e) => setNewGameViewName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Description"
                  value={newGameViewDescription}
                  onChange={(e) => setNewGameViewDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                />
                <TextField
                  label="Publisher"
                  value={newGameViewPublisher}
                  onChange={(e) => setNewGameViewPublisher(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Release Date"
                  value={newGameViewReleaseDate}
                  onChange={(e) => setNewGameViewReleaseDate(parseFloat(e.target.value))}
                  fullWidth
                  type="number"
                />

                {/* 🔹 BOUTON AJOUT STYLISÉ */}
                <Box sx={{ display: "flex", justifyContent: "center", width: "100%", marginTop: 2 }}>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "rgb(19, 38, 77)",
                      color: "white",
                      "&:hover": { backgroundColor: "rgb(15, 30, 60)" },
                      width: "200px",
                    }}
                    onClick={onSubmitGameView}
                  >
                    Add Game
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateGame;
