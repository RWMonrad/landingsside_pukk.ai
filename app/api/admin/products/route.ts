import { createSupabaseServerClient } from '@/lib/supabase/server'; // Endret import
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/products - Hent alle produkter
export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient(); // Bruker ny server-klient
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error or no user:', authError);
    return NextResponse.json({ error: 'Unauthorized: Valid session required.' }, { status: 401 });
  }

  // Bruker er autentisert, fortsett med å hente produkter
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error fetching products:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// POST /api/admin/products - Opprett et nytt produkt
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient(); // Bruker ny server-klient
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error or no user:', authError);
    return NextResponse.json({ error: 'Unauthorized: Valid session required to create product.' }, { status: 401 });
  }

  // Bruker er autentisert, fortsett med å opprette produkt
  try {
    const productData = await request.json();

    if (!productData.name || !productData.unit) {
      return NextResponse.json({ error: 'Name and unit are required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: productData.name,
          description: productData.description,
          category: productData.category,
          image_url: productData.image_url,
          unit: productData.unit,
          // Optional: Legg til user_id hvis du vil spore hvem som opprettet produktet
          // user_id: user.id, 
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Unexpected error creating product:', err);
    if (err instanceof SyntaxError && err.message.includes('JSON')) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// TODO: Add authentication and authorization to secure these endpoints. // Denne kan fjernes/oppdateres