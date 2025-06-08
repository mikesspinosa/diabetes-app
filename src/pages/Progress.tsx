import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  IconButton,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import TopNav from '../components/TopNav';

// Datos de ejemplo
const mockData = [
  { time: '06:00', value: 120, type: 'Fasting' },
  { time: '09:00', value: 140, type: 'After Breakfast' },
  { time: '12:00', value: 110, type: 'Before Lunch' },
  { time: '15:00', value: 160, type: 'After Lunch' },
  { time: '18:00', value: 130, type: 'Before Dinner' },
  { time: '21:00', value: 145, type: 'After Dinner' },
];

const weeklyData = {
  Mon: { avg: 85, carbs: 180 },
  Tue: { avg: 110, carbs: 220 },
  Wed: { avg: 95, carbs: 150 },
  Thu: { avg: 120, carbs: 200 },
  Fri: { avg: 105, carbs: 190 },
  Sat: { avg: 130, carbs: 250 },
  Sun: { avg: 100, carbs: 170 },
};

export default function Progress() {
  const [timeRange, setTimeRange] = useState('14d');
  const [startDate, setStartDate] = useState(new Date());

  const handleTimeRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeRange: string,
  ) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    setStartDate(direction === 'prev' ? subDays(startDate, 7) : addDays(startDate, 7));
  };

  return (
    <>
      <TopNav title="Progreso" />
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6">Progreso</Typography>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            size="small"
          >
            <ToggleButton value="14d">14d</ToggleButton>
            <ToggleButton value="30d">30d</ToggleButton>
            <ToggleButton value="90d">90d</ToggleButton>
            <ToggleButton value="365d">365d</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <IconButton onClick={() => handleDateChange('prev')}>
            <ChevronLeft />
          </IconButton>
          <Typography>
            {format(startDate, 'd MMM yyyy', { locale: es })} -{' '}
            {format(addDays(startDate, 7), 'd MMM yyyy', { locale: es })}
          </Typography>
          <IconButton onClick={() => handleDateChange('next')}>
            <ChevronRight />
          </IconButton>
        </Stack>

        <Grid container spacing={3}>
          {/* Gráfico de Glucosa */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Niveles de Glucosa
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 200]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2196f3"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Estadísticas Semanales */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumen Semanal
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(weeklyData).map(([day, data]) => (
                    <Grid item xs={12} sm={6} md={3} key={day}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6">{day}</Typography>
                          <Typography color="text.secondary">
                            Promedio: {data.avg} mg/dL
                          </Typography>
                          <Typography color="text.secondary">
                            Carbos: {data.carbs}g
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  );
} 