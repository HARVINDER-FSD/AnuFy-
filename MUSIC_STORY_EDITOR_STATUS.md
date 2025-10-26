# Music Story Editor - Implementation Status

## Current Status

### ✅ Already Implemented (Existing Features)
The story creator (`app/stories/create/page.tsx`) already has:

1. **Music Integration**
   - Music search via iTunes API
   - Music preview playback
   - Music sticker with multiple styles (default, compact, album, wave)
   - Audio playback on story

2. **Media Support**
   - Photo and video selection
   - Video playback controls
   - Media preview

3. **Overlays & Styling**
   - Text stickers with touch gestures
   - Multiple sticker types (countdown, poll, question, slider, location, mention, hashtag, link)
   - Drag, rotate, scale with touch
   - Color extraction from media

4. **Touch Gestures**
   - Drag elements
   - Pinch-to-zoom
   - Rotate gestures
   - Delete by dragging to trash

### 🔨 New Requirements to Implement

Based on your spec, here's what needs to be added:

#### 1. Media Trimming
- **Video trimming**: Select start/end frames
- **Audio trimming**: Select exact segment of song
- **Photo duration**: Match to audio clip length

#### 2. Advanced Playback & Preview
- Sync photo/video + audio together
- Auto-stop at clip end
- Overlay display during preview
- Pause/play for review

#### 3. Enhanced Music Features
- Trim audio by selecting start/end times
- Audio clip synced with media playback
- Lyrics overlay option
- Album art overlay option

#### 4. Metadata Management
- Track media type, source
- Audio clip start/end
- Video start/end
- Overlay positions and styles

#### 5. Edge Cases
- Video shorter than audio → trim audio
- Audio shorter than video → loop or fade
- Photo → display for audio duration

## Implementation Plan

### Component: `MusicStoryEditor`
Created at: `components/stories/music-story-editor.tsx`

**Features:**
- ✅ Media selection (photo/video)
- ✅ Music library with sample tracks
- ✅ Playback controls
- ✅ Audio trimming with sliders
- ✅ Video trimming with sliders
- ✅ Album art overlay
- ✅ Music info display
- ✅ Metadata export

**Still Needed:**
- [ ] Integrate with existing story creator
- [ ] Add lyrics overlay
- [ ] Add waveform visualization
- [ ] Handle edge cases (audio/video length mismatch)
- [ ] Add real music API integration
- [ ] Add audio fade in/out
- [ ] Add loop option for short audio

### Integration Points

1. **Story Creator** (`app/stories/create/page.tsx`)
   - Add "Edit Music" button when music is selected
   - Open MusicStoryEditor modal
   - Pass media file and type
   - Receive trimmed metadata
   - Apply to story

2. **Music API**
   - Currently uses iTunes API
   - Need to add trimming support
   - Consider Spotify/SoundCloud integration

3. **Upload Flow**
   - Include audio trim data in story metadata
   - Server processes trimmed audio
   - Store trim points in database

## Next Steps

1. **Integrate MusicStoryEditor into story creator**
2. **Add trim data to story upload**
3. **Test edge cases**
4. **Add lyrics API integration**
5. **Add waveform visualization**

## Usage

```typescript
import { MusicStoryEditor } from '@/components/stories/music-story-editor'

// In story creator
const [showMusicEditor, setShowMusicEditor] = useState(false)
const [mediaFile, setMediaFile] = useState<File | null>(null)

{showMusicEditor && mediaFile && (
  <MusicStoryEditor
    mediaFile={mediaFile}
    mediaType={mediaType}
    onSave={(metadata) => {
      // Apply metadata to story
      console.log('Story metadata:', metadata)
      setShowMusicEditor(false)
    }}
    onCancel={() => setShowMusicEditor(false)}
  />
)}
```

## Testing Checklist

- [ ] Photo + music (music duration > 15s)
- [ ] Photo + music (music duration < 15s)
- [ ] Video + music (video longer than music)
- [ ] Video + music (music longer than video)
- [ ] Trim audio start/end
- [ ] Trim video start/end
- [ ] Preview playback synced
- [ ] Album art displays
- [ ] Music info displays
- [ ] Save metadata correctly

## Notes

The basic music story editor component is created but needs integration with the existing story creator. The existing story creator already has music functionality, so we need to enhance it with trimming capabilities rather than replace it.
