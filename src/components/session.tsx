import { useState, useEffect } from 'react';
import { useSession } from '../context/SessionContext';
import { database } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Box, Grid, Stack, Card, CardContent, Typography, TextField, Button } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Dayjs } from 'dayjs';
import { toast } from 'react-toastify';
import Paper from "@mui/material/Paper";

const sessionCollectionRef = collection(database, 'Session');

const Sessions = () => {
    const { isOpen, loading, endTime, eventName } = useSession();
    const [newEventName, setNewEventName] = useState('');
    const [endDate, setEndDate] = useState<Dayjs | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');

    const handleCreateSession = async () => {
        if (!newEventName || !endDate) {
            toast.error("Please fill out all fields.");
            return;
        }

        try {
            await addDoc(sessionCollectionRef, {
                event: newEventName,
                status: 'open',
                start: new Date(),
                end: endDate.toDate(),
            });

            console.log("Session created successfully.");
            toast.success("Session created successfully. Session will soon start.");
            setTimeout(() => {
                window.location.reload(); // Reload the page after 1 second
            }, 1000);
        } catch (error) {
            console.error("Error creating session:", error);
        }
    };

    useEffect(() => {
        if (endTime) {
            const updateTimer = () => {
                const now = new Date();
                const timeDifference = endTime.getTime() - now.getTime();

                if (timeDifference <= 0) {
                    setTimeLeft("Session has ended.");
                    return;
                }

                const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
                const seconds = Math.floor((timeDifference / 1000) % 60);

                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            };

            const timerInterval = setInterval(updateTimer, 1000);

            // Cleanup interval on component unmount
            return () => clearInterval(timerInterval);
        }
    }, [endTime]);

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    if (isOpen) {
        return (
            <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "20vh", // Augmenté pour un meilleur équilibre
                marginLeft: "200px",
                p: 3,
            }}
            >
            <Paper
                elevation={3}
                sx={{
                padding: "30px",
                border: "2px solid rgb(19, 38, 77)", // Bordure légèrement plus marquée
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.97)",
                boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.12)",
                transition: "transform 0.2s ease-in-out",
                "&:hover": { transform: "scale(1.02)" }, // Effet hover subtil
                textAlign: "center",
                width: "500px", // Augmenté pour donner plus d'espace
                }}
            >
                <Typography
                variant="h5" // Augmenté
                sx={{ fontWeight: "bold", color: "rgb(19, 38, 77)", marginBottom: 2 }}
                >
                Active Session
                </Typography>

                <Typography
                variant="h6" // Augmenté
                sx={{ fontWeight: "medium", color: "rgb(51, 79, 161)", marginBottom: 1 }}
                >
                Event: {eventName}
                </Typography>

                <Typography
                variant="h6" // Augmenté
                sx={{ color: "rgb(51, 79, 161)", marginBottom: 3 }}
                >
                End Time: {endTime?.toLocaleString()}
                </Typography>

                <Typography
                variant="h4" // Augmenté pour plus d'impact
                sx={{
                    fontWeight: "bold",
                    color: "red",
                    backgroundColor: "rgba(255, 0, 0, 0.08)",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "2px solid red", // Bordure légèrement plus visible
                    display: "inline-block",
                }}
                >
                Time Left: {timeLeft}
                </Typography>
            </Paper>
            </Box>


        );
    }

    return (
        <Box
        sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            p: 2,
            marginTop: "-220px",
        }}
        >
        {/* 🔹 TITRE CENTRÉ */}
        <Typography
            variant="h4"
            sx={{
            fontWeight: "bold",
            textAlign: "center",
            color: "rgb(19, 38, 77)",
            marginBottom: 3,
            marginLeft: "250px",

            }}
        >
            Create a New Session
        </Typography>

        {/* 🔹 CONTAINER FORMULAIRE CENTRÉ & STYLISÉ */}
        <Grid container justifyContent="center">
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
                marginLeft: "65px",
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
                    Session Details
                </Typography>

                {/* 🔹 FORMULAIRE COMPACTÉ */}
                <Stack spacing={2}>
                    <TextField
                    label="Event Name"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    fullWidth
                    />

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                        label="End Date & Time"
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        slotProps={{
                        textField: {
                            fullWidth: true,
                        },
                        }}
                    />
                    </LocalizationProvider>

                    {/* 🔹 BOUTON CENTRÉ */}
                    <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
                    <Button
                        variant="contained"
                        sx={{
                        backgroundColor: "rgb(19, 38, 77)",
                        color: "white",
                        "&:hover": { backgroundColor: "rgb(15, 30, 60)" },
                        width: "200px",
                        }}
                        onClick={handleCreateSession}
                    >
                        Open Session
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

export default Sessions;
