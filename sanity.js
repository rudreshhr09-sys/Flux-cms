// ============================================
// FLUX — Sanity CMS Client
// Fetches gallery & site data from Sanity API
// ============================================

const SANITY_PROJECT_ID = 'tmu8b2ui';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';
const SANITY_CDN = true; // Use CDN for faster reads

// Base URL for Sanity API queries
const SANITY_API_URL = `https://${SANITY_PROJECT_ID}.${SANITY_CDN ? 'apicdn' : 'api'}.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`;

// Image URL builder
function sanityImageUrl(ref, width) {
    if (!ref || !ref.asset || !ref.asset._ref) return '';
    // Parse asset reference: image-<id>-<dimensions>-<format>
    const refParts = ref.asset._ref
        .replace('image-', '')
        .split('-');
    const id = refParts.slice(0, -2).join('-');
    const dimensions = refParts[refParts.length - 2];
    const format = refParts[refParts.length - 1];

    let url = `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${id}-${dimensions}.${format}`;
    if (width) {
        url += `?w=${width}&fit=max&auto=format`;
    } else {
        url += `?auto=format`;
    }
    return url;
}

// Fetch gallery items ordered by `order` field
async function fetchGalleryItems() {
    const query = encodeURIComponent(
        `*[_type == "galleryItem"] | order(order asc) {
            _id,
            title,
            category,
            image,
            alt,
            size,
            order
        }`
    );

    try {
        const response = await fetch(`${SANITY_API_URL}?query=${query}`);
        const data = await response.json();
        return data.result || [];
    } catch (err) {
        console.warn('Sanity fetch failed, falling back to static content:', err);
        return null; // null signals fallback to static HTML
    }
}

// Fetch site configuration (singleton)
async function fetchSiteConfig() {
    const query = encodeURIComponent(
        `*[_type == "siteConfig"][0] {
            heroTitle,
            heroTitleItalic,
            heroSubtitle,
            aboutTitle,
            aboutText,
            techTags
        }`
    );

    try {
        const response = await fetch(`${SANITY_API_URL}?query=${query}`);
        const data = await response.json();
        return data.result || null;
    } catch (err) {
        console.warn('Sanity config fetch failed:', err);
        return null;
    }
}

// Render gallery items into the DOM
function renderGalleryFromCMS(items) {
    const grid = document.querySelector('.gallery-grid');
    if (!grid || !items || items.length === 0) return false;

    // Clear existing static items
    grid.innerHTML = '';

    items.forEach((item, index) => {
        const sizeClass = item.size && item.size !== 'default' ? `gi-${item.size}` : '';
        const imgUrl = sanityImageUrl(item.image, 800);
        const altText = item.alt || `${item.title} — ${item.category} Photography`;
        const num = String(index + 1).padStart(2, '0');

        const el = document.createElement('div');
        el.className = `gallery-item ${sizeClass}`.trim();
        el.setAttribute('data-cursor', 'view');
        el.innerHTML = `
            <div class="item-image-wrap">
                <img src="${imgUrl}" alt="${altText}" class="gallery-img" data-webgl loading="lazy">
            </div>
            <div class="item-info">
                <span class="item-num">${num}</span>
                <div class="item-text">
                    <h3 class="item-title">${item.title}</h3>
                    <span class="item-cat">${item.category}</span>
                </div>
            </div>
        `;
        grid.appendChild(el);
    });

    return true;
}

// Render site configuration (hero, about sections)
function renderSiteConfig(config) {
    if (!config) return;

    // Hero title
    const heroLines = document.querySelectorAll('.hero-line');
    if (config.heroTitle && heroLines[0]) {
        heroLines[0].textContent = config.heroTitle;
    }
    if (config.heroTitleItalic && heroLines[1]) {
        heroLines[1].innerHTML = `<em>${config.heroTitleItalic}</em>`;
    }

    // Hero subtitle
    const subtitle = document.querySelector('.hero-subtitle');
    if (config.heroSubtitle && subtitle) {
        subtitle.textContent = config.heroSubtitle;
    }

    // Tech tags
    if (config.techTags && config.techTags.length > 0) {
        const techStack = document.querySelector('.tech-stack');
        if (techStack) {
            techStack.innerHTML = config.techTags
                .map(tag => `<span class="tech-tag">${tag}</span>`)
                .join('');
        }
    }
}

// Main initialization — called from main.js
async function initSanityContent() {
    const [galleryItems, siteConfig] = await Promise.all([
        fetchGalleryItems(),
        fetchSiteConfig(),
    ]);

    const galleryRendered = galleryItems && galleryItems.length > 0
        ? renderGalleryFromCMS(galleryItems)
        : false;

    if (siteConfig) {
        renderSiteConfig(siteConfig);
    }

    return { galleryRendered, galleryItems, siteConfig };
}
