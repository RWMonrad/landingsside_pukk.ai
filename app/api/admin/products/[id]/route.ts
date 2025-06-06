import { supabase } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  id: string;
}

// GET /api/admin/products/[id] - Hent et spesifikt produkt
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
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
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
  }

  try {
    const productData = await request.json();

    // Validering av input kan legges til her (f.eks. sjekke at name ikke er tomt hvis det sendes med)

    const { data, error } = await supabase
      .from('products')
      .update({
        name: productData.name,
        description: productData.description,
        category: productData.category,
        image_url: productData.image_url,
        unit: productData.unit,
        // created_at oppdateres ikke, det settes kun ved opprettelse
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found to update.' }, { status: 404 });
      }
      console.error('Error updating product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
     if (!data) {
        return NextResponse.json({ error: 'Product not found to update.' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Unexpected error updating product:', err);
     if (err instanceof SyntaxError && err.message.includes('JSON')) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] - Slett et produkt
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
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

// TODO: Add authentication and authorization to secure these endpoints.