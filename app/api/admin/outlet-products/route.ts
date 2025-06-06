// app/api/admin/outlet-products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { adminOnly } from '@/lib/auth/adminOnly'; // Ny import
import { User } from '@supabase/supabase-js'; // Importer User type

// Separat handler-funksjon for GET
async function getOutletProductsHandler(request: NextRequest, context: {}, user: User) {
  const supabase = createSupabaseServerClient();
  // Autentisering og rolle-sjekk er allerede gjort av adminOnly

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

// Separat handler-funksjon for POST
async function createOutletProductHandler(request: NextRequest, context: {}, user: User) {
  const supabase = createSupabaseServerClient();
  // Autentisering og rolle-sjekk er allerede gjort av adminOnly

  try {
    const relationData = await request.json();

    // Validering
    if (!relationData.outlet_id || !relationData.product_id) {
      return NextResponse.json({ error: 'Outlet ID and Product ID are required.' }, { status: 400 });
    }
    if (typeof relationData.outlet_id !== 'string' || relationData.outlet_id.trim() === '') {
        return NextResponse.json({ error: 'Outlet ID must be a non-empty string.' }, { status: 400 });
    }
    if (typeof relationData.product_id !== 'string' || relationData.product_id.trim() === '') {
        return NextResponse.json({ error: 'Product ID must be a non-empty string.' }, { status: 400 });
    }
    if (relationData.price !== undefined && (typeof relationData.price !== 'number' || relationData.price < 0)) {
      return NextResponse.json({ error: 'Price must be a non-negative number if provided.' }, { status: 400 });
    }
    // Antar at stock_status er en enum i databasen, f.eks. ('in_stock', 'low_stock', 'out_of_stock')
    // Hvis den er valgfri og har en default i DB, trenger vi kanskje ikke validere den her,
    // med mindre vi vil sikre at kun gyldige verdier sendes.
    if (relationData.stock_status && typeof relationData.stock_status !== 'string') {
        return NextResponse.json({ error: 'Stock status must be a string if provided.' }, { status: 400 });
    }
    if (relationData.is_available !== undefined && typeof relationData.is_available !== 'boolean') {
      return NextResponse.json({ error: 'is_available must be a boolean if provided.' }, { status: 400 });
    }

    const insertData: any = {
      outlet_id: relationData.outlet_id,
      product_id: relationData.product_id,
      price: relationData.price, // Kan være null hvis databasen tillater det
      stock_status: relationData.stock_status, // Kan være null/default
      is_available: relationData.is_available === undefined ? true : relationData.is_available,
      // Optional: Legg til user.id for å spore hvem som opprettet dette
      // created_by: user.id,
    };

    const { data, error } = await supabase
      .from('outlet_products')
      .insert([insertData])
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
      if (error.code === '23505') { // Unique violation (forutsetter unique constraint på outlet_id, product_id)
        return NextResponse.json({ error: 'This product is already associated with this outlet. Update the existing entry instead.' }, { status: 409 });
      }
      // Sjekk for foreign key violations (hvis outlet_id eller product_id ikke finnes)
      if (error.code === '23503') {
        if (error.message.includes('outlet_products_outlet_id_fkey')) {
            return NextResponse.json({ error: 'Outlet not found.' }, { status: 404 });
        }
        if (error.message.includes('outlet_products_product_id_fkey')) {
            return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
        }
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

// Eksporter de innpakkede handlerne
export const GET = adminOnly(getOutletProductsHandler);
export const POST = adminOnly(createOutletProductHandler);
