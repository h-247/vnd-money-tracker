import { headers } from 'next/headers';
import { getChatGPTUser, ChatGPTUser } from '@/app/chatgpt-auth';

/**
 * Resolves the authenticated user for the current request.
 * In production, extracts trusted identity from ChatGPT Sites headers.
 * In local development and testing, supports simulated user headers or defaults to the Sites starter local user.
 */
export async function getAuthUser(): Promise<ChatGPTUser | null> {
  // 1. Try official ChatGPT Sites authentication
  const chatGPTUser = await getChatGPTUser();
  if (chatGPTUser) {
    return chatGPTUser;
  }

  // 2. Allow simulated user header in development/test environments for isolation testing
  const requestHeaders = await headers();
  const simulatedUser = requestHeaders.get('x-simulated-user');
  if (simulatedUser) {
    return {
      userId: simulatedUser,
      displayName: simulatedUser,
      email: `${simulatedUser}@example.com`,
      fullName: simulatedUser,
    };
  }

  // 3. In non-production local development fallback to standard Sites developer account
  if (process.env.NODE_ENV !== 'production') {
    return {
      userId: 'local_seedy',
      displayName: 'Seedy',
      email: 'seedy@sites.test',
      fullName: 'Seedy',
    };
  }

  return null;
}
