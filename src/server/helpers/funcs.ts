export function isSystemOrEmptyMessage(msg: any): boolean {
  const systemTypes = new Set([
    'e2e_notification',
    'notification',
    'protocol',
    'ciphertext',      
    'revoked'          
  ]);

  const isHistory = Boolean(msg.isMdHistoryMsg || msg._data?.isMdHistoryMsg);

  const hasBody = typeof msg.body === 'string' && msg.body.trim().length > 0;
  const hasAnyMedia = Boolean(msg.hasMedia);

  return isHistory || systemTypes.has(msg.type) || (!hasBody && !hasAnyMedia);
}

export function extractConversationText(record: EvolutionFindMessagesResponse["messages"]["records"][number]): string {
  // Según tu doc: el contenido suele estar en message.conversation
  // Pero a veces puede venir en otros tipos; lo cubrimos por seguridad.
  return (
    record?.message?.conversation ??
    record?.message?.extendedTextMessage?.text ??
    record?.message?.imageMessage?.caption ??
    record?.message?.videoMessage?.caption ??
    record?.message?.documentMessage?.caption ??
    ""
  );
}