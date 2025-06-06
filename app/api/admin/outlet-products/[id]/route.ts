import { createSupabaseServerClient } from '@/lib/supabase/server'; // Endret import
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  id: string; // This is the ID of the outlet_products entry itself
}

// GET /api/admin/outlet-products/[id] - Hent en spesifikk kobling
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
    return NextResponse.json({ error: 'Outlet-product relation ID is required.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('outlet_products')
      .select(`
        id,
        outlet_id,
        product_id,
        price,
        stock_status,
        is_available,
        created_at,
        updated_at,
        products (name, unit),
        outlets (name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Outlet-product relation not found.' }, { status: 404 });
      }
      console.error('Error fetching outlet-product relation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) { // Selv om PGRST116 skulle fange dette, for ekstra sikkerhet
        return NextResponse.json({ error: 'Outlet-product relation not found.' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error fetching outlet-product relation:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// PUT /api/admin/outlet-products/[id] - Oppdater en kobling
export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const supabase = createSupabaseServerClient(); // Bruker ny server-klient
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error or no user:', authError);
    return NextResponse.json({ error: 'Unauthorized: Valid session required to update relation.' }, { status: 401 });
  }

  // Bruker er autentisert, fortsett
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Outlet-product relation ID is required.' }, { status: 400 });
  }

  try {
    const updateData = await request.json();

    // Validering av input
    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'Request body cannot be empty for update.' }, { status: 400 });
    }
    if (updateData.price !== undefined && (typeof updateData.price !== 'number' || updateData.price < 0)) {
      return NextResponse.json({ error: 'Price must be a non-negative number if provided.' }, { status: 400 });
    }
    if (updateData.outlet_id !== undefined || updateData.product_id !== undefined) {
        return NextResponse.json({ error: 'Cannot change outlet_id or product_id. Delete and create a new relation instead.' }, { status: 400 });
    }

    const updatePayload: { [key: string]: any } = {};
    if (updateData.price !== undefined) updatePayload.price = updateData.price;
    if (updateData.stock_status !== undefined) updatePayload.stock_status = updateData.stock_status;
    if (updateData.is_available !== undefined) updatePayload.is_available = updateData.is_available;
    
    // Optional: Legg til updated_at og user_id for sporing
    // if (Object.keys(updatePayload).length > 0) { // Bare sett hvis det er faktiske endringer
    //   updatePayload.updated_at = new Date().toISOString();
    //   // updatePayload.updated_by = user.id; 
    // }


    if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('outlet_products')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        id,
        outlet_id,
        product_id,
        price,
        stock_status,
        is_available,
        created_at,
        updated_at,
        products (name, unit),
        outlets (name)
      `)
      .single();

    if (error) {
      console.error('Error updating outlet-product relation:', error);
      if (error.code === 'PGRST116') { // .single() fant ikke raden
        return NextResponse.json({ error: 'Outlet-product relation not found to update.' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) { // Burde ikke skje hvis .single() og ingen feil, men for sikkerhets skyld
        return NextResponse.json({ error: 'Outlet-product relation not found to update.' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Unexpected error updating outlet-product relation:', err);
    if (err instanceof SyntaxError && err.message.includes('JSON')) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    // Dobbeltsjekk for PGRST116 i tilfelle det ikke ble fanget over
    if (err.code === 'PGRST116') { 
        return NextResponse.json({ error: 'Outlet-product relation not found to update.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// DELETE /api/admin/outlet-products/[id] - Slett en kobling
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const supabase = createSupabaseServerClient(); // Bruker ny server-klient
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error or no user:', authError);
    return NextResponse.json({ error: 'Unauthorized: Valid session required to delete relation.' }, { status: 401 });
  }

  // Bruker er autentisert, fortsett
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Outlet-product relation ID is required.' }, { status: 400 });
  }

  try {
    const { error, count } = await supabase
      .from('outlet_products')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) {
      console.error('Error deleting outlet-product relation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (count === 0) {
        return NextResponse.json({ error: 'Outlet-product relation not found to delete or already deleted.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Outlet-product relation deleted successfully.' }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error deleting outlet-product relation:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
