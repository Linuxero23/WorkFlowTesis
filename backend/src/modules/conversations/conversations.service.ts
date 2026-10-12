import sql from 'mssql';
import { connectDatabase } from '../../config/database';
import { HttpError } from '../shared/academic';

async function isParticipant(conversationId: number, userId: number) {
  const pool = await connectDatabase();
  const result = await pool.request().input('conversationId', conversationId).input('userId', userId).query(`
    SELECT c.id_conversacion, c.tipo, c.id_grupo, c.nombre
    FROM Conversaciones c JOIN ConversacionParticipantes cp ON cp.id_conversacion = c.id_conversacion
    WHERE c.id_conversacion = @conversationId AND cp.id_usuario = @userId AND cp.activo = 1 AND c.activo = 1
  `);
  if (!result.recordset[0]) throw new HttpError(403, 'No participas en esta conversación');
  return result.recordset[0];
}

export async function createGroupConversation(transaction: sql.Transaction, groupId: number, name: string, participantIds: number[]) {
  const created = await transaction.request().input('type', 'GRUPO').input('groupId', groupId).input('name', `Chat · ${name}`).query(`
    INSERT INTO Conversaciones (tipo, id_grupo, nombre) OUTPUT INSERTED.id_conversacion VALUES (@type, @groupId, @name)
  `);
  const conversationId = created.recordset[0].id_conversacion as number;
  for (const userId of participantIds) {
    await transaction.request().input('conversationId', conversationId).input('userId', userId).query(`INSERT INTO ConversacionParticipantes (id_conversacion, id_usuario) VALUES (@conversationId, @userId)`);
  }
  const tutorId = participantIds[0];
  for (const studentId of participantIds.slice(1)) {
    await ensureDirectConversation(transaction, tutorId, studentId);
  }
  return conversationId;
}

async function ensureDirectConversation(transaction: sql.Transaction, userId: number, otherUserId: number) {
  const existing = await transaction.request().input('userId', userId).input('otherUserId', otherUserId).query(`
    SELECT TOP 1 c.id_conversacion FROM Conversaciones c
    JOIN ConversacionParticipantes a ON a.id_conversacion = c.id_conversacion AND a.id_usuario = @userId AND a.activo = 1
    JOIN ConversacionParticipantes b ON b.id_conversacion = c.id_conversacion AND b.id_usuario = @otherUserId AND b.activo = 1
    WHERE c.tipo = 'DIRECTA' AND c.activo = 1
  `);
  if (existing.recordset[0]) return existing.recordset[0].id_conversacion as number;
  const created = await transaction.request().input('type', 'DIRECTA').query("INSERT INTO Conversaciones (tipo, nombre) OUTPUT INSERTED.id_conversacion VALUES (@type, 'Conversación directa')");
  const conversationId = created.recordset[0].id_conversacion as number;
  for (const id of [userId, otherUserId]) await transaction.request().input('conversationId', conversationId).input('userId', id).query('INSERT INTO ConversacionParticipantes (id_conversacion, id_usuario) VALUES (@conversationId, @userId)');
  return conversationId;
}

export async function ensureDirectForUsers(userId: number, otherUserId: number) {
  const pool = await connectDatabase();
  const transaction = pool.transaction();
  await transaction.begin();
  try { const conversationId = await ensureDirectConversation(transaction, userId, otherUserId); await transaction.commit(); return conversationId; } catch (error) { await transaction.rollback(); throw error; }
}

export async function syncGroupParticipant(groupId: number, userId: number, active: boolean) {
  const pool = await connectDatabase();
  await pool.request().input('groupId', groupId).input('userId', userId).input('active', active).query(`
    UPDATE cp SET activo = @active
    FROM ConversacionParticipantes cp JOIN Conversaciones c ON c.id_conversacion = cp.id_conversacion
    WHERE c.id_grupo = @groupId AND c.tipo = 'GRUPO' AND cp.id_usuario = @userId;
    IF @active = 1 AND NOT EXISTS (
      SELECT 1 FROM ConversacionParticipantes cp JOIN Conversaciones c ON c.id_conversacion = cp.id_conversacion
      WHERE c.id_grupo = @groupId AND c.tipo = 'GRUPO' AND cp.id_usuario = @userId
    )
    BEGIN
      INSERT INTO ConversacionParticipantes (id_conversacion, id_usuario)
      SELECT TOP 1 c.id_conversacion, @userId FROM Conversaciones c WHERE c.id_grupo = @groupId AND c.tipo = 'GRUPO' AND c.activo = 1;
    END
  `);
}

