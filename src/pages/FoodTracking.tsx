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
  Autocomplete,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Restaurant as RestaurantIcon } from '@mui/icons-material';

// Datos de ejemplo para alimentos comunes
const commonFoods = [
  { label: 'Pan integral', carbs: 15, portion: '1 rebanada' },
  { label: 'Arroz blanco cocido', carbs: 45, portion: '1 taza' },
  { label: 'Manzana', carbs: 15, portion: '1 unidad mediana' },
  { label: 'Leche descremada', carbs: 12, portion: '1 taza' },
  { label: 'Pollo a la plancha', carbs: 0, portion: '100g' },
];

const mealTypes = [
  { value: 'breakfast', label: 'Desayuno' },
  { value: 'lunch', label: 'Almuerzo' },
  { value: 'dinner', label: 'Cena' },
  { value: 'snack', label: 'Merienda' },
];

interface FoodEntry {
  food: string;
  carbs: number;
  portion: string;
}

export default function FoodTracking() {
  const [mealType, setMealType] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodEntry | null>(null);
  const [customFood, setCustomFood] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customPortion, setCustomPortion] = useState('');
  const [notes, setNotes] = useState('');
  const [addedFoods, setAddedFoods] = useState<FoodEntry[]>([]);

  const handleAddFood = () => {
    if (selectedFood) {
      setAddedFoods([...addedFoods, selectedFood]);
      setSelectedFood(null);
    } else if (customFood && customCarbs) {
      setAddedFoods([
        ...addedFoods,
        {
          food: customFood,
          carbs: Number(customCarbs),
          portion: customPortion,
        },
      ]);
      setCustomFood('');
      setCustomCarbs('');
      setCustomPortion('');
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Aquí se implementará la lógica para guardar los datos
    console.log({
      mealType,
      foods: addedFoods,
      notes,
    });
  };

  const totalCarbs = addedFoods.reduce((sum, food) => sum + food.carbs, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Registro de Alimentación
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registrar Nueva Comida
              </Typography>
              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <FormControl fullWidth required>
                    <InputLabel>Tipo de Comida</InputLabel>
                    <Select
                      value={mealType}
                      label="Tipo de Comida"
                      onChange={(e) => setMealType(e.target.value)}
                    >
                      {mealTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Autocomplete
                    options={commonFoods}
                    getOptionLabel={(option) => option.label}
                    value={selectedFood}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        setSelectedFood({
                          food: newValue.label,
                          carbs: newValue.carbs,
                          portion: newValue.portion,
                        });
                      } else {
                        setSelectedFood(null);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Buscar Alimento"
                        helperText="Selecciona un alimento común o agrega uno personalizado"
                      />
                    )}
                  />

                  <Typography variant="subtitle2" color="text.secondary">
                    O agrega un alimento personalizado:
                  </Typography>

                  <TextField
                    label="Nombre del Alimento"
                    value={customFood}
                    onChange={(e) => setCustomFood(e.target.value)}
                    fullWidth
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Carbohidratos (g)"
                        type="number"
                        value={customCarbs}
                        onChange={(e) => setCustomCarbs(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Porción"
                        value={customPortion}
                        onChange={(e) => setCustomPortion(e.target.value)}
                        fullWidth
                        placeholder="ej: 1 taza"
                      />
                    </Grid>
                  </Grid>

                  <Button
                    onClick={handleAddFood}
                    variant="outlined"
                    startIcon={<AddIcon />}
                    disabled={(!selectedFood && !customFood) || (!selectedFood && !customCarbs)}
                  >
                    Agregar Alimento
                  </Button>

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
                    startIcon={<RestaurantIcon />}
                    fullWidth
                    size="large"
                    disabled={addedFoods.length === 0 || !mealType}
                  >
                    Registrar Comida
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Alimentos Agregados
            </Typography>
            <Stack spacing={2}>
              {addedFoods.map((food, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs>
                        <Typography variant="subtitle1">{food.food}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Porción: {food.portion}
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Chip
                          label={`${food.carbs}g carbos`}
                          color="primary"
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Stack>

            {addedFoods.length > 0 && (
              <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Typography variant="h6">
                  Total Carbohidratos: {totalCarbs}g
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 