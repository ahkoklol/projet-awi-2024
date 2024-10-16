import { Grid, Stack, Card, CardContent, Typography, Box } from '@mui/material';

const SalesDashboard = () => {
  return (
    <Box sx={{ display: 'flex', marginTop: '-5rem' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 1.5,
          width: { sm: `calc(100% - 240px)` }, // Adjust drawer width if necessary
          marginLeft: { sm: `240px` },
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
              {/* Add any chart or table here */}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default SalesDashboard;
