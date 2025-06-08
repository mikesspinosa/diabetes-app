import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  useTheme,
} from '@mui/material';
import {
  MonitorHeart as GlucoseIcon,
  Restaurant as CarbsIcon,
  Medication as InsulinIcon,
} from '@mui/icons-material';

interface MenuItem {
  path: string;
  label: string;
  icon: JSX.Element;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface BottomNavProps {
  mainMenuItems: MenuSection[];
}

const BottomNav: React.FC<BottomNavProps> = ({ mainMenuItems }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  // Get only the main actions for the bottom nav
  const mainActions = [
    mainMenuItems[0].items[0], // Glucosa
    mainMenuItems[1].items[0], // Carbohidratos
    mainMenuItems[1].items[1], // Insulina
  ];

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: '16px 16px 0 0', // Rounded corners at the top
        overflow: 'hidden',
        zIndex: theme.zIndex.appBar,
      }}
      elevation={3}
    >
      <BottomNavigation
        value={location.pathname}
        onChange={(_, newValue) => {
          navigate(newValue);
        }}
        sx={{
          height: { xs: 64, sm: 72 },
          backgroundColor: 'background.paper',
          '& .MuiBottomNavigationAction-root': {
            maxWidth: 'none',
            minWidth: 0,
            padding: '6px 12px',
            color: 'text.secondary',
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
        }}
      >
        {mainActions.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            value={item.path}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav; 