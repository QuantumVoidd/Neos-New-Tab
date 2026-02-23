/**
 * ZION NETWORK FEED CONTROLLER 
 */

// Local state
const matrixTextIntervals = new Map();
const matrixTextIterations = new Map();

// Feed Configuration
const FEED_MODES = [
    { id: 'reddit', label: "ZION NETWORK FEED", color: "var(--theme-color)" },
    { id: 'news', label: "GLOBAL NEWS WIRE", color: "#00f2ff" }, // Cyan
    { id: 'security', label: "THREAT INTELLIGENCE", color: "#ff0055" }, // Red/Pink
    { id: 'space', label: "NASA / ENV. MONITOR", color: "#ae00ff" }, // Purple
    { id: 'dev', label: "DEV. UNDERGROUND", color: "#00ff41" }, // Classic Green
    { id: 'finance', label: "MARKET TICKER", color: "#ffd700" }  // Gold
];

let currentModeIndex = 0;

// Default "No-API" Source Lists
const DEFAULT_SOURCES = {
    news: [
        "http://feeds.bbci.co.uk/news/technology/rss.xml",
        "https://www.reutersagency.com/feed/?best-topics=tech&post_type=best",
        "https://www.theverge.com/rss/index.xml"
    ],
    security: [
        "https://isc.sans.edu/rssfeed.xml",
        "http://feeds.feedburner.com/TheHackersNews",
        "https://www.cisa.gov/cybersecurity-advisories/all.xml"
    ],
    space: [
        "https://earthobservatory.nasa.gov/feeds/hazards.rss",
        "https://www.nasa.gov/rss/dyn/lg_image_of_the_day.rss",
        "https://www.space.com/feeds/all"
    ],
    dev: [
        "https://hnrss.org/newest", 
        "http://syndication.thedailywtf.com/TheDailyWtf",
        "http://feeds.arstechnica.com/arstechnica/index/"
    ],
    finance: [
        "https://finance.yahoo.com/news/rssindex",
        "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=&company=&dateb=&owner=include&start=0&count=20&output=atom"
    ]
};

// --- TEXT DECRYPTION EFFECT ---
function decryptRssText(element, targetText, isHovering) {
    const alphabet = (typeof MATRIX_ALPHABET !== 'undefined') ? MATRIX_ALPHABET : "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    if (matrixTextIntervals.has(element)) clearInterval(matrixTextIntervals.get(element));
    
    let iteration = matrixTextIterations.get(element) || 0;
    
    const interval = setInterval(() => {
        element.innerText = targetText.split("").map((letter, index) => {
            if (index < iteration) return targetText[index];
            return alphabet[Math.floor(Math.random() * alphabet.length)];
        }).join("");

        if (isHovering) {
            iteration += 1/3;
            if (iteration >= targetText.length) { 
                iteration = targetText.length; 
                element.innerText = targetText; 
                clearInterval(interval); 
                matrixTextIntervals.delete(element); 
            }
        } else {
            iteration -= 1/2;
            if (iteration <= 0) { 
                iteration = 0; 
                element.innerText = targetText.replace(/./g, () => alphabet[Math.floor(Math.random() * alphabet.length)]); 
                clearInterval(interval); 
                matrixTextIntervals.delete(element); 
            }
        }
        matrixTextIterations.set(element, iteration);
    }, 30);
    
    matrixTextIntervals.set(element, interval);
}

// --- INITIALIZATION & EVENTS ---
document.addEventListener('DOMContentLoaded', () => {
    const prevBtn = document.getElementById('rss-prev-btn');
    const nextBtn = document.getElementById('rss-next-btn');
    
    if (prevBtn && nextBtn) {
        prevBtn.onclick = () => cycleFeed(-1);
        nextBtn.onclick = () => cycleFeed(1);
    }
});

