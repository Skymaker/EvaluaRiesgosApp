import { useState } from 'react';
import { Button } from './ui/button';
import { Database, Check, AlertCircle } from 'lucide-react';
import { seedData } from '../utils/seed-data';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

export function SeedDataButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSeedData = async () => {
    setIsLoading(true);
    try {
      const result = await seedData();
      toast.success('Datos de prueba cargados correctamente', {
        description: `${result.jobPositionCategories.length} puestos, ${result.workCenters.length} centros, ${result.evaluations.length} evaluaciones`,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error al cargar datos de prueba:', error);
      toast.error('Error al cargar los datos de prueba');
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Database className="w-4 h-4" />
          Cargar Datos de Prueba
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            ¿Cargar datos de prueba?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Esta acción cargará datos de demostración en el sistema:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>10 categorías de puestos de trabajo con riesgos y EPIs</li>
              <li>3 centros de trabajo con estructura completa</li>
              <li>4 evaluaciones de riesgos con datos variados</li>
            </ul>
            <p className="text-amber-600 font-medium">
              ⚠️ Esto sobrescribirá todos los datos existentes en el sistema.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSeedData} disabled={isLoading}>
            {isLoading ? (
              <>Cargando...</>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Cargar Datos
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
