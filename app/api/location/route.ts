import { NextResponse } from "next/server";

const GAMORA_LAT = -6.7924;
const GAMORA_LNG = 39.2083;

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(
      (lat1 * Math.PI) / 180
    ) *
      Math.cos(
        (lat2 * Math.PI) / 180
      ) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}


export async function POST(
  req: Request
) {
  try {
    const body = await req.json();

    const {
      latitude,
      longitude,
      address,
    } = body;


    let lat = Number(latitude);
    let lng = Number(longitude);


    /*
      Kama mteja hajaweka GPS
      tunatumia address ya kawaida
      baadaye tunaweza kuunganisha
      geocoding
    */

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return NextResponse.json({
        success: false,
        message:
          "Location haijapatikana",
        address:
          address || "",
      });
    }


    const distance =
      calculateDistance(
        GAMORA_LAT,
        GAMORA_LNG,
        lat,
        lng
      );


    const rounded =
      Math.round(
        distance * 10
      ) / 10;


    const deliveryFee =
      Math.max(
        500,
        Math.round(
          (rounded * 671) / 100
        ) * 100
      );


    return NextResponse.json({
      success: true,

      location: {
        latitude: lat,
        longitude: lng,
      },

      distanceKm: rounded,

      deliveryFee,

      message:
        "Umbali umepatikana",
    });


  } catch (error) {

    return NextResponse.json(
      {
        success:false,
        error:
          "Server error",
      },
      {
        status:500,
      }
    );

  }
}
