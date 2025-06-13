import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import {
  MedicationOutlined,
  AddCircleOutline,
  TrendingUp,
  Favorite,
  LocalDining,
  AccessTime,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import TopNav from '../components/TopNav';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToParentElement } from '@dnd-kit/modifiers';

const CircularProgressWithLabel = (
  props: {
    value: number;
    label: string;
    sublabel?: string;
    size?: number;
    sx?: any;
  }
) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        size={props.size || 200}
        thickness={2}
        sx={{
          color: (theme) => theme.palette.grey[200],
          position: 'absolute',
        }}
        value={100}
      />
      <CircularProgress
        variant="determinate"
        size={props.size || 200}
        thickness={2}
        sx={{ ...props.sx }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h4" component="div" color="text.primary">
          {props.label}
        </Typography>
        {props.sublabel && (
          <Typography variant="caption" color="text.secondary">
            {props.sublabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Grid item xs={6} ref={setNodeRef} style={style}>
      <div {...attributes} {...listeners}>
        {children}
      </div>
    </Grid>
  );
};

export default function Dashboard() {
  const currentTime = format(new Date(), 'h:mm a', { locale: es });
  const currentMeal = 'Antes de comer';

  const [stats, setStats] = useState([
    { id: 'activity', value: 28, label: '28', sublabel: 'min', color: '#2196f3', title: 'Actividad Física' },
    { id: 'carbs', value: 78, label: '234', sublabel: 'carbs', color: '#ff9800', title: 'Carbohidratos' },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setStats((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <>
      <TopNav title="Dashboard" showBack={false} showShare />
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Medición Principal de Glucosa */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {currentTime}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {currentMeal}
                </Typography>
                <CircularProgressWithLabel
                  value={70}
                  label="125"
                  sublabel="mg/dL"
                  sx={{ color: '#4caf50' }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Widgets Secundarios */}
          <Grid item xs={12} md={6}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToParentElement]}
            >
              <SortableContext items={stats.map(item => item.id)} strategy={rectSortingStrategy}>
                <Grid container spacing={2}>
                  {stats.map(stat => (
                    <SortableItem key={stat.id} id={stat.id}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <CircularProgressWithLabel
                            value={stat.value}
                            label={stat.label}
                            sublabel={stat.sublabel}
                            size={120}
                            sx={{ color: stat.color }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {stat.title}
                          </Typography>
                        </CardContent>
                      </Card>
                    </SortableItem>
                  ))}
                </Grid>
              </SortableContext>
            </DndContext>

            {/* Lista de Acciones Rápidas */}
            <Card sx={{ mt: 2 }}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <MedicationOutlined />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Medicamentos"
                    secondary="Sin medicamentos esta semana"
                  />
                  <IconButton>
                    <AddCircleOutline />
                  </IconButton>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Favorite />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Presión arterial"
                    secondary="117-83 mmHg"
                  />
                  <Typography variant="caption" color="text.secondary">
                    12 Nov 11:00 am
                  </Typography>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp />
                  </ListItemIcon>
                  <ListItemText 
                    primary="HbA1c Estimada"
                    secondary="No hay suficientes mediciones"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <LocalDining />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Calculadora de Bolo"
                    secondary="Calcular dosis de insulina"
                  />
                  <IconButton>
                    <AddCircleOutline />
                  </IconButton>
                </ListItem>
              </List>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  );
} 