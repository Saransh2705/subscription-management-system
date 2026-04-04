import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateRequest } from '@/lib/v1/auth.helper';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 401,
            type: 'Unauthorized',
            message: auth.error,
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, phone, company, address, city, country, notes } = body;

    if (!name || !email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            type: 'BadRequest',
            message: 'name and email are required',
          },
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            type: 'BadRequest',
            message: 'Invalid email format',
          },
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: customer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name,
        email,
        phone: phone || null,
        company: company || null,
        address: address || null,
        city: city || null,
        country: country || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 409,
              type: 'Conflict',
              message: 'A customer with this email already exists',
            },
          },
          { status: 409 }
        );
      }

      console.error('Customer creation error:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            type: 'ServerError',
            message: 'Failed to create customer',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: customer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Customer creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          type: 'ServerError',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
