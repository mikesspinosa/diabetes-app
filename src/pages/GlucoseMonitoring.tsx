import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  DialogContentText,
  TextField,
  LinearProgress,
  Switch,
  ListItemSecondaryAction,
  Divider,
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
  Add as AddIcon,
  ShowChart as WaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  BarChart as BarChartIcon,
  Science as ScienceIcon,
  Opacity as OpacityIcon,
  TrackChanges as TrackChangesIcon,
  InfoOutlined as InfoOutlinedIcon,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, subHours, isWithinInterval, subDays, subYears, isAfter } from 'date-fns';
import type { Theme as MuiTheme } from '@mui/material/styles';
import TildeIcon from '../components/icons/TildeIcon';

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

const insulinTimeRanges = [
  { value: '24h', label: '24 horas', hours: 24 },
  { value: '7d', label: '7 días', hours: 168 },
  { value: '14d', label: '14 días', hours: 336 },
  { value: '30d', label: '1 mes', hours: 720 },
] as const;

type InsulinTimeRange = typeof insulinTimeRanges[number]['value'];

// Lista de plumas de insulina
const PEN_OPTIONS = [
  { id: 'humalog_kwikpen_300', name: 'Humalog KwikPen (300U)', type: 'rapid', capacity: 300, color: '#a02d53' }, // Burgundy
  { id: 'novolog_flexpen_300', name: 'NovoLog FlexPen (300U)', type: 'rapid', capacity: 300, color: '#f58220' }, // Orange
  { id: 'apidra_solostar_300', name: 'Apidra SoloStar (300U)', type: 'rapid', capacity: 300, color: '#3b5998' }, // Dark Blue
  { id: 'custom-rapid', name: 'Añadir/Editar Pluma', type: 'rapid', capacity: 0, color: '#3b82f6' }, // Default Blue
  { id: 'lantus_solostar_300', name: 'Lantus SoloStar (300U)', type: 'long', capacity: 300, color: '#8a2be2' }, // Purple
  { id: 'basaglar_kwikpen_300', name: 'Basaglar KwikPen (300U)', type: 'long', capacity: 300, color: '#78c1a7' }, // Teal
  { id: 'levemir_flextouch_300', name: 'Levemir FlexTouch (300U)', type: 'long', capacity: 300, color: '#008000' }, // Green
  { id: 'custom-long', name: 'Añadir/Editar Pluma', type: 'long', capacity: 0, color: '#8b5cf6' }, // Default Purple
];

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
    up: (key: string) => string;
  };
};

