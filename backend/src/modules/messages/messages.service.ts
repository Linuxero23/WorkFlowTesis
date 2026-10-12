import { connectDatabase } from '../../config/database';
import { HttpError } from '../shared/academic';
import { groupConversation, sendConversationMessage } from '../conversations/conversations.service';

async function projectGroup(projectId: number, userId: number) {
  const pool = await connectDatabase();
  const result = await pool.request().input('projectId', projectId).input('userId', userId).query(`
    SELECT TOP 1 g.id_grupo
    FROM Proyectos p
    JOIN GruposTrabajo g ON g.id_proyecto = p.id_proyecto AND g.activo = 1
    WHERE p.id_proyecto = @projectId
      AND (
        g.id_profesor = @userId
        OR EXISTS (
          SELECT 1
          FROM GrupoEstudiantes ge
          WHERE ge.id_grupo = g.id_grupo AND ge.id_estudiante = @userId
        )
      )
    ORDER BY g.id_grupo
  `);
  if (!result.recordset[0]) throw new HttpError(403, 'No tienes un grupo activo asignado para este proyecto');
  return result.recordset[0].id_grupo as number;
}

export async function listMessages(projectId: number, userId: number) {
  const groupId = await projectGroup(projectId, userId);
  return groupConversation(groupId, userId);
}

export async function sendMessage(projectId: number, userId: number, input: { receptor?: number; mensaje?: string; file?: { filename: string } }) {
  const groupId = await projectGroup(projectId, userId);
  const conversation = await groupConversation(groupId, userId);
  return sendConversationMessage(conversation.conversation.id_conversacion, userId, input.mensaje, input.file ? `/uploads/${input.file.filename}` : undefined);
}

export async function readMessage(messageId: number, userId: number) {
  const pool = await connectDatabase();
  const result = await pool.request().input('messageId', messageId).input('userId', userId).query(`UPDATE m SET leido = 1, fecha_lectura = GETDATE() OUTPUT INSERTED.* FROM Mensajes m JOIN ConversacionParticipantes cp ON cp.id_conversacion = m.id_conversacion WHERE m.id_mensaje = @messageId AND cp.id_usuario = @userId AND cp.activo = 1`);
  if (!result.recordset[0]) throw new HttpError(404, 'Mensaje no encontrado');
  return result.recordset[0];
}
