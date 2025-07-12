/**
 * Format timestamp for chat messages with modern, relative time display
 */
export function formatChatTimestamp(date: Date | string | undefined): string {
  if (!date) return '';
  
  const timestamp = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
  
  // Just now (< 30 seconds)
  if (diffInSeconds < 30) {
    return 'Just now';
  }
  
  // Less than 1 minute
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }
  
  // Less than 1 hour
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  // Less than 24 hours
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  // Less than 7 days
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  // Same year
  if (timestamp.getFullYear() === now.getFullYear()) {
    return timestamp.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
  
  // Different year
  return timestamp.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format timestamp for tooltip with full date and time
 */
export function formatFullTimestamp(date: Date | string | undefined): string {
  if (!date) return '';
  
  const timestamp = typeof date === 'string' ? new Date(date) : date;
  
  return timestamp.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}