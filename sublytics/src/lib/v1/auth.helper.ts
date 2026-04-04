import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long'
);

export async function generateAuthToken(payload: {
  company_id: string;
}): Promise<string> {
  return new SignJWT({ ...payload, type: 'v1_api' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30m')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyAuthToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== 'v1_api') {
      return { error: 'Invalid token type' };
    }

    return {
      data: {
        company_id: payload.company_id as string,
      },
    };
  } catch {
    return { error: 'Invalid or expired token' };
  }
}

export async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.slice(7);
  return verifyAuthToken(token);
}
