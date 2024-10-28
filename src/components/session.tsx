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
            <Box>
                <Typography variant="h5">There is already a session open.</Typography>
                <Typography variant="h2">Event: {eventName}</Typography>
                <Typography variant="h3">End Time: {endTime?.toLocaleString()}</Typography>
                <Typography variant="h1" sx={{ color: 'red' }}>Time Left: {timeLeft}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', marginTop: '-6rem', marginBottom: '-3rem' }}>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 1.5,
                    width: { sm: `calc(100% - 240px)` },
                    marginLeft: { sm: `240px` },
                }}
            >
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Stack spacing={2} direction="row">
                            <Card sx={{ flexGrow: 1, height: 'auto' }}>
                                <CardContent>
                                    <Typography gutterBottom variant="h5" component="div">
                                        Create a new session
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', marginBottom: '1rem' }}>
                                        Use the form below to create a new session.
                                    </Typography>
                                    <TextField
                                        label="Event Name"
                                        value={newEventName}
                                        onChange={(e) => setNewEventName(e.target.value)}
                                        fullWidth
                                        margin="normal"
                                    />
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DateTimePicker
                                            label="End Date & Time"
                                            value={endDate}
                                            onChange={(newValue) => setEndDate(newValue)}
                                            slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
                                        />
                                    </LocalizationProvider>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleCreateSession}
                                        sx={{ marginTop: '20px' }}
                                    >
                                        Open Session
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

export default Sessions;
