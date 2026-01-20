# Mohamed Gamal - Digital Marketing Portfolio

A high-performance, interactive personal portfolio website showcasing digital marketing achievements, campaigns, and case studies. Designed with a focus on visual storytelling, motion effects, and user experience.

🔗 **Live Demo:** [View Portfolio](https://emarkwsl.github.io/CV/) *(Replace with actual URL if different)*

## ✨ Features

*   **Interactive UI:** Smooth scroll animations, reveal effects, and parallax backgrounds using vanilla JavaScript.
*   **Responsive Design:** Fully adaptive layout for Desktop, Tablet, and Mobile devices.
*   **Theming System:** Built-in CSS variable structure supporting Light/Dark modes (extensible).
*   **Media Galleries:**
    *   **Portfolio Grid:** Filterable image gallery for campaigns.
    *   **Video Showreel:** Custom HTML5 video player integration with lightbox support.
*   **Clean Architecture:** Semantic HTML5 and modular CSS organization.

## 🛠️ Tech Stack

*   **Frontend:** HTML5, CSS3, JavaScript (ES6+)
*   **Styling:** Custom CSS with CSS Variables (No external frameworks like Bootstrap/Tailwind used, ensuring lightweight performance).
*   **Animations:** `IntersectionObserver` API for scroll reveals, CSS Keyframes.
*   **Fonts:** 'Outfit' from Google Fonts.
*   **Deployment:** GitHub Actions (Automated deployment to GitHub Pages).

## 📂 Project Structure

```
/
├── index.html              # Main Landing Page (CV & Resume)
├── assets/
│   ├── css/                # Stylesheets (Theme, Home, Portfolio)
│   ├── js/                 # Logic scripts
│   └── images/             # Static assets
├── portfolio/
│   ├── index.html          # Detailed Portfolio Gallery
│   └── new/                # Campaign Images
├── clients/                # Client-specific landing pages
└── .github/workflows/      # CI/CD Pipeline for GitHub Pages
```

## 🚀 How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/CV.git
    ```
2.  **Navigate to the project folder:**
    ```bash
    cd CV
    ```
3.  **Open `index.html`** in your browser directly, or use a live server extension (recommended for correct asset loading):
    *   If using VS Code with "Live Server": Right-click `index.html` -> "Open with Live Server".
    *   Or using Python: `python3 -m http.server 8000`

## 📈 Future Improvements (Roadmap)

To improve maintainability and scalability, the following updates are recommended:

*   **Image Optimization:** Convert `.JPG` assets to WebP for faster load times.
*   **Component System:** Refactor repeated elements (Navbar, Footer, Modals) using a Static Site Generator (e.g., Jekyll, Hugo) or simple JS components to avoid code duplication.
*   **Minification:** Add a build step to minify CSS and JS files for production.

## 📄 License

© 2026 Mohamed Gamal. All Rights Reserved.