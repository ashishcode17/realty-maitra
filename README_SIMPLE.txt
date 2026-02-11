================================================================================
  🎯 SUPER SIMPLE GUIDE - For Complete Beginners
================================================================================

You have 2 files to run:

================================================================================
  FILE 1: START.bat
================================================================================

Just DOUBLE-CLICK this file to start the website!

It will:
  ✅ Install everything needed
  ✅ Start the server
  ✅ Open http://localhost:3000

If it says "site can't be reached":
  → The server might not be running yet (wait 30 seconds)
  → Or you need to set up database first (see FILE 2)

================================================================================
  FILE 2: SETUP_DATABASE.bat
================================================================================

Run this FIRST if you haven't set up database yet!

It will:
  ✅ Create database tables
  ✅ Add sample users and data

BUT FIRST: You need a database connection string!

How to get it:
  1. Go to: https://neon.tech
  2. Sign up (free)
  3. Create a new database
  4. Copy the connection string
  5. Open .env file in the project folder
  6. Add this line: DATABASE_URL="paste-your-connection-string-here"
  7. Save the file
  8. Then run SETUP_DATABASE.bat

================================================================================
  🚀 QUICK START (Easiest Way)
================================================================================

Step 1: Get database (if you don't have one)
  → Go to https://neon.tech
  → Sign up and create database
  → Copy connection string

Step 2: Add to .env file
  → Open .env file
  → Add: DATABASE_URL="your-connection-string"
  → Save

Step 3: Run SETUP_DATABASE.bat
  → Double-click it
  → Wait for it to finish

Step 4: Run START.bat
  → Double-click it
  → Wait 30 seconds
  → Open http://localhost:3000 in browser

================================================================================
  ❓ TROUBLESHOOTING
================================================================================

Problem: "Site can't be reached"
  → Wait 30 seconds after starting
  → Check if server is running (you'll see "Ready" message)
  → Make sure you're going to http://localhost:3000

Problem: Database errors
  → Make sure DATABASE_URL is in .env file
  → Make sure connection string is correct
  → Try getting a new database from neon.tech

Problem: "npm is not recognized"
  → You need to install Node.js first
  → Go to: https://nodejs.org
  → Download and install
  → Restart computer
  → Try again

================================================================================
  📞 STILL STUCK?
================================================================================

Tell me:
  1. What error message you see (copy it exactly)
  2. Which file you tried to run
  3. What happened when you ran it

I'll fix it for you!

================================================================================
