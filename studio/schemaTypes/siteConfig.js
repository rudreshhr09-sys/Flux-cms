import { defineType, defineField } from 'sanity';

export default defineType({
    name: 'siteConfig',
    title: 'Site Configuration',
    type: 'document',
    fields: [
        defineField({
            name: 'heroTitle',
            title: 'Hero Title (Line 1)',
            type: 'string',
            initialValue: 'Where Pixels',
        }),
        defineField({
            name: 'heroTitleItalic',
            title: 'Hero Title (Line 2, Italic)',
            type: 'string',
            initialValue: 'Dissolve',
        }),
        defineField({
            name: 'heroSubtitle',
            title: 'Hero Subtitle',
            type: 'text',
            rows: 2,
            initialValue:
                'A curated collection of visual experiments — refracted through WebGL shaders and liquid distortion.',
        }),
        defineField({
            name: 'aboutTitle',
            title: 'About Section Title',
            type: 'string',
            initialValue: 'Distortion as Expression.',
        }),
        defineField({
            name: 'aboutText',
            title: 'About Text',
            type: 'array',
            of: [{ type: 'block' }],
        }),
        defineField({
            name: 'techTags',
            title: 'Tech Stack Tags',
            type: 'array',
            of: [{ type: 'string' }],
            initialValue: ['Three.js', 'GLSL', 'GSAP', 'Lenis', 'WebGL'],
        }),
    ],
    preview: {
        prepare() {
            return { title: 'Site Configuration' };
        },
    },
});
