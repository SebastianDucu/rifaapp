import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { raffleApi, ticketApi, imageApi } from '@/services/api';
import type { Raffle, Ticket, TicketStatus, ImageOptions } from '@/types';
import { useTicketSelectionStore } from '@/store';
import {
  padNumber,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  downloadBlob,
  shareImage,
} from '@/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Edit2,
  Users,
  Image as ImageIcon,
  Search,
  CheckSquare,
  Square,
  X,
  Trophy,
  ExternalLink,
  Copy,
  Download,
  Share2,
  RefreshCw,
  Sparkles,
  Phone,
  UserCheck,
  CreditCard,
  Calendar,
  CheckCircle2,
  Layers,
  ArrowRight,
  Shuffle,
  ShieldCheck,
} from 'lucide-react';

// ============================================
// Modal de Edición de Número
// ============================================

function TicketModal({
  ticket,
  raffle,
  onClose,
  onSave,
}: {
  ticket: Ticket;
  raffle: Raffle;
  onClose: () => void;
  onSave: (data: {
    status: TicketStatus;
    buyerName?: string | null;
    buyerPhone?: string | null;
    notes?: string | null;
    amountPaid?: number | null;
    paymentMethod?: string | null;
    version: number;
  }) => void;
}) {
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [buyerName, setBuyerName] = useState(ticket.buyerName || '');
  const [buyerPhone, setBuyerPhone] = useState(ticket.buyerPhone || '');
  const [notes, setNotes] = useState(ticket.notes || '');
  const [amountPaid, setAmountPaid] = useState(ticket.amountPaid ?? raffle.pricePerTicket);
  const [paymentMethod, setPaymentMethod] = useState(ticket.paymentMethod || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      status,
      buyerName: status === 'AVAILABLE' ? null : buyerName.trim() || null,
      buyerPhone: status === 'AVAILABLE' ? null : buyerPhone.trim() || null,
      notes: status === 'AVAILABLE' ? null : notes.trim() || null,
      amountPaid: status === 'PAID' ? amountPaid : null,
      paymentMethod: status === 'PAID' ? paymentMethod.trim() || null : null,
      version: ticket.version,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Detalles del cupón</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Número {padNumber(ticket.number, raffle.totalTickets, raffle.zeroPad)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Estado actual</label>
            <div className="grid grid-cols-3 gap-2">
              {(['AVAILABLE', 'RESERVED', 'PAID'] as TicketStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex flex-col items-center justify-center rounded-lg border py-2.5 px-2 text-xs font-bold transition-all ${
                    status === s
                      ? s === 'AVAILABLE'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : s === 'RESERVED'
                          ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  <span className="leading-tight">{getStatusLabel(s)}</span>
                </button>
              ))}
            </div>
          </div>

          {status !== 'AVAILABLE' && (
            <div className="space-y-3 animate-fade-in">
              <div>
                <label className="label">Nombre del participante</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Roberto Gómez"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Teléfono de contacto</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="Ej. +52 55 1234 5678"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Anotaciones</label>
                <textarea
                  className="input min-h-[64px]"
                  placeholder="Referencias, canal de pago o notas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {status === 'PAID' && (
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
              <div>
                <label className="label">Monto recibido</label>
                <input
                  type="number"
                  className="input"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.01}
                />
              </div>

              <div>
                <label className="label">Medio de pago</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Transferencia"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="submit" className="btn-primary flex-1 font-bold">
              Guardar Cambios
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Barra Flotante de Acciones en Masa
// ============================================

function BulkActionBar({
  count,
  onAction,
  onClear,
}: {
  count: number;
  onAction: (status: TicketStatus, buyerName?: string, buyerPhone?: string) => void;
  onClear: () => void;
}) {
  const [showAssignFields, setShowAssignFields] = useState(false);
  const [bulkName, setBulkName] = useState('');
  const [bulkPhone, setBulkPhone] = useState('');

  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-fade-in">
      <div className="rounded-2xl border border-slate-300/80 bg-slate-900 text-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {count}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {count === 1 ? 'Número seleccionado' : 'Números seleccionados'}
            </span>
          </div>
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
            <span>Desmarcar</span>
          </button>
        </div>

        {showAssignFields && (
          <div className="grid grid-cols-2 gap-2.5 pt-3 animate-fade-in">
            <input
              type="text"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              placeholder="Nombre del comprador"
              value={bulkName}
              onChange={(e) => setBulkName(e.target.value)}
              autoFocus
            />
            <input
              type="tel"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              placeholder="Teléfono"
              value={bulkPhone}
              onChange={(e) => setBulkPhone(e.target.value)}
            />
          </div>
        )}

        <div className="flex items-center gap-2 pt-3">
          <button
            onClick={() => onAction('AVAILABLE')}
            className="btn-sm rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-colors"
          >
            Liberar
          </button>
          <button
            onClick={() => {
              if (!showAssignFields) {
                setShowAssignFields(true);
                return;
              }
              onAction('RESERVED', bulkName, bulkPhone);
            }}
            className="btn-sm rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900 transition-colors"
          >
            Apartar
          </button>
          <button
            onClick={() => {
              if (!showAssignFields) {
                setShowAssignFields(true);
                return;
              }
              onAction('PAID', bulkName, bulkPhone);
            }}
            className="btn-sm rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900 transition-colors"
          >
            Marcar Pagados
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Modal de Generación de Imagen
// ============================================

function ImageModal({
  raffleId,
  onClose,
}: {
  raffleId: string;
  onClose: () => void;
}) {
  const [options, setOptions] = useState<ImageOptions>({
    showNames: false,
    showOnlyAvailable: false,
    size: 'square',
    theme: 'light',
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePreview = async () => {
    setLoading(true);
    try {
      const imgBlob = await imageApi.generate(raffleId, options);
      setBlob(imgBlob);
      setPreview(URL.createObjectURL(imgBlob));
    } catch {
      toast.error('No se pudo generar la imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (blob) {
      downloadBlob(blob, 'tablero-oficial.png');
      toast.success('Descarga completada');
    }
  };

  const handleShare = async () => {
    if (blob) {
      const shared = await shareImage(blob, 'Tablero Oficial de Rifa');
      if (!shared) {
        toast.error('Compartir no soportado en este dispositivo. Descarga el archivo.');
      }
    }
  };

  const handleCopy = async () => {
    if (blob) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        toast.success('Imagen copiada al portapapeles');
      } catch {
        toast.error('No se pudo copiar');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Exportación</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Generar Tablero PNG</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <input
                type="checkbox"
                checked={options.showNames}
                onChange={(e) => setOptions((p) => ({ ...p, showNames: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Incluir nombres</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <input
                type="checkbox"
                checked={options.showOnlyAvailable}
                onChange={(e) => setOptions((p) => ({ ...p, showOnlyAvailable: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Solo disponibles</span>
            </label>
          </div>

          <div>
            <label className="label">Formato de resolución</label>
            <select
              className="input font-semibold"
              value={options.size}
              onChange={(e) => setOptions((p) => ({ ...p, size: e.target.value as ImageOptions['size'] }))}
            >
              <option value="square">Cuadrado estándar (1080 × 1080 px)</option>
              <option value="story">Historia vertical (1080 × 1920 px)</option>
              <option value="a4">Documento A4 Alta Densidad</option>
            </select>
          </div>

          <div>
            <label className="label">Paleta de fondo</label>
            <div className="grid grid-cols-2 gap-2">
              {(['light', 'dark'] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setOptions((p) => ({ ...p, theme }))}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    options.theme === theme
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  {theme === 'light' ? 'Tema Claro' : 'Tema Oscuro'}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generatePreview} className="btn-primary w-full py-2.5 font-bold" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Renderizando canvas...
              </span>
            ) : (
              <>
                <ImageIcon size={16} />
                <span>{preview ? 'Volver a renderizar' : 'Generar Vista Previa'}</span>
              </>
            )}
          </button>

          {preview && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                <img src={preview} alt="Vista previa del tablero" className="w-full h-auto object-contain max-h-60" />
              </div>

              <div className="flex gap-2">
                <button onClick={handleDownload} className="btn-accent flex-1 btn-sm">
                  <Download size={14} />
                  <span>Descargar PNG</span>
                </button>
                <button onClick={handleCopy} className="btn-secondary btn-sm" title="Copiar al portapapeles">
                  <Copy size={14} />
                </button>
                <button onClick={handleShare} className="btn-secondary btn-sm" title="Compartir">
                  <Share2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Modal de Sorteo Profesional
// ============================================

function DrawModal({
  raffleId,
  onClose,
  onDraw,
}: {
  raffleId: string;
  onClose: () => void;
  onDraw: () => void;
}) {
  const [method, setMethod] = useState<'random' | 'manual'>('random');
  const [manualNumber, setManualNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [winner, setWinner] = useState<{ number: number; name: string | null } | null>(null);
  const [displayNumber, setDisplayNumber] = useState(0);

  const handleDraw = async () => {
    setLoading(true);

    // Animación visual numérica
    let counter = 0;
    const interval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 999));
      counter++;
      if (counter > 25) {
        clearInterval(interval);
      }
    }, 80);

    setTimeout(async () => {
      try {
        const result = await raffleApi.draw(
          raffleId,
          method,
          method === 'manual' ? parseInt(manualNumber, 10) : undefined
        );
        clearInterval(interval);
        setWinner({
          number: result.winnerTicketNum!,
          name: result.winnerName,
        });
        toast.success('Ganador oficial determinado');
        onDraw();
      } catch (error) {
        clearInterval(interval);
        toast.error((error as Error).message);
      } finally {
        setLoading(false);
      }
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="py-10 text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Shuffle size={32} className="animate-spin" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Procesando sorteo</p>
              <p className="text-4xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white mt-1">
                #{String(displayNumber).padStart(3, '0')}
              </p>
            </div>
            <p className="text-xs text-slate-500">Seleccionando entre los números pagados verificados...</p>
          </div>
        ) : winner ? (
          <div className="py-6 text-center space-y-4 animate-fade-in">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Trophy size={28} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Resultado Oficial
              </span>
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white mt-1">
                Cupón #{winner.number}
              </h3>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                {winner.name || 'Sin titular registrado'}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={onClose} className="btn-primary w-full">
                Finalizar y Cerrar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Procedimiento</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Determinar Ganador</h3>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('random')}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-bold transition-all ${
                    method === 'random'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  Selección Aleatoria
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('manual')}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-bold transition-all ${
                    method === 'manual'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  Asignación Manual
                </button>
              </div>

              {method === 'manual' && (
                <div>
                  <label className="label">Número Ganador</label>
                  <input
                    type="number"
                    className="input font-bold"
                    placeholder="Ingrese número del boleto premiado"
                    value={manualNumber}
                    onChange={(e) => setManualNumber(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/60 dark:bg-slate-950/50 dark:border-slate-800 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>Criterio de validación</span>
                </div>
                Solo participan los números verificados en estado <span className="font-bold text-rose-600">Pagado</span>.
              </div>

              <div className="pt-2">
                <button onClick={handleDraw} className="btn-accent w-full py-2.5 font-bold" disabled={loading}>
                  <Trophy size={16} />
                  <span>Ejecutar Sorteo</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// Página Principal de Detalle y Tablero
// ============================================

export default function RaffleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const { selectedTickets, toggleTicket, selectAll, clearSelection } = useTicketSelectionStore();

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [raffleData, ticketData] = await Promise.all([
        raffleApi.getById(id),
        ticketApi.getByRaffle(id),
      ]);
      setRaffle(raffleData);
      setTickets(ticketData);
    } catch {
      toast.error('Error al sincronizar datos');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
    return () => clearSelection();
  }, [loadData, clearSelection]);

  const handleTicketSave = async (data: {
    status: TicketStatus;
    buyerName?: string | null;
    buyerPhone?: string | null;
    notes?: string | null;
    amountPaid?: number | null;
    paymentMethod?: string | null;
    version: number;
  }) => {
    if (!selectedTicket) return;
    try {
      await ticketApi.update(selectedTicket.id, data);
      toast.success('Estado actualizado');
      setSelectedTicket(null);
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleBulkAction = async (status: TicketStatus, buyerName?: string, buyerPhone?: string) => {
    if (!id) return;
    try {
      const ticketIds = Array.from(selectedTickets);
      await ticketApi.bulkUpdate(id, {
        ticketIds,
        status,
        buyerName: buyerName || null,
        buyerPhone: buyerPhone || null,
      });
      toast.success(`${ticketIds.length} números modificados`);
      clearSelection();
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleInlineEdit = async (ticket: Ticket, newName: string) => {
    try {
      await ticketApi.update(ticket.id, {
        status: ticket.status,
        buyerName: newName.trim() || null,
        version: ticket.version,
      });
      setEditingTicketId(null);
      loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const numStr = padNumber(t.number, raffle?.totalTickets || 100, raffle?.zeroPad ?? true);
      if (
        !numStr.includes(term) &&
        !(t.buyerName || '').toLowerCase().includes(term)
      ) {
        return false;
      }
    }
    return true;
  });

  if (loading || !raffle) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cargando tablero...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Volver a mis rifas</span>
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              {raffle.name}
            </h1>
            {raffle.status === 'ACTIVE' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                En curso
              </span>
            )}
          </div>

          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Premio: <span className="text-slate-800 dark:text-slate-200">{raffle.prize}</span> · Valor boleto: <span className="text-slate-800 dark:text-slate-200">{formatCurrency(raffle.pricePerTicket)}</span>
            {raffle.drawDate && ` · Sorteo: ${formatDate(raffle.drawDate)}`}
          </p>

          {raffle.prizeImageUrl && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={raffle.prizeImageUrl}
                alt={raffle.prize}
                className="h-16 w-24 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
              />
              <span className="text-xs font-semibold text-slate-500">Imagen referencial del premio</span>
            </div>
          )}

          {raffle.winnerTicketNum !== null && (
            <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
              <Trophy size={14} className="text-emerald-600" />
              <span>Ganador registrado: Boleto #{raffle.winnerTicketNum} ({raffle.winnerName || 'Sin nombre'})</span>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/raffles/${id}/participants`} className="btn-secondary btn-sm">
            <Users size={14} />
            <span>Participantes</span>
          </Link>

          <button onClick={() => setShowImageModal(true)} className="btn-secondary btn-sm">
            <ImageIcon size={14} />
            <span>Exportar Imagen</span>
          </button>

          {raffle.status !== 'FINISHED' && (
            <button onClick={() => setShowDrawModal(true)} className="btn-primary btn-sm">
              <Trophy size={14} />
              <span>Sortear</span>
            </button>
          )}

          {raffle.status === 'ACTIVE' && (
            <a
              href={`/r/${raffle.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary btn-sm text-blue-600 dark:text-blue-400"
              title="Abrir vista pública"
            >
              <ExternalLink size={14} />
            </a>
          )}

          <Link to={`/raffles/${id}/edit`} className="btn-secondary btn-sm" title="Configuraciones">
            <Edit2 size={13} />
          </Link>

          <button onClick={loadData} className="btn-ghost btn-sm text-slate-400 hover:text-slate-700" title="Refrescar">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {raffle.stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Disponibles</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{raffle.stats.available}</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Apartados</span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{raffle.stats.reserved}</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Pagados</span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{raffle.stats.paid}</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Boletos</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{raffle.stats.total}</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Cobrado</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(raffle.stats.collected)}</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Por Cobrar</span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatCurrency(raffle.stats.pendingReserved)}</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Meta Total</span>
            <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{formatCurrency(raffle.stats.totalExpected)}</span>
          </div>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
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

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="input pl-8 py-1.5 text-xs font-medium"
              placeholder="Buscar número o comprador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => selectAll(filteredTickets.map((t) => t.id))}
            className="btn-secondary btn-sm shrink-0"
            title="Seleccionar visibles"
          >
            <CheckSquare size={13} />
            <span className="hidden md:inline">Todos ({filteredTickets.length})</span>
          </button>
        </div>
      </div>

      {/* Cuadrícula interactiva de boletos */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15">
          {filteredTickets.map((ticket) => {
            const isSelected = selectedTickets.has(ticket.id);
            return (
              <div
                key={ticket.id}
                className={`relative flex flex-col items-center justify-center rounded-lg border-2 p-1.5 sm:p-2 text-center transition-all duration-150 cursor-pointer select-none hover:shadow-sm active:scale-95 ${getStatusColor(
                  ticket.status
                )} ${isSelected ? 'ring-2 ring-blue-600 ring-offset-1 border-blue-600' : ''}`}
                onClick={(e) => {
                  if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    toggleTicket(ticket.id);
                  } else {
                    setSelectedTicket(ticket);
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (ticket.status !== 'AVAILABLE') {
                    setEditingTicketId(ticket.id);
                    setEditingName(ticket.buyerName || '');
                  }
                }}
              >
                {/* Checkbox indicator */}
                <div
                  className="absolute top-1 left-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTicket(ticket.id);
                  }}
                >
                  {isSelected ? (
                    <CheckSquare size={11} className="text-blue-600" />
                  ) : (
                    <Square size={11} className="text-slate-300 opacity-0 group-hover:opacity-100 dark:text-slate-600" />
                  )}
                </div>

                <span className="text-xs sm:text-sm font-bold tracking-tight">
                  {padNumber(ticket.number, raffle.totalTickets, raffle.zeroPad)}
                </span>

                {ticket.buyerName && editingTicketId !== ticket.id && (
                  <span className="mt-0.5 block w-full truncate text-[9px] font-semibold tracking-tight text-slate-600 dark:text-slate-400">
                    {ticket.buyerName}
                  </span>
                )}

                {editingTicketId === ticket.id && (
                  <input
                    type="text"
                    className="mt-0.5 w-full rounded border border-blue-500 bg-white px-1 py-0.5 text-[9px] font-bold text-slate-900 focus:outline-none"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleInlineEdit(ticket, editingName)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInlineEdit(ticket, editingName);
                      if (e.key === 'Escape') setEditingTicketId(null);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            );
          })}
        </div>

        {filteredTickets.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              No se hallaron coincidencias con los filtros aplicados
            </p>
          </div>
        )}
      </div>

      {/* Floating Bulk Actions */}
      <BulkActionBar
        count={selectedTickets.size}
        onAction={handleBulkAction}
        onClear={clearSelection}
      />

      {/* Modals */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          raffle={raffle}
          onClose={() => setSelectedTicket(null)}
          onSave={handleTicketSave}
        />
      )}

      {showImageModal && (
        <ImageModal raffleId={id!} onClose={() => setShowImageModal(false)} />
      )}

      {showDrawModal && (
        <DrawModal
          raffleId={id!}
          onClose={() => setShowDrawModal(false)}
          onDraw={loadData}
        />
      )}
    </div>
  );
}
