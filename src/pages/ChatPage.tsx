import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, MessageSquare, Paperclip, Send } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ConversationSummary, Message } from '../types';
import { apiFetch, API_URL } from '../utils/api';

interface ConversationResponse { conversation: { nombre: string; tipo: string }; messages: Array<Message & { emisor_nombre?: string }>; }

export function ChatPage() {
  const user = useStore(state => state.user);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selected, setSelected] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<ConversationResponse['messages']>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [mobileChat, setMobileChat] = useState(false);

  const loadConversations = async () => {
    if (!user?.token) return;
    try {
      const rows = await apiFetch<ConversationSummary[]>(`/conversations/user/${user.id}`, user);
      setConversations(rows);
      setSelected(current => current ? rows.find(row => row.id_conversacion === current.id_conversacion) || current : rows[0] || null);
      setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las conversaciones'); }
  };
  const loadMessages = async () => {
    if (!user || !selected) return;
    try { const result = await apiFetch<ConversationResponse>(`/conversations/${selected.id_conversacion}/messages`, user); setMessages(result.messages); await apiFetch(`/conversations/${selected.id_conversacion}/read`, user, { method: 'PATCH' }); setError(''); } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los mensajes'); }
  };
  useEffect(() => { loadConversations(); const timer = window.setInterval(loadConversations, 5000); return () => window.clearInterval(timer); }, [user]);
  useEffect(() => { loadMessages(); const timer = window.setInterval(loadMessages, 4000); return () => window.clearInterval(timer); }, [user, selected?.id_conversacion]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !selected || (!text.trim() && !file)) return;
    const body = new FormData();
    body.append('mensaje', text);
    if (file) body.append('archivo', file);
    try { await apiFetch(`/conversations/${selected.id_conversacion}/messages`, user, { method: 'POST', body }); setText(''); setFile(null); setError(''); await loadMessages(); await loadConversations(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo enviar el mensaje'); }
  };

  const openAttachment = async (messageId: number) => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/files/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'No se pudo descargar el archivo');
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `mensaje-${messageId}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo descargar el archivo');
    }
  };

  return <div className="page-stack">
    <header className="page-hero"><div className="page-hero-icon"><MessageSquare className="h-6 w-6" /></div><div><p className="page-kicker">Comunicación académica</p><h1 className="page-title">Conversaciones</h1><p className="mt-2 text-sm text-white/75">Mensajes directos y espacios grupales de tus proyectos.</p></div></header>
    <div className="surface-card flex min-h-[calc(100vh-18rem)] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm md:flex-row">
      <aside className={`w-full border-b border-border bg-slate-50/90 md:block md:w-80 md:shrink-0 md:border-b-0 md:border-r ${selected && mobileChat ? 'hidden' : 'block'}`}>
        <div className="border-b border-border p-5"><p className="text-xs font-semibold uppercase tracking-wider text-primary">Bandeja</p><p className="mt-1 text-sm text-text-muted">{conversations.length} conversaciones</p></div>
        <div className="max-h-[35vh] divide-y divide-border overflow-y-auto md:max-h-[calc(100vh-23rem)]">{conversations.map(conversation => <button key={conversation.id_conversacion} onClick={() => { setSelected(conversation); setMobileChat(true); }} className={`w-full p-4 text-left ${selected?.id_conversacion === conversation.id_conversacion ? 'bg-primary/10' : 'hover:bg-white'}`}><div className="flex items-center gap-3"><MessageSquare className="h-5 w-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{conversation.nombre}</p><p className="truncate text-xs text-text-muted">{conversation.tipo === 'GRUPO' ? 'Grupo' : 'Directo'} · {conversation.ultimo_mensaje || 'Sin mensajes'}</p></div>{conversation.no_leidos > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">{conversation.no_leidos}</span>}</div></button>)}</div>
      </aside>
      <main className={`flex min-h-[55vh] min-w-0 flex-1 flex-col ${mobileChat ? 'flex' : selected ? 'hidden md:flex' : 'flex'}`}>
        {selected ? <><header className="flex items-center gap-3 border-b border-border p-4 sm:p-5"><button type="button" onClick={() => setMobileChat(false)} aria-label="Volver a conversaciones" className="action-button rounded-lg border border-border p-2 text-text-secondary md:hidden"><ArrowLeft className="h-4 w-4" /></button><div><h2 className="font-bold text-text-primary">{selected.nombre}</h2><p className="text-xs text-text-muted">Conversación {selected.tipo === 'GRUPO' ? 'grupal' : 'directa'}</p></div></header><div className="flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(160deg,#f5f9fc,#eef4f8)] p-4 sm:p-5">{messages.map(item => <div key={item.id_mensaje} className={`max-w-[88%] rounded-2xl p-3 text-sm sm:max-w-[78%] ${item.id_emisor === Number(user?.id) ? 'ml-auto rounded-br-md bg-primary text-white shadow-sm' : 'rounded-bl-md border border-border/70 bg-white text-text-primary shadow-sm'}`}><p className="text-[11px] font-semibold opacity-70">{item.emisor_nombre || (item.id_emisor === Number(user?.id) ? 'Tú' : 'Participante')}</p><p className="mt-1 break-words">{item.mensaje || 'Archivo adjunto'}</p>{item.archivo_url && <button type="button" className="mt-2 block underline" onClick={() => openAttachment(item.id_mensaje)}>Abrir archivo</button>}<p className="mt-1 text-[10px] opacity-60">{new Date(item.fecha_creacion).toLocaleString()}</p></div>)}</div><form onSubmit={send} className="border-t border-border bg-white p-3 sm:p-4"><div className="flex items-center gap-2"><label className="cursor-pointer rounded-xl p-2 text-text-muted hover:bg-slate-100" title="Adjuntar archivo"><Paperclip className="h-5 w-5" /><input type="file" className="hidden" accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg" onChange={event => setFile(event.target.files?.[0] || null)} /></label><input value={text} onChange={event => setText(event.target.value)} placeholder={file ? file.name : 'Escribe un mensaje'} className="min-w-0 flex-1 rounded-xl border border-border px-3 py-2.5 text-sm" /><button className="action-button rounded-xl bg-primary p-2.5 text-white hover:bg-primary-dark" aria-label="Enviar mensaje"><Send className="h-4 w-4" /></button></div></form></> : <div className="flex flex-1 flex-col items-center justify-center text-center text-text-muted"><MessageSquare className="h-12 w-12 text-primary/40" /><p className="mt-3">Selecciona una conversación</p></div>}
        {error && <p role="alert" className="border-t border-red-200 bg-red-50 p-3 text-center text-xs text-red-700">{error}</p>}
      </main>
    </div>
  </div>;
}
