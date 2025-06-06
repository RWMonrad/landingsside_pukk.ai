// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { adminOnly } from '@/lib/auth/adminOnly'; // Ny import
import { User } from '@supabase/supabase-js'; // Importer User type

interface RouteParams {
  id: string;
}

// Separat handler-funksjon for GET
async function getProductByIdHandler(
  request: NextRequest,
  { params }: { params: RouteParams },
  user: User // Mottar user-objektet
) {
  const supabase = createSupabaseServerClient();
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
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
      }
      console.error('Error fetching product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) { // Dobbeltsjekk, selv om single() burde håndtere dette med PGRST116
        return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error fetching product:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// Separat handler-funksjon for PUT
async function updateProductHandler(
  request: NextRequest,
  { params }: { params: RouteParams },
  user: User // Mottar user-objektet
) {
  const supabase = createSupabaseServerClient();
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
  }

  try {
    const productData = await request.json();

    // Omfattende validering fra den opprinnelige filen
    const updates: { [key: string]: any } = {};
    let hasUpdates = false;

    if (productData.name !== undefined) {
      if (typeof productData.name !== 'string' || productData.name.trim() === '') {
        return NextResponse.json({ error: 'Name must be a non-empty string.' }, { status: 400 });
      }
      updates.name = productData.name.trim();
      hasUpdates = true;
    }
    if (productData.description !== undefined) {
      if (productData.description !== null && typeof productData.description !== 'string') {
        return NextResponse.json({ error: 'Description must be a string or null.' }, { status: 400 });
      }
      updates.description = productData.description;
      hasUpdates = true;
    }
    if (productData.price !== undefined) {
      if (typeof productData.price !== 'number' || productData.price < 0) {
        return NextResponse.json({ error: 'Price must be a non-negative number.' }, { status: 400 });
      }
      updates.price = productData.price;
      hasUpdates = true;
    }
    if (productData.unit !== undefined) {
      if (typeof productData.unit !== 'string' || productData.unit.trim() === '') {
        return NextResponse.json({ error: 'Unit must be a non-empty string.' }, { status: 400 });
      }
      updates.unit = productData.unit.trim();
      hasUpdates = true;
    }
    if (productData.category !== undefined) {
      if (productData.category !== null && typeof productData.category !== 'string') {
        return NextResponse.json({ error: 'Category must be a string or null.' }, { status: 400 });
      }
      updates.category = productData.category;
      hasUpdates = true;
    }
    if (productData.image_url !== undefined) {
      if (productData.image_url !== null && typeof productData.image_url !== 'string') {
        return NextResponse.json({ error: 'Image URL must be a string or null.' }, { status: 400 });
      }
      updates.image_url = productData.image_url;
      hasUpdates = true;
    }
    // Legg til andre felter som kan oppdateres her...

    if (!hasUpdates) {
      return NextResponse.json({ error: 'No update fields provided.' }, { status: 400 });
    }

    // Optional: Legg til hvem som sist oppdaterte produktet
    // updates.updated_by = user.id;
    // updates.updated_at = new Date().toISOString(); // Hvis du manuelt håndterer timestamps

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Produktet finnes ikke for oppdatering
        return NextResponse.json({ error: 'Product not found to update.' }, { status: 404 });
      }
      console.error('Error updating product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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

// Separat handler-funksjon for DELETE
async function deleteProductHandler(
  request: NextRequest,
  { params }: { params: RouteParams },
  user: User // Mottar user-objektet
) {
  const supabase = createSupabaseServerClient();
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
  }

  try {
    const { error, count } = await supabase
      .from('products')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (count === 0) {
        return NextResponse.json({ error: 'Product not found to delete or already deleted.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully.' }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error deleting product:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// Eksporter de innpakkede handlerne
export const GET = adminOnly(getProductByIdHandler);
export const PUT = adminOnly(updateProductHandler);
export const DELETE = adminOnly(deleteProductHandler);
