// app/api/admin/outlet-products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { adminOnly } from '@/lib/auth/adminOnly'; // Ny import
import { User } from '@supabase/supabase-js'; // Importer User type

interface RouteParams {
  id: string; // This is the ID of the outlet_products entry itself
}

// Separat handler-funksjon for GET
async function getOutletProductByIdHandler(
  request: NextRequest,
  { params }: { params: RouteParams },
  user: User // Mottar user-objektet
) {
  const supabase = createSupabaseServerClient();
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
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Outlet-product relation not found.' }, { status: 404 });
      }
      console.error('Error fetching outlet-product relation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) { // Dobbeltsjekk
        return NextResponse.json({ error: 'Outlet-product relation not found.' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error fetching outlet-product relation:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// Separat handler-funksjon for PUT
async function updateOutletProductHandler(
  request: NextRequest,
  { params }: { params: RouteParams },
  user: User // Mottar user-objektet
) {
  const supabase = createSupabaseServerClient();
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Outlet-product relation ID is required.' }, { status: 400 });
  }

  try {
    const updateData = await request.json();
    const updates: { [key: string]: any } = {};
    let hasUpdates = false;

    // Validering for hvert felt som kan oppdateres
    // outlet_id og product_id bør vanligvis ikke endres via PUT på en relasjon.
    // Hvis de må endres, er det ofte bedre å slette og opprette en ny relasjon.
    // Vi fokuserer på å oppdatere attributter for relasjonen.

    if (updateData.price !== undefined) {
      if (typeof updateData.price !== 'number' || updateData.price < 0) {
        return NextResponse.json({ error: 'Price must be a non-negative number.' }, { status: 400 });
      }
      updates.price = updateData.price;
      hasUpdates = true;
    }

    if (updateData.stock_status !== undefined) {
      // Anta at stock_status er en enum i databasen.
      // En mer robust validering ville sjekket mot gyldige enum-verdier.
      if (typeof updateData.stock_status !== 'string') {
        return NextResponse.json({ error: 'Stock status must be a string.' }, { status: 400 });
      }
      updates.stock_status = updateData.stock_status;
      hasUpdates = true;
    }

    if (updateData.is_available !== undefined) {
      if (typeof updateData.is_available !== 'boolean') {
        return NextResponse.json({ error: 'is_available must be a boolean.' }, { status: 400 });
      }
      updates.is_available = updateData.is_available;
      hasUpdates = true;
    }

    if (!hasUpdates) {
      return NextResponse.json({ error: 'No update fields provided for the relation.' }, { status: 400 });
    }

    // Legg til hvem som sist oppdaterte og når
    updates.updated_at = new Date().toISOString();
    // updates.updated_by = user.id; // Hvis du har en slik kolonne

    const { data, error } = await supabase
      .from('outlet_products')
      .update(updates)
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
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Outlet-product relation not found to update.' }, { status: 404 });
      }
      console.error('Error updating outlet-product relation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Unexpected error updating outlet-product relation:', err);
    if (err instanceof SyntaxError && err.message.includes('JSON')) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// Separat handler-funksjon for DELETE
async function deleteOutletProductHandler(
  request: NextRequest,
  { params }: { params: RouteParams },
  user: User // Mottar user-objektet
) {
  const supabase = createSupabaseServerClient();
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

// Eksporter de innpakkede handlerne
export const GET = adminOnly(getOutletProductByIdHandler);
export const PUT = adminOnly(updateOutletProductHandler);
export const DELETE = adminOnly(deleteOutletProductHandler);
