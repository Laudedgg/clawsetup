import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check for referral cookie
    let referredBy: string | undefined;
    const refCode = req.cookies.get('ref_code')?.value;
    if (refCode) {
      const referrer = await UserModel.findOne({ referralCode: refCode }).lean();
      if (referrer && (referrer as any).email.toLowerCase() !== email.toLowerCase()) {
        referredBy = refCode;
      }
    }

    const user = await UserModel.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      tier: 'free',
      paymentStatus: 'pending',
      ...(referredBy && { referredBy }),
    });

    return NextResponse.json(
      { message: 'User created successfully', userId: user._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
