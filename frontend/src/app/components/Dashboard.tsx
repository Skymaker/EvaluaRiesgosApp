import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Building2, FileText, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { getWorkCenters, getEvaluations } from '../utils/storage';
import { WorkCenter, RiskEvaluation } from '../types';
import { getRiskLevelColor, getRiskLevelLabel } from '../utils/risk-utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export function Dashboard() {
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [evaluations, setEvaluations] = useState<RiskEvaluation[]>([]);

  useEffect(() => {
    setWorkCenters(getWorkCenters());
    setEvaluations(getEvaluations());
  }, []);

  // Combinar todos los riesgos de estructura y puestos
  const allRisks = evaluations.flatMap(ev => {
    const estructuraRisks = (ev.riesgosEstructura || []).map(r => r.risk);
    const puestosRisks = (ev.riesgosPuestos || []).map(r => r.risk);
    return [...estructuraRisks, ...puestosRisks];
  });

  const totalRisks = allRisks.length;

  const risksByLevel = allRisks.reduce((acc, risk) => {
    acc[risk.nivel] = (acc[risk.nivel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const risksByCategory = allRisks.reduce((acc, risk) => {
    acc[risk.categoria] = (acc[risk.categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const completedEvaluations = evaluations.filter(e => e.estado === 'completada').length;

  const categoryData = Object.entries(risksByCategory)
    .map(([categoria, count], index) => ({
      id: `cat-${categoria}-${index}`,
      name: categoria.charAt(0).toUpperCase() + categoria.slice(1),
      value: count,
    }))
    .filter(item => item.value > 0);

  const levelData = [
    { id: 'level-trivial', name: 'Trivial', value: risksByLevel.trivial || 0, color: '#10b981' },
    { id: 'level-tolerable', name: 'Tolerable', value: risksByLevel.tolerable || 0, color: '#3b82f6' },
    { id: 'level-moderado', name: 'Moderado', value: risksByLevel.moderado || 0, color: '#f59e0b' },
    { id: 'level-importante', name: 'Importante', value: risksByLevel.importante || 0, color: '#f97316' },
    { id: 'level-intolerable', name: 'Intolerable', value: risksByLevel.intolerable || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#f43f5e'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Vista general de las evaluaciones de riesgos laborales</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Centros de Trabajo</CardTitle>
            <Building2 className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{workCenters.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Evaluaciones</CardTitle>
            <FileText className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{evaluations.length}</div>
            <p className="text-xs text-gray-500 mt-1">{completedEvaluations} completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Riesgos Identificados</CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalRisks}</div>
            <p className="text-xs text-gray-500 mt-1">En todas las evaluaciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Riesgos Críticos</CardTitle>
            <TrendingUp className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {(risksByLevel.importante || 0) + (risksByLevel.intolerable || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Requieren atención inmediata</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card key="chart-card-level">
          <CardHeader>
            <CardTitle>Riesgos por Nivel</CardTitle>
          </CardHeader>
          <CardContent>
            {totalRisks > 0 ? (
              <div key="bar-chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={levelData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6">
                      {levelData.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>

        <Card key="chart-card-category">
          <CardHeader>
            <CardTitle>Riesgos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {totalRisks > 0 ? (
              <div key="pie-chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Evaluations */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluaciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {evaluations.length > 0 ? (
            <div className="space-y-3">
              {evaluations.slice(0, 5).map((evaluation) => {
                const evaluationRisksCount =
                  (evaluation.riesgosEstructura?.length || 0) +
                  (evaluation.riesgosPuestos?.length || 0);

                return (
                  <div key={evaluation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{evaluation.workCenterName}</div>
                      <div className="text-sm text-gray-500">
                        {evaluation.evaluador} • {new Date(evaluation.fecha).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">
                        {evaluationRisksCount} riesgos
                      </div>
                      <Link
                        to={`/evaluaciones/${evaluation.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Ver detalles
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No hay evaluaciones registradas aún
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {workCenters.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">¡Comienza aquí!</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Para empezar a realizar evaluaciones de riesgos, primero debes registrar tus centros de trabajo.
                </p>
                <Link
                  to="/centros/nuevo"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Building2 className="w-4 h-4" />
                  Registrar Centro de Trabajo
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