function cycleFeed(direction) {
    currentModeIndex = (currentModeIndex + direction + FEED_MODES.length) % FEED_MODES.length;
    const mode = FEED_MODES[currentModeIndex];
    const header = document.getElementById('rss-header');
    
    if (header) {
        header.textContent = mode.label;
        header.style.color = mode.color;
        header.style.textShadow = `0 0 8px ${mode.color}`;
        decryptRssText(header, mode.label, true);
    }
    
    updateZionFeed();
}

// --- HELPER: PARSE XML RSS WITH MEDIA & FULL TEXT EXTRACTION ---
async function fetchAndParseRSS(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}`);
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        
        let items = Array.from(xml.querySelectorAll("item"));
        if (items.length === 0) items = Array.from(xml.querySelectorAll("entry")); // Atom support

        return items.map(item => {
            let mediaUrl = null;
            let mediaType = 'image';

            const mediaContent = item.getElementsByTagNameNS("*", "content")[0] || 
                                 item.getElementsByTagName("media:content")[0];
            const mediaThumb = item.getElementsByTagNameNS("*", "thumbnail")[0] || 
                               item.getElementsByTagName("media:thumbnail")[0];
            
            if (mediaContent && mediaContent.getAttribute("url")) {
                mediaUrl = mediaContent.getAttribute("url");
                const type = mediaContent.getAttribute("type") || "";
                if (type.includes("video") || mediaUrl.match(/\.(mp4|webm|mov)$/i)) mediaType = 'video';
            } else if (mediaThumb && mediaThumb.getAttribute("url")) {
                mediaUrl = mediaThumb.getAttribute("url");
            }

            if (!mediaUrl) {
                const enclosure = item.querySelector("enclosure");
                if (enclosure && enclosure.getAttribute("url")) {
                    const type = enclosure.getAttribute("type") || "";
                    if (type.startsWith("image") || type.startsWith("video")) {
                        mediaUrl = enclosure.getAttribute("url");
                        if (type.startsWith("video")) mediaType = 'video';
                    }
                }
            }

            const description = item.querySelector("description")?.textContent || 
                                item.querySelector("summary")?.textContent || ""; 
            
            if (!mediaUrl) {
                const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (imgMatch) {
                    mediaUrl = imgMatch[1];
                }
            }

            const contentEncoded = item.getElementsByTagNameNS("*", "encoded")[0] || 
                                   item.getElementsByTagName("content:encoded")[0] || 
                                   item.getElementsByTagName("content")[0] ||
                                   item.getElementsByTagName("body")[0]; 
            
            const fullContent = contentEncoded ? contentEncoded.textContent : null;
            const titleNode = item.querySelector("title");
            const linkNode = item.querySelector("link");
            const dateNode = item.querySelector("pubDate") || item.querySelector("updated");

            let linkHref = "#";
            if (linkNode) {
                linkHref = linkNode.textContent || linkNode.getAttribute("href");
            }

            return {
                title: titleNode?.textContent || "Unknown Signal",
                link: linkHref,
                description: description,
                fullContent: fullContent,
                pubDate: dateNode?.textContent || "",
                source: new URL(url).hostname.replace('www.', ''),
                mediaUrl: mediaUrl,
                mediaType: mediaType
            };
        });
    } catch (e) {
        console.warn(`RSS Uplink Error (${url}):`, e);
        return [];
    }
}

// --- MAIN FEED UPDATER ---
async function updateZionFeed(isSilent = false) {
    const alphabet = (typeof MATRIX_ALPHABET !== 'undefined') ? MATRIX_ALPHABET : "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    
    if (!chrome || !chrome.storage) return;

    const data = await chrome.storage.sync.get(['isRssEnabled', 'rssSubs', 'newsSources', 'spaceSources', 'securitySources', 'devSources', 'financeSources']);
    const container = document.getElementById('zion-rss-container');
    const list = document.getElementById('rss-feed-list');
    const barCont = document.getElementById('rss-loading-bar-container');
    const bar = document.getElementById('rss-loading-bar');
    
    if (!data.isRssEnabled) { 
        if(container) container.classList.add('hidden'); 
        return; 
    }
    if(container) container.classList.remove('hidden');
    
    if (!isSilent && list) {
        list.innerHTML = '<div class="rss-meta">Establishing Uplink...</div>';
        if (barCont && bar) {
            barCont.style.display = 'block';
            bar.style.width = '30%'; 
        }
    }

    const currentMode = FEED_MODES[currentModeIndex].id;

    if (currentMode === 'reddit') {
        try {
            const subs = data.rssSubs || "matrix+cyberpunk";
            const response = await fetch(`https://www.reddit.com/r/${subs}/hot.json?limit=25&raw_json=1`);
            
            if (!isSilent && bar) bar.style.width = '70%'; 
            
            const contentType = response.headers.get("content-type");
            if (!response.ok || !contentType || contentType.indexOf("application/json") === -1) {
                throw new Error("Reddit Uplink Failed");
            }
            
            const json = await response.json();
            renderFeedItems(json.data.children.map(child => child.data), 'reddit', list, bar, isSilent, alphabet);

        } catch (e) { 
            console.error("Zion Feed Error:", e);
            if(list) list.innerHTML = `<div class="rss-meta" style="color:red">UPLINK FAILED: ${e.message}</div>`;
        }
    } 
    else {
        try {
            let sourcesRaw = data[`${currentMode}Sources`]; 
            let sources = [];

            if (sourcesRaw) {
                sources = sourcesRaw.split('+').map(s => s.trim()).filter(s => s);
            } else {
                sources = DEFAULT_SOURCES[currentMode] || [];
            }
            
            if (sources.length === 0) throw new Error("No Frequencies Found");

            const promises = sources.map(url => fetchAndParseRSS(url));
            const results = await Promise.all(promises);
            const allItems = results.flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
            
            if (!isSilent && bar) bar.style.width = '80%';
            
            renderFeedItems(allItems.slice(0, 25), 'news', list, bar, isSilent, alphabet);

        } catch (e) {
            console.error(`${currentMode.toUpperCase()} Feed Error:`, e);
            if(list) list.innerHTML = `<div class="rss-meta" style="color:red">SIGNAL LOST: CHECK URLS</div>`;
        }
    }
}

