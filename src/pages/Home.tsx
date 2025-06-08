import { Grid, Card, CardContent, Typography, CardActionArea } from '@mui/material';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MedicationIcon from '@mui/icons-material/Medication';
import { useNavigate } from 'react-router-dom';

const quickAccessItems = [
  {
    title: 'Registrar Glucosa',
    description: 'Registra tus niveles de glucosa en sangre',
    icon: <MonitorHeartIcon sx={{ fontSize: 40 }} />,
    path: '/glucose',
  },
  {
    title: 'Registrar Comida',
    description: 'Registra tus alimentos y carbohidratos',
    icon: <RestaurantIcon sx={{ fontSize: 40 }} />,
    path: '/food',
  },
  {
    title: 'Registrar Actividad',
    description: 'Registra tu actividad física',
    icon: <FitnessCenterIcon sx={{ fontSize: 40 }} />,
    path: '/activity',
  },
  {
    title: 'Registrar Medicamento',
    description: 'Registra tus medicamentos e insulina',
    icon: <MedicationIcon sx={{ fontSize: 40 }} />,
    path: '/medication',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        ¡Bienvenido a DiabetesApp!
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Tu compañero diario para el control de la diabetes
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {quickAccessItems.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Card>
              <CardActionArea onClick={() => navigate(item.path)}>
                <CardContent sx={{ textAlign: 'center' }}>
                  {item.icon}
                  <Typography variant="h6" component="div" sx={{ mt: 2 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
} 