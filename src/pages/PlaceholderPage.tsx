import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}
      >
        <ConstructionIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
        <Typography variant="h4" component="h1" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Esta página está en desarrollo...
        </Typography>
      </Paper>
    </Box>
  );
};

export default PlaceholderPage; 