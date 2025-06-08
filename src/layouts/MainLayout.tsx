import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  MonitorHeart as GlucoseIcon,
  Restaurant as CarbsIcon,
  Medication as InsulinIcon,
  Assessment as StatsIcon,
  Notifications as AlertsIcon,
  Watch as DeviceIcon,
  TrendingUp as TrendsIcon,
  History as HistoryIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import BottomNav from '../components/BottomNav';

interface MenuSection {
  title: string;
  items: {
    path: string;
    label: string;
    icon: JSX.Element;
  }[];
}

const MainLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainMenuItems: MenuSection[] = [
    {
      title: 'Monitor',
      items: [
        { path: '/glucose', label: 'Glucosa', icon: <GlucoseIcon /> },
        { path: '/glucose/trends', label: 'Tendencias', icon: <TrendsIcon /> },
        { path: '/glucose/history', label: 'Historial', icon: <HistoryIcon /> },
      ]
    },
    {
      title: 'Tratamiento',
      items: [
        { path: '/carbs', label: 'Carbohidratos', icon: <CarbsIcon /> },
        { path: '/insulin', label: 'Insulina', icon: <InsulinIcon /> },
        { path: '/calculator', label: 'Calculadora', icon: <CalculateIcon /> },
      ]
    },
    {
      title: 'Análisis',
      items: [
        { path: '/stats', label: 'Estadísticas', icon: <StatsIcon /> },
        { path: '/devices', label: 'Dispositivos', icon: <DeviceIcon /> },
        { path: '/alerts', label: 'Alertas', icon: <AlertsIcon /> },
      ]
    }
  ];

  const getPageTitle = () => {
    if (location.pathname === '/') return 'DiabetesApp';
    const currentPath = location.pathname;
    for (const section of mainMenuItems) {
      const item = section.items.find(item => item.path === currentPath);
      if (item) return item.label;
    }
    return 'DiabetesApp';
  };

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const drawerContent = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        <ListItem>
          <Typography variant="h6">DiabetesApp</Typography>
        </ListItem>
        <Divider />
        {mainMenuItems.map((section, index) => (
          <React.Fragment key={section.title}>
            <ListItem>
              <Typography variant="subtitle2" color="text.secondary">
                {section.title}
              </Typography>
            </ListItem>
            {section.items.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={location.pathname === item.path}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
            {index < mainMenuItems.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Box className="min-h-screen bg-gray-50 flex flex-col">
      <AppBar 
        position="fixed" 
        color="default" 
        elevation={1}
        className="bg-white border-b border-gray-200"
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            className="mr-2"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" className="flex-grow">
            {getPageTitle()}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            aria-label="settings"
            onClick={() => navigate('/settings')}
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawerContent}
      </Drawer>

      {/* Main content */}
      <Box 
        component="main" 
        className="flex-grow w-full max-w-7xl mx-auto pt-16 pb-20 px-4 sm:px-6 lg:px-8"
      >
        <Outlet />
      </Box>

      {/* Bottom Navigation */}
      <Box
        component="nav"
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-white border-t border-gray-200"
      >
        <Box className="w-full max-w-7xl">
          <BottomNav mainMenuItems={mainMenuItems} />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout; 