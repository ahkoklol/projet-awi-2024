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
            <Button variant="contained" color="primary" style={{ marginTop: '10px' }} onClick={handleClickClient}>
              I am a client
            </Button>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="div">
              Admin
            </Typography>
            <Button variant="contained" color="primary" style={{ marginTop: '10px' }} onClick={handleClickAdmin}>
              I am a system administrator
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
