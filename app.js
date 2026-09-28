const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

function getName(fitur, daftarTipe) {
  const semua = [fitur, ...(fitur.context || [])];

  for (const tipe of daftarTipe) {
    const ketemu = semua.find((item) => {
      if (item.place_type) {
        return item.place_type.includes(tipe);
      }
      return (item.id || "").startsWith(tipe + ".");
    });

    if (ketemu) {
      return ketemu.text;
    }
  }

  return "-";
}

app.get("/api/lokasi", async (req, res) => {
  const kota = (req.query.kota || "").trim();

  if (!kota) {
    return res.status(400).json({
      message: "Nama kota tidak boleh kosong",
    });
  }

  const apiKey = "vWXPrudoV4tnwNqYPVkL";

  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(kota)}.json?key=${apiKey}`;

  try {
    const response = await axios.get(url);

    const data = response.data;

    if (!data.features || data.features.length === 0) {
      return res.status(404).json({
        message: "Kota tidak ditemukan",
      });
    }

    const fitur = data.features[0];

    res.json({
      placeName: fitur.place_name,
      matchingText: fitur.matching_text || fitur.text,
      tipe: fitur.place_type,
      koordinat: fitur.geometry.coordinates,
      negara: getName(fitur, ["country"]),
      provinsi: getName(fitur, ["region"]),
      kecamatan: getName(fitur, [
        "municipal_district",
        "municipality",
        "county",
        "locality",
      ]),
      longitude: fitur.geometry.coordinates[0],
      latitude: fitur.geometry.coordinates[1],
    });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: "Gagal mengambil data dari MapTiler",
    });
  }
});

app.get("/api/suggestions", async (req, res) => {
  const query = (req.query.q || "").trim();

  if (!query) {
    return res.json([]);
  }

  const apiKey = "vWXPrudoV4tnwNqYPVkL";

  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${apiKey}&autocomplete=true&limit=5`;

  try {
    const response = await axios.get(url);

    const features = response.data.features || [];

    res.json(
      features.map((fitur) => ({
        text: fitur.text,
        placeName: fitur.place_name,
      })),
    );
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: "Gagal mengambil suggestions dari MapTiler",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
