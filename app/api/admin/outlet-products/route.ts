import { createSupabaseServerClient } from '@/lib/supabase/server'; // Endret import
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/outlet-products - Hent alle produkt-utsalgssted koblinger
export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient(); // Bruker ny server-klient
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error or no user:', authError);
    return NextResponse.json({ error: 'Unauthorized: Valid session required.' }, { status: 401 });
  }

  // Bruker er autentisert, fortsett
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching outlet-products:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error fetching outlet-products:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// POST /api/admin/outlet-products - Opprett en ny produkt-utsalgssted kobling
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient(); // Bruker ny server-klient
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error or no user:', authError);
    return NextResponse.json({ error: 'Unauthorized: Valid session required to create outlet-product relation.' }, { status: 401 });
  }

  // Bruker er autentisert, fortsett
  try {
    const relationData = await request.json();

    if (!relationData.outlet_id || !relationData.product_id || typeof relationData.price === 'undefined') {
      return NextResponse.json({ error: 'Outlet ID, Product ID, and Price are required.' }, { status: 400 });
    }
    if (typeof relationData.price !== 'number' || relationData.price < 0) {
      return NextResponse.json({ error: 'Price must be a non-negative number.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('outlet_products')
      .insert([
        {
          outlet_id: relationData.outlet_id,
          product_id: relationData.product_id,
          price: relationData.price,
          stock_status: relationData.stock_status, // Defaults to 'in_stock' in DB if not provided
          is_available: relationData.is_available === undefined ? true : relationData.is_available, // Defaults to true in DB if not provided
           // Optional: Legg til user_id hvis du vil spore hvem som opprettet dette
          // user_id: user.id,
        },
      ])
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
      console.error('Error creating outlet-product relation:', error);
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'This product is already associated with this outlet. Update the existing entry instead.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Unexpected error creating outlet-product relation:', err);
    if (err instanceof SyntaxError && err.message.includes('JSON')) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// TODO: Add authentication and authorization to secure these endpoints. // Denne kan fjernes/oppdateres