import { useEffect, useState } from 'react';
import { Download, Eye, X } from 'lucide-react';
import { User } from '../types';
import { API_URL } from '../utils/api';

interface DeliveryFileProps {
  deliveryId: number;
  fileName: string;
  user: User;
}

function canPreview(fileName: string) {
  return /\.(pdf|png|jpe?g)$/i.test(fileName);
}

async function fetchFile(user: User, deliveryId: number, preview: boolean) {
  if (!user.token) throw new Error('La sesión expiró. Inicia sesión nuevamente.');
  const response = await fetch(`${API_URL}/files/deliveries/${deliveryId}${preview ? '?preview=1' : ''}`, {
    headers: { Authorization: `Bearer ${user.token}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'No se pudo obtener el archivo');
  }
  return response.blob();
}

export function DeliveryFile({ deliveryId, fileName, user }: DeliveryFileProps) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const previewable = canPreview(fileName);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const openPreview = async () => {
    setError('');
    setLoading(true);
    try {
      const blob = await fetchFile(user, deliveryId, true);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'No se pudo abrir la vista previa');
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    setError('');
    setLoading(true);
    try {
      const blob = await fetchFile(user, deliveryId, false);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'No se pudo descargar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  };

  return <>
    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
      <span className="break-all">Archivo: {fileName}</span>
      {previewable && <button type="button" disabled={loading} onClick={() => void openPreview()} className="inline-flex items-center gap-1 text-primary underline disabled:opacity-50">
        <Eye className="h-4 w-4" />{loading ? 'Cargando...' : 'Vista previa'}
      </button>}
      <button type="button" disabled={loading} onClick={() => void download()} className="inline-flex items-center gap-1 text-primary underline disabled:opacity-50">
        <Download className="h-4 w-4" />Descargar
      </button>
    </div>
    {error && <p role="alert" className="mt-1 text-xs text-error">{error}</p>}
    {previewUrl && <div role="dialog" aria-modal="true" aria-label={`Vista previa de ${fileName}`} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="truncate font-semibold">{fileName}</h2>
          <button type="button" onClick={closePreview} aria-label="Cerrar vista previa" className="rounded p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        {fileName.toLowerCase().endsWith('.pdf')
          ? <iframe title={`Vista previa de ${fileName}`} src={previewUrl} className="min-h-0 flex-1" />
          : <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-gray-100 p-4"><img src={previewUrl} alt={fileName} className="max-h-full max-w-full object-contain" /></div>}
      </div>
    </div>}
  </>;
}
