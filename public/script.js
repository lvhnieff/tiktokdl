const form = document.getElementById("downloadForm");
const input = document.getElementById("videoUrl");
const button = document.getElementById("downloadBtn");
const resultBox = document.getElementById("resultBox");
const statusText = document.getElementById("status");

const TIKTOK_RE = /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\//i;

function setStatus(text, state = "") {
    statusText.textContent = text;
    statusText.className = state;
}

function setBusy(busy) {
    button.disabled = busy;
    button.textContent = busy ? "PROCESSING..." : "PROCESS";
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = input.value.trim();

    if (!TIKTOK_RE.test(url)) {
        alert("Masukkan link TikTok yang valid!");
        return;
    }

    setBusy(true);
    setStatus("SEARCHING", "loading");
    
    resultBox.innerHTML = `
        <div class="empty">
            <h3>PROCESSING...</h3>
            <p>Sedang mengambil data video dari server.</p>
        </div>
    `;

    try {
        const response = await fetch("/api/download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Gagal mengambil video.");
        }

        renderResult(data.video, url);
        setStatus("SUCCESS", "success");

    } catch (error) {
        resultBox.innerHTML = `
            <div class="empty">
                <h3>FAILED</h3>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;
        setStatus("ERROR", "error");
    } finally {
        setBusy(false);
    }
});

// Render UI
function renderResult(video, originalUrl) {
    // Ambil data array download dari backend
    const downloads = video.downloads || [];
    
    // HANYA AMBIL 1 VIDEO TERBAIK UNTUK PREVIEW (Tidak menampilkan list HD 1, HD 2, dll)
    const bestVideoUrl = downloads.length > 0 ? downloads[0].url : null;

    resultBox.innerHTML = "";

    const card = document.createElement("div");
    card.className = "video-result";

    // Preview Video
    if (bestVideoUrl) {
        const videoEl = document.createElement("video");
        videoEl.src = bestVideoUrl;
        videoEl.controls = true;
        videoEl.className = "video-preview";
        videoEl.setAttribute("referrerpolicy", "no-referrer"); 
        card.appendChild(videoEl);
    }

    // Info Text
    const info = document.createElement("div");
    info.className = "video-info";
    info.innerHTML = `
        <h3>${escapeHTML(video.title || "TikTok Video")}</h3>
        <p class="author">By @${escapeHTML(video.author || "unknown")}</p>
    `;
    card.appendChild(info);

    // HANYA 2 TOMBOL: MP4 & MP3
    const actionGroup = document.createElement("div");
    actionGroup.className = "action-group";

    // 1. Tombol MP4
    const mp4Btn = document.createElement("a");
    mp4Btn.className = "download-link btn-mp4";
    mp4Btn.href = `/api/video?url=${encodeURIComponent(originalUrl)}`;
    mp4Btn.textContent = "⬇ DOWNLOAD MP4";
    actionGroup.appendChild(mp4Btn);

    // 2. Tombol MP3
    const mp3Btn = document.createElement("a");
    mp3Btn.className = "download-link btn-mp3";
    mp3Btn.href = `/api/audio?url=${encodeURIComponent(originalUrl)}`;
    mp3Btn.textContent = "🎵 DOWNLOAD MP3";
    actionGroup.appendChild(mp3Btn);

    card.appendChild(actionGroup);
    resultBox.appendChild(card);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[c]);
}
