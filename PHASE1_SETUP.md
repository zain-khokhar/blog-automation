# Phase 1 Setup Instructions - Advanced Blog Editor

## What's Been Implemented

### ✅ Core Editor Features
- **Advanced TipTap Editor** with 15+ extensions:
  - Text formatting (bold, italic, underline, strikethrough, code)
  - Headings (H1-H6)
  - Text alignment (left, center, right, justify)
  - Colors (text color & highlight)
  - Subscript & superscript
  - Lists (ordered & unordered)
  - Blockquotes
  - Links
  - Images
  - YouTube video embeds
  - Tables
  - Code blocks with syntax highlighting

### ✅ Media Handling
- Drag-and-drop file upload
- Image compression (automatic for files >1MB)
- Alt text editor with AI generation
- Caption support
- URL insertion option

### ✅ SEO Panel
- Real-time SEO scoring (0-100)
- Meta title editor with character count
- Meta description editor
- Focus keyword tracking with density calculation
- Readability analysis (Flesch Reading Ease)
- URL slug customization
- Automated SEO recommendations
- Content statistics (word count, character count)

### ✅ Auto-save Feature
- Automatic saving every 3 seconds of inactivity
- Version history tracking
- MongoDB integration for persistence

### ✅ MongoDB Integration
- BlogPost model (content, metadata, SEO scores)
- Version model (revision history)
- Media model (uploaded files tracking)

### ✅ AI-Powered Features (Gemini)
- Alt text generation for images
- Content improvement
- Summarization
- Tone adjustment
- Grammar checking
- Meta description generation
- Auto-categorization

## Setup Instructions

### Step 1: Install Dependencies (Already Done)
All required packages have been installed.

### Step 2: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Account** (if you don't have one)
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free

2. **Create a Cluster**
   - Click "Create" and choose free tier (M0)
   - Select your preferred cloud provider and region
   - Wait for cluster to be created (2-3 minutes)

3. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Select "Node.js" and version "4.1 or later"
   - Copy the connection string
   - It looks like: `mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority`

4. **Create Database User**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose username and password (save these!)
   - Grant "Read and write to any database" permission

5. **Whitelist IP Address**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

### Step 3: Configure Environment Variables

1. Create `.env.local` file in the project root:
   ```bash
   echo MONGODB_URI=your_connection_string_here > .env.local
   ```

2. Replace `your_connection_string_here` with your actual MongoDB Atlas URI
   - Replace `<username>` with your database username
   - Replace `<password>` with your database password
   - Add database name after `.net/` (e.g., `blogautomation`)
   
   Example:
   ```
   MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/blogautomation?retryWrites=true&w=majority
   ```

### Step 4: Create Uploads Directory

The media upload feature needs an uploads directory:

```bash
mkdir -p public/uploads/media
```

### Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use the Advanced Editor

### Basic Workflow:

1. **Research Topics**
   - Enter a niche (e.g., "AI Content Marketing")
   - Click "Find Topics"
   - AI will suggest 5 trending topics

2. **Generate Blog**
   - Select a topic from the suggestions
   - Configure word count and tone
   - Click "Generate Blog Post"
   - Wait for AI to create content

3. **Switch to Advanced Editor**
   - Click "Use Advanced Editor" button in top-right
   - You'll see the full-featured editor with toolbar and SEO panel

4. **Edit Content**
   - Use toolbar to format text (bold, italic, colors, etc.)
   - Add images via Upload button
   - Embed YouTube videos
   - Insert tables and code blocks
   - Content auto-saves every 3 seconds

5. **Optimize for SEO**
   - Click "SEO Panel" to show SEO sidebar
   - Fill in meta title (50-60 chars)
   - Add meta description (150-160 chars)
   - Set focus keyword
   - Watch real-time SEO score update
   - Follow automated recommendations

6. **Media Upload**
   - Click image icon in toolbar
   - Drag and drop image or click to browse
   - Add alt text (or use AI generation)
   - Add caption
   - Click "Insert into Editor"

## Testing the Features

### Test Auto-save:
1. Generate a blog post
2. Switch to advanced editor
3. Make some edits
4. Wait 3 seconds
5. Check the save indicator (top-left) - should show "Saved X seconds ago"
6. Refresh the page - content should persist (when MongoDB is connected)

### Test SEO Scoring:
1. In advanced editor, click "SEO Panel"
2. Add meta title, description, and focus keyword
3. Watch SEO score update in real-time
4. See recommendations change based on content

### Test Media Upload:
1. Click image icon in toolbar
2. Upload an image
3. Click "AI Generate" for alt text
4. Insert into editor
5. Image should appear in content

### Test Formatting:
- Try all toolbar buttons (bold, italic, headings, etc.)
- Add a table (Table icon)
- Insert a code block
- Change text colors and highlights
- Align text different ways

## Troubleshooting

### "Please define the MONGODB_URI environment variable"
- Make sure `.env.local` file exists in project root
- Verify the MongoDB connection string is correct
- Restart the dev server (`npm run dev`)

### Images not uploading:
- Check that `public/uploads/media` directory exists
- Verify file size is under 10MB
- Check browser console for errors

### Editor not loading:
- Clear browser cache
- Check browser console for errors
- Verify all npm packages installed correctly

### AI features not working:
- Ensure Gemini browser session is logged in
- Check `/api/ai-assist` endpoint in Network tab
- Verify `src/lib/gemini.js` is working

## Next Steps (Future Phases)

Phase 1 is now complete! Future phases will add:
- **Phase 2**: More text formatting (font size, font family), enhanced tables
- **Phase 3**: Interactive elements (CTAs, accordions, tabs)
- **Phase 4**: Advanced features (collaboration, version comparison, publishing)

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ai-assist/route.js      # AI-powered features
│   │   ├── blog-post/save/route.js # Save posts & versions
│   │   ├── media/upload/route.js   # File upload handling
│   │   ├── generate-blog/route.js  # Original blog generation
│   │   └── research-topics/route.js # Topic research
│   └── page.js                     # Main dashboard (updated)
├── components/
│   ├── BlogEditor.js               # Main advanced editor
│   └── editor/
│       ├── EditorToolbar.js        # Toolbar with all controls
│       ├── MediaUploader.js        # Media upload modal
│       └── SEOPanel.js             # SEO analysis sidebar
├── lib/
│   ├── gemini.js                   # Gemini AI automation
│   └── mongodb.js                  # MongoDB connection
├── models/
│   ├── BlogPost.js                 # Blog post schema
│   ├── Version.js                  # Version history schema
│   └── Media.js                    # Media file schema
└── utils/
    └── seo.js                      # SEO calculation functions
```

## Support

If you encounter issues:
1. Check MongoDB Atlas connection
2. Verify all environment variables
3. Check browser console for errors
4. Review Network tab for API errors
5. Ensure all dependencies are installed

Happy blogging! 🚀
