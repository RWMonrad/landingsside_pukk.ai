// lib/auth/adminOnly.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserWithRole } from '@/lib/supabase/server'; // Sjekk at denne stien er korrekt relativt til din struktur
import type { User } from '@supabase/supabase-js'; // Importer User for typehinting

// Definerer typen for en API handler som mottar brukerobjektet
type AuthenticatedApiHandler = (
  request: NextRequest,
  context: { params?: any }, // Gjort params valgfri for generell bruk
  user: User // Supabase User objekt
) => Promise<NextResponse>;

export function adminOnly(handler: AuthenticatedApiHandler) {
  return async (request: NextRequest, context: { params?: any } = {}) => { // Satt default for context
    const { user, role, error: userRoleError } = await getAuthenticatedUserWithRole();

    if (userRoleError || !user) {
      console.error('RBAC: Authentication error or no user:', userRoleError?.message);
      return NextResponse.json({ error: 'Unauthorized: Valid session required.' }, { status: 401 });
    }

    // Sjekk om brukeren har 'admin'-rollen
    // Du kan utvide dette til en liste: ['admin', 'superadmin'].includes(role)
    if (role !== 'admin') { // Sørg for at 'admin' er rollenavnet du bruker
      console.warn(`RBAC: User ${user.id} with role '${role || 'undefined'}' attempted to access admin-only route ${request.nextUrl.pathname}.`);
      return NextResponse.json({ error: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    // Bruker er autentisert og har admin-rolle
    return handler(request, context, user); // Send brukerobjektet videre til handleren
  };
}
