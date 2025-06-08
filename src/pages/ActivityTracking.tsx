import React, { useState, FormEvent } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
  Slider,
  Chip,
} from '@mui/material';
import { FitnessCenter as FitnessCenterIcon, DirectionsRun as RunIcon } from '@mui/icons-material';

const activityTypes = [
  { value: 'walking', label: 'Caminata', icon: '🚶' },
  { value: 'running', label: 'Correr', icon: '🏃' },
  { value: 'cycling', label: 'Ciclismo', icon: '🚴' },
  { value: 'swimming', label: 'Natación', icon: '🏊' },
  { value: 'gym', label: 'Gimnasio', icon: '💪' },
  { value: 'yoga', label: 'Yoga', icon: '🧘' },
  { value: 'other', label: 'Otro', icon: '⭐' },
];

const intensityLevels = [
  { value: 1, label: 'Muy Suave', color: '#4caf50' },
  { value: 2, label: 'Suave', color: '#8bc34a' },
  { value: 3, label: 'Moderado', color: '#ffc107' },
  { value: 4, label: 'Intenso', color: '#ff9800' },
  { value: 5, label: 'Muy Intenso', color: '#f44336' },
];

interface ActivityEntry {
  type: string;
  duration: number;
  intensity: number;
  caloriesBurned?: number;
  notes?: string;
}

export default function ActivityTracking() {
  const [activityType, setActivityType] = useState('');
  const [duration, setDuration] = useState<number>(30);
  const [intensity, setIntensity] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [recentActivities, setRecentActivities] = useState<ActivityEntry[]>([]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newActivity: ActivityEntry = {
      type: activityType,
      duration,
      intensity,
      caloriesBurned: calculateCalories(duration, intensity),
      notes,
    };
    setRecentActivities([newActivity, ...recentActivities]);
    // Aquí se implementará la lógica para guardar los datos
    console.log(newActivity);
  };

  const calculateCalories = (mins: number, intensityLevel: number): number => {
    // Cálculo simplificado de calorías (ejemplo)
    const baseRate = 4; // Calorías por minuto para intensidad media
    return Math.round(mins * baseRate * (intensityLevel / 3));
  };

  const getIntensityColor = (level: number) => {
    return intensityLevels.find((l) => l.value === level)?.color || '#000000';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Registro de Actividad Física
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registrar Nueva Actividad
              </Typography>
              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <FormControl fullWidth required>
                    <InputLabel>Tipo de Actividad</InputLabel>
                    <Select
                      value={activityType}
                      label="Tipo de Actividad"
                      onChange={(e) => setActivityType(e.target.value)}
                    >
                      {activityTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box>
                    <Typography gutterBottom>Duración (minutos)</Typography>
                    <Slider
                      value={duration}
                      onChange={(_, value) => setDuration(value as number)}
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={5}
                      max={180}
                    />
                  </Box>

                  <Box>
                    <Typography gutterBottom>Intensidad</Typography>
                    <Slider
                      value={intensity}
                      onChange={(_, value) => setIntensity(value as number)}
                      valueLabelDisplay="auto"
                      step={1}
                      marks={intensityLevels.map((level) => ({
                        value: level.value,
                        label: level.label,
                      }))}
                      min={1}
                      max={5}
                      sx={{
                        '& .MuiSlider-markLabel': {
                          fontSize: '0.75rem',
                        },
                      }}
                    />
                  </Box>

                  <TextField
                    label="Notas"
                    multiline
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<FitnessCenterIcon />}
                    fullWidth
                    size="large"
                    disabled={!activityType}
                  >
                    Registrar Actividad
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actividades Recientes
            </Typography>
            <Stack spacing={2}>
              {recentActivities.map((activity, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item>
                        <Typography variant="h4" component="span">
                          {activityTypes.find((t) => t.value === activity.type)?.icon}
                        </Typography>
                      </Grid>
                      <Grid item xs>
                        <Typography variant="subtitle1">
                          {activityTypes.find((t) => t.value === activity.type)?.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activity.duration} minutos
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={`Intensidad ${activity.intensity}`}
                            sx={{ bgcolor: getIntensityColor(activity.intensity) }}
                          />
                          <Chip
                            label={`${activity.caloriesBurned} kcal`}
                            variant="outlined"
                            color="primary"
                          />
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 