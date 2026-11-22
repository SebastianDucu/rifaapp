import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

export default function EditRafflePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState<Partial<CreateRaffleData>>({});

  useEffect(() => {
    const loadRaffle = async () => {
      if (!id) return;
      try {
        const raffle = await raffleApi.getById(id);
        setForm({
          name: raffle.name,
          description: raffle.description,
          prize: raffle.prize,
          prizeImageUrl: raffle.prizeImageUrl,
          drawDate: raffle.drawDate ? raffle.drawDate.slice(0, 16) : '',
          pricePerTicket: raffle.pricePerTicket,
          totalTickets: raffle.totalTickets,
          startNumber: raffle.startNumber,
          zeroPad: raffle.zeroPad,
          lotteryMethod: raffle.lotteryMethod,
          paymentInfo: raffle.paymentInfo,
          contactInfo: raffle.contactInfo,
          contactPhone: raffle.contactPhone,
          primaryColor: raffle.primaryColor,
          logoUrl: raffle.logoUrl,
          template: raffle.template,
          status: raffle.status,
        });
      } catch {
        toast.error('Error al sincronizar rifa');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadRaffle();
  }, [id, navigate]);

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
    const rawVal = e.target.value.replace(/\D/g, '');
    const num = rawVal === '' ? 0 : parseInt(rawVal, 10);
    setForm((prev) => ({ ...prev, pricePerTicket: num }));
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido');
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
    if (!id) return;
    setSaving(true);

    try {
      const payload = {
        ...form,
        name: form.name?.trim(),
        prize: form.prize?.trim(),
        description: form.description?.trim() || '',
        pricePerTicket: Number(form.pricePerTicket) > 0 ? Number(form.pricePerTicket) : 10000,
        drawDate: form.drawDate && form.drawDate.trim() !== '' ? form.drawDate : null,
        lotteryMethod: form.lotteryMethod?.trim() || '',
        paymentInfo: form.paymentInfo?.trim() || '',
        contactInfo: form.contactInfo?.trim() || '',
        contactPhone: form.contactPhone?.trim() || '',
        prizeImageUrl: form.prizeImageUrl || null,
      };

      await raffleApi.update(id, payload);
      toast.success('Rifa actualizada correctamente');
      navigate(`/raffles/${id}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cargando datos...
          </span>
        </div>
      </div>
    );
  }

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
            Configuración
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
            Modificar Rifa
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Layers size={14} />
              <span>Información General</span>
            </h2>

            <div>
              <label className="label">Título de la Rifa</label>
              <input
                name="name"
                type="text"
                className="input font-semibold"
                value={form.name || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="label">Premio Principal</label>
              <input
                name="prize"
                type="text"
                className="input font-semibold"
                value={form.prize || ''}
                onChange={handleChange}
                required
              />
            </div>

            {/* Subir foto del premio */}
            <div>
              <label className="label">Foto o Afiche del Premio</label>
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
              <label className="label">Descripción</label>
              <textarea
                name="description"
                className="input min-h-[64px]"
                value={form.description || ''}
                onChange={handleChange}
                rows={2}
              />
            </div>

            <div>
              <label className="label">Fecha y Hora del Sorteo</label>
              <input
                name="drawDate"
                type="datetime-local"
                className="input font-medium"
                value={form.drawDate || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <DollarSign size={14} />
              <span>Precio y Estado</span>
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Precio por Boleto</label>
                <div className="relative">
                  <input
                    type="text"
                    className="input font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 pr-12"
                    value={
                      form.pricePerTicket
                        ? new Intl.NumberFormat('es-CO').format(Number(form.pricePerTicket))
                        : ''
                    }
                    onChange={handlePriceChange}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    COP
                  </span>
                </div>
              </div>

              <div>
                <label className="label">Estado de la Rifa</label>
                <select
                  name="status"
                  className="input font-semibold"
                  value={form.status || 'DRAFT'}
                  onChange={handleChange}
                >
                  <option value="DRAFT">Borrador</option>
                  <option value="ACTIVE">Activa</option>
                  <option value="FINISHED">Finalizada</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Método o Sorteo Asociado</label>
              <input
                name="lotteryMethod"
                type="text"
                className="input"
                value={form.lotteryMethod || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <CreditCard size={14} />
              <span>Instrucciones de Cobro y Atención</span>
            </h2>

            <div>
              <label className="label">Datos de Pago</label>
              <textarea
                name="paymentInfo"
                className="input min-h-[60px]"
                value={form.paymentInfo || ''}
                onChange={handleChange}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Responsable</label>
                <input
                  name="contactInfo"
                  type="text"
                  className="input font-medium"
                  value={form.contactInfo || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input
                  name="contactPhone"
                  type="tel"
                  className="input font-mono"
                  value={form.contactPhone || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
            <button
              type="submit"
              className="btn-primary flex-1 py-2.5 font-bold"
              disabled={saving || uploadingImage}
            >
              {saving ? (
                'Guardando...'
              ) : (
                <>
                  <Save size={16} />
                  <span>Guardar Cambios</span>
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
