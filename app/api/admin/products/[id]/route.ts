import { createSupabaseServerClient } from '@/lib/supabase/server'; // Endret import
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  id: string;
}

// GET /api/admin/products/[id] - Hent et spesifikt produkt
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
    return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error code for "Not found"
        return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
      }
      console.error('Error fetching product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error fetching product:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// PUT /api/admin/products/[id] - Oppdater et produkt
export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const supabase = createSupabaseServerClient(); // Bruker ny server-klient
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error or no user:', authError);
    return NextResponse.json({ error: 'Unauthorized: Valid session required to update product.' }, { status: 401 });
  }

  // Bruker er autentisert, fortsett
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
  }

  try {
    const productData = await request.json();

    // Validering (kan utvides)
    if (Object.keys(productData).length === 0) {
        return NextResponse.json({ error: 'Request body cannot be empty.' }, { status: 400 });
    }
    if (productData.name === "" || productData.unit === "") {
        return NextResponse.json({ error: 'Name and unit cannot be empty if provided.' }, { status: 400 });
    }
    
    const updatePayload: { [key: string]: any } = {};
    if (productData.name !== undefined) updatePayload.name = productData.name;
    if (productData.description !== undefined) updatePayload.description = productData.description;
    if (productData.category !== undefined) updatePayload.category = productData.category;
    if (productData.image_url !== undefined) updatePayload.image_url = productData.image_url;
    if (productData.unit !== undefined) updatePayload.unit = productData.unit;
    // Optional: Legg til updated_at og user_id for sporing
    // updatePayload.updated_at = new Date().toISOString();
    // updatePayload.updated_by = user.id;


    if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
    }

    const { data, error, count } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single(); // Bruk single() hvis du forventer én rad tilbake og vil ha objektet direkte

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // single() vil kaste feil hvis ingen rad blir funnet (eller flere), så count sjekk er ikke like kritisk her,
    // men kan beholdes for ekstra robusthet eller hvis man ikke bruker .single()
    if (!data) { // Eller if (count === 0) hvis du ikke bruker .single()
      return NextResponse.json({ error: 'Product not found to update.' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Unexpected error updating product:', err);
     if (err instanceof SyntaxError && err.message.includes('JSON')) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    // Hvis .single() ikke finner en rad, kan det kaste en feil som fanges her
    if (err.code === 'PGRST116') { 
        return NextResponse.json({ error: 'Product not found to update.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] - Slett et produkt
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const supabase = createSupabaseServerClient(); // Bruker ny server-klient
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication error or no user:', authError);
    return NextResponse.json({ error: 'Unauthorized: Valid session required to delete product.' }, { status: 401 });
  }

  // Bruker er autentisert, fortsett
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
  }

  try {
    const { error, count } = await supabase
      .from('products')
      .delete({ count: 'exact' }) // Returnerer antall slettede rader
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (count === 0) {
        return NextResponse.json({ error: 'Product not found to delete or already deleted.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully.' }, { status: 200 }); // Eller 204 No Content
  } catch (err) {
    console.error('Unexpected error deleting product:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// TODO: Add authentication and authorization to secure these endpoints. // Denne kan fjernes/oppdateres