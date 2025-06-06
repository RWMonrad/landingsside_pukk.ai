// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { adminOnly } from '@/lib/auth/adminOnly'; // Ny import
import { User } from '@supabase/supabase-js'; // Importer User type for typehinting

// Separat handler-funksjon for GET
async function getProductsHandler(request: NextRequest, context: {}, user: User) {
  const supabase = createSupabaseServerClient();
  // Autentisering og rolle-sjekk er allerede gjort av adminOnly

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

// Separat handler-funksjon for POST
async function createProductHandler(request: NextRequest, context: {}, user: User) {
  const supabase = createSupabaseServerClient();
  // Autentisering og rolle-sjekk er allerede gjort av adminOnly

  try {
    const productData = await request.json();

    // Validering
    if (!productData.name || typeof productData.price === 'undefined' || !productData.unit) {
      return NextResponse.json({ error: 'Name, price, and unit are required.' }, { status: 400 });
    }
    if (typeof productData.price !== 'number' || productData.price < 0) {
      return NextResponse.json({ error: 'Price must be a non-negative number.' }, { status: 400 });
    }
    if (typeof productData.name !== 'string' || productData.name.trim() === '') {
        return NextResponse.json({ error: 'Name must be a non-empty string.' }, { status: 400 });
    }
    if (typeof productData.unit !== 'string' || productData.unit.trim() === '') {
        return NextResponse.json({ error: 'Unit must be a non-empty string.' }, { status: 400 });
    }
    if (productData.description && typeof productData.description !== 'string') {
        return NextResponse.json({ error: 'Description must be a string if provided.' }, { status: 400 });
    }
    // Valider category hvis den er gitt
    if (productData.category && typeof productData.category !== 'string') {
        return NextResponse.json({ error: 'Category must be a string if provided.' }, { status: 400 });
    }
    // Valider image_url hvis den er gitt
    if (productData.image_url && typeof productData.image_url !== 'string') {
        return NextResponse.json({ error: 'Image URL must be a string if provided.' }, { status: 400 });
    }


    const insertData: any = {
      name: productData.name,
      description: productData.description,
      price: productData.price, // Sørg for at 'price' er i databasen din for 'products'
      unit: productData.unit,
      category: productData.category,
      image_url: productData.image_url,
      // Optional: Legg til user.id for å spore hvem som opprettet produktet
      // created_by: user.id,
    };

    const { data, error } = await supabase
      .from('products')
      .insert([insertData])
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

// Eksporter de innpakkede handlerne
export const GET = adminOnly(getProductsHandler);
export const POST = adminOnly(createProductHandler);
