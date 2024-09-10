import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { cartItems, customer } = await req.json();

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return new NextResponse("No items in cart", { status: 400, headers: corsHeaders });
    }

    if (!customer || !customer.clerkId || !customer.email || !customer.name || !customer.shippingRate) {
      return new NextResponse("Incomplete customer information", { status: 400, headers: corsHeaders });
    }

    const amount = calculateTotalAmount(cartItems) * 100;

    const orderOptions = {
      amount: amount,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        clerkId: customer.clerkId,
        name: customer.name,
        email: customer.email,
        shippingRate: customer.shippingRate,
        orderItems: JSON.stringify(cartItems.map((cartItem: any) => ({
          product: cartItem.item._id,
          color: cartItem.color || "N/A",
          size: cartItem.size || "N/A",
          quantity: cartItem.quantity,
        }))),
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    return NextResponse.json({ order }, { headers: corsHeaders });
  } catch (err) {
    console.log("[create-razorpay-order_POST] Error:", err);
    return new NextResponse("Internal Server Error", { status: 500, headers: corsHeaders });
  }
}

function calculateTotalAmount(cartItems: any[]) {
  return cartItems.reduce((acc, cartItem) => acc + cartItem.item.price * cartItem.quantity, 0);
}
