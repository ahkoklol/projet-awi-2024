import { Card, CardContent, Typography, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Home() {

    const navigate = useNavigate();

    const handleClickClient = () => {
        navigate('/allgames');
    };

    const handleClickAdmin = () => {
        navigate('/login');
    };

  return (
    <Grid container spacing={2} justifyContent="center" style={{ marginTop: '50px' }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="div">
              Client
            </Typography>
            <Button variant="contained" style={{ marginTop: '10px', backgroundColor: 'rgb(0, 186, 240)', color: 'white' }} onClick={handleClickClient}>
              I am a client
            </Button>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="div">
              Employee
            </Typography>
            <Button variant="contained" style={{ marginTop: '10px', backgroundColor: 'rgb(0, 186, 240)', color: 'white' }} onClick={handleClickAdmin}>
              I am an employee
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
