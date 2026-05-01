import { JobPositionCategory } from '../types';
import { apiRequest } from './api-client';

let categoriesCache: JobPositionCategory[] = [];

export const initializeJobCategories = async (): Promise<void> => {
  const categories = await apiRequest('/categorias-puestos');
  categoriesCache = Array.isArray(categories) ? categories : [];
};

export const getJobCategories = (): JobPositionCategory[] => {
  return [...categoriesCache];
};

export const saveJobCategory = (category: JobPositionCategory): void => {
  const categories = [...categoriesCache];
  const index = categories.findIndex(c => c.id === category.id);
  
  if (index >= 0) {
    categories[index] = category;
  } else {
    categories.push(category);
  }
  categoriesCache = categories;
  void apiRequest(`/categorias-puestos/${category.id}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  }).catch((error) => {
    console.error('No se pudo guardar la categoría de puesto:', error);
  });
};

export const deleteJobCategory = (id: string): void => {
  categoriesCache = categoriesCache.filter((c) => c.id !== id);
  void apiRequest(`/categorias-puestos/${id}`, { method: 'DELETE' }).catch((error) => {
    console.error('No se pudo eliminar la categoría de puesto:', error);
  });
};

export const getJobCategoryById = (id: string): JobPositionCategory | undefined => {
  return getJobCategories().find(c => c.id === id);
};
