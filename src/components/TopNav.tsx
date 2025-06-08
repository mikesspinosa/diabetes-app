import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { ArrowBack, Share } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface TopNavProps {
  title: string;
  showBack?: boolean;
  showShare?: boolean;
  onShare?: () => void;
}

export default function TopNav({ 
  title, 
  showBack = true, 
  showShare = false,
  onShare 
}: TopNavProps) {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <AppBar 
      position="static" 
      color="transparent" 
      elevation={0}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Toolbar>
        {showBack && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
        )}
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>

        {showShare && (
          <IconButton color="inherit" onClick={onShare}>
            <Share />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
} 