// --- GENERIC RENDERER ---
function renderFeedItems(items, mode, list, bar, isSilent, alphabet) {
    if (!isSilent && bar) bar.style.width = '100%'; 
    if (list) list.innerHTML = "";

    const activeColor = FEED_MODES[currentModeIndex].color;

    items.forEach(item => {
        const link = document.createElement('a');
        link.className = 'rss-item'; 
        link.href = (mode === 'reddit') ? `https://reddit.com${item.permalink}` : item.link;
        // BORDER STYLES REMOVED - Controlled by CSS now
        
        // --- CLICK HANDLER ---
        link.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.parentElement.tagName !== 'BUTTON') {
                e.preventDefault();
                if (mode === 'reddit' && typeof window.openTerminalModal === "function") {
                    window.openTerminalModal(item.permalink);
                } 
                else if (mode !== 'reddit' && typeof window.openNewsInTerminal === "function") {
                    window.openNewsInTerminal(item);
                } 
                else {
                    window.open(link.href, '_blank');
                }
            }
        };

        // Title
        const title = document.createElement('div');
        title.className = 'rss-title';
        title.style.color = activeColor;
        const originalTitle = item.title;
        title.innerText = originalTitle.replace(/./g, () => alphabet[Math.floor(Math.random() * alphabet.length)]);
        
        // Meta
        const meta = document.createElement('div');
        meta.className = 'rss-meta';
        meta.style.color = activeColor;
        meta.style.opacity = '0.7';
        
        let combinedMeta = "";
        if (mode === 'reddit') {
            combinedMeta = `r/${item.subreddit} • u/${item.author}`;
        } else {
            const timeStr = item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "LIVE";
            combinedMeta = `[${item.source}] • ${timeStr}`;
        }
        meta.innerText = combinedMeta.replace(/./g, () => alphabet[Math.floor(Math.random() * alphabet.length)]);

        link.appendChild(title);
        link.appendChild(meta);

        // --- MEDIA HANDLING ---
        if (mode === 'reddit') {
            if (item.post_hint === 'image' || (item.url && item.url.match(/\.(jpg|jpeg|png|gif)$/))) {
                const wrap = document.createElement('div');
                wrap.className = 'rss-media-wrapper';
                const img = document.createElement('img');
                img.src = item.url;
                img.className = 'rss-media-content';
                
                const imgFsBtn = document.createElement('button');
                imgFsBtn.className = 'video-fullscreen-btn'; 
                imgFsBtn.innerHTML = '⛶';
                imgFsBtn.title = "Maximize Visual";
                imgFsBtn.onclick = (e) => {
                    e.preventDefault(); e.stopPropagation(); 
                    if (img.requestFullscreen) img.requestFullscreen();
                    else if (img.webkitRequestFullscreen) img.webkitRequestFullscreen();
                };
                wrap.appendChild(img);
                wrap.appendChild(imgFsBtn);
                link.appendChild(wrap);
            } 
            else if (item.is_video && item.media && item.media.reddit_video) {
                const wrap = document.createElement('div');
                wrap.className = 'rss-media-wrapper';
                const video = document.createElement('video');
                video.src = item.media.reddit_video.hls_url || item.media.reddit_video.fallback_url;
                video.className = 'rss-media-content';
                video.autoplay = true; video.loop = true; video.muted = true; video.playsInline = true;
                
                const fsBtn = document.createElement('button');
                fsBtn.className = 'video-fullscreen-btn';
                fsBtn.innerHTML = '⛶';
                fsBtn.onclick = (e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (video.requestFullscreen) video.requestFullscreen();
                };
                
                const volBtn = document.createElement('button');
                volBtn.className = 'video-vol-btn';
                volBtn.innerHTML = '🔇';
                volBtn.onclick = (e) => {
                    e.preventDefault(); e.stopPropagation();
                    video.muted = !video.muted;
                    if (!video.muted) video.play().catch(() => {});
                    volBtn.innerHTML = video.muted ? '🔇' : '🔊';
                    volBtn.style.boxShadow = video.muted ? 'none' : `0 0 10px ${activeColor}`;
                };
                wrap.appendChild(video); wrap.appendChild(fsBtn); wrap.appendChild(volBtn);
                link.appendChild(wrap);
            }
        }
        else if (mode !== 'reddit' && item.mediaUrl) {
            const wrap = document.createElement('div');
            wrap.className = 'rss-media-wrapper';
            
            if (item.mediaType === 'video') {
                const video = document.createElement('video');
                video.src = item.mediaUrl;
                video.className = 'rss-media-content';
                video.controls = true; 
                video.preload = "metadata";
                
                const fsBtn = document.createElement('button');
                fsBtn.className = 'video-fullscreen-btn';
                fsBtn.innerHTML = '⛶';
                fsBtn.onclick = (e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (video.requestFullscreen) video.requestFullscreen();
                };
                wrap.appendChild(video);
                wrap.appendChild(fsBtn);
            } else {
                const img = document.createElement('img');
                img.src = item.mediaUrl;
                img.className = 'rss-media-content';
                const imgFsBtn = document.createElement('button');
                imgFsBtn.className = 'video-fullscreen-btn'; 
                imgFsBtn.innerHTML = '⛶';
                imgFsBtn.onclick = (e) => {
                    e.preventDefault(); e.stopPropagation(); 
                    if (img.requestFullscreen) img.requestFullscreen();
                };
                wrap.appendChild(img);
                wrap.appendChild(imgFsBtn);
            }
            link.appendChild(wrap);
        }

        // --- STATS / SUMMARY (RESTORED ICONS AND LOGIC) ---
        if (mode === 'reddit') {
            const statsRow = document.createElement('div');
            statsRow.className = 'rss-stats-row';
            statsRow.style.color = activeColor;
            const format = (n) => (n > 999 ? (n/1000).toFixed(1) + 'k' : Math.floor(n) || 0);

            // 1. Upvote (SVG RESTORED)
            const upDiv = document.createElement('div');
            upDiv.className = 'rss-stat-item upvote-item';
            upDiv.innerHTML = `<span class="rss-stat-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4L3 15H9V20H15V15H21L12 4Z" /></svg></span> ${format(item.ups)}`;
            statsRow.appendChild(upDiv);

            // 2. Downvote (LOGIC RESTORED)
            const ratio = item.upvote_ratio || 1;
            const estimatedDowns = ratio < 1 ? Math.round((item.ups / ratio) - item.ups) : 0;
            if (estimatedDowns > 0) {
                const downDiv = document.createElement('div');
                downDiv.className = 'rss-stat-item downvote-item';
                downDiv.innerHTML = `<span class="rss-stat-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(180deg);"><path d="M12 4L3 15H9V20H15V15H21L12 4Z" /></svg></span> ${format(estimatedDowns)}`;
                statsRow.appendChild(downDiv);
            }

            // 3. Comments
            const commDiv = document.createElement('div');
            commDiv.className = 'rss-stat-item';
            commDiv.innerHTML = `<span class="rss-stat-icon">💬</span> ${format(item.num_comments)}`;
            statsRow.appendChild(commDiv);
            link.appendChild(statsRow);
        } else {
            // News Summary
            if (item.description) {
                const summary = document.createElement('div');
                summary.className = 'rss-meta'; 
                summary.style.marginTop = '5px';
                summary.style.opacity = '0.5';
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = item.description;
                const imgs = tempDiv.querySelectorAll('img');
                imgs.forEach(i => i.remove());
                let text = tempDiv.textContent || tempDiv.innerText || "";
                if(text.length > 120) text = text.substring(0, 120) + "...";
                if (text.trim()) {
                    summary.innerText = text.trim();
                    link.appendChild(summary);
                }
            }
        }

        // Hover Events
        link.onmouseenter = () => {
            decryptRssText(title, originalTitle, true);
            decryptRssText(meta, combinedMeta, true);
            const vid = link.querySelector('video');
            if (vid && mode === 'reddit') vid.play().catch(() => {}); 
        };

        link.onmouseleave = () => {
            decryptRssText(title, originalTitle, false);
            decryptRssText(meta, combinedMeta, false);
            const vid = link.querySelector('video');
            if (vid && mode === 'reddit') vid.pause();
        };

        list.appendChild(link);
    });

    if (!isSilent && document.getElementById('rss-loading-bar-container')) {
        setTimeout(() => {
            document.getElementById('rss-loading-bar-container').style.display = 'none';
            if (bar) bar.style.width = '0%';
        }, 800);
    }
}

// Make globally available
window.updateZionFeed = updateZionFeed;

// --- CLI INTERFACE HOOK ---
// Allows script.js to force a feed switch via index or mode name
window.setFeedMode = (index) => {
    if (index >= 0 && index < FEED_MODES.length) {
        currentModeIndex = index;
        const mode = FEED_MODES[currentModeIndex];
        const header = document.getElementById('rss-header');
        
        if (header) {
            header.textContent = mode.label;
            header.style.color = mode.color;
            header.style.textShadow = `0 0 8px ${mode.color}`;
            if (typeof decryptRssText === 'function') {
                decryptRssText(header, mode.label, true);
            }
        }
        updateZionFeed(); 
    }
};