import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { raffleApi, uploadApi } from '@/services/api';
import type { CreateRaffleData } from '@/types';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Layers,
  DollarSign,
  CreditCard,
  Palette,
  UploadCloud,
  X,
  Image as ImageIcon,
} from 'lucide-react';

export default function CreateRafflePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState<CreateRaffleData>({
    name: '',
    description: '',
    prize: '',
    prizeImageUrl: null,
    pricePerTicket: 10000,
    totalTickets: 100,
    startNumber: 0,
    zeroPad: true,
    lotteryMethod: '',
    paymentInfo: '',
    contactInfo: '',
    contactPhone: '',
    primaryColor: '#3b82f6',
    template: 'default',
    status: 'ACTIVE',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? value === ''
            ? ''
            : parseFloat(value)
          : type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : value,
    }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Quitar comas y caracteres no numéricos
    const rawVal = e.target.value.replace(/\D/g, '');
    const num = rawVal === '' ? 0 : parseInt(rawVal, 10);
    setForm((prev) => ({ ...prev, pricePerTicket: num }));
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadApi.uploadImage(file);
      setForm((prev) => ({ ...prev, prizeImageUrl: url }));
      toast.success('Foto del premio cargada');
    } catch {
      toast.error('No se pudo subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: CreateRaffleData = {
        ...form,
        name: form.name.trim(),
        prize: form.prize.trim(),
        description: form.description?.trim() || '',
        pricePerTicket: Number(form.pricePerTicket) > 0 ? Number(form.pricePerTicket) : 10000,
        totalTickets: Number(form.totalTickets) > 0 ? Number(form.totalTickets) : 100,
        startNumber: Number(form.startNumber) >= 0 ? Number(form.startNumber) : 0,
        drawDate: form.drawDate && form.drawDate.trim() !== '' ? form.drawDate : null,
        lotteryMethod: form.lotteryMethod?.trim() || '',
        paymentInfo: form.paymentInfo?.trim() || '',
        contactInfo: form.contactInfo?.trim() || '',
        contactPhone: form.contactPhone?.trim() || '',
        prizeImageUrl: form.prizeImageUrl || null,
      };

      const raffle = await raffleApi.create(payload);
      toast.success('Rifa creada y emitida exitosamente');
      navigate(`/raffles/${raffle.id}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Cancelar y volver</span>
      </button>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-fade-in">
        <div className="border-b border-slate-100 pb-5 mb-6 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Asistente de Emisión
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
            Crear Nueva Rifa
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bloque 1 */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Layers size={14} />
              <span>Información General</span>
            </h2>

            <div>
              <label htmlFor="name" className="label">
                Título de la Rifa *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="input font-semibold"
                placeholder="Ej. Sorteo Extraordinario Virgen de Guadalupe"
                value={form.name}
                onChange={handleChange}
                required
                minLength={2}
              />
            </div>

            <div>
              <label htmlFor="prize" className="label">
                Premio Principal *
              </label>
              <input
                id="prize"
                name="prize"
                type="text"
                className="input font-semibold"
                placeholder="Ej. Moto Yamaha NMax / $5,000,000 en Efectivo"
                value={form.prize}
                onChange={handleChange}
                required
              />
            </div>

            {/* Subir foto del premio o fondo */}
            <div>
              <label className="label">Foto o Afiche del Premio (Para el póster y web)</label>
              {form.prizeImageUrl ? (
                <div className="relative inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2">
                  <img
                    src={form.prizeImageUrl}
                    alt="Foto del premio"
                    className="h-28 w-44 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, prizeImageUrl: null }))}
                    className="absolute top-3 right-3 rounded-full bg-slate-900/80 p-1 text-white hover:bg-rose-600 transition-colors"
                    title="Eliminar foto"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6 hover:border-blue-500 hover:bg-blue-50/20 dark:border-slate-800 dark:hover:border-blue-400 dark:hover:bg-blue-950/20 cursor-pointer transition-colors">
                  <UploadCloud size={24} className="text-blue-600 mb-1" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {uploadingImage ? 'Subiendo imagen...' : 'Cargar foto del premio o fondo'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG o WEBP hasta 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFile}
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>

            <div>
              <label htmlFor="description" className="label">
                Términos o Descripción (Opcional)
              </label>
              <textarea
                id="description"
                name="description"
                className="input min-h-[64px]"
                placeholder="Detalles sobre entregas, fechas límite..."
                value={form.description}
                onChange={handleChange}
                rows={2}
              />
            </div>

            <div>
              <label htmlFor="drawDate" className="label">
                Fecha y Hora del Sorteo (Opcional)
              </label>
              <input
                id="drawDate"
                name="drawDate"
                type="datetime-local"
                className="input font-medium"
                value={form.drawDate || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Bloque 2: Números y Costos */}
          <div className="space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <DollarSign size={14} />
              <span>Cuadrícula y Emisión de Boletos</span>
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="totalTickets" className="label">
                  Cantidad de Números *
                </label>
                <input
                  id="totalTickets"
                  name="totalTickets"
                  type="number"
                  className="input font-bold"
                  value={form.totalTickets}
                  onChange={handleChange}
                  min={1}
                  max={10000}
                  required
                />
              </div>

              <div>
                <label htmlFor="pricePerTicket" className="label">
                  Precio por Boleto *
                </label>
                <div className="relative">
                  <input
                    id="pricePerTicket"
                    type="text"
                    className="input font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 pr-12"
                    placeholder="10,000"
                    value={
                      form.pricePerTicket
                        ? new Intl.NumberFormat('es-CO').format(Number(form.pricePerTicket))
                        : ''
                    }
                    onChange={handlePriceChange}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    COP
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startNumber" className="label">
                  Número de Inicio
                </label>
                <input
                  id="startNumber"
                  name="startNumber"
                  type="number"
                  className="input font-bold"
                  value={form.startNumber}
                  onChange={handleChange}
                  min={0}
                />
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="zeroPad"
                    checked={form.zeroPad}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Relleno con ceros (01, 02...)
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="lotteryMethod" className="label">
                Método o Lotería de Referencia (Opcional)
              </label>
              <input
                id="lotteryMethod"
                name="lotteryMethod"
                type="text"
                className="input"
                placeholder="Ej. Lotería de Boyacá / Sorteo Nocturno"
                value={form.lotteryMethod}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Bloque 3: Cobro y Contacto */}
          <div className="space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <CreditCard size={14} />
              <span>Instrucciones de Cobro y Atención</span>
            </h2>

            <div>
              <label htmlFor="paymentInfo" className="label">
                Datos Bancarios / Cuenta
              </label>
              <textarea
                id="paymentInfo"
                name="paymentInfo"
                className="input min-h-[64px]"
                placeholder="Ej. Transferencia Nequi / Daviplata: 3102128326..."
                value={form.paymentInfo}
                onChange={handleChange}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="contactInfo" className="label">
                  Responsable
                </label>
                <input
                  id="contactInfo"
                  name="contactInfo"
                  type="text"
                  className="input font-medium"
                  placeholder="Ej. Edwin Ducuara"
                  value={form.contactInfo}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="contactPhone" className="label">
                  Teléfono WhatsApp
                </label>
                <input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  className="input font-mono"
                  placeholder="Ej. 3102128326"
                  value={form.contactPhone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Bloque 4: Estado Inicial */}
          <div className="space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Palette size={14} />
              <span>Estado de Publicación</span>
            </h2>

            <div>
              <label htmlFor="status" className="label">
                Visibilidad Inicial
              </label>
              <select
                id="status"
                name="status"
                className="input font-semibold"
                value={form.status}
                onChange={handleChange}
              >
                <option value="ACTIVE">Activa (Publicada con enlace público)</option>
                <option value="DRAFT">Borrador (Privada)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
            <button
              type="submit"
              className="btn-primary flex-1 py-2.5 font-bold"
              disabled={loading || uploadingImage}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Emitiendo números...</span>
                </span>
              ) : (
                <>
                  <Save size={16} />
                  <span>Crear y Emitir Rifa</span>
                </>
              )}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
