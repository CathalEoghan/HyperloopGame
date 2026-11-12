// The "Video Message pop-ups" setting. Video Message always sends and pays every farewell and welcome by itself; this only
// decides whether the little "Sending your video message" toast is shown each time. Defaults to shown.
export const VIDEO_MESSAGE_POPUPS_KEY = 'hyperloop_video_message_popups'

export function videoMessagePopupsEnabled() {
    try { return localStorage.getItem(VIDEO_MESSAGE_POPUPS_KEY) !== 'false' } catch { return true }
}