export async function syncGroupTutor(groupId: number, oldTutorId: number, newTutorId: number) {
  await syncGroupParticipant(groupId, oldTutorId, false);
  await syncGroupParticipant(groupId, newTutorId, true);
}

export async function listUserConversations(userId: number) {
  const pool = await connectDatabase();
  const result = await pool.request().input('userId', userId).query(`
    SELECT c.id_conversacion, c.tipo, c.id_grupo, c.nombre, c.fecha_creacion,
      (SELECT TOP 1 m.mensaje FROM Mensajes m WHERE m.id_conversacion = c.id_conversacion ORDER BY m.fecha_creacion DESC) AS ultimo_mensaje,
      (SELECT MAX(m.fecha_creacion) FROM Mensajes m WHERE m.id_conversacion = c.id_conversacion) AS fecha_ultimo_mensaje,
      (SELECT COUNT(*) FROM Mensajes m WHERE m.id_conversacion = c.id_conversacion AND m.id_emisor <> @userId AND m.fecha_creacion > ISNULL(cp.ultima_lectura, '19000101')) AS no_leidos
    FROM Conversaciones c JOIN ConversacionParticipantes cp ON cp.id_conversacion = c.id_conversacion
    WHERE cp.id_usuario = @userId AND cp.activo = 1 AND c.activo = 1
    ORDER BY ISNULL((SELECT MAX(m.fecha_creacion) FROM Mensajes m WHERE m.id_conversacion = c.id_conversacion), c.fecha_creacion) DESC
  `);
  return result.recordset;
}

