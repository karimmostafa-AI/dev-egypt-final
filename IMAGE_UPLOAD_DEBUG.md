# Image Upload Debug Guide

## Changes Made

### 1. **Immediate Blob Preview (ColorVariationImageManager.tsx)**
- Changed approach: Create blob URL **synchronously first**, then upload in background
- Flow:
  1. File selected → Create `blob:` URL immediately
  2. Call `onColorImageUpdate()` with blob URL (instant UI update)
  3. Start async upload to server in background
  4. If server succeeds: Replace blob URL with server URL
  5. If server fails: Keep blob URL as preview

### 2. **Comprehensive Logging**
Added console logs at every step to diagnose the issue:

- `[ColorVariationImageManager] Created blob URL for {type}` - Blob created
- `[ColorVariationImageManager] Server upload success` - Server returned URL
- `[ColorVariationImageManager] Server upload failed` - Server rejected upload
- `[ColorVariationImageManager] Network error` - Network/timeout error
- `[Page] handleColorImageUpdate called` - Parent received update
- `[Page] Previous colors` - State before update
- `[Page] Updated color` - Modified color object
- `[Page] New colors array` - State after update
- `[ImageUploadSection] Rendering {color} {type}` - Component re-render with new URL

## Testing Steps

1. **Open browser DevTools** (F12) → Console tab
2. Go to `/admin/products/new`
3. Navigate to **Step 3: Variations**
4. Select at least one color
5. Click "Upload from Device" for a color's front view
6. Select an image file
7. **Watch the console logs**

### Expected Console Output
```
[ColorVariationImageManager] Created blob URL for mainImageUrl: blob:http://localhost:3000/...
[Page] handleColorImageUpdate called: { colorId: "color_123", updates: { mainImageUrl: "blob:..." } }
[Page] Previous colors: [...]
[Page] Updated color: { id: "color_123", name: "Red", mainImageUrl: "blob:..." }
[Page] New colors array: [...]
[ImageUploadSection] Rendering Red main: { imageUrl: "blob:...", isUploading: true }
```

## Troubleshooting

### Issue: No console logs at all
**Diagnosis**: File input `onChange` not firing
**Fix**: Check if input element is properly rendered and clickable

### Issue: Blob created but no `[Page]` logs
**Diagnosis**: `onColorImageUpdate` callback not connected
**Fix**: Verify prop is passed correctly in page.tsx line 963

### Issue: `[Page]` logs appear but no `[ImageUploadSection]` re-render
**Diagnosis**: React not detecting state change
**Possible causes**:
- `key` prop forcing stale render
- Reference equality issue in colors array
**Fix**: Already addressed with `[...newColors]` spreading

### Issue: `[ImageUploadSection]` shows `imageUrl: ""` even after update
**Diagnosis**: Component reading stale color prop
**Fix**: Check if `colors` prop is being passed fresh from parent

## Quick Fix If Still Not Working

If preview still doesn't appear, try removing the `key` prop temporarily:

```tsx
// In page.tsx around line 963
<ColorVariationImageManager
  // key={colorManagerKey}  // <- Comment this out
  colors={selectedColors}
  onColorImageUpdate={handleColorImageUpdate}
/>
```

The `key` prop forces full remount which might cause timing issues.

## File Structure
- **Source**: `src/components/admin/ColorVariationImageManager.tsx`
- **Parent**: `src/app/admin/products/new/page.tsx`
- **Upload API**: `src/app/api/admin/upload-image/route.ts`
- **Image Service**: `src/lib/image-service.ts`

## Next Steps
1. Test with logs enabled
2. Share console output if issue persists
3. We can add even more granular debugging if needed
