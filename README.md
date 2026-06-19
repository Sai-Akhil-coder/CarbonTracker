# EcoQuest - Gamified Carbon Footprint Tracker

EcoQuest is an interactive, single-page web application designed to make carbon footprint tracking engaging and fun. By incorporating gamification elements like XP, levels, badges, and leaderboards, it motivates users to build sustainable habits and reduce their environmental impact.

---

## ✨ Features

- **Dynamic Footprint Calculation:** Interactive sliders for lifestyle habits (transport, flights, diet, shopping, energy) that instantly calculate your annual CO₂ emissions.
  - **Vehicle Type Selection:** Commuting impacts dynamically scale based on whether you select a 4-wheeler, 2-wheeler, EV, or public transport.
  - **Global Comparison:** Compare your personal footprint to the national averages of the World, India, USA, or the UK.
- **Gamification Engine:**
  - **XP & Levels:** Earn Experience Points (XP) for completing actions and level up from a `Seedling` to an `Earth Legend`.
  - **Badges:** Unlock over 20 unique badges for achieving milestones (e.g., 7-day streaks, completing 50 actions, maintaining a low footprint).
  - **Streaks:** A login streak counter to encourage daily engagement.
- **Action & Challenge System:**
  - A list of weekly eco-friendly actions to complete.
  - Weekly and Monthly global challenges for bonus rewards.
  - **AI-Powered Tasks:** A "Generate New Task" button that intelligently suggests an action based on your highest emission category.
- **Action Verification:**
  - **GPS:** Verify location-based tasks like walking or cycling.
  - **Photo Upload:** Submit photo proof for tangible actions.
  - **AI Receipt Scanning:** Uses the Anthropic (Claude) API to verify eco-friendly purchases from a receipt/bill image.
  - **Standalone AI Carbon Scanner:** Upload any grocery or shopping receipt to get an instant AI estimation of its carbon footprint.
- **Social & Motivational:**
  - **Leaderboard:** Compete with other users for the top rank based on weekly XP.
  - **Animated Mascot:** A friendly fox mascot provides motivational tips and celebrates your achievements.
- **User Authentication:**
  - Secure sign-in and sign-up system (data stored in `localStorage`).
  - "Continue with Google" option using Google's official Identity Services SDK.
  - Profile section to edit user name, email, and view a visual bar chart of your footprint history over time.
- **Modern UI/UX:**
  - Clean, minimalistic responsive design with pill-shaped tabs and soft UI elements that works beautifully on desktop and mobile.
  - Automatic light and dark mode support based on system preference.

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML, CSS, and JavaScript.
- **Backend:** Node.js HTTP server.
- **API Proxy:** Integrated server-side endpoint (`/api/chat`) to proxy Anthropic Claude calls.
- **Authentication:** Google Identity Services for Web (OAuth 2.0).

---

## 🚀 Setup and Installation

Because this application uses Google OAuth and fetches local data, it must be run on a local web server. Opening the `carbon-tracker.html` file directly from your filesystem (`file:///...`) will not work.

### 1. Run on the Local Node Server

The application includes a built-in Node.js server that serves the UI files and acts as a secure API proxy.

1. Ensure you have Node.js installed.
2. Open a terminal in the project directory.
3. Start the server by running:
   ```bash
   node server.js
   ```
4. Open your browser and navigate to `http://127.0.0.1:3000`.

### 2. Configure Google Authentication

To enable the "Continue with Google" button, you need to create your own Google Cloud OAuth 2.0 Client ID.

1. Go to the Google Cloud Console.
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services > Credentials**.
4. Click **+ CREATE CREDENTIALS** and select **OAuth client ID**.
5. Set the **Application type** to **Web application**.
6. Under **Authorized JavaScript origins**, click **ADD URI** and enter your local server's origin (`http://127.0.0.1:3000`).
7. Click **CREATE** and copy the generated **Client ID**.
8. Open `carbon-tracker.html` and find the following line in the `<script>` tag:
   ```javascript
   const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
   ```
9. Replace the placeholder with your actual Client ID.

### 3. Configure Anthropic AI

The AI Chat Coach uses Anthropic's Claude API.
1. Get an API key from the Anthropic Console.
2. Provide your API key in the configuration modal inside the **AI Coach** tab.
3. The API key is stored in volatile page memory (session state) and is passed via custom headers to the local backend proxy at `/api/chat`. The proxy forwards it securely to Anthropic, avoiding CORS issues and direct client-side network exposure.
4. Alternatively, you can set the `ANTHROPIC_API_KEY` environment variable in your terminal before launching the server, and the proxy will automatically use it without prompting the user.

---

## 🔮 Future Improvements

This project is currently a local prototype. The next major steps would be to:

- **Integrate a Backend Database:** Replace `localStorage` with a real database (like Firebase/Firestore or Supabase) to allow for persistent user data across devices.
- **Real Leaderboards:** Implement a server-side database solution to calculate and display global rankings.
- **Code Refactoring:** Split the single HTML file into separate `index.html`, `styles.css`, and `script.js` files for better maintainability.

---
