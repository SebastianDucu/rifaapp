import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { publicApi } from '@/services/api';
import type { Raffle, Ticket, TicketStatus } from '@/types';
import { padNumber, formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/utils';
import {
  Trophy,
  Calendar,
  CreditCard,
  Phone,
  MessageCircle,
  RefreshCw,
  Info,
  CheckCircle2,
  Clock,
  CircleDot,
  Ticket as TicketIcon,
} from 'lucide-react';

export default function PublicRafflePage() {
  const { slug } = useParams<{ slug: string }>();
  const [raffle, setRaffle] = useState<(Raffle & { tickets: Ticket[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const loadData = useCallback(async () => {
    if (!slug) return;
    try {
      const data = await publicApi.getRaffle(slug);
      setRaffle(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
    // Auto-refresh sutil cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleWhatsApp = () => {
    if (!raffle) return;
    const phone = (raffle as unknown as { contactPhone?: string }).contactPhone || '';
    const message = `Hola, deseo consultar disponibilidad para apartar números en la rifa "${raffle.name}".`;
    const cleanPhone = phone.replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cargando tablero oficial...</span>
        </div>
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 mb-4">
            <Info size={22} />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Rifa no disponible</h2>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {error || 'El sorteo solicitado no existe o se encuentra inactivo temporalmente.'}
          </p>
        </div>
      </div>
    );
  }

  const filteredTickets = raffle.tickets.filter(
    (t) => filterStatus === 'ALL' || t.status === filterStatus
  );

  const stats = {
    available: raffle.tickets.filter((t) => t.status === 'AVAILABLE').length,
    reserved: raffle.tickets.filter((t) => t.status === 'RESERVED').length,
    paid: raffle.tickets.filter((t) => t.status === 'PAID').length,
  };

  const imageUrl = `/api/public/raffles/${slug}/image.png`;

  return (
    <>
      <Helmet>
        <title>{raffle.name} — Tablero Oficial</title>
        <meta property="og:title" content={raffle.name} />
        <meta property="og:description" content={`Premio: ${raffle.prize} · Costo por boleto: ${formatCurrency(raffle.pricePerTicket)}`} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={raffle.name} />
        <meta name="twitter:image" content={imageUrl} />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
        {/* Banner Superior Sobrio */}
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300 mb-3">
              <TicketIcon size={13} />
              <span>Tablero en Tiempo Real</span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              {raffle.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Trophy size={16} className="text-amber-500" />
                <span>{raffle.prize}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-bold text-slate-950 dark:text-white">
                {formatCurrency(raffle.pricePerTicket)} por cupón
              </span>
              {raffle.drawDate && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Calendar size={15} />
                    <span>{formatDate(raffle.drawDate)}</span>
                  </span>
                </>
              )}
            </div>

            {raffle.prizeImageUrl && (
              <div className="mt-4 flex justify-center">
                <div className="overflow-hidden rounded-2xl border-2 border-slate-200/80 shadow-md max-w-sm max-h-56 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                  <img
                    src={raffle.prizeImageUrl}
                    alt={raffle.prize}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {raffle.winnerTicketNum !== null && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                <Trophy size={18} className="text-emerald-600" />
                <span>Sorteo Realizado · Boleto Premiado #{raffle.winnerTicketNum} ({raffle.winnerName || 'Ganador Confirmado'})</span>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
          {/* Descripción si existe */}
          {raffle.description && (
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 text-xs sm:text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 leading-relaxed">
              {raffle.description}
            </div>
          )}

          {/* Métricas Principales */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-center dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <span className="block text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {stats.available}
              </span>
              <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                Disponibles
              </span>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-center dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <span className="block text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                {stats.reserved}
              </span>
              <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                Apartados
              </span>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-center dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <span className="block text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
                {stats.paid}
              </span>
              <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                Pagados
              </span>
            </div>
          </div>

          {/* Botón Principal para Apartar */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-150"
          >
            <MessageCircle size={18} />
            <span>Contactar al Organizador para Apartar Números</span>
          </button>

          {/* Filtros de Cuadrícula */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'AVAILABLE', label: 'Disponibles' },
                { id: 'RESERVED', label: 'Apartados' },
                { id: 'PAID', label: 'Pagados' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                    filterStatus === f.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <CircleDot size={12} className="text-emerald-500" />
              <span>Sincronización activa</span>
            </div>
          </div>

          {/* Cuadrícula de Números */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`flex flex-col items-center justify-center rounded-lg border-2 p-2 text-center transition-all ${getStatusColor(
                    ticket.status
                  )}`}
                >
                  <span className="text-xs sm:text-sm font-bold tracking-tight">
                    {padNumber(ticket.number, raffle.totalTickets, raffle.zeroPad)}
                  </span>
                  {ticket.buyerName && (
                    <span className="mt-0.5 block w-full truncate text-[9px] font-semibold text-slate-600 dark:text-slate-400">
                      {ticket.buyerName}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Leyenda de Estados */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 py-2">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-emerald-100 border border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700"></span>
              Disponible
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-amber-100 border border-amber-300 dark:bg-amber-950 dark:border-amber-700"></span>
              Apartado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-rose-100 border border-rose-300 dark:bg-rose-950 dark:border-rose-700"></span>
              Pagado
            </span>
          </div>

          {/* Información de Pago y Contacto */}
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            {raffle.paymentInfo && (
              <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                  <CreditCard size={15} className="text-slate-400" />
                  <span>Instrucciones de Pago</span>
                </div>
                <p className="whitespace-pre-line text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  {raffle.paymentInfo}
                </p>
              </div>
            )}

            {raffle.contactInfo && (
              <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                  <Phone size={15} className="text-slate-400" />
                  <span>Canal de Atención</span>
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  {raffle.contactInfo}
                </p>
              </div>
            )}
          </div>

          {/* Footer Oficial */}
          <footer className="pt-8 pb-4 text-center text-[11px] font-semibold text-slate-400 space-y-1">
            <p>Tablero actualizado automáticamente en tiempo real</p>
            <p className="tracking-wide">Plataforma Segura RifaApp</p>
          </footer>
        </main>
      </div>
    </>
  );
}
