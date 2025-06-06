// app/api/admin/outlets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { adminOnly } from '@/lib/auth/adminOnly'; // Ny import
import { User } from '@supabase/supabase-js'; // Importer User type

// Separat handler-funksjon for GET
async function getOutletsHandler(request: NextRequest, context: {}, user: User) {
  const supabase = createSupabaseServerClient();
  // Autentisering og rolle-sjekk er allerede gjort av adminOnly

  try {
    const { data, error } = await supabase
      .from('outlets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching outlets:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error fetching outlets:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// Separat handler-funksjon for POST
async function createOutletHandler(request: NextRequest, context: {}, user: User) {
  const supabase = createSupabaseServerClient();
  // Autentisering og rolle-sjekk er allerede gjort av adminOnly

  try {
    const outletData = await request.json();

    // Validering
    if (!outletData.name || typeof outletData.name !== 'string' || outletData.name.trim() === '') {
      return NextResponse.json({ error: 'Name is required and must be a non-empty string.' }, { status: 400 });
    }
    if (outletData.address && typeof outletData.address !== 'string') {
      return NextResponse.json({ error: 'Address must be a string if provided.' }, { status: 400 });
    }
    if (outletData.latitude !== undefined && typeof outletData.latitude !== 'number') {
      return NextResponse.json({ error: 'Latitude must be a number if provided.' }, { status: 400 });
    }
    if (outletData.longitude !== undefined && typeof outletData.longitude !== 'number') {
      return NextResponse.json({ error: 'Longitude must be a number if provided.' }, { status: 400 });
    }
    if (outletData.is_active !== undefined && typeof outletData.is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active must be a boolean if provided.' }, { status: 400 });
    }

    const insertData: any = {
      name: outletData.name.trim(),
      address: outletData.address ? outletData.address.trim() : null,
      latitude: outletData.latitude,
      longitude: outletData.longitude,
      is_active: outletData.is_active === undefined ? true : outletData.is_active,
      // Optional: Legg til user.id for å spore hvem som opprettet utsalgsstedet
      // created_by: user.id,
    };

    const { data, error } = await supabase
      .from('outlets')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating outlet:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Unexpected error creating outlet:', err);
    if (err instanceof SyntaxError && err.message.includes('JSON')) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// Eksporter de innpakkede handlerne
export const GET = adminOnly(getOutletsHandler);
export const POST = adminOnly(createOutletHandler);
