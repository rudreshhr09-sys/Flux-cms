import { defineType, defineField } from 'sanity';

export default defineType({
    name: 'galleryItem',
    title: 'Gallery Item',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'category',
            title: 'Category',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'image',
            title: 'Image',
            type: 'image',
            options: { hotspot: true },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'alt',
            title: 'Alt Text',
            type: 'string',
            description: 'Accessible description (e.g. "Meridian — Architectural Photography")',
        }),
        defineField({
            name: 'size',
            title: 'Grid Size',
            type: 'string',
            options: {
                list: [
                    { title: 'Default', value: 'default' },
                    { title: 'Large', value: 'large' },
                    { title: 'Tall', value: 'tall' },
                    { title: 'Wide', value: 'wide' },
                ],
            },
            initialValue: 'default',
        }),
        defineField({
            name: 'order',
            title: 'Display Order',
            type: 'number',
            initialValue: 0,
        }),
    ],
    orderings: [
        {
            title: 'Display Order',
            name: 'orderAsc',
            by: [{ field: 'order', direction: 'asc' }],
        },
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'category',
            media: 'image',
        },
    },
});