const GlucoseMonitoring: React.FC = () => {
  const theme = useTheme<Theme>();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
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

  // Estados para la ruleta de insulina
  const [insulinUnits, setInsulinUnits] = useState(1);
  const [insulinType, setInsulinType] = useState<'rapid' | 'long'>('rapid');
  const [insulinLog, setInsulinLog] = useState<{ units: number; type: 'rapid' | 'long'; time: Date }[]>([]);
  const [insulinTimeRange, setInsulinTimeRange] = useState<InsulinTimeRange>('24h');
  
  // Estado para el diálogo de detalles de insulina
  const [detailedLogType, setDetailedLogType] = useState<'rapid' | 'long' | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<{ units: number; type: 'rapid' | 'long'; time: Date } | null>(null);

  // Estado para la selección de plumas y capacidad personalizada
  const [selectedRapidPen, setSelectedRapidPen] = useState<string>(PEN_OPTIONS.find(p => p.type === 'rapid')?.id || '');
  const [selectedLongPen, setSelectedLongPen] = useState<string>(PEN_OPTIONS.find(p => p.type === 'long')?.id || '');
  const [customRapidCapacity, setCustomRapidCapacity] = useState(300);
  const [customLongCapacity, setCustomLongCapacity] = useState(300);
  const [customRapidName, setCustomRapidName] = useState('Pluma Personalizada');
  const [customLongName, setCustomLongName] = useState('Pluma Personalizada');
  const [customRapidColor, setCustomRapidColor] = useState('#3b82f6');
  const [customLongColor, setCustomLongColor] = useState('#8b5cf6');

  const [customQuickAdd, setCustomQuickAdd] = useState<number>(15);
  const [isEditingQuickAdd, setIsEditingQuickAdd] = useState<boolean>(false);

  const rouletteRef = useRef<HTMLDivElement>(null);
  const itemHeight = isDesktop ? 56 : 48; // Corresponde a height + gap
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  
  // Estado para las estadísticas
  const [visibleStats, setVisibleStats] = useState(['average', 'inRange', 'events']);
  const [statsMenuOpen, setStatsMenuOpen] = useState(false);
  const [detailedStatKey, setDetailedStatKey] = useState<string | null>(null);

  const rapidPenColor = selectedRapidPen === 'custom-rapid' 
    ? customRapidColor 
    : PEN_OPTIONS.find(p => p.id === selectedRapidPen)?.color || '#3b82f6';
    
  const longPenColor = selectedLongPen === 'custom-long'
    ? customLongColor
    : PEN_OPTIONS.find(p => p.id === selectedLongPen)?.color || '#8b5cf6';
  
  const activeInsulinColor = insulinType === 'rapid' ? rapidPenColor : longPenColor;

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
        style={{ transition: 'fill 0.3s ease' }}
      />
    );
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    const values = analyzedData.map(d => d.value).filter(v => v > 0);
    if (values.length === 0) {
      return { average: 0, inRange: 0, high: 0, low: 0, events: 0, stdDev: 0, cv: 0, eA1c: 0, totalInsulin: { total: 0, rapid: 0, long: 0 } };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avgValue = Math.round(sum / values.length);
    const highCount = values.filter(v => v > 180).length;
    const lowCount = values.filter(v => v < 70).length;
    const inRangeCount = values.length - highCount - lowCount;
    
    const inRangePercentage = Math.round((inRangeCount / values.length) * 100);
    const highPercentage = Math.round((highCount / values.length) * 100);
    const lowPercentage = Math.round((lowCount / values.length) * 100);
    const eventCount = highCount + lowCount;

    // Standard Deviation
    const mean = sum / values.length;
    const stdDev = Math.round(Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length));

    // Coefficient of Variation
    const cv = mean > 0 ? Math.round((stdDev / mean) * 100) : 0;
    
    // Estimated A1c
    const eA1c = mean > 0 ? parseFloat(((avgValue + 46.7) / 28.7).toFixed(1)) : 0;

    // Total Insulin
    const totalInsulinRapid = insulinLog.filter(e => e.type === 'rapid').reduce((acc, entry) => acc + entry.units, 0);
    const totalInsulinLong = insulinLog.filter(e => e.type === 'long').reduce((acc, entry) => acc + entry.units, 0);

    return {
      average: avgValue,
      inRange: inRangePercentage,
      high: highPercentage,
      low: lowPercentage,
      events: eventCount,
      stdDev,
      cv,
      eA1c,
      totalInsulin: {
        total: totalInsulinRapid + totalInsulinLong,
        rapid: totalInsulinRapid,
        long: totalInsulinLong
      }
    };
  }, [analyzedData, insulinLog]);

  const allStatsConfig = {
    average: { type: 'average', label: 'Promedio', unit: 'mg/dL', icon: <BarChartIcon /> },
    inRange: { type: 'inRange', label: 'En Rango', unit: '%', icon: <TrackChangesIcon /> },
    events: { type: 'events', label: 'Eventos', unit: '', icon: <WarningIcon /> },
    stdDev: { type: 'stdDev', label: 'Desv. Est.', unit: 'mg/dL', icon: <ScienceIcon /> },
    cv: { type: 'cv', label: 'CV', unit: '%', icon: <ScienceIcon /> },
    eA1c: { type: 'eA1c', label: 'eA1c', unit: '%', icon: <OpacityIcon /> },
    totalInsulin: { type: 'totalInsulin', label: 'Insulina Total', unit: 'u', icon: <WaveIcon /> },
  };

  // Función para obtener los colores del gradiente con efecto 3D
  const getGradientColors = (type: string, value: number) => {
    const baseColors = {
      success: ['rgba(52, 211, 153, 0.95)', 'rgba(16, 185, 129, 0.85)'], // Verde
      warning: ['rgba(251, 191, 36, 0.95)', 'rgba(245, 158, 11, 0.85)'], // Naranja
      error: ['rgba(248, 113, 113, 0.95)', 'rgba(239, 68, 68, 0.85)'],   // Rojo
      info: ['rgba(96, 165, 250, 0.95)', 'rgba(59, 130, 246, 0.85)'], // Azul
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
      case 'stdDev':
        if (value < 50) return baseColors.success;
        if (value < 70) return baseColors.warning;
        return baseColors.error;
      case 'cv':
        if (value < 36) return baseColors.success;
        if (value < 45) return baseColors.warning;
        return baseColors.error;
      case 'eA1c':
        if (value < 7) return baseColors.success;
        if (value < 8) return baseColors.warning;
        return baseColors.error;
      case 'totalInsulin':
        return baseColors.info; // Neutral color
      default:
        return baseColors.info;
    }
  };

  const handleAddInsulin = () => {
    const newEntry = { units: insulinUnits, type: insulinType, time: new Date() };
    setInsulinLog(prevLog => [...prevLog, newEntry].sort((a, b) => b.time.getTime() - a.time.getTime()));
    setInsulinUnits(1);
  };

  const handleDeleteInsulinEntry = (entryToDelete: { units: number; type: 'rapid' | 'long'; time: Date } | null) => {
    if (!entryToDelete) return;
    setInsulinLog(prevLog => prevLog.filter(entry => entry.time.getTime() !== entryToDelete.time.getTime()));
    setEntryToDelete(null); // Cerrar diálogo de confirmación
  };

  const getInsulinTimeRangeLabel = (rangeValue: InsulinTimeRange) => {
    const range = insulinTimeRanges.find(r => r.value === rangeValue);
    if (!range) return "hoy";
    switch (range.value) {
      case '24h': return 'en las últimas 24 horas';
      case '7d': return 'en la última semana';
      case '14d': return 'en las últimas 2 semanas';
      case '30d': return 'en el último mes';
      default: return "hoy";
    }
  };

  const filteredInsulinLog = useMemo(() => {
    const now = new Date();
    const selectedRange = insulinTimeRanges.find(r => r.value === insulinTimeRange);
    const hoursToSubtract = selectedRange?.hours || 24;

    return insulinLog.filter(entry => 
        isWithinInterval(entry.time, { start: subHours(now, hoursToSubtract), end: now })
    );
  }, [insulinLog, insulinTimeRange]);

  const summary = useMemo(() => {
    let rapidPenCapacity = PEN_OPTIONS.find(p => p.id === selectedRapidPen)?.capacity || 0;
    if (selectedRapidPen === 'custom-rapid') {
      rapidPenCapacity = customRapidCapacity;
    }

    let longPenCapacity = PEN_OPTIONS.find(p => p.id === selectedLongPen)?.capacity || 0;
    if (selectedLongPen === 'custom-long') {
      longPenCapacity = customLongCapacity;
    }

    const initial = {
      rapid: { units: 0, count: 0, pensUsed: 0, progress: 0 },
      long: { units: 0, count: 0, pensUsed: 0, progress: 0 }
    };

    const totals = filteredInsulinLog.reduce((acc, entry) => {
        if (entry.type === 'rapid') {
            acc.rapid.units += entry.units;
            acc.rapid.count++;
        } else {
            acc.long.units += entry.units;
            acc.long.count++;
        }
        return acc;
    }, initial);

    if (rapidPenCapacity > 0) {
      totals.rapid.pensUsed = Math.floor(totals.rapid.units / rapidPenCapacity);
      const remainingUnits = totals.rapid.units % rapidPenCapacity;
      totals.rapid.progress = (remainingUnits / rapidPenCapacity) * 100;
    }
    if (longPenCapacity > 0) {
      totals.long.pensUsed = Math.floor(totals.long.units / longPenCapacity);
      const remainingUnits = totals.long.units % longPenCapacity;
      totals.long.progress = (remainingUnits / longPenCapacity) * 100;
    }

    return totals;
  }, [filteredInsulinLog, selectedRapidPen, selectedLongPen, customRapidCapacity, customLongCapacity]);

  useEffect(() => {
    const roulette = rouletteRef.current;
    if (!roulette) return;

    const handleScrollEnd = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        const scrollTop = roulette.scrollTop;
        const selectedIndex = Math.round(scrollTop / itemHeight);
        
        // Evitar actualizaciones de estado innecesarias si el valor no cambia
        if (selectedIndex !== insulinUnits) {
          setInsulinUnits(selectedIndex);
        }
        setIsScrolling(false);
      }, 150); // Un pequeño retraso para asegurar que el scroll haya terminado
    };

    roulette.addEventListener('scroll', handleScrollEnd);
    return () => {
      roulette.removeEventListener('scroll', handleScrollEnd);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [itemHeight, insulinUnits]);

  useEffect(() => {
    // Sincronizar el scroll con el estado cuando el estado cambia por un clic
    const roulette = rouletteRef.current;
    if (roulette && !isScrolling) {
        const expectedScrollTop = insulinUnits * itemHeight;
        if (Math.abs(roulette.scrollTop - expectedScrollTop) > 1) {
             roulette.scrollTo({ top: expectedScrollTop, behavior: 'smooth' });
        }
    }
  }, [insulinUnits, itemHeight, isScrolling]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Current Glucose Card */}
        <div className="lg:col-span-4">
          <Card className="bg-white rounded-xl shadow-lg h-full">
            <CardContent className="p-4 h-full flex flex-col justify-center">
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
              
              <div className="flex-grow flex flex-col items-center justify-center">
                <div className="flex items-baseline mb-4">
                  <Typography 
                    variant={isMobile ? "h3" : "h2"} 
                    component="div" 
                    className="mr-2"
                    sx={{
                      fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                      fontWeight: 700,
                      color: theme.palette.text.primary
                    }}
                  >
                    {currentGlucose}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    className="text-gray-500"
                    sx={{
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      fontWeight: 500
                    }}
                  >
                    mg/dL
                  </Typography>
                </div>
                
                <Stack 
                  direction="row" 
                  spacing={2} 
                  alignItems="center" 
                  className="mb-4"
                  justifyContent="center"
                >
                  {getTrendIcon()}
                  <Chip 
                    label={getGlucoseStatus().text}
                    color={getGlucoseStatus().color as any}
                    size={isMobile ? "small" : "medium"}
                    className="font-medium"
                  />
                </Stack>
              </div>
              
              <Typography 
                variant="body2" 
                className="text-gray-500 text-center"
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                Última actualización: {format(lastUpdate, 'HH:mm')}
              </Typography>
            </CardContent>
          </Card>
        </div>

        {/* Stats Card */}
        <div className="lg:col-span-8">
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
                  display: 'grid',
                  gridAutoFlow: 'column',
                  gridAutoColumns: { xs: '80%', sm: 'calc(50% - 0.5rem)', md: 'calc(33.33% - 0.66rem)' },
                  gap: { xs: 2, sm: 3 },
                  width: '100%',
                  overflowX: 'auto',
                  scrollSnapType: 'x mandatory',
                  pb: 2, 
                  '&::-webkit-scrollbar': {
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                  }
                }}
              >
                {visibleStats.map(statKey => {
                  const stat = allStatsConfig[statKey as keyof typeof allStatsConfig];
                  const value = statKey === 'totalInsulin' 
                    ? statistics.totalInsulin.total 
                    : statistics[statKey as keyof Omit<typeof statistics, 'totalInsulin'>];
                  const colors = getGradientColors(stat.type as string, value as number);
                  
                  if (!stat) return null;

                  return (
                    <Box
                      key={stat.type}
                      sx={{
                        scrollSnapAlign: 'start',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '16px',
                        background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
                        boxShadow: '0 4px 12px -2px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
                        '&:hover': {
                          transform: 'scale(1.03)',
                          boxShadow: '0 8px 20px -4px rgba(0,0,0,0.2)',
                        },
                        aspectRatio: '1/1',
                        p: 3,
                      }}
                    >
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailedStatKey(stat.type);
                        }}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          color: 'rgba(255,255,255,0.8)',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.2)',
                          }
                        }}
                      >
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'white',
                          fontWeight: 600,
                          textAlign: 'center',
                          textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          fontSize: { xs: '1rem', md: '1.125rem' },
                          mb: 2,
                        }}
                      >
                        {stat.label}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '4px',
                        }}
                      >
                        <Typography
                          variant="h3"
                          sx={{
                            color: 'white',
                            fontWeight: 700,
                            textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            fontSize: { xs: '2.25rem', md: '2.75rem' },
                          }}
                        >
                          {value}
                        </Typography>
                        {stat.unit && (
                          <Typography
                            variant="body1"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.9)',
                              fontWeight: 500,
                              fontSize: { xs: '1rem', md: '1rem' },
                            }}
                          >
                            {stat.unit}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
                 <Box
                  onClick={() => setStatsMenuOpen(true)}
                  sx={{
                    scrollSnapAlign: 'start',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '16px',
                    border: `2px dashed ${theme.palette.grey[400]}`,
                    transition: 'border-color 0.2s ease-out, background-color 0.2s ease-out',
                    '&:hover': {
                      backgroundColor: theme.palette.grey[100],
                      borderColor: theme.palette.grey[500],
                      cursor: 'pointer',
                    },
                    flexDirection: 'column',
                    aspectRatio: '1/1',
                    p: 3,
                  }}
                >
                  <AddCircleOutlineIcon sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
                  <Typography variant="h6" sx={{ color: 'grey.600', fontWeight: 600 }}>
                    Añadir/Editar
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </div>

        {/* Insulin Input Card */}
        <div className="lg:col-span-12">
          <Card
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg border-0"
            sx={{
              '& .MuiCardContent-root': {
                padding: { xs: '16px', sm: '24px' }
              }
            }}
          >
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Typography 
                  variant="h6" 
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  Registro de Insulina
                </Typography>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <Select
                    value={insulinTimeRange}
                    onChange={(e) => setInsulinTimeRange(e.target.value as InsulinTimeRange)}
                    variant="outlined"
                    sx={{
                      '.MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                      fontSize: '0.875rem',
                      color: 'text.secondary'
                    }}
                  >
                    {insulinTimeRanges.map((range) => (
                      <MenuItem key={range.value} value={range.value}>
                        {range.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Insulin Picker */}
                <div className="flex flex-col items-center h-full justify-between">
                  <div className="w-full">
                    {/* Selector de tipo de insulina */}
                    <div className="flex gap-2 mb-4 justify-center">
                      <Button
                        variant={insulinType === 'rapid' ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setInsulinType('rapid')}
                        startIcon={<WaveIcon />}
                        sx={{
                          backgroundColor: insulinType === 'rapid' ? rapidPenColor : 'transparent',
                          borderColor: rapidPenColor,
                          color: insulinType === 'rapid' ? 'white' : rapidPenColor,
                          '&:hover': {
                            backgroundColor: insulinType === 'rapid' ? alpha(rapidPenColor, 0.9) : alpha(rapidPenColor, 0.1)
                          }
                        }}
                      >
                        Rápida
                      </Button>
                      <Button
                        variant={insulinType === 'long' ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setInsulinType('long')}
                        startIcon={<TildeIcon />}
                        sx={{
                          backgroundColor: insulinType === 'long' ? longPenColor : 'transparent',
                          borderColor: longPenColor,
                          color: insulinType === 'long' ? 'white' : longPenColor,
                          '&:hover': {
                            backgroundColor: insulinType === 'long' ? alpha(longPenColor, 0.9) : alpha(longPenColor, 0.1)
                          }
                        }}
                      >
                        Prolongada
                      </Button>
                    </div>
                    
                    <Typography 
                      variant="body1" 
                      className="mb-4 text-center"
                      sx={{ 
                        color: 'text.secondary',
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      Selecciona las unidades de insulina {insulinType === 'rapid' ? 'rápida' : 'prolongada'}
                    </Typography>
                  </div>
                  
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: { xs: '280px', sm: '320px' },
                      height: { xs: '180px', sm: '200px', md: '240px' },
                      backgroundColor: alpha(activeInsulinColor, 0.05),
                      borderRadius: '20px',
                      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      py: 2
                    }}
                  >
                    {/* Selection indicator */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: { xs: '70%', sm: '80%' },
                        height: itemHeight - 8,
                        backgroundColor: alpha(activeInsulinColor, 0.1),
                        border: `2px solid ${activeInsulinColor}`,
                        borderRadius: '12px',
                        zIndex: 2,
                        pointerEvents: 'none'
                      }}
                    />
                    
                    <Box
                      ref={rouletteRef}
                      onScroll={() => setIsScrolling(true)}
                      sx={{
                        width: '100%',
                        height: '100%',
                        overflowY: 'scroll',
                        scrollSnapType: 'y mandatory',
                        '&::-webkit-scrollbar': { display: 'none' },
                        scrollbarWidth: 'none',
                      }}
                    >
                      <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        pt: `calc(50% - ${itemHeight / 2}px)`, // Padding to center first item
                        pb: `calc(50% - ${itemHeight / 2}px)`, // Padding to center last item
                      }}>
                        {[...Array(101).keys()].map((value) => (
                          <Box
                            key={value}
                            id={`unit-${value}`}
                            sx={{
                              height: itemHeight,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              scrollSnapAlign: 'center',
                              fontSize: '1.5rem',
                              color: insulinUnits === value ? activeInsulinColor : 'text.secondary',
                              transition: 'font-size 0.3s, color 0.3s',
                              cursor: 'pointer',
                            }}
                            onClick={() => setInsulinUnits(value)}
                          >
                            {value}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                  
                  <div className="flex flex-wrap gap-2 mt-4 justify-center items-center">
                    {[1, 2, 5, 10].map((value) => (
                      <Button
                        key={value}
                        variant="outlined"
                        size="small"
                        onClick={() => setInsulinUnits(value)}
                        sx={{
                          borderColor: activeInsulinColor,
                          color: activeInsulinColor,
                          '&:hover': {
                            backgroundColor: alpha(activeInsulinColor, 0.1),
                            borderColor: activeInsulinColor,
                          }
                        }}
                      >
                        {value}u
                      </Button>
                    ))}
                    <div className="flex items-center gap-1">
                      {isEditingQuickAdd ? (
                        <TextField
                          value={customQuickAdd}
                          onChange={(e) => setCustomQuickAdd(Math.max(0, Number(e.target.value)))}
                          onBlur={() => setIsEditingQuickAdd(false)}
                          onKeyPress={(e) => { if (e.key === 'Enter') setIsEditingQuickAdd(false); }}
                          type="number"
                          size="small"
                          autoFocus
                          sx={{ 
                            width: '70px',
                            '& .MuiInputBase-input': {
                              textAlign: 'center',
                              color: activeInsulinColor
                            },
                             '& .MuiOutlinedInput-root': {
                              '&.Mui-focused fieldset': {
                                borderColor: activeInsulinColor,
                              },
                            },
                          }}
                          inputProps={{
                            'aria-label': 'custom quick add value'
                          }}
                        />
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setInsulinUnits(customQuickAdd)}
                          sx={{
                            borderColor: activeInsulinColor,
                            color: activeInsulinColor,
                            '&:hover': {
                              backgroundColor: alpha(activeInsulinColor, 0.1),
                              borderColor: activeInsulinColor,
                            }
                          }}
                        >
                          {customQuickAdd}u
                        </Button>
                      )}
                      <IconButton size="small" onClick={() => setIsEditingQuickAdd(!isEditingQuickAdd)} sx={{ color: activeInsulinColor }}>
                        {isEditingQuickAdd ? <CheckIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                      </IconButton>
                    </div>
                  </div>
                </div>
                
                {/* Insulin Log Summary */}
                <div className="flex flex-col gap-4 h-full">
                  {/* Rapid Insulin Summary */}
                  <Box sx={{ p: 2, backgroundColor: alpha(rapidPenColor, 0.08), borderRadius: '12px' }}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <WaveIcon sx={{ color: rapidPenColor }} />
                        <Typography variant="h6" sx={{ color: rapidPenColor, fontWeight: 600 }}>Rápida</Typography>
                      </div>
                      <Typography variant="h5" sx={{ color: alpha(rapidPenColor, 0.9), fontWeight: 700 }}>{summary.rapid.units}u</Typography>
                    </div>
                    <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                      <InputLabel>Pluma Rápida</InputLabel>
                      <Select
                        value={selectedRapidPen}
                        label="Pluma Rápida"
                        onChange={(e) => setSelectedRapidPen(e.target.value)}
                        renderValue={(selectedValue) => {
                          if (selectedValue === 'custom-rapid') {
                            return customRapidName;
                          }
                          return PEN_OPTIONS.find(p => p.id === selectedValue)?.name;
                        }}
                      >
                        {PEN_OPTIONS.filter(p => p.type === 'rapid').map(pen => (
                          <MenuItem key={pen.id} value={pen.id}>{pen.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {selectedRapidPen === 'custom-rapid' && (
                      <Stack spacing={1} sx={{ mb: 1 }}>
                        <TextField
                          label="Nombre Personalizado"
                          value={customRapidName}
                          onChange={(e) => setCustomRapidName(e.target.value)}
                          fullWidth
                          size="small"
                        />
                        <TextField
                          label="Capacidad Pluma (U)"
                          type="number"
                          value={customRapidCapacity}
                          onChange={(e) => setCustomRapidCapacity(Number(e.target.value))}
                          fullWidth
                          size="small"
                        />
                        <TextField
                          label="Color"
                          type="color"
                          value={customRapidColor}
                          onChange={(e) => setCustomRapidColor(e.target.value)}
                          fullWidth
                          size="small"
                          sx={{ '& .MuiInputBase-input': { height: '2rem' } }}
                        />
                      </Stack>
                    )}
                    <Typography variant="body2" color="text.secondary" className="mb-1">
                      {summary.rapid.count} inyeccion(es) {getInsulinTimeRangeLabel(insulinTimeRange)}.
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        <strong>{summary.rapid.pensUsed}</strong> pluma(s) usada(s).
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={summary.rapid.progress} 
                        sx={{ 
                          width: '100%', 
                          height: 8, 
                          borderRadius: 4, 
                          backgroundColor: alpha(rapidPenColor, 0.2),
                          '& .MuiLinearProgress-bar': { backgroundColor: rapidPenColor } 
                        }} 
                      />
                      <Typography variant="caption" sx={{ color: alpha(rapidPenColor, 0.9), fontWeight: 600 }}>
                        {Math.round(summary.rapid.progress)}%
                      </Typography>
                    </Box>
                    <Button size="small" onClick={() => setDetailedLogType('rapid')} disabled={summary.rapid.count === 0}>
                      Ver detalles
                    </Button>
                  </Box>

                  {/* Long-acting Insulin Summary */}
                  <Box sx={{ p: 2, backgroundColor: alpha(longPenColor, 0.08), borderRadius: '12px' }}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <TildeIcon sx={{ color: longPenColor }} />
                        <Typography variant="h6" sx={{ color: longPenColor, fontWeight: 600 }}>Prolongada</Typography>
                      </div>
                      <Typography variant="h5" sx={{ color: alpha(longPenColor, 0.9), fontWeight: 700 }}>{summary.long.units}u</Typography>
                    </div>
                     <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                      <InputLabel>Pluma Prolongada</InputLabel>
                      <Select
                        value={selectedLongPen}
                        label="Pluma Prolongada"
                        onChange={(e) => setSelectedLongPen(e.target.value)}
                        renderValue={(selectedValue) => {
                          if (selectedValue === 'custom-long') {
                            return customLongName;
                          }
                          return PEN_OPTIONS.find(p => p.id === selectedValue)?.name;
                        }}
                      >
                        {PEN_OPTIONS.filter(p => p.type === 'long').map(pen => (
                          <MenuItem key={pen.id} value={pen.id}>{pen.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                     {selectedLongPen === 'custom-long' && (
                      <Stack spacing={1} sx={{ mb: 1 }}>
                        <TextField
                          label="Nombre Personalizado"
                          value={customLongName}
                          onChange={(e) => setCustomLongName(e.target.value)}
                          fullWidth
                          size="small"
                        />
                        <TextField
                          label="Capacidad Pluma (U)"
                          type="number"
                          value={customLongCapacity}
                          onChange={(e) => setCustomLongCapacity(Number(e.target.value))}
                          fullWidth
                          size="small"
                        />
                        <TextField
                          label="Color"
                          type="color"
                          value={customLongColor}
                          onChange={(e) => setCustomLongColor(e.target.value)}
                          fullWidth
                          size="small"
                           sx={{ '& .MuiInputBase-input': { height: '2rem' } }}
                        />
                      </Stack>
                    )}
                    <Typography variant="body2" color="text.secondary" className="mb-1">
                      {summary.long.count} inyeccion(es) {getInsulinTimeRangeLabel(insulinTimeRange)}.
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        <strong>{summary.long.pensUsed}</strong> pluma(s) usada(s).
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={summary.long.progress} 
                        sx={{ 
                          width: '100%', 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: alpha(longPenColor, 0.2),
                          '& .MuiLinearProgress-bar': { backgroundColor: longPenColor } 
                        }} 
                        color="secondary" 
                      />
                      <Typography variant="caption" sx={{ color: alpha(longPenColor, 0.9), fontWeight: 600 }}>
                        {Math.round(summary.long.progress)}%
                      </Typography>
                    </Box>
                     <Button size="small" onClick={() => setDetailedLogType('long')} disabled={summary.long.count === 0}>
                      Ver detalles
                     </Button>
                  </Box>
                  
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleAddInsulin}
                    startIcon={<AddIcon />}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      backgroundColor: insulinType === 'rapid' ? rapidPenColor : longPenColor,
                      '&:hover': {
                        backgroundColor: alpha(insulinType === 'rapid' ? rapidPenColor : longPenColor, 0.85)
                      },
                      mt: 'auto'
                    }}
                  >
                    Registrar {insulinUnits}u {insulinType === 'rapid' ? 'Rápida' : 'Prolongada'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graph Card */}
        <div className="lg:col-span-12">
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
        </div>
      </div>

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

      {/* Detailed Insulin Log Dialog */}
      <Dialog open={detailedLogType !== null} onClose={() => setDetailedLogType(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          Registro de Insulina {detailedLogType === 'rapid' ? 'Rápida' : 'Prolongada'}
        </DialogTitle>
        <DialogContent>
          <List>
            {filteredInsulinLog.filter(e => e.type === detailedLogType).length > 0 ? (
              filteredInsulinLog
                .filter(entry => entry.type === detailedLogType)
                .map((entry, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton edge="end" aria-label="delete" onClick={() => setEntryToDelete(entry)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      {entry.type === 'rapid' ? <WaveIcon sx={{ color: rapidPenColor }} /> : <TildeIcon sx={{ color: longPenColor }} />}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${entry.units} unidade(s)`}
                      secondary={format(entry.time, 'HH:mm')}
                    />
                  </ListItem>
                ))
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                No hay registros para mostrar.
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailedLogType(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Deletion Dialog */}
      <Dialog
        open={entryToDelete !== null}
        onClose={() => setEntryToDelete(null)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres eliminar el registro de {entryToDelete?.units} unidad(es) a las {entryToDelete && format(entryToDelete.time, 'HH:mm')}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEntryToDelete(null)}>Cancelar</Button>
          <Button onClick={() => handleDeleteInsulinEntry(entryToDelete)} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stats Configuration Dialog */}
      <Dialog open={statsMenuOpen} onClose={() => setStatsMenuOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Personalizar Estadísticas</DialogTitle>
        <DialogContent>
          <List>
            {Object.entries(allStatsConfig).map(([key, config]) => (
              <ListItem key={key}>
                <ListItemIcon>{config.icon}</ListItemIcon>
                <ListItemText primary={config.label} />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={visibleStats.includes(key)}
                    onChange={() => {
                      setVisibleStats(prev => 
                        prev.includes(key)
                          ? prev.filter(s => s !== key)
                          : [...prev, key]
                      );
                    }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsMenuOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Detailed Stat Dialog */}
      <Dialog open={detailedStatKey !== null} onClose={() => setDetailedStatKey(null)} fullWidth maxWidth="xs">
        {detailedStatKey && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {allStatsConfig[detailedStatKey as keyof typeof allStatsConfig].icon}
              {allStatsConfig[detailedStatKey as keyof typeof allStatsConfig].label}
            </DialogTitle>
            <DialogContent>
              <StatDetailContent
                detailedStatKey={detailedStatKey}
                statConfig={allStatsConfig}
                statistics={statistics}
                rapidPenColor={rapidPenColor}
                longPenColor={longPenColor}
                insulinHistory={insulinLog}
              />
            </DialogContent>
          </>
        )}
        <DialogActions>
          <Button onClick={() => setDetailedStatKey(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

interface StatDetailContentProps {
  detailedStatKey: string;
  statConfig: any;
  statistics: any;
  rapidPenColor: string;
  longPenColor: string;
  insulinHistory: { units: number; type: 'rapid' | 'long'; time: Date }[];
}

const StatDetailContent: React.FC<StatDetailContentProps> = ({ detailedStatKey, statConfig, statistics, rapidPenColor, longPenColor, insulinHistory }) => {
  const [totalInsulinTimeRange, setTotalInsulinTimeRange] = useState('30d');

  const statConfigDetails = {
    average: {
      title: "Glucosa Promedio",
      description: "Este es el nivel medio de glucosa durante el período de tiempo seleccionado. Es un indicador general de tu control glucémico. Un promedio más bajo generalmente indica un mejor control, pero debe considerarse junto con la variabilidad."
    },
    inRange: {
      title: "Tiempo en Rango (TIR)",
      description: "Mide el porcentaje de tiempo que tus niveles de glucosa se mantuvieron dentro de tu rango objetivo (usualmente 70-180 mg/dL). Es una métrica clave; un TIR más alto (>70%) se asocia con menos riesgo de complicaciones."
    },
    events: {
      title: "Eventos de Hipo/Hiperglucemia",
      description: "El número total de veces que tu glucosa salió del rango objetivo. Rastrear los eventos ayuda a identificar patrones para ajustar la terapia."
    },
    stdDev: {
      title: "Desviación Estándar (DE)",
      description: "Mide qué tan dispersos están tus valores de glucosa respecto al promedio. Un valor más bajo significa niveles de glucosa más estables y predecibles. Un objetivo común es mantenerla por debajo de 50 mg/dL."
    },
     cv: {
      title: "Coeficiente de Variación (CV)",
      description: "Al igual que la DE, mide la variabilidad, pero en relación a la media. Esto permite comparar la variabilidad en diferentes promedios de glucosa. Un CV < 36% es el objetivo para un control glucémico estable y seguro."
    },
     eA1c: {
      title: "Hemoglobina Glicosilada Estimada (eA1c)",
      description: "Una estimación de tu A1c basada en tu glucosa promedio de los últimos 1-3 meses. Es una herramienta útil para el seguimiento, pero no reemplaza la prueba de A1c de laboratorio."
    },
     totalInsulin: {
      title: "Uso Total de Insulina",
      description: "La cantidad total de unidades de insulina (rápida y prolongada) administradas en el período. Ayuda a evaluar las necesidades de dosificación generales."
    }
  };
  
  const timeInRangeData = [
    { name: 'En Rango', value: statistics.inRange, color: '#10b981' },
    { name: 'Alto', value: statistics.high, color: '#f43f5e' },
    { name: 'Bajo', value: statistics.low, color: '#f59e0b' },
  ];
  
  const totalInsulinData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch(totalInsulinTimeRange) {
      case '7d': startDate = subDays(now, 7); break;
      case '30d': startDate = subDays(now, 30); break;
      case '90d': startDate = subDays(now, 90); break;
      case '180d': startDate = subDays(now, 180); break;
      case '1y': startDate = subYears(now, 1); break;
      case '5y': startDate = subYears(now, 5); break;
      case '10y': startDate = subYears(now, 10); break;
      default: startDate = subDays(now, 30);
    }

    const filteredHistory = insulinHistory.filter(entry => isAfter(entry.time, startDate));

    const totals = filteredHistory.reduce((acc: { rapid: number, long: number }, entry) => {
      if(entry.type === 'rapid') {
        acc.rapid += entry.units;
      } else if (entry.type === 'long') {
        acc.long += entry.units;
      }
      return acc;
    }, { rapid: 0, long: 0 });

    return [
     { name: 'Rápida', value: totals.rapid, color: rapidPenColor },
     { name: 'Prolongada', value: totals.long, color: longPenColor },
    ];
  }, [totalInsulinTimeRange, insulinHistory, rapidPenColor, longPenColor]);


  const getCVGauge = (cv: number) => {
    const percentage = Math.min(cv / 50, 1) * 100; // Cap at 50% for visualization
    let color = '#10b981';
    if (cv >= 36 && cv < 45) color = '#f59e0b';
    if (cv >= 45) color = '#f43f5e';
    
    return (
       <Box sx={{ position: 'relative', width: '150px', height: '75px', overflow: 'hidden', mx: 'auto', mt: 2 }}>
         <Box sx={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            border: '20px solid #e0e0e0',
            borderBottomColor: 'transparent',
            borderRightColor: 'transparent',
            transform: 'rotate(-135deg)',
          }} />
          <Box sx={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            border: '20px solid transparent',
            borderTopColor: color,
            transform: `rotate(${-135 + (percentage * 1.8)}deg)`,
            transition: 'transform 0.5s ease, border-color 0.5s ease'
          }} />
          <Typography variant="h4" sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', fontWeight: 700 }}>
            {cv}%
          </Typography>
       </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        {statConfigDetails[detailedStatKey as keyof typeof statConfigDetails]?.description}
      </Typography>
      <Divider />
      
      {detailedStatKey === 'inRange' && (
        <Stack spacing={2}>
          <Box sx={{ height: { xs: 180, sm: 200 } }}>
            <ResponsiveContainer>
               <PieChart>
                 <Pie data={timeInRangeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} labelLine={false}
                   label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x  = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy  + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}>
                   {timeInRangeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                 </Pie>
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
          </Box>
          <List dense>
            {timeInRangeData.map(item => (
               <ListItem key={item.name} sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 30 }}><Box sx={{ width: 12, height: 12, backgroundColor: item.color, borderRadius: '50%' }} /></ListItemIcon>
                 <ListItemText primary={item.name} />
                 <Typography variant="body2">{item.value}%</Typography>
               </ListItem>
            ))}
          </List>
        </Stack>
      )}

      {(detailedStatKey === 'cv' || detailedStatKey === 'stdDev') && (
        <Box sx={{ textAlign: 'center' }}>
           {getCVGauge(statistics.cv)}
           <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              Desviación Estándar: {statistics.stdDev} mg/dL
           </Typography>
        </Box>
      )}
      
      {detailedStatKey === 'eA1c' && (
         <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 700, mt: 2 }}>
            {statistics.eA1c}%
            <Typography variant="caption" display="block" color="text.secondary">
              (basado en un promedio de {statistics.average} mg/dL)
            </Typography>
         </Typography>
      )}

       {detailedStatKey === 'totalInsulin' && (
        <Stack spacing={2}>
          <ButtonGroup size="small" fullWidth sx={{ pt: 1 }}>
            <Button variant={totalInsulinTimeRange === '7d' ? 'contained' : 'outlined'} onClick={() => setTotalInsulinTimeRange('7d')}>1S</Button>
            <Button variant={totalInsulinTimeRange === '30d' ? 'contained' : 'outlined'} onClick={() => setTotalInsulinTimeRange('30d')}>1M</Button>
            <Button variant={totalInsulinTimeRange === '90d' ? 'contained' : 'outlined'} onClick={() => setTotalInsulinTimeRange('90d')}>3M</Button>
            <Button variant={totalInsulinTimeRange === '180d' ? 'contained' : 'outlined'} onClick={() => setTotalInsulinTimeRange('180d')}>6M</Button>
            <Button variant={totalInsulinTimeRange === '1y' ? 'contained' : 'outlined'} onClick={() => setTotalInsulinTimeRange('1y')}>1A</Button>
            <Button variant={totalInsulinTimeRange === '5y' ? 'contained' : 'outlined'} onClick={() => setTotalInsulinTimeRange('5y')}>5A</Button>
            <Button variant={totalInsulinTimeRange === '10y' ? 'contained' : 'outlined'} onClick={() => setTotalInsulinTimeRange('10y')}>10A</Button>
          </ButtonGroup>

          {totalInsulinData.reduce((sum, d) => sum + d.value, 0) > 0 ? (
            <>
              <Box sx={{ height: { xs: 180, sm: 200 } }}>
                <ResponsiveContainer>
                   <PieChart>
                     <Pie data={totalInsulinData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} label>
                       {totalInsulinData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                     </Pie>
                     <Legend />
                   </PieChart>
                 </ResponsiveContainer>
              </Box>
              <List dense>
                  <ListItem sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}><Box sx={{ width: 12, height: 12, backgroundColor: rapidPenColor, borderRadius: '50%' }} /></ListItemIcon>
                    <ListItemText primary="Rápida" />
                    <Typography variant="body2">{totalInsulinData.find(d => d.name === 'Rápida')?.value || 0} u</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0 }}>
                     <ListItemIcon sx={{ minWidth: 30 }}><Box sx={{ width: 12, height: 12, backgroundColor: longPenColor, borderRadius: '50%' }} /></ListItemIcon>
                     <ListItemText primary="Prolongada" />
                     <Typography variant="body2">{totalInsulinData.find(d => d.name === 'Prolongada')?.value || 0} u</Typography>
                  </ListItem>
              </List>
            </>
          ) : (
            <Typography sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              No hay datos de insulina para este período.
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default GlucoseMonitoring; 