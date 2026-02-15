# Push to GitHub from Cursor

Use this whenever you want your live app (Vercel) to get the latest changes.

---

## Steps (do this in Cursor)

### 1. Save all files
Press **Ctrl+K S** (or File → Save All) so nothing is left unsaved.

### 2. Open Source Control
- Click the **branch icon** in the left sidebar (or **Ctrl+Shift+G**).
- You’ll see a list of **changed files**.

### 3. Stage everything
- In the Source Control panel, next to "Changes", click the **+** button to stage all files.
- Or stage one by one by hovering a file and clicking **+**.

### 4. Commit
- In the message box at the top, type a short message, e.g. **Update live app**.
- Click the **✓ Commit** button (or press **Ctrl+Enter**).

### 5. Push to GitHub
- Click the **⋯** menu at the top of the Source Control panel.
- Click **Push** (or **Push to...** then choose **origin**).
- If it asks to “Publish Branch” or “Sync”, confirm.

Done. Vercel will pick up the push and start a new deployment.

---

## If you don’t see Source Control
- Make sure the folder you opened in Cursor is your **project root** (the one with `package.json`).
- The folder must be a **Git repository** (it usually is if you cloned from GitHub).

## If Push asks for login
- GitHub may ask you to sign in (browser or token).
- Follow the prompt; after that, Push will work from Cursor.
