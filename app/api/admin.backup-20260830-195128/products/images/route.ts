import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const productId = formData.get("product_id") as string;
    const files = formData.getAll("images") as File[];

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID required",
        },
        { status: 400 }
      );
    }

    if (files.length > 20) {
      return NextResponse.json(
        {
          success: false,
          error: "Maximum 20 images allowed",
        },
        { status: 400 }
      );
    }

    const uploaded = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const ext = file.name.split(".").pop();

      const fileName = `products/${productId}/${Date.now()}-${i}.${ext}`;

      const buffer = Buffer.from(
        await file.arrayBuffer()
      );

      const upload = await supabase.storage
        .from("products")
        .upload(fileName, buffer, {
          contentType: file.type,
        });

      if (upload.error) {
        throw upload.error;
      }

      const url = supabase.storage
        .from("products")
        .getPublicUrl(fileName)
        .data.publicUrl;

      uploaded.push({
        product_id: productId,
        image_url: url,
        storage_key: fileName,
        sort_order: i,
        is_primary: i === 0,
      });
    }

    const { error } = await supabase
      .from("product_images")
      .insert(uploaded);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      images: uploaded,
    });

  } catch (error:any) {

    return NextResponse.json(
      {
        success:false,
        error:error.message,
      },
      {
        status:500,
      }
    );
  }
}
