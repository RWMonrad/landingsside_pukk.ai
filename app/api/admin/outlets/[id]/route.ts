import { createSupabaseServerClient } from '@/lib/supabase/server'; // Endret import
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  id: string;
}

// GET /api/admin/outlets/[id] - Hent et spesifikt utsalgssted
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const supabase = createSupabaseServerClient(); // Bruker ny server-klient
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error or no user:', authError);
    return NextResponse.json({ error: 'Unauthorized: Valid session required.' }, { status: 401 });
  }

  // Bruker er autentisert, fortsett
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
     if (!data) {
        return NextResponse.json({ error: 'Outlet not found.' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error fetching outlet:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// PUT /api/admin/outlets/[id] - Oppdater et utsalgssted
export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const supabase = createSupabaseServerClient(); // Bruker ny server-klient
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error or no user:', authError);
    return NextResponse.json({ error: 'Unauthorized: Valid session required to update outlet.' }, { status: 401 });
  }

  // Bruker er autentisert, fortsett
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Outlet ID is required.' }, { status: 400 });
  }

  try {
    const outletData = await request.json();
    if (Object.keys(outletData).length === 0) {
        return NextResponse.json({ error: 'Request body cannot be empty.' }, { status: 400 });
    }
    if (outletData.name === "") {
        return NextResponse.json({ error: 'Name cannot be empty if provided.' }, { status: 400 });
    }

    const updatePayload: { [key: string]: any } = {};
    if (outletData.name !== undefined) updatePayload.name = outletData.name;
    if (outletData.address !== undefined) updatePayload.address = outletData.address;
    if (outletData.latitude !== undefined) updatePayload.latitude = outletData.latitude;
    if (outletData.longitude !== undefined) updatePayload.longitude = outletData.longitude;
    if (outletData.is_active !== undefined) updatePayload.is_active = outletData.is_active;
    // Optional: Legg til updated_at og user_id for sporing
    // updatePayload.updated_at = new Date().toISOString();
    // updatePayload.updated_by = user.id;

    if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('outlets')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating outlet:', error);
      // Hvis .single() ikke finner en rad, kan det kaste en feil som fanges her
      if (error.code === 'PGRST116') { 
          return NextResponse.json({ error: 'Outlet not found to update.' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) { // Burde ikke skje hvis .single() brukes og feil ikke kastes, men for sikkerhets skyld
        return NextResponse.json({ error: 'Outlet not found to update.' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Unexpected error updating outlet:', err);
    if (err instanceof SyntaxError && err.message.includes('JSON')) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    // Dobbeltsjekk for PGRST116 i tilfelle det ikke ble fanget over
    if (err.code === 'PGRST116') { 
        return NextResponse.json({ error: 'Outlet not found to update.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// DELETE /api/admin/outlets/[id] - Slett et utsalgssted
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const supabase = createSupabaseServerClient(); // Bruker ny server-klient
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error or no user:', authError);
    return NextResponse.json({ error: 'Unauthorized: Valid session required to delete outlet.' }, { status: 401 });
  }

  // Bruker er autentisert, fortsett
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

// TODO: Add authentication and authorization to secure these endpoints. // Denne kan fjernes/oppdateres