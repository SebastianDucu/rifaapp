import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { raffleApi } from '@/services/api';
import type { Raffle } from '@/types';
import { formatDate, formatCurrency } from '@/utils';
import toast from 'react-hot-toast';
import {
  Plus,
  Eye,
  Edit2,
  Copy,
  Archive,
  Trash2,
  Award,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRaffles();
  }, []);

  const loadRaffles = async () => {
    try {
      const data = await raffleApi.list();
      setRaffles(data);
    } catch {
      toast.error('Error al sincronizar rifas');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await raffleApi.duplicate(id);
      toast.success('Rifa duplicada con éxito');
      loadRaffles();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await raffleApi.archive(id);
      toast.success('Rifa archivada');
      loadRaffles();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Confirma la eliminación permanente de esta rifa? Esta acción no se puede deshacer.')) return;
    try {
      await raffleApi.delete(id);
      toast.success('Rifa eliminada');
      loadRaffles();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
            Borrador
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Activa
          </span>
        );
      case 'FINISHED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            Finalizada
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cargando registros...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            Panel de Rifas
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Supervisa el estado, ventas y configuraciones de cada sorteo activo o finalizado.
          </p>
        </div>
        <Link to="/raffles/new" className="btn-accent btn-sm self-start sm:self-auto shadow-sm">
          <Plus size={16} />
          <span>Nueva Rifa</span>
        </Link>
      </div>

      {raffles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/30">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 mb-4">
            <Layers size={22} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Sin rifas configuradas
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Crea tu primera rifa definiendo premio, cantidad de números y precio unitario para iniciar las ventas.
          </p>
          <div className="mt-6">
            <Link to="/raffles/new" className="btn-primary btn-sm">
              <Plus size={15} />
              <span>Crear primera rifa</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {raffles.map((raffle) => {
            const percentSold = raffle.stats
              ? Math.round(((raffle.stats.paid + raffle.stats.reserved) / raffle.stats.total) * 100) || 0
              : 0;

            return (
              <div
                key={raffle.id}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div>
                  {/* Status & Title */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {raffle.name}
                    </h3>
                    {renderStatusBadge(raffle.status)}
                  </div>

                  {/* Prize & Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Award size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{raffle.prize}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <Calendar size={14} className="text-slate-400 shrink-0" />
                      <span>{raffle.drawDate ? formatDate(raffle.drawDate) : 'Fecha pendiente'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-medium text-slate-500 dark:text-slate-400">Precio / número:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(raffle.pricePerTicket)}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 mb-5">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Progreso de colocación</span>
                      <span className="text-slate-800 dark:text-slate-200">{percentSold}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentSold}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics grid */}
                  {raffle.stats && (
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50/70 p-2.5 border border-slate-100 dark:bg-slate-950/40 dark:border-slate-800/60 mb-5">
                      <div className="text-center">
                        <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {raffle.stats.available}
                        </span>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Libres
                        </span>
                      </div>
                      <div className="text-center border-x border-slate-200/60 dark:border-slate-800">
                        <span className="block text-xs font-bold text-amber-600 dark:text-amber-400">
                          {raffle.stats.reserved}
                        </span>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Apartados
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="block text-xs font-bold text-rose-600 dark:text-rose-400">
                          {raffle.stats.paid}
                        </span>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Pagados
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Recaudado */}
                  {raffle.stats && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <TrendingUp size={13} className="text-emerald-500" />
                        <span className="font-semibold text-slate-600 dark:text-slate-400">Recaudado:</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(raffle.stats.collected)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions toolbar */}
                <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <Link
                    to={`/raffles/${raffle.id}`}
                    className="btn-primary btn-sm flex-1 font-bold"
                  >
                    <Eye size={14} />
                    <span>Administrar</span>
                  </Link>

                  <Link
                    to={`/raffles/${raffle.id}/edit`}
                    className="btn-secondary btn-sm"
                    title="Editar detalles"
                  >
                    <Edit2 size={13} />
                  </Link>

                  <button
                    onClick={() => handleDuplicate(raffle.id)}
                    className="btn-secondary btn-sm"
                    title="Duplicar rifa"
                  >
                    <Copy size={13} />
                  </button>

                  {raffle.status === 'ACTIVE' && (
                    <a
                      href={`/r/${raffle.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost btn-sm text-blue-600 dark:text-blue-400"
                      title="Abrir enlace público"
                    >
                      <ArrowUpRight size={15} />
                    </a>
                  )}

                  {raffle.status !== 'FINISHED' && (
                    <button
                      onClick={() => handleArchive(raffle.id)}
                      className="btn-ghost btn-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Archivar"
                    >
                      <Archive size={13} />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(raffle.id)}
                    className="btn-ghost btn-sm text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                    title="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
