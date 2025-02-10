import React from 'react';
import { Typography, Link } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <footer style={{ backgroundColor: 'white', paddingTop: '20px', borderTop: '3px solid #f5f5f5'}}>
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        sx={{ marginLeft: "230px" }} // Ajout du marginLeft ici
      >
        Copyright © 2024 by Fastclick Firestore. All rights reserved. All trademarks are property of their respective owners.
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        sx={{ marginLeft: "230px" }} // Ajout du marginLeft ici
      >
        <Link color="inherit" href="/privacy-policy">
          Privacy Policy
        </Link>
        {' | '}
        <Link color="inherit" href="/terms-of-use">
          Terms of Use
        </Link>
      </Typography>
    </footer>
  );
};

export default Footer;