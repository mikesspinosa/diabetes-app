import React, { useState, useRef, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  alpha,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Brush,
  Scatter,
} from 'recharts';
import { format, subHours, isWithinInterval } from 'date-fns';
import type { Theme as MuiTheme } from '@mui/material/styles';

interface GlucoseDataPoint {
  time: string;
  value: number;
  isHigh?: boolean;
  isLow?: boolean;
  isPeak?: boolean;
  isValley?: boolean;
  insulin?: {
    rapid: number;
    long: number;
    time: string;
  };
  carbs?: {
    amount: number;
    type: 'low' | 'medium' | 'high'; // índice glucémico
    description?: string;
    time: string;
  };
  exercise?: {
    duration: number; // minutos
    intensity: 'low' | 'medium' | 'high';
    type: string;
    time: string;
  };
}

interface TrendAnalysis {
  type: 'high' | 'low' | 'peak' | 'valley';
  time: string;
  value: number;
  possibleReason: string;
  relatedEvents?: {
    insulin?: GlucoseDataPoint['insulin'];
    carbs?: GlucoseDataPoint['carbs'];
    exercise?: GlucoseDataPoint['exercise'];
  };
}

// Configuración de rangos de tiempo
const timeRanges = [
  { value: '2h', label: '2 horas', hours: 2, interval: 10 }, // Cada 10 minutos
  { value: '12h', label: '12 horas', hours: 12, interval: 30 }, // Cada 30 minutos
  { value: '24h', label: '24 horas', hours: 24, interval: 60 }, // Cada hora
  { value: '7d', label: '7 días', hours: 168, interval: 240 }, // Cada 4 horas
  { value: '14d', label: '14 días', hours: 336, interval: 720 }, // Cada 12 horas
] as const;

// Mock data generator function
const generateMockData = (hours: number): GlucoseDataPoint[] => {
  const data: GlucoseDataPoint[] = [];
  const now = new Date();
  
  // Ajustar el intervalo según el rango de tiempo
  let interval: number;
  if (hours > 168) { // más de 7 días (14 días)
    interval = 360; // 6 horas
  } else if (hours > 72) { // más de 3 días
    interval = 180; // 3 horas
  } else if (hours > 24) { // más de 1 día
    interval = 120; // 2 horas
  } else if (hours === 24) {
    interval = 60; // 1 hora para 24h
  } else if (hours > 12) {
    interval = 30; // 30 minutos
  } else if (hours > 4) {
    interval = 15; // 15 minutos
  } else {
    interval = 5; // 5 minutos para rangos cortos
  }

  // Generar puntos detallados primero
  const detailedPoints: { time: Date; value: number }[] = [];
  const minutesBetweenPoints = hours > 168 ? 30 : (hours > 24 ? 15 : 5); // Ajustar granularidad inicial
  const totalDetailedPoints = (hours * 60) / minutesBetweenPoints;

  for (let i = 0; i < totalDetailedPoints; i++) {
    const time = new Date(now.getTime() - (hours * 60 * 60 * 1000) + (i * minutesBetweenPoints * 60 * 1000));
    const hourOfDay = time.getHours();
    let baseValue = 120;
    
    // Simular patrones diarios
    if (hourOfDay >= 6 && hourOfDay < 8) {
      baseValue += 40; // Dawn phenomenon
    } else if (hourOfDay >= 11 && hourOfDay < 14) {
      baseValue += 30; // Post-almuerzo
    } else if (hourOfDay >= 18 && hourOfDay < 21) {
      baseValue += 25; // Post-cena
    } else if (hourOfDay >= 0 && hourOfDay < 4) {
      baseValue -= 20; // Madrugada
    }
    
    const randomVariation = Math.random() * 40 - 20;
    const value = Math.max(40, Math.min(300, baseValue + randomVariation));
    
    detailedPoints.push({
      time,
      value: Math.round(value)
    });
  }

  // Agrupar y promediar puntos según el intervalo
  let currentGroup: { time: Date; value: number }[] = [];
  let currentIntervalStart = detailedPoints[0].time;
  
  detailedPoints.forEach((point) => {
    if (point.time.getTime() - currentIntervalStart.getTime() < interval * 60 * 1000) {
      currentGroup.push(point);
    } else {
      if (currentGroup.length > 0) {
        // Calcular el promedio del grupo
        const avgValue = Math.round(
          currentGroup.reduce((sum, p) => sum + p.value, 0) / currentGroup.length
        );
        
        // Usar el tiempo del punto medio del intervalo
        const midPoint = currentGroup[Math.floor(currentGroup.length / 2)];
        
        data.push({
          time: midPoint.time.toISOString(),
          value: avgValue,
        });
      }
      currentIntervalStart = point.time;
      currentGroup = [point];
    }
  });

  // No olvidar el último grupo
  if (currentGroup.length > 0) {
    const avgValue = Math.round(
      currentGroup.reduce((sum, p) => sum + p.value, 0) / currentGroup.length
    );
    const midPoint = currentGroup[Math.floor(currentGroup.length / 2)];
    data.push({
      time: midPoint.time.toISOString(),
      value: avgValue,
    });
  }

  // Analizar los datos para detectar eventos importantes
  return data.map((point, index, arr) => {
    const value = point.value;
    const isHigh = value > 180;
    const isLow = value < 70;
    
    // Detectar picos y valles significativos
    const isPeak = index > 0 && index < arr.length - 1 &&
      value > arr[index - 1].value && value > arr[index + 1].value && value > 160;
    const isValley = index > 0 && index < arr.length - 1 &&
      value < arr[index - 1].value && value < arr[index + 1].value && value < 90;

    return {
      ...point,
      isHigh,
      isLow,
      isPeak,
      isValley,
    };
  });
};

