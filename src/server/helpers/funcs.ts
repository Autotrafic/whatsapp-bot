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