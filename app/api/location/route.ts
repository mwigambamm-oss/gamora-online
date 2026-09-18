import { NextResponse } from "next/server";

const GAMORA_LAT = -6.7924;
const GAMORA_LNG = 39.2083;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { latitude, longitude, address } = body;

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({
        success: false,
        message: "Location haijapatikana",
        address: address || "",
      });
    }

    /*
      OSRM inatumia road/driving distance.
      Format: longitude,latitude
    */
    const osrmUrl =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${GAMORA_LNG},${GAMORA_LAT};${lng},${lat}` +
      `?overview=false`;

    const response = await fetch(osrmUrl, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("OSRM ERROR:", response.status);

      return NextResponse.json(
        {
          success: false,
          message: "Road distance haijapatikana.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (
      data.code !== "Ok" ||
      !data.routes ||
      !data.routes.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Hakuna road route iliyopatikana.",
        },
        { status: 422 }
      );
    }

    /*
      OSRM distance iko meters.
      Tunabadilisha kuwa kilometers.
    */
    const roadDistanceKm =
      Number(data.routes[0].distance || 0) / 1000;

    const roundedDistance =
      Math.round(roadDistanceKm * 10) / 10;

    /*
      Delivery rate:
      TSh 671 kwa kila km.
    */
    const deliveryFee = Math.max(
      500,
      Math.round(roundedDistance * 671)
    );

    return NextResponse.json({
      success: true,

      location: {
        latitude: lat,
        longitude: lng,
      },

      distanceKm: roundedDistance,

      deliveryFee,

      message: "Road distance imepatikana.",
    });
  } catch (error) {
    console.error("LOCATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error wakati wa kupata road distance.",
      },
      { status: 500 }
    );
  }
}
