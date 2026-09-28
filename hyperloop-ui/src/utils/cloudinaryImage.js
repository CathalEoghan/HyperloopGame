// Builds a size-limited Cloudinary variant from a full-resolution upload URL,
// by inserting a width/crop transform ahead of whatever transform (or version
// segment) is already in the path. The originals hosted on Cloudinary are
// multi-megapixel source photos (3000px+), so requesting them at full size
// for a ~400px-wide UI element wastes bandwidth and is slow to load. This
// asks Cloudinary's CDN for an already-downsized, auto-compressed copy
// instead, which loads fast without looking as soft as a tiny local thumbnail.
//
// Falls back to the original URL untouched if it isn't a Cloudinary
// "/upload/" URL, so it's always safe to call.
export function cloudinaryResize(url, width) {
    if (!url || !url.includes('/upload/')) return url
    // Almost every entry already carries an "f_auto,q_auto/" transform segment —
    // fold the width into that one instead of chaining a second transform step.
    if (url.includes('f_auto,q_auto/')) {
        return url.replace('f_auto,q_auto/', `w_${width},c_limit,f_auto,q_auto/`)
    }
    return url.replace('/upload/', `/upload/w_${width},c_limit,f_auto,q_auto/`)
}