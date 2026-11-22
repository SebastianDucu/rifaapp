import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { participantApi, raffleApi } from '@/services/api';
import type { Participant, Raffle } from '@/types';
import { formatCurrency, padNumber, generateWhatsAppMessage, openWhatsApp, copyToClipboard } from '@/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Download,
  Upload,
  MessageCircle,
  Copy,
  Users,
  Search,
} from 'lucide-react';

export default function ParticipantsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const [raffleData, participantData] = await Promise.all([
          raffleApi.getById(id),
          participantApi.getByRaffle(id),
        ]);
        setRaffle(raffleData);
        setParticipants(participantData);
      } catch {
        toast.error('Error al sincronizar participantes');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleExport = async () => {
    if (!id) return;
    try {
      await participantApi.exportCsv(id);
      toast.success('Archivo CSV generado');
    } catch {
      toast.error('Error al exportar');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files?.[0]) return;
    try {
      const result = await participantApi.importCsv(id, e.target.files[0]);
      toast.success(`${result.updated} registros sincronizados`);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} incidencias en la importación`);
      }
      const participantData = await participantApi.getByRaffle(id);
      setParticipants(participantData);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleWhatsApp = (participant: Participant) => {
    if (!raffle || !participant.phone) {
      toast.error('No se tiene teléfono registrado para este comprador');
      return;
    }
    const message = generateWhatsAppMessage(
      participant.name,
      participant.tickets.map((t) => t.number),
      participant.totalToPay,
      raffle.name,
      raffle.zeroPad,
      raffle.totalTickets
    );
    openWhatsApp(participant.phone, message);
  };

  const handleCopyMessage = async (participant: Participant) => {
    if (!raffle) return;
    const message = generateWhatsAppMessage(
      participant.name,
      participant.tickets.map((t) => t.number),
      participant.totalToPay,
      raffle.name,
      raffle.zeroPad,
      raffle.totalTickets
    );
    const copied = await copyToClipboard(message);
    if (copied) toast.success('Mensaje copiado al portapapeles');
    else toast.error('No se pudo copiar');
  };

  const filtered = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search))
  );

  if (loading || !raffle) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cargando directorio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/raffles/${id}`)}
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Volver al tablero</span>
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            Directorio de Participantes
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {raffle.name} · {participants.length} registrados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary btn-sm font-semibold">
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>
          <label className="btn-secondary btn-sm cursor-pointer font-semibold">
            <Upload size={14} />
            <span>Importar CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          className="input pl-8 py-1.5 text-xs font-medium"
          placeholder="Filtrar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 mb-3">
            <Users size={20} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Sin participantes que coincidan
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-950/40">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Participante</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Teléfono</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Números Adquiridos</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-right">Monto Total</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-right">Liquidado</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filtered.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono">{p.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.tickets.map((t) => (
                          <span
                            key={t.id}
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold tracking-tight font-mono ${
                              t.status === 'PAID'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
                            }`}
                          >
                            {padNumber(t.number, raffle.totalTickets, raffle.zeroPad)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.totalToPay)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-bold ${
                          p.totalPaid >= p.totalToPay
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {formatCurrency(p.totalPaid)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleWhatsApp(p)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                          title="Enviar confirmación WhatsApp"
                        >
                          <MessageCircle size={15} />
                        </button>
                        <button
                          onClick={() => handleCopyMessage(p)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 transition-colors"
                          title="Copiar texto formal"
                        >
                          <Copy size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
