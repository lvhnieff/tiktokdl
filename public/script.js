
const form = document.getElementById("downloadForm");
const input = document.getElementById("videoUrl");
const button = document.getElementById("downloadBtn");
const resultBox = document.getElementById("resultBox");
const statusText = document.getElementById("status");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const url = input.value.trim();

    if (!/^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\//i.test(url)) {
        alert("Masukkan link TikTok yang valid!");
        return;
    }

    button.disabled = true;
    button.textContent = "PROCESSING...";
    statusText.textContent = "SEARCHING";

    resultBox.innerHTML = `
        <div class="empty">
            <h3>PROCESSING VIDEO</h3>
            <p>Sedang mengambil informasi video...</p>
        </div>
    `;

    try {
        const response = await fetch("/api/download", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Gagal mengambil video.");
        }

        showResult(data.video);

        statusText.textContent = "SUCCESS";

    } catch (error) {
        resultBox.innerHTML = `
            <div class="empty">
                <h3>DOWNLOAD FAILED</h3>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;

        statusText.textContent = "ERROR";

    } finally {
        button.disabled = false;
        button.textContent = "DOWNLOAD";
    }
});

function showResult(video) {
    const downloads = (video.downloads || []).filter(item => {
        try {
            return item.type === "video" &&
                new URL(item.url).protocol === "https:";
        } catch {
            return false;
        }
    });

    if (!downloads.length) {
        throw new Error("Link video tidak tersedia.");
    }

    resultBox.innerHTML = "";

    const card = document.createElement("div");
    card.className = "video-result";

    if (video.thumbnail) {
        try {
            const imageUrl = new URL(video.thumbnail);

            if (imageUrl.protocol === "https:") {
                const img = document.createElement("img");
                img.src = imageUrl.href;
                img.alt = "Video thumbnail";
                img.style.width = "100%";
                img.style.maxHeight = "350px";
                img.style.objectFit = "contain";
                img.style.borderRadius = "6px";
                card.appendChild(img);
            }
        } catch {}
    }

    const info = document.createElement("div");
    info.className = "video-info";

    const title = document.createElement("h3");
    title.textContent = video.title || "TikTok Video";

    const description = document.createElement("p");
    description.textContent = `${downloads.length} download option(s) available`;

    info.append(title, description);
    card.appendChild(info);

    downloads.forEach((item, index) => {
        const link = document.createElement("a");

        link.className = "download-link";
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent =
            `DOWNLOAD ${item.quality || "VIDEO"} ${index + 1}`;

        card.appendChild(link);
    });

    resultBox.appendChild(card);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}
