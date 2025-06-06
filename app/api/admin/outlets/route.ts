import { supabase } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/outlets - Hent alle utsalgssteder
export async function GET(request: NextRequest) {
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

// POST /api/admin/outlets - Opprett et nytt utsalgssted
export async function POST(request: NextRequest) {
  try {
    const outletData = await request.json();

    if (!outletData.name) {
      return NextResponse.json({ error: 'Name is required for an outlet.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('outlets')
      .insert([
        {
          name: outletData.name,
          address: outletData.address,
          latitude: outletData.latitude,
          longitude: outletData.longitude,
          is_active: outletData.is_active,
        },
      ])
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

// TODO: Add authentication and authorization to secure these endpoints.