export async function groupConversation(groupId: number, userId: number) {
  const pool = await connectDatabase();
  const transaction = pool.transaction();
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

  let conversationId: number;
  try {
    const group = await transaction.request().input('groupId', groupId).input('userId', userId).query(`
      SELECT g.id_grupo, g.nombre, g.id_profesor
      FROM GruposTrabajo g WITH (UPDLOCK, HOLDLOCK)
      WHERE g.id_grupo = @groupId AND g.activo = 1
        AND (
          g.id_profesor = @userId
          OR EXISTS (
            SELECT 1 FROM GrupoEstudiantes ge
            WHERE ge.id_grupo = g.id_grupo AND ge.id_estudiante = @userId
          )
        )
    `);
    if (!group.recordset[0]) throw new HttpError(403, 'No tienes acceso al chat del grupo');

    const students = await transaction.request().input('groupId', groupId).query(`
      SELECT ge.id_estudiante
      FROM GrupoEstudiantes ge
      JOIN Usuarios u ON u.id_usuario = ge.id_estudiante AND u.activo = 1
      WHERE ge.id_grupo = @groupId
    `);
    const participantIds = [...new Set([
      group.recordset[0].id_profesor as number,
      ...students.recordset.map(student => student.id_estudiante as number),
    ])];

    const existing = await transaction.request().input('groupId', groupId).query(`
      SELECT TOP 1 id_conversacion FROM Conversaciones WITH (UPDLOCK, HOLDLOCK)
      WHERE id_grupo = @groupId AND tipo = 'GRUPO' AND activo = 1
    `);
    conversationId = existing.recordset[0]?.id_conversacion as number;
    if (!conversationId) {
      const created = await transaction.request().input('groupId', groupId)
        .input('name', `Chat · ${group.recordset[0].nombre}`)
        .query(`
          INSERT INTO Conversaciones (tipo, id_grupo, nombre)
          OUTPUT INSERTED.id_conversacion
          VALUES ('GRUPO', @groupId, @name)
        `);
      conversationId = created.recordset[0].id_conversacion as number;
    }

    const participantRequest = transaction.request().input('conversationId', conversationId);
    participantIds.forEach((id, index) => participantRequest.input(`participant${index}`, id));
    await participantRequest.query(`
      UPDATE cp SET activo = 0
      FROM ConversacionParticipantes cp
      WHERE cp.id_conversacion = @conversationId
        AND cp.id_usuario NOT IN (${participantIds.map((_, index) => `@participant${index}`).join(', ')})
    `);

    for (const participantId of participantIds) {
      await transaction.request().input('conversationId', conversationId).input('userId', participantId).query(`
        UPDATE ConversacionParticipantes
        SET activo = 1
        WHERE id_conversacion = @conversationId AND id_usuario = @userId;
        IF @@ROWCOUNT = 0
          INSERT INTO ConversacionParticipantes (id_conversacion, id_usuario)
          VALUES (@conversationId, @userId);
      `);
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return getConversationMessages(conversationId, userId);
}

export async function getConversationMessages(conversationId: number, userId: number) {
  const conversation = await isParticipant(conversationId, userId);
  const pool = await connectDatabase();
  const messages = await pool.request().input('conversationId', conversationId).query(`
    SELECT m.*, CONCAT(u.nombre, ' ', u.apellido) AS emisor_nombre
    FROM Mensajes m JOIN Usuarios u ON u.id_usuario = m.id_emisor
    WHERE m.id_conversacion = @conversationId ORDER BY m.fecha_creacion ASC
  `);
  return { conversation, messages: messages.recordset };
}

export async function getOrCreateDirect(userId: number, otherUserId: number) {
  if (userId === otherUserId) throw new HttpError(400, 'No puedes iniciar una conversación contigo mismo');
  const pool = await connectDatabase();
  const relation = await pool.request().input('userId', userId).input('otherUserId', otherUserId).query(`
    SELECT TOP 1 g.id_grupo FROM GruposTrabajo g JOIN GrupoEstudiantes ge ON ge.id_grupo = g.id_grupo
    WHERE g.activo = 1 AND ((g.id_profesor = @userId AND ge.id_estudiante = @otherUserId) OR (g.id_profesor = @otherUserId AND ge.id_estudiante = @userId))
  `);
  if (!relation.recordset[0]) throw new HttpError(403, 'No existe una relación activa entre estos usuarios');
  const existing = await pool.request().input('userId', userId).input('otherUserId', otherUserId).query(`
    SELECT TOP 1 c.id_conversacion FROM Conversaciones c
    JOIN ConversacionParticipantes a ON a.id_conversacion = c.id_conversacion AND a.id_usuario = @userId AND a.activo = 1
    JOIN ConversacionParticipantes b ON b.id_conversacion = c.id_conversacion AND b.id_usuario = @otherUserId AND b.activo = 1
    WHERE c.tipo = 'DIRECTA' AND c.activo = 1
  `);
  if (existing.recordset[0]) return getConversationMessages(existing.recordset[0].id_conversacion, userId);
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const created = await transaction.request().input('type', 'DIRECTA').query("INSERT INTO Conversaciones (tipo, nombre) OUTPUT INSERTED.id_conversacion VALUES (@type, 'Conversación directa')");
    const conversationId = created.recordset[0].id_conversacion as number;
    for (const id of [userId, otherUserId]) await transaction.request().input('conversationId', conversationId).input('userId', id).query('INSERT INTO ConversacionParticipantes (id_conversacion, id_usuario) VALUES (@conversationId, @userId)');
    await transaction.commit();
    return getConversationMessages(conversationId, userId);
  } catch (error) { await transaction.rollback(); throw error; }
}

export async function sendConversationMessage(conversationId: number, userId: number, message: string | undefined, fileUrl?: string) {
  await isParticipant(conversationId, userId);
  if (!message?.trim() && !fileUrl) throw new HttpError(400, 'El mensaje debe incluir texto o archivo');
  const pool = await connectDatabase();
  const result = await pool.request().input('conversationId', conversationId).input('sender', userId).input('message', message?.trim() || null).input('fileUrl', fileUrl || null).query(`INSERT INTO Mensajes (id_conversacion, id_emisor, mensaje, archivo_url) OUTPUT INSERTED.* VALUES (@conversationId, @sender, @message, @fileUrl)`);
  return result.recordset[0];
}

export async function markConversationRead(conversationId: number, userId: number) {
  await isParticipant(conversationId, userId);
  const pool = await connectDatabase();
  await pool.request().input('conversationId', conversationId).input('userId', userId).query('UPDATE ConversacionParticipantes SET ultima_lectura = GETDATE() WHERE id_conversacion = @conversationId AND id_usuario = @userId');
  return { success: true };
}
