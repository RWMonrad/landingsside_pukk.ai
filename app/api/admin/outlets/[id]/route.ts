import { supabase } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  id: string;
}

// GET /api/admin/outlets/[id] - Hent et spesifikt utsalgssted
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
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
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Outlet ID is required.' }, { status: 400 });
  }

  try {
    const outletData = await request.json();

    const { data, error } = await supabase
      .from('outlets')
      .update({
        name: outletData.name,
        address: outletData.address,
        latitude: outletData.latitude,
        longitude: outletData.longitude,
        is_active: outletData.is_active,
      })
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
    if (!data) {
        return NextResponse.json({ error: 'Outlet not found to update.' }, { status: 404 });
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

// DELETE /api/admin/outlets/[id] - Slett et utsalgssted
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
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

// TODO: Add authentication and authorization to secure these endpoints.