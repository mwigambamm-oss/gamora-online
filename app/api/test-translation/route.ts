import { NextResponse } from "next/server";
import {
  translateToSwahili,
  translateSpecificationsToSwahili,
} from "@/lib/translation/translate";

export async function GET() {
  try {
    const description = await translateToSwahili(
      "This elegant womens handbag is designed for everyday use."
    );

    const specifications =
      await translateSpecificationsToSwahili({
        Material: "Leather",
        Color: "Black, Brown, Pink and Beige",
        Size: "Medium",
        Weight: "350g",
        Gender: "Women",
        Pockets: "Multiple pockets",
        Closure: "Zipper",
        "Bag Type": "Crossbody Bag",
      });

    return NextResponse.json({
      success: true,
      description,
      specifications,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Translation test failed",
      },
      { status: 500 }
    );
  }
}
