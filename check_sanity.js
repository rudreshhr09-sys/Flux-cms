// Quick check of Sanity CMS content
const PROJECT_ID = 'tmu8b2ui';
const DATASET = 'production';
const API_VERSION = '2024-01-01';

async function check() {
    const query = encodeURIComponent('*[_type == "galleryItem"]{_id, title, category, order}');
    const url = `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${query}`;

    const res = await fetch(url);
    const data = await res.json();

    console.log('\n=== GALLERY ITEMS IN SANITY ===');
    if (data.result && data.result.length > 0) {
        data.result.forEach(item => {
            console.log(`  - [${item._id}] ${item.title || '(no title)'} | ${item.category || '(no category)'} | order: ${item.order}`);
        });
        console.log(`\nTotal: ${data.result.length} items`);
    } else {
        console.log('  No gallery items found in CMS.');
    }

    // Also check site config
    const configQuery = encodeURIComponent('*[_type == "siteConfig"][0]');
    const configUrl = `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${configQuery}`;
    const configRes = await fetch(configUrl);
    const configData = await configRes.json();

    console.log('\n=== SITE CONFIG ===');
    console.log(configData.result ? 'Found site config' : 'No site config');
}

check().catch(console.error);
