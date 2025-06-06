// app/api/admin/outlets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { adminOnly } from '@/lib/auth/adminOnly'; // Ny import
import { User } from '@supabase/supabase-js'; // Importer User type

interface RouteParams {
  id: string;
}

// Separat handler-funksjon for GET
async function getOutletByIdHandler(
  request: NextRequest,
  { params }: { params: RouteParams },
  user: User // Mottar user-objektet
) {
  const supabase = createSupabaseServerClient();
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Outlet ID is required.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('outlets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Outlet not found.' }, { status: 404 });
      }
      console.error('Error fetching outlet:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
     if (!data) { // Dobbeltsjekk
        return NextResponse.json({ error: 'Outlet not found.' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error fetching outlet:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// Separat handler-funksjon for PUT
async function updateOutletHandler(
  request: NextRequest,
  { params }: { params: RouteParams },
  user: User // Mottar user-objektet
) {
  const supabase = createSupabaseServerClient();
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Outlet ID is required.' }, { status: 400 });
  }

  try {
    const outletData = await request.json();
    const updates: { [key: string]: any } = {};
    let hasUpdates = false;

    // Validering for hvert felt
    if (outletData.name !== undefined) {
      if (typeof outletData.name !== 'string' || outletData.name.trim() === '') {
        return NextResponse.json({ error: 'Name must be a non-empty string.' }, { status: 400 });
      }
      updates.name = outletData.name.trim();
      hasUpdates = true;
    }
    if (outletData.address !== undefined) {
      if (outletData.address !== null && typeof outletData.address !== 'string') {
        return NextResponse.json({ error: 'Address must be a string or null.' }, { status: 400 });
      }
      updates.address = outletData.address ? outletData.address.trim() : null;
      hasUpdates = true;
    }
    if (outletData.latitude !== undefined) {
      if (outletData.latitude !== null && typeof outletData.latitude !== 'number') {
        return NextResponse.json({ error: 'Latitude must be a number or null.' }, { status: 400 });
      }
      updates.latitude = outletData.latitude;
      hasUpdates = true;
    }
    if (outletData.longitude !== undefined) {
      if (outletData.longitude !== null && typeof outletData.longitude !== 'number') {
        return NextResponse.json({ error: 'Longitude must be a number or null.' }, { status: 400 });
      }
      updates.longitude = outletData.longitude;
      hasUpdates = true;
    }
    if (outletData.is_active !== undefined) {
      if (typeof outletData.is_active !== 'boolean') {
        return NextResponse.json({ error: 'is_active must be a boolean.' }, { status: 400 });
      }
      updates.is_active = outletData.is_active;
      hasUpdates = true;
    }

    if (!hasUpdates) {
      return NextResponse.json({ error: 'No update fields provided.' }, { status: 400 });
    }

    // Optional: Legg til hvem som sist oppdaterte
    // updates.updated_by = user.id;
    // updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('outlets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Outlet not found to update.' }, { status: 404 });
      }
      console.error('Error updating outlet:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Unexpected error updating outlet:', err);
    if (err instanceof SyntaxError && err.message.includes('JSON')) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// Separat handler-funksjon for DELETE
async function deleteOutletHandler(
  request: NextRequest,
  { params }: { params: RouteParams },
  user: User // Mottar user-objektet
) {
  const supabase = createSupabaseServerClient();
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Outlet ID is required.' }, { status: 400 });
  }

  try {
    const { error, count } = await supabase
      .from('outlets')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) {
      console.error('Error deleting outlet:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (count === 0) {
        return NextResponse.json({ error: 'Outlet not found to delete or already deleted.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Outlet deleted successfully.' }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error deleting outlet:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// Eksporter de innpakkede handlerne
export const GET = adminOnly(getOutletByIdHandler);
export const PUT = adminOnly(updateOutletHandler);
export const DELETE = adminOnly(deleteOutletHandler);
