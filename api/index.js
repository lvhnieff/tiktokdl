
const express = require("express");
const cors = require("cors");
const { tiktok } = require("@coflyn/scrapr");

const app = express();

app.use(cors());
app.use(express.json());

function validTikTokURL(value) {
    try {
        const url = new URL(value);
        return (
            url.protocol === "https:" &&
            ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"].includes(url.hostname)
        );
    } catch {
        return false;
    }
}

app.post("/api/download", async (req, res) => {
    try {
        const { url } = req.body;

        if (!validTikTokURL(url)) {
            return res.status(400).json({
                success: false,
                message: "Link TikTok tidak valid."
            });
        }

        let result = null;

        for (const method of [tiktok.snaptik, tiktok.ssstik]) {
            try {
                const response = await method.call(tiktok, url);

                if (response?.status && response?.result) {
                    result = response.result;
                    break;
                }
            } catch (error) {
                console.error("Metode gagal:", error.message);
            }
        }

        if (!result) {
            return res.status(502).json({
                success: false,
                message: "Video tidak dapat diproses."
            });
        }

        const downloads = (result.downloads || [])
            .filter(item => {
                try {
                    return (
                        ["video", "mp4"].includes(String(item.type).toLowerCase()) &&
                        new URL(item.url).protocol === "https:"
                    );
                } catch {
                    return false;
                }
            })
            .map(item => ({
                url: item.url,
                type: "video",
                quality: item.quality || "Video"
            }));

        if (!downloads.length) {
            return res.status(404).json({
                success: false,
                message: "Link download tidak ditemukan."
            });
        }

        return res.json({
            success: true,
            video: {
                title: result.title || "TikTok Video",
                thumbnail: result.thumbnail || "",
                downloads
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server."
        });
    }
});

module.exports = app;