// Función para formatear el tiempo según el rango
const formatTimeByRange = (date: Date, hours: number): string => {
  if (hours > 168) { // Más de 7 días
    return format(date, 'dd/MM');
  } else if (hours > 24) { // Más de 1 día
    return format(date, 'dd/MM HH:mm');
  } else if (hours > 12) { // Más de 12 horas
    return format(date, 'HH:mm');
  } else { // 12 horas o menos
    return format(date, 'HH:mm');
  }
};

// Add proper types for the dot render function
type DotProps = {
  cx?: number;
  cy?: number;
  payload?: GlucoseDataPoint;
};

type Theme = MuiTheme & {
  breakpoints: {
    down: (key: string) => string;
    between: (start: string, end: string) => string;
  };
};

const GlucoseMonitoring: React.FC = () => {
  const theme = useTheme<Theme>();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [currentGlucose, setCurrentGlucose] = useState(120);
  const [trend, setTrend] = useState<'up' | 'down' | 'flat'>('flat');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('12h');
  const [glucoseData, setGlucoseData] = useState<GlucoseDataPoint[]>(() => 
    generateMockData(timeRanges.find(r => r.value === '12h')?.hours || 12)
  );
  
  // Estado para el zoom y rango visible
  const [zoomDomain, setZoomDomain] = useState<{ start: number; end: number } | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const chartRef = useRef<any>(null);

  // Obtener la configuración actual del rango de tiempo
  const currentTimeConfig = timeRanges.find(r => r.value === timeRange) || timeRanges[1];

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    const newRange = event.target.value;
    setTimeRange(newRange);
    const rangeConfig = timeRanges.find(r => r.value === newRange);
    if (rangeConfig) {
      setGlucoseData(generateMockData(rangeConfig.hours));
      setZoomDomain(null); // Resetear zoom al cambiar el rango
    }
  };

  // Funciones para el control de zoom
  const handleZoomIn = () => {
    if (!zoomDomain) {
      const length = glucoseData.length;
      setZoomDomain({
        start: Math.floor(length * 0.25),
        end: Math.floor(length * 0.75)
      });
    } else {
      const range = zoomDomain.end - zoomDomain.start;
      const mid = Math.floor((zoomDomain.start + zoomDomain.end) / 2);
      const newRange = Math.max(Math.floor(range * 0.5), 10);
      setZoomDomain({
        start: Math.max(0, mid - Math.floor(newRange / 2)),
        end: Math.min(glucoseData.length - 1, mid + Math.floor(newRange / 2))
      });
    }
  };

  const handleZoomOut = () => {
    if (zoomDomain) {
      const range = zoomDomain.end - zoomDomain.start;
      const mid = Math.floor((zoomDomain.start + zoomDomain.end) / 2);
      const newRange = Math.min(range * 2, glucoseData.length);
      const newStart = Math.max(0, mid - Math.floor(newRange / 2));
      const newEnd = Math.min(glucoseData.length - 1, mid + Math.floor(newRange / 2));
      
      if (newEnd - newStart >= glucoseData.length - 2) {
        setZoomDomain(null);
      } else {
        setZoomDomain({ start: newStart, end: newEnd });
      }
    }
  };

  const handleResetZoom = () => {
    setZoomDomain(null);
  };

  // Calcular el dominio del eje Y basado en los datos visibles
  const getYDomain = () => {
    if (zoomDomain) {
      return [Math.max(40, zoomDomain.start), Math.min(300, zoomDomain.end)];
    }
    return [40, 300]; // Rango más amplio por defecto
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setCurrentGlucose(Math.floor(Math.random() * (180 - 70) + 70));
      setLastUpdate(new Date());
      setIsLoading(false);
    }, 1000);
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon className="text-red-500" />;
      case 'down':
        return <TrendingDownIcon className="text-yellow-500" />;
      default:
        return <TrendingFlatIcon className="text-green-500" />;
    }
  };

  const getGlucoseStatus = () => {
    if (currentGlucose > 180) return { color: 'error', text: 'Alto' };
    if (currentGlucose < 70) return { color: 'warning', text: 'Bajo' };
    return { color: 'success', text: 'En rango' };
  };

  // Función para obtener la configuración de visualización según el rango de tiempo
  const getTimeDisplayConfig = () => {
    const timeRangeHours = timeRanges.find(r => r.value === timeRange)?.hours || 12;
    
    // Ajustar el número de ticks según el rango de tiempo
    let tickCount: number;
    if (timeRangeHours > 168) { // 14 días
      tickCount = 7; // Un punto cada dos días
    } else if (timeRangeHours > 72) { // más de 3 días
      tickCount = 8;
    } else if (timeRangeHours === 24) { // exactamente 24 horas
      tickCount = 6; // Un punto cada 4 horas
    } else if (timeRangeHours > 12) {
      tickCount = 8;
    } else if (timeRangeHours > 4) {
      tickCount = 6;
    } else {
      tickCount = 5;
    }
    
    return {
      tickCount,
      angleLabels: timeRangeHours > 24,
      formatTick: (time: string) => {
        const date = new Date(time);
        if (timeRangeHours > 168) { // 14 días
          return format(date, 'dd/MM');
        } else if (timeRangeHours > 24) {
          return format(date, 'dd/MM HH:mm');
        } else {
          return format(date, 'HH:mm');
        }
      }
    };
  };

  // Función para formatear las etiquetas de tiempo
  const formatXAxisTick = (value: string) => {
    try {
      const date = new Date(value);
      const config = getTimeDisplayConfig();
      return config.formatTick(value);
    } catch {
      return value;
    }
  };

  const timeConfig = getTimeDisplayConfig();

  // Función para generar posibles razones de eventos
  const generatePossibleReason = (type: 'high' | 'low' | 'peak' | 'valley', time: string, events?: TrendAnalysis['relatedEvents']): string => {
    if (!events) return '';

    const reasons: string[] = [];
    
    if (events.insulin?.rapid) {
      reasons.push('considerar ajustar las dosis de insulina para las comidas');
    }
    
    if (events.carbs) {
      reasons.push('revisar los snacks entre comidas');
    }
    
    return reasons.join(', ');
  };

  // Analizar los datos para detectar eventos importantes
  const analyzedData = useMemo(() => {
    const data = generateMockData(timeRanges.find(r => r.value === timeRange)?.hours || 12);
    const analyzed: GlucoseDataPoint[] = data.map((point, index, arr) => {
      const value = point.value;
      const isHigh = value > 180;
      const isLow = value < 70;
      
      // Detectar picos y valles
      const isPeak = index > 0 && index < arr.length - 1 &&
        value > arr[index - 1].value && value > arr[index + 1].value && value > 160;
      const isValley = index > 0 && index < arr.length - 1 &&
        value < arr[index - 1].value && value < arr[index + 1].value && value < 90;

      return {
        ...point,
        isHigh,
        isLow,
        isPeak,
        isValley,
      };
    });

    return analyzed;
  }, [timeRange]);

  // Extraer eventos significativos para el análisis
  const significantEvents = useMemo(() => {
    const events: TrendAnalysis[] = [];
    
    analyzedData.forEach((point) => {
      if (point.isPeak) {
        events.push({
          type: 'peak',
          time: point.time,
          value: point.value,
          possibleReason: generatePossibleReason('peak', point.time),
        });
      } else if (point.isValley) {
        events.push({
          type: 'valley',
          time: point.time,
          value: point.value,
          possibleReason: generatePossibleReason('valley', point.time),
        });
      } else if (point.isHigh) {
        events.push({
          type: 'high',
          time: point.time,
          value: point.value,
          possibleReason: generatePossibleReason('high', point.time),
        });
      } else if (point.isLow) {
        events.push({
          type: 'low',
          time: point.time,
          value: point.value,
          possibleReason: generatePossibleReason('low', point.time),
        });
      }
    });

    return events;
  }, [analyzedData]);

  const getTimeRangeAnalysis = (timeRangeHours: number, data: GlucoseDataPoint[]): string[] => {
    const analysis: string[] = [];
    
    if (data.length === 0) return analysis;

    // Calculate statistics
    const values = data.map(d => d.value);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    const inRangeCount = values.filter(v => v >= 70 && v <= 180).length;
    const inRangePercentage = (inRangeCount / values.length) * 100;

    // Add analysis based on statistics
    analysis.push(`Promedio de glucosa: ${Math.round(avgValue)} mg/dL`);
    analysis.push(`Tiempo en rango: ${Math.round(inRangePercentage)}%`);

    return analysis;
  };

  // Fix the dot render function to always return an element
  const renderDot = ({ cx, cy, payload }: DotProps): React.ReactElement<SVGElement> => {
    if (!cx || !cy || !payload) {
      return (
        <circle
          cx={cx || 0}
          cy={cy || 0}
          r={2}
          fill={theme.palette.primary.main}
        />
      );
    }
    
    if (payload.isPeak) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          stroke={theme.palette.error.main}
          fill={theme.palette.error.light}
          strokeWidth={2}
        />
      );
    }
    if (payload.isValley) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          stroke={theme.palette.warning.main}
          fill={theme.palette.warning.light}
          strokeWidth={2}
        />
      );
    }
    if (payload.isHigh) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill={theme.palette.error.main}
        />
      );
    }
    if (payload.isLow) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill={theme.palette.warning.main}
        />
      );
    }
    return (
      <circle
        cx={cx}
        cy={cy}
        r={2}
        fill={theme.palette.primary.main}
      />
    );
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    const values = analyzedData.map(d => d.value);
    const avgValue = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const inRangeCount = values.filter(v => v >= 70 && v <= 180).length;
    const inRangePercentage = Math.round((inRangeCount / values.length) * 100);
    const eventCount = values.filter(v => v < 70 || v > 180).length;

    return {
      average: avgValue,
      inRange: inRangePercentage,
      events: eventCount
    };
  }, [analyzedData]);

  // Función para obtener los colores del gradiente con efecto 3D
  const getGradientColors = (type: 'average' | 'inRange' | 'events', value: number) => {
    const baseColors = {
      success: ['rgba(52, 211, 153, 0.95)', 'rgba(16, 185, 129, 0.85)'], // Verde
      warning: ['rgba(251, 191, 36, 0.95)', 'rgba(245, 158, 11, 0.85)'], // Naranja
      error: ['rgba(248, 113, 113, 0.95)', 'rgba(239, 68, 68, 0.85)'],   // Rojo
    };

    switch (type) {
      case 'average':
        if (value <= 70) return baseColors.error;
        if (value <= 180) return baseColors.success;
        return baseColors.warning;
      case 'inRange':
        if (value >= 80) return baseColors.success;
        if (value >= 60) return baseColors.warning;
        return baseColors.error;
      case 'events':
        if (value <= 2) return baseColors.success;
        if (value <= 5) return baseColors.warning;
        return baseColors.error;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Current Glucose Card */}
        <Card className="bg-white rounded-xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <Typography variant="h6" className="text-gray-600">
                Glucosa Actual
              </Typography>
              <IconButton 
                size="small" 
                onClick={handleRefresh} 
                disabled={isLoading}
                className="-mt-1"
              >
                {isLoading ? <CircularProgress size={24} /> : <RefreshIcon />}
              </IconButton>
            </div>
            
            <div className="flex items-baseline mb-4">
              <Typography variant={isMobile ? "h3" : "h2"} component="div" className="mr-2">
                {currentGlucose}
              </Typography>
              <Typography variant="h6" className="text-gray-500">
                mg/dL
              </Typography>
            </div>
            
            <Stack direction="row" spacing={2} alignItems="center" className="mb-4">
              {getTrendIcon()}
              <Chip 
                label={getGlucoseStatus().text}
                color={getGlucoseStatus().color as any}
                size={isMobile ? "small" : "medium"}
                className="font-medium"
              />
            </Stack>
            
            <Typography variant="body2" className="text-gray-500">
              Última actualización: {format(lastUpdate, 'HH:mm')}
            </Typography>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card 
          className="bg-white rounded-xl shadow-lg"
          sx={{
            '& .MuiCardContent-root': {
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }
          }}
        >
          <CardContent className="p-4">
            <Typography variant="h6" className="text-gray-700 mb-4">
              Estadísticas
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 2, md: 3 },
                flex: 1,
                width: '100%',
                '& > div': {
                  flex: 1,
                  minWidth: { xs: '100%', sm: 0 },
                  aspectRatio: '1/1',
                  borderRadius: '20px',
                  padding: { xs: 2, sm: 2.5 },
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: (theme) => `
                    inset 0 2px 4px -1px rgba(255,255,255,0.5),
                    inset 0 -2px 4px -1px rgba(0,0,0,0.2),
                    0 8px 16px -4px rgba(0,0,0,0.2)
                  `,
                  transform: 'perspective(1000px) rotateX(10deg)',
                  transformOrigin: 'center center',
                  '&:hover': {
                    transform: 'perspective(1000px) rotateX(5deg) translateY(-5px)',
                    boxShadow: (theme) => `
                      inset 0 2px 4px -1px rgba(255,255,255,0.7),
                      inset 0 -2px 4px -1px rgba(0,0,0,0.3),
                      0 12px 24px -8px rgba(0,0,0,0.3)
                    `,
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.7,
                    zIndex: 0,
                    background: `
                      linear-gradient(
                        135deg,
                        rgba(255,255,255,0.5) 0%,
                        rgba(255,255,255,0.2) 30%,
                        rgba(255,255,255,0.1) 100%
                      )
                    `,
                  },
                },
              }}
            >
              {[
                { type: 'average', label: 'Promedio', value: statistics.average, unit: 'mg/dL' },
                { type: 'inRange', label: 'En rango', value: statistics.inRange, unit: '%' },
                { type: 'events', label: 'Eventos', value: statistics.events, unit: '' }
              ].map((stat) => {
                const colors = getGradientColors(stat.type as 'average' | 'inRange' | 'events', stat.value);
                return (
                  <Box
                    key={stat.type}
                    sx={{
                      height: '100%',
                      width: '100%',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: -1,
                        background: `
                          linear-gradient(
                            135deg,
                            ${colors[0]} 0%,
                            ${colors[1]} 50%,
                            ${colors[0]} 100%
                          )
                        `,
                      },
                    }}
                  >
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        color: 'white',
                        opacity: 0.95,
                        fontSize: { xs: '0.875rem', sm: '0.75rem' },
                        mb: 1,
                        fontWeight: 500,
                        textAlign: 'center',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    >
                      {stat.label}
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: 'white',
                        fontWeight: 700,
                        fontSize: { xs: '1.5rem', sm: '1.35rem' },
                        lineHeight: 1,
                        textAlign: 'center',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                      }}
                    >
                      <span>{stat.value}</span>
                      <span style={{ fontSize: '0.6em', opacity: 0.9 }}>{stat.unit}</span>
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      </div>

      {/* Graph Card */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-white rounded-xl shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex flex-row items-center gap-4">
              <Typography variant="h6" className="text-gray-700">
                Historial de Glucosa
              </Typography>
              <Button
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                onClick={() => setIsAnalysisOpen(true)}
                startIcon={<InfoIcon />}
              >
                Ver Análisis
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
              <ButtonGroup size={isMobile ? "small" : "medium"} className="mr-2">
                <Button
                  onClick={handleZoomIn}
                  disabled={Boolean(zoomDomain && (zoomDomain.end - zoomDomain.start) <= 10)}
                >
                  <ZoomInIcon fontSize="small" />
                </Button>
                <Button
                  onClick={handleResetZoom}
                  disabled={!Boolean(zoomDomain)}
                >
                  <ResetIcon fontSize="small" />
                </Button>
              </ButtonGroup>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Rango de Tiempo</InputLabel>
                <Select
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  label="Rango de Tiempo"
                  sx={{ width: '100%' }}
                >
                  {timeRanges.map((range) => (
                    <MenuItem key={range.value} value={range.value}>
                      {range.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>
          
          <div className="h-[400px] sm:h-[500px] md:h-[600px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                ref={chartRef}
                data={analyzedData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 10,
                  bottom: timeConfig.angleLabels ? 50 : 30,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <defs>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={alpha(theme.palette.error.main, 0.25)} />
                    <stop offset="100%" stopColor={alpha(theme.palette.error.main, 0.1)} />
                  </linearGradient>
                  <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={alpha(theme.palette.success.light, 0.25)} />
                    <stop offset="100%" stopColor={alpha(theme.palette.success.light, 0.1)} />
                  </linearGradient>
                  <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={alpha(theme.palette.warning.main, 0.25)} />
                    <stop offset="100%" stopColor={alpha(theme.palette.warning.main, 0.1)} />
                  </linearGradient>
                </defs>
                <ReferenceArea
                  y1={180}
                  y2={300}
                  fill="url(#colorHigh)"
                  fillOpacity={1}
                  strokeOpacity={0}
                  ifOverflow="visible"
                />
                <ReferenceArea
                  y1={70}
                  y2={180}
                  fill="url(#colorNormal)"
                  fillOpacity={1}
                  strokeOpacity={0}
                  ifOverflow="visible"
                />
                <ReferenceArea
                  y1={40}
                  y2={70}
                  fill="url(#colorLow)"
                  fillOpacity={1}
                  strokeOpacity={0}
                  ifOverflow="visible"
                />
                <ReferenceLine 
                  y={180} 
                  stroke={theme.palette.error.main} 
                  strokeDasharray="3 3"
                  label={{ 
                    value: "Alto", 
                    position: "right",
                    fontSize: isMobile ? 10 : 12,
                    fill: theme.palette.error.main
                  }}
                  className="opacity-50"
                />
                <ReferenceLine 
                  y={70} 
                  stroke={theme.palette.warning.main} 
                  strokeDasharray="3 3"
                  label={{ 
                    value: "Bajo", 
                    position: "right",
                    fontSize: isMobile ? 10 : 12,
                    fill: theme.palette.warning.main
                  }}
                  className="opacity-50"
                />
                <XAxis 
                  dataKey="time"
                  tick={{ 
                    fontSize: isMobile ? 10 : 12,
                    fill: theme.palette.text.primary,
                  }}
                  interval={zoomDomain ? "preserveStartEnd" : Math.ceil(analyzedData.length / timeConfig.tickCount - 1)}
                  angle={timeConfig.angleLabels ? -45 : 0}
                  textAnchor={timeConfig.angleLabels ? "end" : "middle"}
                  height={timeConfig.angleLabels ? 60 : 30}
                  tickFormatter={formatXAxisTick}
                  minTickGap={timeRange === '14d' ? 50 : 20}
                  scale="point"
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis 
                  domain={getYDomain()}
                  tick={{ 
                    fontSize: isMobile ? 10 : 12,
                    fill: theme.palette.text.primary,
                  }}
                  ticks={timeRange === '24h' ? 
                    [40, 80, 120, 160, 200, 240, 280, 300] : // Más marcas para 24h
                    [40, 70, 100, 140, 180, 220, 260, 300]
                  }
                  width={45}
                  axisLine={true}
                  tickLine={true}
                  padding={{ top: 20, bottom: 20 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    fontSize: isMobile ? 12 : 14,
                    padding: '8px'
                  }}
                  labelFormatter={(label) => `Hora: ${formatXAxisTick(label)}`}
                  formatter={(value: number) => [`${value} mg/dL`, 'Glucosa']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  dot={renderDot}
                  activeDot={{ r: isMobile ? 4 : 5 }}
                  className="opacity-80 hover:opacity-100 transition-opacity duration-300"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Análisis */}
      <Dialog
        open={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Análisis de Tendencias
        </DialogTitle>
        <DialogContent>
          <List>
            {getTimeRangeAnalysis(timeRanges.find(r => r.value === timeRange)?.hours || 12, analyzedData).map((analysis, index) => (
              <ListItem key={`general-${index}`}>
                <ListItemIcon>
                  <InfoIcon color="info" />
                </ListItemIcon>
                <ListItemText primary={analysis} />
              </ListItem>
            ))}
            {significantEvents.map((event, index) => (
              <ListItem key={`event-${index}`}>
                <ListItemIcon>
                  {event.type === 'peak' || event.type === 'high' ? (
                    <TrendingUpIcon color="error" />
                  ) : (
                    <TrendingDownIcon color="warning" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={`${formatXAxisTick(event.time)} - ${event.value} mg/dL`}
                  secondary={event.possibleReason}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAnalysisOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default GlucoseMonitoring; 