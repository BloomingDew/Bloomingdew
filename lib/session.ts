// Generates and persists a unique session ID for anonymous cart tracking
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let sessionId = localStorage.getItem('bd_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('bd_session_id', sessionId);
  }
  return sessionId;
}
