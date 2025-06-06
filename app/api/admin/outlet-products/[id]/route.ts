import { supabase } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  id: string; // This is the ID of the outlet_products entry itself
}

// GET /api/admin/outlet-products/[id] - Hent en spesifikk kobling
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Outlet-product relation ID is required.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('outlet_products')
      .select(`
        *,
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
    if (!data) {
        return NextResponse.json({ error: 'Outlet-product relation not found.' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error fetching outlet-product relation:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// PUT /api/admin/outlet-products/[id] - Oppdater en kobling (f.eks. pris, lagerstatus)
export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Outlet-product relation ID is required.' }, { status: 400 });
  }

  try {
    const updateData = await request.json();

    // outlet_id and product_id should generally not be updated on an existing relation.
    // If they need to change, it's often better to delete and create a new one.
    // We'll allow updating price, stock_status, is_available.
    const allowedUpdates: { price?: number; stock_status?: string; is_available?: boolean } = {};
    if (typeof updateData.price !== 'undefined') {
        if (typeof updateData.price !== 'number' || updateData.price < 0) {
            return NextResponse.json({ error: 'Price must be a non-negative number.' }, { status: 400 });
        }
        allowedUpdates.price = updateData.price;
    }
    if (typeof updateData.stock_status !== 'undefined') {
        allowedUpdates.stock_status = updateData.stock_status;
    }
    if (typeof updateData.is_available !== 'undefined') {
        allowedUpdates.is_available = updateData.is_available;
    }

    if (Object.keys(allowedUpdates).length === 0) {
        return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('outlet_products')
      .update(allowedUpdates)
      .eq('id', id)
      .select(`
        *,
        products (name, unit),
        outlets (name)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Outlet-product relation not found to update.' }, { status: 404 });
      }
      console.error('Error updating outlet-product relation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
     if (!data) {
        return NextResponse.json({ error: 'Outlet-product relation not found to update.' }, { status: 404 });
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

// DELETE /api/admin/outlet-products/[id] - Slett en kobling
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
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

// TODO: Add authentication and authorization to secure these endpoints.